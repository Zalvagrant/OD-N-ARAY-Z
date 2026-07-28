/** S3 · 6 — Search (AYRI primitive, 10-...md §8.5) */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
