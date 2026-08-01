/** S4 · 11 — CouncilView + ConsensusIndicator */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ConsensusIndicator, CouncilView } from "./council-view";
import { recommendation } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/11 · CouncilView",
  parameters: { layout: "padded" },
};
export default meta;

/** Skorlar ÖNERİNİN alanlarıdır (ODIN); disagreement = 100 − consensus. */
export const Kurul: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <CouncilView recommendation={recommendation} />
    </div>
  ),
};

export const SadeceGosterge: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <ConsensusIndicator consensus={66.7} disagreement={33.3} />
    </div>
  ),
};

/** Ölçülmemiş gösterge meter yerine "ölçülmedi" yazar. */
export const OlculmemisGostergeler: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <ConsensusIndicator consensus={null} disagreement={null} />
    </div>
  ),
};

/**
 * Azınlık görüşü yok → "kaydedilmemiş" yazılır, boş liste uydurulmaz VE
 * yokluktan mutabakat ÇIKARILMAZ.
 *
 * Bu story kapanış denetiminde bir SAHTE VERİ bulgusunu kilitledi: metin
 * *"Azınlık görüşü kaydedilmemiş — uzlaşma tam."* diyordu. İlk yarısı
 * dürüst, ikinci yarısı YOKLUKTAN çıkarılmış bir ölçümdü. Bileşenin kendi
 * başlığı Director pozisyonlarının ODIN şemasında SAKLANMADIĞINI
 * (`not_exposed`) yazıyor — boş liste bu kaynağın VARSAYILAN hâli, bir
 * mutabakat kanıtı değil.
 */
export const AzinlikYok: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <CouncilView
        recommendation={{ ...recommendation, minorityOpinions: [], consensusScore: 100, disagreementScore: 0 }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Azınlık görüşü kaydedilmemiş/)).toBeInTheDocument();

    /* ASIL İDDİA — YOKLUK. "Kimse itiraz kaydetmedi" ile "herkes aynı
       fikirde" AYRI şeylerdir; ikincisi uydurulmuş bir SAYI değil,
       uydurulmuş bir SONUÇTUR. */
    await expect(canvas.queryByText(/uzlaşma tam/i)).toBeNull();

    /* Saklanmama gerçeği ekranda AÇIKÇA yazılı kalmalı — okuyucunun
       boşluğu kendi kafasında doldurmasını engelleyen tek satır bu. */
    await expect(canvas.getByText(/karar kaydında saklanmaz/i)).toBeInTheDocument();
  },
};
