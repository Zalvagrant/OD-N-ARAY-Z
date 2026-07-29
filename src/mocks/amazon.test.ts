/**
 * Mock veri İÇ TUTARLILIK kapısı — UI-ADR-103.
 *
 * NEDEN VAR: S6 kapanış incelemesinde PPC kartındaki dört sayı birbirini
 * yalanlıyordu (2.420 / 18.300 ile ACOS %18,1 ve ROAS 5,4 bir arada
 * duramaz). Hiçbir test yakalamadı; yalnızca ekrana bakınca görüldü.
 * Görsel inceleme her sprintte tekrarlanmaz, test tekrarlanır.
 *
 * NE KORUR: türetilebilir her oranın bileşenlerinden gerçekten çıktığını.
 * Değerleri DEĞİL, aralarındaki İLİŞKİYİ sabitler — mock'un rakamları
 * serbestçe değişebilir, ilişkileri değişemez.
 */

import { describe, expect, it } from "vitest";
import {
  amazonKpisMock,
  ppcOverviewMock,
  skusMock,
  snapshotMock,
} from "./amazon";

/** Yüzde karşılaştırması: sözleşme bir ondalık yazıyor, kapı da öyle. */
const pct = (n: number) => Number(n.toFixed(1));

const kpiValue = (id: string) => {
  const k = amazonKpisMock().data.find((x) => x.id === id);
  if (!k) throw new Error(`KPI yok: ${id}`);
  return k.value;
};

describe("amazon mock — iç tutarlılık (UI-ADR-103)", () => {
  it("PPC kartında ACOS harcama/satıştan çıkar", () => {
    const ppc = ppcOverviewMock().data;
    expect(pct((ppc.spend.amount / ppc.sales.amount) * 100)).toBe(pct(ppc.acos));
  });

  it("PPC kartında ROAS satış/harcamadan çıkar", () => {
    const ppc = ppcOverviewMock().data;
    expect(pct(ppc.sales.amount / ppc.spend.amount)).toBe(pct(ppc.roas));
  });

  it("TACOS reklam harcamasının ciroya oranıdır", () => {
    const ppc = ppcOverviewMock().data;
    const snap = snapshotMock().data;
    expect(pct((ppc.spend.amount / snap.revenue.amount) * 100)).toBe(pct(snap.tacos));
  });

  it("her SKU'nun ACOS'u kendi harcama/reklam satışından çıkar", () => {
    for (const s of skusMock().data) {
      /* Ölçülmemiş alan null'dır ve oran da null olmalıdır — anti-fake. */
      if (s.adSpendLast30d === null || s.adSalesLast30d === null) {
        expect(s.acos).toBeNull();
        continue;
      }
      expect(pct((s.adSpendLast30d.amount / s.adSalesLast30d.amount) * 100)).toBe(
        pct(s.acos!)
      );
    }
  });

  it("ekranda tek para birimi vardır", () => {
    const ppc = ppcOverviewMock().data;
    const snap = snapshotMock().data;
    const monies = [
      snap.revenue,
      snap.inventoryValue,
      ppc.spend,
      ppc.sales,
      ...skusMock().data.flatMap((s) => [
        s.revenueLast30d,
        s.price,
        s.adSpendLast30d,
        s.adSalesLast30d,
      ]),
    ].filter((m): m is { amount: number; currency: string } => m != null);

    expect([...new Set(monies.map((m) => m.currency))]).toEqual(["TRY"]);
  });

  it("KPI şeridi snapshot ile aynı ACOS ve TACOS'u söyler", () => {
    const snap = snapshotMock().data;
    expect(pct(kpiValue("am-kpi-acos"))).toBe(pct(snap.acos));
    expect(pct(kpiValue("am-kpi-tacos"))).toBe(pct(snap.tacos));
  });

  it("KPI şeridinde ROAS PPC kartıyla aynıdır", () => {
    expect(pct(kpiValue("am-kpi-roas"))).toBe(pct(ppcOverviewMock().data.roas));
  });

  it("net kâr hiçbir yerde üretilmez — COGS yok (UI-ADR-099)", () => {
    expect(snapshotMock().data.netProfit).toBeNull();
    expect(ppcOverviewMock().data.profitAfterAds).toBeNull();
  });
});
