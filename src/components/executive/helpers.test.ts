/**
 * Executive katmanının SAF karar fonksiyonları — UI-ADR-139.
 *
 * Bu sekiz fonksiyon *"tek yerde, test edilebilir"* gerekçesiyle JSX'ten
 * çıkarılıp export edilmişti ve **hiçbirinin testi yoktu**; dahası
 * hiçbiri kendi dosyası dışından import edilmiyordu. Test edilmeyen bir
 * export, iki dünyanın da kötüsüdür: API yüzeyini genişletir, karşılığında
 * hiçbir davranış kilitlemez.
 *
 * Kilitlenen şey biçim değil KARARDIR — hangi kaydın öne geleceği, hangi
 * kaydın hiç gösterilmeyeceği. Bunlar ekranda görünen sıranın tamamıdır ve
 * bugüne kadar yalnız gözle doğrulanabiliyordu.
 *
 * Tarayıcı gerekmez: hepsi saf. UI-ADR-130'un `atRiskSkus` için yaptığı bu.
 */

import { describe, expect, it } from "vitest";

import { sortIntelligence } from "./activity-feed";
import { actionableAlerts } from "./alert-stack";
import { sortCampaigns } from "./campaign-intelligence";
import { sortDecisions } from "./decision-queue";
import { dueDeferrals, monitoredDecisions } from "./monitored-decisions-board";
import { rotationSeconds } from "./ai-pulse";
import { canRenderSimulation } from "./simulation-panel";

/* Testler yalnız okudukları alanlara bakar; gövdeyi tam kurmak sözleşme
   değişince testi kırardı, oysa test edilen şey SIRALAMA kuralıdır. */
const decision = (over: Record<string, unknown>) =>
  ({ recommendation: { confidence: 50 }, ...over }) as never;

/* ------------------------------------------------------------------ 1 */

describe("sortIntelligence — önce öncelik, sonra tazelik", () => {
  const item = (priority: number, at: string | null) =>
    ({ priority, at }) as never;

  it("düşük `priority` sayısı ÖNE gelir (1 = en yüksek)", () => {
    const out = sortIntelligence([item(3, null), item(1, null), item(2, null)]);
    expect(out.map((i) => (i as { priority: number }).priority)).toEqual([1, 2, 3]);
  });

  it("eşit öncelikte YENİ olan öne gelir", () => {
    const out = sortIntelligence([
      item(1, "2026-07-01T00:00:00Z"),
      item(1, "2026-07-31T00:00:00Z"),
    ]);
    expect((out[0] as { at: string }).at).toBe("2026-07-31T00:00:00Z");
  });

  it("zamansız kayıt EN ESKİ sayılır — tarih uydurulmaz", () => {
    const out = sortIntelligence([item(1, null), item(1, "2020-01-01T00:00:00Z")]);
    expect((out[0] as { at: string | null }).at).toBe("2020-01-01T00:00:00Z");
  });

  it("girdi dizisini DEĞİŞTİRMEZ", () => {
    const input = [item(2, null), item(1, null)];
    const before = [...input];
    sortIntelligence(input);
    expect(input).toEqual(before);
  });
});

/* ------------------------------------------------------------------ 2 */

describe("actionableAlerts — aksiyon gerektirmeyen uyarı GÖSTERİLMEZ", () => {
  const alert = (severity: string, requiresAction: unknown) =>
    ({ severity, requiresAction }) as never;

  it("requiresAction yalnız GERÇEK true ise geçer", () => {
    /* Katı eşitlik kasıtlı: undefined ya da "true" metni bir uyarıyı
       aksiyon listesine sokmamalı. Aksiyon listesi güvenilirliğini
       oraya girmemesi gereken tek kayıtla kaybeder. */
    const out = actionableAlerts([
      alert("critical", true),
      alert("critical", undefined),
      alert("critical", false),
      alert("critical", "true"),
    ]);
    expect(out).toHaveLength(1);
  });

  it("ciddiyet sırası: critical → risk → warning → info", () => {
    const out = actionableAlerts([
      alert("info", true),
      alert("critical", true),
      alert("warning", true),
      alert("risk", true),
    ]);
    expect(out.map((a) => (a as { severity: string }).severity)).toEqual([
      "critical",
      "risk",
      "warning",
      "info",
    ]);
  });

  it("BİLİNMEYEN ciddiyet en sona düşer, listeden atılmaz", () => {
    /* ODIN sözlüğü genişlerse yeni bir severity SESSİZCE KAYBOLMAMALI —
       görünmeyen uyarı, olmayan uyarıdan tehlikelidir. */
    const out = actionableAlerts([alert("apocalypse", true), alert("info", true)]);
    expect(out).toHaveLength(2);
    expect((out[1] as { severity: string }).severity).toBe("apocalypse");
  });
});

/* ------------------------------------------------------------------ 3 */

describe("sortCampaigns — bilinmeyen durum sona, listede kalır", () => {
  const c = (status: string) => ({ status }) as never;

  it("en zayıf performans başa gelir", () => {
    const out = sortCampaigns([c("healthy"), c("underperforming"), c("scalable")]);
    expect(out.map((x) => (x as { status: string }).status)).toEqual([
      "underperforming",
      "scalable",
      "healthy",
    ]);
  });

  it("BİLİNMEYEN `status` atılmaz, en sona konur", () => {
    /* ODIN sözlüğü genişlerse yeni bir durum SESSİZCE KAYBOLMAMALI.
       Kaybolan kampanya, sorunu olmayan kampanya gibi okunur. */
    const out = sortCampaigns([c("uydurma-durum"), c("underperforming")]);
    expect(out).toHaveLength(2);
    expect((out[1] as { status: string }).status).toBe("uydurma-durum");
  });

  it("girdi dizisini DEĞİŞTİRMEZ", () => {
    const input = [c("healthy"), c("underperforming")];
    const before = [...input];
    sortCampaigns(input);
    expect(input).toEqual(before);
  });
});

/* ------------------------------------------------------------------ 4 */

describe("sortDecisions — D3 > D2 > D1, eşitlikte DÜŞÜK güven öne", () => {
  const d = (tier: string, confidence: number) =>
    decision({ tier, recommendation: { confidence } });

  it("stratejik katman (D3) önce gelir", () => {
    const out = sortDecisions([d("D1", 90), d("D3", 90), d("D2", 90)]);
    expect(out.map((x) => (x as { tier: string }).tier)).toEqual(["D3", "D2", "D1"]);
  });

  it("aynı katmanda EN BELİRSİZ karar öne gelir", () => {
    /* Ters sezgisel ama kasıtlı: CEO'nun dikkatini en çok, en belirsiz
       stratejik karar hak eder. Yüksek güvenli karar zaten kendini
       savunuyor. */
    const out = sortDecisions([d("D3", 95), d("D3", 40), d("D3", 70)]);
    expect(out.map((x) => (x as { recommendation: { confidence: number } }).recommendation.confidence))
      .toEqual([40, 70, 95]);
  });
});

/* ------------------------------------------------------------------ 5 */

describe("dueDeferrals — saat yoksa VADE İDDİASI da yok", () => {
  const deferred = (revisitAt: string | null) =>
    decision({ humanDecision: { outcome: "deferred", revisitAt } });

  it("`now` null iken BOŞ döner — sunucuda vade hesaplanmaz", () => {
    /* Anti-fake'in zaman hâli: istemci saati henüz yokken "vadesi geldi"
       demek, doğrulanmamış bir iddiadır. Boş liste dürüsttür. */
    expect(dueDeferrals([deferred("2020-01-01T00:00:00Z")], null)).toEqual([]);
  });

  it("yalnız vadesi GEÇMİŞ ertelemeler döner", () => {
    const now = Date.parse("2026-07-31T00:00:00Z");
    const out = dueDeferrals(
      [deferred("2026-07-30T00:00:00Z"), deferred("2026-08-30T00:00:00Z")],
      now
    );
    expect(out).toHaveLength(1);
  });

  it("tam vade anı GELMİŞ sayılır (<=)", () => {
    const iso = "2026-07-31T00:00:00Z";
    expect(dueDeferrals([deferred(iso)], Date.parse(iso))).toHaveLength(1);
  });

  it("`revisitAt` yoksa ya da outcome deferred değilse sayılmaz", () => {
    const now = Date.now();
    expect(dueDeferrals([deferred(null)], now)).toEqual([]);
    expect(
      dueDeferrals([decision({ humanDecision: { outcome: "approved", revisitAt: "2020-01-01T00:00:00Z" } })], now)
    ).toEqual([]);
  });
});

/* ------------------------------------------------------------------ 6 */

describe("monitoredDecisions — yalnız `monitoring`", () => {
  it("başka hiçbir durum tahtaya girmez", () => {
    const out = monitoredDecisions([
      decision({ status: "monitoring" }),
      decision({ status: "open" }),
      decision({ status: "closed" }),
    ]);
    expect(out).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ 7 */

describe("rotationSeconds — ölçülmemiş yük EN YAVAŞ kabul edilir", () => {
  it("null/undefined/NaN → 20 sn (en yavaş)", () => {
    /* Halka gerçekten dönüyor; hızı bir ÖLÇÜME bağlı. Ölçüm yoksa hızlı
       dönmek "sistem yoğun çalışıyor" diye okunur ve bu sahte bir
       göstergedir (CLAUDE.md §2). */
    expect(rotationSeconds(null)).toBe(20);
    expect(rotationSeconds(undefined)).toBe(20);
    expect(rotationSeconds(Number.NaN)).toBe(20);
  });

  it("0 → 20 sn, 100 → 4 sn", () => {
    expect(rotationSeconds(0)).toBe(20);
    expect(rotationSeconds(100)).toBe(4);
  });

  it("aralık dışı değer KIRPILIR, ekstrapole edilmez", () => {
    expect(rotationSeconds(-50)).toBe(20);
    expect(rotationSeconds(500)).toBe(4);
  });

  it("yük arttıkça süre KISALIR (monotonluk)", () => {
    expect(rotationSeconds(25)).toBeGreaterThan(rotationSeconds(75));
  });
});

/* ------------------------------------------------------------------ 8 */

describe("canRenderSimulation — varsayımsız sonuç GÖSTERİLMEZ", () => {
  const sim = (assumptions: unknown, scenarios: unknown) =>
    ({ result: { assumptions, scenarios } }) as never;

  it("varsayım VE senaryo varsa çizilir", () => {
    expect(canRenderSimulation(sim(["stok sabit"], [{}]))).toBe(true);
  });

  it("varsayım listesi boşsa çizilmez", () => {
    /* Varsayımı görünmeyen bir simülasyon, kaynağı görünmeyen bir
       iddiadır — ADR-0081'in arayüzdeki karşılığı. */
    expect(canRenderSimulation(sim([], [{}]))).toBe(false);
  });

  it("senaryo yoksa çizilmez", () => {
    expect(canRenderSimulation(sim(["x"], []))).toBe(false);
    expect(canRenderSimulation(sim(["x"], undefined))).toBe(false);
  });

  it("kayıt hiç yoksa ya da result yoksa çizilmez", () => {
    expect(canRenderSimulation(undefined)).toBe(false);
    expect(canRenderSimulation({} as never)).toBe(false);
  });
});
