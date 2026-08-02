"use client";

/**
 * `/api/ai` adaptörü — ODIN `odin/ai.py:usage()`.
 *
 * MALİYET UYDURULMAZ. Bugün 12/12 çağrı `cost_known:false` ve çekirdek
 * `cost_usd: null` yayınlıyor. Arayüz token sayısından fiyat TAHMİN
 * ETMEZ ve "0,00 USD" YAZMAZ — sıfır, "bedava" diye okunur; bilinmeyen
 * bir maliyeti sıfır göstermek bu reponun 2 numaralı kuralının en
 * pahalı ihlali olurdu.
 *
 * Meclis (gavadolar 2/2) sınırı: gösterilebilir = sağlayıcı, model,
 * çağrı sayısı, token, gecikme, hata. Gösterilemez = toplam maliyet,
 * ortalama maliyet, maliyet trendi, maliyete dayalı skor.
 */

import { z } from "zod";

import { internalEnvelope } from "@/types/data-envelope";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

const recentSchema = z.looseObject({
  ts: z.string().nullish(),
  event: z.string(),
  provider: z.string().nullish(),
  model: z.string().nullish(),
  input_tokens: z.number().nullish(),
  output_tokens: z.number().nullish(),
  latency_ms: z.number().nullish(),
  cost_known: z.boolean().nullish(),
  error: z.string().nullish(),
  stop_reason: z.string().nullish(),
});

export const aiSchema = z.object({
  generated_at: z.string(),
  usage: z.object({
    calls: z.number(),
    errors: z.number().nullish(),
    by_model: z.record(z.string(), z.number()).nullish(),
    tokens_in: z.number().nullish(),
    tokens_out: z.number().nullish(),
    cost_usd: z.number().nullable().optional(),
    cost_known_calls: z.number().nullish(),
    latency_ms_avg: z.number().nullable().optional(),
    last_success: z.string().nullable().optional(),
    last_error: z
      .object({
        ts: z.string().nullish(),
        provider: z.string().nullish(),
        error: z.string().nullish(),
      })
      .nullable()
      .optional(),
    recent: z.array(recentSchema).nullish(),
    /** Telemetri dosyası hiç yoksa çekirdek bunu yazar. */
    note: z.string().nullish(),
  }),
  providers: z.array(
    z.object({ name: z.string(), key_present: z.boolean() })
  ),
});

export type AiCall = {
  at: string | null;
  event: string;
  provider: string | null;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  /** Çağrının KENDİ beyanı; false ise maliyet satırı çizilmez. */
  costKnown: boolean;
  error: string | null;
};

export type AiRuntime = {
  calls: number;
  errors: number;
  byModel: { model: string; calls: number }[];
  tokensIn: number;
  tokensOut: number;
  /** null = ölçülmedi. ASLA 0 ile değiştirilmez. */
  costUsd: number | null;
  costKnownCalls: number;
  unknownCostCalls: number;
  latencyMsAvg: number | null;
  lastSuccessAt: string | null;
  lastError: { at: string | null; provider: string | null; error: string | null } | null;
  recent: AiCall[];
  note: string | null;
  providers: { name: string; keyPresent: boolean }[];
};

export function adaptAi(raw: z.infer<typeof aiSchema>): AiRuntime {
  const u = raw.usage;
  const known = u.cost_known_calls ?? 0;
  return {
    calls: u.calls,
    errors: u.errors ?? 0,
    byModel: Object.entries(u.by_model ?? {})
      .map(([model, calls]) => ({ model, calls }))
      .sort((a, b) => b.calls - a.calls),
    tokensIn: u.tokens_in ?? 0,
    tokensOut: u.tokens_out ?? 0,
    costUsd: u.cost_usd ?? null,
    costKnownCalls: known,
    unknownCostCalls: Math.max(0, u.calls - known),
    latencyMsAvg: u.latency_ms_avg ?? null,
    lastSuccessAt: u.last_success ?? null,
    lastError: u.last_error
      ? {
          at: u.last_error.ts ?? null,
          provider: u.last_error.provider ?? null,
          error: u.last_error.error ?? null,
        }
      : null,
    recent: (u.recent ?? [])
      .map((r) => ({
        at: r.ts ?? null,
        event: r.event,
        provider: r.provider ?? null,
        model: r.model ?? null,
        inputTokens: r.input_tokens ?? null,
        outputTokens: r.output_tokens ?? null,
        latencyMs: r.latency_ms ?? null,
        costKnown: r.cost_known === true,
        error: r.error ?? null,
      }))
      .reverse(),
    note: u.note ?? null,
    providers: raw.providers.map((p) => ({
      name: p.name,
      keyPresent: p.key_present,
    })),
  };
}

export function useOdinAi(): OdinQueryResult<AiRuntime> {
  return useOdinQuery({
    key: ["odin", "ai"],
    module: "runtime",
    schema: z.custom<AiRuntime>(),
    load: IS_MOCK
      ? async () => loadMock("system.ai")
      : async (signal) => {
          const raw = aiSchema.parse(await httpLoad("/api/ai", { signal }));
          return internalEnvelope(raw.generated_at, adaptAi(raw));
        },
  });
}
