/** S4 · 3 — DirectorCard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DirectorCard } from "./director-card";
import { director, directorAtimYok, directorOffline, envelope } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/3 · DirectorCard",
  parameters: { layout: "padded" },
};
export default meta;

export const Canli: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <DirectorCard env={envelope(director, { source: "internal" })} />
    </div>
  ),
};

/**
 * ANTI-FAKE: lastBeat, beatIntervalMs*3'ten eski.
 * Durum verisi "analyzing" olsa bile kart OFFLINE'a düşer ve nabız durur.
 */
export const Offline: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <DirectorCard env={envelope(directorOffline, { source: "internal" })} />
    </div>
  ),
};

/** Atım verisi hiç yok → "offline" denmez, canlılık BİLİNMİYOR. */
export const AtimVerisiYok: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <DirectorCard env={envelope(directorAtimYok, { source: "internal" })} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <DirectorCard env={null} />,
};
