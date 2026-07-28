/** S4 · 7 — ConfidenceBadge */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConfidenceBadge } from "./confidence-badge";
import { meta as fixtureMeta } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/7 · ConfidenceBadge",
  parameters: { layout: "padded" },
};
export default meta;

export const Esikler: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3">
      <ConfidenceBadge value={96} />
      <ConfidenceBadge value={64} />
      <ConfidenceBadge value={31} />
    </div>
  ),
};

/**
 * EN ÖNEMLİ DAVRANIŞ: skor üretilmemişse rozet HİÇ ÇIKMAZ.
 * Aşağıdaki kutu bilerek boştur — "Confidence —" bile yazılmaz,
 * çünkü kullanıcı orada bir skor bekler.
 */
export const SkorYokRozetYok: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-2">
      <div className="border border-dashed border-line p-3">
        <span className="text-xs text-content-tertiary">value=null: </span>
        <ConfidenceBadge value={null} />
      </div>
      <div className="border border-dashed border-line p-3">
        <span className="text-xs text-content-tertiary">meta.source=&quot;ai&quot; ama confidence yok: </span>
        <ConfidenceBadge meta={fixtureMeta({ confidence: undefined })} />
      </div>
      <div className="border border-dashed border-line p-3">
        <span className="text-xs text-content-tertiary">meta.source=&quot;sp-api&quot; (AI değil): </span>
        <ConfidenceBadge meta={fixtureMeta({ source: "sp-api", confidence: 90 })} />
      </div>
    </div>
  ),
};

export const ZarftanOkuma: StoryObj = {
  render: () => <ConfidenceBadge meta={fixtureMeta({ source: "ai", confidence: 88 })} />,
};
