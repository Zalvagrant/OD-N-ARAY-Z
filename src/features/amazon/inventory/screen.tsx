"use client";

/**
 * Amazon · Inventory — stok/velocity tablosu (UI-ADR-196).
 *
 * KAYNAK: `/api/amazon.skus` — Amazon Director'ın kullandığı kanonik
 * `useAmazonSkus` kancasının AYNISI; ikinci bir boru açılmadı. Bu sayfa
 * envanter odaklı GENİŞ görünümdür: Director'daki dar SKU Health kolonu
 * ekran düzeni gereği 6 sütunla sınırlı, burada ürün adı da var.
 *
 * KOLON SEÇİMİ ÖLÇÜMDÜR (UI-ADR-128 dersi): `reorder_units`,
 * `estimated_stockout_at` ve `sales.revenue` canlı veride 48/48 NULL
 * (ADR-0149 — üretici politikaları yok). Sürekli boş kolon veri yokluğunu
 * bildirmez, tabloyu okunmaz yapar; o üçü ÇİZİLMİYOR. Üretici kazandıkları
 * gün kolon geri gelir.
 *
 * Satır seçimi Director'la aynı sağ paneli açar (kabuk sabit, içerik
 * sağlayıcısı değişken — 03-information-architecture.md §7).
 */

import type { ColumnDef } from "@tanstack/react-table";

import {
  demoError,
  emptied,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useAmazonSkus } from "@/lib/data/odin-amazon";
import { useUiStore } from "@/lib/store/ui";
import type { SkuHealth } from "@/types/screens";
import { Badge } from "@/components/ui/badge";
import { NoData } from "@/components/ui/no-data";
import { DataTable } from "@/components/ui/table";
import { Mono, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";
import { AMAZON_SKU_KIND, SKU_STATUS } from "@/features/amazon/presentation/sku";

const DEMO_ERROR = demoError(
  "Envanter okunamadı",
  "SKU stok ve satış hızı tablosu güncel değil."
);

/* Sabit referans ŞART (UI-ADR-183): her render'da yeni dizi üretmek
   TanStack'in kolon memo'sunu kırar. */
const INVENTORY_COLUMNS: ColumnDef<SkuHealth, unknown>[] = [
  {
    id: "sku",
    accessorKey: "sku",
    header: "SKU",
    cell: (c) => <Mono size="sm">{c.getValue() as string}</Mono>,
  },
  {
    id: "title",
    accessorKey: "title",
    header: "Ürün",
    cell: (c) => (
      <Text size="sm" className="block max-w-[36ch] truncate">
        {c.getValue() as string}
      </Text>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Durum",
    cell: (c) => {
      const s = SKU_STATUS[c.getValue() as SkuHealth["status"]];
      return s ? (
        <Badge variant={s.variant} size="xs">
          {s.label}
        </Badge>
      ) : (
        <NoData reason="Durum bilinmiyor" />
      );
    },
  },
  {
    id: "unitsAvailable",
    accessorKey: "unitsAvailable",
    header: "Stok",
    meta: { numeric: true },
    cell: (c) => (
      <Num
        value={c.getValue() as number | null}
        size="sm"
        noDataReason="Envanter kaydı yok"
      />
    ),
  },
  {
    id: "daysOfSupply",
    accessorKey: "daysOfSupply",
    header: "Kalan gün",
    meta: { numeric: true },
    cell: (c) => (
      <Num
        value={c.getValue() as number | null}
        fractionDigits={1}
        size="sm"
        noDataReason="Satış hızı ölçülmedi"
      />
    ),
  },
  {
    id: "unitsSold",
    accessorFn: (r) => r.sales.unitsSold,
    header: "Satılan (7g)",
    meta: { numeric: true },
    cell: (c) => (
      <Num
        value={c.getValue() as number | null}
        size="sm"
        noDataReason="Bu SKU satış penceresinde yok"
      />
    ),
  },
];

export function AmazonInventory({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const skus = useAmazonSkus();
  const setSelectedEntity = useUiStore((s) => s.setSelectedEntity);

  const zorlama = screenState({
    demo,
    primary: skus,
    sources: [skus],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (skus.error
      ? {
          what: skus.error.what,
          why: skus.error.why,
          impact: skus.error.impact,
          fix: skus.error.fix,
        }
      : null);

  const env = zorlama.isEmpty ? emptied(skus.envelope) : skus.envelope;
  const rows = env?.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <WorkspaceHeader
        title="Inventory"
        context="SKU stok ve satış hızı — kaynak SP-API, hesap ODIN'de"
        lastSync={skus.envelope?.meta.lastUpdated ?? null}
      />

      <Section
        title="Stok tablosu"
        description={
          rows.length > 0
            ? `${rows.length} SKU · satır seç, detay sağ panelde açılır.`
            : "SP-API'den gelen aktif SKU'ların stok ve hız görünümü."
        }
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={8}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        <DataTable
          label="Envanter tablosu"
          data={rows}
          columns={INVENTORY_COLUMNS}
          density="compact"
          maxHeightClass="max-h-[70vh]"
          onSelect={(row) =>
            setSelectedEntity(
              row
                ? { workspaceId: "amazon", kind: AMAZON_SKU_KIND, id: row.sku }
                : null
            )
          }
          getRowId={(r) => r.sku}
          emptyTitle="SKU yok"
          emptyDescription="SP-API'den aktif SKU gelmedi — bu, katalogda ürün olmadığı anlamına gelmez."
        />
      </Section>

      {skus.envelope && (
        <TrustSignal
          meta={skus.envelope.meta}
          refreshFailed={skus.refreshError?.what}
        />
      )}
    </div>
  );
}
