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
import type { Alert, ExecutiveKPI, Opportunity } from "@/types/executive";
import type { Goal } from "@/types/screens";

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
   ExecutiveKPI v1 — 09b §10 (FR-0046 · UI-ADR-106)
   -------------------------------------------------------------------------- */

const metricValueSchema = z
  .object({
    status: z.enum(["available", "data_required", "unavailable"]),
    value: z.number().nullable(),
    reason: z.string().min(1).optional(),
  })
  .refine((v) => (v.status === "available" ? typeof v.value === "number" : v.value === null), {
    message: "status=available ise value sayı, değilse null olmalı",
    path: ["value"],
  })
  /* Ölçülemediğinin NEDENİ de bir bilgidir (ADR-0135). Sebepsiz bir
     "veri yok" kullanıcıya hiçbir şey söylemez. */
  .refine((v) => v.status === "available" || !!v.reason, {
    message: "status!=available ise reason zorunlu",
    path: ["reason"],
  });

export const executiveKpiSchema = z
  .object({
    id: z.string().min(1),
    metricKey: z.string().min(1),
    label: z.string().min(1),
    value: metricValueSchema,
    unit: z.enum(["currency", "percent", "count", "score"]),
    currencyCode: z.string().length(3).optional(),
    scale: z.enum(["0-1", "0-100"]).optional(),
    asOf: isoDate,
    source: z.string().min(1),
    /* FR-0043 katmanları: kaynağı yok, mock dahi doldurmaz. Yasaklanmaz —
       ODIN üretmeye başlarsa sözleşme değişmeden geçebilsin. */
    trend: z
      .object({
        direction: z.enum(["up", "down", "flat"]),
        changePercent: z.number(),
        comparedTo: z.string(),
      })
      .optional(),
    sparkline: z.array(z.number().nullable()).optional(),
    aiInsight: z.string().optional(),
    confidence: z.number().min(0).max(100).optional(),
    risk: z.enum(["none", "low", "medium", "high", "critical"]).optional(),
    owner: z.string().optional(),
  })
  .refine((k) => k.unit !== "currency" || !!k.currencyCode, {
    message: "unit=currency ise currencyCode zorunlu (ISO kodu)",
    path: ["currencyCode"],
  })
  /* UI-ADR-093: ölçeği bildirilmemiş yüzde, 0,18 mi %18 mi belli değildir.
     Tahmin edilirse 100 kat hata sessizce ekrana çıkar. */
  .refine((k) => k.unit !== "percent" || !!k.scale, {
    message: "unit=percent ise scale zorunlu (0-1 | 0-100)",
    path: ["scale"],
  });

/* --------------------------------------------------------------------------
   Alert v1 · Opportunity v1 — 09b §10
   -------------------------------------------------------------------------- */

export const alertSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  title: z.string().min(1),
  /* Üretici aksiyon gerekip gerekmediğini belirleyemiyorsa kaydı kanonik
     Alert olarak YAYINLAMAZ — bu yüzden alan zorunlu ve varsayılansızdır. */
  requiresAction: z.boolean(),
  asOf: isoDate,
  summary: z.string().optional(),
  /* `.optional()` null'ı REDDEDER ve bu kasıtlıdır: dört üreticinin ortak
     severity semantiği yok; alanı atlamak dürüst, null yazmak sahtedir. */
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
});

export const opportunitySchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  /* Uygulanabilir öneri veremeyen kayıt Opportunity DEĞİLDİR. */
  suggestedAction: z.string().min(1),
  asOf: isoDate,
  evidence: z.array(z.string()).optional(),
});

/* --------------------------------------------------------------------------
   Goal — 09b §10 (ADR-0132 · UI-ADR-107), cockpit.py yayınının birebiri
   -------------------------------------------------------------------------- */

export const goalSchema = z.object({
  id: z.string().min(1),
  level: z.string().min(1),
  label: z.string().min(1),
  target: z.string().nullable(),
  /* TUZAK: goals.alignment() hedef tanımsızken nötr 50 döner — o "ölçülmedi"
     demektir. Sınır adaptörü null'a çevirir; %50 ilerleme ÇİZİLMEZ. */
  progressPct: z.number().min(0).max(100).nullable(),
});

/* --------------------------------------------------------------------------
   Derleme zamanı kilidi: şema çıktısı ile TypeScript tipi ayrışırsa burada
   patlar. İkisi elle senkronlanmaz.
   -------------------------------------------------------------------------- */

export type ExecutiveKpiParsed = z.infer<typeof executiveKpiSchema>;

/** Atanabilir değilse BURADA derleme hatası verir; çalışma zamanı kodu üretmez. */
type AssertAssignable<A extends B, B> = A;

export type _KpiMatchesType = AssertAssignable<ExecutiveKpiParsed, Partial<ExecutiveKPI>>;
export type _AlertMatchesType = AssertAssignable<z.infer<typeof alertSchema>, Partial<Alert>>;
export type _OppMatchesType = AssertAssignable<
  z.infer<typeof opportunitySchema>,
  Partial<Opportunity>
>;
export type _GoalMatchesType = AssertAssignable<z.infer<typeof goalSchema>, Partial<Goal>>;
