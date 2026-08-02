"use client";

/**
 * Amazon · Forecast — ölçülen menzil, reddedilen tarih (UI-ADR-212).
 *
 * BU EKRAN BİR TAHMİN ÜRETMİYOR VE BU BİR EKSİK DEĞİL, KAYITLI BİR
 * KARAR. ODIN ADR-0149 açıkça şöyle diyor: *"bir stokta tükenme TARİHİ
 * bir tahmin politikasının çıktısıdır, bir BÖLME İŞLEMİNİN değil"* ve
 * tüketici sözleşmesi onu günlük-menzilden türetmeyi YASAKLIYOR.
 *
 * Gece taraması buraya "tahmin üreticisi yok" yazmıştı — doğru ama
 * eksik: üretici YOK ÇÜNKÜ ÜRETİLMESİ REDDEDİLDİ. Bir tarih uydurmak,
 * bu operasyonun kapattığı bütün kusurların en pahalısı olurdu: sahip
 * ona bakarak sipariş verir.
 *
 * ÖLÇÜLEN NE VARSA GÖSTERİLİR: 19/48 SKU için günlük menzil GERÇEKTEN
 * ölçülü (beyan edilmiş 7 günlük pencereden). Kalan 29'da satış yok, yani
 * hız bilinmiyor — bu "sonsuz menzil" DEĞİLDİR ve öyle gösterilmez.
 *
 * REDDEDİLEN ŞEYİN NE GEREKTİRDİĞİ YAZILIR: tedarik süresi ve emniyet
 * stoğu sahip tarafından beyan edilirse tarih hesaplanabilir hale gelir.
 */

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import {
  demoError,
  emptied,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useAmazonSkus } from "@/lib/data/odin-amazon";
import type { SkuHealth } from "@/types/screens";
import { Badge } from "@/components/ui/badge";
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
  "Menzil verisi okunamadı",
  "SKU stok ve satış hızı güncel değil."
);

/* Sabit referans ŞART (UI-ADR-183). */
const RUNWAY_COLUMNS: ColumnDef<SkuHealth, unknown>[] = [
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
      <Text size="sm" className="block max-w-[32ch] truncate">
        {c.getValue() as string}
      </Text>
    ),
  },
  {
    id: "unitsAvailable",
    accessorKey: "unitsAvailable",
    header: "Stok",
    cell: (c) => {
      const v = c.getValue() as number | null;
      return v === null ? (
        <NoData reason="Envanter kaydı yok" />
      ) : (
        <Num value={v} size="sm" />
      );
    },
  },
  {
    id: "unitsSold",
    accessorKey: "sales",
    header: "Pencerede satış",
    cell: (c) => {
      const s = c.row.original.sales;
      return s.unitsSold === null ? (
        <NoData reason="Satış kaydı yok" />
      ) : (
        <Num value={s.unitsSold} size="sm" />
      );
    },
  },
  {
    id: "daysOfSupply",
    accessorKey: "daysOfSupply",
    header: "Menzil (gün)",
    cell: (c) => {
      const v = c.getValue() as number | null;
      /* ÖLÇÜLMEMİŞ MENZİL "SONSUZ" DEĞİLDİR: pencerede satış yoksa hız
         bilinmiyordur, stok sonsuza kadar yeter demek değildir. */
      return v === null ? (
        <NoData reason="Pencerede satış yok — hız ölçülemedi" />
      ) : (
        <span className="tabular-nums">
          <Num value={v} fractionDigits={1} size="sm" />
        </span>
      );
    },
  },
];

export function AmazonForecast({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const skus = useAmazonSkus();

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
  const rows = useMemo(() => env?.data ?? null, [env]);

  const olculen = useMemo(
    () =>
      (rows ?? [])
        .filter((s) => s.daysOfSupply !== null)
        .sort((a, b) => (a.daysOfSupply ?? 0) - (b.daysOfSupply ?? 0)),
    [rows]
  );
  const olculemeyen = useMemo(
    () => (rows ?? []).filter((s) => s.daysOfSupply === null),
    [rows]
  );

  /* Pencere kaydın KENDİ beyanı; ekran bir pencere uydurmaz. */
  const pencere = olculen[0]?.sales.period ?? null;

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <WorkspaceHeader
        title="Forecast"
        context={
          pencere
            ? `Ölçülen menzil · satış penceresi ${pencere.from} → ${pencere.to}`
            : "Ölçülen menzil — tahmin üretilmez"
        }
        lastSync={skus.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Neden burada tarih yok"
        description="Ekranın ilk bilgisi, üretmediği şeydir."
        loading={zorlama.loading}
        loadingLayout="card"
        loadingCount={1}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        <Card>
          <CardBody className="flex flex-col gap-3">
            <Badge variant="warning" size="xs">
              Tahmin üretilmiyor — ADR-0149
            </Badge>
            <Text>
              Bir stokta tükenme TARİHİ, bir tahmin politikasının
              çıktısıdır; bir bölme işleminin değil. ODIN bu tarihi
              yayınlamıyor ve arayüz onu günlük menzilden TÜRETMİYOR — bir
              tarih uydurmak, sahibin ona bakarak sipariş vermesi demektir.
            </Text>
            <div className="flex flex-col gap-1.5">
              <Caption>Tarih hesaplanabilir hale gelmesi için gereken</Caption>
              <Text size="sm" tone="tertiary">
                Sahip TEDARİK SÜRESİNİ (sipariş → depo) ve EMNİYET STOĞUNU
                beyan etmeli. İkisi beyan edildiği gün tükenme tarihi ve
                yeniden sipariş miktarı ölçülebilir olur; o zamana kadar
                bu ekran yalnız ölçüleni gösterir.
              </Text>
            </div>
          </CardBody>
        </Card>
      </Section>

      <Section
        title="Ölçülen menzil"
        description="Kaydın beyan ettiği satış penceresinden ölçülen günlük menzil. En kısa menzil üstte — bu bir sıralamadır, hüküm değil."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={3}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={rows !== null && rows.length === 0}
        emptyTitle="SKU kaydı yok"
        emptyDescription="Promote edilmiş envanter/satış kaydı bulunamadı."
      >
        {rows && rows.length > 0 && (
          <div className="flex flex-col gap-4">
            <Card>
              <CardBody>
                <dl className="grid grid-cols-3 gap-6">
                  <Stat
                    label="SKU"
                    value={<Num value={rows.length} />}
                    note="promote edilmiş kayıttaki tüm ürünler"
                  />
                  <Stat
                    label="Menzili ölçülen"
                    value={<Num value={olculen.length} />}
                    note="pencerede satışı olan"
                  />
                  <Stat
                    label="Menzili bilinmeyen"
                    value={<Num value={olculemeyen.length} />}
                    note="pencerede satış yok — sonsuz DEĞİL, bilinmiyor"
                  />
                </dl>
              </CardBody>
            </Card>
            {olculen.length > 0 && (
              <DataTable
                data={olculen}
                columns={RUNWAY_COLUMNS}
                getRowId={(r) => r.sku}
                label="Ölçülen günlük menzil, en kısası üstte"
              />
            )}
          </div>
        )}
      </Section>

      <Section
        title="Menzili bilinmeyen SKU'lar"
        description="Pencerede satışı olmayan ürünler. Stokları var ama hızları ölçülmedi; 'sonsuz menzil' yazmak ölçülmemişi ölçülmüş göstermek olurdu."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={4}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={rows !== null && olculemeyen.length === 0}
        emptyTitle="Hepsinin menzili ölçüldü"
        emptyDescription="Pencerede satışı olmayan SKU yok."
      >
        {olculemeyen.length > 0 && (
          <Card>
            <CardBody className="flex flex-wrap gap-2">
              {olculemeyen.map((s) => (
                <Badge key={s.sku} variant="secondary" size="xs">
                  {s.sku} · stok {s.unitsAvailable ?? "?"}
                </Badge>
              ))}
            </CardBody>
          </Card>
        )}
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
