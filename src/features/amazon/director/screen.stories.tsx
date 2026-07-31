/** S6 · 3 — Amazon Director (tam ekran) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { AmazonDirector } from "./screen";

const meta: Meta = {
  title: "Screens/3 · Amazon Director",
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
};
export default meta;

/**
 * Referans modül. Primary Focus: Executive Glance + KPI Strip.
 * Net kâr ve Profit After Ads BİLEREK boştur (UI-ADR-116); Sales & Profit ile
 * Orders bölümlerinin sözleşmesi yoktur (UI-ADR-096).
 */
export const Amazon: StoryObj = {
  /* POZİTİF KONTROL — `izgaraVar` helper'ının gerçekten TRUE
     dönebildiğini kanıtlar. Olmasaydı: SKU tablosu `role="grid"`i
     kaybettiği an helper sonsuza kadar `false` döner ve `Yukleniyor` ile
     `Hata`daki iki `toBe(false)` iddiası KALICI YEŞİL olurdu — hiçbir şeyi
     korumayan iki test. Yokluk iddiasının yanına varlık iddiası. */
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("grid", {}, { timeout: 15_000 });
    await expect(izgaraVar(canvasElement)).toBe(true);
  },
  render: () => (
    <div className="bg-bg p-6">
      <AmazonDirector />
    </div>
  ),
};

/* --------------------------------------------------------------------------
   EKRAN SEVİYESİ DURUM MATRİSİ — UI-ADR-151.
   Gerekçe `mission-control` story'sinde yazılı.

   BU EKRANDA RİSK DAHA YÜKSEK: hata metni açıkça "bütçe kararı
   verilmemeli" diyor. Yani buradaki durum ayrımı bir görsel incelik
   değil, PARA HARCAMA kararının önündeki son uyarıdır. Yükleniyor ya da
   hatalı bir ekranın SAYI göstermesi, sahibi ölçülmemiş bir rakama
   dayanarak bütçe değiştirmeye çağırır.
   -------------------------------------------------------------------------- */

/* Bekleme payı AÇIKÇA verilir: bu ekranlarda `loading` bayrağı fixture'a
   bağlıdır, yani hata/boş durum ancak fixture çözüldükten SONRA çizilir.
   `findBy*`in varsayılan 1 sn'si tek koşuda yetiyor ama 51 dosyalık tam
   pakette yetmiyordu — testi kararsız kılan buydu, ekranı değil. */
const BEKLE = { timeout: 15_000 } as const;

/** Izgara (SKU tablosu) çizilmiş mi — ölçüm iddiası taşıyan yüzey. */
const izgaraVar = (root: HTMLElement) =>
  root.querySelector('[role="grid"]') !== null;

export const Yukleniyor: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <AmazonDirector demo="loading" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const iskelet = await canvas.findByText(/Executive Glance yükleniyor/i, {}, BEKLE);
    await expect(iskelet.closest('[role="status"]')).toHaveAttribute(
      "aria-busy",
      "true"
    );

    /* Yüklenirken tablo çizilmez: yarı dolu bir SKU tablosu, eksik olduğu
       söylenmeyen bir tablodur. */
    await expect(izgaraVar(canvasElement)).toBe(false);
  },
};

export const Bos: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <AmazonDirector demo="empty" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* ÖNCE: yüklenmenin bittiğini kanıtla — AMA DOĞRU ÇAPAYLA.
       İlk hâli `findByRole("heading", {name:/Executive Glance/})` idi ve
       YEŞİL YALAN söylüyordu: o başlık YALNIZ iskelet/hata dallarında
       (`<Section title="Executive Glance">`) var; yükleme bitince yerini
       `DataGuard`ın `NoData`sı alıyor ve `GlanceView`ün kendi başlığı bir
       `<span>` (heading değil). Yani çapa ilk poll'de İSKELETTE çözülüyor,
       ardından gelen yokluk iddiası iskelet üstünde koşuyordu — boş durum
       gerçekten bir `alert` üretse bile test geçerdi.
       Doğru çapa: boş hâlde GERÇEKTEN görünen şey. */
    await canvas.findByLabelText(/Amazon anlık görüntüsü üretilmedi/, {}, BEKLE);

    /* Boş bir gün HATA DEĞİLDİR. İkisini karıştıran ekran, satışsız bir
       günü arıza gibi gösterir ve sahibi olmayan bir sorunu aramaya
       yollar. */
    await expect(canvas.queryAllByRole("alert")).toHaveLength(0);
  },
};

export const Hata: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <AmazonDirector demo="error" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alerts = await canvas.findAllByRole("alert", {}, BEKLE);
    await expect(alerts.length).toBeGreaterThan(0);

    const metin = alerts[0].textContent ?? "";
    await expect(metin).toMatch(/Amazon verisi yüklenemedi/);
    /* ETKİ CÜMLESİ KORUNMALI: hatanın ne anlama geldiğini söyleyen tek
       satır budur ve burada bir PARA kararına bağlanıyor. */
    await expect(metin).toMatch(/bütçe kararı verilmemeli/);
    await expect(metin).toMatch(/ODIN sunucusunu başlat/);

    /* Hata hâlinde tablo ÇİZİLMEZ — bayat satırlar taze sanılabilir. */
    await expect(izgaraVar(canvasElement)).toBe(false);
  },
};
