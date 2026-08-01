"use client";

/**
 * MonitoredDecisionsBoard — Mission Control'ün Primary Focus Area'sı
 * (03-information-architecture.md §5, 05-dashboard.md §5).
 *
 * ⚠️ Bu, eski `MissionBoard`ın halefidir. ODIN **ADR-0143 §4**: "Mission"
 * bir kavram olarak REDDEDİLDİ — ODIN'de mission varlığı yok. Ona en yakın
 * GERÇEKLİK zaten kayıtlı ve bu tahta onun **görünümüdür**:
 *
 *   1. `status: "monitoring"` kararlar + `monitoringCheckpoints`'leri
 *   2. `lifecycle.due_deferrals()` — vadesi GELMİŞ ertelemeler
 *
 * Eski tahtanın icat ettiği her şey gitti: kanban `status` kolonları
 * (planned/active/blocked/done), `ownerDirector`, `deadline`, `blockedReason`
 * ve **`progressPercent`**. ADR §4 son cümlesi nettir: ilerleme yüzdesi
 * kendi ölçülmüş kaynağını ister ve bu ADR onu YARATMAZ. Ölçüsü olmayan bir
 * yüzde çizmek, anti-fake kuralının ihlalidir.
 *
 * Ertelemenin "vadesi geldi mi" sorusu TARİH KARŞILAŞTIRMASIDIR, tahmin
 * değil: `revisitAt <= now`. Tarihi olmayan erteleme ODIN'de zaten
 * yazılamaz (ADR-0131 gelecek tarih şartı).
 */

import type { Decision } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import { useEffect } from "react";
import { relativeTime, remainingTime, useNow } from "@/lib/clock/tick";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { TrustSignal } from "./trust-signal";

/** Vadesi gelmiş erteleme: verdict `deferred` VE `revisitAt` geçmiş. */
export function dueDeferrals(decisions: Decision[], now: number | null): Decision[] {
  if (now === null) return [];
  return decisions.filter((d) => {
    const hd = d.humanDecision;
    if (hd?.outcome !== "deferred" || !hd.revisitAt) return false;
    return new Date(hd.revisitAt).getTime() <= now;
  });
}

export function monitoredDecisions(decisions: Decision[]): Decision[] {
  return decisions.filter((d) => d.status === "monitoring");
}

function DecisionItem({
  decision,
  due,
}: {
  decision: Decision;
  /** Erteleme kartıysa vade metni; izlenen kararda yoktur. */
  due?: string | null;
}) {
  return (
    <Card density="compact">
      <CardBody density="compact" className="flex flex-col gap-2">
        <p className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" size="xs">
            {decision.tier}
          </Badge>
          <span className="text-sm font-medium text-content">{decision.question}</span>
        </p>

        {due && (
          <Text size="sm" tone="secondary">
            Yeniden bakılacaktı: {due}
          </Text>
        )}

        {/* Kontrol noktaları KARARIN kendi alanıdır (monitoring_checkpoints).
            Yoksa satır hiç çizilmez — boş bir liste "kontrol yok" demek
            değildir, "yazılmamış" demektir. */}
        {decision.monitoringCheckpoints?.length ? (
          <ul className="flex flex-col gap-1">
            {decision.monitoringCheckpoints.map((c) => (
              <li key={c} className="text-xs text-content-tertiary">
                · {c}
              </li>
            ))}
          </ul>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function MonitoredDecisionsBoard({
  env,
  filter = "",
  onFilteredCount,
}: {
  env: DataEnvelope<Decision[]> | null | undefined;
  /** Workspace header'daki aramadan gelir; boşsa filtre yok. */
  filter?: string;
  /**
   * Tahtanın GERÇEKTEN gösterdiği kayıt sayısı — UI-ADR-156.
   *
   * Ekran `resultCount={decisionEnv?.data.length}` yazıyordu: zarftaki HAM
   * sayı. Oysa filtre BURADA uygulanıyor ve liste ayrıca ikiye bölünüyor
   * (izlenen + vadesi gelen). Sonuç: "XYZ" aratınca tahtada 0 kart
   * görünürken arama kutusu ham toplamı duyuruyordu — `aria-live` ile
   * ekran okuyucuya da. Sayının sahibi filtreyi uygulayan katmandır.
   */
  onFilteredCount?: (n: number | null) => void;
}) {
  const now = useNow();

  /**
   * HESAP GÖVDEDE, RENDER GERİ ÇAĞRISINDA DEĞİL — UI-ADR-156.
   *
   * İlk yazımda sayım `DataGuard`ın render geri çağrısı içinde yapılıp
   * bir ref üzerinden yukarı bildiriliyordu; ESLint `react-hooks/refs`
   * ile haklı olarak reddetti: render sırasında ebeveynin state'ini
   * güncellemek olur. Aynı filtre gövdede bir kez hesaplanıp hem render'a
   * hem effect'e veriliyor — tek kaynak, iki tüketici.
   */
  const q = filter.trim().toLocaleLowerCase("tr");
  const match = (d: Decision) =>
    !q || d.question.toLocaleLowerCase("tr").includes(q);
  const all = env?.data ?? null;
  const monitored = all === null ? [] : monitoredDecisions(all).filter(match);
  const due = all === null ? [] : dueDeferrals(all, now).filter(match);

  const shown = all === null ? null : monitored.length + due.length;
  /* `onFilteredCount` BAĞIMLILIKTA — ref hilesi değil. Ref'i render'da
     yazmak React kuralını ihlal eder (`react-hooks/refs`), effect'te
     yazmak ikinci bir effect ister. Çağıranın KARARLI bir fonksiyon
     geçmesi zaten doğru sözleşme: `useState` setter'ı kararlıdır ve iki
     çağıran da onu geçiyor. Kararsız bir fonksiyon geçen, `useCallback`
     yazar — bu, gizlenecek değil söylenecek bir gerekliliktir. */
  useEffect(() => {
    /* `?? 0` DEĞİL — UI-ADR-164. Zarf yokken tahta "Karar verisi yok"
       derken arama kutusu `aria-live` ile "0 sonuç" okutuyordu: ölçülmemiş
       bir şeyi ölçülmüş gibi duyurmak (UI-ADR-155'in doğrudan ihlali). */
    onFilteredCount?.(shown);
  }, [shown, onFilteredCount]);

  return (
    <DataGuard env={env} reason="Karar verisi yok">
      {(_decisions, meta) => {
        if (monitored.length === 0 && due.length === 0) {
          return (
            <EmptyState
              title={q ? "Eşleşen kayıt yok" : "İzlenen karar ve vadesi gelen erteleme yok"}
              description={
                q
                  ? `"${filter}" için izlenen karar ya da vadesi gelmiş erteleme bulunamadı.`
                  : "Şu an ODIN'de izleme durumunda karar ve vadesi gelmiş erteleme yok."
              }
              suggestion="Onaylanan kararlar izlemeye, ertelenenler vadesi geldiğinde buraya düşer."
            />
          );
        }

        return (
          <div className="flex flex-col gap-3">
            <div className="grid gap-4 lg:grid-cols-2 [&>div]:min-w-0">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm">
                    İzlenen kararlar
                  </Badge>
                  <span className="odin-num text-xs text-content-tertiary">
                    {monitored.length}
                  </span>
                </div>
                {monitored.length === 0 ? (
                  <Text size="sm" tone="tertiary">
                    İzleme durumunda karar yok.
                  </Text>
                ) : (
                  monitored.map((d) => <DecisionItem key={d.id} decision={d} />)
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="danger" size="sm">
                    Vadesi gelen ertelemeler
                  </Badge>
                  <span className="odin-num text-xs text-content-tertiary">
                    {due.length}
                  </span>
                </div>
                {due.length === 0 ? (
                  <Text size="sm" tone="tertiary">
                    Vadesi gelmiş erteleme yok.
                  </Text>
                ) : (
                  due.map((d) => (
                    <DecisionItem
                      key={d.id}
                      decision={d}
                      due={
                        relativeTime(d.humanDecision?.revisitAt ?? null, now) ??
                        remainingTime(d.humanDecision?.revisitAt ?? null, now)
                      }
                    />
                  ))
                )}
              </div>
            </div>

            <TrustSignal meta={meta} />
          </div>
        );
      }}
    </DataGuard>
  );
}
