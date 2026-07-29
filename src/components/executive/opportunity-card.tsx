"use client";

/**
 * OpportunityCard — 05-dashboard.md §3.4, 09-data-contracts.md §7.
 *
 * "Riskler ve fırsatlar EŞİT görsel ağırlıkta gösterilir. Sadece risk
 * gösteren bir sistem korku üretir; ODIN denge kurar."
 * Bu yüzden kart DecisionCard ile aynı yoğunluk ve aynı ölçekleri kullanır;
 * fırsat küçük bir yan kutu değildir.
 *
 * Anti-fake: `recommendedAction` açıklanabilirlik şartını sağlamıyorsa
 * öneri bölümü çizilmez — fırsatın kendisi yine gösterilir, çünkü fırsat
 * ölçülmüş bir gerçektir, öneri ise bir AI çıktısıdır.
 */

import type { Opportunity } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heading, Num, Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { ConfidenceBadge } from "./confidence-badge";
import { TrustSignal } from "./trust-signal";
import { AIRecommendationView, canRenderRecommendation } from "./ai-recommendation-card";
import { remainingTime, useNow } from "@/lib/clock/tick";

const CATEGORY: Record<Opportunity["category"], string> = {
  product: "Ürün",
  pricing: "Fiyat",
  advertising: "Reklam",
  bundle: "Paket",
  keyword: "Anahtar kelime",
  other: "Diğer",
};

export function OpportunityCard({
  env,
  onApprove,
}: {
  env: DataEnvelope<Opportunity> | null | undefined;
  onApprove?: (o: Opportunity) => void;
}) {
  const now = useNow();

  return (
    <DataGuard env={env} reason="Fırsat verisi yok">
      {(o, meta) => {
        /* Son tarih GELECEKTEDİR: `relativeTime` bir yaş fonksiyonudur ve
           gelecek tarihlerin hepsine "birazdan" der — 7 gün sonrası da,
           21 gün sonrası da. Fırsatın ne zaman kaçacağı kalan süreyle
           yazılır (brifing ekranında görsel incelemede yakalandı). */
        const due = remainingTime(o.deadline, now);
        const recOk = canRenderRecommendation(o.recommendedAction);

        return (
          <Card>
            <CardHeader
              title={
                <div className="flex flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge variant="success" size="xs">
                      Fırsat
                    </Badge>
                    <Badge variant="secondary" size="xs">
                      {CATEGORY[o.category] ?? o.category}
                    </Badge>
                    <ConfidenceBadge value={o.confidence} size="xs" />
                  </span>
                  <Heading level={3} size={3}>
                    {o.title}
                  </Heading>
                </div>
              }
            />

            <CardBody>
              <div className="flex flex-col gap-4">
                {/* İki kolon — üç değil. `grid-cols-3` `minmax(0,1fr)` üretir
                    ve sütun içeriğinin altına inebilir; para değeri sarmadığı
                    için taşar (1440'ta "Gelir etkisi" 8 px taşıyordu, kart
                    ekranın 1/3'ünde). Sayıyı küçültmek çözüm DEĞİL: gelir
                    etkisi fırsatın manşet rakamıdır ve fırsatlar risklerle
                    eşit görsel ağırlıkta olmak zorundadır (05-...md §3.4). */}
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-content-tertiary">Gelir etkisi</dt>
                    <dd className="mt-1">
                      <Num
                        value={Number.isFinite(o.revenueImpact?.amount) ? o.revenueImpact.amount : null}
                        format="currency"
                        currency={o.revenueImpact?.currency}
                        size="lg"
                        noDataReason="Gelir etkisi hesaplanmadı"
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-content-tertiary">Son tarih</dt>
                    <dd className="mt-1 text-content-secondary">
                      {o.deadline ? (
                        <time dateTime={o.deadline}>{due ?? o.deadline}</time>
                      ) : (
                        <Text size="sm" tone="tertiary">
                          tarih yok
                        </Text>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-content-tertiary">Kanıt</dt>
                    <dd className="mt-1">
                      <Num
                        value={Array.isArray(o.evidence) ? o.evidence.length : null}
                        noDataReason="Kanıt sayısı bilinmiyor"
                      />{" "}
                      kaynak
                    </dd>
                  </div>
                </dl>

                {recOk ? (
                  <div className="odin-ai-region p-3">
                    <p className="text-xs uppercase tracking-wide text-ai-text">Önerilen aksiyon</p>
                    <div className="mt-2">
                      <AIRecommendationView
                        rec={o.recommendedAction}
                        compact
                        onApprove={onApprove ? () => onApprove(o) : undefined}
                      />
                    </div>
                  </div>
                ) : (
                  <Text size="sm" tone="tertiary">
                    Önerilen aksiyon açıklanabilirlik şartını sağlamadığı için gösterilmiyor.
                  </Text>
                )}
              </div>
            </CardBody>

            <CardFooter>
              <TrustSignal meta={meta} />
            </CardFooter>
          </Card>
        );
      }}
    </DataGuard>
  );
}
