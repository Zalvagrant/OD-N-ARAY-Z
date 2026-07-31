"use client";

/**
 * AlertStack — ODIN **ADR-0143 §1** kanonik Alert zarfı, 06-workspaces.md §1.4.
 *
 * TEK SERT KURAL: `requiresAction: false` olan öğe LİSTEYE GİRMEZ.
 * Alerts bölümü bir olay akışı değildir; yalnızca **aksiyon gerektiren**
 * olaylar vardır. Aksiyonsuz uyarı, alarm körlüğü üretir ve sonunda gerçek
 * alarmın da görülmemesine yol açar.
 *
 * Filtrelenen öğe sayısı SESSİZCE yutulmaz — kaç olayın bilgi amaçlı olduğu
 * altta yazılır. Ne gösterildiği kadar ne gösterilmediği de bilinmelidir.
 *
 * Renk eşlemesi 01-product-vision.md §5'ten gelir ve DEĞİŞTİRİLEMEZ.
 * Renk tek başına anlam taşımaz: her seviyenin metin etiketi vardır.
 */

import type { Alert } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/empty-state";
import { ThresholdNote } from "./threshold-note";
import { DataGuard } from "./data-guard";
import { TrustSignal } from "./trust-signal";
import { relativeTime, useNow } from "@/lib/clock/tick";

/* ADR-0143 §1 kanonik sözlüğü — UI eşleme İCAT ETMEZ. Sıra ODIN'in kendi
   sözlük sırasıdır: critical → risk → warning → info. */
const SEVERITY = {
  critical: { rank: 0, label: "Kritik", variant: "danger" },
  risk: { rank: 1, label: "Risk", variant: "warning" },
  warning: { rank: 2, label: "Uyarı", variant: "warning" },
  info: { rank: 3, label: "Bilgi", variant: "info" },
} as const;

/** Listeye girme kuralı — tek yerde, test edilebilir.
    ADR-0143 §1 bunu üretici tarafı sözleşmesi de yaptı; UI tarafı kalıyor
    çünkü iki tarafta da uygulanan bir kural, tek tarafta uygulanandan
    güvenlidir. */
export function actionableAlerts(alerts: Alert[]): Alert[] {
  return alerts
    .filter((a) => a.requiresAction === true)
    .sort((a, b) => (SEVERITY[a.severity]?.rank ?? 9) - (SEVERITY[b.severity]?.rank ?? 9));
}

export function AlertStack({
  env,
  title = "Aksiyon gerektiren uyarılar",
  onSelect,
}: {
  env: DataEnvelope<Alert[]> | null | undefined;
  title?: string;
  onSelect?: (a: Alert) => void;
}) {
  const now = useNow();

  return (
    <DataGuard env={env} reason="Uyarı verisi yok">
      {(alerts, meta) => {
        const shown = actionableAlerts(alerts);
        const suppressed = alerts.length - shown.length;

        return (
          <Card>
            <CardHeader title={title} />
            <CardBody>
              {shown.length ? (
                <ul className="flex flex-col gap-3">
                  {shown.map((a) => {
                    const sev = SEVERITY[a.severity] ?? SEVERITY.info;
                    const age = relativeTime(a.createdAt, now);
                    const row = (
                      <>
                        <p className="flex flex-wrap items-center gap-2">
                          <Badge variant={sev.variant} size="sm">
                            {sev.label}
                          </Badge>
                          <span className="text-content">{a.title}</span>
                          <span className="text-xs text-content-tertiary">{a.module}</span>
                          {age && <span className="text-xs text-content-tertiary">· {age}</span>}
                        </p>
                        {a.suggestedAction && (
                          <Text size="sm" tone="secondary">
                            Önerilen: {a.suggestedAction}
                          </Text>
                        )}
                        <ThresholdNote provenance={a.thresholdProvenance} />
                        {a.evidence.length > 0 && (
                          <p className="text-xs text-content-tertiary">
                            Kanıt: {a.evidence.join(", ")}
                          </p>
                        )}
                      </>
                    );

                    return (
                      <li key={a.id} className="border-l-2 border-line pl-3">
                        {onSelect ? (
                          <button
                            type="button"
                            onClick={() => onSelect(a)}
                            className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus"
                          >
                            {row}
                          </button>
                        ) : (
                          row
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  title="Aksiyon gerektiren uyarı yok"
                  description="Şu an müdahale bekleyen bir olay bulunmuyor."
                  suggestion="Bu, hiçbir şey olmadığı anlamına gelmez — bilgi amaçlı olaylar burada listelenmez."
                  nextStep="Tüm olay akışı için Executive Timeline'a bakın."
                />
              )}
            </CardBody>
            <CardFooter>
              <div className="flex w-full flex-col gap-1">
                {suppressed > 0 && (
                  <Text size="sm" tone="tertiary">
                    {suppressed} olay aksiyon gerektirmediği için listelenmedi.
                  </Text>
                )}
                <TrustSignal meta={meta} />
              </div>
            </CardFooter>
          </Card>
        );
      }}
    </DataGuard>
  );
}
