/** S5 · 19 — SystemReadiness (açılışın 0–3 saniyesi) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SystemReadiness } from "./system-readiness";

const meta: Meta = {
  title: "Executive/19 · SystemReadiness",
  parameters: { layout: "padded" },
};
export default meta;

/**
 * Altı satır sırayla belirir. Kapalı kanal "Online" yazmaz — registry'de
 * `available: false` olan altsistem "bağlı değil" der (UI-ADR-095).
 */
export const RegistryDenGelir: StoryObj = {
  render: () => <SystemReadiness />,
};
