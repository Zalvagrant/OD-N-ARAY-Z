"use client";

/**
 * AlertStack — FR-0046 v1 Alert sözleşmesi (UI-ADR-106), 06-workspaces.md §1.4.
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
import { DataGuard } from "./data-guard";
import { TrustSignal } from "./trust-signal";
import { relativeTime, useNow } from "@/lib/clock/tick";

/* FR-0046 (UI-ADR-106) severity kümesi. `severity` OPSİYONELDİR: belgelenmiş
   deterministik eşlemesi olmayan üretici alanı atlar, null yazmaz. Severity'si
   olmayan kayıt rozetsiz gösterilir ve bilinenlerden SONRA sıralanır —
   önem derecesi uydurulmaz. */
const SEVERITY = {
  critical: { rank: 0, label: "Kritik", variant: "danger" },
  high: { rank: 1, label: "Yüksek", variant: "danger" },
  medium: { rank: 2, label: "Orta", variant: "warning" },
  low: { rank: 3, label: "Düşük", variant: "info" },
} as const;

const UNRANKED = 9;

function rank(a: Alert): number {
  return a.severity ? SEVERITY[a.severity].rank : UNRANKED;
}

/** Listeye girme kuralı — tek yerde, test edilebilir. */
export function actionableAlerts(alerts: Alert[]): Alert[] {
  return alerts.filter((a) => a.requiresAction === true).sort((a, b) => rank(a) - rank(b));
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
                    const sev = a.severity ? SEVERITY[a.severity] : null;
                    const age = relativeTime(a.asOf, now);
                    const row = (
                      <>
                        <p className="flex flex-wrap items-center gap-2">
                          {sev && (
                            <Badge variant={sev.variant} size="sm">
                              {sev.label}
                            </Badge>
                          )}
                          <span className="text-content">{a.title}</span>
                          {age && <span className="text-xs text-content-tertiary">· {age}</span>}
                        </p>
                        {a.summary && (
                          <Text size="sm" tone="secondary">
                            {a.summary}
                          </Text>
                        )}
                        <p className="text-xs text-content-tertiary">Kaynak: {a.source}</p>
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
