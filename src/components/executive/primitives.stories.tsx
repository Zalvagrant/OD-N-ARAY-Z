/**
 * Executive iç yardımcıları — Meter · Disclosure · ConfidenceBreakdown.
 * Story UI-ADR-142'de yazıldı.
 *
 * NEDEN TEK DOSYA: gavadolar'ın iki üyesi bu noktada AYRIŞTI — terra
 * "yedi ayrı dosya" dedi (her bileşenin sözleşmesi bağımsız), luna
 * "dosya sınırı bileşen sayısına değil DAVRANIŞ ve RİSK sınırına konur"
 * dedi. Sentez: anti-fake KAPISI olan üçü (`DataGuard`, `ThresholdNote`,
 * `MonitoredDecisionsBoard`) ayrı dosyada kaldı; buradaki üçü ise
 * gösterim primitive'idir ve reponun kendi emsali (`display.stories.tsx`
 * dört primitive'i birden kapsar) bu gruplamayı zaten kabul etmiştir.
 * Başarısızlık çıktısı yine ayrışır: her story'nin kendi adı var.
 */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import type { OdinConfidenceBreakdown } from "@/types/odin";
import { Button } from "@/components/ui/button";
import { ConfidenceBreakdown } from "./confidence-breakdown";
import { Disclosure } from "./disclosure";
import { Meter } from "./meter";

const meta: Meta = {
  title: "Executive/Primitives",
  parameters: { layout: "padded" },
};
export default meta;

/* -------------------------------------------------------------------- 1 */

export const MeterOlculmusOrani: StoryObj = {
  name: "Meter — görsel, metin ve ARIA AYNI oranı söyler",
  render: () => <Meter value={73.4} label="Bilgi kapsamı" />,
  play: async ({ canvasElement }) => {
    const m = within(canvasElement).getByRole("meter", { name: "Bilgi kapsamı" });

    /* Üç gösterim tek ölçümden gelmeli. Ayrışırlarsa hangisinin doğru
       olduğu anlaşılmaz ve gören ile duyan kullanıcı FARKLI bir sayı
       öğrenir. */
    await expect(m).toHaveAttribute("aria-valuenow", "73");
    await expect(m).toHaveAttribute("aria-valuemin", "0");
    await expect(m).toHaveAttribute("aria-valuemax", "100");

    /* 10 segment; %73 → 7 dolu. Segmentler `aria-hidden`: ARIA değeri
       zaten oranı söylüyor, 10 kutuyu tek tek okutmak gürültü olurdu. */
    const filled = canvasElement.querySelectorAll("span.bg-ai");
    await expect(filled).toHaveLength(7);
  },
};

export const MeterOlculmemisse: StoryObj = {
  name: "Meter — değer YOKSA çubuk ÇİZİLMEZ, NoData çıkar",
  render: () => <Meter value={null} label="Bilgi kapsamı" noDataReason="Ölçülmedi" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* Boş bir çubuk "%0" diye okunur ve bu bir ÖLÇÜMDÜR — yanlış olanı.
       "Ölçülmedi" ile "sıfır" ayrı şeylerdir. */
    await expect(canvas.queryByRole("meter")).toBeNull();
    await expect(canvas.getByLabelText("Ölçülmedi")).toHaveTextContent("—");
  },
};

export const MeterAralikDisiKirpilir: StoryObj = {
  name: "Meter — aralık dışı değer KIRPILIR, ekstrapole edilmez",
  render: () => (
    <>
      <Meter value={-40} label="Alt sınır" />
      <Meter value={480} label="Üst sınır" />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("meter", { name: "Alt sınır" })).toHaveAttribute(
      "aria-valuenow",
      "0"
    );
    await expect(canvas.getByRole("meter", { name: "Üst sınır" })).toHaveAttribute(
      "aria-valuenow",
      "100"
    );
  },
};

/* -------------------------------------------------------------------- 2 */

function DisclosureHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button aria-expanded={open} aria-controls="d1" onClick={() => setOpen((o) => !o)}>
        Ayrıntı
      </Button>
      <Disclosure open={open} id="d1">
        <p data-testid="body">Kanıt zinciri</p>
      </Disclosure>
    </>
  );
}

export const DisclosureKlavyeIle: StoryObj = {
  name: "Disclosure — klavyeyle açılır ve aria-expanded ile EŞLEŞİR",
  render: () => <DisclosureHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Ayrıntı" });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    /* Kapalıyken içerik DOM'da hiç YOK — gizli değil. Gizli bir bölüm
       arama, Tab sırası ve ekran okuyucu için hâlâ oradadır. */
    await expect(canvas.queryByTestId("body")).toBeNull();

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(await canvas.findByTestId("body")).toBeInTheDocument();

    /* Görsel durum ile erişilebilir durum HER ZAMAN eşleşmeli. */
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

/* -------------------------------------------------------------------- 3 */

const BREAKDOWN: OdinConfidenceBreakdown = {
  knowledge_coverage: 82,
  evidence_strength: 74,
  expert_agreement: 66,
  model_agreement: 58,
  historical_success: 71,
  risk_level: 40,
  missing_information: 25,
  decision_complexity: 60,
};

export const ConfidenceSekizBilesen: StoryObj = {
  name: "ConfidenceBreakdown — sekiz bileşen, ağırlıklar toplamı %100",
  render: () => <ConfidenceBreakdown breakdown={BREAKDOWN} />,
  play: async ({ canvasElement }) => {
    /* "Kara kutu sayı yok": ODIN breakdown'ı ZORUNLU üretir ve arayüz
       sekizini de göstermek zorundadır. Eksik gösterilen bir bileşen,
       güven skorunu yeniden açıklanamaz hâle getirir. */
    const meters = within(canvasElement).getAllByRole("meter");
    await expect(meters).toHaveLength(8);

    /* Ağırlıklar odin/trust.py'den gelir ve toplamı 100 OLMAK ZORUNDA;
       ekranda yazılan yüzdelerin toplamı 100 değilse kullanıcı skorun
       nasıl oluştuğunu doğrulayamaz. */
    const weights = [...canvasElement.querySelectorAll("dt")]
      .map((d) => d.textContent?.match(/%(\d+)/)?.[1])
      .filter(Boolean)
      .map(Number);
    await expect(weights).toHaveLength(8);
    await expect(weights.reduce((a, b) => a + b, 0)).toBe(100);
  },
};

export const ConfidenceNegatifIsaretli: StoryObj = {
  name: "ConfidenceBreakdown — negatif yönlü üçü RENKTEN BAĞIMSIZ işaretli",
  render: () => <ConfidenceBreakdown breakdown={BREAKDOWN} />,
  play: async ({ canvasElement }) => {
    /* Risk · eksik bilgi · karmaşıklık: değeri YÜKSELDİKÇE güven DÜŞER.
       Bunu yalnız renkle söylemek renk körü kullanıcı için hiçbir şey
       söylememektir; hem ▼ şekli hem `sr-only` metni olmak zorunda. */
    const marks = within(canvasElement).getAllByText("(negatif yönlü)");
    await expect(marks).toHaveLength(3);
  },
};
