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

import { internalEnvelope } from "@/types/data-envelope";
import { httpLoad } from "./client";
import { contractError } from "./errors";
import { IS_MOCK } from "./mode";
import {
  alertSchema,
  goalSchema,
  opportunitySchema,
  runtimeDirectorSchema,
  systemHealthSchema,
  timelineEventSchema,
} from "./schemas";
import type { TimelineItem } from "@/types/screens";
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
          return internalEnvelope(parsed.generated_at, adaptGoals(parsed));
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
               Boş dizi göstermek "hiçbir direktör yok" iddiası olurdu.

               `OdinError` olarak atılır: düz `Error` atıldığında
               `classifyError` bunu "unknown" dalına düşürüyordu ve
               kullanıcı, sebebi TAM OLARAK bilinen bir durum için
               "kaynağı sınıflandırılamadı" görüyordu. */
            throw contractError(
              "/api/state",
              "directors alanı null — ODIN direktör sağlığını okuyamadığını bildirdi."
            );
          }
          return internalEnvelope(parsed.generated_at, parsed.directors);
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
            /* SEBEP BİLİNİYOR — "bilinmeyen hata" DEĞİL (UI-ADR-162).
               Düz `Error` `classifyError`ın `unknown` dalına düşüyor ve
               kullanıcı "Beklenmeyen bir hata oluştu — kaynağı
               UYDURULMADI" görüyordu. Oysa sebep tam olarak biliniyor:
               ODIN `alerts: null` yayınladı. Aynı dosyanın :122 satırı
               bunu ZATEN doğru yapıyor; iki çağrı yeri atlanmış. */
            throw contractError("/api/state", "ODIN çalışma zamanı sağlığını okuyamadı");
          }
          return internalEnvelope(
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
            throw contractError("/api/state", "ODIN iyileştirme kayıtlarını okuyamadı");
          }
          return internalEnvelope(
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
   Timeline — ODIN `/api/state.timeline`
   -------------------------------------------------------------------------- */

/**
 * ODIN'in olay akışı — 40 kayıtlık pencere, sunucuda kesiliyor.
 *
 * `tone` ve `description` YAZILMAZ. İkisi de `TimelineItem`de opsiyonel ve
 * ODIN ikisini de yayınlamıyor: bir olaya "uyarı" tonu vermek arayüzün
 * hüküm üretmesi olurdu ve o hükmü ODIN gerekçelendiremez (UI-ADR-111 aynı
 * sebeple eşik tutmayı yasakladı). Boş bırakılan alan, uydurulan alandan
 * her zaman dürüsttür.
 *
 * `title` olayın KENDİ adıdır (`runtime.monitor`), yeniden yazılmaz —
 * çeviri veya güzelleştirme, kaydın gerçek adını aramayı imkânsız kılar.
 */
const timelineStateSchema = z.object({
  generated_at: z.string(),
  timeline: z.array(timelineEventSchema).nullable(),
});

export function useOdinTimeline(): OdinQueryResult<TimelineItem[]> {
  return useOdinQuery({
    key: ["odin", "timeline"],
    module: "default",
    schema: z.array(
      z.object({
        id: z.string(),
        at: z.string().nullable(),
        title: z.string(),
        actor: z.string().optional(),
      })
    ),
    load: IS_MOCK
      ? async () => loadMock("briefing.timeline")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = timelineStateSchema.parse(raw);
          if (parsed.timeline === null) {
            throw contractError("/api/state", "ODIN olay akışını okuyamadı");
          }
          return internalEnvelope(
            parsed.generated_at,
            parsed.timeline.map((e) => ({
              id: String(e.seq),
              at: e.ts,
              title: e.event,
              actor: e.actor,
            }))
          );
        },
  });
}

/* --------------------------------------------------------------------------
   System Director — ODIN `/api/state` işletim sinyalleri
   -------------------------------------------------------------------------- */

/**
 * "ODIN şu anda sağlıklı çalışıyor mu?" sorusunun ÖLÇÜLEN kısmı.
 *
 * Spesifikasyonun KPI şeridi sekiz kalem istiyor; ODIN bugün beşini
 * yayınlıyor: System Health · Storage · Active Services · Critical Alerts ·
 * Current Version. `Uptime`, `CPU` ve `Memory` (RAM) hiçbir uçta YOK ve
 * ekranda gerekçesiyle boş görünürler — süreç başlangıcından uptime
 * TÜRETMEK, ölçülmemiş bir sayıyı ölçülmüş gibi göstermek olurdu.
 *
 * Sağlık skoru ve bileşenleri ODIN'de hesaplanır (ADR-0129); arayüz
 * ortalamayı yeniden kurmaz, kapsamı (`measured/expected`) olduğu gibi
 * taşır — kaç eksenin ölçülebildiği skorun kendisi kadar bilgidir.
 */
const systemStateSchema = z.object({
  generated_at: z.string(),
  version: z.string(),
  disk_used_pct: z.number(),
  health: z.object({
    last_event_ts: z.string().nullable(),
    last_seq: z.number(),
    event_log_bytes: z.number(),
  }),
  health_score: z.object({
    critical: z.array(z.unknown()).nullable(),
    operational: z.object({
      score: z.number().nullable(),
      coverage: z.string(),
      measured: z.number(),
      expected: z.number(),
      components: z.array(
        z.object({
          name: z.string(),
          value: z.number().nullable(),
          detail: z.string(),
        })
      ),
    }),
  }),
});

export function useOdinSystem(): OdinQueryResult<
  z.infer<typeof systemHealthSchema>
> {
  return useOdinQuery({
    key: ["odin", "system"],
    module: "runtime",
    schema: systemHealthSchema,
    load: IS_MOCK
      ? async () => loadMock("system.health")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const p = systemStateSchema.parse(raw);
          const ops = p.health_score.operational;
          return internalEnvelope(p.generated_at, {
            version: p.version,
            diskUsedPct: p.disk_used_pct,
            score: ops.score,
            coverage: ops.coverage,
            measured: ops.measured,
            expected: ops.expected,
            components: ops.components,
            lastEventAt: p.health.last_event_ts,
            lastSeq: p.health.last_seq,
            eventLogBytes: p.health.event_log_bytes,
            criticalCount: (p.health_score.critical ?? []).length,
          });
        },
  });
}
