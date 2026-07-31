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
import { expect, within } from "storybook/test";
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* Yedi bölüm başlığı — panelin sözleşmesi bu dizilim (06-...md §1.7).
       Bir bölüm sessizce düşerse ekran hâlâ "çalışır" görünür. */
    await canvas.findByText("SKU-1042", {}, { timeout: 15_000 });
    const basliklar = canvas.getAllByRole("heading");
    await expect(basliklar.length).toBeGreaterThanOrEqual(5);
  },
};

/**
 * Ölçümü olmayan SKU: dönüşüm oranı, BuyBox ve sağlık skoru NoData çıkar.
 * "0" yazmak "ölçülmedi" demek değildir.
 */
export const OlcumsuzSku: StoryObj = {
  beforeEach: select("SKU-3310"),
  render: () => <AmazonSkuPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* SKU-3310: fixture'daki EN ÇOK ölçümsüz alanı olan kayıt.
       ⚠️ Önce "SKU-3050" yazılıydı ve o kimlik fixture'da HİÇ YOK — story
       sessizce "kayıt bulunamadı" dalını çiziyordu, yani "ölçümsüz SKU"
       durumunu hiç göstermiyordu. Kapı (UI-ADR-153) bunu ortaya çıkardı:
       iddiasız bir story yanlış şeyi çizdiğini bile söyleyemez. */
    await canvas.findByText("SKU-3310", {}, { timeout: 15_000 });

    /* ASIL İDDİA: ölçülmemiş alanlar "—" çıkar, SIFIR değil. "0 dönüşüm"
       bir ÖLÇÜMDÜR ve yanlıştır; doğrusu "ölçülmedi". Bu ayrım kaybolursa
       ekran ölçülmemiş bir SKU'yu kötü performans gösteriyormuş gibi
       sunar (CLAUDE.md §2). */
    const tireler = canvasElement.querySelectorAll("span.odin-num");
    const olculmemis = [...tireler].filter((n) => n.textContent?.trim() === "—");
    await expect(olculmemis.length).toBeGreaterThan(0);

    /* Her "—" bir GEREKÇE taşır: sessiz bir tire, sistemin bozuk mu yoksa
       verinin mi olmadığını söylemez. */
    await expect(olculmemis[0].getAttribute("aria-label")).toBeTruthy();
  },
};

/**
 * Seçim var ama kayıt yok — liste yenilenip SKU düşmüş olabilir.
 * Detay UYDURULMAZ; ne olduğu yazılır.
 */
export const KayitYok: StoryObj = {
  beforeEach: select("SKU-YOK-0000"),
  render: () => <AmazonSkuPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* Kayıt yoksa DETAY UYDURULMAZ — ne olduğu yazılır. */
    await canvas.findByText(/artık listede yok/i, {}, { timeout: 15_000 });

    /* Ve seçili kimlik ekranda kalır: kullanıcı NEYİN bulunamadığını
       bilmeli, yoksa boş panel bir arıza gibi okunur. */
    await expect(canvas.getByText(/SKU-YOK-0000/)).toBeInTheDocument();
  },
};

/**
 * Seçim yok → bileşen `null` döner ve sağ panelin KENDİ "seçili nesne yok"
 * boş durumu ayakta kalır (S2'de tanımlı, S6'da değiştirilmedi). Bu story
 * bilerek boştur: panelin kabuğu bu bileşenin işi değildir.
 */
export const SecimYok: StoryObj = {
  beforeEach: select(null),
  render: () => <AmazonSkuPanel />,
  play: async ({ canvasElement }) => {
    /* İDDİA BİR YOKLUKTUR ve tam olarak öyle olmalı: bileşen `null` döner,
       sağ panelin KENDİ boş durumu ayakta kalır. Buraya bir "seçim yok"
       metni koymak, aynı mesajın İKİ sahibi olması demekti. */
    await expect(canvasElement.querySelector("[data-testid], section, article"))
      .toBeNull();
    await expect(canvasElement.textContent?.trim()).toBe("");
  },
};
