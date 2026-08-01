/** S4 · 9 — AlertStack */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import type { Alert } from "@/types/executive";
import { AlertStack } from "./alert-stack";
import { alerts, envelope } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/9 · AlertStack",
  parameters: { layout: "padded" },
};
export default meta;

/**
 * KURAL: requiresAction:false olan öğe listeye GİRMEZ.
 * Fixture'daki 3 uyarıdan biri bilgi amaçlıdır → 2 satır görünür,
 * altta "1 olay listelenmedi" yazar. Sessiz yutma yoktur.
 */
export const SadeceAksiyonGerektirenler: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <AlertStack env={envelope(alerts, { source: "internal" })} />
    </div>
  ),
};

/**
 * SEÇİLEBİLİR SATIRLAR — UI-ADR-187, bağlama testi.
 *
 * YENİ hikâye olarak eklendi; üstteki `SadeceAksiyonGerektirenler`e
 * dokunulmadı çünkü ona `onSelect` vermek onun GÖRÜNÜMÜNÜ değiştirirdi
 * (satırlar butona döner) ve bu görevin yasağı kapsamında.
 *
 * Ölçülen şey `Pressable`ın klavye sözleşmesi DEĞİL — o
 * `pressable.stories.tsx`te zaten testli. Burada ölçülen BAĞLAMA:
 * geri çağrıya UYARININ KENDİSİ geçiyor mu? Yanlış nesne geçseydi sağ
 * bağlam paneli BAŞKA bir uyarının detayını açardı; ekranda her şey
 * tutarlı görünür ve kimse sorgulamaz. `alert-stack.tsx`in erişilebilir
 * adı da "önem: başlık" biçiminde ve axe bunun ANLAMLI olduğunu göremez.
 */
export const SecilebilirSatirlar: StoryObj<{ onSelect: (a: Alert) => void }> = {
  args: { onSelect: fn() },
  render: (args) => (
    <div className="max-w-2xl">
      <AlertStack
        env={envelope(alerts, { source: "internal" })}
        onSelect={args.onSelect}
      />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    const aksiyonluk = alerts.filter((a) => a.requiresAction);

    /* Sarma KOŞULLU: yalnız aksiyon gerektirenler satır olur, ve hepsi
       olur. Süzgeç ile sarma ayrışırsa bilgi amaçlı bir olay tıklanabilir
       görünür ve kullanıcı üzerine düşecek bir aksiyon arar. */
    const satirlar = c.getAllByRole("button");
    await expect(satirlar).toHaveLength(aksiyonluk.length);

    await userEvent.click(satirlar[0]);
    await expect(args.onSelect).toHaveBeenCalledWith(aksiyonluk[0]);
  },
};

export const HicAksiyonYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <AlertStack env={envelope(alerts.filter((a) => !a.requiresAction), { source: "internal" })} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <AlertStack env={null} />,
};
