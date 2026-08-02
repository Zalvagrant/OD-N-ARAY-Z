"use client";

/**
 * `/api/memory` adaptörü — ODIN `odin/lifecycle.projection()`.
 *
 * KARAR KUYRUĞU DEĞİL: `/decisions` şu an AÇIK olanı gösterir, burası
 * ODIN'in HATIRLADIĞI her şeyi — bugüne kadar ürettiği tüm öneriler ve
 * sahibin verdiği tüm kararlar. İki ayrı soru, iki ayrı ekran.
 *
 * HESAP YOK: sayım ve gruplama çekirdekte yapılır. Arayüz oran, "karar
 * verilme yüzdesi" veya kalite skoru TÜRETMEZ — iki sayı yan yana durur.
 *
 * FİLTRE YOK: her verdict gerekçesiyle listelenir. Kendi zayıf kaydını
 * gizleyen bir defter, defter değildir (ADR-0005 ekleme-yalnız ancak
 * sahip içine bakabildiği sürece bir anlam taşır).
 */

import { z } from "zod";

import { internalEnvelope } from "@/types/data-envelope";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

const bucketSchema = z.object({ name: z.string(), count: z.number() });

const verdictSchema = z.object({
  ts: z.string().nullable(),
  rec_id: z.string(),
  verdict: z.string(),
  reason: z.string().nullable(),
  rec_class: z.string().nullable(),
  revisit_at: z.string().nullable(),
  recommendation: z.string().nullable(),
});

export const memorySchema = z.object({
  generated_at: z.string(),
  recommendations: z.object({
    total: z.number(),
    with_verdict: z.number(),
    first_ts: z.string().nullable(),
    last_ts: z.string().nullable(),
    by_trigger: z.array(bucketSchema),
    by_class: z.array(bucketSchema),
    by_severity: z.array(bucketSchema),
  }),
  verdicts: z.object({
    total: z.number(),
    by_verdict: z.array(bucketSchema),
    recent: z.array(verdictSchema),
  }),
  outcomes: z.object({
    total: z.number(),
    lessons: z.array(
      z.object({
        ts: z.string().nullable(),
        rec_id: z.string(),
        outcome: z.string().nullable(),
        lesson: z.string().nullable(),
      })
    ),
  }),
});

export type MemoryBucket = { name: string; count: number };

export type MemoryVerdict = {
  at: string | null;
  recId: string;
  verdict: string;
  reason: string | null;
  recClass: string | null;
  revisitAt: string | null;
  recommendation: string | null;
};

export type MemoryLesson = {
  at: string | null;
  recId: string;
  outcome: string | null;
  lesson: string | null;
};

export type ExecutiveMemory = {
  recommendations: {
    total: number;
    withVerdict: number;
    firstAt: string | null;
    lastAt: string | null;
    byTrigger: MemoryBucket[];
    byClass: MemoryBucket[];
    bySeverity: MemoryBucket[];
  };
  verdicts: {
    total: number;
    byVerdict: MemoryBucket[];
    recent: MemoryVerdict[];
  };
  outcomes: { total: number; lessons: MemoryLesson[] };
};

export function adaptMemory(
  raw: z.infer<typeof memorySchema>
): ExecutiveMemory {
  return {
    recommendations: {
      total: raw.recommendations.total,
      withVerdict: raw.recommendations.with_verdict,
      firstAt: raw.recommendations.first_ts,
      lastAt: raw.recommendations.last_ts,
      byTrigger: raw.recommendations.by_trigger,
      byClass: raw.recommendations.by_class,
      bySeverity: raw.recommendations.by_severity,
    },
    verdicts: {
      total: raw.verdicts.total,
      byVerdict: raw.verdicts.by_verdict,
      recent: raw.verdicts.recent.map((v) => ({
        at: v.ts,
        recId: v.rec_id,
        verdict: v.verdict,
        reason: v.reason,
        recClass: v.rec_class,
        revisitAt: v.revisit_at,
        recommendation: v.recommendation,
      })),
    },
    outcomes: {
      total: raw.outcomes.total,
      lessons: raw.outcomes.lessons.map((l) => ({
        at: l.ts,
        recId: l.rec_id,
        outcome: l.outcome,
        lesson: l.lesson,
      })),
    },
  };
}

export function useOdinMemory(): OdinQueryResult<ExecutiveMemory> {
  return useOdinQuery({
    key: ["odin", "memory"],
    module: "runtime",
    schema: z.custom<ExecutiveMemory>(),
    load: IS_MOCK
      ? async () => loadMock("memory.executive")
      : async (signal) => {
          const raw = memorySchema.parse(
            await httpLoad("/api/memory", { signal })
          );
          return internalEnvelope(raw.generated_at, adaptMemory(raw));
        },
  });
}
