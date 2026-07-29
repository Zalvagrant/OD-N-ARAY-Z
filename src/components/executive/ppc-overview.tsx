"use client";

/**
 * PPCOverviewCard — PPC Intelligence Center Katman 1.
 * Kaynak: 06-workspaces.md §1.5 K1, 09-data-contracts.md §9 `PPCOverview`.
 *
 * PPC Health · Spend · Sales · ACOS · ROAS · **Profit After Ads**
 *
 * NEDEN AYRI BİLEŞEN, NEDEN 6 ADET ExecutiveKPICard DEĞİL: `ExecutiveKPI`
 * sözleşmesi trend · sparkline · forecast · aiInsight · confidence ister.
 * `PPCOverview` bunların hiçbirini içermez. Altı KPI nesnesi üretmek, altı
 * uydurma trend ve altı uydurma tahmin üretmek olurdu.
 *
 * ⭐ Profit After Ads reklam metriği değil KÂR metriğidir — ve tam bu yüzden
 * net kâr ile aynı kaderi paylaşır: COGS yoksa hesaplanamaz. `null` geldiğinde
 * sayı UYDURULMAZ, gerekçesi yazılır (UI-ADR-098). Kasten boş görünen bu
 * hücre, yanlış bir kâr rakamından iyidir.
 */

import type { PPCOverview } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import { toPercentUnit } from "@/lib/format/percent";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Num, Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { Meter } from "./meter";
import { Metric } from "./metric";
import { TrustSignal } from "./trust-signal";

/** COGS olmadan kâr hesaplanamaz — gerekçe tek yerde, dört yerde değil. */
export const PROFIT_NEEDS_COGS =
  "COGS girilmediği için kâr hesaplanamıyor (13-backend-recommendations.md §4)";

export function PPCOverviewCard({
  env,
  title = "Executive PPC Overview",
}: {
  env: DataEnvelope<PPCOverview> | null | undefined;
  title?: string;
}) {
  return (
    <DataGuard env={env} reason="PPC özeti üretilmedi">
      {(ppc, meta) => (
        <Card>
          <CardHeader title={title} description="Katman 1 — reklamın kâra etkisi" />
          <CardBody>
            <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Metric
                label="PPC Health"
                note={
                  Number.isFinite(ppc.health) ? `${Math.round(ppc.health)} / 100` : undefined
                }
              >
                <Meter
                  value={Number.isFinite(ppc.health) ? ppc.health : null}
                  label="PPC sağlık skoru"
                  tone="ai"
                  noDataReason="PPC sağlık skoru üretilmedi"
                />
              </Metric>

              <Metric label="Spend">
                <Num
                  value={ppc.spend?.amount ?? null}
                  format="currency"
                  currency={ppc.spend?.currency}
                  size="xl"
                  noDataReason="Reklam harcaması gelmedi"
                />
              </Metric>

              <Metric label="Sales">
                <Num
                  value={ppc.sales?.amount ?? null}
                  format="currency"
                  currency={ppc.sales?.currency}
                  size="xl"
                  noDataReason="Reklam satışı gelmedi"
                />
              </Metric>

              <Metric label="ACOS">
                <Num
                  value={toPercentUnit(ppc.acos, ppc.percentScale)}
                  format="percent"
                  fractionDigits={1}
                  size="xl"
                  noDataReason="ACOS ölçeği bildirilmedi (UI-ADR-093)"
                />
              </Metric>

              <Metric label="ROAS" note="reklam satışı / reklam harcaması">
                <Num
                  value={Number.isFinite(ppc.roas) ? ppc.roas : null}
                  fractionDigits={1}
                  size="xl"
                  noDataReason="ROAS hesaplanmadı"
                />
              </Metric>

              {/* ⭐ Ayırt edici metrik — ve anti-fake kuralının en sert testi. */}
              <Metric
                label="Profit After Ads"
                note={ppc.profitAfterAds ? "reklam sonrası kâr" : PROFIT_NEEDS_COGS}
              >
                <Num
                  value={ppc.profitAfterAds?.amount ?? null}
                  format="currency"
                  currency={ppc.profitAfterAds?.currency}
                  size="xl"
                  noDataReason={PROFIT_NEEDS_COGS}
                />
              </Metric>
            </dl>

            {!ppc.profitAfterAds && (
              <Text size="sm" tone="tertiary" className="mt-4">
                Kâr metriği kasten boştur. Yanlış bir kâr rakamı, eksik bir kâr
                rakamından tehlikelidir — makul görünür ve sorgulanmaz.
              </Text>
            )}
          </CardBody>
          <CardFooter>
            <TrustSignal meta={meta} />
          </CardFooter>
        </Card>
      )}
    </DataGuard>
  );
}
