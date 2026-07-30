/** S4 · 3 — DirectorCard (S5.5-b: AgentHealth hizalaması, UI-ADR-111) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DirectorCard } from "./director-card";
import { director, directorUnhealthy, directorUnknown, envelope } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/3 · DirectorCard",
  parameters: { layout: "padded" },
};
export default meta;

/** Gerçek metrikler: gecikme, başarı/hata oranı, kuyruk, maliyet. */
export const Saglikli: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <DirectorCard env={envelope(director, { source: "internal" })} />
    </div>
  ),
};

/** verdict ODIN'den gelir — UI eşik TÜRETMEZ (UI-ADR-111). */
export const Sagliksiz: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <DirectorCard env={envelope(directorUnhealthy, { source: "internal" })} />
    </div>
  ),
};

/** Hiç gözlem yok → unknown; ölçülmemiş her metrik NoData. */
export const Bilinmiyor: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <DirectorCard env={envelope(directorUnknown, { source: "internal" })} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <DirectorCard env={null} />
    </div>
  ),
};
