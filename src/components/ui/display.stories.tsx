/** S3 · 10 — Badge · Tooltip · Avatar · Icon */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
