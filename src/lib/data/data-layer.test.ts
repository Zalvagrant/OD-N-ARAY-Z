/**
 * S7 veri katmanı kapıları.
 *
 * Meclis (yazılımcılar) kuralı: React Query'nin KENDİ önbellek/observer
 * uygulamasını yeniden test etmeyiz — kendi politikamızı, şemamızı, hata
 * eşlememizi ve veri izolasyonumuzu test ederiz. Gerçek bekleme yok.
 */

import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { FRESHNESS_THRESHOLDS_MS, internalEnvelope } from "@/types/data-envelope";
import { mockKpi } from "@/mocks/envelope";
import { httpLoad, parseEnvelope } from "./client";
import { OdinError, classifyError, contractError, httpError, offlineError } from "./errors";
import { makeQueryClient } from "./query";
import { policyFor } from "./policy";
import { alertSchema, executiveKpiSchema } from "./schemas";
import { pollingTransport } from "./transport";

const NOW = () => new Date().toISOString();

/* ADR-0143 §2: zarf DÜZ. */
const kpi = () => ({
  id: "net_profit",
  label: "Net Profit",
  status: "unavailable" as const,
  value: null as number | null,
  unit: "currency" as const,
  currency: "USD",
  reason: "COGS girilmedi.",
  asOf: NOW(),
});

const wrap = <T,>(data: T, over: Record<string, unknown> = {}) => ({
  data,
  meta: { source: "mock", lastUpdated: NOW(), freshness: "live", ...over },
});

/* ------------------------------------------------------------------ 1 */

describe("zarf kapısı — meta olmayan veri REDDEDİLİR", () => {
  it("meta hiç yoksa sözleşme hatası atar", () => {
    expect(() => parseEnvelope({ data: kpi() }, executiveKpiSchema, "kpi", "amazon")).toThrow(
      OdinError
    );
  });

  it("meta eksik alanlıysa (lastUpdated yok) reddeder", () => {
    const raw = { data: kpi(), meta: { source: "mock", freshness: "live" } };
    try {
      parseEnvelope(raw, executiveKpiSchema, "kpi", "amazon");
      expect.unreachable("reddedilmeliydi");
    } catch (e) {
      expect((e as OdinError).kind).toBe("contract");
      /* Ham Zod mesajı kullanıcıya değil, teknik detaya gider. */
      expect((e as OdinError).technical).toContain("meta.lastUpdated");
      expect((e as OdinError).what).not.toMatch(/expected|received/i);
    }
  });

  it("AI kaynaklı veri confidence olmadan geçmez", () => {
    const raw = wrap(kpi(), { source: "ai" });
    expect(() => parseEnvelope(raw, executiveKpiSchema, "kpi", "amazon")).toThrow(OdinError);
  });

  it("GELECEKTEN gelen damga reddedilir — yoksa kayıt sonsuza kadar 'canlı' kalır", () => {
    const future = new Date(Date.now() + 30 * 60_000).toISOString();
    expect(() =>
      parseEnvelope(wrap(kpi(), { lastUpdated: future }), executiveKpiSchema, "kpi", "amazon")
    ).toThrow(OdinError);
  });

  it("beş dakikalık saat kayması tolere edilir", () => {
    const near = new Date(Date.now() + 60_000).toISOString();
    expect(() =>
      parseEnvelope(wrap(kpi(), { lastUpdated: near }), executiveKpiSchema, "kpi", "amazon")
    ).not.toThrow();
  });

  it("geçerli zarf geçer ve tazelik İSTEMCİDE yeniden hesaplanır", () => {
    /* Sunucu "live" damgaladı ama kayıt 3 gün eski: amazon eşiğine göre
       bayattır. Damgaya güvenilseydi ekran "canlı" yazardı. */
    const old = new Date(Date.now() - 3 * 24 * 3600_000).toISOString();
    const env = parseEnvelope(
      wrap(kpi(), { lastUpdated: old, freshness: "live" }),
      executiveKpiSchema,
      "kpi",
      "amazon"
    );
    expect(env.meta.freshness).toBe("stale");
  });
});

/* ------------------------------------------------------------------ 2 */

describe("sözleşme ihlalleri arayüze ULAŞMAZ", () => {
  const bad = (data: unknown, schema: z.ZodType) =>
    expect(() => parseEnvelope(wrap(data), schema, "x", "amazon")).toThrow(OdinError);

  it("para birimi metriği currencyCode'suz geçmez", () => {
    bad({ ...kpi(), currency: undefined }, executiveKpiSchema);
  });

  it("yüzde metriği scale'siz geçmez (0,18 mi %18 mi belirsiz)", () => {
    bad({ ...kpi(), unit: "percent", currency: undefined }, executiveKpiSchema);
  });

  it("status=available iken value null olamaz", () => {
    bad({ ...kpi(), status: "available", value: null }, executiveKpiSchema);
  });

  it("status!=available iken reason zorunludur", () => {
    bad({ ...kpi(), status: "data_required", value: null, reason: undefined }, executiveKpiSchema);
  });

  it('sunum metni sayı alanına giremez ("Data Required")', () => {
    bad({ ...kpi(), status: "available", value: "Data Required" }, executiveKpiSchema);
  });

  it("requiresAction'ı olmayan kayıt Alert değildir", () => {
    bad({ id: "AL-a", severity: "risk", title: "t", module: "amazon",
          evidence: [], createdAt: NOW() }, alertSchema);
  });

  it("severity ODIN sözlüğünden olmak zorunda (ADR-0143 §1)", () => {
    /* "high" bizim uydurduğumuz eski kümeydi; kanonik sözlük
       critical|risk|warning|info. */
    bad({ id: "AL-a", severity: "high", title: "t", module: "amazon",
          requiresAction: true, evidence: [], createdAt: NOW() }, alertSchema);
  });

  it("module ve evidence olmadan Alert geçmez", () => {
    bad({ id: "AL-a", severity: "risk", title: "t", requiresAction: true,
          createdAt: NOW() }, alertSchema);
  });
});

/* ------------------------------------------------------------------ 3 */

describe("retry yalnız GEÇİCİ hatada", () => {
  const retry = makeQueryClient().getDefaultOptions().queries?.retry as (
    n: number,
    e: unknown
  ) => boolean;

  it.each([
    ["ağ", classifyError(new TypeError("fetch failed"), "x"), true],
    ["timeout 408", httpError(408, "x"), true],
    ["kota 429", httpError(429, "x"), true],
    ["sunucu 500", httpError(500, "x"), true],
    ["yetki 401", httpError(401, "x"), false],
    ["yok 404", httpError(404, "x"), false],
    ["sözleşme", contractError("x", "d"), false],
    ["çevrimdışı", offlineError(), false],
  ])("%s → %s", (_label, err, expected) => {
    expect((err as OdinError).retryable).toBe(expected);
    expect(retry(0, err)).toBe(expected);
  });

  it("geçici hatada bile 3 denemeden fazlası yok", () => {
    expect(retry(3, httpError(500, "x"))).toBe(false);
  });

  it("OdinError olmayan bir şey hiç denenmez (sınıflandırılmamış = güvenilmez)", () => {
    expect(retry(0, new Error("çıplak"))).toBe(false);
  });
});

/* ------------------------------------------------------------------ 4 */

describe("önbellek: dedupe ve izolasyon", () => {
  const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

  it("aynı anahtara eşzamanlı iki istek → TEK çağrı", async () => {
    const qc = client();
    const fetcher = vi.fn(async () => 42);
    const [a, b] = await Promise.all([
      qc.fetchQuery({ queryKey: ["mock", "lillu", "kpi"], queryFn: fetcher }),
      qc.fetchQuery({ queryKey: ["mock", "lillu", "kpi"], queryFn: fetcher }),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect([a, b]).toEqual([42, 42]);
  });

  it("mod ve evren anahtarın parçası — mock önbelleği gerçek modda okunmaz", async () => {
    const qc = client();
    const fetcher = vi.fn(async () => 1);
    await qc.fetchQuery({ queryKey: ["mock", "lillu", "kpi"], queryFn: fetcher });
    await qc.fetchQuery({ queryKey: ["odin", "lillu", "kpi"], queryFn: fetcher });
    await qc.fetchQuery({ queryKey: ["odin", "baska", "kpi"], queryFn: fetcher });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});

/* ------------------------------------------------------------------ 5 */

describe("politika ve taşıma", () => {
  it("modüle göre eşik — trading amazon'dan sıkı, finance gevşek", () => {
    expect(policyFor("trading").staleTime).toBeLessThan(policyFor("amazon").staleTime);
    expect(policyFor("finance").staleTime).toBeGreaterThan(policyFor("amazon").staleTime);
  });

  /* Meclis düzeltmesi: invariant "bayatlamadan önce" DEĞİL, "bayat sayılacağı
     ana kadar"dır. Yenileme aralığı tazelik eşiğini AŞARSA, ekranda bayat
     yazan bir kayıt için hiçbir zaman yenileme tetiklenmez. */
  it("yenileme aralığı tazelik (recent) eşiğini AŞMAZ", () => {
    for (const m of ["trading", "amazon", "finance", "default"] as const) {
      const p = policyFor(m);
      expect(p.refetchInterval).toBeLessThanOrEqual(FRESHNESS_THRESHOLDS_MS[m].recent);
      expect(p.refetchInterval).toBeGreaterThan(p.staleTime);
    }
  });

  it("polling taşıması abonelik açar ve kapatır", () => {
    vi.useFakeTimers();
    const onInvalidate = vi.fn();
    const stop = pollingTransport(1000).subscribe("kpi", onInvalidate);
    vi.advanceTimersByTime(3000);
    expect(onInvalidate).toHaveBeenCalledTimes(3);
    stop();
    vi.advanceTimersByTime(5000);
    expect(onInvalidate).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it("polling çevrimdışıyken tetiklemez", () => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", { onLine: false });
    const onInvalidate = vi.fn();
    const stop = pollingTransport(1000).subscribe("kpi", onInvalidate);
    vi.advanceTimersByTime(5000);
    expect(onInvalidate).not.toHaveBeenCalled();
    stop();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("polling sekme arka plandayken tetiklemez", () => {
    vi.useFakeTimers();
    vi.stubGlobal("document", { hidden: true });
    const onInvalidate = vi.fn();
    const stop = pollingTransport(1000).subscribe("kpi", onInvalidate);
    vi.advanceTimersByTime(5000);
    expect(onInvalidate).not.toHaveBeenCalled();
    stop();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});

/* ------------------------------------------------------------------ 5b */

describe("iptal: zaman aşımı ile çağıranın iptali ayrılır", () => {
  /** Yalnız abort sinyaliyle reddeden sahte fetch. */
  const hangingFetch = () =>
    vi.stubGlobal("fetch", (_url: string, init: { signal: AbortSignal }) =>
      new Promise((_res, rej) => {
        init.signal.addEventListener("abort", () =>
          rej(new DOMException("Aborted", "AbortError"))
        );
      })
    );

  it("zaman aşımı → beş adımlı OdinError(timeout)", async () => {
    hangingFetch();
    await expect(httpLoad("/api/state", { timeoutMs: 5 })).rejects.toBeInstanceOf(OdinError);
    vi.unstubAllGlobals();
  });

  it("AĞ HATASI iptal bayrağının arkasına SAKLANMAZ", async () => {
    /* Meclis ikinci turu: yalnız `signal.aborted` bakılsaydı, ağ kopması
       kullanıcının iptaliyle aynı ana denk geldiğinde hata YUTULUR ve
       ekran sessizce boş kalırdı. Hata TİPİ de kontrol edilir. */
    vi.stubGlobal("fetch", () =>
      new Promise((_res, rej) => setTimeout(() => rej(new TypeError("fetch failed")), 5))
    );
    const p = httpLoad("/api/state", { signal: AbortSignal.abort(), timeoutMs: 50 });
    await expect(p).rejects.toBeInstanceOf(OdinError);
    vi.unstubAllGlobals();
  });

  it("ÇAĞIRAN İPTAL ETTİYSE zaman aşımı da dolmuş olsa hata üretilmez", async () => {
    /*
     * UI-ADR-121'in gerçek yarışı. İKİSİ DE abort olmuş durumda yakalanır:
     * çağıranın sinyali ZATEN iptal, zaman aşımı da dolmuş. Eski koşul
     * (`signal.aborted && !timeout.aborted`) burada `false` verip terk
     * edilmiş ekranın hata kutusunu açıyordu.
     *
     * Bu testin ESKİ KODLA DÜŞTÜĞÜ doğrulandı — kapı olduğu ölçüldü.
     */
    vi.stubGlobal("fetch", (_url: string, init: { signal: AbortSignal }) =>
      /* Reddi bir makro-göreve erteler: o ana kadar HER İKİ sinyal de
         abort olmuş olur. */
      new Promise((_res, rej) =>
        setTimeout(() => rej(new DOMException("Aborted", "AbortError")), 5)
      ).finally(() => void init.signal)
    );

    const p = httpLoad("/api/state", { signal: AbortSignal.abort(), timeoutMs: 0 });
    await expect(p).rejects.not.toBeInstanceOf(OdinError);
    vi.unstubAllGlobals();
  });

  it("çağıran iptal ederse HATA ÜRETİLMEZ — terk edilen ekranın hata kutusu açılmaz", async () => {
    hangingFetch();
    const ac = new AbortController();
    const p = httpLoad("/api/state", { signal: ac.signal, timeoutMs: 30_000 });
    ac.abort();
    await expect(p).rejects.toSatisfy((e: unknown) => !(e instanceof OdinError));
    vi.unstubAllGlobals();
  });
});

/* ------------------------------------------------------------------ 6 */

describe("hata metinleri beş adımı doldurur", () => {
  it("her hata sınıfı what/why/impact/fix üretir — kullanıcı asla yalnız 'Error' görmez", () => {
    const errors = [
      offlineError(),
      contractError("kpi", "detay"),
      httpError(500, "kpi"),
      classifyError(new TypeError("fetch failed"), "kpi"),
      classifyError({ tuhaf: true }, "kpi"),
    ];
    for (const e of errors) {
      const s = e.toErrorState();
      expect(s.what.length).toBeGreaterThan(3);
      expect(s.why.length).toBeGreaterThan(3);
      expect(s.impact.length).toBeGreaterThan(3);
      expect(s.fix.length).toBeGreaterThan(3);
    }
  });

  it("sınıflandırılamayan hata SEBEP UYDURMAZ", () => {
    expect(classifyError({ x: 1 }, "kpi").why).toContain("UYDURULMADI");
  });

  /* Ham yük doğrulaması `ZodError` atar. Bu dal yazılmadan önce hata
     "unknown"a düşüyordu: kullanıcı, sebebi tam olarak bilinen bir
     sözleşme farkı için "kaynağı sınıflandırılamadı" görüyordu. */
  it("ham yükün ZodError'ı SÖZLEŞME hatasıdır, 'unknown' değil", () => {
    let thrown: unknown;
    try {
      z.object({ generated_at: z.string() }).parse({ generated_at: 42 });
    } catch (err) {
      thrown = err;
    }

    const e = classifyError(thrown, "/api/amazon");
    expect(e.kind).toBe("contract");
    expect(e.what).toBe("Veri doğrulanamadı");
    /* Zod'un ham mesajı kullanıcıya ÇIKMAZ, `technical`e gider. */
    expect(e.technical).toContain("generated_at");
    expect(e.why).not.toContain("generated_at");
    /* Sözleşme ihlali tekrar denenmez — aynı sunucu aynı veriyi üretir. */
    expect(e.retryable).toBe(false);
  });

  it("iptal hatası ŞEKİLDEN tanınır — ayrı realm'de instanceof çalışmaz", () => {
    /* Node'un undici'si düz `Error` atabilir; `instanceof DOMException`
       o durumda false döner ve gerçek iptal "unknown" olurdu. */
    const plain = Object.assign(new Error("aborted"), { name: "AbortError" });
    expect(classifyError(plain, "kpi").kind).toBe("timeout");
  });
});

/* ------------------------------------------------------------------ 7 */

describe("gerçek modda mock sızamaz", () => {
  it('DATA_MODE=odin iken meta.source="mock" reddedilir', async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ODIN_DATA_MODE", "odin");
    const { parseEnvelope: parse } = await import("./client");
    const { executiveKpiSchema: kpiSchema } = await import("./schemas");
    expect(() => parse(wrap(kpi()), kpiSchema, "kpi", "amazon")).toThrow(/sözleşme|Veri/i);
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("geçersiz mod değeri derlemede patlar", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ODIN_DATA_MODE", "yarim-mock");
    await expect(import("./mode")).rejects.toThrow(/geçersiz/);
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});

/* ------------------------------------------------------------------ 8 */

/**
 * UI-ADR-137 — iki fabrika birer kez yazılıyor. Bu blok onların
 * VARSAYILANLARINI kilitler; kopyalar birleştirilmeden önce hiçbir test
 * bu üç kararı okumuyordu ve tam olarak bu yüzden sessizce ayrılabilirlerdi.
 */
describe("zarf ve kayıt fabrikaları — UI-ADR-137", () => {
  it('internalEnvelope her zaman source="internal" damgalar', () => {
    const env = internalEnvelope("2026-07-31T10:00:00Z", [1, 2, 3]);
    expect(env.meta.source).toBe("internal");
    expect(env.meta.lastUpdated).toBe("2026-07-31T10:00:00Z");
    expect(env.data).toEqual([1, 2, 3]);
  });

  it("internalEnvelope'un freshness'ı YER TUTUCUDUR — parseEnvelope yeniden hesaplar", () => {
    /* Adaptör "live" yazıyor ama tek doğru kaynak istemcideki yeniden
       hesaptır (UI-ADR-115). Bayat bir damga canlı görünmemeli. */
    const old = new Date(Date.now() - 48 * 60 * 60_000).toISOString();
    expect(internalEnvelope(old, []).meta.freshness).toBe("live");
    expect(parseEnvelope(internalEnvelope(old, [kpi()]), z.array(executiveKpiSchema), "kpi", "amazon").meta.freshness).toBe("stale");
  });

  it("mockKpi value'yu NULL bırakır — anti-fake mock'ta da geçerlidir", () => {
    const k = mockKpi({ id: "x", label: "X", unit: "currency" });
    expect(k.value).toBeNull();
    expect(k.status).toBe("available");
    expect(typeof k.asOf).toBe("string");
  });

  it("mockKpi'nin verilen alanları varsayılanları EZER", () => {
    const k = mockKpi({ id: "x", label: "X", unit: "count", value: 42, status: "unavailable", reason: "yok" });
    expect(k.value).toBe(42);
    expect(k.status).toBe("unavailable");
  });
});
