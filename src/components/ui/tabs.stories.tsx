/** S3 · 16 — Tabs (workspace header sekmeleri, UI-ADR-072) */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { TabPanel, Tabs } from "./tabs";
import { Text } from "./typography";

type Tab = "health" | "performance" | "security" | "ai";

const meta: Meta = {
  title: "Core/16 · Tabs",
  parameters: { layout: "padded" },
};
export default meta;

export const Default: StoryObj = {
  render: function Render() {
    const [tab, setTab] = useState<Tab>("health");
    return (
      <div className="max-w-2xl">
        <Tabs
          label="System Director sekmeleri"
          value={tab}
          onChange={setTab}
          items={[
            { id: "health", label: "Health" },
            { id: "performance", label: "Performance", count: 3 },
            { id: "security", label: "Security" },
            { id: "ai", label: "AI Runtime", disabled: true },
          ]}
        />
        <div className="pt-4">
          <TabPanel id="health" active={tab === "health"}>
            <Text tone="secondary">Sistem sağlığı — ← → ile sekme değiştir.</Text>
          </TabPanel>
          <TabPanel id="performance" active={tab === "performance"}>
            <Text tone="secondary">Performans metrikleri.</Text>
          </TabPanel>
          <TabPanel id="security" active={tab === "security"}>
            <Text tone="secondary">Güvenlik.</Text>
          </TabPanel>
        </div>
        <Text size="sm" tone="tertiary" className="pt-4">
          &quot;AI Runtime&quot; devre dışı: karşılığı olan veri S9&apos;da
          gelecek. Sayaç yalnızca gerçekten biliniyorsa gösterilir.
        </Text>
      </div>
    );
  },
};

/**
 * UI-ADR-142 — envanter kapısının davranış koşulu.
 * Sekme klavye gezinmesi ARIA tablist kalıbının kalbidir ve fareyle
 * bakarken görünmez: ok tuşları çalışmazsa klavye kullanıcısı ikinci
 * sekmeye HİÇ ulaşamaz.
 */
export const KlavyeGezinmesi: StoryObj = {
  name: "Ok tuşlarıyla gezilir, odak seçili sekmede TOPLANIR",
  render: function Render() {
    const [value, setValue] = useState<Tab>("health");
    return (
      <Tabs
        label="Görünüm"
        value={value}
        onChange={setValue}
        items={[
          { id: "health", label: "Health" },
          { id: "performance", label: "Performance" },
          { id: "security", label: "Security" },
        ]}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole("tab");

    /* Roving tabindex: SEKME grubu Tab sırasında TEK durak işgal eder.
       Hepsi tabIndex=0 olsaydı, 6 sekmeli bir grup klavye kullanıcısını
       6 kez durdururdu. */
    await expect(tabs[0]).toHaveAttribute("tabindex", "0");
    await expect(tabs[1]).toHaveAttribute("tabindex", "-1");
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    tabs[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    await expect(tabs[1]).toHaveFocus();

    /* Sondan başa SARAR — kullanıcı listenin ucunda sıkışmaz. */
    await userEvent.keyboard("{End}");
    const last = tabs[tabs.length - 1];
    await expect(last).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}");
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  },
};
