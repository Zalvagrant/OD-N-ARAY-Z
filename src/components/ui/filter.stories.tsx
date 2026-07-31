/** S3 · 7 — Filter (AYRI primitive, 10-...md §8.6) */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { FilterBar, type FilterQuery } from "./filter";
import { Mono } from "./typography";

const FILTERS = [
  {
    id: "status",
    label: "Durum",
    options: [
      { value: "healthy", label: "Sağlıklı" },
      { value: "risk", label: "Riskli" },
      { value: "paused", label: "Duraklatılmış" },
    ],
  },
  {
    id: "marketplace",
    label: "Pazar",
    options: [
      { value: "tr", label: "Türkiye" },
      { value: "de", label: "Almanya" },
    ],
  },
  /* Seçeneği olmayan filtre RENDER EDİLMEZ — uydurma seçenek yok. */
  { id: "brand", label: "Marka", options: [] },
];

const meta: Meta = {
  title: "Core/7 · Filter",
  parameters: { layout: "padded" },
};
export default meta;

export const Default: StoryObj = {
  render: function Render() {
    const [query, setQuery] = useState<FilterQuery>({});
    return (
      <div className="flex flex-col gap-4">
        <FilterBar filters={FILTERS} query={query} onChange={setQuery} />
        <div>
          <Mono>{JSON.stringify(query)}</Mono>
        </div>
      </div>
    );
  },
};

/**
 * UI-ADR-149 — ESCAPE KÖKTE YAKALANIR.
 *
 * `onKeyDown` yalnız tetikleyici `<Button>`daydı: odak listedeki
 * Checkbox'lara geçtiği anda Escape ölü tuşa dönüyor ve klavye kullanıcısı
 * açtığı paneli KAPATAMIYORDU. Fareyle bakan fark etmez — dışarı tıklama
 * zaten çalışıyor.
 */
export const EscapeListedeyken: StoryObj = {
  name: "Escape odak LİSTEDEYKEN de kapatır ve odağı geri verir",
  render: function Render() {
    const [query, setQuery] = useState<FilterQuery>({});
    return <FilterBar filters={FILTERS} query={query} onChange={setQuery} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Durum/ });

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    /* Odağı listeye taşı — kusurun yaşandığı yer TAM OLARAK burasıydı. */
    const firstOption = canvas.getByRole("checkbox", { name: /Sağlıklı/ });
    firstOption.focus();
    await expect(firstOption).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    /* Odak tetikleyiciye GERİ VERİLİR: aksi halde odak silinen bir düğümde
       kalır ve sonraki Tab belgenin başına atlar. */
    await expect(trigger).toHaveFocus();
  },
};
