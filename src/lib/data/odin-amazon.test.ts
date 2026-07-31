/**
 * `/api/amazon` adaptörü — S10 (UI-ADR-126).
 *
 * Fixture ODIN'in CANLI yanıtından kopyalandı
 * (`GET http://127.0.0.1:8765/api/amazon`, 2026-07-31). Uydurulmuş bir
 * örnek, sözleşme değiştiğinde testi yeşil bırakır.
 */

import { describe, expect, it } from "vitest";

import { adaptAlerts, adaptKpis, amazonSchema } from "./odin-amazon";
import { alertSchema, executiveKpiSchema } from "./schemas";

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
