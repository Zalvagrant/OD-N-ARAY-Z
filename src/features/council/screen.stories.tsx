/**
 * Executive Council — 06-workspaces.md §5.
 *
 * Kilitlenen sınır: panelde KARŞI OY var, GEREKÇE yok. Karşı oyu "azınlık
 * görüşü" diye sunmak, kimsenin yazmadığı bir itirazı yazılmış göstermek
 * olurdu — `council-view` story'sinin ("Azınlık görüşü kaydedilmemiş" ≠
 * "uzlaşma tam") aynı ayrımı.
 *
 * İkinci sınır: uzlaşma yüzdesi ODIN'de hesaplanır. Ekran onu oy sayısından
 * yeniden türetseydi, aynı panelde iki farklı "uzlaşma" görünürdü.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { ExecutiveCouncil } from "./screen";

const meta: Meta<typeof ExecutiveCouncil> = {
  title: "Screens/Executive Council",
  component: ExecutiveCouncil,
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

type Story = StoryObj<typeof ExecutiveCouncil>;

export const Paneller: Story = {
  name: "her oy modeliyle görünür; gerekçe UYDURULMAZ",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole(
      "heading",
      { name: "Executive Council" },
      { timeout: 15_000 }
    );
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    /* ÖNCE VARLIK — panel ve oyları çizilir. Karşı oy veren model de
       gizlenmez: kimin ne dediği panelin bilgisidir. */
    await expect(canvas.getByText("[CFO] OTICON-MARJ")).toBeInTheDocument();
    await expect(canvas.getByText("openrouter-auto: A")).toBeInTheDocument();
    await expect(canvas.getByText("gpt-oss-20b: B")).toBeInTheDocument();

    /* ASIL İDDİA — GEREKÇE YOKLUĞU açıkça yazılır. Karşı oy "azınlık
       görüşü" diye sunulmaz; ekran ne taşımadığını söyler. */
    await expect(
      canvas.getByText(/Gerekçe ve kanıt kaydedilmiyor/)
    ).toBeInTheDocument();
    await expect(canvas.queryByText(/Azınlık görüşü:/)).toBeNull();
  },
};

/* --------------------------------------------------------------------------
   DURUM MATRİSİ
   -------------------------------------------------------------------------- */

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır, boş panel listesi DEĞİL",
  render: () => <ExecutiveCouncil demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole(
      "heading",
      { name: "Executive Council" },
      { timeout: 15_000 }
    );
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
    await expect(canvas.queryByText("Panel kaydı yok")).toBeNull();
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, panel koşmamış",
  render: () => <ExecutiveCouncil demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Panel kaydı yok", undefined, { timeout: 15_000 })
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — okunamadı; panel yok DEĞİL",
  render: () => <ExecutiveCouncil demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Konsey kaydı okunamadı", undefined, {
        timeout: 15_000,
      })
    ).toBeInTheDocument();

    /* "Okuyamadım" ile "panel koşmadı" AYRI iddialardır. */
    await expect(canvas.queryByText("Panel kaydı yok")).toBeNull();
  },
};
