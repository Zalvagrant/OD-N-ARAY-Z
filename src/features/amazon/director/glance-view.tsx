"use client";

/**
 * Layer 1 — Executive Glance (06-workspaces.md §1.3).
 *
 * `amazon-director.tsx` içinden çıkarıldı (UI-ADR-134). Dosya 802 satırdı
 * ve tek başına on ayrı sorumluluk taşıyordu; bu blok onlardan biriydi:
 * "10–15 saniyede Amazon nasıl gidiyor" sorusunun tek kartlık cevabı.
 *
 * Kendi başına durabilir çünkü DIŞARIDAN veri almaz — zarfı ve meta'sını
 * props ile alır, sorgu çalıştırmaz. Ekranın hangi kaynaktan beslendiği
 * değişse bu kart değişmez.
 */

import type { DataMeta } from "@/types/data-envelope";
import type { AmazonSnapshot } from "@/types/executive";
import { Badge } from "@/components/ui/badge";
import { NoData } from "@/components/ui/no-data";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Num, Text } from "@/components/ui/typography";
import { ConfidenceBadge } from "@/components/executive/confidence-badge";
import { Meter } from "@/components/executive/meter";
import { PROFIT_NEEDS_COGS } from "@/components/executive/ppc-overview";
import { TrustSignal } from "@/components/executive/trust-signal";
import { toPercentUnit } from "@/lib/format/percent";
import { HEALTH_SCORE_GOOD_MIN } from "@/features/amazon/presentation/thresholds";

/* --------------------------------------------------------------------------
   Layer 1 — Executive Glance. §1.3: "Grafik karmaşası yok, sadece:"
   -------------------------------------------------------------------------- */

export function GlanceView({ s, meta }: { s: AmazonSnapshot; meta: DataMeta }) {
  const scale = s.percentScale;

  return (
    <Card tone="ai">
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-ai-text">
            Executive Glance · 10–15 saniye
          </span>
          <ConfidenceBadge meta={meta} label="Anlık görüntü güveni" />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Stat
            label="Amazon Health"
            note="0–100"
            value={
              <>
                <Meter
                  value={s.healthScore}
                  label="Amazon sağlık skoru"
                  tone={s.healthScore >= HEALTH_SCORE_GOOD_MIN ? "success" : "warning"}
                  noDataReason="Sağlık skoru hesaplanmadı"
                />
                <Num value={s.healthScore} size="lg" noDataReason="Skor yok" />
              </>
            }
          />

          <Stat
            label="Revenue"
            value={
              <Num
                value={s.revenue?.amount ?? null}
                format="currency"
                currency={s.revenue?.currency}
                size="lg"
                noDataReason="Ciro gelmedi"
              />
            }
          />

          {/* NET KÂR: hesaplanamıyorsa GÖSTERİLMEZ — UI-ADR-116.
              Yerine gross profit + neyin hariç tutulduğu. */}
          {s.netProfit ? (
            <Stat
              label="Net Profit"
              value={
                <Num
                  value={s.netProfit.amount}
                  format="currency"
                  currency={s.netProfit.currency}
                  size="lg"
                />
              }
            />
          ) : (
            <Stat
              label="Gross Profit (ücretler hariç)"
              note="Net kâr DEĞİL — hariç tutulanlar aşağıda"
              value={
                <Num
                  value={s.grossProfit?.amount ?? null}
                  format="currency"
                  currency={s.grossProfit?.currency}
                  size="lg"
                  noDataReason={PROFIT_NEEDS_COGS}
                />
              }
            />
          )}

          <Stat
            label="Orders"
            value={<Num value={s.orders} size="lg" noDataReason="Sipariş sayısı gelmedi" />}
          />

          <Stat
            label="ACOS"
            value={
              <Num
                value={toPercentUnit(s.acos, scale)}
                format="percent"
                fractionDigits={1}
                size="lg"
                noDataReason="ACOS ölçeği bildirilmedi"
              />
            }
          />

          <Stat
            label="TACOS"
            value={
              <Num
                value={toPercentUnit(s.tacos, scale)}
                format="percent"
                fractionDigits={1}
                size="lg"
                noDataReason="TACOS ölçeği bildirilmedi"
              />
            }
          />

          <Stat
            label="Buy Box"
            value={
              <Num
                value={toPercentUnit(s.buyBoxRate, scale)}
                format="percent"
                fractionDigits={1}
                size="lg"
                noDataReason="BuyBox oranı gelmedi"
              />
            }
          />

          <Stat
            label="Inventory Health"
            value={
              <Num
                value={toPercentUnit(s.inventoryHealth, scale)}
                format="percent"
                fractionDigits={1}
                size="lg"
                noDataReason="Stok sağlığı hesaplanmadı"
              />
            }
          />
        </dl>

        {/* Net kârın neden yazılmadığı — 13-...md §4'ün somut karşılığı. */}
        {!s.netProfit && (
          <div className="rounded-sm border border-line-subtle p-3">
            <p className="text-xs uppercase tracking-wide text-content-tertiary">
              Net kâr neden yazılmıyor
            </p>
            <Text size="sm" tone="secondary" className="mt-1">
              Net kâr = satış − Amazon ücretleri − reklam − iade − COGS −
              nakliye. Aşağıdaki kalemler hesaba GİRMEDİĞİ için net kâr
              gösterilmiyor; yanlış bir kâr rakamı, eksik bir kâr rakamından
              tehlikelidir.
            </Text>
            <ul className="mt-2 flex flex-wrap gap-2">
              {(s.profitBasis?.excluded ?? []).map((x: string) => (
                <li key={x}>
                  <Badge variant="tertiary" size="xs">
                    {x}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Top Risk · Top Opportunity · Mission Progress */}
        <dl className="grid gap-4 border-t border-line-subtle pt-4 sm:grid-cols-3">
          <Stat
            label="Top Risk"
            value={
              s.topRisk ? (
                <span className="text-sm text-content">{s.topRisk.title}</span>
              ) : (
                <NoData reason="Açık kritik risk yok" />
              )
            }
          />
          <Stat
            label="Top Opportunity"
            value={
              s.topOpportunity ? (
                <span className="text-sm text-content">
                  {s.topOpportunity.recommendation}
                </span>
              ) : (
                <NoData reason="Ölçülmüş fırsat yok" />
              )
            }
          />
          {/* "Goal/Mission Progress" kartı KALDIRILDI — ADR-0143 §4: ilerleme
              yüzdesi kavramının ölçülmüş kaynağı yok ve ADR onu yaratmıyor.
              İzlenen kararlar Mission Control'ün tahtasındadır. */}
        </dl>
      </CardBody>

      <CardFooter>
        <TrustSignal meta={meta} />
      </CardFooter>
    </Card>
  );
}

