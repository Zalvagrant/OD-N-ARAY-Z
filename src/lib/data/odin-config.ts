"use client";

/**
 * `/api/config` adaptörü — ODIN `odin/config_api.py`.
 *
 * İKİ EKRAN, TEK ÖLÇÜM: `/system/version` "ne çalışıyor", `/settings`
 * "nasıl yapılandırılmış" diye sorar. Aynı yükten beslenirler, yani
 * farklı commit gösteremezler.
 *
 * `writable:false` BU SÖZLEŞMENİN EN ÖNEMLİ ALANI: ekranda hiçbir yere
 * yazmayan bir "Kaydet" düğmesi olmayacağının garantisidir.
 */

import { z } from "zod";

import { internalEnvelope } from "@/types/data-envelope";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

const phaseSchema = z.object({
  name: z.string(),
  progress: z.number(),
  status: z.string(),
});

export const configSchema = z.object({
  generated_at: z.string(),
  version: z.object({
    odin: z.string(),
    python: z.string(),
    commit: z.string().nullable(),
    branch: z.string().nullable(),
    committed_at: z.string().nullable(),
    working_tree_clean: z.boolean().nullable(),
    adr_count: z.number().nullable(),
    schema_count: z.number().nullable(),
    phases: z.array(phaseSchema),
  }),
  settings: z.object({
    writable: z.literal(false),
    writable_reason: z.string(),
    data_dir: z.string(),
    data_dir_source: z.string(),
    repo: z.string(),
    ui_dir: z.string().nullable(),
    ui_dir_source: z.string(),
    cockpit_port: z.number(),
    ui_port: z.number(),
    bind_host: z.string(),
    heartbeat_tick_s: z.number(),
    stale_threshold_s: z.number(),
    autostart_installed: z.boolean(),
    autostart_cmd: z.string(),
    allowed_commands: z.array(z.string()),
    env_overrides: z.array(
      z.object({
        name: z.string(),
        set: z.boolean(),
        value: z.string().nullable(),
      })
    ),
  }),
});

export type OdinVersion = {
  odin: string;
  python: string;
  commit: string | null;
  branch: string | null;
  committedAt: string | null;
  /** null = git yok (bilinmiyor). false = çalışan kod o commit DEĞİL. */
  workingTreeClean: boolean | null;
  adrCount: number | null;
  schemaCount: number | null;
  phases: { name: string; progress: number; status: string }[];
};

export type OdinSettings = {
  /** Tip düzeyinde `false`: yazılabilir bir ayar yüzeyi YOK. */
  writable: false;
  writableReason: string;
  dataDir: string;
  dataDirSource: string;
  repo: string;
  uiDir: string | null;
  uiDirSource: string;
  cockpitPort: number;
  uiPort: number;
  bindHost: string;
  heartbeatTickS: number;
  staleThresholdS: number;
  autostartInstalled: boolean;
  autostartCmd: string;
  allowedCommands: string[];
  envOverrides: { name: string; set: boolean; value: string | null }[];
};

type Raw = z.infer<typeof configSchema>;

export function adaptVersion(raw: Raw): OdinVersion {
  const v = raw.version;
  return {
    odin: v.odin,
    python: v.python,
    commit: v.commit,
    branch: v.branch,
    committedAt: v.committed_at,
    workingTreeClean: v.working_tree_clean,
    adrCount: v.adr_count,
    schemaCount: v.schema_count,
    phases: v.phases,
  };
}

export function adaptSettings(raw: Raw): OdinSettings {
  const s = raw.settings;
  return {
    writable: false,
    writableReason: s.writable_reason,
    dataDir: s.data_dir,
    dataDirSource: s.data_dir_source,
    repo: s.repo,
    uiDir: s.ui_dir,
    uiDirSource: s.ui_dir_source,
    cockpitPort: s.cockpit_port,
    uiPort: s.ui_port,
    bindHost: s.bind_host,
    heartbeatTickS: s.heartbeat_tick_s,
    staleThresholdS: s.stale_threshold_s,
    autostartInstalled: s.autostart_installed,
    autostartCmd: s.autostart_cmd,
    allowedCommands: s.allowed_commands,
    envOverrides: s.env_overrides,
  };
}

const CONFIG_PATH = "/api/config";

export function useOdinVersion(): OdinQueryResult<OdinVersion> {
  return useOdinQuery({
    key: ["odin", "config", "version"],
    module: "runtime",
    schema: z.custom<OdinVersion>(),
    load: IS_MOCK
      ? async () => loadMock("system.version")
      : async (signal) => {
          const raw = configSchema.parse(
            await httpLoad(CONFIG_PATH, { signal })
          );
          return internalEnvelope(raw.generated_at, adaptVersion(raw));
        },
  });
}

export function useOdinSettings(): OdinQueryResult<OdinSettings> {
  return useOdinQuery({
    key: ["odin", "config", "settings"],
    module: "runtime",
    schema: z.custom<OdinSettings>(),
    load: IS_MOCK
      ? async () => loadMock("system.settings")
      : async (signal) => {
          const raw = configSchema.parse(
            await httpLoad(CONFIG_PATH, { signal })
          );
          return internalEnvelope(raw.generated_at, adaptSettings(raw));
        },
  });
}
