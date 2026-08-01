"use client";

/**
 * `/api/amazon` adaptörü — S10 (UI-ADR-126).
 *
 * ODIN ADR-0147 / FR-0049 ile promote edilmiş Amazon verisini yayınlamaya
 * başladı: `odin-data/core/`teki gerçek SP-API ve Ads kayıtlarından
 * türetilmiş ADR-0143 KPI ve Alert zarfları. S8'in `backend-istekleri.md`
 * #1 talebi buydu.
 *
 * BU DOSYA NEDEN İNCE: ODIN'in yayını ile arayüzün kanonik tipi AYNI
 * SÖZLEŞMEDİR (ADR-0143 §1–§2) — zarf düz, alanlar birebir. Geriye yalnız
 * snake_case → camelCase kalıyor. Değer dönüştürülmez, alan türetilmez,
 * oran hesaplanmaz; `odin-state.ts`'in `adaptGoals`'ı için geçerli olan
 * kural burada da geçerli.
 *
 * `source: "internal"`: yayın ODIN'in KENDİ projeksiyonudur. Altındaki
 * kayıtlar SP-API ve Ads'ten gelse de tek zarf ikisini birden
 * etiketleyemez; zarfı "sp-api" damgalamak reklam sayıları için yalan
 * olurdu.
 */

import { z } from "zod";

import { internalEnvelope } from "@/types/data-envelope";
import type { Money, ThresholdProvenance } from "@/types/executive";
import type { MetricPeriod, SkuHealth } from "@/types/screens";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { alertSchema, executiveKpiSchema, skuHealthSchema } from "./schemas";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

export type AmazonKpi = z.infer<typeof executiveKpiSchema>;
export type AmazonAlert = z.infer<typeof alertSchema>;

/**
 * `/api/amazon`ın bu adaptörün OKUDUĞU kısmı.
 *
 * ODIN kendi hızında alan ekleyebilmeli (kanonik kaynak ODIN'dir), bu
 * yüzden bilinmeyen alanlar reddedilmez — yalnız görmezden gelinir.
 *
 * `report_period` ODIN'in ADR-0147'de eklediği bir GENİŞLETMEDİR ve
 * ADR-0143'ün dondurduğu zarfta yok. Bugün OKUNMUYOR: arayüzün yaş
 * sorusunu `asOf` zaten cevaplıyor. Pencereyi de göstermek isterse
 * (7 günlük kayan / anlık / 2026-07-01→30 gerçekten farklı pencereler)
 * bu ayrı bir sözleşme genişletmesidir ve kendi kararını hak eder.
 */
const rawKpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["available", "data_required", "unavailable"]),
  value: z.number().nullable(),
  unit: z.enum(["currency", "percent", "count", "score"]),
  currency: z.string().nullable(),
  scale: z.string().nullable(),
  reason: z.string().nullable(),
  /**
   * `as_of` NULL OLABİLİR — UI-ADR-158.
   *
   * `z.string()` idi ve bu, ODIN'in TASARLADIĞI bir durumu reddediyordu:
   * `amazon_api.py:108` bu alanı `(prov or {}).get("collection_date")`
   * ile dolduruyor; kayıt henüz promote edilmemişse `None` döner. Aynı
   * KPI'ın gerekçesi zaten "sipariş kaydı yayınlanmadı" diyor — yani
   * ODIN "bu metrik yok" demeyi biliyor, arayüz onu duymuyordu.
   *
   * Bedeli tek bir alanla sınırlı DEĞİLDİ: yük TEK PARÇA parse edildiği
   * için bir kaydın `as_of`u null olduğunda TÜM KPI listesi VE aynı
   * yükten beslenen ALARM listesi birden kararıyordu (fail-total).
   */
  as_of: z.string().nullable(),
  threshold_provenance: z.string().optional(),
  /* ADR-0138: kaydın KENDİ bildirdiği pencere. Şekli kaynağa göre
     değişiyor (kayan pencere / anlık / sabit aralık), o yüzden gevşek. */
  report_period: z
    .looseObject({
      basis: z.string().optional(),
      window_days: z.number().optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      as_of: z.string().optional(),
    })
    .nullable()
    .optional(),
});

const rawAlertSchema = z.object({
  id: z.string(),
  severity: z.string(),
  title: z.string(),
  module: z.string(),
  requires_action: z.boolean(),
  evidence: z.array(z.string()),
  created_at: z.string(),
  suggested_action: z.string().nullable(),
  threshold_provenance: z.string().optional(),
});

export const amazonSchema = z.object({
  generated_at: z.string(),
  kpis: z.array(rawKpiSchema),
  alerts: z.array(rawAlertSchema),
});

type RawAmazon = z.infer<typeof amazonSchema>;


/**
 * Eşik kaynağı — ODIN ADR-0146.
 *
 * Bilinmeyen bir değer ATLANIR. Uydurulmuş bir "onaylı" damgası, hiç
 * damga olmamasından çok daha tehlikelidir: birincisi yanlış bir güven
 * üretir, ikincisi yalnızca sessizdir.
 */
function threshold(
  raw: string | undefined
): { thresholdProvenance?: ThresholdProvenance } {
  return raw === "unapproved_default" || raw === "owner_policy"
    ? { thresholdProvenance: raw }
    : {};
}

/**
 * ODIN'in severity sözlüğü KANONİKTİR (sahip kararı, 31 Temmuz 2026).
 * Arayüz eşleme icat etmez; sözlük dışı bir değer gelirse kayıt şemadan
 * GEÇMEZ ve bölüm gerekçeli hata basar — sessizce rozetsiz göstermek,
 * ODIN'in sözleşmeyi genişlettiğini gizlerdi.
 */
export function adaptKpis(raw: RawAmazon): AmazonKpi[] {
  return raw.kpis.map((k) => ({
    id: k.id,
    label: k.label,
    status: k.status,
    value: k.value,
    unit: k.unit,
    ...(k.currency ? { currency: k.currency } : {}),
    ...(k.scale === "0-1" || k.scale === "0-100" ? { scale: k.scale } : {}),
    reason: k.reason,
    asOf: k.as_of,
    /* YALNIZ yeniden adlandırma — pencere NORMALLEŞTİRİLMİYOR. Kayıt
       "30 Temmuz'da biten 7 günlük pencere" diyorsa ekran da onu der;
       sabit bir tarih aralığına çevirmek, kaydın söylemediği bir
       kesinlik iddia etmek olurdu (UI-ADR-140). */
    reportPeriod: k.report_period
      ? {
          basis: k.report_period.basis ?? null,
          windowDays: k.report_period.window_days ?? null,
          start: k.report_period.start ?? null,
          end: k.report_period.end ?? null,
          at: k.report_period.as_of ?? null,
        }
      : null,
    ...threshold(k.threshold_provenance),
  }));
}

export function adaptAlerts(raw: RawAmazon): AmazonAlert[] {
  return raw.alerts.map((a) => ({
    id: a.id,
    severity: a.severity as AmazonAlert["severity"],
    title: a.title,
    module: a.module,
    requiresAction: a.requires_action,
    evidence: a.evidence,
    createdAt: a.created_at,
    ...(a.suggested_action ? { suggestedAction: a.suggested_action } : {}),
    ...threshold(a.threshold_provenance),
  }));
}

const AMAZON_PATH = "/api/amazon";

/** KPI ve Alert AYNI yükten gelir; anahtarlar ayrı, istek tek olsun diye
 *  React Query'nin aynı `queryKey`i paylaşmazlar — iki bölüm bağımsız
 *  yenilenebilmeli. Yük 5 KB; ikinci istek ölçülebilir bir maliyet değil. */
export function useAmazonKpis(): OdinQueryResult<AmazonKpi[]> {
  return useOdinQuery({
    key: ["odin", "amazon", "kpis"],
    module: "amazon",
    schema: z.array(executiveKpiSchema),
    load: IS_MOCK
      ? async () => loadMock("amazon.kpis")
      : async (signal) => {
          const raw = amazonSchema.parse(await httpLoad(AMAZON_PATH, { signal }));
          return internalEnvelope(raw.generated_at, adaptKpis(raw));
        },
  });
}

export function useAmazonAlerts(): OdinQueryResult<AmazonAlert[]> {
  return useOdinQuery({
    key: ["odin", "amazon", "alerts"],
    module: "amazon",
    schema: z.array(alertSchema),
    load: IS_MOCK
      ? async () => loadMock("amazon.alerts")
      : async (signal) => {
          const raw = amazonSchema.parse(await httpLoad(AMAZON_PATH, { signal }));
          return internalEnvelope(raw.generated_at, adaptAlerts(raw));
        },
  });
}

/* --------------------------------------------------------------------------
   Per-SKU — ODIN ADR-0149 (UI-ADR-128)
   -------------------------------------------------------------------------- */

const rawPeriodSchema = z
  .object({
    basis: z.string().optional(),
    window_days: z.number().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    as_of: z.string().optional(),
  })
  .nullable();

const rawSkuSchema = z.object({
  sku: z.string(),
  asin: z.string().nullable(),
  title: z.string().nullable(),
  health_score: z.number().nullable(),
  health_score_explanation: z.array(z.unknown()).nullable(),
  status: z.enum(["ok", "warn", "critical", "no_movement", "unknown"]).nullable(),
  status_basis: z.string(),
  threshold_provenance: z.string().nullable().optional(),
  inventory_as_of: z.string().nullable(),
  units_available: z.number().nullable(),
  days_of_supply: z.number().nullable(),
  estimated_stockout_at: z.string().nullable(),
  reorder_units: z.number().nullable(),
  sales: z.object({
    period: rawPeriodSchema,
    units_sold: z.number().nullable(),
    revenue: z.number().nullable(),
    conversion_rate: z.number().nullable(),
    buy_box_rate: z.number().nullable(),
  }),
  advertising: z.object({
    period: rawPeriodSchema,
    currency: z.string().nullable(),
    spend: z.number().nullable(),
    sales: z.number().nullable(),
    acos: z.number().nullable(),
  }),
  price: z.number().nullable(),
  currency: z.string().nullable(),
});

export const amazonSkusSchema = z.object({
  generated_at: z.string(),
  skus: z.array(rawSkuSchema),
});

/**
 * ODIN'in dönem nesnesi → arayüzün `{from, to}`su.
 *
 * `rolling_window` için başlangıç `end - window_days` ile HESAPLANIR ve bu
 * bir tahmin DEĞİLDİR: kayıt "30 Temmuz'da biten 7 günlük pencere" diye
 * beyan ediyor, başlangıç o beyanın aritmetik sonucudur.
 *
 * Dönem beyan edilmemişse `null` döner — arayüz uydurmaz.
 */
function toPeriod(raw: z.infer<typeof rawPeriodSchema>): MetricPeriod | null {
  if (!raw) return null;
  if (raw.start && raw.end) return { from: raw.start, to: raw.end };
  if (raw.end && typeof raw.window_days === "number") {
    const to = new Date(raw.end);
    const from = new Date(to.getTime() - (raw.window_days - 1) * 86_400_000);
    return { from: from.toISOString().slice(0, 10), to: raw.end };
  }
  return null;
}

const money = (v: number | null, currency: string | null): Money | null =>
  v === null || !currency ? null : { amount: v, currency };

export function adaptSkus(raw: z.infer<typeof amazonSkusSchema>): SkuHealth[] {
  return raw.skus
    /* Kimliği olmayan satır GÖSTERİLMEZ: `asin`/`title` sözleşmede
       zorunlu ve ODIN envanter kaydı yoksa null gönderiyor. Boş string
       koymak, olmayan bir ürünü varmış gibi listelemek olurdu. */
    .filter((s) => s.asin && s.title && s.status)
    .map((s) => ({
      sku: s.sku,
      asin: s.asin!,
      title: s.title!,
      /* ODIN skor YAYINLAMIYOR ve arayüz TÜRETMEZ (ADR-0149). */
      healthScore: null,
      healthScoreExplanation: null,
      status: s.status!,
      statusBasis: s.status_basis === "health_score" ? "health_score" : "rule_set",
      ...(s.threshold_provenance === "unapproved_default" ||
      s.threshold_provenance === "owner_policy"
        ? { thresholdProvenance: s.threshold_provenance }
        : {}),
      inventoryAsOf: s.inventory_as_of,
      unitsAvailable: s.units_available,
      daysOfSupply: s.days_of_supply,
      estimatedStockoutAt: s.estimated_stockout_at,
      reorderUnits: s.reorder_units,
      sales: {
        period: toPeriod(s.sales.period),
        unitsSold: s.sales.units_sold,
        revenue: money(s.sales.revenue, s.currency),
        conversionRate: s.sales.conversion_rate,
        buyBoxRate: s.sales.buy_box_rate,
      },
      advertising: {
        period: toPeriod(s.advertising.period),
        spend: money(s.advertising.spend, s.advertising.currency),
        sales: money(s.advertising.sales, s.advertising.currency),
        /* ODIN ACOS'u 0-1 oranı olarak veriyor; ekran 0-100 bekliyor. */
        acos: s.advertising.acos === null ? null : s.advertising.acos * 100,
      },
      price: money(s.price, s.currency),
    }));
}

export function useAmazonSkus(): OdinQueryResult<SkuHealth[]> {
  return useOdinQuery({
    key: ["odin", "amazon", "skus"],
    module: "amazon",
    schema: z.array(skuHealthSchema),
    load: IS_MOCK
      ? async () => loadMock("amazon.skus")
      : async (signal) => {
          const raw = amazonSkusSchema.parse(await httpLoad(AMAZON_PATH, { signal }));
          return internalEnvelope(raw.generated_at, adaptSkus(raw));
        },
  });
}
