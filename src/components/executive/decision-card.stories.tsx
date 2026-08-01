/** S4 · 2 — DecisionCard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { DecisionCard } from "./decision-card";
import { VerdictStatus } from "./verdict-status";
import type { CommandOutcome } from "@/lib/data/command";
import { OdinError } from "@/lib/data/errors";
import { decision, decisionKapanmis, envelope } from "./stories.fixtures";

/**
 * `play`ler UI-ADR-184'te eklendi. NEDEN BURAYA:
 *
 * Aşağıdaki hikâyelerin yorumları sözleşmeyi zaten İDDİA EDİYORDU —
 * *"Bayat veri → ÜÇ eylem de kilitli, sebep yazılı (UI-ADR-092)"* — ve
 * hiçbir şey o iddiayı koşturmuyordu. Bir yorum, kapı değildir.
 *
 * Bu kartın kilidi ODIN'in en ağır güvencelerinden biri: bayat veriyle
 * verilen bir karar, sistemin tamamının güvenilirliğini bitirir. Kilit
 * `disabled={stale}` ile ÜÇ AYRI butona tek tek yazılmış; dördüncü bir
 * eylem eklendiğinde yazılmayı unutmak için hiçbir engel yok. Test kilidi
 * butona değil KARARA bağlar: "veri bayatsa hiçbir verdict eylemi
 * tıklanabilir olmamalı."
 */
const VERDICT_ADLARI = ["Onayla", "Reddet", "Ertele"];

const meta: Meta = {
  title: "Executive/2 · DecisionCard",
  parameters: { layout: "padded" },
};
export default meta;

/** Üç verdict kartın üzerinde: Onayla · Reddet · Ertele (ODIN sözlüğü).
    Sınıf B öneri → gerekçe zorunlu (≥8 karakter); Ertele tarih ister. */
export const KararVerilebilir: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionCard env={envelope(decision, { source: "ai" })} onVerdict={fn()} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    /* TAZE veride üçü de AÇIK olmalı. Bu, bayat testinin karşı kutbu:
       olmadan `disabled` her zaman true yazan bir hata da yeşil kalırdı. */
    for (const ad of VERDICT_ADLARI) {
      await expect(c.getByRole("button", { name: ad })).toBeEnabled();
    }

    /* Onayla → form kurulur. Kart doğrudan verdict GÖNDERMEZ; tek
       tıklamayla kapanan bir karar, gerekçesiz karardır. */
    await userEvent.click(c.getByRole("button", { name: "Onayla" }));
    await expect(
      c.getByPlaceholderText("Bu kararı neden böyle veriyorsun?")
    ).toBeInTheDocument();
  },
};

/** Bayat veri → ÜÇ eylem de kilitli, sebep yazılı (UI-ADR-092). */
export const BayatVeriKilitli: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionCard
        env={envelope(decision, {
          source: "ai",
          freshness: "stale",
          lastUpdated: new Date(Date.now() - 6 * 60 * 60_000).toISOString(),
        })}
        onVerdict={fn()}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    for (const ad of VERDICT_ADLARI) {
      await expect(
        c.getByRole("button", { name: ad }),
        `${ad} bayat veride kilitli DEĞİL`
      ).toBeDisabled();
    }

    /* Kilit yetmez, SEBEBİ de yazılmak zorunda: gerekçesiz kilitli bir
       kart kullanıcıya bozuk görünür ve sayfa yenilenir — asıl sorun
       (senkron bayat) gizli kalır. */
    await expect(c.getByText(/Veri bayat — karar verilemez/)).toBeInTheDocument();

    /* Ve kilit GERÇEKTEN tutuyor: tıklama formu kurmuyor. */
    await userEvent.click(c.getByRole("button", { name: "Onayla" }));
    await expect(
      c.queryByPlaceholderText("Bu kararı neden böyle veriyorsun?")
    ).toBeNull();
  },
};

/** Verdict verilmiş: eylem yok, insan kararı gerekçesiyle görünür. */
export const Kapanmis: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionCard env={envelope(decisionKapanmis, { source: "ai" })} onVerdict={fn()} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    /* Kapanmış kararda buton KİLİTLİ değil, HİÇ YOK. Ayrım önemli:
       kilitli buton "şimdi olmaz" der ve kullanıcı bekler; kapanmış bir
       kararda beklenecek bir şey yoktur. */
    for (const ad of VERDICT_ADLARI) {
      await expect(c.queryByRole("button", { name: ad })).toBeNull();
    }
  },
};

export const VeriYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <DecisionCard env={null} />
    </div>
  ),
};

/* --------------------------------------------------------------------------
   GÖNDERİM DURUMLARI — ER-0025 entegrasyonu (UI-ADR-192).

   Buradan aşağısı kartı GERÇEK BİLEŞİMİYLE gösterir: brifing ekranında
   `DecisionCard` ile `VerdictStatus` yan yana durur ve kullanıcı ikisini
   birlikte okur. Durumları yalnız `VerdictStatus`ta göstermek, kartın
   hâlâ tıklanabilir görünürken altında "reddedildi" yazmasının nasıl
   okunduğunu gizlerdi.

   ⚠️ `DecisionCard`ın API'si DEĞİŞTİRİLMEDİ. Gönderim durumu kartın
   sorumluluğu değil; ekranın. Kart bir prop daha alsaydı, mutation'ı
   bilmeyen her çağıran için ölü bir yüzey açılırdı.
   -------------------------------------------------------------------------- */

function Bilesim({
  pending = false,
  outcome = null,
  error = null,
}: {
  pending?: boolean;
  outcome?: CommandOutcome | null;
  error?: OdinError | null;
}) {
  return (
    <div className="max-w-2xl">
      <DecisionCard env={envelope(decision, { source: "ai" })} onVerdict={fn()} />
      <VerdictStatus pending={pending} outcome={outcome} error={error} onRetry={fn()} />
    </div>
  );
}

/** Gönderim sürüyor — kullanıcı tekrar basmamalı. */
export const GonderimYukleniyor: StoryObj = {
  render: () => <Bilesim pending />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByRole("status")).toHaveTextContent(/yazılıyor/i);
    /* Kart hâlâ görünür: gönderim sırasında kararı OKUYAMAMAK, ne
       gönderdiğini doğrulayamamak demektir. */
    await expect(c.getByRole("button", { name: "Onayla" })).toBeInTheDocument();
  },
};

/** ONAYLANDI — ODIN yazdığını kendi sözleriyle söylüyor. */
export const GonderimBasarili: StoryObj = {
  render: () => (
    <Bilesim
      outcome={{ kind: "success", output: "owner karari kaydedildi: dec-1 -> approved" }}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByRole("status")).toHaveTextContent(/kaydedildi/i);
    await expect(
      c.getByText("owner karari kaydedildi: dec-1 -> approved")
    ).toBeInTheDocument();
  },
};

/** REDDEDİLDİ (verdict) — ODIN kuralı uyguladı; kayıt YOK, düzeltilebilir. */
export const GonderimReddedildi: StoryObj = {
  render: () => (
    <Bilesim
      outcome={{
        kind: "refused",
        exit: 1,
        output: "REDDEDİLDİ: sınıf B öneri gerekçe ister (en az 8 karakter)",
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    /* Metin AYNEN — ER-0025 şartı. */
    await expect(
      c.getByText("REDDEDİLDİ: sınıf B öneri gerekçe ister (en az 8 karakter)")
    ).toBeInTheDocument();
    /* Reddedilen verdict TEKRAR DENENMEZ, düzeltilir. */
    await expect(c.queryByRole("button", { name: "Yeniden dene" })).toBeNull();
  },
};

/**
 * ERTELEME reddi — tarihsiz erteleme (ADR-0131).
 *
 * ⚠️ AŞAĞIDAKİ METİN UYDURULMADI: çalışan ODIN sunucusuna gerçek bir
 * `POST /api/command` atılarak ALINDI (2 Ağu 2026). Baştaki `\n` de
 * gerçektir — `output` stdout+stderr birleşimidir ve `VerdictStatus`
 * onu `.trim()` ile temizler. İlk yazdığım fixture yaklaşıktı; canlı
 * doğrulama farkı gösterdi ve metin gerçeğiyle değiştirildi.
 */
export const ErtelemeReddedildi: StoryObj = {
  render: () => (
    <Bilesim
      outcome={{
        kind: "refused",
        exit: 1,
        output:
          "\nREDDEDİLDİ: 'deferred' bir tarih ister (--revisit YYYY-MM-DD): " +
          "tarihsiz erteleme sessiz bir hayirdir, kimse geri donmez\n",
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    /* Metnin TAMAMI görünmeli — ODIN gerekçesini iki cümleyle anlatıyor
       ve ikincisi ("sessiz bir hayirdir") kuralın NEDENİNİ söylüyor.
       Kısaltmak, kuralı anlamsız bir engele çevirirdi. */
    await expect(c.getByText(/bir tarih ister \(--revisit YYYY-MM-DD\)/)).toBeInTheDocument();
    await expect(c.getByText(/sessiz bir hayirdir/)).toBeInTheDocument();
  },
};

/** BEYAZ LİSTE reddi — komut hiç koşmadı; bu bir ARAYÜZ hatasıdır. */
export const BeyazListeReddi: StoryObj = {
  render: () => (
    <Bilesim
      outcome={{
        kind: "rejected",
        error: "'ceoo' is not an ODIN command. Allowed: ai, ask, ceo, cogs, …",
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    /* Sahibin kararında sorun YOK — ayrımı söylemek zorundayız, yoksa
       kullanıcı gerekçesini düzeltmeye çalışır ve hiçbir şey değişmez. */
    await expect(c.getByRole("status")).toHaveTextContent(/arayüz hatası/i);
    await expect(c.getByText(/is not an ODIN command/)).toBeInTheDocument();
  },
};

/** ZAMAN AŞIMI — kaydın durumu BELİRSİZ. En tehlikeli hâl. */
export const GonderimZamanAsimi: StoryObj = {
  render: () => <Bilesim outcome={{ kind: "timeout", error: "timeout (300s)" }} />,
  play: async ({ canvasElement }) => {
    const s = within(canvasElement).getByRole("status");
    await expect(s).toHaveTextContent(/belirsiz/i);
    await expect(s).toHaveTextContent(/tekrar gönderme/i);
  },
};

/** TAŞIMA hatası — yeniden deneme BURADA sunulur (istek ulaşmamış olabilir). */
export const GonderimTasimaHatasi: StoryObj = {
  render: () => (
    <Bilesim
      error={
        new OdinError({
          kind: "network",
          what: "ODIN'e ulaşılamadı",
          why: "Yerel sunucu (127.0.0.1) yanıt vermedi.",
          impact: "Kararın kaydedilmedi.",
          fix: "ODIN sunucusunu başlat, sonra yeniden dene.",
        })
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByText("ODIN'e ulaşılamadı")).toBeInTheDocument();
    await expect(
      c.getByRole("button", { name: "Yeniden dene" })
    ).toBeInTheDocument();
  },
};
