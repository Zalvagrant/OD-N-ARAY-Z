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
            throw new Error("ODIN çalışma zamanı sağlığını okuyamadı");
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
            throw new Error("ODIN iyileştirme kayıtlarını okuyamadı");
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
            /* ODIN'de "günün hedefi" / "şu anki odak" diye bir kavram YOK.
               `goals` sekiz kayıt taşıyor ama hiçbiri "bugün" demiyor —
               birini seçmek arayüzün öncelik icat etmesi olurdu. */
            todaysMission: null,
            currentFocus: null,
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
