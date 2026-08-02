"use client";

/**
 * `/api/security` adaptörü — ODIN `odin/security.py`.
 *
 * PUAN TAŞINMAZ ÇÜNKÜ PUAN YOK. Çekirdek `score: null` ve bir de
 * `score_reason` gönderiyor; arayüz o reddi OLDUĞU GİBİ gösterir.
 * Olgulardan bir "güvenlik skoru" türetmek, bu ekranı tam olarak
 * kaçınması gereken şeye çevirirdi.
 */

import { z } from "zod";

import { internalEnvelope } from "@/types/data-envelope";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

export const securitySchema = z.object({
  generated_at: z.string(),
  score: z.null(),
  score_reason: z.string(),
  binding: z.object({
    host: z.string().nullable(),
    port: z.number().nullable(),
    loopback_only: z.boolean().nullable(),
    measured: z.boolean(),
  }),
  console: z.object({
    allowed_commands: z.array(z.string()),
    count: z.number(),
  }),
  secrets: z.object({
    count: z.number(),
    empty: z.array(z.string()),
    files: z.array(
      z.object({
        name: z.string(),
        present: z.boolean(),
        updated_at: z.string(),
      })
    ),
  }),
  audit: z.object({
    accesses: z.number(),
    misses: z.number(),
    last_access_at: z.string().nullable(),
    last_miss_at: z.string().nullable(),
    missing_names: z.array(
      z.object({ name: z.string(), count: z.number() })
    ),
  }),
  gate: z.object({ staged_pending: z.number().nullable() }),
});

export type SecurityPosture = {
  /** HER ZAMAN null — sözleşme bunu böyle donduruyor. */
  score: null;
  scoreReason: string;
  binding: {
    host: string | null;
    port: number | null;
    loopbackOnly: boolean | null;
    measured: boolean;
  };
  console: { allowedCommands: string[]; count: number };
  secrets: {
    count: number;
    empty: string[];
    files: { name: string; present: boolean; updatedAt: string }[];
  };
  audit: {
    accesses: number;
    misses: number;
    lastAccessAt: string | null;
    lastMissAt: string | null;
    missingNames: { name: string; count: number }[];
  };
  gate: { stagedPending: number | null };
};

export function adaptSecurity(
  raw: z.infer<typeof securitySchema>
): SecurityPosture {
  return {
    score: null,
    scoreReason: raw.score_reason,
    binding: {
      host: raw.binding.host,
      port: raw.binding.port,
      loopbackOnly: raw.binding.loopback_only,
      measured: raw.binding.measured,
    },
    console: {
      allowedCommands: raw.console.allowed_commands,
      count: raw.console.count,
    },
    secrets: {
      count: raw.secrets.count,
      empty: raw.secrets.empty,
      files: raw.secrets.files.map((f) => ({
        name: f.name,
        present: f.present,
        updatedAt: f.updated_at,
      })),
    },
    audit: {
      accesses: raw.audit.accesses,
      misses: raw.audit.misses,
      lastAccessAt: raw.audit.last_access_at,
      lastMissAt: raw.audit.last_miss_at,
      missingNames: raw.audit.missing_names,
    },
    gate: { stagedPending: raw.gate.staged_pending },
  };
}

export function useOdinSecurity(): OdinQueryResult<SecurityPosture> {
  return useOdinQuery({
    key: ["odin", "security"],
    module: "runtime",
    schema: z.custom<SecurityPosture>(),
    load: IS_MOCK
      ? async () => loadMock("system.security")
      : async (signal) => {
          const raw = securitySchema.parse(
            await httpLoad("/api/security", { signal })
          );
          return internalEnvelope(raw.generated_at, adaptSecurity(raw));
        },
  });
}
