"use client";

/**
 * DecisionCard — ODIN DecisionRecord'un kartı (09b §1, UI-ADR-100).
 *
 * EN ÖNEMLİ ETKİLEŞİM KURALI: verdict KARTIN ÜZERİNDEDİR. CEO karar vermek
 * için başka bir ekrana gitmez. ÜÇ eylem vardır (ODIN verdict sözlüğü,
 * lifecycle.py): Onayla · Reddet · Ertele. Yalnızca "Onayla" sunmak, reddi
 * "karar vermemek" kılığına sokar ve ODIN hiçbir şey öğrenmez
 * (16-audit §5, meclis kararı).
 *
 * GEREKÇE KURALI ODIN'İNDİR (ADR-0131): sınıf B/C öneride HER verdict
 * gerekçe ister (en az 8 karakter) — onay dahil. `deferred` ayrıca GELECEK
 * bir tarih ister: "tarihsiz erteleme sessiz bir hayırdır, kimse geri
 * dönmez." UI bu kuralları İCAT ETMEZ, `ceo verdict`in kurallarını yüzeye
 * taşır; asıl reddi backend verir (S7'de bağlanınca, ER-0025).
 *
 * ONAY KİLİDİ (UI-ADR-092, üç eyleme genişledi): veri `stale` ise HİÇBİR
 * verdict verilemez — bayat veriyle ret de onay kadar sakattır. Sebep
 * butonların üstünde açık metinle yazılıdır.
 *
 * ALTERNATİFLER KARARIN ALANIDIR (şema minItems 2) ve bu kartta çizilir —
 * önerinin içinde değil (UI-ADR-091 ♻️ → UI-ADR-100).
 */

import { useId, useState } from "react";
import { useDisclosureMemory } from "@/lib/store/navigation";
import type { Decision } from "@/types/executive";
import {
  ODIN_MIN_REASON_CHARS,
  ODIN_REASON_REQUIRED_CLASSES,
  type OdinVerdict,
} from "@/types/odin";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Heading, Text } from "@/components/ui/typography";
import { useNow } from "@/lib/clock/tick";
import { DataGuard } from "./data-guard";
import { ConfidenceBadge } from "./confidence-badge";
import { TrustSignal } from "./trust-signal";
import { Disclosure } from "./disclosure";
import { CouncilView } from "./council-view";
import { MinorityOpinionBanner } from "./minority-opinion-banner";
import { AIRecommendationView, canRenderRecommendation } from "./ai-recommendation-card";

/** D1 geri alınabilir · D2 geri alması maliyetli · D3 stratejik (glossary). */
const TIER = {
  D1: { variant: "info", label: "D1 · geri alınabilir" },
  D2: { variant: "warning", label: "D2 · geri alması maliyetli" },
  D3: { variant: "danger", label: "D3 · stratejik" },
} as const;

const STATUS_LABEL = {
  open: "Açık",
  monitoring: "İzleniyor",
  closed: "Kapandı",
} as const;

const OUTCOME = {
  approved: { variant: "success", label: "Onaylandı" },
  rejected: { variant: "danger", label: "Reddedildi" },
  deferred: { variant: "secondary", label: "Ertelendi" },
} as const;

const ALT_RISK = {
  low: { variant: "success", label: "düşük" },
  medium: { variant: "warning", label: "orta" },
  high: { variant: "danger", label: "yüksek" },
} as const;

export interface VerdictInput {
  verdict: OdinVerdict;
  reason?: string;
  /** deferred için zorunlu, YYYY-MM-DD */
  revisitAt?: string;
}

/* --------------------------------------------------------------------------
   Verdict formu — ADR-0131 kurallarının yüzeyi. Modal değil: karar kartın
   üzerinde verilir, bağlam kaybolmaz.
   -------------------------------------------------------------------------- */

function VerdictForm({
  decision,
  pending,
  onSubmit,
  onCancel,
}: {
  decision: Decision;
  pending: OdinVerdict;
  onSubmit: (v: VerdictInput) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [revisitAt, setRevisitAt] = useState("");
  const now = useNow(); // merkezi saat (UI-ADR-089) — render'da Date.now() yok

  const recClass = decision.recommendation.recClass;
  const reasonRequired =
    recClass !== undefined && ODIN_REASON_REQUIRED_CLASSES.includes(recClass);
  const reasonOk = !reasonRequired || reason.trim().length >= ODIN_MIN_REASON_CHARS;

  /* "Tarihsiz erteleme sessiz bir hayırdır" — gelecek tarih şart.
     Saat henüz gelmediyse (now === null) karar verilmez: tahmin yok. */
  const dateOk =
    pending !== "deferred" ||
    (revisitAt !== "" && now !== null && new Date(revisitAt).getTime() > now);

  const LABEL: Record<OdinVerdict, string> = {
    approved: "Onayı kaydet",
    rejected: "Reddi kaydet",
    deferred: "Ertelemeyi kaydet",
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-sm border border-line p-3">
      <Field
        label={
          reasonRequired
            ? `Gerekçe (sınıf ${recClass} — zorunlu, en az ${ODIN_MIN_REASON_CHARS} karakter)`
            : "Gerekçe (isteğe bağlı)"
        }
        description={
          reasonRequired
            ? "ODIN'in geri besleme döngüsü (ADR-0046) bu gerekçeden öğrenir."
            : undefined
        }
      >
        {(props) => (
          <Input
            {...props}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bu kararı neden böyle veriyorsun?"
          />
        )}
      </Field>

      {pending === "deferred" && (
        <Field
          label="Yeniden ele alma tarihi (zorunlu)"
          description="Tarihsiz erteleme sessiz bir hayırdır — ODIN o gün geri getirir."
        >
          {(props) => (
            <Input
              {...props}
              type="date"
              value={revisitAt}
              onChange={(e) => setRevisitAt(e.target.value)}
            />
          )}
        </Field>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={pending === "rejected" ? "danger" : "primary"}
          size="sm"
          disabled={!reasonOk || !dateOk}
          onClick={() =>
            onSubmit({
              verdict: pending,
              reason: reason.trim() || undefined,
              revisitAt: pending === "deferred" ? revisitAt : undefined,
            })
          }
        >
          {LABEL[pending]}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Vazgeç
        </Button>
        {!reasonOk && (
          <Text size="sm" tone="tertiary">
            Sınıf {recClass} kararı gerekçesiz kapanamaz.
          </Text>
        )}
        {pending === "deferred" && !dateOk && (
          <Text size="sm" tone="tertiary">
            Gelecek bir tarih seç.
          </Text>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   View
   -------------------------------------------------------------------------- */

function DecisionView({
  decision,
  meta,
  onVerdict,
}: {
  decision: Decision;
  meta: DataMeta;
  onVerdict?: (d: Decision, v: VerdictInput) => void;
}) {
  const [open, toggleOpen] = useDisclosureMemory(`decision:${decision.id}`);
  const [pending, setPending] = useState<OdinVerdict | null>(null);
  const bodyId = useId();

  const tier = TIER[decision.tier];
  const rec = decision.recommendation;
  const recOk = canRenderRecommendation(rec);
  const decided = decision.humanDecision;

  const stale = meta.freshness === "stale";
  /* Karar kapanmışsa verdict anlamsız; buton hiç çizilmez. */
  const closed = decision.status === "closed" || decided !== undefined;

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant={tier.variant} size="xs">
                {tier.label}
              </Badge>
              <Badge
                variant={decided ? OUTCOME[decided.outcome].variant : "secondary"}
                size="xs"
              >
                {decided ? OUTCOME[decided.outcome].label : STATUS_LABEL[decision.status]}
              </Badge>
              {decision.domain && (
                <span className="text-xs text-content-tertiary">{decision.domain}</span>
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
          <Text tone="secondary">{rec.recommendation}</Text>

          <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3 [&>div]:min-w-0">
            <div>
              <dt className="text-xs text-content-tertiary">Confidence</dt>
              <dd className="mt-1">
                <ConfidenceBadge value={rec.confidence} showBandLabel />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-content-tertiary">Kanıt</dt>
              <dd className="mt-1 text-content-secondary">{rec.evidence.length} kaynak</dd>
            </div>
            <div>
              <dt className="text-xs text-content-tertiary">Tarih</dt>
              <dd className="mt-1 text-content-secondary">
                <time dateTime={decision.date}>{decision.date}</time>
              </dd>
            </div>
          </dl>

          {/* Alternatifler — KARARIN alanı, en az 2 (şema minItems). */}
          <div>
            <p className="text-xs uppercase tracking-wide text-content-tertiary">
              Alternatifler
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              {decision.alternatives.map((a) => (
                <li key={a.option} className="rounded-sm border border-line-subtle p-3">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-content">{a.option}</span>
                    {a.risk && (
                      <Badge
                        variant={
                          ALT_RISK[a.risk as keyof typeof ALT_RISK]?.variant ?? "secondary"
                        }
                        size="xs"
                      >
                        risk {ALT_RISK[a.risk as keyof typeof ALT_RISK]?.label ?? a.risk}
                      </Badge>
                    )}
                  </p>
                  <Text size="sm" tone="secondary">
                    {a.assessment}
                  </Text>
                </li>
              ))}
            </ul>
          </div>

          {/* Azınlık görüşü gövdededir, açılır bölümde değil (10b §2). */}
          <MinorityOpinionBanner opinions={rec.minorityOpinions} />

          {/* Verilmiş karar gerekçesiyle görünür — ret de bir kayıttır. */}
          {decided && (
            <div className="rounded-sm border border-line-subtle p-3">
              <p className="text-xs uppercase tracking-wide text-content-tertiary">
                İnsan kararı
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={OUTCOME[decided.outcome].variant} size="xs">
                  {OUTCOME[decided.outcome].label}
                </Badge>
                {decided.outcome === "deferred" && decided.revisitAt && (
                  <span className="text-content-tertiary">
                    yeniden: <time dateTime={decided.revisitAt}>{decided.revisitAt}</time>
                  </span>
                )}
              </p>
              {decided.humanReasoning && (
                <Text size="sm" tone="secondary" className="mt-1">
                  {decided.humanReasoning}
                </Text>
              )}
            </div>
          )}

          <div>
            <Button
              variant="tertiary"
              size="sm"
              onClick={toggleOpen}
              aria-expanded={open}
              aria-controls={bodyId}
            >
              {open ? "Analizi kapat" : "Analizi aç"}
            </Button>
            <Disclosure open={open} id={bodyId}>
              <div className="mt-4 flex flex-col gap-4 border-t border-line-subtle pt-4">
                <CouncilView recommendation={rec} />
                {recOk ? (
                  <AIRecommendationView rec={rec} compact />
                ) : (
                  <Text size="sm" tone="tertiary">
                    Öneri açıklanabilirlik şartını sağlamıyor, gösterilmiyor.
                  </Text>
                )}
              </div>
            </Disclosure>
          </div>
        </div>
      </CardBody>

      <CardFooter className="flex-wrap !justify-between gap-3">
        <TrustSignal meta={meta} />

        {!closed && onVerdict && (
          <div className="flex min-w-0 flex-col items-end gap-2">
            {stale && (
              <Text size="sm" tone="tertiary">
                Veri bayat — karar verilemez. Bayat veriyle verilen ret de onay
                kadar sakattır; önce senkronu tazele.
              </Text>
            )}
            {!pending ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={stale}
                  onClick={() => setPending("approved")}
                >
                  Onayla
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={stale}
                  onClick={() => setPending("rejected")}
                >
                  Reddet
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={stale}
                  onClick={() => setPending("deferred")}
                >
                  Ertele
                </Button>
              </div>
            ) : (
              <VerdictForm
                decision={decision}
                pending={pending}
                onCancel={() => setPending(null)}
                onSubmit={(v) => {
                  setPending(null);
                  onVerdict(decision, v);
                }}
              />
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export function DecisionCard({
  env,
  onVerdict,
}: {
  env: DataEnvelope<Decision> | null | undefined;
  onVerdict?: (d: Decision, v: VerdictInput) => void;
}) {
  return (
    <DataGuard env={env} reason="Karar verisi yok">
      {(decision, meta) => (
        <DecisionView decision={decision} meta={meta} onVerdict={onVerdict} />
      )}
    </DataGuard>
  );
}
