/** S3 · 5 — Input ailesi + Field Anatomy (10-...md §8.2) */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field, type FieldStatus } from "./field";
import { Input, Select, Textarea } from "./input";
import { Button } from "./button";
import { SegmentedControl } from "./selection";

const meta: Meta = {
  title: "Core/5 · Input & Field",
  parameters: { layout: "padded" },
};
export default meta;

/** Label → Description → Field → Helper → Validation → Action */
export const Anatomy: StoryObj = {
  render: function Render() {
    const [status, setStatus] = useState<FieldStatus>("idle");
    const [value, setValue] = useState("");

    return (
      <div className="flex max-w-md flex-col gap-6">
        <SegmentedControl
          label="Yaşam döngüsü"
          size="xs"
          value={status}
          onChange={setStatus}
          options={[
            { value: "idle", label: "Idle" },
            { value: "validating", label: "Validating" },
            { value: "valid", label: "Valid" },
            { value: "invalid", label: "Invalid" },
            { value: "saved", label: "Saved" },
          ]}
        />

        <Field
          label="SKU"
          required
          description="Amazon'daki satıcı stok kodu."
          helper="Büyük harf ve tire kullanılır."
          status={status}
          message={
            status === "invalid" ? "Bu SKU zaten kayıtlı." : undefined
          }
          action={
            <Button size="xs" variant="tertiary">
              CSV ile toplu içe aktar
            </Button>
          }
        >
          {(p) => (
            <Input
              {...p}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="LLU-HA-2024-BLK"
            />
          )}
        </Field>
      </div>
    );
  },
};

export const Variants: StoryObj = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <Input placeholder="Default" />
      <Input variant="inline" placeholder="Inline — tablo içi düzenleme" />
      <Input readOnly value="Read only" />
      <Input disabled placeholder="Disabled" />
      <Input aria-invalid placeholder="Invalid (aria-invalid)" />
      <Input type="number" defaultValue={1234} />
    </div>
  ),
};

export const Densities: StoryObj = {
  render: () => (
    <div className="flex max-w-md flex-col gap-3">
      <Input density="comfortable" placeholder="Comfortable" />
      <Input density="compact" placeholder="Compact" />
      <Input density="dense" placeholder="Dense — tablo içi" />
    </div>
  ),
};

export const TextareaAndSelect: StoryObj = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <Field label="Not">
        {(p) => <Textarea {...p} placeholder="Karar gerekçesi…" />}
      </Field>
      <Field label="Evren">
        {(p) => (
          <Select {...p} defaultValue="lillu">
            <option value="lillu">Lillu</option>
            <option value="trading">Trading</option>
          </Select>
        )}
      </Field>
    </div>
  ),
};
