import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Pressable } from "./pressable";

/**
 * UI-ADR-132. Bu hikâyeler görsel değil SÖZLEŞME testidir: klavye yolu
 * sessizce kaybolan türden bir özelliktir — fareyle bakan hiç fark etmez.
 */
const meta: Meta<typeof Pressable> = {
  title: "Core/Pressable",
  component: Pressable,
  args: { label: "Alarmı seç", onPress: fn() },
};
export default meta;

type Story = StoryObj<typeof Pressable>;

const BlockContent = (
  <div className="flex flex-col gap-1">
    <p className="text-content">BuyBox kaybı — 3 SKU</p>
    <p className="text-xs text-content-tertiary">amazon · 12 dk önce</p>
  </div>
);

export const Default: Story = {
  args: { children: BlockContent },
};

export const KlavyeIleErisilir: Story = {
  name: "Klavye ile erişilir (Tab · Enter · Space)",
  args: { children: BlockContent },
  play: async ({ canvasElement, args }) => {
    const el = within(canvasElement).getByRole("button", { name: "Alarmı seç" });

    /* Odaklanabilir olmak ZORUNDA: eski `Card interactive` düz bir div'di,
       tabIndex yoktu ve klavye kullanıcısı öğeye hiç ulaşamıyordu. */
    await userEvent.tab();
    await expect(el).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await expect(args.onPress).toHaveBeenCalledTimes(1);

    await userEvent.keyboard(" ");
    await expect(args.onPress).toHaveBeenCalledTimes(2);
  },
};

export const BlokIcerikSarabilir: Story = {
  name: "Blok içerik sarabilir — <button> saramazdı",
  args: { children: BlockContent },
  play: async ({ canvasElement }) => {
    const el = within(canvasElement).getByRole("button", { name: "Alarmı seç" });

    /* `<button>` içerik modeli phrasing content'tir; `<p>` flow'dur.
       Geçersiz iç içelik tam olarak buydu ve iki listede birden vardı. */
    await expect(el.tagName).toBe("DIV");
    await expect(el.querySelectorAll("p")).toHaveLength(2);

    /* Erişilebilir ad AÇIKÇA verilir: yoksa alt metinlerin tamamı
       birleşip tek nefeslik bir cümle olarak okunur. */
    await expect(el).toHaveAttribute("aria-label", "Alarmı seç");
  },
};
