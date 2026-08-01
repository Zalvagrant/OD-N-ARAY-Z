"use client";

/**
 * SimulationPanel — PPC Intelligence Center Katman 4 "Executive Simulator".
 * Kaynak: 06-workspaces.md §1.5 K4, 09-data-contracts.md §9 `SimulationResult`.
 *
 * ⚠️ BACKEND'DE TAHMİN MOTORU YOK (13-...md §6). Bu yüzden panel bir
 * HESAP MAKİNESİ DEĞİLDİR — UI-ADR-117:
 *
 *  1. Senaryolar zarftan gelir; istemci HİÇBİR sayı hesaplamaz. Kaydırıcıyla
 *     "bütçe +%15 → satış +%9" hesaplamak, katsayının kaynağı olmadığı için
 *     sahte bir tahmin motorudur — formül görünür olsa bile.
 *  2. `assumptions[]` boşsa sonuç HİÇ gösterilmez (sözleşme zorunlu diyor).
 *     Varsayımları gösterilmeyen simülasyon, açıklanmamış bir AI çıktısıdır.
 *  3. Kaynak gerçek bir motor değilse başlıkta "SİMÜLASYON — MOCK" yazar.
 *
 * Gavadolar (terra · luna) ikisi de kaydırıcılı istemci hesabını reddetti.
 */

import { useState } from "react";
import type { SimulationCase } from "@/types/executive";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/selection";
import { Caption, Text } from "@/components/ui/typography";
import { ConfidenceBadge } from "./confidence-badge";
import { DataGuard } from "./data-guard";
import { TrustSignal } from "./trust-signal";

/** Varsayımsız sonuç gösterilmez — kural tek yerde, test edilebilir. */
export function canRenderSimulation(c: SimulationCase | undefined): boolean {
  const a = c?.result?.assumptions;
  return Array.isArray(a) && a.length > 0 && (c!.result.scenarios?.length ?? 0) > 0;
}

/**
 * "+%15" · "−%10" — sayı zarftan gelir, burada yalnızca biçimlenir.
 *
 * ⚠️ EKSİ İŞARETİ DÜŞÜYORDU — UI-ADR-191, mimari denetimde bulundu.
 *
 * Satır şöyleydi: `${p > 0 ? "+" : ""}%${Math.abs(p)}`. Artı için işaret
 * ekleniyor, eksi için `Math.abs` işareti siliyor ve geri konmuyordu:
 *
 *     changePercent  +15  →  "+%15"      (doğru)
 *     changePercent  −10  →  "%10"       (YANLIŞ — kesinti, artış gibi)
 *
 * Bu bir simülasyon panelinde: %10'luk bütçe KESİNTİSİ senaryosu, artış
 * senaryosundan ayırt edilemiyordu ve mock'ta gerçekten −10'luk bir
 * senaryo var. Kullanıcı yanlış senaryonun sayılarına bakıp karar
 * verebilirdi.
 *
 * Dikkat çekici olan: bu fonksiyonun KENDİ yorumu zaten `"-%10"` yazıyordu.
 * Sözleşme beyan edilmişti, kod onu tutmuyordu ve hiçbir şey ölçmüyordu —
 * bu denetimin baştan sona tekrar eden deseni.
 *
 * `−` U+2212 MİNUS SIGN: `mocks/amazon.ts` senaryo metinlerinde ("−%6")
 * zaten bunu kullanıyor. ASCII tire ile yan yana durunca hizasız görünür.
 */
function caseLabel(c: SimulationCase): string {
  const p = c.request?.changePercent;
  if (!Number.isFinite(p)) return c.request?.parameter ?? "senaryo";
  return `${p > 0 ? "+" : p < 0 ? "−" : ""}%${Math.abs(p)}`;
}

function SimulationView({
  cases,
  meta,
}: {
  cases: SimulationCase[];
  meta: DataMeta;
}) {
  const usable = cases.filter(canRenderSimulation);
  const [index, setIndex] = useState(0);
  const active = usable[Math.min(index, usable.length - 1)];
  const suppressed = cases.length - usable.length;

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            Executive Simulator
            {/* Gerçek motor yoksa etiket görünür — kaynağı zarf söyler. */}
            {meta.source === "mock" && (
              <Badge variant="warning" size="sm">
                SİMÜLASYON — MOCK
              </Badge>
            )}
          </span>
        }
        description="Katman 4 — senaryolar hazır gelir; hiçbir sayı burada hesaplanmaz"
      />

      <CardBody>
        {active ? (
          <div className="flex flex-col gap-4">
            {usable.length > 1 && (
              <SegmentedControl
                label="Senaryo"
                value={String(index)}
                onChange={(v) => setIndex(Number(v))}
                options={usable.map((c, i) => ({
                  value: String(i),
                  label: caseLabel(c),
                }))}
              />
            )}

            <p className="text-sm text-content-secondary">
              Parametre:{" "}
              <span className="text-content">{active.request.parameter}</span> ·
              değişim <span className="odin-num">{caseLabel(active)}</span>
            </p>

            <dl className="flex flex-col">
              {active.result.scenarios.map((s) => (
                <div
                  key={s.metric}
                  className="flex items-baseline justify-between gap-4 border-b border-line-subtle py-2 last:border-b-0"
                >
                  <dt className="min-w-0 truncate text-sm text-content-secondary">
                    {s.metric}
                  </dt>
                  {/* Beklenen sonuç METİNDİR (sözleşme: `expectedChange: string`).
                      Sayıya çevirip yeniden biçimlemek, olmayan bir kesinlik
                      iddia etmek olurdu. */}
                  <dd className="odin-num shrink-0 text-content">{s.expectedChange}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap items-center gap-2">
              <Caption>Simülasyon güveni</Caption>
              <ConfidenceBadge value={active.result.confidence} />
            </div>

            {/* assumptions[] HER ZAMAN görünür — açılır bölümde değil. */}
            <div className="rounded-sm border border-line-subtle p-3">
              <p className="text-xs uppercase tracking-wide text-content-tertiary">
                Model neye dayandı
              </p>
              <ul className="mt-2 list-disc pl-4 text-sm text-content-secondary">
                {active.result.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>

            {suppressed > 0 && (
              <Text size="sm" tone="tertiary">
                {suppressed} senaryo varsayımları bildirilmediği için gösterilmiyor.
              </Text>
            )}
          </div>
        ) : (
          <EmptyState
            title="Simülasyon sonucu yok"
            description="ODIN'de tahmin/simülasyon motoru henüz yok (13-backend-recommendations.md §6); varsayımları bildirilen hazır bir senaryo da gelmedi."
            suggestion="Motor gelene kadar bu bölüm bilerek boştur — uydurulmuş bir senaryo, hiç senaryo olmamasından kötüdür."
          />
        )}
      </CardBody>

      <CardFooter>
        <TrustSignal meta={meta} />
      </CardFooter>
    </Card>
  );
}

export function SimulationPanel({
  env,
}: {
  env: DataEnvelope<SimulationCase[]> | null | undefined;
}) {
  return (
    <DataGuard env={env} reason="Simülasyon verisi yok">
      {(cases, meta) => <SimulationView cases={cases} meta={meta} />}
    </DataGuard>
  );
}
