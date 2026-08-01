/**
 * VerdictStatus — karar gönderiminin ALTI sonucu (ER-0025 · UI-ADR-192).
 *
 * Bu hikâyeler görsel değil SÖZLEŞME testidir. Ölçülen şey "kutu çizildi
 * mi" değil, sahibin bir sonraki hamlesinin doğru olup olmadığı: aynı
 * görünen iki hata durumundan biri "tekrar gönder" der, öteki "SAKIN
 * tekrar gönderme" der.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { OdinError } from "@/lib/data/errors";
import { VerdictStatus } from "./verdict-status";

const meta: Meta<typeof VerdictStatus> = {
  title: "Executive/20 · VerdictStatus",
  component: VerdictStatus,
  parameters: { layout: "padded" },
  args: { pending: false, outcome: null, error: null },
};
export default meta;

type Story = StoryObj<typeof VerdictStatus>;

/* ODIN'in gerçek çıktı metinleri — `odin/__main__.py`ten alındı, uydurma
   değil. Testin değeri metnin AYNEN taşınmasını ölçmesinden geliyor. */
const KAYIT_METNI = "owner karari kaydedildi: rec-1 -> approved";
const RED_METNI = "REDDEDİLDİ: deferred bir gelecek tarih ister (--revisit)";

export const Gonderiliyor: Story = {
  args: { pending: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    /* Bekleme DUYURULUR: sessiz bir gönderim, klavye/ekran-okuyucu
       kullanıcısına butonun çalışıp çalışmadığını hiç söylemez. */
    await expect(c.getByRole("status")).toHaveTextContent(/yazılıyor/i);
  },
};

export const Kaydedildi: Story = {
  args: { outcome: { kind: "success", output: KAYIT_METNI } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByRole("status")).toHaveTextContent(/kaydedildi/i);
    /* ODIN'in kendi çıktısı görünür — "kaydedildi" iddiası kanıtıyla gelir. */
    await expect(c.getByText(KAYIT_METNI)).toBeInTheDocument();
  },
};

/**
 * ODIN kuralı uyguladı ve REDDETTİ. Kayıt YOK; sahibin yapacağı iş var.
 */
export const OdinReddetti: Story = {
  args: { outcome: { kind: "refused", exit: 1, output: RED_METNI } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    /* ER-0025: refusal text VERBATIM. Arayüz metni Türkçeleştirir ya da
       özetlerse, kural (ADR-0131) değiştiğinde arayüz eskisini söylemeye
       devam eder ve iki taraf sessizce ayrışır. */
    await expect(c.getByText(RED_METNI)).toBeInTheDocument();
    await expect(c.getByRole("status")).toHaveTextContent(/reddetti/i);
    /* Reddedilen bir verdict TEKRAR DENENMEZ — düzeltilir. Yeniden dene
       düğmesi yalnız taşıma hatasında çıkar. */
    await expect(c.queryByRole("button", { name: "Yeniden dene" })).toBeNull();
  },
};

/**
 * Komut hiç koşmadı (beyaz liste). Kayıt KESİNLİKLE yok ve bu bir ARAYÜZ
 * hatasıdır — sahibin düzeltebileceği bir şey değil.
 */
export const KomutReddedildi: Story = {
  args: {
    outcome: {
      kind: "rejected",
      error: "'rm' is not an ODIN command. Allowed: ai, ask, ceo, cogs, …",
    },
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByRole("status")).toHaveTextContent(/arayüz hatası/i);
    await expect(c.getByText(/is not an ODIN command/)).toBeInTheDocument();
  },
};

/**
 * ⚠️ EN KRİTİK DURUM. Diğer beşinde "kaydedildi mi?" sorusunun cevabı
 * KESİN; burada değil.
 */
export const ZamanAsimi: Story = {
  args: { outcome: { kind: "timeout", error: "timeout (300s)" } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const s = c.getByRole("status");

    /* Belirsizlik AÇIKÇA söylenmeli. "Hata" demek sahibi tekrar göndermeye
       iter; karar defteri silinmeyen bir defterdir (ODIN ADR-0005) ve
       ikinci kayıt geri alınamaz. */
    await expect(s).toHaveTextContent(/belirsiz/i);
    await expect(s).toHaveTextContent(/tekrar gönderme/i);

    /* Ve otomatik yeniden deneme düğmesi SUNULMAZ — tam da bu yüzden. */
    await expect(c.queryByRole("button", { name: "Yeniden dene" })).toBeNull();
  },
};

/**
 * Taşıma hatası: ağ/sunucu/sözleşme. `OdinError` beş adımlı anlatıyı
 * zaten taşıyor; burada ölçülen onun GÖSTERİLDİĞİ ve yeniden denemenin
 * SUNULDUĞU — ağ hatasında istek sunucuya hiç ulaşmamış olabilir.
 */
export const TasimaHatasi: Story = {
  args: {
    error: new OdinError({
      kind: "network",
      what: "ODIN'e ulaşılamadı",
      why: "Yerel sunucu (127.0.0.1) yanıt vermedi.",
      impact: "Kararın kaydedilmedi.",
      fix: "ODIN sunucusunu başlat, sonra yeniden dene.",
    }),
    onRetry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await expect(c.getByText("ODIN'e ulaşılamadı")).toBeInTheDocument();

    /* Beş adımın hepsi ekranda: kullanıcı hiçbir zaman yalnızca "Error"
       görmez (10-component-library.md §11). */
    await expect(c.getByText(/Yerel sunucu/)).toBeInTheDocument();
    await expect(c.getByText(/Kararın kaydedilmedi/)).toBeInTheDocument();
    await expect(c.getByText(/ODIN sunucusunu başlat/)).toBeInTheDocument();

    await userEvent.click(c.getByRole("button", { name: "Yeniden dene" }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

/** Hiçbir gönderim yapılmamışken ekranda BİR ŞEY OLMAMALI. */
export const Bos: Story = {
  play: async ({ canvasElement }) => {
    /* Boş durumda `role="status"` bile basılmaz: her render'da var olan
       bir canlı bölge, ekran okuyucuya sürekli gürültü üretir. */
    await expect(within(canvasElement).queryByRole("status")).toBeNull();
  },
};
