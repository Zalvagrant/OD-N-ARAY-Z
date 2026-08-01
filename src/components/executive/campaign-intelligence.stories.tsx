/** S6 · 18 — CampaignIntelligenceList */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { useNavigationStore } from "@/lib/store/navigation";
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
  /**
   * AÇILMA HAFIZAYA YAZILMAZ — UI-ADR-186. `ai-recommendation-card`ın
   * karşı kutbu.
   *
   * Bu kart yerel `useState` kullanıyor; kardeşi `useDisclosureMemory`
   * kullanıyor. Ekranda ikisi de aynı görünür, aynı `aria-expanded`ı
   * çevirir — fark ancak workspace'ten çıkıp dönünce belli olur: bu kart
   * kapanmış olur, öteki açık kalır.
   *
   * ⚠️ Bu test FARKI KİLİTLEMEK için değil, farkın BUGÜN VAR OLDUĞUNU
   * belgelemek için yazıldı. Tutarsızlık denetimde bulundu; gidermek
   * gözlenebilir davranışı değiştirir ve bu görevin yasağı kapsamında —
   * sahibin kararına bırakıldı. Karar "birleştir" olursa bu `play`
   * KIRILACAK ve kırılması doğru olacak: sözleşmenin değiştiğini söyler.
   */
  play: async ({ canvasElement }) => {
    useNavigationStore.setState({ memory: {} });

    const c = within(canvasElement);
    const b = c.getAllByRole("button", { name: /^Önerilen aksiyon/ })[0];
    await expect(b).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(b);
    await expect(b).toHaveAttribute("aria-expanded", "true");

    /* Kardeşinden ayıran tek ölçülebilir iz: store'a HİÇBİR ŞEY yazılmadı. */
    await expect(
      Object.keys(useNavigationStore.getState().memory)
    ).toHaveLength(0);
  },
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
