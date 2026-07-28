/** S3 · 3 — Button: 8 variant × 5 size × durum matrisi */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Plus } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "./button";

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "tertiary",
  "ghost",
  "danger",
  "success",
  "warning",
  "info",
];
const SIZES: ButtonSize[] = ["xs", "sm", "md", "lg", "xl"];

const meta: Meta<typeof Button> = {
  title: "Core/3 · Button",
  component: Button,
  parameters: { layout: "padded" },
};
export default meta;

export const Variants: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {VARIANTS.map((v) => (
        <Button key={v} variant={v}>
          {v}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: StoryObj = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {SIZES.map((s) => (
        <Button key={s} variant="primary" size={s}>
          {s.toUpperCase()}
        </Button>
      ))}
    </div>
  ),
};

/**
 * Desteklenen durumlar. Hover/Pressed/Focus prop DEĞİLDİR — CSS'ten gelir,
 * bu yüzden burada gösterilemez; fare ve Tab ile denenir (UI-ADR-086).
 */
export const States: StoryObj = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Default</Button>
      <Button variant="primary" disabled>
        Disabled
      </Button>
      <Button variant="primary" loading>
        Loading
      </Button>
      <Button variant="primary" offline>
        Offline
      </Button>
      <Button variant="primary" iconOnly aria-label="Yeni ekle" icon={<Plus className="h-4 w-4" />} />
    </div>
  ),
};

export const WithIcon: StoryObj = {
  args: {
    variant: "secondary",
    icon: <Plus className="h-4 w-4" aria-hidden />,
    children: "SKU ekle",
  },
};
