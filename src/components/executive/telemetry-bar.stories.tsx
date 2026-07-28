/** S4 · 14 — TelemetryBar */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TelemetryBar } from "./telemetry-bar";
import { envelope, telemetry } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/14 · TelemetryBar",
  parameters: { layout: "fullscreen" },
};
export default meta;

/**
 * Registry'de available:true olan 4 kanal çizilir.
 * ai_queue / ai_cost henüz kapalı → BAR'DA HİÇ YOK.
 * error_count açık ama değer gelmemiş → "0" değil, "—" (NoData).
 */
export const AcikKanallar: StoryObj = {
  render: () => <TelemetryBar env={envelope(telemetry, { source: "internal" })} />,
};

export const TumDegerlerEksik: StoryObj = {
  render: () => <TelemetryBar env={envelope({}, { source: "internal" })} />,
};

export const VeriYok: StoryObj = {
  render: () => <TelemetryBar env={null} />,
};
