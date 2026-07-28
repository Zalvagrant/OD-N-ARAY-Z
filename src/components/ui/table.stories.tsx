/**
 * S3 · 2 — DataTable (VirtualTable)
 *
 * "10.000 satırda akıcı olmalı" doğrulaması burada yapılır: `TenThousandRows`
 * hikâyesi gerçek 10.000 satır üretir, DOM'da yalnızca görünen satırlar olur.
 * Veri deterministiktir (Math.random YOK) — görsel regresyon testi kırılmasın.
 */
import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, type TableDensity } from "./table";
import { Mono, Num } from "./typography";
import { Badge } from "./badge";
import { SegmentedControl } from "./selection";

interface Sku {
  sku: string;
  title: string;
  units: number;
  revenue: number;
  acos: number;
  status: "healthy" | "risk";
}

function makeRows(n: number): Sku[] {
  return Array.from({ length: n }, (_, i) => ({
    sku: `LLU-${String(i).padStart(5, "0")}`,
    title: `Ürün ${i}`,
    units: (i * 7) % 900,
    revenue: ((i * 137) % 9000) + 100,
    acos: ((i * 13) % 60) / 100,
    status: i % 5 === 0 ? "risk" : "healthy",
  }));
}

const columns: ColumnDef<Sku, unknown>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: (c) => <Mono>{String(c.getValue())}</Mono>,
  },
  { accessorKey: "title", header: "Başlık" },
  { accessorKey: "units", header: "Adet" },
  {
    accessorKey: "revenue",
    header: "Ciro",
    cell: (c) => <Num value={Number(c.getValue())} format="currency" />,
  },
  {
    accessorKey: "acos",
    header: "ACOS",
    meta: { numeric: true },
    cell: (c) => <Num value={Number(c.getValue())} format="percent" fractionDigits={1} />,
  },
  {
    accessorKey: "status",
    header: "Durum",
    meta: { numeric: false },
    cell: (c) =>
      c.getValue() === "risk" ? (
        <Badge variant="warning">Risk</Badge>
      ) : (
        <Badge variant="success">Sağlıklı</Badge>
      ),
  },
];

const meta: Meta = {
  title: "Core/2 · Table",
  parameters: { layout: "padded" },
};
export default meta;

export const Default: StoryObj = {
  render: function Render() {
    const [density, setDensity] = useState<TableDensity>("compact");
    const [selected, setSelected] = useState<Sku | null>(null);
    const data = useMemo(() => makeRows(50), []);

    return (
      <div className="flex flex-col gap-3">
        <SegmentedControl
          label="Yoğunluk"
          value={density}
          onChange={setDensity}
          options={[
            { value: "comfortable", label: "Comfortable" },
            { value: "compact", label: "Compact" },
            { value: "dense", label: "Dense" },
          ]}
        />
        <DataTable
          label="SKU listesi"
          data={data}
          columns={columns}
          density={density}
          onSelect={setSelected}
        />
        <p className="text-sm text-content-secondary">
          Context Panel&apos;e giden seçim:{" "}
          {selected ? <Mono>{selected.sku}</Mono> : "yok"}
        </p>
      </div>
    );
  },
};

/** Performans doğrulaması — 10.000 satır. */
export const TenThousandRows: StoryObj = {
  render: function Render() {
    const data = useMemo(() => makeRows(10_000), []);
    return (
      <DataTable
        label="10.000 satırlık SKU listesi"
        data={data}
        columns={columns}
        density="dense"
      />
    );
  },
};

export const Loading: StoryObj = {
  render: () => (
    <DataTable label="SKU listesi" data={[]} columns={columns} loading />
  ),
};

export const Empty: StoryObj = {
  render: () => (
    <DataTable
      label="SKU listesi"
      data={[]}
      columns={columns}
      emptyTitle="Henüz SKU yok"
      emptyDescription="Amazon hesabı bağlandığında ürünler buraya otomatik gelir."
      emptySuggestion="Bağlantıyı Settings → Veri Kaynakları altından kurabilirsin."
    />
  ),
};

export const Error: StoryObj = {
  render: () => (
    <DataTable
      label="SKU listesi"
      data={[]}
      columns={columns}
      error={{
        what: "SKU listesi yüklenemedi",
        why: "ODIN yerel sunucusu (127.0.0.1) yanıt vermedi.",
        impact: "Ürün tablosu ve ona bağlı KPI'lar şu an güncel değil.",
        fix: "ODIN sunucusunu başlat, sonra yeniden dene.",
      }}
      onRetry={() => {}}
    />
  ),
};
