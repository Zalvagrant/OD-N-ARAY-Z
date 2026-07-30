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
  amazonAlertsMock,
  amazonKpisMock,
  amazonOpportunitiesMock,
  ppcOverviewMock,
  skusMock,
  statusForScore,
  snapshotMock,
} from "./amazon";

/** Amazon US marketplace'inin para birimi — sahip kararı (UI-ADR-103). */
const MARKETPLACE_CURRENCY = "USD";

/** Yüzde karşılaştırması: sözleşme bir ondalık yazıyor, kapı da öyle. */
const pct = (n: number) => Number(n.toFixed(1));

const kpiValue = (id: string) => {
  const k = amazonKpisMock().data.find((x) => x.id === id);
  if (!k) throw new Error(`KPI yok: ${id}`);
  /* FR-0044 zarfı: sayı yalnızca available iken vardır (UI-ADR-106). */
  if (k.value.status !== "available" || k.value.value === null) {
    throw new Error(`KPI değeri available değil: ${id}`);
  }
  return k.value.value;
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
      const ad = s.advertising;
      /* Ölçülmemiş alan null'dır ve oran da null olmalıdır — anti-fake. */
      if (ad.spend === null || ad.sales === null) {
        expect(ad.acos).toBeNull();
        continue;
      }
      expect(pct((ad.spend.amount / ad.sales.amount) * 100)).toBe(pct(ad.acos!));
    }
  });

  /* ---- UI-ADR-104: revize edilen sözleşmenin değişmezleri ---- */

  it("skor doluysa gerekçesi de doludur (ADR-0085)", () => {
    for (const s of skusMock().data) {
      if (s.healthScore === null) continue;
      expect(s.healthScoreExplanation, s.sku).toBeTruthy();
      expect(s.healthScoreExplanation!.length, s.sku).toBeGreaterThan(0);
    }
  });

  it("gerekçe katkıları 100'den skora götürür", () => {
    /* Toplamayan bir gerekçe, gerekçe değildir: kullanıcı katkıları toplar
       ve skoru bulamazsa açıklamanın uydurma olduğunu düşünür. */
    for (const s of skusMock().data) {
      if (s.healthScore === null || !s.healthScoreExplanation) continue;
      const sum = s.healthScoreExplanation.reduce(
        (n, x) => n + (x.contribution ?? 0),
        0
      );
      expect(100 + sum, `${s.sku} katkı toplamı`).toBe(s.healthScore);
    }
  });

  it("katkı yönü işaretiyle tutarlıdır", () => {
    for (const s of skusMock().data) {
      for (const x of s.healthScoreExplanation ?? []) {
        if (x.contribution === null) {
          expect(x.direction, `${s.sku}/${x.code}`).toBe("neutral");
        } else {
          expect(x.direction, `${s.sku}/${x.code}`).toBe(
            x.contribution >= 0 ? "positive" : "negative"
          );
        }
      }
    }
  });

  it("statusBasis=health_score olan SKU eşik tablosuna uyar", () => {
    /* Eskiden skor 55 olan SKU "İzlemede", skor 64 olan "Riskli" idi: daha
       kötü skorlu SKU daha iyi etiketliydi. Eşik tablosu bunu kapatıyor. */
    for (const s of skusMock().data) {
      if (s.statusBasis !== "health_score") continue;
      expect(s.healthScore, `${s.sku} skorsuz health_score olamaz`).not.toBeNull();
      expect(s.status, s.sku).toBe(statusForScore(s.healthScore!));
    }
  });

  it("ölçüm penceresi geçerlidir ve satış/reklam aynı dönemi kullanır", () => {
    for (const s of skusMock().data) {
      expect(s.sales.period.from < s.sales.period.to, s.sku).toBe(true);
      /* Farklı dönemlerin ACOS'u ile cironun yan yana gösterilmesi
         karşılaştırılamaz iki sayı üretir. */
      expect(s.advertising.period, s.sku).toEqual(s.sales.period);
    }
  });

  it("ekrandaki HER tutar tek para biriminde — marketplace para birimi", () => {
    /* Tek tek alan saymak yerine ağacın tamamı taranır: yeni bir mock alanı
       eklendiğinde bu kapı kendiliğinden onu da kapsar. Elle yazılmış bir
       liste, eklenen alanı sessizce dışarıda bırakırdı. */
    const found = new Set<string>();
    const walk = (v: unknown) => {
      if (Array.isArray(v)) return v.forEach(walk);
      if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        if (typeof o.currency === "string" && typeof o.amount === "number") {
          found.add(o.currency);
        }
        Object.values(o).forEach(walk);
      }
    };
    walk([
      snapshotMock().data,
      ppcOverviewMock().data,
      skusMock().data,
      amazonKpisMock().data,
      amazonOpportunitiesMock().data,
    ]);

    expect(found.size).toBeGreaterThan(0);
    expect([...found]).toEqual([MARKETPLACE_CURRENCY]);
  });

  it("para taşıyan KPI'lar currencyCode, yüzde KPI'ları scale bildirir", () => {
    for (const k of amazonKpisMock().data) {
      if (k.unit === "currency") expect(k.currencyCode, k.id).toBe(MARKETPLACE_CURRENCY);
      if (k.unit === "percent") expect(k.scale, k.id).toBeDefined();
    }
  });

  it("KPI zarfı değişmezleri: available ⇔ sayı, değilse reason zorunlu", () => {
    /* "Data Required" METNİ sayı alanına giremez (ADR-0135 / UI-ADR-106). */
    for (const k of amazonKpisMock().data) {
      if (k.value.status === "available") {
        expect(typeof k.value.value, k.id).toBe("number");
      } else {
        expect(k.value.value, k.id).toBeNull();
        expect(k.value.reason, k.id).toBeTruthy();
      }
    }
  });

  it("FR-0043 alanları mock'ta DOLDURULMAZ — kaynağı yok", () => {
    /* Boş yorum paneli dürüsttür; üretilmişi anti-fake ihlalidir (R-006
       FR-0043). Bu kapı, alanların mock'a geri sızmasını engeller. */
    for (const k of amazonKpisMock().data) {
      expect(k.trend, k.id).toBeUndefined();
      expect(k.sparkline, k.id).toBeUndefined();
      expect(k.aiInsight, k.id).toBeUndefined();
      expect(k.forecast, k.id).toBeUndefined();
      expect(k.recommendedAction, k.id).toBeUndefined();
    }
  });

  it("fırsatların önerilen aksiyonu boş olamaz — aksiyonsuz kayıt fırsat değildir", () => {
    for (const o of amazonOpportunitiesMock().data) {
      expect(o.suggestedAction.trim().length, o.id).toBeGreaterThan(0);
      expect(o.summary.trim().length, o.id).toBeGreaterThan(0);
    }
  });

  it("severity ya union'dandır ya hiç yoktur — null yazılmaz", () => {
    for (const a of amazonAlertsMock().data) {
      if (a.severity !== undefined) {
        expect(["critical", "high", "medium", "low"], a.id).toContain(a.severity);
      }
    }
  });

  it("KPI şeridi ile Executive Glance aynı tutarları söyler", () => {
    /* İki ayrı yerde yazılan aynı sayı, en kolay çelişme noktasıdır. */
    const snap = snapshotMock().data;
    expect(kpiValue("amazon.net_sales")).toBe(snap.revenue.amount);
    expect(kpiValue("amazon.inventory_value")).toBe(snap.inventoryValue.amount);
    expect(kpiValue("amazon.gross_profit")).toBe(snap.grossProfit?.amount);
  });

  it("AI brifinginin sayıları Executive Glance ile aynıdır", () => {
    /* Bu kapı görsel incelemede yakalanan bir hatadan doğdu: para birimi
       USD'ye çevrilirken `intelligence.numbers` düz sayı olduğu için
       dönüşümün dışında kaldı — etiket "$" oldu, değer TRY kaldı. Glance
       $99.600, brifing 4.182.000 diyordu. Bu alan `Money` değil, bu yüzden
       para birimi kapısı da görmemişti. */
    const snap = snapshotMock().data;
    const n = snap.intelligence.numbers;
    expect(n["Ciro ($)"]).toBe(snap.revenue.amount);
    expect(n["Gross Profit ($)"]).toBe(snap.grossProfit?.amount);
    expect(pct(n.ACOS as number)).toBe(pct(snap.acos));
    expect(pct(n.TACOS as number)).toBe(pct(snap.tacos));
    expect(pct(n["BuyBox (%)"] as number)).toBe(pct(snap.buyBoxRate));
    expect(n["Sipariş"]).toBe(snap.orders);
  });

  it("Top Risk ve Top Opportunity gerçekten listelerde vardır", () => {
    const snap = snapshotMock().data;
    if (snap.topRisk) {
      expect(amazonAlertsMock().data.map((a) => a.id)).toContain(snap.topRisk.id);
    }
    if (snap.topOpportunity) {
      expect(amazonOpportunitiesMock().data.map((o) => o.id)).toContain(
        snap.topOpportunity.id
      );
    }
  });

  /* Eski "uyarının SKU'su listede var" kapısı kaldırıldı: FR-0046 v1
     Alert'te varlık referansı alanı yok (soru 13-...md §17). Alan dönerse
     kapı da döner. */

  it("KPI şeridi snapshot ile aynı ACOS ve TACOS'u söyler", () => {
    const snap = snapshotMock().data;
    expect(pct(kpiValue("amazon.acos"))).toBe(pct(snap.acos));
    expect(pct(kpiValue("amazon.tacos"))).toBe(pct(snap.tacos));
  });

  it("KPI şeridinde ROAS PPC kartıyla aynıdır", () => {
    expect(pct(kpiValue("amazon.roas"))).toBe(pct(ppcOverviewMock().data.roas));
  });

  it("net kâr hiçbir yerde üretilmez — COGS yok (UI-ADR-099)", () => {
    expect(snapshotMock().data.netProfit).toBeNull();
    expect(ppcOverviewMock().data.profitAfterAds).toBeNull();
  });
});
