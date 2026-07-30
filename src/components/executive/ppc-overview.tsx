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
 * sayı UYDURULMAZ, gerekçesi yazılır (UI-ADR-116). Kasten boş görünen bu
 * hücre, yanlış bir kâr rakamından iyidir.
 */

import type { PPCOverview } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import { toPercentUnit } from "@/lib/format/percent";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Num, Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { Meter } from "./meter";
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
            {/* EN FAZLA İKİ KOLON — üç değil.
                Tailwind'in `grid-cols-N`'i `minmax(0,1fr)` üretir: sütun,
                içeriğinin altına İNEBİLİR. Para değerleri sarmadığı için
                sığmayınca komşunun üstüne taşar. Kart zaten ekranın 1/3'ünde
                duruyor; içinde üçüncü bir sütun para tutarlarına hiçbir
                genişlikte yetmiyordu — ölçüldü: 1920'de bitişik, 1440'ta
                45 px iç içe. `min-w-0` YOK: sütunun içeriğinden dar olmasına
                izin veren şey tam olarak oydu.
                Ölçüm o sırada ₺ tutarlarıyla yapıldı; kural para biriminden
                bağımsızdır — sayı sarmaz, sütun daralırsa taşar. */}
            <dl className="grid gap-4 sm:grid-cols-2">
              <Stat
                label="PPC Health"
                note={
                  Number.isFinite(ppc.health) ? `${Math.round(ppc.health)} / 100` : undefined
                }
                value={
                  <Meter
                    value={Number.isFinite(ppc.health) ? ppc.health : null}
                    label="PPC sağlık skoru"
                    tone="ai"
                    noDataReason="PPC sağlık skoru üretilmedi"
                  />
                }
              />

              <Stat
                label="Spend"
                value={
                  <Num
                    value={ppc.spend?.amount ?? null}
                    format="currency"
                    currency={ppc.spend?.currency}
                    size="lg"
                    noDataReason="Reklam harcaması gelmedi"
                  />
                }
              />

              <Stat
                label="Sales"
                value={
                  <Num
                    value={ppc.sales?.amount ?? null}
                    format="currency"
                    currency={ppc.sales?.currency}
                    size="lg"
                    noDataReason="Reklam satışı gelmedi"
                  />
                }
              />

              <Stat
                label="ACOS"
                value={
                  <Num
                    value={toPercentUnit(ppc.acos, ppc.percentScale)}
                    format="percent"
                    fractionDigits={1}
                    size="lg"
                    noDataReason="ACOS ölçeği bildirilmedi (UI-ADR-093)"
                  />
                }
              />

              <Stat
                label="ROAS"
                note="reklam satışı / reklam harcaması"
                value={
                  <Num
                    value={Number.isFinite(ppc.roas) ? ppc.roas : null}
                    fractionDigits={1}
                    size="lg"
                    noDataReason="ROAS hesaplanmadı"
                  />
                }
              />

              {/* ⭐ Ayırt edici metrik — ve anti-fake kuralının en sert testi. */}
              <Stat
                label="Profit After Ads"
                note={ppc.profitAfterAds ? "reklam sonrası kâr" : PROFIT_NEEDS_COGS}
                value={
                  <Num
                    value={ppc.profitAfterAds?.amount ?? null}
                    format="currency"
                    currency={ppc.profitAfterAds?.currency}
                    size="lg"
                    noDataReason={PROFIT_NEEDS_COGS}
                  />
                }
              />
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
