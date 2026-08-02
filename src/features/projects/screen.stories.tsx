/**
 * Projects story'leri — UI-ADR-208.
 *
 * Kilitlenen sınırlar:
 *  1. FİLTRE GERÇEKTEN DARALTIR — dekoratif değil; tıklanır ve satır
 *     sayısı düşer, sonuç sayacı ölçülmüş değeri yazar.
 *  2. ARAMA GERÇEKTEN ARAR — yazılır ve liste eşleşmeye iner.
 *  3. DURUM YENİDEN YAZILMAZ — sahibin cümlesi satırda tam durur.
 *  4. İLERLEME YÜZDESİ TÜRETİLMEZ.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { expectRefreshWorks } from "@/features/shell/story-helpers";

import { Projects } from "./screen";

const meta: Meta<typeof Projects> = {
  title: "Screens/Projects",
  component: Projects,
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

type Story = StoryObj<typeof Projects>;

export const Defter: Story = {
  name: "Defter + gerçekten filtreleyen filtre",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Projects" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of ["Defter", "Talepler"]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 3: sahibin cümlesi satırda tam duruyor. */
    await expect(
      canvas.getByText("implemented v1 (ADR-0051)")
    ).toBeInTheDocument();

    /* SINIR 4: ilerleme yüzdesi yok. */
    await expect(canvas.queryByText(/\d\s*%|%\s*\d/)).toBeNull();

    /* SINIR 1: filtre GERÇEKTEN daraltır. Dört talep var; "Bitti"
       seçilince yalnız biri kalmalı. */
    await expect(canvas.getAllByText(/^MOCK — /)).toHaveLength(4);
    await userEvent.click(canvas.getByRole("button", { name: /Durum/ }));
    await userEvent.click(await canvas.findByLabelText(/Bitti \(1\)/));
    await waitFor(async () =>
      expect(canvas.getAllByText(/^MOCK — /)).toHaveLength(1)
    );
    /* Sayaç METNİ birden çok düğüme bölünür (`Num` ayrı bir eleman), o
       yüzden düğümün tam metni normalize edilerek aranır. */
    /* `getAllByText`: fonksiyon eşleştirici ATALARI da yakalar (sayaç
       metni bir `Num` düğümü içerdiği için birden çok eleman eşleşir).
       Aranan şey sayacın VARLIĞI, tekilliği değil. */
    await expect(
      canvas.getAllByText((_, el) =>
        /1\s*\/\s*4\s*talep gösteriliyor/.test(
          (el?.textContent ?? "").replace(/\s+/g, " ")
        )
      ).length
    ).toBeGreaterThan(0);

    /* Filtre temizlenince liste geri gelir — düğme çalışıyor. */
    await userEvent.click(
      canvas.getByRole("button", { name: /Filtreleri temizle/ })
    );
    await waitFor(async () =>
      expect(canvas.getAllByText(/^MOCK — /)).toHaveLength(4)
    );

    await expectRefreshWorks(canvas, "Projects");
  },
};

export const AramaDaraltir: Story = {
  name: "Arama gerçekten arar — eşleşmeyince sebebi yazılır",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Projects" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    /* SINIR 2: arama kutusu listeyi daraltır. */
    await userEvent.type(
      canvas.getByRole("combobox", { name: /Talep ara/ }),
      "rezerv"
    );
    await waitFor(
      async () => expect(canvas.getAllByText(/^MOCK — /)).toHaveLength(1),
      { timeout: 5_000 }
    );

    /* Eşleşme yoksa DEFTER BOŞ denmez — ayrı cümle. */
    await userEvent.type(
      canvas.getByRole("combobox", { name: /Talep ara/ }),
      "zzzzz"
    );
    await waitFor(
      async () =>
        expect(
          await canvas.findByText(/Bu filtreyle eşleşen talep yok/)
        ).toBeInTheDocument(),
      { timeout: 5_000 }
    );
    await expect(canvas.queryByText("Defter boş")).toBeNull();
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <Projects demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Projects" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, defter boş",
  render: () => <Projects demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Projects" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(await canvas.findByText("Defter boş")).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep iki bölümde birden yazılır",
  render: () => <Projects demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Projects" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Talep defteri okunamadı")
        ).toHaveLength(2),
      { timeout: 15_000 }
    );
  },
};
