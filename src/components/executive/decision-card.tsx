"use client";

/**
 * DecisionCard — 05-dashboard.md §3.2.
 *
 * EN ÖNEMLİ ETKİLEŞİM KURALI: `Onayla` butonu KARTIN ÜZERİNDEDİR. CEO karar
 * vermek için başka bir ekrana gitmek zorunda değildir. Detay isterse
 * `Analizi aç` ile Decision Center'a geçer.
 *
 * ONAY KİLİDİ (gavadolar · luna): veri `stale` ise onay butonu KİLİTLENİR.
 * Bayat veriyle verilen onay, sahte veriyle verilen onaydan farksızdır.
 * Kilit sebebi butonun üstünde yazılıdır — sessizce disabled edilmez.
 *
 * MinorityOpinionBanner kartın gövdesindedir, açılır bölümde DEĞİL:
 * "asla katlanıp gizlenmez" (07-...md §6).
 */

import { useId, useState } from "react";
import type { Decision } from "@/types/executive";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heading, Num, Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { ConfidenceBadge } from "./confidence-badge";
import { TrustSignal } from "./trust-signal";
import { Disclosure } from "./disclosure";
import { CouncilView } from "./council-view";
import { MinorityOpinionBanner } from "./minority-opinion-banner";
import { AIRecommendationView, canRenderRecommendation } from "./ai-recommendation-card";

const RISK_TONE = { low: "success", medium: "warning", high: "danger", critical: "danger" } as const;
const RISK_LABEL = { low: "Düşük", medium: "Orta", high: "Yüksek", critical: "Kritik" } as const;

/** Onay bu durumlarda anlamsızdır — buton hiç çizilmez. */
const CLOSED: Decision["status"][] = ["approved", "rejected", "completed"];

const STATUS_LABEL: Record<Decision["status"], string> = {
  proposed: "Önerildi",
  collecting_evidence: "Kanıt toplanıyor",
  under_review: "İncelemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  deferred: "Ertelendi",
  executing: "Uygulanıyor",
  monitoring: "İzleniyor",
  completed: "Tamamlandı",
};

function DecisionView({
  decision,
  meta,
  onApprove,
  onOpenAnalysis,
}: {
  decision: Decision;
  meta: DataMeta;
  onApprove?: (d: Decision) => void;
  onOpenAnalysis?: (d: Decision) => void;
}) {
  const [open, setOpen] = useState(false);
  const councilId = useId();

  const stale = meta.freshness === "stale";
  const closed = CLOSED.includes(decision.status);
  const risk = RISK_TONE[decision.riskLevel] ?? "warning";
  const fin = decision.financialImpact;
  const rec = decision.recommendation;

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant="danger" size="xs">
                P{decision.priority}
              </Badge>
              <Badge variant="secondary" size="xs">
                {STATUS_LABEL[decision.status] ?? decision.status}
              </Badge>
              <Badge variant="ghost" size="xs">
                {decision.type}
              </Badge>
            </span>
            <Heading level={3} size={3}>
              {decision.title}
            </Heading>
          </div>
        }
      />

      <CardBody>
        <div className="flex flex-col gap-4">
          <Text tone="secondary">{decision.executiveSummary}</Text>

          <dl className="grid gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-content-tertiary">Finansal etki</dt>
              <dd className="mt-1 flex flex-col">
                <Num
                  value={Number.isFinite(fin?.amount) ? fin.amount : null}
                  format="currency"
                  currency={fin?.currency}
                  size="lg"
                  noDataReason="Finansal etki hesaplanmadı"
                />
                {fin?.horizon && (
                  <span className="text-xs text-content-tertiary">{fin.horizon}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-content-tertiary">Risk</dt>
              <dd className="mt-1">
                <Badge variant={risk} size="sm">
                  {RISK_LABEL[decision.riskLevel] ?? decision.riskLevel}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-content-tertiary">Confidence</dt>
              <dd className="mt-1">
                {Number.isFinite(decision.aiConfidence) ? (
                  <ConfidenceBadge value={decision.aiConfidence} />
                ) : (
                  <Text size="sm" tone="tertiary">
                    üretilmedi
                  </Text>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-content-tertiary">Kanıt</dt>
              <dd className="mt-1">
                <Num
                  value={Array.isArray(decision.evidence) ? decision.evidence.length : null}
                  noDataReason="Kanıt sayısı bilinmiyor"
                />{" "}
                kaynak
              </dd>
            </div>
          </dl>

          {/* Recommendation — sözleşmede opsiyonel, uydurulmaz. */}
          {canRenderRecommendation(rec) && (
            <div className="odin-ai-region p-3">
              <AIRecommendationView rec={rec!} compact />
            </div>
          )}

          {/* Azınlık görüşü — her zaman görünür, katlanmaz. */}
          <MinorityOpinionBanner opinion={decision.minorityOpinion} />

          <div>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={councilId}
            >
              {open ? "Kurulu kapat" : `Executive Council (${decision.directorOpinions?.length ?? 0} görüş)`}
            </Button>
            <Disclosure open={open} id={councilId}>
              <div className="mt-4 border-t border-line-subtle pt-4">
                <CouncilView decision={decision} />
              </div>
            </Disclosure>
          </div>
        </div>
      </CardBody>

      <CardFooter>
        <div className="flex w-full flex-col gap-2">
          {stale && !closed && (
            <Text size="sm" tone="warning">
              Veri bayat — onay kilitli. Önce senkronizasyonu bekleyin.
            </Text>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {!closed && onApprove && (
              <Button
                variant="primary"
                size="md"
                disabled={stale}
                onClick={() => onApprove(decision)}
                title={stale ? "Bayat veriyle onay verilemez" : undefined}
              >
                Onayla
              </Button>
            )}
            {onOpenAnalysis && (
              <Button variant="secondary" size="md" onClick={() => onOpenAnalysis(decision)}>
                Analizi aç
              </Button>
            )}
          </div>
          <TrustSignal meta={meta} />
        </div>
      </CardFooter>
    </Card>
  );
}

export function DecisionCard({
  env,
  onApprove,
  onOpenAnalysis,
}: {
  env: DataEnvelope<Decision> | null | undefined;
  onApprove?: (d: Decision) => void;
  onOpenAnalysis?: (d: Decision) => void;
}) {
  return (
    <DataGuard env={env} reason="Karar verisi yok">
      {(decision, meta) => (
        <DecisionView
          decision={decision}
          meta={meta}
          onApprove={onApprove}
          onOpenAnalysis={onOpenAnalysis}
        />
      )}
    </DataGuard>
  );
}
