/** S3 · 8 — Selection family (10-...md §8.7) */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Checkbox, RadioGroup, SegmentedControl, Toggle } from "./selection";

const meta: Meta = {
  title: "Core/8 · Selection",
  parameters: { layout: "padded" },
};
export default meta;

export const All: StoryObj = {
  render: function Render() {
    const [checked, setChecked] = useState(true);
    const [radio, setRadio] = useState<"a" | "b">("a");
    const [toggle, setToggle] = useState(false);
    const [segment, setSegment] = useState<"day" | "week" | "month">("week");

    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Checkbox checked={checked} onChange={setChecked} label="Seçili" />
          <Checkbox checked={false} indeterminate onChange={() => {}} label="Kısmi seçim" />
          <Checkbox checked={false} onChange={() => {}} label="Boş" />
          <Checkbox checked disabled onChange={() => {}} label="Disabled" />
          <Checkbox checked readOnly onChange={() => {}} label="Read only" />
        </div>

        <RadioGroup
          legend="Kapsam"
          name="scope"
          value={radio}
          onChange={setRadio}
          options={[
            { value: "a", label: "Tüm SKU'lar" },
            { value: "b", label: "Yalnızca riskli" },
          ]}
        />

        <div className="flex flex-col gap-2">
          <Toggle checked={toggle} onChange={setToggle} label="Otomatik yenile" />
          <Toggle checked disabled onChange={() => {}} label="Adaptive UI (v1.0'da kapalı)" />
        </div>

        <SegmentedControl
          label="Dönem"
          value={segment}
          onChange={setSegment}
          options={[
            { value: "day", label: "Gün" },
            { value: "week", label: "Hafta" },
            { value: "month", label: "Ay" },
          ]}
        />
      </div>
    );
  },
  /* ANAHTARIN ADI AÇIKÇA VERİLMİŞ OLMALI — UI-ADR-167.
     `Toggle`ın denetimi `<button role="switch">`. UI-ADR-166'da
     `aria-label`ı "çiftleme" sanıp kaldırdım; axe'in hesapladığı ad
     BOŞALDI (`button` için yalnız `subtreeText`, saran etiket sayılmaz)
     ve kapı bunu GÖRMEDİ — `aria-toggle-field-name` `<button>`da hiç
     koşmuyor, `button-name` ise saran etiketin metnini görüp geçiyor.

     ⚠️ VE İLK YAZDIĞIM İDDİA DA KORUMUYORDU: `getByRole("switch",
     { name })` `dom-accessibility-api`yi kullanır, o saran etiketi
     OKUR — `aria-label` kaldırılmış hâlde de YEŞİL kaldı (denendi).
     İyimser motorla ölçmek, ölçmemektir. İddia bu yüzden niteliğin
     kendisine bakıyor: adı açıkça veren bir şey OLMALI. */
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const ad of ["Otomatik yenile", "Adaptive UI (v1.0'da kapalı)"]) {
      const anahtar = canvas.getByRole("switch", { name: ad });
      await expect(
        anahtar.hasAttribute("aria-label") ||
          anahtar.hasAttribute("aria-labelledby"),
      ).toBe(true);
    }
    await expect(
      canvas.getByRole("switch", { name: "Adaptive UI (v1.0'da kapalı)" }),
    ).toBeDisabled();
  },
};

/**
 * UI-ADR-160 — SEGMENTED CONTROL KLAVYEYE KAPANMAZ.
 *
 * `tabIndex={active ? 0 : -1}` idi: `value` hiçbir seçenekle
 * eşleşmediğinde TÜM butonlar -1 oluyordu ve kontrole Tab'la
 * ULAŞILAMIYORDU. Görünür olduğu hâlde kullanılamayan bir kontrol,
 * olmayan bir kontroldür.
 *
 * İkinci kusur: `move()` `onChange` çağırıyor ama ODAĞI TAŞIMIYORDU —
 * WAI-ARIA radyo grubu kalıbı odağın seçimle gitmesini ister; gitmezse
 * ekran okuyucu seçim değişimini duyurmaz.
 */
export const EslesmeyenDegerdeBileErisilir: StoryObj = {
  name: "Değer hiçbir seçenekle eşleşmese BİLE Tab'la erişilir",
  render: function Render() {
    /* URL'den gelmiş, seçeneklerde OLMAYAN bir değer. */
    return (
      <SegmentedControl
        label="Pencere"
        value={"7g" as never}
        onChange={() => {}}
        options={[
          { value: "24s", label: "24 saat" },
          { value: "30g", label: "30 gün" },
        ]}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const radios = within(canvasElement).getAllByRole("radio");

    /* En az BİRİ odaklanabilir olmalı — hepsi -1 ise kontrol kaybolur. */
    const odaklanabilir = radios.filter((r) => r.getAttribute("tabindex") === "0");
    await expect(odaklanabilir).toHaveLength(1);

    await userEvent.tab();
    await expect(odaklanabilir[0]).toHaveFocus();
  },
};

export const OdakSecimiTakipEder: StoryObj = {
  name: "Ok tuşu seçimi DEĞİŞTİRİR ve odağı da taşır",
  render: function Render() {
    const [v, setV] = useState("24s");
    return (
      <SegmentedControl
        label="Pencere"
        value={v}
        onChange={setV}
        options={[
          { value: "24s", label: "24 saat" },
          { value: "30g", label: "30 gün" },
        ]}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ilk = canvas.getByRole("radio", { name: "24 saat" });
    ilk.focus();

    await userEvent.keyboard("{ArrowRight}");

    const ikinci = canvas.getByRole("radio", { name: "30 gün" });
    await expect(ikinci).toHaveAttribute("aria-checked", "true");
    /* ASIL İDDİA: odak da gitti. Gitmezse eski buton tabIndex=-1'e düşer
       ve kullanıcı klavyeyle sıkışır. */
    await expect(ikinci).toHaveFocus();
  },
};
