import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Stat } from "./stat";
import { Num } from "./typography";
import { NoData } from "./no-data";

/**
 * UI-ADR-136. `Stat` artık etiket-değer gösteriminin TEK yolu:
 * `mission-control` kendi kopyasını, `executive-briefing` dört elle
 * yazılmış `<dt>/<dd>` çiftini bıraktı.
 *
 * Bu hikâyeler görsel değil SÖZLEŞME testidir. Kilitlenen iki kural:
 *   1. Düz sayı SATIR İÇİ `span.odin-num`a sarılır — blok elemana verilirse
 *      `.odin-num` sağa hizalar ve sayı etiketinden kopar (03-...md §11).
 *      Elle yazılan kopyaların kaybettiği tam olarak buydu.
 *   2. Düğüm değer OLDUĞU GİBİ geçer — bileşen "0" ya da tire uydurmaz;
 *      veri yoksa çağıranın `<NoData/>`ı görünür (CLAUDE.md §2).
 */
const meta: Meta<typeof Stat> = {
  title: "Core/Stat",
  component: Stat,
};
export default meta;

type Story = StoryObj<typeof Stat>;

export const Default: Story = {
  args: { label: "Sağlıklı Director", value: 12, note: "ODIN status: healthy" },
};

export const DuzSayiSatirIcindedir: Story = {
  name: "Düz sayı satır içi sarılır — sağa hizalama etiketten koparmaz",
  args: { label: "Telemetri kanalı", value: "3 / 7", note: "açık / tanımlı" },
  play: async ({ canvasElement }) => {
    const dd = canvasElement.querySelector("dd");
    await expect(dd).not.toBeNull();

    /* `.odin-num` SPAN'de olmalı, `dd`de değil. */
    await expect(dd!.classList.contains("odin-num")).toBe(false);
    const span = dd!.querySelector("span.odin-num");
    await expect(span).not.toBeNull();
    await expect(span!.textContent).toBe("3 / 7");
  },
};

export const DugumDegerOlduguGibiGecer: Story = {
  name: "Düğüm değer olduğu gibi geçer — bileşen sayı uydurmaz",
  args: {
    label: "AI Readiness",
    value: <Num value={null} noDataReason="Bu gösterge henüz üretilmiyor" />,
  },
  play: async ({ canvasElement }) => {
    const dd = canvasElement.querySelector("dd")!;

    /* Düğüm DOĞRUDAN `dd`nin çocuğudur — `Stat` etrafına kendi span'ini
       sarmaz. Sarsaydı `size="lg"` (varsayılan) "veri yok" tiresini sayı
       boyutunda büyütürdü. `NoData` zaten `odin-num` taşır (hizalama için),
       bu yüzden ayırt eden şey sınıfın varlığı değil `text-lg`in YOKLUĞU. */
    await expect(dd.children).toHaveLength(1);
    const node = dd.firstElementChild!;
    await expect(node.getAttribute("aria-label")).toMatch(/üretilmiyor/i);
    await expect(node.classList.contains("text-lg")).toBe(false);

    await expect(
      within(canvasElement).getByLabelText(/üretilmiyor/i)
    ).toBeInTheDocument();
  },
};

export const TonSozlugu: Story = {
  name: "Ton sözlüğü typography ile ORTAK (tek sözlük)",
  render: () => (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Stat label="Hatalı" value={2} tone="danger" note="ODIN status: failed" />
      <Stat label="Gecikmiş" value={1} tone="warning" note="ritmi kaçırdı" />
      <Stat label="Sağlıklı" value={9} tone="success" note="ölçüldü" />
      <Stat
        label="Bilinmiyor"
        value={<NoData reason="Hiç gözlem yok" />}
        tone="tertiary"
      />
    </dl>
  ),
  play: async ({ canvasElement }) => {
    /* `tone="tertiary"` — eski yerel kopyada adı `muted` idi ve o sözlük
       `ui/typography.tsx`teki yediliye eklenen bir tonu hiç görmezdi.
       Filtre `text-lg`: `NoData` da `odin-num` taşır ama `Stat`ın boyut
       sınıfını almaz, yani düz-sayı yolundan geçenler bunlardır. */
    const nums = canvasElement.querySelectorAll("span.odin-num.text-lg");
    await expect(nums).toHaveLength(3);
    await expect(nums[0].classList.contains("text-danger")).toBe(true);
    await expect(nums[1].classList.contains("text-warning")).toBe(true);
    await expect(nums[2].classList.contains("text-success")).toBe(true);
  },
};

export const TruncateYerlesimGuvencesidir: Story = {
  name: "truncate — dar hücrede etiket KIRPILIR, varsayılan KAPALI",
  render: () => (
    <dl className="grid w-48 grid-cols-2 gap-4">
      <div data-testid="off">
        <Stat label="Çok uzun bir metrik etiketi" value={12} />
      </div>
      <div data-testid="on">
        <Stat label="Çok uzun bir metrik etiketi" value={12} truncate />
      </div>
    </dl>
  ),
  play: async ({ canvasElement }) => {
    const dt = (id: string) =>
      canvasElement.querySelector(`[data-testid="${id}"] dt`)!;
    const wrapper = (id: string) =>
      canvasElement.querySelector(`[data-testid="${id}"] dt`)!.parentElement!;

    /* VARSAYILAN KAPALI. `truncate` `white-space: nowrap` demektir ve iki
       satıra sarabilen bir etiketi tek satıra kırpar; açık gelseydi
       UI-ADR-147 mevcut ON KÜSUR çağıranın hepsinin görünümünü sessizce
       değiştirirdi. */
    await expect(dt("off").classList.contains("truncate")).toBe(false);
    await expect(wrapper("off").classList.contains("min-w-0")).toBe(false);

    /* AÇIKKEN İKİSİ BİRDEN. `truncate` tek başına yetmez: `min-w-0`
       olmadan grid hücresi içeriğinin altına inemez, sütun şişer ve
       komşusunun üstüne taşar — kırpma hiç devreye girmez. */
    await expect(dt("on").classList.contains("truncate")).toBe(true);
    await expect(wrapper("on").classList.contains("min-w-0")).toBe(true);

    /* Kırpılan etiket ekranda taşmaz ama METNİ KAYBOLMAZ: DOM'da tam
       hâliyle durur, yani ekran okuyucu tamamını okur. */
    await expect(dt("on").textContent).toBe("Çok uzun bir metrik etiketi");
    await expect(dt("on").scrollWidth).toBeGreaterThan(dt("on").clientWidth);
  },
};
