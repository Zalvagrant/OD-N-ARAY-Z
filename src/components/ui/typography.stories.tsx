/** S3 · 1 — Typography System (11-design-tokens.md §16, UI-ADR-081) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Caption, Heading, Label, Mono, Num, Text } from "./typography";

const meta: Meta = {
  title: "Core/1 · Typography",
  parameters: { layout: "padded" },
};
export default meta;

export const Scale: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Heading level={1}>Heading 1 — Executive Briefing</Heading>
      <Heading level={2}>Heading 2 — Kritik Kararlar</Heading>
      <Heading level={3}>Heading 3 — Amazon Director</Heading>
      <Heading level={4}>Heading 4 — SKU Sağlığı</Heading>
      <Text size="md">Text md — bölüm giriş metni.</Text>
      <Text>Text base — veri yoğun arayüzün taban ölçüsü (14px).</Text>
      <Text size="sm" tone="secondary">
        Text sm secondary — yardımcı açıklama.
      </Text>
      <Label>Label — alan etiketi</Label>
      <Caption>Caption — en küçük yardımcı metin</Caption>
    </div>
  ),
};

/** Sütunda hizalanmayan sayı = okunmayan tablo (§16 kritik not). */
export const Numbers: StoryObj = {
  render: () => (
    <table className="w-96 border-collapse">
      <tbody>
        {[1234.5, 98, 1000000, -45.25, 7].map((v) => (
          <tr key={v} className="border-b border-line-subtle">
            <td className="py-2 text-content-secondary">Değer</td>
            <td className="py-2">
              <Num value={v} fractionDigits={2} />
            </td>
            <td className="py-2">
              <Num value={v} format="compact" />
            </td>
            <td className="py-2">
              <Num value={v} format="currency" currency="TRY" />
            </td>
          </tr>
        ))}
        <tr>
          <td className="py-2 text-content-secondary">Hesaplanamadı</td>
          <td className="py-2">
            <Num value={null} noDataReason="Amazon ücretleri henüz gelmedi" />
          </td>
          <td colSpan={2} className="py-2 text-sm text-content-tertiary">
            Anti-fake: 0 gösterilmez.
          </td>
        </tr>
      </tbody>
    </table>
  ),
};

export const MonoUsage: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Mono>LLU-HA-2024-BLK</Mono>
      <Mono size="base">B0CXYZ1234</Mono>
      <Caption>SKU, ASIN, ID ve kod — gövde metni için ASLA.</Caption>
    </div>
  ),
};
