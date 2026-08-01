/** S4 · 3 — DirectorCard (S5.5-b: AgentHealth hizalaması, UI-ADR-111) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { DirectorCard } from "./director-card";
import { director, directorUnhealthy, directorUnknown, envelope } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/3 · DirectorCard",
  parameters: { layout: "padded" },
};
export default meta;

/** Gerçek metrikler: gecikme, başarı/hata oranı, kuyruk, maliyet. */
export const Saglikli: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <DirectorCard env={envelope(director, { source: "internal" })} />
    </div>
  ),
};

/** verdict ODIN'den gelir — UI eşik TÜRETMEZ (UI-ADR-111). */
export const Sagliksiz: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <DirectorCard env={envelope(directorUnhealthy, { source: "internal" })} />
    </div>
  ),
};

/** Hiç gözlem yok → unknown; ölçülmemiş her metrik NoData. */
export const Bilinmiyor: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <DirectorCard env={envelope(directorUnknown, { source: "internal" })} />
    </div>
  ),
  /* Bu bileşenin tek sözleşmesi: ÖLÇÜLMEYEN metrik sayı yazmaz.
     `briefing` artık `RuntimeDirectorCard` kullanıyor, yani bu kart
     envanterde duruyor (UI-ADR-148) — ve envanterde duran bir bileşen
     DAVRANIŞINI kanıtlamak zorundadır, sadece render etmek yetmez. */
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* ÖNCE VARLIK: `queueLength: 0` ÖLÇÜLMÜŞ sıfırdır ve "0" yazar.
       (Yokluk iddiası her zaman bir varlık iddiasından sonra gelir —
       aksi hâlde kart hiç render edilmese de test yeşil kalırdı.) */
    await expect(canvas.getByText("Kuyruk")).toBeInTheDocument();
    await expect(canvas.getByText("0")).toBeInTheDocument();

    /* ASIL İDDİA — YOKLUK. `successRate: null` ölçülmemiştir: sebebini
       yazar, "0" veya "%0" YAZMAZ. İkisini karıştırmak, ölçülmemiş bir
       ajanı "hiç başarılı olmamış" gibi göstermek olurdu.

       Gerekçe METİN OLARAK aranmaz: `NoData` ekrana "—" basar, sebebi
       `aria-label`da taşır (`role="note"` — `generic` span'de `aria-label`
       ARIA'ya göre geçersizdi ve gerekçe hiç duyulmuyordu). Yani bu iddia
       aynı zamanda erişilebilirlik sözleşmesini de tutuyor. */
    await expect(
      canvas.getByRole("note", { name: "Başarı oranı ölçülmedi" })
    ).toBeInTheDocument();
    await expect(canvas.queryByText("%0,0")).toBeNull();
  },
};

export const VeriYok: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <DirectorCard env={null} />
    </div>
  ),
};
