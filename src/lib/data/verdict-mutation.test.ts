/**
 * Karar mutation'ının POLİTİKASI — ER-0025 · UI-ADR-192.
 *
 * `command.test.ts` sözleşmenin AYRIŞTIRILMASINI ölçüyor; bu dosya
 * mutation'ın DAVRANIŞINI ölçüyor: yeniden deneme, iptal, eşzamanlılık.
 *
 * ⚠️ NEDEN KAYNAK TARAMASI DEĞİL, GERÇEK KOŞUM: `useVerdictMutation` bir
 * hook ve `unit` projesi node ortamında koşuyor (jsdom yok). React Query
 * çekirdeği ise React'siz de çalışır — `MutationObserver` ile aynı
 * `mutationFn`i ve aynı seçenekleri gerçekten koşturuyoruz. Ölçülen şey
 * React Query'nin kendisi değil (repo kuralı), BİZİM politikamız.
 */

import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCommand, type CommandOutcome } from "./command";
import { verdictArgv, type VerdictSubmission } from "./use-verdict";
import { OdinError } from "./errors";

const GONDERIM: VerdictSubmission = {
  decisionId: "rec-1",
  input: { verdict: "approved", reason: "Bütçe uygun ve risk kabul edilebilir" },
};

/** `use-verdict.ts`teki seçeneklerin AYNISI — politika tek yerde ölçülür. */
function mutationKur(
  fn: (s: VerdictSubmission) => Promise<CommandOutcome>,
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
) {
  return new MutationObserver<CommandOutcome, OdinError, VerdictSubmission>(qc, {
    mutationKey: ["odin", "ceo", "verdict"],
    retry: false,
    mutationFn: fn,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("mutation politikası", () => {
  it("LOADING: gönderim sürerken isPending true, bitince false", async () => {
    let cozumle!: (v: CommandOutcome) => void;
    const bekleyen = new Promise<CommandOutcome>((r) => (cozumle = r));
    const obs = mutationKur(() => bekleyen);

    const kosum = obs.mutate(GONDERIM);
    await vi.waitFor(() => expect(obs.getCurrentResult().isPending).toBe(true));

    cozumle({ kind: "success", output: "owner karari kaydedildi: rec-1 -> approved" });
    await kosum;

    const r = obs.getCurrentResult();
    expect(r.isPending).toBe(false);
    expect(r.data?.kind).toBe("success");
  });

  it("SUCCESS: ODIN'in çıktısı olduğu gibi taşınır", async () => {
    const metin = "owner karari kaydedildi: rec-1 -> approved";
    const obs = mutationKur(async () => ({ kind: "success", output: metin }));
    await obs.mutate(GONDERIM);
    expect(obs.getCurrentResult().data).toEqual({ kind: "success", output: metin });
  });

  it("REFUSED bir HATA DEĞİL: mutation başarılı sayılır, veri `refused` olur", async () => {
    /* Kritik ayrım: ODIN'in reddi geçerli bir CEVAPTIR. `throw` edilseydi
       `isError` olurdu ve ekran "gönderim başarısız" derdi — oysa gönderim
       başarılı, KARAR reddedildi. İkisi farklı şeydir. */
    const obs = mutationKur(async () => ({
      kind: "refused",
      exit: 1,
      output: "REDDEDİLDİ: deferred bir gelecek tarih ister (--revisit)",
    }));
    await obs.mutate(GONDERIM);

    const r = obs.getCurrentResult();
    expect(r.isError).toBe(false);
    expect(r.data?.kind).toBe("refused");
  });

  it("RETRY YOK: ağ hatasında mutationFn BİR KEZ çağrılır", async () => {
    /* `ceo verdict` idempotent olduğunu beyan etmiyor; istek sunucuya
       ulaşmış ve kayıt yazılmış olabilir. Sessiz tekrar = çift kayıt ve
       karar defteri silinmez (ODIN ADR-0005). */
    const fn = vi.fn(async () => {
      throw new OdinError({
        kind: "network",
        what: "ODIN'e ulaşılamadı",
        why: "Yerel sunucu yanıt vermedi.",
        impact: "Kararın kaydedilmedi.",
        fix: "Sunucuyu başlat.",
      });
    });
    const obs = mutationKur(fn);
    await obs.mutate(GONDERIM).catch(() => {});

    expect(fn).toHaveBeenCalledTimes(1);
    expect(obs.getCurrentResult().isError).toBe(true);
  });

  it("ELLE yeniden deneme İKİNCİ çağrıyı yapar — tekrar denemeyi insan seçer", async () => {
    let cagri = 0;
    const obs = mutationKur(async () => {
      cagri += 1;
      if (cagri === 1) {
        throw new OdinError({
          kind: "network",
          what: "ODIN'e ulaşılamadı",
          why: "-",
          impact: "-",
          fix: "-",
        });
      }
      return { kind: "success", output: "owner karari kaydedildi: rec-1 -> approved" };
    });

    await obs.mutate(GONDERIM).catch(() => {});
    expect(obs.getCurrentResult().isError).toBe(true);

    await obs.mutate(GONDERIM);
    expect(cagri).toBe(2);
    expect(obs.getCurrentResult().data?.kind).toBe("success");
  });

  it("aynı argv iki kez gönderilirse argv DEĞİŞMEZ — idempotent kurulum", () => {
    /* Yeniden deneme aynı komutu göndermeli; argv üretimi yan etkisiz. */
    expect(verdictArgv(GONDERIM)).toEqual(verdictArgv(GONDERIM));
  });
});

describe("iptal — sinyal gerçekten bağlı", () => {
  it("İPTAL EDİLMİŞ sinyalle istek atılmaz ve abort hatası YUTULMAZ", async () => {
    /* `runCommand` çağıranın sinyalini `AbortSignal.any` ile birleştirir;
       iptal edilmiş bir sinyalde `fetch` hemen `AbortError` atar ve
       `command.ts` onu SINIFLANDIRMADAN yeniden fırlatır (UI-ADR-121):
       terk edilmiş bir gönderimin hata kutusu açılmaz. */
    const ac = new AbortController();
    ac.abort();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        if (init.signal?.aborted) throw init.signal.reason;
        return { ok: true, status: 200, json: async () => ({ ok: true, exit: 0 }) } as unknown as Response;
      })
    );

    await expect(runCommand(["ceo", "verdict", "r", "approved"], { signal: ac.signal }))
      .rejects.not.toBeInstanceOf(OdinError);
  });

  it("iptal EDİLMEMİŞ sinyal isteği engellemez", async () => {
    const ac = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, exit: 0, output: "tamam" }),
      })) as unknown as typeof fetch
    );

    const r = await runCommand(["ceo", "verdict", "r", "approved"], { signal: ac.signal });
    expect(r.kind).toBe("success");
  });
});
