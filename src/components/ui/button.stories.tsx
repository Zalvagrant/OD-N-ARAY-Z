/** S3 · 3 — Button: 8 variant × 5 size × durum matrisi */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Plus } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "./button";

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "tertiary",
  "ghost",
  "danger",
  "success",
  "warning",
  "info",
];
const SIZES: ButtonSize[] = ["xs", "sm", "md", "lg", "xl"];

const meta: Meta<typeof Button> = {
  title: "Core/3 · Button",
  component: Button,
  parameters: { layout: "padded" },
};
export default meta;

export const Variants: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {VARIANTS.map((v) => (
        <Button key={v} variant={v}>
          {v}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: StoryObj = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {SIZES.map((s) => (
        <Button key={s} variant="primary" size={s}>
          {s.toUpperCase()}
        </Button>
      ))}
    </div>
  ),
};

/**
 * Desteklenen durumlar. Hover/Pressed/Focus prop DEĞİLDİR — CSS'ten gelir,
 * bu yüzden burada gösterilemez; fare ve Tab ile denenir (UI-ADR-086).
 */
export const States: StoryObj = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Default</Button>
      <Button variant="primary" disabled>
        Disabled
      </Button>
      <Button variant="primary" loading>
        Loading
      </Button>
      <Button variant="primary" offline>
        Offline
      </Button>
      <Button variant="primary" iconOnly aria-label="Yeni ekle" icon={<Plus className="h-4 w-4" />} />
    </div>
  ),
};

export const WithIcon: StoryObj = {
  args: {
    variant: "secondary",
    icon: <Plus className="h-4 w-4" aria-hidden />,
    children: "SKU ekle",
  },
};

/* --------------------------------------------------------------------------
   KİLİT SÖZLEŞMESİ — UI-ADR-184. Buradan aşağısı görsel değil DAVRANIŞ testi.

   `button.tsx` tek satırda üç prop'u tek kilide indiriyor:

       const locked = disabled || loading || offline;

   Üçünün de tıklamayı YUTMASI gerekiyordu ve ÜÇÜ DE test edilmiyordu.
   Yukarıdaki `States` hikâyesi dördünü yan yana ÇİZİYOR ama hiçbirine
   dokunmuyor — yani bugüne kadar ölçülen tek şey görünümdü.

   Neden bu üçü aynı ağırlıkta değil:
   `disabled` native'dir, kaybolursa tarayıcı yine de korur. `loading` ve
   `offline` ODIN'in KENDİ icadıdır; `locked` sadeleştirilirse ikisi de
   sessizce tıklanabilir olur. Bu bir karar sistemi: `offline` bir butonun
   ateşlediği komut ağ olmadığı için gerçekleşemez, ama kullanıcı eylemin
   yapıldığını sanır — bir kararı iki kez onaylamak da aynı kapıdan geçer.
   Görsel testin ve tip sisteminin ikisi de bunu göremez.

   ⚠️ KASTEN TEST EDİLMEDİ: `button.tsx`teki adsız-buton `console.error`
   kapısı (UI-ADR-154). `play` render'dan SONRA koşar; casusu kurmak için
   render'dan ÖNCE `console.error`ı değiştirmek gerekir ve bu, `preview.tsx`
   içindeki a11y kapısının kendi `beforeEach`iyle aynı yere uzanır. Kapının
   ASIL uygulaması derleme zamanındaki union tipidir ve o tsc ile zaten
   koşuyor; `console.error` ikinci ağdır.
   -------------------------------------------------------------------------- */

type Story = StoryObj<typeof Button>;

export const DisabledTiklamayiYutar: Story = {
  name: "Kilit · disabled tıklamayı yutar",
  args: { variant: "primary", disabled: true, onClick: fn(), children: "Onayla" },
  play: async ({ canvasElement, args }) => {
    const b = within(canvasElement).getByRole("button", { name: "Onayla" });
    await expect(b).toBeDisabled();
    await userEvent.click(b);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const LoadingTiklamayiYutar: Story = {
  name: "Kilit · loading tıklamayı yutar (çift onay olmaz)",
  args: { variant: "primary", loading: true, onClick: fn(), children: "Onayla" },
  play: async ({ canvasElement, args }) => {
    const b = within(canvasElement).getByRole("button", { name: /Onayla/ });
    /* `aria-busy` olmadan ekran okuyucu butonun meşgul olduğunu SÖYLEMEZ;
       kullanıcı cevapsız kalan butona tekrar basar. */
    await expect(b).toHaveAttribute("aria-busy", "true");
    await expect(b).toBeDisabled();
    await userEvent.click(b);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const OfflineTiklamayiYutar: Story = {
  name: "Kilit · offline tıklamayı yutar ve sebebini söyler",
  args: { variant: "primary", offline: true, onClick: fn(), children: "Onayla" },
  play: async ({ canvasElement, args }) => {
    const b = within(canvasElement).getByRole("button", { name: /Onayla/ });
    await expect(b).toBeDisabled();
    await userEvent.click(b);
    await expect(args.onClick).not.toHaveBeenCalled();
    /* Kilidin SEBEBİ görünür olmak zorunda: gerekçesiz kilitli bir buton
       kullanıcıya bozuk görünür, bağlantısız değil. */
    await expect(b).toHaveAttribute(
      "title",
      "Bağlantı yok — eylem şu an gerçekleştirilemez"
    );
  },
};

export const AcikButonTiklanir: Story = {
  name: "Kilit · kilitsiz buton GERÇEKTEN tıklanır",
  args: { variant: "primary", onClick: fn(), children: "Onayla" },
  play: async ({ canvasElement, args }) => {
    /* Üstteki üç testin karşı kutbu. Bu olmadan `locked = true` yazan bir
       hata da yeşil kalırdı: hiçbir şey tıklanmıyorsa hepsi "yutuluyor". */
    const b = within(canvasElement).getByRole("button", { name: "Onayla" });
    await userEvent.click(b);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
