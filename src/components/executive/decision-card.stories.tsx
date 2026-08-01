/** S4 · 2 — DecisionCard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { DecisionCard } from "./decision-card";
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
