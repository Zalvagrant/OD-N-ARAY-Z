/** S5 · 1 — Executive Briefing (tam ekran) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ExecutiveBriefing } from "./screen";

const meta: Meta = {
  title: "Screens/1 · Executive Briefing",
  parameters: {
    layout: "fullscreen",
    /* useRouter — App Router mock'u */
    nextjs: { appDirectory: true },
  },
};
export default meta;

/** Dolu hâl — mock veriyle. MOCK DATA rozeti başlıkta görünür. */
export const Brifing: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <ExecutiveBriefing />
    </div>
  ),
};

/** Skeleton gerçek yerleşimi temsil eder; içerik gelince layout kaymaz. */
/* --------------------------------------------------------------------------
   EKRAN SEVİYESİ DURUM MATRİSİ — UI-ADR-151. Gerekçe `mission-control`
   story'sinde yazılı; kilitlenen ayrım aynı:
     "yükleniyor"  ≠  "ölçüldü, sonuç boş"  ≠  "ÖLÇÜLMEDİ"

   Bu ekranda ekstra bir sınır var: FIRSAT yuvası artık CANLI
   (`useOdinOpportunities`, S16). Demo durumları o yuvayı da kapsamalı —
   canlı bir kaynağın hata/boş hâli, mock bir kaynağınkinden farklı
   davranabilir ve bunu kimse kanıtlamıyordu.
   -------------------------------------------------------------------------- */

/* Bekleme payı AÇIKÇA verilir: bu ekranlarda `loading` bayrağı fixture'a
   bağlıdır, yani hata/boş durum ancak fixture çözüldükten SONRA çizilir.
   `findBy*`in varsayılan 1 sn'si tek koşuda yetiyor ama 51 dosyalık tam
   pakette yetmiyordu — testi kararsız kılan buydu, ekranı değil. */
const BEKLE = { timeout: 15_000 } as const;

/** Hero'daki sistem sağlık skoru — ölçüm iddiası taşıyan sayı. */
function heroSkoru(root: HTMLElement): string | null {
  const dt = [...root.querySelectorAll("dt")].find(
    (d) => d.textContent?.trim() === "System Status"
  );
  return dt?.parentElement?.querySelector("dd")?.textContent?.trim() ?? null;
}

export const Yukleniyor: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <ExecutiveBriefing demo="loading" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const iskelet = await canvas.findByText(/Executive Summary yükleniyor/i, {}, BEKLE);
    await expect(iskelet.closest('[role="status"]')).toHaveAttribute(
      "aria-busy",
      "true"
    );

    /* Yüklenirken Hero SAYISI çizilmez. İskelet yerine bir skor yazmak,
       henüz elimizde olmayan bir ölçümü beyan etmek olurdu. */
    await expect(heroSkoru(canvasElement)).toBeNull();
  },
};

/** Veri gelmeyen HER bölüm boş durum gösterir — placeholder değil. */
export const Bos: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <ExecutiveBriefing demo="empty" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* ÖNCE: yüklenmenin bittiğini kanıtla — `findBy*` bekler. */
    await canvas.findByRole("heading", { name: /Kritik kararlar/i }, BEKLE);

    /* "Ölçüldü, sonuç boş" hâli bir GEREKÇE taşır. Sessiz bir boşluk,
       kullanıcıya sistemin bozuk mu yoksa gerçekten sakin mi olduğunu
       söylemez. */
    const bosluklar = await canvas.findAllByText(
      /kaynak henüz bağlı değil|bulunmuyor|yok/i,
      {},
      BEKLE
    );
    await expect(bosluklar.length).toBeGreaterThan(0);

    /* Boş demo bir HATA DEĞİLDİR: uyarı çıkmamalı. İkisini karıştıran bir
       ekran, sakin bir günü arıza gibi gösterir. */
    await expect(canvas.queryAllByRole("alert")).toHaveLength(0);
  },
};

/** Hata deseni: ne oldu → neden → etkisi → çözüm → [Yeniden dene]. */
export const Hata: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <ExecutiveBriefing demo="error" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alerts = await canvas.findAllByRole("alert", {}, BEKLE);
    await expect(alerts.length).toBeGreaterThan(0);

    /* Beş adımlı hata: Ne oldu → Neden → Etkisi → Çözüm → Retry. */
    const metin = alerts[0].textContent ?? "";
    await expect(metin).toMatch(/Brifing verisi yüklenemedi/);
    await expect(metin).toMatch(/127\.0\.0\.1/);
    await expect(metin).toMatch(/ODIN sunucusunu başlat/);

    /* Hata hâlinde Hero SAYISI uydurulmaz. */
    await expect(heroSkoru(canvasElement)).toBeNull();
  },
};
