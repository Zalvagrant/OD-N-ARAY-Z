/**
 * Automation story'leri — UI-ADR-210.
 *
 * Kilitlenen sınırlar:
 *  1. VADE ARAYÜZDE HESAPLANMAZ — "Vadesi geldi" rozeti çekirdeğin
 *     `due_now` bayrağından gelir; ekran zaman aritmetiği yapmaz.
 *  2. BAŞARI ORANI TÜRETİLMEZ — koşum ve hata ham, yan yana.
 *  3. HİÇ KOŞMAMIŞ İŞ "0 sn önce" DEMEZ — sebebini der.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { expectRefreshWorks } from "@/features/shell/story-helpers";

import { Automation } from "./screen";

const meta: Meta<typeof Automation> = {
  title: "Screens/Automation",
  component: Automation,
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

type Story = StoryObj<typeof Automation>;

export const Otomasyon: Story = {
  name: "Sürücü + zamanlanmış işler — vade çekirdekten",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Automation" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    for (const baslik of ["Sürücü", "Zamanlanmış işler"]) {
      await expect(
        canvas.getByRole("region", { name: baslik })
      ).toBeInTheDocument();
    }

    /* SINIR 1: vade rozeti çekirdeğin bayrağıyla basılır. */
    await expect(canvas.getByText("Vadesi geldi")).toBeInTheDocument();

    /* SINIR 3: hiç koşmamış iş sebebini basar (NoData = aria-label). */
    await expect(
      canvas.getByRole("note", { name: "Bu iş hiç koşmadı" })
    ).toBeInTheDocument();

    /* Watchdog'un gözettiği port ekranda. */
    await expect(canvas.getByText(/port 8765/)).toBeInTheDocument();
    await expect(canvas.getByText("Dinliyor")).toBeInTheDocument();

    /* SINIR 2: türetilmiş yüzde yok. */
    await expect(canvas.queryByText(/\d\s*%|%\s*\d/)).toBeNull();

    await expectRefreshWorks(canvas, "Automation");
  },
};

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır",
  render: () => <Automation demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Automation" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, zamanlanmış iş yok",
  render: () => <Automation demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Automation" }, { timeout: 15_000 });
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );
    await expect(
      await canvas.findByText("Zamanlanmış iş yok")
    ).toBeInTheDocument();
    /* Sürücü bölümü boşalmaz: işi olmayan bir runtime da canlıdır. */
    await expect(canvas.getByText("Canlı")).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — sebep iki bölümde birden yazılır",
  render: () => <Automation demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Automation" }, { timeout: 15_000 });
    await waitFor(
      async () =>
        expect(
          await canvas.findAllByText("Otomasyon tablosu okunamadı")
        ).toHaveLength(2),
      { timeout: 15_000 }
    );
  },
};
