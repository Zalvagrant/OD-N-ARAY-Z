/** S5 · 2 — Mission Control (tam ekran) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { MissionControl } from "./screen";

const meta: Meta = {
  title: "Screens/2 · Mission Control",
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
};
export default meta;

/** Primary Focus: Mission Board. Sözleşmesi olmayan üç bölüm boş görünür. */
export const Operasyon: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <MissionControl />
    </div>
  ),
};

/* --------------------------------------------------------------------------
   EKRAN SEVİYESİ DURUM MATRİSİ — UI-ADR-151.

   Üç durum story'si vardı ama hiçbiri bir şey İDDİA ETMİYORDU. Yazılımcılar
   meclisinin bulduğu eksik test sınıfı buydu: bileşen testleri parçaları
   kanıtlıyor, `veri durumu → ekran` zincirini kimse kanıtlamıyordu.

   KİLİTLENEN AYRIM — ekranın en sinsi hatası:
     "yükleniyor"  ≠  "ölçüldü, sonuç boş"  ≠  "ÖLÇÜLMEDİ"
   Üçü de birbirine benzeyen bir ekran üretebilir ve üçü de farklı bir
   şey söyler. Ortadaki bir CEVAPTIR; sonuncusu cevapsızlıktır.

   NEDEN İLK DENEMEDE KARARSIZDI (UI-ADR-146'da geri alınmıştı): eşzamanlı
   `getByText` kullanılmıştı ve `useOdinFixture` asenkron çözülüyor —
   `play` çalıştığında zarf henüz `null` olabiliyordu. Çözüm fixture'ı
   değiştirmek değil, DOĞRU ÇAPAYA bakmak: `role="status"` / `role="alert"`
   semantik ve deterministik; veriye bağlı metin ise `findBy*` ile beklenir.
   YOKLUK iddiaları her zaman bir VARLIK iddiasından SONRA gelir — yoksa
   ekran daha çizilmeden "yok" diye geçebilirdi.
   -------------------------------------------------------------------------- */

/* Bekleme payı AÇIKÇA verilir: bu ekranlarda `loading` bayrağı fixture'a
   bağlıdır, yani hata/boş durum ancak fixture çözüldükten SONRA çizilir.
   `findBy*`in varsayılan 1 sn'si tek koşuda yetiyor ama 51 dosyalık tam
   pakette yetmiyordu — testi kararsız kılan buydu, ekranı değil. */
const BEKLE = { timeout: 15_000 } as const;

/** Ölçülmüş bir Director sayısı ekranda var mı? (sayı = ölçüm iddiası) */
function directorSayisi(root: HTMLElement): string | null {
  const dt = [...root.querySelectorAll("dt")].find(
    (d) => d.textContent?.trim() === "Sağlıklı Director"
  );
  return dt?.parentElement?.querySelector("dd")?.textContent?.trim() ?? null;
}

export const Yukleniyor: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <MissionControl demo="loading" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* ÖNCE VARLIK: iskelet gerçekten çizilmiş mi.
       NOT: `role="status"` adını İÇERİKTEN ALMAZ (ARIA name-from-content
       listesinde değil), bu yüzden `getByRole(..., {name})` çalışmaz —
       ilk yazımda öyle denendi ve düştü. `SkeletonRegion` adı `sr-only`
       bir span'de taşıyor; sorgulanacak yer orası. */
    const iskelet = await canvas.findByText(/Operational Status yükleniyor/i, {}, BEKLE);
    await expect(iskelet.closest('[role="status"]')).not.toBeNull();
    await expect(iskelet.closest('[role="status"]')).toHaveAttribute(
      "aria-busy",
      "true"
    );

    /* SONRA YOKLUK: yüklenirken SAYI GÖSTERİLMEZ. İskelet yerine
       "0 sağlıksız Director" yazmak bir ÖLÇÜMDÜR ve o an elimizde ölçüm
       yoktur. */
    await expect(directorSayisi(canvasElement)).toBeNull();
  },
};

export const Bos: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <MissionControl demo="empty" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* ÖNCE: ekranın yüklenmeyi bitirdiğini kanıtla. `findBy*` bekler —
       ilk denemedeki kararsızlığın çözümü tam olarak bu. */
    await canvas.findByText(/İzlenen karar ve vadesi gelen erteleme yok/, {}, BEKLE);

    /* ASIL İDDİA: bu ekranda Director kaynağı BAĞLI DEĞİL ve sayaç
       "0" DEĞİL "—" gösteriyor. "0 sağlıksız Director" bir ölçümdür ve
       yanlıştır; doğrusu "ölçülmedi". Aradaki fark, sistemin sağlıklı mı
       yoksa hiç izlenmiyor mu olduğudur — sıfırlarla dolu bir tablo
       "her şey yolunda" diye okunur. */
    await expect(directorSayisi(canvasElement)).toBe("—");
    await expect(
      canvas.getAllByText(/kaynak bağlı değil — ölçülmedi/).length
    ).toBeGreaterThan(0);

    /* Ama ÖLÇÜLEBİLEN şey hâlâ ölçülüyor: telemetri kanal sayısı
       registry'den gelir, karar listesinin boş olmasıyla ilgisi yoktur.
       Boş bir ekran, ölçülebilen her şeyi de susturmaz. */
    const kanal = [...canvasElement.querySelectorAll("dt")].find(
      (d) => d.textContent?.trim() === "Telemetri kanalı"
    );
    await expect(
      kanal?.parentElement?.querySelector("dd")?.textContent
    ).toMatch(/\d+ \/ \d+/);
  },
};

export const Hata: StoryObj = {
  render: () => (
    <div className="bg-bg p-6">
      <MissionControl demo="error" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* ÖNCE VARLIK: hata BİR UYARIDIR (`role="alert"`), sessiz bir boşluk
       değil — ekran okuyucu kullanıcısı da haberdar olur. */
    const alerts = await canvas.findAllByRole("alert", {}, BEKLE);
    await expect(alerts.length).toBeGreaterThan(0);

    /* Hata BEŞ ADIMLIDIR: Ne oldu → Neden → Etkisi → Çözüm → Retry.
       "Bir şeyler ters gitti" diyen bir ekran kullanıcıya ne yapacağını
       söylemez. */
    const metin = alerts[0].textContent ?? "";
    await expect(metin).toMatch(/Operasyon verisi yüklenemedi/);
    await expect(metin).toMatch(/127\.0\.0\.1/);
    await expect(metin).toMatch(/ODIN sunucusunu başlat/);
    await expect(
      within(alerts[0]).getByRole("button", { name: /yeniden|dene/i })
    ).toBeInTheDocument();

    /* SONRA YOKLUK: hata hâlinde SAYI UYDURULMAZ. */
    await expect(directorSayisi(canvasElement)).toBeNull();
  },
};
