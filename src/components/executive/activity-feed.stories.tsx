/** S5 · 17 — ActivityFeed (Executive Intelligence Feed) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { IntelligenceItem } from "@/types/screens";
import { ActivityFeed } from "./activity-feed";
import { ago, envelope } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/17 · ActivityFeed",
  parameters: { layout: "padded" },
};
export default meta;

const items: IntelligenceItem[] = [
  { id: "1", category: "critical_risk", title: "BuyBox kaybı üç SKU'ya yayıldı", at: ago(11 * 60_000), priority: 1, actor: "Amazon AI" },
  { id: "2", category: "pending_approval", title: "PPC bütçe kararı onay bekliyor", at: ago(14 * 60_000), priority: 1, actor: "Executive AI" },
  { id: "3", category: "amazon_anomaly", title: "Kampanya B TBM %19 arttı", at: ago(38 * 60_000), priority: 2 },
  { id: "4", category: "ai_recommendation", title: "Acil sipariş önerisi hazır", at: ago(42 * 60_000), priority: 2, actor: "Amazon AI" },
  { id: "5", category: "financial_deviation", title: "Net kâr marjı %4 sapıyor", at: ago(88 * 60_000), priority: 2, actor: "Finance AI" },
  { id: "6", category: "competitor_alert", title: "Rakip A fiyatı %6 düşürdü", at: ago(2 * 60 * 60_000), priority: 3 },
  { id: "7", category: "market_intelligence", title: "Kategori talebi yükselişte", at: ago(4 * 60 * 60_000), priority: 3 },
  { id: "8", category: "director_activity", title: "Çelişki taraması başladı", at: ago(5 * 60 * 60_000), priority: 4 },
  /* Zaman damgası YOK → "az önce" uydurulmaz, NoData çıkar. */
  { id: "9", category: "new_knowledge", title: "Repricer geri bildirimi işlendi", at: null, priority: 4 },
  { id: "10", category: "security_event", title: "Yeni cihazdan giriş", at: ago(11 * 60 * 60_000), priority: 5 },
];

/** On öğe var, altısı görünür. Ses yok, dikkat çeken animasyon yok. */
export const AltiGorunur: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <ActivityFeed env={envelope(items, { source: "mock" })} />
    </div>
  ),
  /**
   * UI-ADR-186. Hikâye başlığı sözleşmeyi zaten İDDİA EDİYOR ("on öğe var,
   * altısı görünür") ve hiçbir şey onu koşturmuyordu.
   *
   * Kesme bir SUNUM kararıdır, veri kaybı değil — ama ancak gizlenenin
   * sayısı söylendiği ve geri getirilebildiği sürece. Buton kopar ya da
   * sayı yanlış hesaplanırsa (`sorted.length - shown.length`) kullanıcı
   * akışın altı öğeden ibaret olduğunu sanır; kritik risk 7. sırada
   * olabilir. Kısaltma yolu da ölçülüyor: tek yönlü bir "göster" düğmesi
   * listeyi bir daha asla toparlanamaz hale getirir.
   */
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const liste = c.getByRole("list", { name: "Executive Intelligence Feed" });
    await expect(within(liste).getAllByRole("listitem")).toHaveLength(6);

    await userEvent.click(c.getByRole("button", { name: "4 öğe daha göster" }));
    await expect(within(liste).getAllByRole("listitem")).toHaveLength(10);

    await userEvent.click(c.getByRole("button", { name: "Kısalt" }));
    await expect(within(liste).getAllByRole("listitem")).toHaveLength(6);
  },
};

export const AkisBos: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <ActivityFeed env={envelope([], { source: "mock" })} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <ActivityFeed env={null} />
    </div>
  ),
};
