/**
 * VerdictForm — ODIN ADR-0131'in iki kuralı. Story UI-ADR-144'te yazıldı.
 *
 * Bu form `decision-card.tsx`ten ayrıldığı için artık DOĞRUDAN test
 * edilebiliyor; bölmenin asıl kazancı buydu (satır sayısı değil).
 * Öncesinde kurallar 419 satırlık bir kartın içinde yaşıyordu ve yalnız
 * elle tıklayarak doğrulanabiliyordu.
 *
 * Kilitlenen iki kural da ODIN'in karar KAYDINI korur, görünümü değil:
 *   1. Sınıfı gerektiriyorsa gerekçe ZORUNLUDUR — ADR-0046 geri besleme
 *      döngüsü tam olarak o gerekçeden öğrenir. Gerekçesiz kapanan bir
 *      karar, ODIN'in öğrenemediği bir karardır.
 *   2. "Tarihsiz erteleme sessiz bir HAYIRDIR" — `deferred` gelecek bir
 *      tarih ister. Tarihsiz erteleme, reddi ertelemeye kılık değiştirmiş
 *      hâlde kayda geçirmek olurdu.
 */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import type { OdinRecClass } from "@/types/odin";
import { decision } from "./stories.fixtures";
import { VerdictForm, type VerdictInput } from "./verdict-form";

type Args = { onSubmit: (v: VerdictInput) => void };
type Story = StoryObj<Args>;

const meta: Meta<Args> = {
  title: "Executive/VerdictForm",
  parameters: { layout: "padded" },
};
export default meta;

/** `recClass: "B"` — gerekçe ZORUNLU sınıf (fixture'ın kendi değeri).
    Form artık yalnız sınıfı alıyor (UI-ADR-194); fixture bağı korunuyor. */
const gerekceZorunlu = decision.recommendation.recClass;

/**
 * Gerekçe zorunlu OLMAYAN sınıf — "A".
 *
 * ⚠️ Bu fixture `recClass: undefined` idi ve YANLIŞTI: sınıfın YOKLUĞU
 * "gerekçe isteğe bağlı" demek değildir, "sınıf bilinmiyor" demektir.
 * O hâliyle story, UI-ADR-156'da fail-closed yapılan bir açığı (sınıf
 * düşerse kural sessizce kalkar) doğru davranış diye kilitliyordu.
 * Gerçekten isteğe bağlı olan hâl, ODIN'in B/C dışındaki bir sınıfıdır.
 */
const gerekceIstege: OdinRecClass = "A";

/** Sınıf BİLİNMİYOR — gerekçe yine de İSTENİR (fail-closed, UI-ADR-156). */
const sinifBilinmiyor = undefined;

function Harness({
  recClass,
  pending,
  onSubmit,
}: {
  recClass?: OdinRecClass;
  pending: "approved" | "rejected" | "deferred";
  onSubmit: (v: VerdictInput) => void;
}) {
  const [cancelled, setCancelled] = useState(false);
  return cancelled ? (
    <p data-testid="cancelled">vazgeçildi</p>
  ) : (
    <VerdictForm
      recClass={recClass}
      pending={pending}
      onSubmit={onSubmit}
      onCancel={() => setCancelled(true)}
    />
  );
}

export const GerekcesizKapanmaz: Story = {
  name: "Sınıf gerekçe istiyorsa buton KİLİTLİ kalır",
  args: { onSubmit: fn() },
  render: (args) => (
    <Harness
      recClass={gerekceZorunlu}
      pending="approved"
      onSubmit={args.onSubmit}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const kaydet = canvas.getByRole("button", { name: /Onayı kaydet/ });

    /* Boşken kilitli — ve NEDEN kilitli olduğu YAZILI. Sessizce pasif bir
       buton, kullanıcıya neyi eksik bıraktığını söylemez. */
    await expect(kaydet).toBeDisabled();
    await expect(canvas.getByText(/gerekçesiz kapanamaz/i)).toBeInTheDocument();

    /* Kısa gerekçe de yetmez: eşik ODIN'in kendi sabiti (8 karakter). */
    const alan = canvas.getByRole("textbox");
    await userEvent.type(alan, "kısa");
    await expect(kaydet).toBeDisabled();

    await userEvent.type(alan, " ama yeterince uzun");
    await expect(kaydet).toBeEnabled();

    await userEvent.click(kaydet);
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ verdict: "approved" })
    );
  },
};

export const GerekceIstegeBagliysa: Story = {
  name: "Sınıf istemiyorsa gerekçesiz de kapanır",
  args: { onSubmit: fn() },
  render: (args) => (
    <Harness
      recClass={gerekceIstege}
      pending="approved"
      onSubmit={args.onSubmit}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const kaydet = canvas.getByRole("button", { name: /Onayı kaydet/ });
    await expect(kaydet).toBeEnabled();

    await userEvent.click(kaydet);
    /* Boş gerekçe `undefined` gider — boş dize DEĞİL. ODIN'in kaydında
       "" bir gerekçedir; yokluk değildir. */
    await expect(args.onSubmit).toHaveBeenCalledWith({
      verdict: "approved",
      reason: undefined,
      revisitAt: undefined,
    });
  },
};

export const TarihsizErtelemeSessizHayirdir: Story = {
  name: "Erteleme GELECEK tarih ister — geçmiş tarih kabul edilmez",
  args: { onSubmit: fn() },
  render: (args) => (
    <Harness
      recClass={gerekceIstege}
      pending="deferred"
      onSubmit={args.onSubmit}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const kaydet = canvas.getByRole("button", { name: /Ertelemeyi kaydet/ });

    /* Tarihsizken kilitli. */
    await expect(kaydet).toBeDisabled();
    await expect(canvas.getByText(/Gelecek bir tarih seç/i)).toBeInTheDocument();

    const tarih = canvasElement.querySelector<HTMLInputElement>('input[type="date"]')!;

    /* GEÇMİŞ tarih de kabul edilmez: "dün yeniden bakılsın" demek,
       ertelemeyi hiç yapmamakla aynı şeydir. */
    await userEvent.type(tarih, "2020-01-01");
    await expect(kaydet).toBeDisabled();

    await userEvent.clear(tarih);
    await userEvent.type(tarih, "2099-12-31");
    await expect(kaydet).toBeEnabled();

    await userEvent.click(kaydet);
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ verdict: "deferred", revisitAt: "2099-12-31" })
    );
  },
};

export const VazgecmeKayitBirakmaz: Story = {
  name: "Vazgeç hiçbir şey göndermez",
  args: { onSubmit: fn() },
  render: (args) => (
    <Harness
      recClass={gerekceIstege}
      pending="rejected"
      onSubmit={args.onSubmit}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Vazgeç" }));
    await expect(canvas.getByTestId("cancelled")).toBeInTheDocument();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const SinifBilinmiyorsaGerekceZORUNLU: Story = {
  name: "Sınıf BİLİNMİYORSA gerekçe zorunlu (fail-closed)",
  args: { onSubmit: fn() },
  render: (args) => (
    <Harness recClass={sinifBilinmiyor} pending="approved" onSubmit={args.onSubmit} />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    /* ASIL İDDİA: bir yönetişim kuralı, kendisini tetikleyen verinin
       YOKLUĞUNDA gevşemez. `recClass` taşımada düşerse ADR-0131'in B/C
       kuralı sessizce kalkıyordu ve karar tek tıkla kaydediliyordu. */
    const kaydet = canvas.getByRole("button", { name: /kaydet|onayla/i });
    await expect(kaydet).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox"),
      "Sınıf bilinmiyor ama gerekçe yazıldı — kayıt böyle dürüst olur."
    );
    await expect(kaydet).toBeEnabled();
    await userEvent.click(kaydet);
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
  },
};
