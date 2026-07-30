"use client";

/**
 * AIRecommendationCard — açıklanabilirlik sözleşmesinin arayüz karşılığı.
 * Kaynak: 09b-verified-contracts.md §1 (ODIN recommendation — 10 zorunlu
 * alan) + 07-ai-directors.md §8.
 *
 * ZORUNLULUK LİSTESİ ODIN'İN LİSTESİDİR (UI-ADR-110). Eski "7 alan"
 * seti UI türetmesiydi; iki sapması vardı ve ikisi de düzeltildi:
 *  - `alternatives` burada aranıyordu — ODIN'de KARARIN alanıdır
 *    (schema minItems 2). UI-ADR-091'in o şartı buradan DecisionCard'a
 *    taşındı (karar seviyesine).
 *  - `flip_conditions` · `assumptions` · `confidence_breakdown` hiç
 *    aranmıyor ve GÖSTERİLMİYORDU — ODIN'de zorunlu üç alan (kayıp alan,
 *    uydurmadan tehlikelidir: sessizdir).
 *
 * Render kuralı aynı kaldı: eksik alanlı öneri HİÇ RENDER EDİLMEZ (null);
 * bastırma gerçeğini çağıran yazar (`canRenderRecommendation`).
 * ODIN zaten eksik alanlı öneri ÜRETMEZ (IncompleteRecommendation) —
 * buradaki kontrol, taşıma katmanında bozulan kaydı yakalar.
 */

import { useId } from "react";
import { useDisclosureMemory } from "@/lib/store/navigation";
import type { AIRecommendation } from "@/types/executive";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heading, Num, Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { ConfidenceBadge } from "./confidence-badge";
import { ConfidenceBreakdown } from "./confidence-breakdown";
import { TrustSignal } from "./trust-signal";
import { EvidenceChain } from "./evidence-chain";
import { Disclosure } from "./disclosure";
import { relativeTime, useNow } from "@/lib/clock/tick";

/** Eksik ZORUNLU alanların adları (ODIN'in 10 alanı). Boşsa gösterilebilir. */
export function missingExplainabilityFields(rec: AIRecommendation | null | undefined): string[] {
  if (!rec) return ["öneri"];
  const missing: string[] = [];
  const text = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  const list = (v: unknown) => Array.isArray(v) && v.length > 0;

  if (!text(rec.recommendation)) missing.push("öneri metni (text)");
  if (!Number.isFinite(rec.confidence)) missing.push("güven skoru");
  if (!rec.confidenceBreakdown) missing.push("güven dökümü (confidence_breakdown)");
  if (!list(rec.evidence)) missing.push("kanıt (evidence_snapshot)");
  if (!list(rec.potentialRisks)) missing.push("riskler");
  if (!list(rec.assumptions)) missing.push("varsayımlar (assumptions)");
  if (!list(rec.flipConditions)) missing.push("değiştirme koşulları (flip_conditions)");
  if (!Number.isFinite(rec.consensusScore)) missing.push("consensus skoru");
  if (!Number.isFinite(rec.disagreementScore)) missing.push("disagreement skoru");
  if (!Array.isArray(rec.minorityOpinions)) missing.push("azınlık görüşleri");
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

/* `onApprove` KALDIRILDI (UI-ADR-110): öneri seviyesinde tek tık onay,
   verdict'in gerekçe/tarih kurallarını atlardı. Onay KARAR kartındadır. */
export function AIRecommendationView({
  rec,
  meta,
  compact = false,
}: {
  rec: AIRecommendation;
  meta?: DataMeta;
  /** true → başlık ve kabuk çağırana ait; sadece gövde çizilir. */
  compact?: boolean;
}) {
  const [open, toggleOpen] = useDisclosureMemory(`rec:${rec.id}`);
  const bodyId = useId();
  const now = useNow();

  if (!canRenderRecommendation(rec)) return null;

  const validated = relativeTime(rec.lastValidated ?? null, now);
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

      {/* Zorunlu görünür kısım: varsayımlar + riskler (ODIN alanları).
          whyGenerated/responsibleDirector/lastValidated ODIN şemasında YOK
          (not_exposed, 09b §9) — varsa çizilir, yoksa satır uydurulmaz. */}
      <dl className="grid gap-2 text-sm sm:grid-cols-2 [&>div]:min-w-0">
        <div>
          <dt className="text-xs text-content-tertiary">Varsayımlar</dt>
          <dd className="text-content-secondary">
            <ul className="list-disc pl-4">
              {rec.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-content-tertiary">Potansiyel riskler</dt>
          <dd className="text-content-secondary">
            <ul className="list-disc pl-4">
              {rec.potentialRisks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </dd>
        </div>
        {rec.whyGenerated && (
          <div>
            <dt className="text-xs text-content-tertiary">Neden üretildi</dt>
            <dd className="text-content-secondary">{rec.whyGenerated}</dd>
          </div>
        )}
        {rec.responsibleDirector && (
          <div>
            <dt className="text-xs text-content-tertiary">Sorumlu Director</dt>
            <dd className="text-content-secondary">{rec.responsibleDirector}</dd>
          </div>
        )}
        {rec.lastValidated && (
          <div>
            <dt className="text-xs text-content-tertiary">Son doğrulama</dt>
            <dd className="text-content-secondary">
              {validated ?? <time dateTime={rec.lastValidated}>{rec.lastValidated}</time>}
            </dd>
          </div>
        )}
      </dl>

      {/* flip_conditions HER ZAMAN GÖRÜNÜR — açılır bölümde değil.
          "Bu öneriyi ne değiştirir?" CEO'nun onaydan ÖNCE görmesi gereken
          şeydir; katlanırsa kayıp alan geri gelir (UI-ADR-110). */}
      <div className="rounded-sm border border-line-subtle p-3">
        <p className="text-xs uppercase tracking-wide text-content-tertiary">
          ⚡ Bu öneriyi ne değiştirir
        </p>
        <ul className="mt-1 list-disc pl-4 text-sm text-content-secondary">
          {rec.flipConditions.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>

      <div>
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => toggleOpen()}
          aria-expanded={open}
          aria-controls={bodyId}
        >
          {open ? "Gerekçeyi kapat" : "Gerekçe, döküm ve kanıt"}
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
                  {Object.entries(rec.numbers ?? {}).map(([k, v]) => (
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

            {/* Güven dökümü — 8 kanonik bileşen (UI-ADR-109).
                Alternatifler ARTIK BURADA DEĞİL: kararın alanıdır ve
                DecisionCard çizer (UI-ADR-110). */}
            <ConfidenceBreakdown breakdown={rec.confidenceBreakdown} />

            {/* İlgili bilgi */}
            {(rec.relatedKnowledge?.length ?? 0) > 0 && (
              <div>
                <Heading level={4} size={4}>
                  İlgili bilgi
                </Heading>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {rec.relatedKnowledge!.map((k) => (
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
}: {
  env: DataEnvelope<AIRecommendation> | null | undefined;
}) {
  return (
    <DataGuard env={env} reason="AI önerisi henüz üretilmedi">
      {(rec, meta) => <AIRecommendationView rec={rec} meta={meta} />}
    </DataGuard>
  );
}
