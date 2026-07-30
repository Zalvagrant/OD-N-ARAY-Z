/** S4 · 10 — OpportunityCard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OpportunityCard } from "./opportunity-card";
import { envelope, opportunity } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/10 · OpportunityCard",
  parameters: { layout: "padded" },
};
export default meta;

/**
 * Risk ile EŞİT görsel ağırlık — fırsat yan kutu değildir.
 * FR-0046 v1: parasal etki ("Gelir etkisi") sözleşmede YOK; kart başlık +
 * gerekçe + zorunlu önerilen aksiyon + kanıt anahtarlarından oluşur.
 */
export const Firsat: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <OpportunityCard env={envelope(opportunity, { source: "ai" })} />
    </div>
  ),
};

/** Kanıt anahtarı yayınlanmamış → kanıt bölümü hiç çizilmez. */
export const KanitYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <OpportunityCard env={envelope({ ...opportunity, evidence: undefined })} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <OpportunityCard env={null} />,
};
