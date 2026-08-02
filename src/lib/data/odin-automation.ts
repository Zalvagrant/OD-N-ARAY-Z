"use client";

/**
 * `/api/automation` adaptörü — ODIN `runtime.schedule()`.
 *
 * `/system/performance` "sağlıklı mı" diye sorar; burası **"ODIN ben
 * yokken ne yapacak, ne zaman"** diye sorar. Aynı işler, farklı soru.
 *
 * `dueNow` ARAYÜZDE HESAPLANMAZ: scheduler'ın kendi `_due`'su üretir.
 * Burada bir zaman aritmetiği yapsaydım ekran, neyin geciktiği konusunda
 * runtime ile çelişebilirdi — ve çelişen taraf her zaman ekran olurdu.
 */

import { z } from "zod";

import { internalEnvelope } from "@/types/data-envelope";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

const jobSchema = z.object({
  name: z.string(),
  agent: z.string().nullable(),
  cadence: z.string().nullable(),
  kind: z.string(),
  trigger: z.string(),
  last_run_at: z.string().nullable(),
  due_now: z.boolean(),
  runs: z.number().nullish(),
  failures: z.number().nullish(),
  avg_ms: z.number().nullish(),
  last_error: z.string().nullish(),
});

export const automationSchema = z.object({
  generated_at: z.string(),
  jobs: z.array(jobSchema),
  total: z.number(),
  due_now: z.number(),
  never_run: z.number(),
  runtime: z.object({
    alive: z.boolean(),
    heartbeat_age_s: z.number().nullable(),
    stale_threshold_s: z.number(),
    tick_seconds: z.number(),
  }),
  watchdog: z.object({
    autostart_installed: z.boolean(),
    startup_cmd: z.string(),
    cockpit_port: z.number(),
    cockpit_listening: z.boolean(),
  }),
});

export type ScheduledJob = {
  name: string;
  agent: string | null;
  cadence: string | null;
  kind: string;
  /** İşin KENDİ sözlüğü ("every 300", "at 08:00") — normalleştirilmez. */
  trigger: string;
  lastRunAt: string | null;
  dueNow: boolean;
  runs: number | null;
  failures: number | null;
  avgMs: number | null;
  lastError: string | null;
};

export type Automation = {
  jobs: ScheduledJob[];
  total: number;
  dueNow: number;
  neverRun: number;
  runtime: {
    alive: boolean;
    heartbeatAgeS: number | null;
    staleThresholdS: number;
    tickSeconds: number;
  };
  watchdog: {
    autostartInstalled: boolean;
    startupCmd: string;
    cockpitPort: number;
    cockpitListening: boolean;
  };
};

export function adaptAutomation(
  raw: z.infer<typeof automationSchema>
): Automation {
  return {
    jobs: raw.jobs.map((j) => ({
      name: j.name,
      agent: j.agent,
      cadence: j.cadence,
      kind: j.kind,
      trigger: j.trigger,
      lastRunAt: j.last_run_at,
      dueNow: j.due_now,
      runs: j.runs ?? null,
      failures: j.failures ?? null,
      avgMs: j.avg_ms ?? null,
      lastError: j.last_error ?? null,
    })),
    total: raw.total,
    dueNow: raw.due_now,
    neverRun: raw.never_run,
    runtime: {
      alive: raw.runtime.alive,
      heartbeatAgeS: raw.runtime.heartbeat_age_s,
      staleThresholdS: raw.runtime.stale_threshold_s,
      tickSeconds: raw.runtime.tick_seconds,
    },
    watchdog: {
      autostartInstalled: raw.watchdog.autostart_installed,
      startupCmd: raw.watchdog.startup_cmd,
      cockpitPort: raw.watchdog.cockpit_port,
      cockpitListening: raw.watchdog.cockpit_listening,
    },
  };
}

export function useOdinAutomation(): OdinQueryResult<Automation> {
  return useOdinQuery({
    key: ["odin", "automation"],
    module: "runtime",
    schema: z.custom<Automation>(),
    load: IS_MOCK
      ? async () => loadMock("system.automation")
      : async (signal) => {
          const raw = automationSchema.parse(
            await httpLoad("/api/automation", { signal })
          );
          return internalEnvelope(raw.generated_at, adaptAutomation(raw));
        },
  });
}
