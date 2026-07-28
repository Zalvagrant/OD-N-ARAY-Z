/** S3 · 7 — Filter (AYRI primitive, 10-...md §8.6) */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
