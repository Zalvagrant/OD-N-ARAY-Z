/**
 * System Director — 06-workspaces.md §8.
 *
 * Bu ekranın tek işi güvenilirliği BİLDİRMEK, ve tam bu yüzden en kolay
 * yalan söyleyebileceği yer burasıdır: spesifikasyonun KPI şeridi sekiz
 * kalem istiyor, ODIN beşini yayınlıyor. Eksik üçünü (`Uptime` · `CPU` ·
 * `Memory`) doldurmak teknik olarak kolaydı — süreç başlangıcından uptime,
 * olay hacminden CPU türetilebilirdi. Uydurulmuş bir güvenilirlik
 * göstergesi ise göstergenin kendisini yok eder.
 *
 * Kilitlenen iki sınır:
 *  1. Ölçülmeyen kalem "0" YAZMAZ, gerekçesini taşır.
 *  2. Skor kapsamıyla BİRLİKTE görünür — "72" tek başına altı eksenin
 *     ortalaması sanılır; ölçülen beştir (ADR-0129'un varlık sebebi).
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { SystemDirector } from "./screen";

const meta: Meta<typeof SystemDirector> = {
  title: "Screens/System Director",
  component: SystemDirector,
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

type Story = StoryObj<typeof SystemDirector>;

export const Saglik: Story = {
  name: "ölçülmeyen kalem 0 yazmaz; skor kapsamıyla birlikte durur",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* ÖNCE VARLIK — veri asenkron; iskelet üstünde koşan bir yokluk
       iddiası hiçbir şey kanıtlamaz. */
    await canvas.findByRole(
      "heading",
      { name: "System Director" },
      { timeout: 15_000 }
    );
    await waitFor(
      () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
      { timeout: 15_000 }
    );

    /* ÖLÇÜLEN kalemler etiketleriyle durur. */
    for (const label of ["System Health", "Storage", "Active Services"]) {
      await expect(canvas.getByText(label)).toBeInTheDocument();
    }

    /* ASIL İDDİA 1 — ölçülmeyen üç kalem gerekçesini taşır.
       `NoData` ekrana "—" basıp sebebi `role="note"` + `aria-label`da
       taşır; metin olarak aramak bu sözleşmeyi ıskalardı. */
    for (const reason of [
      "Uptime ölçülmüyor",
      "CPU ölçülmüyor",
      "Bellek kullanımı ölçülmüyor",
    ]) {
      await expect(
        canvas.getByRole("note", { name: reason })
      ).toBeInTheDocument();
    }

    /* ASIL İDDİA 2 — skor YALNIZ başına durmaz. Kapsam kaybolursa
       "72", ölçülmeyen ekseni de kapsıyormuş gibi okunur. */
    await expect(canvas.getByText(/kapsam \d+\/\d+/)).toBeInTheDocument();
  },
};

/* --------------------------------------------------------------------------
   DURUM MATRİSİ
   -------------------------------------------------------------------------- */

export const Yukleniyor: Story = {
  name: "loading — iskelet basılır, sağlıklı CEVAP değil",
  render: () => <SystemDirector demo="loading" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole(
      "heading",
      { name: "System Director" },
      { timeout: 15_000 }
    );

    await waitFor(
      () => expect(canvas.queryAllByRole("status").length).toBeGreaterThan(0),
      { timeout: 15_000 }
    );
    /* Yüklenirken "sistem sinyali yok" yazmak, henüz sorulmamış bir
       soruya cevap uydurmaktır. */
    await expect(canvas.queryByText("Sistem sinyali yok")).toBeNull();
  },
};

export const Bos: Story = {
  name: "empty — ÖLÇÜLDÜ, sinyal yok: sessiz kalmaz",
  render: () => <SystemDirector demo="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole(
      "heading",
      { name: "System Director" },
      { timeout: 15_000 }
    );
    await expect(
      await canvas.findByText("Sistem sinyali yok", undefined, {
        timeout: 15_000,
      })
    ).toBeInTheDocument();
  },
};

export const Hata: Story = {
  name: "error — okunamadı; boş sistem DEĞİL",
  render: () => <SystemDirector demo="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* İKİ bölüm de aynı hatayı gösterir (sağlık + servis durumu) ve bu
       DOĞRU: canlı beslenen her bölüm kendi hatasını söyler, biri sessiz
       kalıp "veri yok" gibi görünmez. Bu yüzden `findAllBy*`. */
    const hatalar = await canvas.findAllByText(
      "Sistem durumu okunamadı",
      undefined,
      { timeout: 15_000 }
    );
    await expect(hatalar.length).toBeGreaterThan(0);

    /* "Okuyamadım" ile "sistem boş" AYRI iddialardır. */
    await expect(canvas.queryByText("Sistem sinyali yok")).toBeNull();
  },
};
