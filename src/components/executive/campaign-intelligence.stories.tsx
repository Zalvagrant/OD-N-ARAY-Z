/** S6 · 18 — CampaignIntelligenceList */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { campaignsMock } from "@/mocks/amazon";
import { CampaignIntelligenceList } from "./campaign-intelligence";

const meta: Meta = {
  title: "Executive/18 · CampaignIntelligence",
  parameters: { layout: "padded" },
};
export default meta;

const base = campaignsMock();

/**
 * Sıralama SORUNLUDAN sağlıklıya: zayıf performans → ACOS yükseliyor →
 * bütçe erken bitiyor → ölçeklenebilir → sağlıklı.
 * Kampanya C'nin önerisi tek alternatiflidir → gösterilmez, elendiği yazılır
 * (UI-ADR-091).
 */
export const BesKampanya: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <CampaignIntelligenceList env={base} />
    </div>
  ),
};

export const KampanyaYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <CampaignIntelligenceList env={{ data: [], meta: base.meta }} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <CampaignIntelligenceList env={null} />,
};
