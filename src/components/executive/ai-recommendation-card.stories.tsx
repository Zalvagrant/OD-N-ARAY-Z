/** S4 · 5 — AIRecommendationCard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { useNavigationStore } from "@/lib/store/navigation";
import { AIRecommendationCard } from "./ai-recommendation-card";
import { envelope, recommendation, recommendationEksikAlan } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/5 · AIRecommendationCard",
  parameters: { layout: "padded" },
};
export default meta;

/** ODIN'in 10 zorunlu alanı tam: öneri, flip koşulları ve güven dökümüyle. */
export const Aciklanabilir: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <AIRecommendationCard env={envelope(recommendation, { source: "ai" })} />
    </div>
  ),
  /**
   * AÇILMA HAFIZAYA YAZILIR — UI-ADR-186.
   *
   * Meclis 2/2: bu kart ile `campaign-intelligence` AYNI görünen ama FARKLI
   * iki sözleşmedir. Bu kart `useDisclosureMemory` kullanır (store tabanlı,
   * unmount'tan sağ çıkar); öteki yerel `useState` kullanır (unmount'ta
   * ölür). Fark kullanıcı tarafından gözlenebilir: workspace'ten çıkıp
   * dönünce bu kart AÇIK kalır.
   *
   * ⚠️ FARKI unmount/remount ile ölçemiyorum — bir story tek kez render
   * edilir, `play` içinde bileşeni söküp yeniden takmanın yolu yok. Bunun
   * yerine AYIRT EDİCİ İZİ ölçüyorum: store'a yazılıp yazılmadığı.
   * Kalıcılığın kendisi `lib/store/policy.test.ts`te ayrıca test edilmiş
   * durumda; burada ölçülen o testin bu bileşene BAĞLI olduğu.
   */
  play: async ({ canvasElement }) => {
    /* Store modül tekilidir ve hikâyeler aynı tarayıcı bağlamında koşar —
       önceki hikâyeden sızan bir kayıt bu testi sahte yeşil yapardı. */
    useNavigationStore.setState({ memory: {} });

    const c = within(canvasElement);
    const b = c.getByRole("button", { name: "Gerekçe, döküm ve kanıt" });
    await expect(b).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(b);
    await expect(
      c.getByRole("button", { name: "Gerekçeyi kapat" })
    ).toHaveAttribute("aria-expanded", "true");

    const yazilanlar = Object.values(useNavigationStore.getState().memory)
      .flatMap((m) => m.expandedIds ?? []);
    await expect(yazilanlar).toContain("rec:rec-1");
  },
};

/** ODIN'in zorunlu kıldığı bir alan (flip_conditions) eksik → HİÇ render
    edilmez. Bastırma gerçeğini çağıran yazar (UI-ADR-091/100). */
export const EksikAlanRenderEtmez: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <p className="mb-2 text-sm text-content-tertiary">
        Aşağıda bir kart OLMALIYDI ama flip_conditions eksik — null döner:
      </p>
      <AIRecommendationCard env={envelope(recommendationEksikAlan, { source: "ai" })} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <AIRecommendationCard env={null} />
    </div>
  ),
};
