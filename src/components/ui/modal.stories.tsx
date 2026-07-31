/** S3 · 9 — Modal / Drawer (glass yalnızca overlay katmanında) */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Drawer, Modal } from "./modal";
import { Button } from "./button";
import { Text } from "./typography";

const meta: Meta = {
  title: "Core/9 · Modal & Drawer",
  parameters: { layout: "centered" },
};
export default meta;

export const ModalDialog: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Modal aç
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Kararı onayla"
          description="Bu eylem karar kaydına yazılır ve silinemez (ADR-0005)."
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Vazgeç
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Onayla
              </Button>
            </>
          }
        >
          <Text tone="secondary">
            Esc kapatır · Tab odağı panelin içinde döner · kapanınca odak
            açan butona geri döner.
          </Text>
        </Modal>
      </>
    );
  },
};

export const DrawerPanel: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Drawer aç
        </Button>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title="SKU detayı"
          description="LLU-HA-2024-BLK"
        >
          <Text tone="secondary">
            Drawer sağdan girer. Kalıcı bağlam için Right Context Panel
            kullanılır — Drawer geçici bir görev içindir.
          </Text>
        </Drawer>
      </>
    );
  },
};

/**
 * UI-ADR-141 — AD GÖRÜNÜR BAŞLIKTAN GELİR, TEKRAR EDİLMEZ.
 *
 * Önce `aria-label={title}` vardı ve aşağıdaki `<h2>` aynı metni
 * taşıyordu: ad ile görünen başlık ayrı ayrı yaşıyordu (biri değişse
 * diğeri kalırdı) ve ekran okuyucu başlığı iki kez okuyordu. Açıklama ise
 * hiçbir şeye bağlı DEĞİLDİ — yani yalnız GÖREN kullanıcı için vardı.
 */
export const AdVeAciklamaBaglidir: StoryObj = {
  name: "Ad <h2>'ye, açıklama <p>'ye BAĞLIDIR (tekrar değil)",
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Aç
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Kararı onayla"
          description="Bu işlem karar kaydına yazılır ve geri alınamaz."
        >
          <Text>Gövde.</Text>
        </Modal>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Aç" }));

    /* Portal `document.body`ye basar — canvas değil, body içinde ara. */
    const body = within(document.body);
    const dialog = await body.findByRole("dialog", { name: "Kararı onayla" });

    /* Ad LABELLEDBY ile gelir; aria-label ile çiftlenmez. */
    await expect(dialog).not.toHaveAttribute("aria-label");
    const labelledBy = dialog.getAttribute("aria-labelledby")!;
    await expect(document.getElementById(labelledBy)!.tagName).toBe("H2");

    /* Açıklama artık diyaloga BAĞLI. */
    const describedBy = dialog.getAttribute("aria-describedby")!;
    await expect(document.getElementById(describedBy)!.textContent).toMatch(
      /geri alınamaz/i
    );
  },
};

export const AciklamaYoksaBagYok: StoryObj = {
  name: "Açıklama yoksa aria-describedby de YOK (boş bağ kurulmaz)",
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Aç
        </Button>
        <Modal open={open} onClose={() => setOpen(false)} title="Kısa">
          <Text>Gövde.</Text>
        </Modal>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Aç" }));
    const dialog = await within(document.body).findByRole("dialog", { name: "Kısa" });
    /* Var olmayan bir id'ye işaret eden aria-describedby, hiç olmamasından
       kötüdür: ekran okuyucu boş bir açıklama duyurur. */
    await expect(dialog).not.toHaveAttribute("aria-describedby");
  },
};

/**
 * ODAK TUZAĞI — UI-ADR-146 (yazılımcılar denetimi).
 *
 * `useDialogBehavior` odağı diyaloga alıyor, Tab'ı içeride döndürüyor ve
 * kapanınca AÇANA geri veriyor. Üçü de yazılmıştı ama **hiçbirinin testi
 * yoktu** — ve axe bunların hiçbirini göremez: axe o ANDAKİ DOM'un
 * semantiğine bakar, klavyenin nereye gittiğine değil.
 *
 * Odak tuzağı olmayan bir modal, klavye kullanıcısını arkadaki sayfaya
 * kaçırır: kullanıcı hâlâ diyalogda sanır ama tıkladığı şey altındaki
 * ekrandadır. Görerek fark edilmez.
 */
export const OdakTuzagi: StoryObj = {
  name: "Odak diyaloga girer, içeride döner ve kapanınca AÇANA geri döner",
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Aç
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Kararı onayla"
          footer={<Button variant="primary">Onayla</Button>}
        >
          <Text>Gövde.</Text>
        </Modal>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Aç" });
    await userEvent.click(trigger);

    const body = within(document.body);
    const dialog = await body.findByRole("dialog", { name: "Kararı onayla" });

    /* 1. Açılınca odak İÇERİ girer — arkadaki sayfada kalmaz. */
    await expect(dialog.contains(document.activeElement)).toBe(true);

    /* 2. Tab diyaloğun İÇİNDE döner. Odaklanabilirlerin sonundan sonra
       başa sarmalı; sarmazsa odak arkadaki ekrana kaçar. */
    const focusables = dialog.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    await expect(focusables.length).toBeGreaterThan(1);
    for (let i = 0; i < focusables.length + 1; i++) await userEvent.tab();
    await expect(dialog.contains(document.activeElement)).toBe(true);

    /* 3. Escape kapatır ve odak AÇANA döner — yoksa odak silinen bir
       düğümde kalır ve sonraki Tab belgenin başına atlar. */
    await userEvent.keyboard("{Escape}");
    await expect(body.queryByRole("dialog")).toBeNull();
    await expect(trigger).toHaveFocus();
  },
};
