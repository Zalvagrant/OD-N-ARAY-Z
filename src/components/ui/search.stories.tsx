/** S3 · 6 — Search (AYRI primitive, 10-...md §8.5) */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Search } from "./search";
import { Caption } from "./typography";

const CORPUS = [
  "LLU-HA-2024-BLK",
  "LLU-HA-2024-WHT",
  "Kulak arkası işitme cihazı",
  "Şarjlı model",
  "Pil paketi",
];

const meta: Meta<typeof Search> = {
  title: "Core/6 · Search",
  component: Search,
  parameters: { layout: "padded" },
};
export default meta;

export const WithResults: StoryObj = {
  render: function Render() {
    const [count, setCount] = useState<number | null>(null);

    return (
      <div className="max-w-md">
        <Search
          placeholder="SKU ya da ürün ara…"
          historyKey="odin.storybook.search"
          shortcutHint="Ctrl K"
          resultCount={count}
          onSearch={(q) =>
            setCount(
              q.trim()
                ? CORPUS.filter((c) =>
                    c.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr"))
                  ).length
                : null
            )
          }
        />
        <Caption>
          Aranmadan önce sayı YOK — &quot;0 sonuç&quot; ile &quot;henüz
          aranmadı&quot; farklı şeylerdir.
        </Caption>
      </div>
    );
  },
};

export const Searching: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <Search searching resultCount={null} onSearch={() => {}} />
    </div>
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <Search disabled placeholder="Veri kaynağı bağlı değil" onSearch={() => {}} />
    </div>
  ),
};

/* --------------------------------------------------------------------------
   KLAVYE SÖZLEŞMESİ — UI-ADR-149.
   Görsel değil DAVRANIŞ testi: klavye yolu sessizce kaybolan türden bir
   özelliktir. Fareyle bakan üç kusurun hiçbirini fark etmez.
   -------------------------------------------------------------------------- */

const HISTORY_KEY = "odin.test.search.keyboard";
const SEEDED = ["kulaklık", "şarj kablosu", "pil paketi"];

/** Geçmiş localStorage'dan okunuyor; test onu ÖNCEDEN kurar. */
function seedHistory() {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(SEEDED));
}

export const KlavyeIleGecmis: StoryObj = {
  name: "Geçmiş listbox'tır ve ok tuşlarıyla gezilir",
  render: function Render() {
    seedHistory();
    return (
      <div className="max-w-md">
        <Search label="Ara" historyKey={HISTORY_KEY} onSearch={() => {}} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole("combobox", { name: "Ara" });

    /* Rolü `searchbox` idi: aria-expanded / aria-activedescendant yazmak
       ekran okuyucuya anlamadığı bir sözleşme vermek olurdu. */
    await expect(box).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(box);
    const list = await canvas.findByRole("listbox", { name: "Son aramalar" });
    await expect(box).toHaveAttribute("aria-expanded", "true");
    await expect(box).toHaveAttribute("aria-controls", list.id);

    const options = within(list).getAllByRole("option");
    await expect(options).toHaveLength(3);

    /* Ok tuşu YOKTU — listeye yalnız Tab'la, öğe öğe girilebiliyordu. */
    await userEvent.keyboard("{ArrowDown}");
    await expect(box).toHaveAttribute("aria-activedescendant", options[0].id);
    await expect(options[0]).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowDown}");
    await expect(box).toHaveAttribute("aria-activedescendant", options[1].id);

    /* Odak KUTUDA kalır; imleç aria-activedescendant ile taşınır.
       Odağı listeye taşımak yazmaya devam etmeyi imkânsız kılardı. */
    await expect(box).toHaveFocus();

    /* Sondan başa sarar. */
    await userEvent.keyboard("{End}");
    await expect(box).toHaveAttribute("aria-activedescendant", options[2].id);
    await userEvent.keyboard("{ArrowDown}");
    await expect(box).toHaveAttribute("aria-activedescendant", options[0].id);

    /* Enter, imleçteki GEÇMİŞ öğesini gönderir — kutudaki metni değil. */
    await userEvent.keyboard("{Enter}");
    await expect(box).toHaveValue(SEEDED[0]);
  },
};

export const EscapeIkiAdimlidir: StoryObj = {
  name: "Escape önce listeyi kapatır, sonra metni siler",
  render: function Render() {
    seedHistory();
    return (
      <div className="max-w-md">
        <Search label="Ara" historyKey={HISTORY_KEY} onSearch={() => {}} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole("combobox", { name: "Ara" });

    await userEvent.click(box);
    await expect(canvas.getByRole("listbox")).toBeInTheDocument();

    /* İlk Escape yalnız listeyi kapatır. Tek adımda ikisini birden yapmak,
       sadece listeyi kapatmak isteyen kullanıcının yazdığını da silerdi. */
    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByRole("listbox")).toBeNull();
    await expect(box).toHaveAttribute("aria-expanded", "false");

    await userEvent.type(box, "kulak");
    await expect(box).toHaveValue("kulak");
    await userEvent.keyboard("{Escape}");
    await expect(box).toHaveValue("");
  },
};
