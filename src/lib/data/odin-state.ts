"use client";

/**
 * `/api/state` adaptörü — S8 (UI-ADR-124).
 *
 * ODIN'in cockpit'i tek bir büyük projeksiyon yayınlar (`/api/state`, ~117 KB,
 * 30 anahtar) ve o yükün **zarfı yoktur**: ham alanlar döner. Bu modül onu
 * arayüzün zarf sözleşmesine sokar. Adaptör KATMANI burasıdır; ekranlar ham
 * ODIN yükünü hiç görmez.
 *
 * NE YAPMAZ: hesap. Oran, skor, ilerleme türetmez. Alanı olmayan bir şeyi
 * "hesaplayıp" göstermek, arayüzün icat etmesi demektir.
 */

import { z } from "zod";

import type { DataEnvelope } from "@/types/data-envelope";
import type { IntelligenceCategory, IntelligenceItem } from "@/types/screens";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import {
  alertSchema,
  executiveKpiSchema,
  type ExecutiveKpiParsed,
  goalSchema,
  opportunitySchema,
  runtimeDirectorSchema,
} from "./schemas";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

export type Goal = z.infer<typeof goalSchema>;

/** `/api/state`in bu adaptörün OKUDUĞU kısmı — gerisi görmezden gelinir. */
export const stateSchema = z.object({
  generated_at: z.string(),
  goals: z.array(
    z.object({
      id: z.string(),
      level: z.string(),
      label: z.string(),
      target: z.string(),
      progress_pct: z.number().nullable(),
    })
  ),
});

/**
 * Ham `/api/state` → zarf.
 *
 * `source: "internal"` çünkü veri SP-API'den DEĞİL, ODIN'in kendi
 * projeksiyonundan geliyor (`DataSource` union'ında tanımlı değer).
 * `freshness` burada yazılmaz: `parseEnvelope` onu `lastUpdated`tan
 * modül eşiğine göre İSTEMCİDE hesaplar (UI-ADR-115) — adaptörün
 * "live" damgalaması yanıltıcı olurdu.
 */
function envelope<T>(generatedAt: string, data: T): DataEnvelope<T> {
  return {
    data,
    meta: { source: "internal", lastUpdated: generatedAt, freshness: "live" },
  };
}

/** snake_case → camelCase. Değer DÖNÜŞTÜRÜLMEZ, yalnız yeniden adlandırılır. */
export function adaptGoals(raw: z.infer<typeof stateSchema>) {
  return raw.goals.map((g) => ({
    id: g.id,
    level: g.level,
    label: g.label,
    target: g.target,
    progressPct: g.progress_pct,
  }));
}

/**
 * ODIN'in hedefleri — arayüzdeki İLK canlı ODIN verisi.
 *
 * Mock modda ODIN'e HİÇ gidilmez; gerçek modda mock'a hiç bakılmaz. İki yol
 * asla karışmaz: aynı ekranda gerçek ve sahte sayıların yan yana durması,
 * sahte verinin en tehlikeli hâlidir.
 */
export function useOdinGoals(): OdinQueryResult<Goal[]> {
  return useOdinQuery({
    key: ["odin", "goals"],
    module: "default",
    schema: z.array(goalSchema),
    load: IS_MOCK
      ? async () => loadMock("goals.items")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = stateSchema.parse(raw);
          return envelope(parsed.generated_at, adaptGoals(parsed));
        },
  });
}

/* --------------------------------------------------------------------------
   Directors — ODIN ADR-0148 (UI-ADR-127)
   -------------------------------------------------------------------------- */

/**
 * ODIN'in `directors` yayını — zamanlanmış runtime işlerinin, her işin
 * KENDİ beyan ettiği agent'a göre gruplanmış sağlığı.
 *
 * Adaptör YOK: ODIN zaten camelCase ve kanonik şekilde yayınlıyor
 * (ADR-0148 sözleşmeyi bu şekilde dondurdu). Yeniden adlandırma bile
 * gerekmiyor — yalnız doğrulama.
 *
 * Hüküm (`status`) ODIN'de hesaplanır. Arayüz eşik TUTMAZ: eski
 * "beatIntervalMs × 3" kuralı UI icadıydı ve UI-ADR-111 ile kaldırıldı.
 */
const directorsStateSchema = z.object({
  generated_at: z.string(),
  /* ODIN okunamayan sağlık durumunu `null` yayınlar — boş dizi DEĞİL.
     "Okuyamadım" ile "hiç direktör yok" aynı şey değildir. */
  directors: z.array(runtimeDirectorSchema).nullable(),
});

export type RuntimeDirectorParsed = z.infer<typeof runtimeDirectorSchema>;

export function useOdinDirectors(): OdinQueryResult<RuntimeDirectorParsed[]> {
  return useOdinQuery({
    key: ["odin", "directors"],
    module: "default",
    schema: z.array(runtimeDirectorSchema),
    load: IS_MOCK
      ? async () => loadMock("briefing.directors.runtime")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = directorsStateSchema.parse(raw);
          if (parsed.directors === null) {
            /* Fail-closed: ODIN sağlık durumunu okuyamadığını söylüyor.
               Boş dizi göstermek "hiçbir direktör yok" iddiası olurdu. */
            throw new Error("ODIN direktör sağlığını okuyamadı");
          }
          return envelope(parsed.generated_at, parsed.directors);
        },
  });
}

/* --------------------------------------------------------------------------
   Runtime Alerts — ODIN ADR-0151 (UI-ADR-129)
   -------------------------------------------------------------------------- */

/**
 * ODIN'in `alerts` yayını — üst üste başarısız olan zamanlanmış işler.
 *
 * `module: "runtime"` ADR-0151 ile ADR-0143'ün sözlüğüne AÇIKÇA eklendi:
 * altyapı arızası bir iş sinyalidir. Sessizce ölmüş bir çıkarım işi, dört
 * günlük verinin kaybolma biçimiydi (BR-0014).
 *
 * Adaptör YOK — ODIN kanonik zarfı camelCase'e yakın yayınlıyor; yalnız
 * snake_case alan adları çevriliyor. Eşik, gruplama ve `requires_action`
 * kararı ODIN'de; arayüz hiçbirini hesaplamaz.
 *
 * BOŞ LİSTE NORMAL VE DOĞRU HÂLDİR. Hiç boşalmayan bir alarm listesi,
 * kimsenin okumadığı bir listedir.
 */
const rawRuntimeAlertSchema = z.object({
  id: z.string(),
  severity: z.enum(["critical", "risk", "warning", "info"]),
  title: z.string(),
  module: z.string(),
  requires_action: z.boolean(),
  evidence: z.array(z.string()),
  created_at: z.string(),
  suggested_action: z.string().nullable().optional(),
  occurrence_count: z.number().optional(),
  first_seen: z.string().nullable().optional(),
  last_seen: z.string().nullable().optional(),
  affected_job: z.string().optional(),
});

const alertsStateSchema = z.object({
  generated_at: z.string(),
  /* ODIN sağlık dosyasını okuyamazsa `null` yayınlar — boş dizi DEĞİL.
     Boş liste "her şey yolunda" iddiasıdır; okunamayan bir dosya o
     iddianın kanıtı değildir. */
  alerts: z.array(rawRuntimeAlertSchema).nullable(),
});

export function useOdinAlerts(): OdinQueryResult<z.infer<typeof alertSchema>[]> {
  return useOdinQuery({
    key: ["odin", "alerts"],
    module: "default",
    schema: z.array(alertSchema),
    load: IS_MOCK
      ? async () => loadMock("briefing.risks")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = alertsStateSchema.parse(raw);
          if (parsed.alerts === null) {
            throw new Error("ODIN çalışma zamanı sağlığını okuyamadı");
          }
          return envelope(
            parsed.generated_at,
            parsed.alerts.map((a) => ({
              id: a.id,
              severity: a.severity,
              title: a.title,
              module: a.module,
              requiresAction: a.requires_action,
              evidence: a.evidence,
              createdAt: a.created_at,
              ...(a.suggested_action
                ? { suggestedAction: a.suggested_action }
                : {}),
            }))
          );
        },
  });
}

/* --------------------------------------------------------------------------
   Opportunities — ODIN ADR-0154 (UI-ADR-141)
   -------------------------------------------------------------------------- */

/**
 * ODIN'in `opportunities` yayını — iyileştirme kayıtları üzerinde bir
 * GÖRÜNÜM, ikinci bir kayıt türü değil (ADR-0143 §3'ün şartı).
 *
 * FİLTRE ODIN'DE. Ekran eskiden "pozitif sınıfı hangi alanın işaretlediği
 * ODIN'de bildirilmedi, bu yüzden FİLTRE UYGULANMIYOR" yazıyordu — bu
 * dürüst ama eksik bir hâldi. ADR-0154 kuralı beyan etti: yalnız
 * `detected` durumundakiler ve yalnız uygulanabilir bir adımı olanlar
 * yayınlanır. Arayüz artık kendi filtresini icat etmediği gibi, eksik
 * filtre uyarısını da taşımıyor.
 *
 * SIRALAMA da ODIN'de (`prioritize()`, deterministik). Liste geldiği
 * sırada gösterilir; arayüz yeniden sıralarsa sahibin gördüğü öncelik
 * ODIN'in gerekçelendirebildiği öncelik olmaktan çıkar.
 */
const opportunitiesStateSchema = z.object({
  generated_at: z.string(),
  /* `null` = kayıt defteri okunamadı. Boş dizi "hiç fırsat yok" İDDİASIDIR
     ve okunamayan bir defter o iddianın kanıtı değildir. */
  opportunities: z
    .array(
      z.object({
        id: z.string(),
        source: z.string(),
        title: z.string(),
        summary: z.string(),
        suggested_action: z.string(),
        as_of: z.string(),
        evidence: z.array(z.string()),
        category: z.string().nullable().optional(),
        priority_level: z.string().nullable().optional(),
      })
    )
    .nullable(),
});

export type Opportunity = z.infer<typeof opportunitySchema>;

export function useOdinOpportunities(): OdinQueryResult<Opportunity[]> {
  return useOdinQuery({
    key: ["odin", "opportunities"],
    module: "default",
    schema: z.array(opportunitySchema),
    load: IS_MOCK
      ? async () => loadMock("briefing.opportunities")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = opportunitiesStateSchema.parse(raw);
          if (parsed.opportunities === null) {
            throw new Error("ODIN iyileştirme kayıtlarını okuyamadı");
          }
          return envelope(
            parsed.generated_at,
            parsed.opportunities.map((o) => ({
              id: o.id,
              source: o.source,
              title: o.title,
              summary: o.summary,
              suggestedAction: o.suggested_action,
              asOf: o.as_of,
              evidence: o.evidence,
              category: o.category ?? null,
              priorityLevel: o.priority_level ?? null,
            }))
          );
        },
  });
}

/* --------------------------------------------------------------------------
   Intelligence Feed — `/api/state.timeline` (S10 · G3)
   -------------------------------------------------------------------------- */

const timelineStateSchema = z.object({
  generated_at: z.string(),
  timeline: z.array(
    z.object({
      seq: z.number(),
      ts: z.string(),
      event: z.string(),
      actor: z.string(),
    })
  ),
});

/** ODIN olay adının ALAN kısmı → arayüz kategorisi.
 *
 *  Yalnız gerekçelendirilebilen eşlemeler burada. Bir Amazon olayını
 *  `amazon_anomaly` saymak gibi bir şey YOK: ODIN'in `amazon.*` olayı bir
 *  anomali değil, sadece Amazon alanında olan bir şey. Eşleşmeyen her olay
 *  `director_activity` olur — tipin kendi tanımı "olayı üreten Director /
 *  modül" ve `actor` alanı gerçek kaynağı zaten taşıyor, yani hiçbir şey
 *  gizlenmiyor ya da yanlış etiketlenmiyor. */
const EVENT_DOMAIN_CATEGORY: Record<string, IntelligenceCategory> = {
  risk: "critical_risk",
  recommendation: "ai_recommendation",
  knowledge: "new_knowledge",
  decision: "pending_approval",
  execution: "pending_approval",
  secrets: "security_event",
};

/** ODIN olaylarında ÖNCELİK YOKTUR ve uydurulmayacak.
 *
 *  `IntelligenceItem.priority` sıralamayı sürüyor (1 en üstte) ve bileşen
 *  eşitlikte "yeni olan üstte" diyor. Hepsine aynı değeri vermek, akışı
 *  KRONOLOJİK yapar — verinin desteklediği tek sıralama budur. Kategoriden
 *  öncelik türetmek (risk=1, onay=2 …) ODIN'de karşılığı olmayan bir
 *  aciliyet sırası icat etmek olurdu. */
const NO_PRIORITY_SIGNAL = 3 as const;

export function useOdinFeed(): OdinQueryResult<IntelligenceItem[]> {
  return useOdinQuery({
    key: ["odin", "feed"],
    module: "default",
    schema: z.array(z.custom<IntelligenceItem>()),
    load: IS_MOCK
      ? async () => loadMock("feed.items")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = timelineStateSchema.parse(raw);
          return envelope(
            parsed.generated_at,
            parsed.timeline.map((e) => ({
              id: String(e.seq),
              category:
                EVENT_DOMAIN_CATEGORY[e.event.split(".")[0]] ??
                "director_activity",
              title: e.event,
              at: e.ts,
              priority: NO_PRIORITY_SIGNAL,
              actor: e.actor,
            }))
          );
        },
  });
}

/* --------------------------------------------------------------------------
   Executive KPI şeridi — `/api/state.health_score.components` (S10 · G3)
   -------------------------------------------------------------------------- */

const healthScoreStateSchema = z.object({
  generated_at: z.string(),
  health_score: z.object({
    components: z.array(
      z.object({
        name: z.string(),
        value: z.number().nullable(),
        detail: z.string(),
      })
    ),
  }),
});

export function useOdinHealthKpis(): OdinQueryResult<ExecutiveKpiParsed[]> {
  return useOdinQuery({
    key: ["odin", "health-kpis"],
    module: "default",
    schema: z.array(executiveKpiSchema),
    load: IS_MOCK
      ? async () => loadMock("briefing.kpis")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = healthScoreStateSchema.parse(raw);
          return envelope(
            parsed.generated_at,
            parsed.health_score.components.map((c) => ({
              id: c.name,
              label: c.name,
              /* ODIN ölçemediğinde `value: null` yayınlıyor ve gerekçesini
                 `detail`de söylüyor — zarf zaten ADR-0143 şeklinde. */
              status: c.value === null ? ("data_required" as const)
                                       : ("available" as const),
              value: c.value,
              /* Bileşenler 0-100 arası bir bileşik skorun parçası. */
              unit: "score" as const,
              reason: c.detail,
              asOf: parsed.generated_at,
              /* ODIN sağlık bileşenleri için pencere BEYAN ETMİYOR —
                 arayüz pencere uydurmaz (UI-ADR-140). */
              reportPeriod: null,
            }))
          );
        },
  });
}
