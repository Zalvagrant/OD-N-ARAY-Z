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
import type {
  AIRecommendation,
  Decision,
  EvidenceRef,
  ExecutiveBrief,
  PulseChannelStates,
} from "@/types/executive";
import type { OdinVerdict } from "@/types/odin";
import type {
  ExecutiveHero,
  IntelligenceCategory,
  IntelligenceItem,
} from "@/types/screens";
import { httpLoad } from "./client";
import { contractError } from "./errors";
import { IS_MOCK } from "./mode";
import {
  alertSchema,
  councilPanelSchema,
  decisionQueueItemSchema,
  executiveKpiSchema,
  type ExecutiveKpiParsed,
  goalSchema,
  graphStatsSchema,
  knowledgeObjectSchema,
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
export const timelineStateSchema = z.object({
  generated_at: z.string(),
  timeline: z.array(timelineEventSchema).nullable(),
});

/** snake_case → `TimelineItem`. Değer DÖNÜŞTÜRÜLMEZ: `seq` kimlik olur,
    olay adı olduğu gibi taşınır (yukarıdaki `title` notu). */
export function adaptTimeline(
  timeline: z.infer<typeof timelineEventSchema>[]
): TimelineItem[] {
  return timeline.map((e) => ({
    id: String(e.seq),
    at: e.ts,
    title: e.event,
    actor: e.actor,
  }));
}

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
          return internalEnvelope(parsed.generated_at, adaptTimeline(parsed.timeline));
        },
  });
}

/* --------------------------------------------------------------------------
   Intelligence Feed — `/api/state.timeline` (S10 · G3)
   -------------------------------------------------------------------------- */

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
          if (parsed.timeline === null) {
            throw contractError("/api/state", "ODIN olay akışını okuyamadı");
          }
          return internalEnvelope(
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

/* --------------------------------------------------------------------------
   Executive Council — ODIN `/api/state.panel_log`
   -------------------------------------------------------------------------- */

/**
 * Koşmuş konsey panelleri: soru, model başına oy, öne çıkan seçenek ve
 * uzlaşma/anlaşmazlık yüzdeleri. Altısı da GERÇEK ve bugüne kadar hiçbir
 * ekran tarafından okunmuyordu.
 *
 * ARAYÜZ HESAP YAPMAZ: `consensus` ve `disagreement` ODIN'de hesaplanır
 * (`odin/consensus.py`); oy sayısından yeniden türetmek, iki farklı sayının
 * aynı ekranda çelişmesi demek olurdu.
 *
 * AZINLIK GÖRÜŞÜ YOK ve UYDURULMAZ: `panel_log` yalnız oyu taşır, gerekçeyi
 * taşımaz. "Karşı oy" ile "kaydedilmiş azınlık görüşü" ayrı şeylerdir —
 * ikincisini birinciden ÜRETMEK, kimsenin yazmadığı bir itirazı yazılmış
 * göstermek olurdu (council-view story'sinin kilitlediği ayrım).
 */
const councilStateSchema = z.object({
  generated_at: z.string(),
  panel_log: z.array(councilPanelSchema).nullable(),
});

export type CouncilPanel = z.infer<typeof councilPanelSchema>;

export function useOdinCouncil(): OdinQueryResult<CouncilPanel[]> {
  return useOdinQuery({
    key: ["odin", "council"],
    module: "default",
    schema: z.array(councilPanelSchema),
    load: IS_MOCK
      ? async () => loadMock("council.panels")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = councilStateSchema.parse(raw);
          if (parsed.panel_log === null) {
            throw contractError("/api/state", "ODIN panel kaydını okuyamadı");
          }
          return internalEnvelope(parsed.generated_at, parsed.panel_log);
        },
  });
}

/* --------------------------------------------------------------------------
   Şirket KPI'ları — ODIN `/api/state` (05-dashboard.md §3.3)
   -------------------------------------------------------------------------- */

/**
 * Brifingin üç şirket KPI'ı. HESAP YOK: yayınlanan sayılar olduğu gibi
 * taşınır, oran/toplam türetilmez.
 *
 *  · Gelir      `revenue.actual` — kaynağı ve ölçüm anı ODIN'den gelir.
 *  · Nakit akışı `finance_position.cash_flow_net` — borç servisinden SONRAKİ
 *    net; sahibin beyan ettiği açılış bakiyesinden türetilmiş provenance'ı
 *    ODIN taşıyor.
 *  · Net kâr    ÖLÇÜLEMİYOR. `contribution_margin` COGS ve komisyonu
 *    içeriyor ama `excludes: ["refunds","advertising"]` — yani katkı
 *    marjıdır, net kâr DEĞİLDİR. Katkı marjını "net kâr" diye yayınlamak
 *    UI-ADR-116'nın tam olarak yasakladığı şeydir, bu yüzden
 *    `status: "data_required"` ve gerekçesi yazılır.
 */
const companyKpiStateSchema = z.object({
  generated_at: z.string(),
  revenue: z.object({
    actual: z.number(),
    currency: z.string().min(1),
    as_of: z.string().nullable(),
  }),
  finance_position: z.object({
    currency: z.string().min(1),
    cash_flow_net: z.number(),
    cash_provenance: z.object({ as_of: z.string().nullable() }).nullable(),
  }),
  contribution_margin: z
    .object({ excludes: z.array(z.string()) })
    .nullable(),
});

export function useOdinCompanyKpis(): OdinQueryResult<
  z.infer<typeof executiveKpiSchema>[]
> {
  return useOdinQuery({
    key: ["odin", "company-kpis"],
    module: "default",
    schema: z.array(executiveKpiSchema),
    load: IS_MOCK
      ? async () => loadMock("briefing.kpis")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const p = companyKpiStateSchema.parse(raw);
          const excludes = p.contribution_margin?.excludes ?? [];
          return internalEnvelope(p.generated_at, [
            {
              id: "company.revenue",
              label: "Gelir",
              status: "available" as const,
              value: p.revenue.actual,
              unit: "currency" as const,
              currency: p.revenue.currency,
              asOf: p.revenue.as_of,
            },
            {
              id: "company.net_profit",
              label: "Net kâr",
              status: "data_required" as const,
              value: null,
              unit: "currency" as const,
              currency: p.revenue.currency,
              reason:
                "Katkı marjı ölçülüyor ama net kâr değil — hariç tutulanlar: " +
                (excludes.join(", ") || "bildirilmedi"),
              asOf: null,
            },
            {
              id: "company.cash_flow",
              label: "Nakit akışı",
              status: "available" as const,
              value: p.finance_position.cash_flow_net,
              unit: "currency" as const,
              currency: p.finance_position.currency,
              asOf: p.finance_position.cash_provenance?.as_of ?? null,
            },
          ]);
        },
  });
}

/* --------------------------------------------------------------------------
   Karar kuyruğu — ODIN `/api/state.decision_queue`
   -------------------------------------------------------------------------- */

/**
 * Sahibin karara bağlaması beklenen öneriler.
 *
 * TEKİLLEŞTİRME ODIN'DE: ham akış 1.933 kayıt ama 1.921'i aynı risklerin
 * heartbeat tekrarı; ODIN (trigger, signal, recommendation) anahtarıyla
 * 26'ya indiriyor ve tekrar sayısını `occurrences` olarak taşıyor. Arayüz
 * ne tekilleştirir ne de sıralar — sıra da ODIN'de (önce sahip onayı
 * bekleyen, sonra şiddet).
 */
const decisionQueueStateSchema = z.object({
  generated_at: z.string(),
  /* Okunamayan kuyruk "öneri yok" DEĞİLDİR. */
  decision_queue: z
    .array(
      z.object({
        rec_id: z.string(),
        trigger: z.string(),
        signal: z.object({ risk: z.string(), level: z.number() }).nullable(),
        recommendation: z.string(),
        severity: z.enum(["HIGH", "MEDIUM", "INFO"]),
        klass: z.string().nullable(),
        rationale: z.string().nullable(),
        owner_approval_required: z.boolean(),
        council_needed: z.boolean(),
        decided: z.boolean(),
        /* Sahibin kendi kararı (ODIN lifecycle.jsonl). Eski bir çekirdek
           bu alanları hiç yayınlamaz — o yüzden opsiyonel, zorunlu değil. */
        verdict: z.enum(["approved", "rejected", "deferred"]).nullish(),
        verdict_reason: z.string().nullish(),
        verdict_ts: z.string().nullish(),
        revisit_at: z.string().nullish(),
        first_seen: z.string(),
        last_seen: z.string(),
        occurrences: z.number(),
      })
    )
    .nullable(),
});

export type DecisionQueueItem = z.infer<typeof decisionQueueItemSchema>;

export function useOdinDecisionQueue(): OdinQueryResult<DecisionQueueItem[]> {
  return useOdinQuery({
    key: ["odin", "decision-queue"],
    module: "default",
    schema: z.array(decisionQueueItemSchema),
    load: IS_MOCK
      ? async () => loadMock("decisions.queue")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = decisionQueueStateSchema.parse(raw);
          if (parsed.decision_queue === null) {
            throw contractError("/api/state", "ODIN karar kuyruğunu okuyamadı");
          }
          return internalEnvelope(
            parsed.generated_at,
            parsed.decision_queue.map((d) => ({
              recId: d.rec_id,
              trigger: d.trigger,
              signal: d.signal,
              recommendation: d.recommendation,
              severity: d.severity,
              klass: d.klass,
              rationale: d.rationale,
              ownerApprovalRequired: d.owner_approval_required,
              councilNeeded: d.council_needed,
              decided: d.decided,
              verdict: d.verdict ?? null,
              verdictReason: d.verdict_reason ?? null,
              verdictAt: d.verdict_ts ?? null,
              revisitAt: d.revisit_at ?? null,
              firstSeen: d.first_seen,
              lastSeen: d.last_seen,
              occurrences: d.occurrences,
            }))
          );
        },
  });
}

/* --------------------------------------------------------------------------
   Knowledge — ODIN `/api/state.knowledge` + `graph_stats`
   -------------------------------------------------------------------------- */

/**
 * Promote edilmiş bilgi çekirdeği ve grafın sayıları.
 *
 * GRAF LİSTESİ ÇEKİLMİYOR: ölçüldü, `graph_entities` her kaydı bir KO'dan
 * türetiyordu (`ENT-<KO-id>`) — yani bu listenin aynası. Grafın taşıdığı
 * ASIL bilgi ilişkilerdir ve bugün **sıfır** ilişki kayıtlı; sayıyı
 * göstermek, 36 bağlantısız düğümü graf diye çizmekten dürüsttür.
 */
const knowledgeStateSchema = z.object({
  generated_at: z.string(),
  knowledge: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        domain: z.string().nullable(),
        title: z.string(),
        topics: z.array(z.string()),
        lifecycle_state: z.string(),
        trust: z.number().nullable(),
        promoted_at: z.string().nullable(),
        approved_by: z.string().nullable(),
        source: z.string().nullable(),
      })
    )
    .nullable(),
  graph_stats: graphStatsSchema.nullable(),
  staging_stats: z.object({
    count: z.number(),
    avg_trust: z.number().nullable(),
  }),
});

export type KnowledgeObject = z.infer<typeof knowledgeObjectSchema>;

export type KnowledgeView = {
  objects: KnowledgeObject[];
  graph: z.infer<typeof graphStatsSchema> | null;
  stagingCount: number;
  stagingAvgTrust: number | null;
};

export function useOdinKnowledge(): OdinQueryResult<KnowledgeView> {
  return useOdinQuery({
    key: ["odin", "knowledge"],
    module: "default",
    schema: z.object({
      objects: z.array(knowledgeObjectSchema),
      graph: graphStatsSchema.nullable(),
      stagingCount: z.number(),
      stagingAvgTrust: z.number().nullable(),
    }),
    load: IS_MOCK
      ? async () => loadMock("knowledge.core")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const p = knowledgeStateSchema.parse(raw);
          if (p.knowledge === null) {
            throw contractError("/api/state", "ODIN bilgi çekirdeğini okuyamadı");
          }
          return internalEnvelope(p.generated_at, {
            objects: p.knowledge.map((k) => ({
              id: k.id,
              type: k.type,
              domain: k.domain,
              title: k.title,
              topics: k.topics,
              lifecycleState: k.lifecycle_state,
              trust: k.trust,
              promotedAt: k.promoted_at,
              approvedBy: k.approved_by,
              source: k.source,
            })),
            graph: p.graph_stats,
            stagingCount: p.staging_stats.count,
            stagingAvgTrust: p.staging_stats.avg_trust,
          });
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
          return internalEnvelope(
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

/* --------------------------------------------------------------------------
   Executive Hero — `/api/state.health_score` (S10 · G3)
   -------------------------------------------------------------------------- */

const heroStateSchema = z.object({
  generated_at: z.string(),
  /* Eski çekirdek bu anahtarı hiç yayınlamaz — opsiyonel (UI-ADR-198). */
  executive_focus: z
    .object({
      todays_mission: z.string().nullable(),
      current_focus: z.string().nullable(),
    })
    .nullish(),
  health_score: z
    .object({
      score: z.number().nullable(),
      coverage: z.string(),
      critical: z
        .array(z.object({ label: z.string() }))
        .nullable()
        .optional(),
    })
    .nullable(),
});

export function useOdinHero(): OdinQueryResult<ExecutiveHero> {
  return useOdinQuery({
    key: ["odin", "hero"],
    module: "default",
    schema: z.custom<ExecutiveHero>(),
    load: IS_MOCK
      ? async () => loadMock("briefing.hero")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = heroStateSchema.parse(raw);
          if (parsed.health_score === null) {
            throw new Error("ODIN şirket sağlık skorunu okuyamadı");
          }
          const hs = parsed.health_score;
          /* Özet ODIN'in KENDİ cümleleridir — `critical[].label` ölçülmüş
             durumları kendi kelimeleriyle yayınlıyor ("Likidite riski:
             nakit akışı -70,188 TL/ay, runway 1.3 ay"). Arayüz onları
             AKTARIR; cümle KURMAZ. Kritik durum yoksa geriye yalnız
             yayınlanmış sayılar kalır. */
          const labels = (hs.critical ?? []).map((c) => c.label);
          return internalEnvelope(parsed.generated_at, {
            executiveSummary:
              labels.length > 0
                ? labels.join(" · ")
                : `Şirket sağlığı ${hs.score ?? "ölçülmedi"} · kapsam ${hs.coverage}`,
            /* SEÇİM ÇEKİRDEKTE (UI-ADR-198): `executive_focus` sahibin
               urgent hedeflerinin BİRLEŞİMİ + roadmap'in active fazı —
               cockpit okur, sıralamaz. Arayüz burada seçim yapmaz; eski
               çekirdek alanı yayınlamıyorsa "—" kalır. */
            todaysMission: parsed.executive_focus?.todays_mission ?? null,
            currentFocus: parsed.executive_focus?.current_focus ?? null,
            systemHealthScore: hs.score,
            /* 13-backend-recommendations.md §14.1 — karşılığı YOK. */
            aiReadiness: null,
          });
        },
  });
}

/* --------------------------------------------------------------------------
   AI Pulse — `/api/state` (S10 · G3)
   -------------------------------------------------------------------------- */

const pulseStateSchema = z.object({ generated_at: z.string() });

export function useOdinPulse(): OdinQueryResult<PulseChannelStates> {
  return useOdinQuery({
    key: ["odin", "pulse"],
    module: "default",
    schema: z.custom<PulseChannelStates>(),
    load: IS_MOCK
      ? async () => loadMock("briefing.pulse")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = pulseStateSchema.parse(raw);
          /* ODIN hiçbir AI kanalı için durum YAYINLAMIYOR: `processing`,
             `memory_knowledge` ve `prediction` registry'de açık ama
             karşılıklarında ölçülen bir yük yok, `ai_queue`/`ai_cost` ise
             zaten kapalı (UI-ADR-141 §5 — kuyruk kavramı ve fiyat tablosu
             yok). Boş kanal kümesi bir eksiklik değil, ÖLÇÜMÜN KENDİSİ:
             AIPulse bunu "Ölçülebilir kanal yok" diye basıyor ve halka
             ÇİZİLMİYOR. Zarfın zamanı ODIN'den geliyor, yani "şu an
             itibarıyla" iddiası gerçek. */
          return internalEnvelope(parsed.generated_at, {} as PulseChannelStates);
        },
  });
}

/* --------------------------------------------------------------------------
   Kararlar — `/api/state.decisions` (ODIN FileDecisionLog)
   -------------------------------------------------------------------------- */

/**
 * ODIN'in karar kaydı — arayüzdeki fixture'ın YERİNİ ALIR.
 *
 * Yuva `useOdinFixture("briefing.decisions")` ile besleniyordu. Ölçüldü:
 * kaynak baştan beri vardı — `FileDecisionLog`, `decision-record.schema.json`
 * (arayüzün `Decision` tipiyle BİREBİR: `alternatives` minItems 2,
 * `recommendation`, `human_decision`) ve `/api/state.decisions` projeksiyonu.
 * Eksik olan tek şey projeksiyonun GENİŞLİĞİYDİ: dört alan yayınlıyordu,
 * kart ise `tier`/`alternatives`/`recommendation` olmadan çizilemiyordu.
 * Projeksiyon ODIN tarafında genişletildi (`replay()` bu alanları zaten
 * hesaplayıp atıyordu), burada yalnız yeniden adlandırılıyor.
 *
 * BUGÜN SIFIR KAYIT VAR (`odin-data/decisions/` boş) ve bu bir eksiklik
 * değil, ÖLÇÜMÜN KENDİSİ: sahip henüz hiçbir kararı kayda geçirmedi.
 * Kanca boş dizi döndürür, `DecisionQueue` dürüst boş durumunu basar.
 * Sahip ilk kararı yazdığı an kart gerçek veriyle dolar — fixture'la
 * dolmuş gibi YAPMAZ.
 */
const decisionAlternativeSchema = z.object({
  option: z.string(),
  assessment: z.string(),
  risk: z.string().optional(),
});

const odinDecisionSchema = z.object({
  id: z.string(),
  question: z.string(),
  date: z.string().nullable(),
  tier: z.enum(["D1", "D2", "D3"]),
  status: z.enum(["open", "monitoring", "closed"]),
  domain: z.string().nullable().optional(),
  outcome: z.string().nullable(),
  alternatives: z.array(decisionAlternativeSchema),
  recommendation: z.object({
    text: z.string().nullable(),
    confidence: z.number(),
    confidence_breakdown: z.record(z.string(), z.number()),
    consensus: z
      .object({ consensus: z.number(), disagreement: z.number() })
      .nullable(),
    evidence: z.array(
      z.object({
        knowledge_id: z.string(),
        trust_at_decision: z.number(),
        role: z.string(),
        summary: z.string().optional(),
      })
    ),
    flip_conditions: z.array(z.string()),
    risks: z.array(z.string()),
    assumptions: z.array(z.string()),
  }),
  human_decision: z
    .object({
      outcome: z.string(),
      human_reasoning: z.string().optional(),
      revisit_at: z.string().optional(),
    })
    .nullable(),
});

const decisionsStateSchema = z.object({
  generated_at: z.string(),
  decisions: z.array(odinDecisionSchema),
});

/** ODIN `role` → arayüzün duruş sözlüğü. Bilinmeyen rol NÖTR sayılır —
    "destekliyor" varsayılamaz; kanıtın yönü kararın anlamını değiştirir. */
const STANCE: Record<string, EvidenceRef["supportsOrContradicts"]> = {
  supporting: "supports",
  contradicting: "contradicts",
  neutral: "neutral",
};

export function adaptDecisions(
  raw: z.infer<typeof decisionsStateSchema>
): Decision[] {
  return raw.decisions.map((d) => ({
    id: d.id,
    question: d.question,
    date: d.date ?? "",
    tier: d.tier,
    status: d.status,
    ...(d.domain ? { domain: d.domain } : {}),
    alternatives: d.alternatives,
    recommendation: {
      id: `${d.id}-rec`,
      recommendation: d.recommendation.text ?? "",
      confidence: d.recommendation.confidence,
      confidenceBreakdown: d.recommendation
        .confidence_breakdown as unknown as AIRecommendation["confidenceBreakdown"],
      /* `type` ve `freshness` ATLANIYOR: ODIN'in kanıt kopyasında yoklar
         ve uydurmak yerine alan çizilmiyor (types/executive.ts notu). */
      evidence: d.recommendation.evidence.map((e) => ({
        id: e.knowledge_id,
        title: e.summary ?? e.knowledge_id,
        sourceQuality: e.trust_at_decision,
        supportsOrContradicts: STANCE[e.role] ?? "neutral",
      })),
      potentialRisks: d.recommendation.risks,
      assumptions: d.recommendation.assumptions,
      flipConditions: d.recommendation.flip_conditions,
      consensusScore: d.recommendation.consensus?.consensus ?? 0,
      disagreementScore: d.recommendation.consensus?.disagreement ?? 0,
    } as AIRecommendation,
    ...(d.human_decision
      ? {
          humanDecision: {
            outcome: d.human_decision.outcome as OdinVerdict,
            ...(d.human_decision.human_reasoning
              ? { humanReasoning: d.human_decision.human_reasoning }
              : {}),
            ...(d.human_decision.revisit_at
              ? { revisitAt: d.human_decision.revisit_at }
              : {}),
          },
        }
      : {}),
  }));
}

export function useOdinDecisions(): OdinQueryResult<Decision[]> {
  return useOdinQuery({
    key: ["odin", "decisions"],
    module: "default",
    schema: z.custom<Decision[]>(),
    load: IS_MOCK
      ? async () => loadMock("briefing.decisions")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = decisionsStateSchema.parse(raw);
          return internalEnvelope(parsed.generated_at, adaptDecisions(parsed));
        },
  });
}

/* --------------------------------------------------------------------------
   Performance — `/api/state.health` + istemci gecikme ölçümü (UI-ADR-199)
   -------------------------------------------------------------------------- */

/** Çekirdek nabzı + günlük boyutları. HESAP YOK: alanlar ham taşınır. */
const performanceStateSchema = z.object({
  generated_at: z.string(),
  health: z.object({
    last_event_ts: z.string().nullable(),
    last_seq: z.number(),
    event_log_bytes: z.number(),
    /* Eski çekirdek yayınlamıyordu — opsiyonel. */
    telemetry_bytes: z.number().nullish(),
  }),
  events_today: z.number().nullish(),
});

export type OdinPerformance = {
  lastEventAt: string | null;
  lastSeq: number;
  eventLogBytes: number;
  telemetryBytes: number | null;
  eventsToday: number | null;
};

export function useOdinPerformance(): OdinQueryResult<OdinPerformance> {
  return useOdinQuery({
    key: ["odin", "performance"],
    module: "runtime",
    schema: z.custom<OdinPerformance>(),
    load: IS_MOCK
      ? async () => loadMock("system.performance")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const p = performanceStateSchema.parse(raw);
          return internalEnvelope(p.generated_at, {
            lastEventAt: p.health.last_event_ts,
            lastSeq: p.health.last_seq,
            eventLogBytes: p.health.event_log_bytes,
            telemetryBytes: p.health.telemetry_bytes ?? null,
            eventsToday: p.events_today ?? null,
          });
        },
  });
}

/**
 * `/api/state` bekleme süresi — İSTEMCİNİN KENDİ ÖLÇÜMÜ.
 *
 * Bu bir ODIN yayını DEĞİLDİR ve öyle etiketlenmez: ekran "bu istemcinin
 * son isteği" der. Coalescing yüzünden ölçülen şey paylaşılan isteğin
 * bekleme süresi olabilir — kullanıcının gerçekte beklediği süre tam
 * olarak budur. Sunucu tarafı bir süre yayını gelirse o ayrıca gösterilir.
 */
export function useOdinStateLatency(): OdinQueryResult<{ ms: number }> {
  return useOdinQuery({
    key: ["odin", "state-latency"],
    module: "runtime",
    schema: z.custom<{ ms: number }>(),
    load: IS_MOCK
      ? async () => loadMock("system.latency")
      : async (signal) => {
          const t0 = performance.now();
          const raw = await httpLoad("/api/state", { signal });
          const p = z.object({ generated_at: z.string() }).parse(raw);
          return internalEnvelope(p.generated_at, {
            ms: Math.round(performance.now() - t0),
          });
        },
  });
}

/* --------------------------------------------------------------------------
   Finance — `/api/state.finance_position` (ODIN `odin/finance/director.py`)
   -------------------------------------------------------------------------- */

/**
 * Sahibin defter pozisyonu — `current_position()` çekirdekte hesaplar,
 * arayüz yalnız taşır (UI-ADR-195).
 *
 * HESAP YOK, KUR ÇEVİRİSİ YOK (gavadolar 2/2): `cash_try` TRY'dir ve
 * provenance'ı (sahip beyanı USD × kur) olduğu gibi gösterilir. ODIN'in
 * `operating_net` (borç servisi ÖNCESİ) / `cash_flow_net` (SONRASI)
 * ayrımı korunur; ikisini "net kâr" diye adlandırmak yasak (UI-ADR-116
 * ile aynı sınıf). `source_not_connected` ölçümün kendisidir: bağlı
 * olmayan kaynak listesi ekranda açıkça durur, o alanlar çizilmez.
 */
const financeTargetSchema = z.object({
  value: z.string(),
  direction: z.string(),
  source: z.string(),
});

export const financeStateSchema = z.object({
  generated_at: z.string(),
  /* `None` = defter boş YA DA okunamadı; cockpit ikisini ayıramıyor.
     Boş ekran değil, sebepli hata basılır. */
  finance_position: z
    .object({
      currency: z.string().min(1),
      window_months: z.number(),
      cash_try: z.number().nullable(),
      cash_provenance: z
        .object({
          amount: z.number(),
          currency: z.string(),
          fx_to_try: z.number(),
          opening_try: z.number(),
          journal_net_try: z.number(),
          as_of: z.string().nullable(),
          source: z.string().nullable(),
        })
        .nullable(),
      monthly_revenue: z.number(),
      monthly_opex: z.number(),
      monthly_debt_service: z.number(),
      operating_net: z.number(),
      cash_flow_net: z.number(),
      remaining_debt: z.number(),
      runway_months: z.number().nullable(),
      runway_note: z.string().nullable(),
      required_reserve: z
        .object({
          required_reserve: z.number(),
          personal_floor: z.number(),
          known_obligations: z.number(),
          critical_reorder_cash: z.number(),
          months_window: z.number(),
        })
        .nullable(),
      source_not_connected: z.array(z.string()),
      /* Yalnız kart limiti tanımlıyken yayınlanır. */
      card_utilisation_pct: z.number().nullish(),
      runway_target: financeTargetSchema.nullable(),
      leverage_target: financeTargetSchema.nullable(),
    })
    .nullable(),
});

export type FinancePosition = {
  currency: string;
  windowMonths: number;
  cashTry: number | null;
  cashProvenance: {
    amount: number;
    currency: string;
    fxToTry: number;
    asOf: string | null;
    source: string | null;
  } | null;
  monthlyRevenue: number;
  monthlyOpex: number;
  monthlyDebtService: number;
  operatingNet: number;
  cashFlowNet: number;
  remainingDebt: number;
  runwayMonths: number | null;
  runwayNote: string | null;
  requiredReserve: {
    requiredReserve: number;
    personalFloor: number;
    knownObligations: number;
    criticalReorderCash: number;
    monthsWindow: number;
  } | null;
  sourceNotConnected: string[];
  cardUtilisationPct: number | null;
  runwayTarget: { value: string; direction: string; source: string } | null;
  leverageTarget: { value: string; direction: string; source: string } | null;
};

/** snake_case → camelCase. Değer DÖNÜŞTÜRÜLMEZ. */
export function adaptFinance(
  p: NonNullable<z.infer<typeof financeStateSchema>["finance_position"]>
): FinancePosition {
  return {
    currency: p.currency,
    windowMonths: p.window_months,
    cashTry: p.cash_try,
    cashProvenance: p.cash_provenance
      ? {
          amount: p.cash_provenance.amount,
          currency: p.cash_provenance.currency,
          fxToTry: p.cash_provenance.fx_to_try,
          asOf: p.cash_provenance.as_of,
          source: p.cash_provenance.source,
        }
      : null,
    monthlyRevenue: p.monthly_revenue,
    monthlyOpex: p.monthly_opex,
    monthlyDebtService: p.monthly_debt_service,
    operatingNet: p.operating_net,
    cashFlowNet: p.cash_flow_net,
    remainingDebt: p.remaining_debt,
    runwayMonths: p.runway_months,
    runwayNote: p.runway_note,
    requiredReserve: p.required_reserve
      ? {
          requiredReserve: p.required_reserve.required_reserve,
          personalFloor: p.required_reserve.personal_floor,
          knownObligations: p.required_reserve.known_obligations,
          criticalReorderCash: p.required_reserve.critical_reorder_cash,
          monthsWindow: p.required_reserve.months_window,
        }
      : null,
    sourceNotConnected: p.source_not_connected,
    cardUtilisationPct: p.card_utilisation_pct ?? null,
    runwayTarget: p.runway_target,
    leverageTarget: p.leverage_target,
  };
}

export function useOdinFinance(): OdinQueryResult<FinancePosition> {
  return useOdinQuery({
    key: ["odin", "finance"],
    module: "default",
    schema: z.custom<FinancePosition>(),
    load: IS_MOCK
      ? async () => loadMock("finance.position")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = financeStateSchema.parse(raw);
          if (parsed.finance_position === null) {
            throw contractError(
              "/api/state",
              "ODIN finans pozisyonunu yayınlayamadı — defter boş ya da okunamadı."
            );
          }
          return internalEnvelope(
            parsed.generated_at,
            adaptFinance(parsed.finance_position)
          );
        },
  });
}

/* --------------------------------------------------------------------------
   Yönetici brifingi — `/api/state` (ODIN `odin/briefing.py`)
   -------------------------------------------------------------------------- */

/**
 * Günlük brifingin ÖLÇÜLEN yarısı — fixture'ın yerini alır.
 *
 * ODIN her sabah `odin-data/briefings/*.md` üretir (29 dosya) ve aynı
 * sayıları `/api/state` üzerinden yayınlar. Fixture'ın kalma sebebi
 * "şekil uyuşmuyor" idi; ölçüldü, uyuşmayan kısım BEŞ adımın İKİSİ değil
 * ÜÇÜ: ODIN yorum, açıklanabilirlik-seviyesinde öneri ve kanıt zinciri
 * ÜRETMİYOR. Uydurmak yerine o üç adım boş bırakılıyor — `AIBrief` zaten
 * eksik olanı ADIYLA söylüyor ("Öneri gösterilmiyor. Eksik: ...").
 *
 * Sayıların hiçbiri burada HESAPLANMAZ; hepsi ODIN'in yayınladığı
 * değerlerdir, yalnız etiketlenir. Kritik durum cümleleri de ODIN'in
 * kendi metnidir (`briefing._critical_conditions`), arayüz cümle kurmaz.
 */
const briefStateSchema = z.object({
  generated_at: z.string(),
  core_count: z.number().nullable().optional(),
  events_today: z.number().nullable().optional(),
  staging_stats: z
    .object({
      count: z.number().nullable(),
      avg_trust: z.number().nullable(),
    })
    .nullable()
    .optional(),
  health_score: z
    .object({
      score: z.number().nullable(),
      coverage: z.string().nullable().optional(),
      operational: z.object({ score: z.number().nullable() }).nullable().optional(),
      critical: z
        .array(z.object({ label: z.string() }))
        .nullable()
        .optional(),
    })
    .nullable(),
});

export function adaptBrief(
  raw: z.infer<typeof briefStateSchema>
): ExecutiveBrief {
  const hs = raw.health_score;
  const numbers: ExecutiveBrief["numbers"] = {};
  /* Ölçülmemiş bir sayı SATIR AÇMAZ. `0` yazmak "ölçtük, sıfır çıktı"
     demektir ve okuyan ayırt edemez. */
  const koy = (etiket: string, v: number | null | undefined) => {
    if (typeof v === "number") numbers[etiket] = v;
  };
  koy("Şirket sağlığı", hs?.score);
  koy("Operasyonel hazırlık", hs?.operational?.score);
  koy("Core kayıt", raw.core_count);
  koy("Bekleyen staging", raw.staging_stats?.count);
  koy("Ortalama güven", raw.staging_stats?.avg_trust);
  koy("Bugünkü olay", raw.events_today);
  if (hs?.coverage) numbers["Kapsam"] = hs.coverage;

  return {
    numbers,
    /* ODIN'in kendi kritik durum cümleleri. Yoksa boş string DEĞİL, o
       adımın gerçekten söyleyeceği bir şey olmadığını belirten metin. */
    analysis:
      (hs?.critical ?? []).map((c) => c.label).join(" · ") ||
      "Ortalamanın gizleyemeyeceği kritik bir durum ölçülmedi.",
    /* interpretation · recommendation · evidence ATLANIYOR — ODIN
       üretmiyor (types/executive.ts notu). */
  };
}

export function useOdinBrief(): OdinQueryResult<ExecutiveBrief> {
  return useOdinQuery({
    key: ["odin", "brief"],
    module: "default",
    schema: z.custom<ExecutiveBrief>(),
    load: IS_MOCK
      ? async () => loadMock("briefing.brief")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = briefStateSchema.parse(raw);
          return internalEnvelope(parsed.generated_at, adaptBrief(parsed));
        },
  });
}

/* --------------------------------------------------------------------------
   Kâr zinciri — `/api/state.contribution_margin` (UI-ADR-204)
   -------------------------------------------------------------------------- */

/**
 * ODIN'in ölçtüğü kâr zinciri: ciro → COGS → brüt → ücretler → KATKI.
 *
 * BU NET KÂR DEĞİLDİR ve öyle adlandırılamaz (UI-ADR-116). Kayıt neyi
 * hariç tuttuğunu KENDİSİ söylüyor (`excludes: refunds, advertising`);
 * ekran o listeyi olduğu gibi gösterir.
 *
 * HESAP YOK: tutarlar da yüzdeler de çekirdekten gelir (ODIN 2 Ağu'da
 * `gross_profit`/`contribution` yayınlamaya başladı, tam da arayüz üç
 * alanı çıkarmak zorunda kalmasın diye).
 *
 * `dated: false` GİZLENMEZ: maliyet beyanları 2026-07-21'den geçerli ama
 * ölçülen dönem 2026-06-30'da bitiyor — kayıt kendi tarihlemesinin
 * eksikliğini bildiriyor ve ekran bunu okur.
 */
const profitTargetSchema = z
  .object({
    value: z.string(),
    direction: z.string(),
    period: z.string().nullish(),
    effective_date: z.string().nullish(),
    source: z.string().nullish(),
  })
  .nullish();

export const profitStateSchema = z.object({
  generated_at: z.string(),
  contribution_margin: z
    .object({
      revenue: z.number(),
      cogs: z.number(),
      fees: z.number(),
      gross_profit: z.number().nullish(),
      contribution: z.number().nullish(),
      margin_pct: z.number(),
      gross_margin_pct: z.number(),
      units: z.number(),
      asins_matched: z.number(),
      asins_total: z.number(),
      unmatched_units: z.number(),
      currency: z.string().nullable(),
      excludes: z.array(z.string()),
      dated: z.boolean().nullish(),
      declarations: z.number().nullish(),
      declared_from: z.string().nullish(),
      period_end: z.string().nullish(),
      target: profitTargetSchema,
    })
    .nullable(),
});

export type ProfitChain = {
  currency: string | null;
  revenue: number;
  cogs: number;
  fees: number;
  /** Eski çekirdek yayınlamıyordu — arayüz TÜRETMEZ, null bırakır. */
  grossProfit: number | null;
  contribution: number | null;
  marginPct: number;
  grossMarginPct: number;
  units: number;
  asinsMatched: number;
  asinsTotal: number;
  unmatchedUnits: number;
  excludes: string[];
  dated: boolean | null;
  declaredFrom: string | null;
  periodEnd: string | null;
  target: {
    value: string;
    direction: string;
    period: string | null;
    effectiveDate: string | null;
    source: string | null;
  } | null;
};

export function adaptProfit(
  raw: z.infer<typeof profitStateSchema>
): ProfitChain | null {
  const m = raw.contribution_margin;
  if (!m) return null;
  return {
    currency: m.currency,
    revenue: m.revenue,
    cogs: m.cogs,
    fees: m.fees,
    grossProfit: m.gross_profit ?? null,
    contribution: m.contribution ?? null,
    marginPct: m.margin_pct,
    grossMarginPct: m.gross_margin_pct,
    units: m.units,
    asinsMatched: m.asins_matched,
    asinsTotal: m.asins_total,
    unmatchedUnits: m.unmatched_units,
    excludes: m.excludes,
    dated: m.dated ?? null,
    declaredFrom: m.declared_from ?? null,
    periodEnd: m.period_end ?? null,
    target: m.target
      ? {
          value: m.target.value,
          direction: m.target.direction,
          period: m.target.period ?? null,
          effectiveDate: m.target.effective_date ?? null,
          source: m.target.source ?? null,
        }
      : null,
  };
}

export function useOdinProfit(): OdinQueryResult<ProfitChain | null> {
  return useOdinQuery({
    key: ["odin", "profit"],
    module: "amazon",
    schema: z.custom<ProfitChain | null>(),
    load: IS_MOCK
      ? async () => loadMock("amazon.profit")
      : async (signal) => {
          const raw = profitStateSchema.parse(
            await httpLoad("/api/state", { signal })
          );
          return internalEnvelope(raw.generated_at, adaptProfit(raw));
        },
  });
}
