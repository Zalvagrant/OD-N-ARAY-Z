/**
 * `/api/amazon` adaptörü — S10 (UI-ADR-126).
 *
 * Fixture ODIN'in CANLI yanıtından kopyalandı
 * (`GET http://127.0.0.1:8765/api/amazon`, 2026-07-31). Uydurulmuş bir
 * örnek, sözleşme değiştiğinde testi yeşil bırakır.
 */

import { describe, expect, it } from "vitest";

import { adaptAlerts, adaptKpis, adaptSkus, amazonSchema, amazonSkusSchema } from "./odin-amazon";
import { alertSchema, executiveKpiSchema, skuHealthSchema } from "./schemas";

const LIVE = {
  schema_version: 1,
  generated_at: "2026-07-31T08:23:43.725722+00:00",
  coverage: "2/3",
  sources: ["KO-spapi-orders-2026-07-30", "KO-spapi-inventory-2026-07-30"],
  kpis: [
    {
      id: "units_sold",
      label: "Satılan adet",
      status: "available",
      value: 38,
      unit: "count",
      currency: null,
      scale: null,
      reason: null,
      as_of: "2026-07-30",
      source: "KO-spapi-orders-2026-07-30",
      report_period: { basis: "rolling_window", window_days: 7 },
    },
    {
      id: "sales_change_pct",
      label: "Satış değişimi",
      status: "data_required",
      value: null,
      unit: "percent",
      currency: null,
      scale: "0-1",
      reason: "önceki pencerede satış yok — yüzde değişimin paydası yok",
      as_of: "2026-07-30",
      source: "KO-spapi-orders-2026-07-30",
      report_period: { basis: "rolling_window", window_days: 7 },
    },
    {
      id: "critical_stock_skus",
      label: "Kritik stoktaki SKU",
      status: "available",
      value: 3,
      unit: "count",
      currency: null,
      scale: null,
      reason: null,
      as_of: "2026-07-30",
      source: "KO-spapi-inventory-2026-07-30",
      threshold_provenance: "unapproved_default",
    },
    {
      id: "ad_spend",
      label: "Reklam harcaması",
      status: "available",
      value: 676.82,
      unit: "currency",
      currency: "USD",
      scale: null,
      reason: null,
      as_of: "2026-07-30",
      source: "KO-ads-ads_report-2026-07-30",
    },
  ],
  alerts: [
    {
      id: "AL-amazon-stockout",
      severity: "critical",
      title: "Kritik stok",
      module: "amazon",
      requires_action: true,
      evidence: ["KO-spapi-orders-2026-07-30", "KO-spapi-inventory-2026-07-30"],
      created_at: "2026-07-31T08:23:43.725722+00:00",
      suggested_action: "Kritik stoktaki SKU'lar için reorder listesi çıkar.",
      threshold_provenance: "unapproved_default",
    },
  ],
};

const parse = (raw: unknown = LIVE) => amazonSchema.parse(raw);
const clone = () => JSON.parse(JSON.stringify(LIVE)) as typeof LIVE;

describe("KPI adaptörü", () => {
  it("canlı yanıtın TAMAMI kanonik şemadan geçer", () => {
    for (const k of adaptKpis(parse())) {
      expect(() => executiveKpiSchema.parse(k), k.id).not.toThrow();
    }
  });

  it("yalnız yeniden adlandırır — değer dönüştürmez", () => {
    const [units] = adaptKpis(parse());
    expect(units).toMatchObject({
      id: "units_sold",
      status: "available",
      value: 38,
      unit: "count",
      asOf: "2026-07-30",
    });
    /* ODIN'in düz zarfı = arayüzün kanonik tipi (ADR-0143 §2): iç içe
       bir `value` nesnesi ÜRETİLMEZ. */
    expect(typeof units.value).toBe("number");
  });

  it("ölçülemeyen metriğin GEREKÇESİNİ taşır, sayı uydurmaz", () => {
    const change = adaptKpis(parse())[1];
    expect(change.value).toBeNull();
    expect(change.status).toBe("data_required");
    expect(change.reason).toContain("payda");
  });
});

describe("Alert adaptörü", () => {
  it("snake_case → camelCase, kanıt korunur", () => {
    const [alert] = adaptAlerts(parse());
    expect(alert.requiresAction).toBe(true);
    expect(alert.createdAt).toBe(LIVE.generated_at);
    expect(alert.evidence).toHaveLength(2);
    expect(alert.suggestedAction).toContain("reorder");
    expect(() => alertSchema.parse(alert)).not.toThrow();
  });

  it("ODIN sözlüğünün DÖRDÜNÜ de taşır — eşleme icat edilmez", () => {
    for (const severity of ["critical", "risk", "warning", "info"]) {
      const raw = clone();
      raw.alerts[0].severity = severity;
      expect(adaptAlerts(parse(raw))[0].severity, severity).toBe(severity);
    }
  });

  it("sözlük DIŞI bir severity sessizce geçmez", () => {
    /* Rozetsiz göstermek, ODIN'in sözleşmeyi genişlettiğini gizlerdi;
       bölüm gerekçeli hata basmalı. */
    const raw = clone();
    raw.alerts[0].severity = "catastrophic";
    expect(() => alertSchema.parse(adaptAlerts(parse(raw))[0])).toThrow();
  });
});

describe("eşik kaynağı — ODIN ADR-0146", () => {
  it("`unapproved_default` işareti KPI'da da alarmda da taşınır", () => {
    expect(adaptKpis(parse())[2].thresholdProvenance).toBe("unapproved_default");
    expect(adaptAlerts(parse())[0].thresholdProvenance).toBe("unapproved_default");
  });

  it("eşiği olmayan kayıt alanı hiç TAŞIMAZ — null gürültüsü yok", () => {
    expect(adaptKpis(parse())[0]).not.toHaveProperty("thresholdProvenance");
  });

  it("bilinmeyen bir değer 'onaylı' diye UYDURULMAZ", () => {
    const raw = clone();
    raw.alerts[0].threshold_provenance = "whatever";
    expect(adaptAlerts(parse(raw))[0]).not.toHaveProperty("thresholdProvenance");
  });
});

describe("sözleşme ihlali", () => {
  it("beklenmeyen biçim sessizce geçmez", () => {
    expect(() => parse({ generated_at: "yok" })).toThrow();
  });
});

/* -------------------------------------------------------------------------- */

const LIVE_SKU = {
  generated_at: "2026-07-31T08:23:43.725722+00:00",
  skus: [
    {
      sku: "CapDome-Xs-10",
      asin: "B0GBMCSS2G",
      title: "10 pcs Phonak Cap Dome",
      health_score: null,
      health_score_explanation: null,
      status: "critical",
      status_basis: "rule_set",
      threshold_provenance: "unapproved_default",
      inventory_as_of: "2026-07-30",
      inventory_period: { basis: "as_of", as_of: "2026-07-30T10:31:40+00:00" },
      units_available: 1,
      days_of_supply: 3.5,
      estimated_stockout_at: null,
      reorder_units: null,
      sales: {
        period: { basis: "rolling_window", window_days: 7, end: "2026-07-30" },
        source: "KO-spapi-sku_sales-2026-07-30",
        units_sold: 2,
        revenue: null,
        conversion_rate: null,
        buy_box_rate: null,
      },
      advertising: {
        period: { start: "2026-07-01", end: "2026-07-30" },
        source: "KO-ads-ads_report-2026-07-30",
        currency: "USD",
        spend: 12.5,
        sales: 40,
        acos: 0.3125,
      },
      price: 6.9,
      currency: "USD",
    },
  ],
};

const cloneSku = () => JSON.parse(JSON.stringify(LIVE_SKU)) as typeof LIVE_SKU;

describe("SKU adaptörü — ODIN ADR-0149", () => {
  it("canlı satırı kanonik şemadan geçirir", () => {
    for (const s of adaptSkus(amazonSkusSchema.parse(LIVE_SKU))) {
      expect(() => skuHealthSchema.parse(s), s.sku).not.toThrow();
    }
  });

  it("skoru TÜRETMEZ — ODIN yayınlamıyor", () => {
    const [s] = adaptSkus(amazonSkusSchema.parse(LIVE_SKU));
    expect(s.healthScore).toBeNull();
    expect(s.healthScoreExplanation).toBeNull();
  });

  it("eşik provenance'ını taşır — 'Kritik' yetkili bir hüküm değil", () => {
    const [s] = adaptSkus(amazonSkusSchema.parse(LIVE_SKU));
    expect(s.thresholdProvenance).toBe("unapproved_default");
    expect(s.statusBasis).toBe("rule_set");
  });

  it("kayan pencerenin başlangıcını BEYANDAN hesaplar, tahmin etmez", () => {
    /* "30 Temmuz'da biten 7 günlük pencere" → 24-30 Temmuz. Bu aritmetik,
       tahmin değil. */
    const [s] = adaptSkus(amazonSkusSchema.parse(LIVE_SKU));
    expect(s.sales.period).toEqual({ from: "2026-07-24", to: "2026-07-30" });
  });

  it("üç dönem BİRBİRİNE karışmaz", () => {
    const [s] = adaptSkus(amazonSkusSchema.parse(LIVE_SKU));
    expect(s.advertising.period).toEqual({ from: "2026-07-01", to: "2026-07-30" });
    expect(s.sales.period).not.toEqual(s.advertising.period);
  });

  it("ACOS 0-1'den 0-100'e çevrilir — ölçek sözleşmesi", () => {
    const [s] = adaptSkus(amazonSkusSchema.parse(LIVE_SKU));
    expect(s.advertising.acos).toBeCloseTo(31.25);
  });

  it("dönemi BEYAN EDİLMEMİŞ kaynak `null` taşır, uydurulmaz", () => {
    const raw = cloneSku();
    raw.skus[0].sales.period = null as never;
    const [s] = adaptSkus(amazonSkusSchema.parse(raw));
    expect(s.sales.period).toBeNull();
  });

  it("kimliği olmayan satır LİSTELENMEZ", () => {
    /* `asin`/`title` sözleşmede zorunlu; boş string koymak olmayan bir
       ürünü varmış gibi göstermek olurdu. */
    const raw = cloneSku();
    raw.skus[0].asin = null as never;
    expect(adaptSkus(amazonSkusSchema.parse(raw))).toHaveLength(0);
  });

  it("`unknown` durumu KORUNUR — 48'in 29'u bu", () => {
    const raw = cloneSku();
    raw.skus[0].status = "unknown";
    const [s] = adaptSkus(amazonSkusSchema.parse(raw));
    expect(s.status).toBe("unknown");
    expect(() => skuHealthSchema.parse(s)).not.toThrow();
  });
});

describe("ölçüm penceresi — ODIN ADR-0138 (UI-ADR-140)", () => {
  it("kayan pencereyi OLDUĞU GİBİ taşır, sabit tarihe çevirmez", () => {
    /* Kayıt "30 Temmuz'da biten 7 günlük pencere" diyor. Onu bir tarih
       aralığına çevirmek, kaydın söylemediği bir kesinlik iddia etmek
       olurdu — `sales.period`daki hesap AYRI bir sözleşme (SkuHealth) ve
       orada beyanın aritmetiğidir. */
    const [k] = adaptKpis(amazonSchema.parse(LIVE));
    expect(k.reportPeriod).toEqual({
      basis: "rolling_window",
      windowDays: 7,
      start: null,
      end: null,
      at: null,
    });
  });

  it("sabit aralıklı reklam penceresi start/end taşır", () => {
    const raw = clone();
    (raw.kpis[0] as { report_period: unknown }).report_period = {
      start: "2026-07-01",
      end: "2026-07-30",
    };
    const [k] = adaptKpis(amazonSchema.parse(raw));
    expect(k.reportPeriod?.start).toBe("2026-07-01");
    expect(k.reportPeriod?.end).toBe("2026-07-30");
  });

  it("pencere BEYAN EDİLMEMİŞSE null — uydurulmaz", () => {
    const raw = clone();
    (raw.kpis[0] as { report_period: unknown }).report_period = null;
    const [k] = adaptKpis(amazonSchema.parse(raw));
    expect(k.reportPeriod).toBeNull();
  });

  it("penceresiz KPI hâlâ kanonik şemadan geçer", () => {
    /* Alan opsiyonel: ODIN yayınlamayan bir üretici için de sözleşme
       geçerli kalmalı. */
    const raw = clone();
    (raw.kpis[0] as { report_period: unknown }).report_period = null;
    const [k] = adaptKpis(amazonSchema.parse(raw));
    expect(() => executiveKpiSchema.parse(k)).not.toThrow();
  });
});
