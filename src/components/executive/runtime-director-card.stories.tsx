/** S11 · RuntimeDirectorCard — ODIN ADR-0148 (UI-ADR-127) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { RuntimeDirector } from "@/types/executive";
import { RuntimeDirectorCard } from "./runtime-director-card";
import { envelope } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/3b · RuntimeDirectorCard",
  parameters: { layout: "padded" },
};
export default meta;

const at = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

const base: RuntimeDirector = {
  id: "watcher-agent",
  status: "healthy",
  lastBeat: at(20_000),
  beatIntervalMs: 60_000,
  failuresTotal: 0,
  lastError: null,
  jobs: [{ id: "drain", status: "healthy", lastBeat: at(20_000) }],
};

const show = (d: RuntimeDirector) => (
  <div className="max-w-md">
    <RuntimeDirectorCard env={envelope(d, { source: "internal" })} />
  </div>
);

export const Saglikli: StoryObj = { render: () => show(base) };

/** `stale` ile `failed` AYRI görünmeli — bu ayrımın kaybolmaması için
 *  dört durumun dördü de story olarak duruyor (meclis 2/2). */
export const Gecikmis: StoryObj = {
  render: () =>
    show({
      ...base,
      id: "data-director",
      status: "stale",
      lastBeat: at(4 * 3_600_000),
      beatIntervalMs: 3_600_000,
      jobs: [{ id: "amazon_ingest", status: "stale", lastBeat: at(4 * 3_600_000) }],
    }),
};

export const Hatali: StoryObj = {
  render: () =>
    show({
      ...base,
      id: "curator-agent",
      status: "failed",
      failuresTotal: 3,
      lastError: "RuntimeError",
      jobs: [{ id: "creator_curator", status: "failed", lastBeat: at(90_000) }],
    }),
};

/** Hiç çalışmamış bir iş `unknown`dır, `healthy` DEĞİL (ADR-0148 §5);
 *  cadence bilinmiyorsa `null` — tahmin edilmez. */
export const Bilinmiyor: StoryObj = {
  render: () =>
    show({
      ...base,
      id: "acie-agent",
      status: "unknown",
      lastBeat: null,
      beatIntervalMs: null,
      jobs: [{ id: "acie", status: "unknown", lastBeat: null }],
    }),
};
