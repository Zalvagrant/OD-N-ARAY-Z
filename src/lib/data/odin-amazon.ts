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

import type { DataEnvelope } from "@/types/data-envelope";
import type { ThresholdProvenance } from "@/types/executive";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { alertSchema, executiveKpiSchema } from "./schemas";
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
  as_of: z.string(),
  threshold_provenance: z.string().optional(),
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

function envelope<T>(generatedAt: string, data: T): DataEnvelope<T> {
  return {
    data,
    meta: { source: "internal", lastUpdated: generatedAt, freshness: "live" },
  };
}

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
          return envelope(raw.generated_at, adaptKpis(raw));
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
          return envelope(raw.generated_at, adaptAlerts(raw));
        },
  });
}
