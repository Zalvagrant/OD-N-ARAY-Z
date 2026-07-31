/**
 * NoData — anti-fake kuralının EN KÜÇÜK parçası (CLAUDE.md §2).
 * Story UI-ADR-142'de yazıldı.
 *
 * 18 satırlık bir bileşen ama arayüzdeki HER "veri yok" durumunun tek
 * çıkışıdır. Yanlış çalışırsa hata vermez — ekran sadece bir sıfır ya da
 * boşluk gösterir ve kullanıcı ölçülmemiş bir şeyi ölçülmüş sanır.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { NoData } from "./no-data";

const meta: Meta<typeof NoData> = {
  title: "Core/NoData",
  component: NoData,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof NoData>;

export const GerekceIleBirlikte: Story = {
  name: "Gerekçe verilirse ad ve ipucu OLARAK yazılır",
  args: { reason: "Amazon ücretleri henüz gelmedi" },
  play: async ({ canvasElement }) => {
    const el = within(canvasElement).getByLabelText("Amazon ücretleri henüz gelmedi");

    /* Görsel içerik yalnız bir tiredir; ANLAM erişilebilir adda yaşar.
       Tire tek başına "sıfır mı, bilinmiyor mu?" sorusunu cevaplamaz. */
    await expect(el).toHaveTextContent("—");
    await expect(el).toHaveAttribute("title", "Amazon ücretleri henüz gelmedi");
  },
};

export const GerekceYoksaVarsayilan: Story = {
  name: "Gerekçe yoksa BİLE adsız bırakılmaz",
  args: { reason: undefined },
  play: async ({ canvasElement }) => {
    /* Adsız bir tire ekran okuyucuda hiç okunmaz — o hücre sanki BOŞ
       görünür ve "değer yok" bilgisi tamamen kaybolur. Bu yüzden
       varsayılan bir ad her zaman vardır. */
    const el = within(canvasElement).getByLabelText("Veri yok");
    await expect(el).toHaveTextContent("—");
  },
};

export const SayiSutunundaHIZALANIR: Story = {
  name: "Tire sayı sütununda HİZALANIR (odin-num taşır)",
  render: () => (
    <dl>
      <dt>Net kâr</dt>
      <dd>
        <NoData reason="COGS girilmedi" />
      </dd>
    </dl>
  ),
  play: async ({ canvasElement }) => {
    /* KASITLI ve kolayca yanlış anlaşılır: `NoData` bir SAYI değil ama
       `odin-num` taşır, çünkü sayı sütununda hizalanmazsa tablo okunmaz
       hâle gelir. Bu oturumda bir test tam olarak bunu yanlış varsaydı
       (`Stat`ın düğüm değeri sarmadığını `odin-num` yokluğuyla ölçmeye
       çalışmıştı) — kural burada kilitleniyor. */
    const el = within(canvasElement).getByLabelText("COGS girilmedi");
    await expect(el.classList.contains("odin-num")).toBe(true);
  },
};
