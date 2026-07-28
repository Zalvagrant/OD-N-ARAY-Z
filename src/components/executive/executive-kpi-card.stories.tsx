/** S4 · 1 — ExecutiveKPICard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ExecutiveKPICard } from "./executive-kpi-card";
import { envelope, kpi, kpiEksik } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/1 · ExecutiveKPICard",
  parameters: { layout: "padded" },
};
export default meta;

/** Kapalıyken sade: ad · değer · trend · sparkline. "Detay" ile açılır. */
export const Katmanli: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <ExecutiveKPICard env={envelope(kpi, { source: "computed" })} />
    </div>
  ),
};

export const Izgara: StoryObj = {
  render: () => (
    <div className="grid gap-4 lg:grid-cols-3">
      <ExecutiveKPICard env={envelope(kpi, { source: "computed" })} />
      <ExecutiveKPICard
        env={envelope(
          { ...kpi, id: "k2", label: "ACOS", unit: "percent" as const, scale: "0-100" as const, value: 18.1, currency: undefined },
          { source: "ads-api" }
        )}
      />
      <ExecutiveKPICard env={envelope(kpiEksik, { source: "internal" })} />
    </div>
  ),
};

/**
 * ANTI-FAKE: confidence, forecast ve AI yorumu üretilmemiş.
 * Rozet çıkmaz, "0" yazılmaz, tek noktalı sparkline çizilmez.
 * Öneri tek alternatifli olduğu için gösterilmez.
 */
export const OlculmeyenAlanlar: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <ExecutiveKPICard env={envelope(kpiEksik, { source: "internal", confidence: undefined })} />
    </div>
  ),
};

/**
 * UI-ADR-093 — `unit: "percent"` ama `scale` bildirilmemiş.
 * 18.1 mi 0.181 mi bilinmiyor → değer TAHMİN EDİLMEZ, "—" gösterilir.
 * Sessiz 100 kat hata, sahte veriden daha tehlikelidir: makul görünür.
 */
export const YuzdeOlcegiYok: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <ExecutiveKPICard
        env={envelope(
          { ...kpi, id: "k3", label: "ACOS", unit: "percent" as const, scale: undefined, value: 18.1, currency: undefined },
          { source: "ads-api" }
        )}
      />
    </div>
  ),
};

/** Zarf yok → kart hiç çizilmez. */
export const VeriYok: StoryObj = {
  render: () => <ExecutiveKPICard env={null} />,
};
