/**
 * S6 · 4 — Amazon SKU bağlam paneli (06-workspaces.md §1.7)
 *
 * Panel seçimi store'dan okur (`SelectedEntity`, UI-ADR-098) ve SKU'yu
 * KİMLİKLE kanonik kaynaktan bulur. Story'ler bu yüzden prop değil,
 * store durumu kurar — gerçek kullanımdaki yol da budur.
 *
 * Genişlik `w-96`: sağ panelin `expanded`/`pinned` genişliği. Panel dar bir
 * kolondur; story'yi geniş bırakmak dar kolonda çıkan taşmaları gizlerdi.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useUiStore } from "@/lib/store/ui";
import { AmazonSkuPanel, AMAZON_SKU_KIND } from "./screen";

const select = (id: string | null) => () => {
  useUiStore.setState({
    selectedEntity: id ? { workspaceId: "amazon", kind: AMAZON_SKU_KIND, id } : null,
  });
  /* Temizlik: story'ler birbirinin seçimini miras almaz. */
  return () => useUiStore.setState({ selectedEntity: null });
};

const meta: Meta = {
  title: "Screens/4 · Amazon SKU Bağlam Paneli",
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <div className="w-96 bg-bg-secondary p-3">
        <Story />
      </div>
    ),
  ],
};
export default meta;

/** Yedi bölümün tamamı: Summary → Financial → Advertising → Inventory → History → AI → Actions. */
export const Secili: StoryObj = {
  beforeEach: select("SKU-1042"),
  render: () => <AmazonSkuPanel />,
};

/**
 * Ölçümü olmayan SKU: dönüşüm oranı, BuyBox ve sağlık skoru NoData çıkar.
 * "0" yazmak "ölçülmedi" demek değildir.
 */
export const OlcumsuzSku: StoryObj = {
  beforeEach: select("SKU-3050"),
  render: () => <AmazonSkuPanel />,
};

/**
 * Seçim var ama kayıt yok — liste yenilenip SKU düşmüş olabilir.
 * Detay UYDURULMAZ; ne olduğu yazılır.
 */
export const KayitYok: StoryObj = {
  beforeEach: select("SKU-YOK-0000"),
  render: () => <AmazonSkuPanel />,
};

/**
 * Seçim yok → bileşen `null` döner ve sağ panelin KENDİ "seçili nesne yok"
 * boş durumu ayakta kalır (S2'de tanımlı, S6'da değiştirilmedi). Bu story
 * bilerek boştur: panelin kabuğu bu bileşenin işi değildir.
 */
export const SecimYok: StoryObj = {
  beforeEach: select(null),
  render: () => <AmazonSkuPanel />,
};
