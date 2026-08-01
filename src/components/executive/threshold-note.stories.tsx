/**
 * ThresholdNote — UI-ADR-126 (ODIN ADR-0146). Story UI-ADR-150'de yazıldı.
 *
 * Bu bileşen "sahte veri yasağı"nın en sinsi biçimini kapatır: uydurulmuş
 * bir SAYI değil, uydurulmuş bir OTORİTE. "3 SKU kritik stokta" cümlesinde
 * sayı ölçülmüştür ama **"kritik" kelimesi bir eşiğe dayanır** ve ODIN o
 * eşiğin sahibi tarafından hiç onaylanmadığını beyan eder.
 *
 * Not görünmezse ekran "Kritik" rozetini yetkili bir hükümmüş gibi sunar
 * ve ODIN'in açıkça yazdığı belirsizliği YUTAR. Bu yüzden testler iki
 * yönlüdür: onaysızken görünmeli, onaylıyken görünmemeli.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { ThresholdNote } from "./threshold-note";

const meta: Meta<typeof ThresholdNote> = {
  title: "Executive/ThresholdNote",
  component: ThresholdNote,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof ThresholdNote>;

const NOTE = /sahibin onaylamadığı varsayılan bir eşik/i;

export const OnaysizEsikGorunur: Story = {
  name: "unapproved_default → uyarı GÖRÜNÜR",
  args: { provenance: "unapproved_default" },
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByText(NOTE);
    await expect(note).toBeInTheDocument();
    /* Sayı ile SINIR ayrımı metinde AÇIKÇA yazılı olmalı: kullanıcı neyin
       ölçüldüğünü neyin kararlaştırılmadığını görmeden karar veremez. */
    await expect(note).toHaveTextContent(/sayı ölçüldü/i);
    await expect(note).toHaveTextContent(/sınır kararlaştırılmadı/i);
  },
};

export const OnayliEsikSessizdir: Story = {
  name: "owner_policy → HİÇBİR ŞEY çizilmez",
  args: { provenance: "owner_policy" },
  play: async ({ canvasElement }) => {
    /* Onaylı eşik NORMAL durumdur. Her karta "bu onaylı" yazmak gürültüden
       başka bir şey üretmez ve gürültü, gerçek uyarıyı görünmez kılar. */
    await expect(within(canvasElement).queryByText(NOTE)).toBeNull();
    await expect(canvasElement.textContent?.trim()).toBe("");
  },
};

export const BilinmiyorsaIDDIA_URETILMEZ: Story = {
  name: "provenance YOKSA hiçbir iddia üretilmez",
  args: { provenance: undefined },
  play: async ({ canvasElement }) => {
    /* SINIR DURUM ve asıl tuzak: "bilmiyorum" ile "onaylanmadı" AYRI
       şeylerdir. ODIN provenance yollamadığında "onaylanmadı" yazmak,
       olmayan bir yönetişim bulgusu UYDURMAK olurdu — tam da bu bileşenin
       engellemek için var olduğu şey. Sessiz kalmak dürüsttür. */
    await expect(within(canvasElement).queryByText(NOTE)).toBeNull();
    await expect(canvasElement.textContent?.trim()).toBe("");
  },
};
