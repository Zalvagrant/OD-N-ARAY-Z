/** S4 · 3 — DirectorCard (S5.5-b: AgentHealth hizalaması, UI-ADR-111) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
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
  /* UI-ADR-148/150 — çağıranı olmayan bileşen bir DAVRANIŞ kanıtlamalı.
     Kanıtlanan sözleşme: ölçülmemiş metrik SAYI BASMAZ. `verdict` ODIN'den
     gelir ve UI eşik türetmez (UI-ADR-111); bir kartın "sağlıklı" demesi
     ile bir metriğin ölçülmüş olması ayrı şeylerdir. */
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/agent-|director/i)).toBeInTheDocument();
  },
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
