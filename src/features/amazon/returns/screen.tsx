"use client";

/**
 * Amazon · Returns — ASIN bazlı iade ve memnuniyet (UI-ADR-203).
 *
 * ÜÇÜNCÜ ÖLÇÜM DÜZELTMESİ: gece taraması "iade verisi yayınlanmıyor"
 * demişti. `KO-amazon-customer-satisfaction-2026H1-0001` core'da
 * duruyordu — 43 satır: yıldız, yorum sayısı, iade oranı, sipariş
 * adedi/cirosu.
 *
 * ÖLÇEK TAHMİN EDİLMEZ: kaydın sütun adı "(%)" ama değeri 0-1 (0,0922 =
 * %9,22). Çekirdek ölçeği BEYAN eder; arayüz `toPercentUnit` ile o beyanı
 * kullanır. Beyan yoksa sayı BASILMAZ (UI-ADR-093) — %922 yazmaktansa
 * hiç yazmamak.
 *
 * "Total" SATIRI ÜRÜN DEĞİLDİR: kaydın kendi özet satırı, ayrı kartta
 * durur. Listeye karışsaydı her şey iki kez sayılırdı.
 *
 * EN KÖTÜ İADE ÜSTTE — bu bir SIRALAMA, hüküm değil. Arayüz "kötü ürün"
 * diye etiketlemez, yalnız kaydın sayısını sıralar.
 */

import type { ColumnDef } from "@tanstack/react-table";

import {
  demoError,
  screenState,
  sourceUnavailable,
  type DemoState,
} from "@/features/shell/screen-state";
import {
  useOdinReturns,
  type ReturnRow,
  type Returns,
} from "@/lib/data/odin-catalog";
import { formatDate } from "@/lib/format/date";
import { PERCENT_SCALE_MISSING, toPercentUnit } from "@/lib/format/percent";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { Stat } from "@/components/ui/stat";
import { DataTable } from "@/components/ui/table";
import { Mono, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "İade kaydı okunamadı",
  "ASIN bazlı iade ve memnuniyet güncel değil."
);

/**
 * İade oranı — ÖLÇEK BEYANIYLA. Beyan yoksa sayı basılmaz; bu ekranın
 * en tehlikeli hatası %9,22 yerine %922 yazmaktır.
 */
function RefundRate({
  value,
  scale,
}: {
  value: number | null;
  scale: Returns["refundRateScale"];
}) {
  const unit = toPercentUnit(value, scale);
  if (unit === null) {
    return (
      <NoData
        reason={
          value === null ? "Kayıtta iade oranı yok" : PERCENT_SCALE_MISSING
        }
      />
    );
  }
  return (
    <span className="tabular-nums">
      %<Num value={unit * 100} fractionDigits={2} size="sm" />
    </span>
  );
}

function columns(scale: Returns["refundRateScale"]): ColumnDef<
  ReturnRow,
  unknown
>[] {
  return [
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
      id: "productGroup",
      accessorKey: "productGroup",
      header: "Grup",
      cell: (c) => <Mono size="sm">{(c.getValue() as string) ?? "—"}</Mono>,
    },
    {
      id: "refundRate",
      accessorKey: "refundRate",
      header: "İade oranı",
      cell: (c) => (
        <RefundRate value={c.getValue() as number | null} scale={scale} />
      ),
    },
    {
      id: "orderedUnits",
      accessorKey: "orderedUnits",
      header: "Sipariş adedi",
      cell: (c) => {
        const v = c.getValue() as number | null;
        return v === null ? (
          <NoData reason="Kayıtta yok" />
        ) : (
          <Num value={v} size="sm" />
        );
      },
    },
    {
      id: "stars",
      accessorKey: "stars",
      header: "Yıldız",
      cell: (c) => {
        const v = c.getValue() as number | null;
        const reviews = c.row.original.reviews;
        /* SIFIR YORUM SIFIR YILDIZ DEĞİLDİR: kayıt yorumsuz ürüne 0
           yazıyor; onu "0 yıldız" diye basmak ölçülmemişi ölçülmüş
           göstermek olurdu. */
        if (!reviews) return <NoData reason="Henüz yorum yok" />;
        return v === null ? (
          <NoData reason="Kayıtta yok" />
        ) : (
          <span className="tabular-nums">
            <Num value={v} fractionDigits={1} size="sm" /> / 5 · {reviews}{" "}
            yorum
          </span>
        );
      },
    },
  ];
}

export function AmazonReturns({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const returns = useOdinReturns();

  const zorlama = screenState({
    demo,
    primary: returns,
    sources: [returns],
    error: DEMO_ERROR,
  });

  const live = returns.envelope?.data ?? null;
  /** `empty` = "ÖLÇÜLDÜ, kayıtta ürün satırı yok". */
  const r = zorlama.isEmpty && live ? { ...live, rows: [], total: null } : live;

  const error: SectionError | null =
    zorlama.error ??
    (returns.error
      ? {
          what: returns.error.what,
          why: returns.error.why,
          impact: returns.error.impact,
          fix: returns.error.fix,
        }
      : null) ??
    sourceUnavailable(r, {
      what: "İade kaydı yayınlanmadı",
      impact: "İade oranı ve memnuniyet tablosu çizilemiyor.",
      fix: "Müşteri memnuniyeti kaydını promote et, sonra yeniden dene.",
    });

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <WorkspaceHeader
        title="Returns"
        context={
          r?.asOf
            ? `Promote edilmiş memnuniyet kaydı · ${formatDate(r.asOf, {
                dateStyle: "medium",
              })}`
            : "Promote edilmiş müşteri memnuniyeti kaydı"
        }
        lastSync={returns.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Kaydın özeti"
        description="Bu satır kaydın KENDİ toplamıdır — ürün listesine dahil edilmez, yoksa her şey iki kez sayılır."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={r !== null && r.available && r.total === null}
        emptyTitle="Özet satırı yok"
        emptyDescription="Kayıt bir Total satırı taşımıyor."
      >
        {r && r.available && r.total && (
          <Card>
            <CardBody>
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <Stat
                  label="İade oranı"
                  value={
                    <RefundRate
                      value={r.total.refundRate}
                      scale={r.refundRateScale}
                    />
                  }
                  note="kaydın kendi toplam satırı"
                />
                <Stat
                  label="Yıldız"
                  value={
                    r.total.stars === null ? (
                      <NoData reason="Kayıtta yok" />
                    ) : (
                      <>
                        <Num value={r.total.stars} fractionDigits={1} /> / 5
                      </>
                    )
                  }
                  note={`${r.total.reviews ?? 0} yorum`}
                />
                <Stat
                  label="Sipariş adedi"
                  value={
                    r.total.orderedUnits === null ? (
                      <NoData reason="Kayıtta yok" />
                    ) : (
                      <Num value={r.total.orderedUnits} />
                    )
                  }
                  note="kaydın kapsadığı dönem"
                />
                <Stat
                  label="Sipariş cirosu"
                  value={
                    r.total.orderedRevenue === null ? (
                      <NoData reason="Kayıtta yok" />
                    ) : (
                      <>
                        <Num
                          value={r.total.orderedRevenue}
                          fractionDigits={2}
                        />{" "}
                        {r.currency ?? ""}
                      </>
                    )
                  }
                  note="kaydın kendi toplam satırı"
                />
              </dl>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Ürün bazlı iade"
        description="İade oranı yüksek olan üstte. Bu bir sıralamadır, hüküm değil."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={8}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={r !== null && r.available && r.rows.length === 0}
        emptyTitle="Ürün satırı yok"
        emptyDescription="Kayıt promote edilmiş ama içinde ürün satırı yok."
      >
        {r && r.available && r.rows.length > 0 && (
          <DataTable
            data={r.rows}
            columns={columns(r.refundRateScale)}
            getRowId={(row, i) => `${row.title ?? "satir"}-${i}`}
            label="ASIN bazlı iade ve memnuniyet"
          />
        )}
      </Section>

      {returns.envelope && (
        <TrustSignal
          meta={returns.envelope.meta}
          refreshFailed={returns.refreshError?.what}
        />
      )}
    </div>
  );
}
