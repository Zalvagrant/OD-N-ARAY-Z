/** S3 · 16 — Tabs (workspace header sekmeleri, UI-ADR-072) */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
