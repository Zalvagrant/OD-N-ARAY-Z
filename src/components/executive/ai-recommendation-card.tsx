"use client";

/**
 * AIRecommendationCard — açıklanabilirlik sözleşmesinin arayüz karşılığı.
 * Kaynak: 07-ai-directors.md §7 (standart çıktı formatı) + §8 (explainability),
 * 09-data-contracts.md §3.
 *
 * İKİ SERT KURAL:
 *
 * 1. `alternatives.length < 2` ise bileşen HİÇ RENDER ETMEZ (`null`).
 *    "Tek seçenek sunan bir AI önerisi karar desteği değil, dayatmadır."
 *    Kartın yerine "gösterilemiyor" kutusu da BASILMAZ — o kutu, boş bir AI
 *    kartı üretip kuralı deler. Bastırma gerçeğini çağıran katman bilir
 *    (`canRenderRecommendation`) ve kendi bağlamında yazar. Bu, gavadolar
 *    tartışmasının sonucudur (terra: sessiz null · luna: görünürlük) —
 *    ikisi de karşılanır, uydurma yapılmaz.
 *
 * 2. 7 explainability alanından biri bile eksikse öneri gösterilmez.
 *    "Yarım açıklanmış bir AI önerisi, açıklanmamış bir öneriden daha
 *    tehlikelidir." (09-...md §3)
 *
 * Görsel: tüm AI bölgeleri `odin-ai-region` (Card tone="ai") — kullanıcı
 * bir bakışta bunun AI üretimi olduğunu anlar (UI-ADR-069).
 */

import { useId, useState } from "react";
import type { AIRecommendation } from "@/types/executive";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heading, Num, Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { ConfidenceBadge } from "./confidence-badge";
import { TrustSignal } from "./trust-signal";
import { EvidenceChain } from "./evidence-chain";
import { Disclosure } from "./disclosure";
import { relativeTime, useNow } from "@/lib/clock/tick";

const MIN_ALTERNATIVES = 2;

const RISK_TONE = { low: "success", medium: "warning", high: "danger" } as const;

/** Eksik olan açıklanabilirlik alanlarının adları. Boşsa öneri gösterilebilir. */
export function missingExplainabilityFields(rec: AIRecommendation | null | undefined): string[] {
  if (!rec) return ["öneri"];
  const missing: string[] = [];
  const text = (v: unknown) => typeof v === "string" && v.trim().length > 0;

  if (!text(rec.recommendation)) missing.push("öneri metni");
  if (!text(rec.whyGenerated)) missing.push("neden üretildi");
  if (!text(rec.responsibleDirector)) missing.push("sorumlu Director");
  if (!text(rec.lastValidated)) missing.push("son doğrulama");
  if (!Number.isFinite(rec.confidence)) missing.push("güven skoru");
  if (!Array.isArray(rec.evidence) || rec.evidence.length === 0) missing.push("kanıt");
  if (!Array.isArray(rec.relatedKnowledge)) missing.push("ilgili bilgi");
  if (!Array.isArray(rec.potentialRisks)) missing.push("potansiyel riskler");
  if (!Array.isArray(rec.alternatives) || rec.alternatives.length < MIN_ALTERNATIVES) {
    missing.push(`en az ${MIN_ALTERNATIVES} alternatif`);
  }
  return missing;
}

/** Çağıran katman bunu sorar; false ise öneri yerine kendi bağlamını yazar. */
export function canRenderRecommendation(rec: AIRecommendation | null | undefined): boolean {
  return missingExplainabilityFields(rec).length === 0;
}

/* --------------------------------------------------------------------------
   View — doğrulanmış veriyle çalışır. Başka Executive bileşenleri (AIBrief,
   OpportunityCard) kendi zarflarının içinde bunu gömer.
   -------------------------------------------------------------------------- */

export function AIRecommendationView({
  rec,
  meta,
  onApprove,
  compact = false,
}: {
  rec: AIRecommendation;
  meta?: DataMeta;
  onApprove?: (rec: AIRecommendation) => void;
  /** true → başlık ve kabuk çağırana ait; sadece gövde çizilir. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const now = useNow();

  if (!canRenderRecommendation(rec)) return null;

  const validated = relativeTime(rec.lastValidated, now);
  const fin = rec.expectedFinancialResult ?? {};

  const body = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Text size="md" className="text-content">
          {rec.recommendation}
        </Text>
        {/* Kabuk çağırana aitken güven skoru gövdede kalır — kaybolmaz. */}
        {compact && <ConfidenceBadge value={rec.confidence} />}
      </div>

      {/* 💰 Beklenen finansal sonuç */}
      {(Number.isFinite(fin.amount) || Number.isFinite(fin.percent)) && (
        <p className="flex items-baseline gap-2">
          <span className="text-xs text-content-tertiary">💰 Beklenen sonuç</span>
          {Number.isFinite(fin.amount) && (
            <Num value={fin.amount!} format="currency" currency={fin.currency} size="lg" />
          )}
          {Number.isFinite(fin.percent) && (
            <Num value={fin.percent! / 100} format="percent" size="lg" tone="secondary" />
          )}
        </p>
      )}

      {/* Explainability — her zaman görünür kısım */}
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-content-tertiary">Neden üretildi</dt>
          <dd className="text-content-secondary">{rec.whyGenerated}</dd>
        </div>
        <div>
          <dt className="text-xs text-content-tertiary">Sorumlu Director</dt>
          <dd className="text-content-secondary">{rec.responsibleDirector}</dd>
        </div>
        <div>
          <dt className="text-xs text-content-tertiary">Son doğrulama</dt>
          <dd className="text-content-secondary">
            {validated ?? <time dateTime={rec.lastValidated}>{rec.lastValidated}</time>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-content-tertiary">Potansiyel riskler</dt>
          <dd className="text-content-secondary">
            {rec.potentialRisks.length ? (
              <ul className="list-disc pl-4">
                {rec.potentialRisks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              "Risk kaydedilmedi"
            )}
          </dd>
        </div>
      </dl>

      <div>
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={bodyId}
        >
          {open ? "Gerekçeyi kapat" : `Gerekçe ve kanıt (${rec.alternatives.length} alternatif)`}
        </Button>

        <Disclosure open={open} id={bodyId}>
          <div className="mt-4 flex flex-col gap-4 border-t border-line-subtle pt-4">
            {/* 📊 Sayısal veriler */}
            {Object.keys(rec.numbers ?? {}).length > 0 && (
              <div>
                <Heading level={4} size={4}>
                  📊 Sayısal veriler
                </Heading>
                <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                  {Object.entries(rec.numbers).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-line-subtle py-1">
                      <dt className="text-content-tertiary">{k}</dt>
                      <dd className="text-content">
                        {typeof v === "number" ? <Num value={v} /> : v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* 🔍 Neden analizi · 📈 Etki analizi */}
            {rec.causeAnalysis && (
              <div>
                <Heading level={4} size={4}>
                  🔍 Neden oldu
                </Heading>
                <Text tone="secondary">{rec.causeAnalysis}</Text>
              </div>
            )}
            {rec.impactAnalysis && (
              <div>
                <Heading level={4} size={4}>
                  📈 Ne anlama geliyor
                </Heading>
                <Text tone="secondary">{rec.impactAnalysis}</Text>
              </div>
            )}

            {/* 🔄 Alternatifler — en az 2 garanti */}
            <div>
              <Heading level={4} size={4}>
                🔄 Alternatifler
              </Heading>
              <ul className="mt-2 flex flex-col gap-2">
                {rec.alternatives.map((a) => (
                  <li key={a.title} className="rounded-sm border border-line-subtle p-3">
                    <p className="flex items-center gap-2">
                      <span className="text-content">{a.title}</span>
                      <Badge variant={RISK_TONE[a.risk] ?? "secondary"} size="xs">
                        risk {a.risk}
                      </Badge>
                    </p>
                    <Text size="sm" tone="secondary">
                      {a.description}
                    </Text>
                    <Text size="sm" tone="tertiary">
                      Beklenen: {a.expectedOutcome}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>

            {/* İlgili bilgi */}
            {rec.relatedKnowledge.length > 0 && (
              <div>
                <Heading level={4} size={4}>
                  İlgili bilgi
                </Heading>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {rec.relatedKnowledge.map((k) => (
                    <li key={k}>
                      <Badge variant="secondary" size="xs">
                        {k}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 📚 Kanıtlar */}
            <div>
              <Heading level={4} size={4}>
                📚 Kullanılan kanıtlar
              </Heading>
              <div className="mt-2">
                <EvidenceChain evidence={rec.evidence} title="Öneri kanıt zinciri" />
              </div>
            </div>
          </div>
        </Disclosure>
      </div>
      {compact && onApprove && (
        <div>
          <Button variant="primary" size="sm" onClick={() => onApprove(rec)}>
            Onayla
          </Button>
        </div>
      )}
    </div>
  );

  if (compact) return body;

  return (
    <Card tone="ai">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-ai-text">AI önerisi</span>
            <ConfidenceBadge value={rec.confidence} />
          </span>
        }
        actions={
          onApprove && (
            <Button variant="primary" size="sm" onClick={() => onApprove(rec)}>
              Onayla
            </Button>
          )
        }
      />
      <CardBody>{body}</CardBody>
      {meta && (
        <CardFooter>
          <TrustSignal meta={meta} />
        </CardFooter>
      )}
    </Card>
  );
}

/* --------------------------------------------------------------------------
   Public — zarf doğrulaması DataGuard'da, tek çıkış noktası.
   -------------------------------------------------------------------------- */

export function AIRecommendationCard({
  env,
  onApprove,
}: {
  env: DataEnvelope<AIRecommendation> | null | undefined;
  onApprove?: (rec: AIRecommendation) => void;
}) {
  return (
    <DataGuard env={env} reason="AI önerisi henüz üretilmedi">
      {(rec, meta) => <AIRecommendationView rec={rec} meta={meta} onApprove={onApprove} />}
    </DataGuard>
  );
}
