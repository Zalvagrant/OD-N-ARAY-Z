"use client";

/**
 * OpportunityCard — FR-0046 v1 Opportunity sözleşmesi (UI-ADR-106),
 * 05-dashboard.md §3.4, 06-workspaces.md §1.6.
 *
 * "Riskler ve fırsatlar EŞİT görsel ağırlıkta gösterilir. Sadece risk
 * gösteren bir sistem korku üretir; ODIN denge kurar."
 * Bu yüzden kart DecisionCard ile aynı yoğunluğu kullanır; fırsat küçük bir
 * yan kutu değildir.
 *
 * v1 sözleşmesi İNCEDİR ve bu bilinçlidir (meclis sentezi, sahip onayı):
 *  - `estimatedImpact`/"Gelir etkisi" YOK — ortak ve güvenilir bir parasal
 *    etki kaynağı kanıtlanmadı; kalıcı boş kalacak alan sahte yetenektir
 *    (UI-ADR-104 dersi). Kaynak+formül tanımlanınca FR-0044 zarfıyla döner.
 *  - `suggestedAction` ZORUNLU ve düz metindir: bunu sağlayamayan kayıt
 *    Opportunity değildir. 7 alanlı AIRecommendation üreticilerde yok;
 *    uydurulmaz.
 *  - `confidence`/`deadline`/`category` sözleşmede yok — üretici kaynağı
 *    doğrulanmadan çizilmez.
 */

import type { Opportunity } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heading, Mono, Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { TrustSignal } from "./trust-signal";
import { relativeTime, useNow } from "@/lib/clock/tick";

export function OpportunityCard({
  env,
}: {
  env: DataEnvelope<Opportunity> | null | undefined;
}) {
  const now = useNow();

  return (
    <DataGuard env={env} reason="Fırsat verisi yok">
      {(o, meta) => {
        const age = relativeTime(o.asOf, now);

        return (
          <Card>
            <CardHeader
              title={
                <div className="flex flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge variant="success" size="xs">
                      Fırsat
                    </Badge>
                    <span className="text-xs text-content-tertiary">
                      {o.source}
                      {age ? ` · ${age}` : null}
                    </span>
                  </span>
                  <Heading level={3} size={3}>
                    {o.title}
                  </Heading>
                </div>
              }
            />

            <CardBody>
              <div className="flex flex-col gap-4">
                <Text size="sm" tone="secondary">
                  {o.summary}
                </Text>

                <div className="rounded-sm border border-line-subtle p-3">
                  <p className="text-xs uppercase tracking-wide text-content-tertiary">
                    Önerilen aksiyon
                  </p>
                  <Text size="sm" className="mt-1">
                    {o.suggestedAction}
                  </Text>
                </div>

                {o.evidence?.length ? (
                  <div>
                    <p className="text-xs text-content-tertiary">Kanıt</p>
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {o.evidence.map((e) => (
                        <li key={e}>
                          <Mono size="sm">{e}</Mono>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
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
