/** S3 · 10 — Badge · Tooltip · Avatar · Icon */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Activity, Brain, TriangleAlert } from "lucide-react";
import { Badge, type BadgeVariant } from "./badge";
import { Tooltip } from "./tooltip";
import { Avatar } from "./avatar";
import { Icon } from "./icon";
import { Button } from "./button";
import { Caption } from "./typography";

const VARIANTS: BadgeVariant[] = [
  "primary",
  "secondary",
  "tertiary",
  "ghost",
  "danger",
  "warning",
  "success",
  "info",
];

const meta: Meta = {
  title: "Core/10 · Badge · Tooltip · Avatar · Icon",
  parameters: { layout: "padded" },
};
export default meta;

export const Badges: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {VARIANTS.map((v) => (
          <Badge key={v} variant={v}>
            {v}
          </Badge>
        ))}
      </div>
      <Caption>
        Her varyantın glyph&apos;i var: renk körü kullanıcı da durumu okur.
      </Caption>
    </div>
  ),
};

export const Tooltips: StoryObj = {
  render: () => (
    <div className="flex items-center gap-8 p-12">
      {(["top", "bottom", "left", "right"] as const).map((side) => (
        <Tooltip key={side} side={side} content={`Yardımcı bilgi — ${side}`}>
          <Button variant="secondary" size="sm">
            {side}
          </Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const Avatars: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar name="Yavuz İçingir" size="xs" />
        <Avatar name="Yavuz İçingir" size="sm" />
        <Avatar name="Yavuz İçingir" size="md" />
        <Avatar name="Yavuz İçingir" size="lg" status="online" />
        <Avatar size="xl" />
      </div>
      <Caption>
        Görsel yoksa baş harfler; isim de yoksa nötr ikon. Rastgele avatar
        üretilmez. Durum noktası yalnızca gerçek durum verilince çizilir.
      </Caption>
    </div>
  ),
};

export const Icons: StoryObj = {
  render: () => (
    <div className="flex items-center gap-4">
      <Icon as={Brain} size="xs" tone="ai" />
      <Icon as={Brain} size="sm" tone="ai" />
      <Icon as={Activity} size="md" />
      <Icon as={TriangleAlert} size="lg" tone="warning" label="Uyarı" />
      <Icon as={Brain} size="xl" tone="muted" />
    </div>
  ),
};

/* --------------------------------------------------------------------------
   DAVRANIŞ TESTLERİ — UI-ADR-150.

   Bu üçü UI-ADR-148'ta "tasarım sistemi envanteri" olarak KALMAYA karar
   verilen dokuz bileşenden. gavadolar 2/2 kapıdaki açığı buldu: "hikâyesi
   var" yetmez, yalnız render eden bir story hiçbir şey kanıtlamaz ve
   etiket yine ölü kodu meşrulaştırır. Aşağısı o açığı kapatıyor.
   -------------------------------------------------------------------------- */

export const AvatarSozlesmesi: StoryObj = {
  name: "Avatar — rastgele görsel ÜRETİLMEZ, durum noktası yalnız veriyle",
  render: () => (
    <div className="flex items-center gap-3">
      <span data-testid="named">
        <Avatar name="Yavuz İçingir" />
      </span>
      <span data-testid="anonymous">
        <Avatar />
      </span>
      <span data-testid="with-status">
        <Avatar name="Yavuz İçingir" status="online" />
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const at = (id: string) =>
      canvasElement.querySelector(`[data-testid="${id}"]`)!;

    /* İsimden baş harfler — en fazla İKİ, Türkçe büyütmeyle ("i" → "İ").
       GÖRÜNEN katman `aria-hidden`dır; tam ad ayrıca `sr-only` olarak
       yazılır, yani ekran okuyucu "Yİ" harflerini değil ismi duyar. */
    const visible = at("named").querySelector("[aria-hidden]")!;
    await expect(visible.textContent).toBe("Yİ");
    await expect(at("named").querySelector(".sr-only")!.textContent).toBe(
      "Yavuz İçingir"
    );

    /* Anti-fake: isim yoksa RASTGELE bir avatar ya da uydurma harf değil,
       nötr ikon + dürüst bir ad. */
    await expect(at("anonymous").querySelector("svg")).not.toBeNull();
    await expect(at("anonymous").querySelector(".sr-only")!.textContent).toBe(
      "Bilinmeyen kullanıcı"
    );

    /* Durum noktası YALNIZCA gerçek bir durum verilince çizilir: her
       kullanıcıya yeşil nokta koymak, çevrimiçilik ölçülmediği hâlde
       ölçülmüş gibi göstermek olurdu. */
    await expect(at("named").querySelectorAll(".bg-success")).toHaveLength(0);
    await expect(at("with-status").querySelectorAll(".bg-success")).toHaveLength(1);
  },
};

export const IconSozlesmesi: StoryObj = {
  name: "Icon — label yoksa DEKORATİF (aria-hidden), varsa role=img",
  render: () => (
    <div className="flex items-center gap-3">
      <span data-testid="decorative">
        <Icon as={Activity} />
      </span>
      <span data-testid="meaningful">
        <Icon as={TriangleAlert} label="Kritik uyarı" />
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const glyph = (id: string) =>
      canvasElement.querySelector(`[data-testid="${id}"] svg`)!;

    /* Dekoratif ikon ekran okuyucuda HİÇ okunmaz: anlamı zaten yanındaki
       metin taşıyor, ikinci kez duyurmak gürültüdür. */
    await expect(glyph("decorative")).toHaveAttribute("aria-hidden", "true");
    await expect(glyph("decorative")).not.toHaveAttribute("role");

    /* Anlam taşıyan ikon ADLANDIRILMAK ZORUNDA — renk/şekil tek başına
       anlam taşıyamaz (§15 kalite kapısı). */
    await expect(
      within(canvasElement).getByRole("img", { name: "Kritik uyarı" })
    ).toBeInTheDocument();
  },
};

export const TooltipSozlesmesi: StoryObj = {
  name: "Tooltip — içerik describedby ile BAĞLI, içerik yoksa hiç çizilmez",
  render: () => (
    <div className="flex items-center gap-6 p-12">
      <Button variant="secondary">Açıklamalı</Button>
      <Tooltip content="Son 7 günün ölçülen ortalaması">
        <Button variant="secondary">Bağlı</Button>
      </Tooltip>
      <Tooltip content="">
        <Button variant="secondary">İçeriksiz</Button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* Klavye odağında da okunabilmesi için ad değil AÇIKLAMA bağı kurulur:
       tooltip zorunlu bilgi taşımaz ama taşıdığı yardımcı bilgi klavye
       kullanıcısından da gizlenmemeli. */
    const bound = canvas.getByRole("button", { name: "Bağlı" });
    const id = bound.getAttribute("aria-describedby")!;
    await expect(document.getElementById(id)).toHaveTextContent(
      "Son 7 günün ölçülen ortalaması"
    );

    /* İçerik yoksa boş bir kutu çizilmez ve sahte bir bağ kurulmaz. */
    const empty = canvas.getByRole("button", { name: "İçeriksiz" });
    await expect(empty).not.toHaveAttribute("aria-describedby");

    /* Odak tooltip'i görünür yapar (group-focus-within) — hover'a bağımlı
       bilgi dokunmatik ve klavye kullanıcısı için erişilemez olurdu. */
    await userEvent.tab();
    await userEvent.tab();
    await expect(bound).toHaveFocus();
    await expect(canvas.getAllByRole("tooltip").length).toBeGreaterThan(0);
  },
};
