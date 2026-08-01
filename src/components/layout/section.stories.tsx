/** S5 · Section — bölüm çerçevesi ve dört durumu */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Section } from "./section";
import { Text } from "@/components/ui/typography";

const meta: Meta = {
  title: "Layout/Section",
  parameters: { layout: "padded" },
};
export default meta;

export const Dolu: StoryObj = {
  render: () => (
    <Section title="Kritik kararlar" description="Onay senden.">
      <Text>Bölüm içeriği buraya gelir.</Text>
    </Section>
  ),
};

/** Skeleton gerçek yerleşimi temsil eder — gri kutu değil. */
export const Yukleniyor: StoryObj = {
  render: () => (
    <Section title="Executive KPI'lar" loading loadingLayout="kpi" loadingCount={4} />
  ),
};

export const Bos: StoryObj = {
  render: () => (
    <Section
      title="Automation Queue"
      empty
      emptyTitle="AutomationQueue sözleşmesi tanımlı değil"
      emptyDescription="Uydurulmuş bir liste göstermek yerine boş bırakıldı."
      emptySuggestion="Soru 13-backend-recommendations.md §14.2'ye düşüldü."
    />
  ),
};

export const Hata: StoryObj<{ onRetry: () => void }> = {
  args: { onRetry: fn() },
  render: (args) => (
    <Section
      title="Kritik riskler"
      error={{
        what: "Risk listesi yüklenemedi",
        why: "ODIN yerel sunucusu (127.0.0.1) yanıt vermedi.",
        impact: "Aksiyon gerektiren uyarılar görünmüyor; karar verilmemeli.",
        fix: "ODIN sunucusunu başlat, sonra yeniden dene.",
      }}
      onRetry={args.onRetry}
    />
  ),
  /**
   * UI-ADR-186 — meclisin (terra) TEK itirazı buydu ve haklıydı.
   *
   * `ErrorState`in kendi retry testi (`states.stories.tsx`) bu bileşeni
   * KANITLAMAZ: `Section` bir pass-through değil, HANGİ DALIN çizileceğine
   * karar veren yer. `onRetry`ı iletmeyi unutursa `ErrorState` kusursuz
   * çalışmaya devam eder — buton çizilir, basılır, hiçbir şey olmaz.
   * Ölçülen şey iletim; ekranların hata dalı bu bileşenden geçiyor.
   */
  play: async ({ canvasElement, args }) => {
    const b = within(canvasElement).getByRole("button", { name: "Yeniden dene" });
    await userEvent.click(b);
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};
