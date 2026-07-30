/** S4 · 1 — ExecutiveKPICard (♻️ ADR-0143 §2 sınır zarfı) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ExecutiveKPICard } from "./executive-kpi-card";
import { envelope, kpi, kpiVeriGerekli, kpiYuzde } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/1 · ExecutiveKPICard",
  parameters: { layout: "padded" },
};
export default meta;

/**
 * ADR-0143 §2: kart TEK KATMANDIR. Sparkline · forecast · AI yorumu · risk
 * sözleşmenin parçası değildir; kaynakları ODIN'de oluşana kadar kartta da
 * yokturlar (boş bir açılır bölüm, olmayan yeteneği varmış gibi gösterirdi).
 */
export const Para: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <ExecutiveKPICard env={envelope(kpi, { source: "computed" })} />
    </div>
  ),
};

/** Yüzde metrik — `scale` bildirilmiş (UI-ADR-093). */
export const Yuzde: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <ExecutiveKPICard env={envelope(kpiYuzde, { source: "ads-api" })} />
    </div>
  ),
};

/**
 * `status !== "available"` → sayı yerine zarfın kendi GEREKÇESİ.
 * Literal "Data Required" sayısal alana asla girmez (ADR-0135).
 */
export const VeriGerekli: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <ExecutiveKPICard env={envelope(kpiVeriGerekli, { source: "computed" })} />
    </div>
  ),
};

export const Izgara: StoryObj = {
  render: () => (
    <div className="grid gap-4 lg:grid-cols-3">
      <ExecutiveKPICard env={envelope(kpi, { source: "computed" })} />
      <ExecutiveKPICard env={envelope(kpiYuzde, { source: "ads-api" })} />
      <ExecutiveKPICard env={envelope(kpiVeriGerekli, { source: "computed" })} />
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
        env={envelope({ ...kpiYuzde, scale: undefined }, { source: "ads-api" })}
      />
    </div>
  ),
};

/** Zarf yok → kart hiç çizilmez. */
export const VeriYok: StoryObj = {
  render: () => <ExecutiveKPICard env={null} />,
};
