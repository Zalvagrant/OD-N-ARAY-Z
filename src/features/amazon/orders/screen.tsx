"use client";

/**
 * Amazon · Orders — promote edilmiş SP-API sipariş anlık görüntüsü
 * (UI-ADR-202).
 *
 * BU EKRAN BİR ÖLÇÜM DÜZELTMESİDİR: gece taraması "sipariş listesi
 * anahtarı YOK; SP-API orders KO'su promote edilmemiş" demişti. Core'da
 * YEDİ anlık görüntü vardı (en yenisi 49 sipariş) — iddia kaynaktan
 * çürüdü, uç açıldı, ekran bağlandı.
 *
 * HESAP YOK: toplam ve dağılımlar çekirdekten gelir. Ortalama sepet,
 * dönüşüm, günlük trend TÜRETİLMEZ (UI-ADR-111).
 *
 * TUTARSIZ SİPARİŞ 0 DEĞİLDİR: Pending/Canceled siparişlerde OrderTotal
 * yok; tabloda "—" görünür ve toplamın kaç siparişi kapsadığı yazılıdır.
 *
 * YAŞ GİZLENMEZ: kayıt tarihi ve kaydın KENDİ beyan ettiği pencere
 * başlıkta durur — anlık görüntü bayatsa bu ekranda görünür.
 */

import type { ColumnDef } from "@tanstack/react-table";

import {
  demoError,
  screenState,
  sourceUnavailable,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinOrders, type OrderRow } from "@/lib/data/odin-orders";
import { formatDate } from "@/lib/format/date";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { Stat } from "@/components/ui/stat";
import { DataTable } from "@/components/ui/table";
import { Caption, Mono, Num } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "Sipariş anlık görüntüsü okunamadı",
  "Promote edilmiş SP-API sipariş kaydı güncel değil."
);

/**
 * SP-API'nin KENDİ durum sözlüğü. Sözlük dışı bir durum GİZLENMEZ, ham
 * basılır — Amazon sözlüğü genişletirse sahibi bunu görmelidir.
 */
const STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  Shipped: { label: "Gönderildi", variant: "success" },
  Pending: { label: "Bekliyor", variant: "warning" },
  Canceled: { label: "İptal", variant: "danger" },
  Unshipped: { label: "Gönderilmedi", variant: "warning" },
};

function money(total: OrderRow["total"]) {
  return total === null ? (
    <NoData reason="Bu siparişte tutar yok (Pending/Canceled)" />
  ) : (
    <span className="tabular-nums">
      <Num value={total.amount} fractionDigits={2} /> {total.currency}
    </span>
  );
}

/* Sabit referans ŞART (UI-ADR-183): her render'da yeni dizi TanStack'in
   kolon memo'sunu kırar. */
const ORDER_COLUMNS: ColumnDef<OrderRow, unknown>[] = [
  {
    id: "purchasedAt",
    accessorKey: "purchasedAt",
    header: "Satın alma",
    cell: (c) => (
      <Caption>
        {formatDate(c.getValue() as string | null, {
          dateStyle: "short",
          timeStyle: "short",
        })}
      </Caption>
    ),
  },
  {
    id: "id",
    accessorKey: "id",
    header: "Sipariş",
    cell: (c) => <Mono size="sm">{c.getValue() as string}</Mono>,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Durum",
    cell: (c) => {
      const raw = c.getValue() as string | null;
      if (!raw) return <NoData reason="Durum yayınlanmadı" />;
      const s = STATUS[raw];
      return (
        <Badge variant={s?.variant ?? "secondary"} size="xs">
          {s?.label ?? raw}
        </Badge>
      );
    },
  },
  {
    id: "total",
    accessorKey: "total",
    header: "Tutar",
    cell: (c) => money(c.getValue() as OrderRow["total"]),
  },
  {
    id: "items",
    accessorKey: "itemsShipped",
    header: "Kalem",
    cell: (c) => {
      const row = c.row.original;
      return (
        <Caption>
          {row.itemsShipped ?? 0} gönderildi
          {row.itemsUnshipped ? ` · ${row.itemsUnshipped} bekliyor` : ""}
        </Caption>
      );
    },
  },
  {
    id: "fulfillment",
    accessorKey: "fulfillment",
    header: "Karşılama",
    cell: (c) => (
      <Caption>
        {(c.getValue() as string | null) ?? "—"}
        {c.row.original.isPrime ? " · Prime" : ""}
        {c.row.original.isBusiness ? " · Business" : ""}
      </Caption>
    ),
  },
];

function Buckets({ items }: { items: { name: string; count: number }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((b) => (
        <Badge key={b.name} variant="secondary" size="xs">
          {b.name} · {b.count}
        </Badge>
      ))}
    </div>
  );
}

export function AmazonOrders({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const orders = useOdinOrders();

  const zorlama = screenState({
    demo,
    primary: orders,
    sources: [orders],
    error: DEMO_ERROR,
  });

  const live = orders.envelope?.data ?? null;
  /** `empty` = "ÖLÇÜLDÜ, pencerede sipariş yok" — "ölçülmedi" DEĞİL. */
  const o =
    zorlama.isEmpty && live
      ? {
          ...live,
          count: 0,
          orders: [],
          byStatus: [],
          byChannel: [],
          byFulfillment: [],
          totals: { amount: 0, ordersWithTotal: 0, ordersWithoutTotal: 0 },
        }
      : live;

  const error: SectionError | null =
    zorlama.error ??
    (orders.error
      ? {
          what: orders.error.what,
          why: orders.error.why,
          impact: orders.error.impact,
          fix: orders.error.fix,
        }
      : null) ??
    /* Gerekçe ÇEKİRDEĞİN — arayüz rota başına metin taşımaz (UI-ADR-203). */
    sourceUnavailable(o, {
      what: "Sipariş kaydı yayınlanmadı",
      impact: "Sipariş listesi ve toplamlar çizilemiyor.",
      fix: "SP-API orders kaydını promote et, sonra yeniden dene.",
    });

  const donem =
    o?.period.basis === "rolling_window" && o.period.windowDays
      ? `${o.period.windowDays} günlük kayan pencere${
          o.period.end ? `, ${o.period.end} bitişli` : ""
        }`
      : null;

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <WorkspaceHeader
        title="Orders"
        context={
          o?.asOf
            ? `SP-API anlık görüntüsü · ${formatDate(o.asOf, {
                dateStyle: "medium",
                timeStyle: "short",
              })}${donem ? ` · ${donem}` : ""}`
            : "Promote edilmiş SP-API sipariş kaydı"
        }
        lastSync={orders.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Anlık görüntü"
        description="Sayılar kaydın kendi penceresine aittir; arayüz oran ya da ortalama türetmez."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={3}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {o && o.available && (
          <Card>
            <CardBody className="flex flex-col gap-6">
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                <Stat
                  label="Sipariş"
                  value={<Num value={o.count} />}
                  note={donem ?? "kaydın beyan ettiği pencere"}
                />
                <Stat
                  label="Toplam tutar"
                  value={
                    o.totals === null ? (
                      <NoData reason="Kayıt yok" />
                    ) : (
                      <>
                        <Num value={o.totals.amount} fractionDigits={2} />{" "}
                        {o.currency ?? ""}
                      </>
                    )
                  }
                  note={
                    o.totals
                      ? `${o.totals.ordersWithTotal} siparişin toplamı · ${o.totals.ordersWithoutTotal} siparişte tutar yok`
                      : "—"
                  }
                />
                <Stat
                  label="Kayıt"
                  value={
                    o.recordId ? (
                      <Mono size="sm">{o.recordId}</Mono>
                    ) : (
                      <NoData reason="Kayıt kimliği yok" />
                    )
                  }
                  note="promote edilmiş kaynak kaydı"
                />
              </dl>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Caption>Durum</Caption>
                  <Buckets items={o.byStatus} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Caption>Kanal · karşılama</Caption>
                  <Buckets items={[...o.byChannel, ...o.byFulfillment]} />
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Siparişler"
        description="En yeni satın alma üstte. Tutarsız sipariş 0 olarak gösterilmez."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={8}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={o !== null && o.available && o.orders.length === 0}
        emptyTitle="Pencerede sipariş yok"
        emptyDescription="Kayıt promote edilmiş ama beyan ettiği pencerede hiç sipariş yok."
      >
        {o && o.available && o.orders.length > 0 && (
          <DataTable
            data={o.orders}
            columns={ORDER_COLUMNS}
            getRowId={(r) => r.id}
            label="Promote edilmiş SP-API sipariş anlık görüntüsü"
          />
        )}
      </Section>

      {orders.envelope && (
        <TrustSignal
          meta={orders.envelope.meta}
          refreshFailed={orders.refreshError?.what}
        />
      )}
    </div>
  );
}
