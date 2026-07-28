/** S3 · 8 — Selection family (10-...md §8.7) */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
};
