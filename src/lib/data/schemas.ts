/**
 * Runtime sözleşme doğrulaması — S7 D7.4.
 *
 * KAPSAM KARARI (meclis 5/5, UI-ADR-113): yalnız `09b-verified-contracts.md`
 * kanoniktir. `09-data-contracts.md` UI-ADR-098 ile kanonik olmaktan çıktı;
 * onun listesindeki `AIPulse` · `TelemetryStream` gibi ODIN'de karşılığı
 * OLMAYAN tipler için şema YAZILMADI — "mock-only" etiketli bir şema bile
 * sahte yeteneği meşrulaştırır ve zamanla gerçek sanılır (UI-ADR-104 dersi).
 *
 * Şemalar `src/types/executive.ts` ve `src/types/screens.ts`'teki tiplerin
 * çalışma zamanı ikizidir; o dosyalar DEĞİŞTİRİLMEDİ (paralel oturum orada
 * çalışıyor). Uyum `satisfies` ile derleme zamanında kilitlenir.
 */

import { z } from "zod";
import type { Alert, ExecutiveKPI } from "@/types/executive";

/** ISO 8601 — biçim değil, ÇÖZÜLEBİLİRLİK aranır: `Date.parse` sonucu. */
const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "geçerli ISO 8601 tarih değil");

/* --------------------------------------------------------------------------
   Zarf — 09b §0 · types/data-envelope.ts
   -------------------------------------------------------------------------- */

export const dataSourceSchema = z.enum([
  "sp-api",
  "ads-api",
  "internal",
  "ai",
  "manual",
  "computed",
  "mock",
]);

export const dataMetaSchema = z
  .object({
    source: dataSourceSchema,
    lastUpdated: isoDate,
    freshness: z.enum(["live", "recent", "stale"]),
    confidence: z.number().min(0).max(100).optional(),
  })
  /* AI üretimi ise confidence ZORUNLU — 13-...md §9. Üretilemeyen güven
     skoru yerine sayı uydurmak yerine, kayıt hiç kabul edilmez. */
  .refine((m) => m.source !== "ai" || typeof m.confidence === "number", {
    message: "AI kaynaklı veri confidence olmadan kabul edilmez",
    path: ["confidence"],
  });

export function envelopeSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data, meta: dataMetaSchema });
}

/* --------------------------------------------------------------------------
   ExecutiveKPI — ODIN ADR-0143 §2 sınır zarfı (09b §10)
   -------------------------------------------------------------------------- */

export const executiveKpiSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    status: z.enum(["available", "data_required", "unavailable"]),
    /* Zarf DÜZ (ADR-0143 §2): status/value/reason, unit/currency/scale/as_of
       ile aynı seviyede. Sayı alanı `number|null` — literal "Data Required"
       buraya giremez, zaten `z.number()` onu reddeder (ADR-0135). */
    value: z.number().nullable(),
    unit: z.enum(["currency", "percent", "count", "score"]),
    currency: z.string().length(3).optional(),
    scale: z.enum(["0-1", "0-100"]).optional(),
    reason: z.string().nullable().optional(),
    asOf: isoDate,
    /* ODIN'in kayıt-başına bildirdiği pencere (ADR-0138). Şekil kaynağa
       göre değişir; `looseObject` çünkü ODIN alan ekleyebilmeli ve
       arayüz pencereyi normalleştirmez. `null` = beyan yok. */
    reportPeriod: z
      .looseObject({
        basis: z.string().nullable().optional(),
        windowDays: z.number().nullable().optional(),
        start: z.string().nullable().optional(),
        end: z.string().nullable().optional(),
        at: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    /* ODIN ADR-0146: bu seviyeyi doğuran EŞİĞİN kaynağı. "3 SKU kritik
       stokta" sayısı ölçülmüştür ama "kritik" bir sınıra dayanır ve meclis
       o sınırı gerçek veriden türetmeyi REDDETTİ (bir haftalık 18 SKU bir
       politika değil, gürültüdür). Eşiği olmayan üretici alanı ATLAR. */
    thresholdProvenance: z.enum(["unapproved_default", "owner_policy"]).optional(),
  })
  .refine((k) => k.status !== "available" || k.value !== null, {
    message: "status=available ise value sayı olmalı",
    path: ["value"],
  })
  .refine((k) => k.status === "available" || !!k.reason, {
    message: "status!=available ise reason zorunlu — neden ölçülemediği de bilgidir",
    path: ["reason"],
  })
  .refine((k) => k.unit !== "currency" || !!k.currency, {
    message: "unit=currency ise currency zorunlu (ISO kodu)",
    path: ["currency"],
  })
  /* UI-ADR-093: ölçeği bildirilmemiş yüzde, 0,18 mi %18 mi belli değildir.
     Tahmin edilirse 100 kat hata sessizce ekrana çıkar. */
  .refine((k) => k.unit !== "percent" || !!k.scale, {
    message: "unit=percent ise scale zorunlu (0-1 | 0-100)",
    path: ["scale"],
  });

/* --------------------------------------------------------------------------
   Alert — ODIN ADR-0143 §1 kanonik zarfı (09b §10)
   -------------------------------------------------------------------------- */

export const alertSchema = z.object({
  id: z.string().min(1),
  /* Sözlük ODIN'indir; UI eşleme icat etmez. */
  severity: z.enum(["critical", "risk", "warning", "info"]),
  title: z.string().min(1),
  module: z.string().min(1),
  /* `requires_action: false` olan öğe listeye asla girmez — ADR-0143 §1 bunu
     üretici tarafı sözleşmesi de yaptı. Alan zorunlu ve varsayılansızdır. */
  requiresAction: z.boolean(),
  evidence: z.array(z.string()),
  createdAt: isoDate,
  suggestedAction: z.string().optional(),
  /* ODIN ADR-0146: bu seviyeyi doğuran EŞİĞİN kaynağı. "3 SKU kritik
     stokta" sayısı ölçülmüştür ama "kritik" bir sınıra dayanır ve meclis
     o sınırı gerçek veriden türetmeyi REDDETTİ (bir haftalık 18 SKU bir
     politika değil, gürültüdür). Eşiği olmayan üretici alanı ATLAR. */
  thresholdProvenance: z.enum(["unapproved_default", "owner_policy"]).optional(),
});

/* Opportunity ve Goal/Mission için şema YOKTUR — ADR-0143 §3 ve §4 ikisini
   de KAVRAM OLARAK REDDETTİ. Fırsat, öneri kaydının görünümüdür; Mission
   Board, izlenen kararlar + vadesi gelen ertelemelerin görünümü. Reddedilmiş
   bir kavrama şema yazmak, UI-ADR-113'ün tam olarak yasakladığı şeydir:
   karşılığı olmayan tipe şema yazmak onu zamanla gerçek gösterir. */

/* --------------------------------------------------------------------------
   Derleme zamanı kilidi: şema çıktısı ile TypeScript tipi ayrışırsa burada
   patlar. İkisi elle senkronlanmaz.
   -------------------------------------------------------------------------- */

export type ExecutiveKpiParsed = z.infer<typeof executiveKpiSchema>;

/** Atanabilir değilse BURADA derleme hatası verir; çalışma zamanı kodu üretmez. */
type AssertAssignable<A extends B, B> = A;

export type _KpiMatchesType = AssertAssignable<ExecutiveKpiParsed, Partial<ExecutiveKPI>>;
export type _AlertMatchesType = AssertAssignable<z.infer<typeof alertSchema>, Partial<Alert>>;

/* --------------------------------------------------------------------------
   Goal — ODIN ADR-0034 Goal Engine v1 (UI-ADR-124)
   -------------------------------------------------------------------------- */

/**
 * ⚠️ `Goal` ≠ `Mission`. ADR-0143 §4 arayüzün UYDURDUĞU `Mission` kavramını
 * reddetti; `Goal` ise ODIN'in kendi varlığıdır — sahip `odin-data/goals.json`
 * yazar, `cockpit.py` `/api/state.goals` olarak yayınlar.
 *
 * Şema, çalışan cockpit ÖLÇÜLEREK yazıldı (31 Tem 2026, 8 kayıt):
 * `{id, level, label, target, progress_pct}`.
 */
export const goalSchema = z.object({
  id: z.string().min(1),
  /* Sözlük ODIN'indir. Ölçülen küme: urgent · weekly · quarterly.
     Yeni bir seviye eklenirse şema REDDEDER — sessizce "diğer" grubuna
     düşürmek, bilinmeyen bir aciliyeti bilinen gibi göstermek olurdu. */
  level: z.enum(["urgent", "weekly", "quarterly"]),
  label: z.string().min(1),
  /* Cockpit tanımsız hedefi BOŞ DİZE olarak yayınlıyor (`goal.get("target","")`),
     `null` değil. Boş dize "hedef yok" demektir ve öyle taşınır — ekranda
     boş bir satır olarak çizilmez. */
  target: z.string(),
  /*
   * SAHİBİN YAZDIĞI DEĞER; UI TÜRETMEZ.
   *
   * ADR-0143 §4: "ilerleme yüzdesi kavramı kendi ölçülmüş kaynağını ister ve
   * burada yaratılmıyor." Ölçüm: 3 hedefte sayı (%25/%0/%0), 5 çeyreklikte
   * `null`. `null` → çubuk yok, yüzde yok, **`0` YOK** (meclis 2/2):
   * `0`, "ölçüldü ve sıfır" demektir; doğrusu "ölçülmüyor"dur.
   */
  progressPct: z.number().min(0).max(100).nullable(),
});

/* --------------------------------------------------------------------------
   RuntimeDirector — ODIN ADR-0148 (UI-ADR-127)
   -------------------------------------------------------------------------- */

const directorStatusSchema = z.enum(["healthy", "stale", "failed", "unknown"]);

export const runtimeDirectorSchema = z.object({
  id: z.string().min(1),
  status: directorStatusSchema,
  lastBeat: isoDate.nullable(),
  /* `null` bilinmeyen cadence demektir ve KABUL EDİLİR — ODIN tahmin
     etmiyor, arayüz de etmemeli. */
  beatIntervalMs: z.number().positive().nullable(),
  /* KÜMÜLATİF (ADR-0148 §6). Ardışık seri ölçülmüyor. */
  failuresTotal: z.number().int().min(0),
  lastError: z.string().nullable(),
  jobs: z.array(
    z.object({
      id: z.string().min(1),
      status: directorStatusSchema,
      lastBeat: isoDate.nullable(),
      cadence: z.string().nullable().optional(),
      lastError: z.string().nullable().optional(),
    })
  ),
});

/* --------------------------------------------------------------------------
   SkuHealth — ODIN ADR-0149 (UI-ADR-128)
   -------------------------------------------------------------------------- */

const metricPeriodSchema = z.object({ from: isoDate, to: isoDate }).nullable();

/* ADR-0085 Explainability Envelope: türetilmiş bir skorun gerekçesi
   makine kodu + insan cümlesi taşır; arayüz cümle KURMAZ. */
const scoreFactorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  direction: z.enum(["positive", "negative", "neutral"]),
  contribution: z.number().nullable(),
});

const moneySchema = z
  .object({ amount: z.number(), currency: z.string().min(1) })
  .nullable();

export const skuHealthSchema = z
  .object({
    sku: z.string().min(1),
    asin: z.string().min(1),
    title: z.string().min(1),
    /* ODIN skor YAYINLAMIYOR (ADR-0149). Alan duruyor ki bir gün bir
       skorlama politikası çıkarsa sözleşme değişmeden geçebilsin. */
    healthScore: z.number().min(0).max(100).nullable(),
    healthScoreExplanation: z.array(scoreFactorSchema).nullable(),
    /* ODIN'in BEŞ değerli sözlüğü — `unknown` dahil (UI-ADR-128). */
    status: z.enum(["ok", "warn", "critical", "no_movement", "unknown"]),
    statusBasis: z.enum(["health_score", "rule_set"]),
    thresholdProvenance: z.enum(["unapproved_default", "owner_policy"]).optional(),
    inventoryAsOf: isoDate.nullable(),
    unitsAvailable: z.number().nullable(),
    daysOfSupply: z.number().nullable(),
    estimatedStockoutAt: isoDate.nullable(),
    reorderUnits: z.number().nullable(),
    sales: z.object({
      period: metricPeriodSchema,
      unitsSold: z.number().nullable(),
      revenue: moneySchema,
      conversionRate: z.number().nullable(),
      buyBoxRate: z.number().nullable(),
    }),
    advertising: z.object({
      period: metricPeriodSchema,
      spend: moneySchema,
      sales: moneySchema,
      acos: z.number().nullable(),
    }),
    price: moneySchema,
  })
  /* Gerekçesiz skor gösterilmez (UI-ADR-104): skor doluysa açıklaması da
     dolu olmalı. ODIN bugün ikisini de null yolluyor, yani şart boşta —
     ama sözleşme, skor geldiği gün gerekçesini de zorunlu tutuyor. */
  .refine((s) => s.healthScore === null || !!s.healthScoreExplanation?.length, {
    message: "healthScore doluysa healthScoreExplanation zorunlu",
    path: ["healthScoreExplanation"],
  });
