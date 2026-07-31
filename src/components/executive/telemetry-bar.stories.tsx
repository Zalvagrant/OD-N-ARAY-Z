/** S4 · 14 — TelemetryBar */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { activeTelemetryChannels, TELEMETRY_CHANNELS } from "@/lib/telemetry/registry";
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

/**
 * UI-ADR-142 — envanter kapısının davranış koşulu.
 *
 * Bu bileşen "karşılığı olmayan telemetri kanalı ÇİZİLMEZ" kuralının
 * (CLAUDE.md §2) doğrudan uygulamasıdır. İki ayrı yokluk iddiası var ve
 * ikisi de sessizce bozulabilir.
 */
export const KapaliKanalHIC_CIZILMEZ: StoryObj = {
  name: "Registry'de kapalı kanal ekranda HİÇ YOK",
  render: () => <TelemetryBar env={envelope(telemetry, { source: "internal" })} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const acik = activeTelemetryChannels();
    const kapali = TELEMETRY_CHANNELS.filter((c) => !c.available);

    /* Kanal listesi bileşende SABİT DEĞİL, registry'den gelir: bir kanalı
       "yakında" diye gri çizmek, karşılığı olmayan bir ölçüm yüzeyi
       göstermektir. */
    await expect(kapali.length).toBeGreaterThan(0);
    for (const c of kapali) {
      await expect(canvas.queryByText(c.label)).toBeNull();
    }
    for (const c of acik) {
      await expect(canvas.getByText(c.label)).toBeInTheDocument();
    }
  },
};

export const AcikAmaDegersizKanalSIFIR_YAZMAZ: StoryObj = {
  name: "Açık kanalın değeri gelmediyse '0' değil '—' yazar",
  render: () => <TelemetryBar env={envelope({}, { source: "internal" })} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* ASIL TUZAK: kanal AÇIK ama değer YOK. "0" yazmak bir ÖLÇÜMDÜR ve
       yanlıştır — "hata sayısı 0" ile "hata sayısı ölçülmedi" arasındaki
       fark, sistemin sağlıklı mı yoksa hiç izlenmiyor mu olduğudur. */
    for (const c of activeTelemetryChannels()) {
      await expect(canvas.getByText(c.label)).toBeInTheDocument();
      await expect(
        canvas.getByLabelText(new RegExp(`${c.label}: değer gelmedi`))
      ).toHaveTextContent("—");
    }
  },
};
