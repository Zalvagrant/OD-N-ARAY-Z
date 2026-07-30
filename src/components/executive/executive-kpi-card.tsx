"use client";

/**
 * ExecutiveKPICard — ODIN'in en ayırt edici bileşeni.
 * Kaynak: 05-dashboard.md §4 (anatomi), 09-data-contracts.md §1.
 *
 * "Kart kapalıyken bir KPI kartı kadar sade, açıkken bir mini-rapor kadar
 * zengin olmalıdır." Bu yüzden TEK açma düğmesi vardır: Level 2 ve Level 3
 * birlikte açılır. İki ayrı düğme, sadeliği bozar ve CEO'ya ikinci bir
 * gezinme kararı yükler.
 *
 * Level 1  metrik adı · değer · trend · sparkline   (her zaman)
 * Level 2  AI yorumu · confidence · forecast · risk
 * Level 3  önerilen aksiyon · kanıt sayısı · sorumlu · son güncelleme
 *
 * ANTI-FAKE:
 *  - Zarf boşsa kart hiç çizilmez (DataGuard).
 *  - Confidence üretilmemişse rozet YOK (ConfidenceBadge null döner).
 *  - Trend yönü RENKLENDİRİLMEZ: "yukarı" her metrik için iyi değildir
 *    (ACOS yükselmesi kötüdür). Yön glyph + kelime ile verilir; renk
 *    yalnızca sparkline'ın kendi ölçeğinden gelir.
 *  - Önerilen aksiyon 2'den az alternatif taşıyorsa gösterilmez.
 */

import { useId } from "react";
import { useDisclosureMemory } from "@/lib/store/navigation";
import type { ExecutiveKPI } from "@/types/executive";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/ui/sparkline";
import { NoData } from "@/components/ui/no-data";
import { Heading, Num, Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { ConfidenceBadge } from "./confidence-badge";
import { TrustSignal } from "./trust-signal";
import { Disclosure } from "./disclosure";
import {
  AIRecommendationView,
  canRenderRecommendation,
} from "./ai-recommendation-card";

const TREND = {
  up: { glyph: "▲", word: "yükseliyor" },
  down: { glyph: "▼", word: "düşüyor" },
  flat: { glyph: "■", word: "yatay" },
} as const;

const RISK = {
  none: { variant: "secondary", label: "Risk yok" },
  low: { variant: "info", label: "Düşük risk" },
  medium: { variant: "warning", label: "Orta risk" },
  high: { variant: "danger", label: "Yüksek risk" },
  critical: { variant: "danger", label: "Kritik risk" },
} as const;

/**
 * UI-ADR-093 — yüzde ölçeği TAHMİN EDİLMEZ.
 * `factor === null` → ölçek bildirilmemiş, değer gösterilmez.
 * 18.1'i 0.181 sanmak %1810 yazmaktır; sessiz 100 kat hata, sahte veriden
 * daha tehlikelidir çünkü makul görünür.
 */
function numProps(kpi: Pick<ExecutiveKPI, "unit" | "currency" | "scale">) {
  switch (kpi.unit) {
    case "currency":
      return {
        format: "currency" as const,
        currency: kpi.currency,
        factor: 1 as number | null,
        fractionDigits: undefined as number | undefined,
      };
    case "percent":
      return {
        format: "percent" as const,
        currency: undefined,
        factor: kpi.scale === "0-1" ? 1 : kpi.scale === "0-100" ? 1 / 100 : null,
        /* Intl varsayılanı yuvarlar: ACOS 18.1 → "%18". Amazon tarafında o
           ondalık karar değiştirir, bilgi kaybı kabul edilemez. */
        fractionDigits: 1 as number | undefined,
      };
    default:
      return {
        format: "compact" as const,
        currency: undefined,
        factor: 1 as number | null,
        fractionDigits: undefined as number | undefined,
      };
  }
}

/** Ölçek bilinmiyorsa null döner — çağıran NoData basar. */
function scaled(value: number | undefined, factor: number | null): number | null {
  if (factor === null) return null;
  return Number.isFinite(value as number) ? (value as number) * factor : null;
}

const SCALE_MISSING = "Yüzde ölçeği (scale) bildirilmedi — değer gösterilmiyor";

function KPIView({ kpi, meta }: { kpi: ExecutiveKPI; meta: DataMeta }) {
  /* Yerel useState DEĞİL: geri dönüşte açık kart açık kalmalı (denetim §2). */
  const [open, toggleOpen] = useDisclosureMemory(`kpi:${kpi.id}`);
  const bodyId = useId();

  const { format, currency, factor, fractionDigits } = numProps(kpi);
  const trend = TREND[kpi.trend?.direction] ?? TREND.flat;
  const risk = RISK[kpi.risk] ?? RISK.none;
  const action = kpi.recommendedAction;
  const showAction = canRenderRecommendation(action);

  return (
    <Card>
      <CardHeader
        title={
          <Heading level={3} size={4}>
            {kpi.label}
          </Heading>
        }
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleOpen}
            aria-expanded={open}
            aria-controls={bodyId}
          >
            {open ? "Kapat" : "Detay"}
          </Button>
        }
      />

      <CardBody>
        {/* ---------- LEVEL 1 — her zaman görünür ---------- */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Num
              value={scaled(kpi.value, factor)}
              format={format}
              currency={currency}
              fractionDigits={fractionDigits}
              size="3xl"
              noDataReason={factor === null ? SCALE_MISSING : `${kpi.label} hesaplanamadı`}
            />
            <p className="mt-1 flex items-center gap-2 text-sm text-content-secondary">
              <span aria-hidden="true">{trend.glyph}</span>
              {Number.isFinite(kpi.trend?.changePercent) ? (
                <Num value={kpi.trend.changePercent / 100} format="percent" size="sm" tone="secondary" />
              ) : (
                <NoData reason="Değişim oranı hesaplanmadı" />
              )}
              <span className="text-content-tertiary">
                {kpi.trend?.comparedTo ? `· ${kpi.trend.comparedTo}` : null}
              </span>
              <span className="sr-only">{trend.word}</span>
            </p>
          </div>

          <Sparkline values={kpi.sparkline ?? []} label={`${kpi.label} trendi`} />
        </div>

        {/* ---------- LEVEL 2 + 3 — açılınca ---------- */}
        <Disclosure open={open} id={bodyId}>
          <div className="mt-4 flex flex-col gap-4 border-t border-line-subtle pt-4">
            {/* Level 2 */}
            <div className="odin-ai-region p-3">
              <p className="text-xs uppercase tracking-wide text-ai-text">AI yorumu</p>
              {kpi.aiInsight ? (
                <Text tone="secondary" className="mt-1">
                  {kpi.aiInsight}
                </Text>
              ) : (
                <NoData reason="AI yorumu üretilmedi" />
              )}
            </div>

            {/* min-w-0: grid hücresi içeriğine göre şişmesin — Forecast satırı
                uzun (değer + ufuk + tahmin güveni) ve taşarsa Risk hücresinin
                üstüne biner. */}
            <dl className="grid gap-3 text-sm sm:grid-cols-3 [&>div]:min-w-0">
              <div>
                <dt className="text-xs text-content-tertiary">Confidence</dt>
                <dd className="mt-1">
                  {/* Rozet ancak skor gerçekten üretilmişse çıkar. */}
                  {Number.isFinite(kpi.confidence) ? (
                    <ConfidenceBadge value={kpi.confidence} />
                  ) : (
                    <NoData reason="Güven skoru üretilmedi" />
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-content-tertiary">Forecast</dt>
                <dd className="mt-1 flex flex-wrap items-baseline gap-2">
                  <Num
                    value={scaled(kpi.forecast?.value, factor)}
                    format={format}
                    currency={currency}
                    fractionDigits={fractionDigits}
                    noDataReason={factor === null ? SCALE_MISSING : "Tahmin üretilmedi"}
                  />
                  {kpi.forecast?.horizon && (
                    <span className="text-xs text-content-tertiary">{kpi.forecast.horizon}</span>
                  )}
                  <ConfidenceBadge value={kpi.forecast?.confidence} size="xs" label="Tahmin güveni" />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-content-tertiary">Risk</dt>
                <dd className="mt-1">
                  <Badge variant={risk.variant} size="sm">
                    {risk.label}
                  </Badge>
                </dd>
              </div>
            </dl>

            {/* Level 3 */}
            <div className="flex flex-col gap-3 border-t border-line-subtle pt-4">
              <div>
                <p className="text-xs text-content-tertiary">Önerilen aksiyon</p>
                {showAction ? (
                  <div className="mt-2">
                    <AIRecommendationView rec={action!} compact />
                  </div>
                ) : (
                  <Text size="sm" tone="tertiary" className="mt-1">
                    {action
                      ? "Öneri açıklanabilirlik şartını sağlamıyor, gösterilmiyor."
                      : "Bu metrik için öneri üretilmedi."}
                  </Text>
                )}
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-baseline gap-2">
                  <dt className="text-xs text-content-tertiary">Kanıt</dt>
                  <dd>
                    <Num
                      value={Array.isArray(kpi.evidence) ? kpi.evidence.length : null}
                      noDataReason="Kanıt sayısı bilinmiyor"
                    />{" "}
                    kaynak
                  </dd>
                </div>
                <div className="flex items-baseline gap-2">
                  <dt className="text-xs text-content-tertiary">Sorumlu</dt>
                  <dd className="text-content-secondary">
                    {kpi.owner || <NoData reason="Sorumlu atanmadı" />}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Disclosure>
      </CardBody>

      <CardFooter>
        <TrustSignal meta={meta} />
      </CardFooter>
    </Card>
  );
}

export function ExecutiveKPICard({
  env,
}: {
  env: DataEnvelope<ExecutiveKPI> | null | undefined;
}) {
  return (
    <DataGuard env={env} reason="KPI verisi yok">
      {(kpi, meta) => <KPIView kpi={kpi} meta={meta} />}
    </DataGuard>
  );
}
