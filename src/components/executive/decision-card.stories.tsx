/** S4 · 2 — DecisionCard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DecisionCard } from "./decision-card";
import { decision, decisionKapanmis, envelope } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/2 · DecisionCard",
  parameters: { layout: "padded" },
};
export default meta;

/** Üç verdict kartın üzerinde: Onayla · Reddet · Ertele (ODIN sözlüğü).
    Sınıf B öneri → gerekçe zorunlu (≥8 karakter); Ertele tarih ister. */
export const KararVerilebilir: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionCard
        env={envelope(decision, { source: "ai" })}
        onVerdict={(d, v) => console.log("verdict", d.id, v)}
      />
    </div>
  ),
};

/** Bayat veri → ÜÇ eylem de kilitli, sebep yazılı (UI-ADR-092). */
export const BayatVeriKilitli: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionCard
        env={envelope(decision, {
          source: "ai",
          freshness: "stale",
          lastUpdated: new Date(Date.now() - 6 * 60 * 60_000).toISOString(),
        })}
        onVerdict={() => {}}
      />
    </div>
  ),
};

/** Verdict verilmiş: eylem yok, insan kararı gerekçesiyle görünür. */
export const Kapanmis: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionCard env={envelope(decisionKapanmis, { source: "ai" })} onVerdict={() => {}} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionCard env={null} />
    </div>
  ),
};
