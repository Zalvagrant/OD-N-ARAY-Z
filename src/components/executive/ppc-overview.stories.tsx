/** S6 · 17 — PPCOverviewCard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ppcOverviewMock } from "@/mocks/amazon";
import { PPCOverviewCard } from "./ppc-overview";

const meta: Meta = {
  title: "Executive/17 · PPCOverview",
  parameters: { layout: "padded" },
};
export default meta;

const base = ppcOverviewMock();

/**
 * ⭐ Profit After Ads BOŞ: COGS Amazon'da yok, kâr hesaplanamaz (UI-ADR-098).
 * Bu bir eksiklik değil, kuralın çalıştığının kanıtıdır.
 */
export const KarHesaplanamiyor: StoryObj = {
  render: () => (
    <div className="max-w-3xl">
      <PPCOverviewCard env={base} />
    </div>
  ),
};

/** COGS girildiği gün kâr hücresi kendiliğinden dolar; başka iş yoktur. */
export const KarHesaplanabiliyor: StoryObj = {
  render: () => (
    <div className="max-w-3xl">
      <PPCOverviewCard
        env={{
          data: { ...base.data, profitAfterAds: { amount: 4_120, currency: "USD" } },
          meta: base.meta,
        }}
      />
    </div>
  ),
};

/** Ölçek bildirilmezse ACOS bilerek boş görünür — UI-ADR-093. */
export const YuzdeOlcegiBildirilmemis: StoryObj = {
  render: () => (
    <div className="max-w-3xl">
      <PPCOverviewCard
        env={{
          data: { ...base.data, percentScale: undefined as never },
          meta: base.meta,
        }}
      />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <PPCOverviewCard env={null} />,
};
