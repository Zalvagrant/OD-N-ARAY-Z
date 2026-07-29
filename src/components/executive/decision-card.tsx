"use client";

/**
 * DecisionCard — 05-dashboard.md §3.2, kanonik `DecisionRecord` üzerine
 * yeniden yazıldı (UI-ADR-105).
 *
 * EN ÖNEMLİ ETKİLEŞİM KURALI: karar düğmeleri KARTIN ÜZERİNDEDİR. CEO karar
 * vermek için başka ekrana gitmez.
 *
 * ÜÇ DÜĞME (sahip kararı §15.2-B): Onayla · Reddet · Ertele. Ret bir eylem
 * olarak yoksa CEO "karar vermeyerek" erteler ve ODIN bunu HİÇ öğrenmez —
 * "hayır" da bir karardır ve izi kalır (`human_decision.outcome` serbest
 * metindir, reddi de kayıt olarak saklar).
 *
 * GEREKÇE KADEMEYE BAĞLI (sahip kararı §15.1-C, UI-ADR-106): D1/D2'de
 * gerekçe ZORUNLU, D3'te tek tık. ODIN'in tüm öğrenme döngüsü insanın
 * gerekçesine dayanır; ama her karara cümle yazmak pratikte tek kelimelik
 * "ok"lara döner — o da bilgi değil gürültüdür.
 *
 * ONAY KİLİDİ (UI-ADR-092): veri `stale` ise karar düğmeleri kilitlenir.
 * Bayat veriyle verilen onay, sahte veriyle verilen onaydan farksızdır.
 *
 * 🔴 FLIP KOŞULLARI ARTIK GÖRÜNÜR. ODIN `flip_conditions`'ı zorunlu tutuyor
 * ve arayüz onu hiç göstermiyordu (09b §1). "Bu öneriyi ne değiştirir?"
 * cevabı olmayan bir öneri sorgulanamaz; kart onu açılır bölüme de
 * saklamaz, gövdede tutar.
 */

import { useId, useState } from "react";
import type { Decision } from "@/types/executive";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Heading, Num, Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { ConfidenceBadge } from "./confidence-badge";
import { TrustSignal } from "./trust-signal";
import { Disclosure } from "./disclosure";
import { CouncilView } from "./council-view";
import { MinorityOpinionBanner } from "./minority-opinion-banner";

const RISK_TONE = { low: "success", medium: "warning", high: "danger", critical: "danger" } as const;
const RISK_LABEL = { low: "Düşük", medium: "Orta", high: "Yüksek", critical: "Kritik" } as const;

const STATUS_LABEL: Record<Decision["status"], string> = {
  open: "Açık",
  monitoring: "İzleniyor",
  closed: "Kapandı",
};

/**
 * Gerekçe zorunlu mu? Kademe belirler (§15.1-C).
 * Tek yerde durur ve dışa açıktır: Decision Center aynı kuralı kullanır.
 */
export const REASONING_REQUIRED_TIERS: Decision["tier"][] = ["D1", "D2"];
export function needsReasoning(tier: Decision["tier"]): boolean {
  return REASONING_REQUIRED_TIERS.includes(tier);
}

export type DecisionOutcome = "approved" | "rejected" | "deferred";

const OUTCOME = {
  approved: { label: "Onayla", variant: "primary" as const },
  rejected: { label: "Reddet", variant: "danger" as const },
  deferred: { label: "Ertele", variant: "secondary" as const },
};

/** Madde listesi — boşsa BAŞLIK DA çizilmez, boş şerit kalmaz. */
function Bullets({
  title,
  items,
  tone = "secondary",
  emptyNote,
}: {
  title: string;
  items: string[] | undefined;
  tone?: "secondary" | "warning";
  emptyNote?: string;
}) {
  if (!items?.length) {
    return emptyNote ? (
      <div>
        <p className="text-xs uppercase tracking-wide text-content-tertiary">{title}</p>
        <Text size="sm" tone="tertiary" className="mt-1">
          {emptyNote}
        </Text>
      </div>
    ) : null;
  }
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-content-tertiary">{title}</p>
      <ul className="mt-1 flex flex-col gap-1">
        {items.map((x) => (
          <li key={x} className="flex gap-2">
            <span aria-hidden="true" className="text-content-tertiary">
              ·
            </span>
            <Text size="sm" tone={tone} as="span">
              {x}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DecisionView({
  decision,
  meta,
  onDecide,
  onOpenAnalysis,
}: {
  decision: Decision;
  meta: DataMeta;
  onDecide?: (d: Decision, outcome: DecisionOutcome, reasoning: string) => void;
  onOpenAnalysis?: (d: Decision) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<DecisionOutcome | null>(null);
  const [reasoning, setReasoning] = useState("");
  const councilId = useId();

  const stale = meta.freshness === "stale";
  const closed = decision.status === "closed";
  const rec = decision.recommendation;
  const fin = decision.financialImpact;
  const mustExplain = needsReasoning(decision.tier);

  const submit = (outcome: DecisionOutcome) => {
    if (mustExplain && !pending) {
      /* Gerekçe kutusu açılır; karar ikinci tıkla kesinleşir. */
      setPending(outcome);
      return;
    }
    onDecide?.(decision, outcome, reasoning.trim());
    setPending(null);
    setReasoning("");
  };

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              {/* Kademe kararın ağırlığıdır — ODIN'in kendi kavramı. */}
              <Badge variant={decision.tier === "D1" ? "danger" : "secondary"} size="xs">
                {decision.tier}
              </Badge>
              <Badge variant="secondary" size="xs">
                {STATUS_LABEL[decision.status]}
              </Badge>
              {decision.domain && (
                <Badge variant="ghost" size="xs">
                  {decision.domain}
                </Badge>
              )}
            </span>
            <Heading level={3} size={3}>
              {decision.question}
            </Heading>
          </div>
        }
      />

      <CardBody>
        <div className="flex flex-col gap-4">
          <div className="odin-ai-region p-3">
            <p className="text-xs uppercase tracking-wide text-ai-text">Öneri</p>
            <Text className="mt-1">{rec.text}</Text>
          </div>

          {decision.reason && <Text tone="secondary">{decision.reason}</Text>}

          <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3 [&>div]:min-w-0">
            {/* Finansal etkinin ODIN'de karşılığı YOK — gelmezse çizilmez. */}
            {fin && (
              <div>
                <dt className="text-xs text-content-tertiary">Finansal etki</dt>
                {/* items-start ŞART: `.odin-num` sağa hizalar, esnek sütunda
                    sayı etiketinden kopup kenara kaçıyordu (S5 bulgusu). */}
                <dd className="mt-1 flex flex-col items-start">
                  <Num
                    value={Number.isFinite(fin.amount) ? fin.amount : null}
                    format="currency"
                    currency={fin.currency}
                    size="lg"
                    noDataReason="Finansal etki hesaplanmadı"
                  />
                  {fin.horizon && (
                    <span className="text-xs text-content-tertiary">{fin.horizon}</span>
                  )}
                </dd>
              </div>
            )}
            {decision.riskLevel && (
              <div>
                <dt className="text-xs text-content-tertiary">Risk</dt>
                <dd className="mt-1">
                  <Badge variant={RISK_TONE[decision.riskLevel]} size="sm">
                    {RISK_LABEL[decision.riskLevel]}
                  </Badge>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-content-tertiary">Confidence</dt>
              <dd className="mt-1">
                <ConfidenceBadge value={rec.confidence} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-content-tertiary">Kanıt</dt>
              <dd className="mt-1">
                <Num
                  value={rec.evidenceSnapshot?.length ?? null}
                  noDataReason="Kanıt sayısı bilinmiyor"
                />{" "}
                kaynak
              </dd>
            </div>
          </dl>

          {/* 🔴 FLIP KOŞULLARI — gövdede, açılır bölümde DEĞİL.
              ODIN bunu zorunlu tutar; boş gelirse sessizce geçilmez. */}
          <div className="rounded-sm border border-line-subtle p-3">
            <Bullets
              title="Bu öneriyi ne değiştirir?"
              items={rec.flipConditions}
              emptyNote="Flip koşulu üretilmedi — öneri sorgulanabilir değil."
            />
          </div>

          <Bullets
            title="Varsayımlar"
            items={rec.assumptions}
            emptyNote="Varsayım bildirilmedi."
          />
          <Bullets title="Riskler" items={rec.risks} tone="warning" />

          {/* Azınlık görüşleri — LİSTE (ODIN'de çoğul). Katlanmaz. */}
          {rec.minorityOpinions?.map((o) => (
            <MinorityOpinionBanner key={`${o.member}-${o.option}`} opinion={o} />
          ))}

          <div>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={councilId}
            >
              {open ? "Analizi kapat" : "Kurul · güven kırılımı · alternatifler"}
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
          {closed && decision.humanDecision && (
            <Text size="sm" tone="tertiary">
              Karar verildi: {decision.humanDecision.outcome}
              {decision.humanDecision.reasoning
                ? ` — “${decision.humanDecision.reasoning}”`
                : ""}
            </Text>
          )}

          {stale && !closed && (
            <Text size="sm" tone="warning">
              Veri bayat — karar düğmeleri kilitli. Önce senkronizasyonu bekleyin.
            </Text>
          )}

          {/* Gerekçe kutusu yalnızca D1/D2'de ve karar tıklandıktan sonra. */}
          {pending && (
            <div className="w-full">
              <Field
                label={`${OUTCOME[pending].label} — gerekçe`}
                description={`${decision.tier} kararında gerekçe zorunludur; karar kaydına yazılır.`}
                required
              >
                {(field) => (
                  <Textarea
                    {...field}
                    rows={2}
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    placeholder="Bu kararı neden verdin?"
                  />
                )}
              </Field>
            </div>
          )}

          {!closed && onDecide && (
            <div className="flex flex-wrap items-center gap-2">
              {(pending ? [pending] : (["approved", "rejected", "deferred"] as const)).map(
                (o) => (
                  <Button
                    key={o}
                    variant={OUTCOME[o].variant}
                    size="md"
                    disabled={stale || (pending !== null && reasoning.trim().length === 0)}
                    onClick={() => submit(o)}
                    title={stale ? "Bayat veriyle karar verilemez" : undefined}
                  >
                    {pending ? `${OUTCOME[o].label} — kaydet` : OUTCOME[o].label}
                  </Button>
                )
              )}
              {pending && (
                <Button variant="ghost" size="md" onClick={() => setPending(null)}>
                  Vazgeç
                </Button>
              )}
            </div>
          )}

          {!closed && onDecide && !mustExplain && (
            <Text size="sm" tone="tertiary">
              {decision.tier} kararı — gerekçe istenmez, tek tık yeter.
            </Text>
          )}

          {onOpenAnalysis && !pending && (
            <div>
              <Button variant="secondary" size="sm" onClick={() => onOpenAnalysis(decision)}>
                Analizi aç
              </Button>
            </div>
          )}

          <TrustSignal meta={meta} />
        </div>
      </CardFooter>
    </Card>
  );
}

export function DecisionCard({
  env,
  onDecide,
  onOpenAnalysis,
}: {
  env: DataEnvelope<Decision> | null | undefined;
  onDecide?: (d: Decision, outcome: DecisionOutcome, reasoning: string) => void;
  onOpenAnalysis?: (d: Decision) => void;
}) {
  return (
    <DataGuard env={env} reason="Karar verisi yok">
      {(decision, meta) => (
        <DecisionView
          decision={decision}
          meta={meta}
          onDecide={onDecide}
          onOpenAnalysis={onOpenAnalysis}
        />
      )}
    </DataGuard>
  );
}
