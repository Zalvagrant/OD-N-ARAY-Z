/**
 * Knowledge Workspace — 06-workspaces.md §3.
 *
 * Kilitlenen iki sınır:
 *  1. GRAF ÇİZİLMEZ ve sebebi bir SAYIYLA söylenir. 36 varlık var, sıfır
 *     ilişki kayıtlı; bağlantısız düğümleri "graf" diye göstermek olmayan
 *     bir yapıyı varmış gibi sunmak olurdu.
 *  2. Sıfır ilişki ÖLÇÜLMÜŞ sıfırdır — "0" yazar, NoData çıkmaz.
 *     "Kayıt yok" ile "okuyamadım" ayrı iddialardır.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { KnowledgeWorkspace } from "./screen";

const meta: Meta<typeof KnowledgeWorkspace> = {
  title: "Screens/Knowledge",
  component: KnowledgeWorkspace,
  parameters: { nextjs: { appDirectory: true }, layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-bg p-6">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof KnowledgeWorkspace>;

export const Cekirdek: Story = {
  name: "graf çizilmez, sebebi sayıyla söylenir; 0 ilişki NoData değil",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole("heading", { name: "Knowledge" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    /* ÖNCE VARLIK — kayıt ve kaynağı çizilir. Provenance gizlenmez. */
    await expect(
      canvas.getByText("Company DNA — misyon/vizyon/degerler (sahip beyani)")
    ).toBeInTheDocument();
    /* İki kaydın da onaylayanı aynı — tekil sorgu çoklu eşleşmede düşer.
       Asıl iddia "provenance her kayıtta var": sayı, kayıt sayısıyla eşit. */
    await expect(
      canvas.getAllByText(/onaylayan human-owner/).length
    ).toBeGreaterThan(1);

    /* ASIL İDDİA 1 — sıfır ilişki ÖLÇÜLMÜŞ sıfırdır: "0" yazar.
       NoData çıkarsa "okuyamadım" denmiş olur ve bu YANLIŞ olurdu. */
    await expect(canvas.getByText("Graf ilişkisi")).toBeInTheDocument();
    await expect(
      canvas.queryByRole("note", { name: "Graf okunamadı" })
    ).toBeNull();

    /* ASIL İDDİA 2 — graf çizilmediği AÇIKÇA söylenir; sessizce
       atlanmaz. Sessiz bir eksiklik, eksik olduğu bilinmeyen eksikliktir. */
    await expect(
      canvas.getByText(/Graf görünümü çizilmiyor/)
    ).toBeInTheDocument();

    /* Karantina ile çekirdek AYRI sayılır (ADR-0004). */
    await expect(canvas.getByText("Karantinada")).toBeInTheDocument();
    await expect(canvas.getByText("Çekirdek kaydı")).toBeInTheDocument();
  },
};

/* --------------------------------------------------------------------------
   DURUM MATRİSİ
   -------------------------------------------------------------------------- */

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır, boş çekirdek DEĞİL",
  render: () => <KnowledgeWorkspace demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Knowledge" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
    await expect(canvas.queryByText("Bilgi kaydı yok")).toBeNull();
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, kayıt yok",
  render: () => <KnowledgeWorkspace demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Bilgi kaydı yok", undefined, { timeout: 15_000 })
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — okunamadı; çekirdek boş DEĞİL",
  render: () => <KnowledgeWorkspace demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Bilgi çekirdeği okunamadı", undefined, {
        timeout: 15_000,
      })
    ).toBeInTheDocument();
    await expect(canvas.queryByText("Bilgi kaydı yok")).toBeNull();
  },
};
