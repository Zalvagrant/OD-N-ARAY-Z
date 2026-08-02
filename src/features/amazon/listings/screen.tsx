"use client";

/**
 * Amazon · Listings — promote edilmiş ASIN katalog performansı
 * (UI-ADR-203).
 *
 * İKİNCİ ÖLÇÜM DÜZELTMESİ: gece taraması "listing verisi hiçbir uçta
 * yayınlanmıyor" demişti. `KO-amazon-asin-catalog-2026H1-0001` core'da
 * duruyordu — 42 ASIN, oturum/adet/ciro/dönüşüm/buy-box.
 *
 * SIRALAMA CİROYA GÖRE, SKOR DEĞİL: arayüz "listing sağlığı" diye bir
 * bileşik puan üretmez (UI-ADR-111). Kolonlar ham; hangisinin önemli
 * olduğuna sahibi bakarak karar verir.
 *
 * `notes` ÖLÇÜM DEĞİL: kaydı hazırlayan ajanın kendi yorumları. Ayrı
 * bölümde ve "kaydın kendi notları" etiketiyle durur — bir ölçümmüş gibi
 * KPI'a çevrilemez.
 */

import type { ColumnDef } from "@tanstack/react-table";

import {
  demoError,
  screenState,
  sourceUnavailable,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinListings, type ListingRow } from "@/lib/data/odin-catalog";
import { formatDate } from "@/lib/format/date";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { Stat } from "@/components/ui/stat";
import { DataTable } from "@/components/ui/table";
import { Caption, Mono, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "Katalog okunamadı",
  "ASIN listing performansı güncel değil."
);

/** Ölçülmemiş bir hücre 0 basmaz — sebebini basar. */
function cell(value: number | null, render: (v: number) => React.ReactNode) {
  return value === null ? <NoData reason="Kayıtta ölçülmemiş" /> : render(value);
}

/* Sabit referans ŞART (UI-ADR-183). */
const LISTING_COLUMNS: ColumnDef<ListingRow, unknown>[] = [
  {
    id: "asin",
    accessorKey: "asin",
    header: "ASIN",
    cell: (c) => <Mono size="sm">{(c.getValue() as string) ?? "—"}</Mono>,
  },
  {
    id: "title",
    accessorKey: "title",
    header: "Ürün",
    cell: (c) => (
      <Text size="sm" className="block max-w-[40ch] truncate">
        {(c.getValue() as string) ?? "—"}
      </Text>
    ),
  },
  {
    id: "sessions",
    accessorKey: "sessions",
    header: "Oturum",
    cell: (c) =>
      cell(c.getValue() as number | null, (v) => <Num value={v} size="sm" />),
  },
  {
    id: "units",
    accessorKey: "units",
    header: "Adet",
    cell: (c) =>
      cell(c.getValue() as number | null, (v) => <Num value={v} size="sm" />),
  },
  {
    id: "revenue",
    accessorKey: "revenue",
    header: "Ciro",
    cell: (c) =>
      cell(c.getValue() as number | null, (v) => (
        <span className="tabular-nums">
          <Num value={v} fractionDigits={2} size="sm" />
        </span>
      )),
  },
  {
    id: "conversionPct",
    accessorKey: "conversionPct",
    header: "Dönüşüm",
    /* Kayıt bu değeri 0-100 ölçeğinde tutuyor (3.92 = %3,92) ve alan adı
       da öyle diyor. Ölçek DÖNÜŞTÜRÜLMEZ, olduğu gibi basılır. */
    cell: (c) =>
      cell(c.getValue() as number | null, (v) => (
        <span className="tabular-nums">
          %<Num value={v} fractionDigits={2} size="sm" />
        </span>
      )),
  },
  {
    id: "buyboxPct",
    accessorKey: "buyboxPct",
    header: "Buy Box",
    cell: (c) =>
      cell(c.getValue() as number | null, (v) => (
        <span className="tabular-nums">
          %<Num value={v} fractionDigits={1} size="sm" />
        </span>
      )),
  },
];

export function AmazonListings({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const listings = useOdinListings();

  const zorlama = screenState({
    demo,
    primary: listings,
    sources: [listings],
    error: DEMO_ERROR,
  });

  const live = listings.envelope?.data ?? null;
  /** `empty` = "ÖLÇÜLDÜ, katalog boş" — "ölçülmedi" DEĞİL. */
  const l =
    zorlama.isEmpty && live
      ? { ...live, rows: [], notes: [], asinCount: 0 }
      : live;

  const error: SectionError | null =
    zorlama.error ??
    (listings.error
      ? {
          what: listings.error.what,
          why: listings.error.why,
          impact: listings.error.impact,
          fix: listings.error.fix,
        }
      : null) ??
    sourceUnavailable(l, {
      what: "Katalog kaydı yayınlanmadı",
      impact: "ASIN performans tablosu çizilemiyor.",
      fix: "ASIN katalog kaydını promote et, sonra yeniden dene.",
    });

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <WorkspaceHeader
        title="Listings"
        context={
          l?.asOf
            ? `Promote edilmiş katalog · ${formatDate(l.asOf, {
                dateStyle: "medium",
              })}`
            : "Promote edilmiş ASIN katalog kaydı"
        }
        lastSync={listings.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Katalog"
        description="Sayılar kaydın kendi ölçümüdür; arayüz bileşik bir listing skoru üretmez."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={3}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {l && l.available && (
          <Card>
            <CardBody>
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                <Stat
                  label="ASIN"
                  value={
                    l.asinCount === null ? (
                      <NoData reason="Kayıtta ASIN sayısı yok" />
                    ) : (
                      <Num value={l.asinCount} />
                    )
                  }
                  note="katalogdaki ürün sayısı"
                />
                <Stat
                  label="Stok (birim)"
                  value={
                    l.inventoryUnitsTotal === null ? (
                      <NoData reason="Kayıtta stok toplamı yok" />
                    ) : (
                      <Num value={l.inventoryUnitsTotal} />
                    )
                  }
                  note="kaydın beyan ettiği toplam kullanılabilir birim"
                />
                <Stat
                  label="Kayıt"
                  value={
                    l.recordId ? (
                      <Mono size="sm">{l.recordId}</Mono>
                    ) : (
                      <NoData reason="Kayıt kimliği yok" />
                    )
                  }
                  note={l.sourceDetail ?? "promote edilmiş kaynak kaydı"}
                />
              </dl>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="ASIN performansı"
        description="Oturum, adet, ciro, dönüşüm ve Buy Box — kayıttaki hâliyle."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={8}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={l !== null && l.available && l.rows.length === 0}
        emptyTitle="Katalog boş"
        emptyDescription="Kayıt promote edilmiş ama içinde hiç ASIN yok."
      >
        {l && l.available && l.rows.length > 0 && (
          <DataTable
            data={l.rows}
            columns={LISTING_COLUMNS}
            getRowId={(r, i) => r.asin ?? `satir-${i}`}
            label="Promote edilmiş ASIN katalog performansı"
          />
        )}
      </Section>

      <Section
        title="Kaydın kendi notları"
        description="ÖLÇÜM DEĞİL — kaydı hazırlayan ajanın yorumları. Karar dayanağı olarak kullanılmadan önce doğrulanmalı."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={2}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={l !== null && l.available && l.notes.length === 0}
        emptyTitle="Not yok"
        emptyDescription="Kayıt hiçbir yorum taşımıyor."
      >
        {l && l.available && l.notes.length > 0 && (
          <Card>
            <CardBody className="flex flex-col gap-2">
              {l.notes.map((n) => (
                <Caption key={n}>{n}</Caption>
              ))}
            </CardBody>
          </Card>
        )}
      </Section>

      {listings.envelope && (
        <TrustSignal
          meta={listings.envelope.meta}
          refreshFailed={listings.refreshError?.what}
        />
      )}
    </div>
  );
}
