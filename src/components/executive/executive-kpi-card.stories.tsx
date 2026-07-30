/** S4 · 1 — ExecutiveKPICard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ExecutiveKPICard } from "./executive-kpi-card";
import { envelope, kpi, kpiEksik, kpiFr0043, kpiVeriGerekli } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/1 · ExecutiveKPICard",
  parameters: { layout: "padded" },
};
export default meta;

/**
 * FR-0046 v1 varsayılan hâl: yalnızca sözleşme alanları. Trend, sparkline,
 * AI yorumu, forecast ve risk ÜRETİLMEMİŞ (FR-0043) — kart bunları NoData
 * ile söyler; boş panel dürüsttür.
 */
export const Minimal: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <ExecutiveKPICard env={envelope(kpi, { source: "computed" })} />
    </div>
  ),
};

/**
 * FR-0043 katmanları dolu varyant — opsiyonel render yolları (trend satırı,
 * sparkline, Level 2/3). Bu veri story aracıdır; ürün mock'u FR-0043
 * kapanana kadar bu alanları DOLDURMAZ.
 */
export const Katmanli: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <ExecutiveKPICard env={envelope(kpiFr0043, { source: "computed" })} />
    </div>
  ),
};

/**
 * FR-0044 zarfı `status: "unavailable"` — sayı yerine GEREKÇELİ NoData.
 * "Data Required" metni sayı alanına asla girmez (ADR-0135).
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
      <ExecutiveKPICard env={envelope(kpiFr0043, { source: "computed" })} />
      <ExecutiveKPICard env={envelope(kpi, { source: "computed" })} />
      <ExecutiveKPICard env={envelope(kpiEksik, { source: "internal" })} />
    </div>
  ),
};

/**
 * ANTI-FAKE: confidence, forecast ve AI yorumu üretilmemiş.
 * Rozet çıkmaz, "0" yazılmaz. Öneri tek alternatifli olduğu için gösterilmez.
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
          { ...kpiFr0043, id: "k3", metricKey: "acos", label: "ACOS", scale: undefined },
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
