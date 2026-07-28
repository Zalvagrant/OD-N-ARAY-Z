/** S3 · 9 — Modal / Drawer (glass yalnızca overlay katmanında) */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
