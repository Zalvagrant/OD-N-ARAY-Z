"use client";

/**
 * AIBrief — 5 adımlı Executive Intelligence formatı.
 * Kaynak: 06-workspaces.md §1.3 Layer 2, 07-ai-directors.md §7.
 *
 *   📊 Numbers → 🔍 Analysis → 🧠 Interpretation → 🎯 Recommendation → 📑 Evidence
 *
 * Sıra SABİTTİR. Önce sayı, sonra yorum: "Evidence Before Opinion" kuralının
 * görsel karşılığı. Yorumu üste alan bir brifing, kanıtı süse çevirir.
 *
 * ANTI-FAKE / GAVADOLAR SENTEZİ: 🎯 adımının içeriği AIRecommendationCard'dır
 * ve o kart, 2'den az alternatifi olan bir öneriyi RENDER ETMEZ. Bu durumda
 * brifing sessizce boş bir adım göstermez; **bastırma gerçeğini** yazar
 * ("öneri gösterilmiyor, çünkü ..."). Bu uydurma değildir — bastırmayı bilen
 * katman burasıdır. Sahte bir Alert nesnesi de üretilmez.
 */

import type { ExecutiveBrief } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Heading, Num, Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { TrustSignal } from "./trust-signal";
import { EvidenceChain } from "./evidence-chain";
import {
  AIRecommendationView,
  canRenderRecommendation,
  missingExplainabilityFields,
} from "./ai-recommendation-card";

function Step({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line-subtle pt-4 first:border-t-0 first:pt-0">
      <Heading level={3} size={4}>
        <span aria-hidden="true">{icon}</span> {title}
      </Heading>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function AIBrief({
  env,
  title = "Executive Intelligence",
}: {
  env: DataEnvelope<ExecutiveBrief> | null | undefined;
  title?: string;
}) {
  return (
    <DataGuard env={env} reason="Brifing henüz üretilmedi">
      {(brief, meta) => {
        const recOk = canRenderRecommendation(brief.recommendation);
        const missing = recOk ? [] : missingExplainabilityFields(brief.recommendation);

        return (
          <Card tone="ai">
            <CardHeader
              title={title}
              description="AI üretimi — 5 adımlı standart format"
            />
            <CardBody>
              <div className="flex flex-col gap-4">
                <Step icon="📊" title="Numbers">
                  {Object.keys(brief.numbers ?? {}).length ? (
                    <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                      {Object.entries(brief.numbers).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex justify-between gap-4 border-b border-line-subtle py-1"
                        >
                          <dt className="text-content-tertiary">{k}</dt>
                          <dd className="text-content">
                            {typeof v === "number" ? <Num value={v} /> : v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <Text size="sm" tone="tertiary">
                      Sayısal veri gelmedi.
                    </Text>
                  )}
                </Step>

                <Step icon="🔍" title="Analysis">
                  <Text tone="secondary">{brief.analysis}</Text>
                </Step>

                <Step icon="🧠" title="Interpretation">
                  <Text tone="secondary">{brief.interpretation}</Text>
                </Step>

                <Step icon="🎯" title="Recommendation">
                  {recOk ? (
                    <AIRecommendationView rec={brief.recommendation} compact />
                  ) : (
                    /* Bastırma gerçeği — sahte içerik değil, eksik olanın adı. */
                    <Text size="sm" tone="warning">
                      Öneri gösterilmiyor. Eksik: {missing.join(", ")}.
                    </Text>
                  )}
                </Step>

                <Step icon="📑" title="Evidence">
                  <EvidenceChain evidence={brief.evidence} title="Brifing kanıt zinciri" />
                </Step>
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
