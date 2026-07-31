"use client";

/**
 * CouncilView + ConsensusIndicator — 07-ai-directors.md §4–§6, UI-ADR-100.
 *
 * "Çoğu AI sistemi sana cevabı gösterir. ODIN sana düşünce sürecini
 * gösterir — ama sadece istediğinde." Council bir ekran değil, karar
 * kartından açılan bir bölümdür.
 *
 * SÖZLEŞME DÜZELTMESİ (UI-ADR-098 doğrulaması):
 *  - Consensus/disagreement/minority KARARIN değil ÖNERİNİN alanlarıdır
 *    (ODIN recommendation zorunluları). Bileşen artık onları oradan okur.
 *  - ODIN'de `disagreement_score = 100 − consensus_score` (consensus.py) —
 *    TÜRETİLMİŞ tek ölçümdür. Eski "ikisi ayrı ölçümdür" iddiası yanlıştı;
 *    ikisi de kayıttan okunur ama ayrı metrik gibi SUNULMAZ.
 *  - Director pozisyon satırları ODIN karar şemasında SAKLANMAZ
 *    (not_exposed, 09b §9) — panel görüşleri `minority_opinions` düz metin
 *    listesi dışında kayda geçmiyor. Görüş satırı uydurulmaz; bunun yerine
 *    azınlık görüşleri listelenir ve saklanmama gerçeği açıkça yazılır.
 *  - Evidence Quality / Financial Risk / Execution Complexity göstergeleri
 *    kaldırıldı: karşılıkları yok, "ölçülmedi" bile fazlaydı — ölçülmesi
 *    planlanmayan gösterge çizilmez (UI-ADR-071 ilkesi).
 */

import type { AIRecommendation } from "@/types/executive";
import { Text } from "@/components/ui/typography";
import { Meter } from "./meter";

export function ConsensusIndicator({
  consensus,
  disagreement,
}: {
  consensus: number | null | undefined;
  /** ODIN'de 100 − consensus. Ayrı ölçüm DEĞİLDİR; kayıttan okunur. */
  disagreement: number | null | undefined;
}) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2 [&>div]:min-w-0">
      <div>
        <dt className="text-xs text-content-tertiary">Consensus</dt>
        <dd className="mt-1 flex items-center gap-2">
          <Meter value={consensus} label="Uzlaşma" tone="success" noDataReason="Uzlaşma ölçülmedi" />
          {Number.isFinite(consensus) && (
            <span className="odin-num">{Math.round(consensus!)}%</span>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-content-tertiary">
          Disagreement
          <span className="ml-1 normal-case">(= 100 − consensus)</span>
        </dt>
        <dd className="mt-1 flex items-center gap-2">
          <Meter
            value={disagreement}
            label="Anlaşmazlık"
            tone="warning"
            noDataReason="Anlaşmazlık ölçülmedi"
          />
          {Number.isFinite(disagreement) && (
            <span className="odin-num">{Math.round(disagreement!)}%</span>
          )}
        </dd>
      </div>
    </dl>
  );
}

/**
 * Önerinin kurul kısmı. Zarf doğrulaması çağıranda (DecisionCard) yapılır;
 * bu bileşen kartın içinde yaşar, tek başına bir veri bileşeni değildir.
 */
export function CouncilView({ recommendation }: { recommendation: AIRecommendation }) {
  const minority = recommendation.minorityOpinions ?? [];

  return (
    <section aria-label="Executive Council" className="flex flex-col gap-3">
      <ConsensusIndicator
        consensus={recommendation.consensusScore}
        disagreement={recommendation.disagreementScore}
      />

      {minority.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-wide text-content-tertiary">
            Azınlık görüşleri
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {minority.map((m) => (
              <li key={m} className="border-l-2 border-line pl-3">
                <Text size="sm" tone="secondary">
                  <span aria-hidden="true" className="mr-1 text-content-tertiary">
                    ◂
                  </span>
                  {m}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* "— uzlaşma tam" SİLİNDİ (kapanış denetimi). Bu cümle YOKLUKTAN
           bir ölçüm çıkarıyordu: bu dosyanın kendi başlığı Director
           pozisyonlarının ODIN şemasında SAKLANMADIĞINI (`not_exposed`)
           yazıyor — yani boş liste bu kaynağın VARSAYILAN hâlidir, bir
           mutabakat kanıtı değil. "Kimse itiraz kaydetmedi" ile "herkes
           aynı fikirde" ayrı şeylerdir; ikincisini iddia etmek uydurulmuş
           bir SAYI değil, uydurulmuş bir SONUÇTUR (CLAUDE.md §2). */
        <Text size="sm" tone="tertiary">
          Azınlık görüşü kaydedilmemiş.
        </Text>
      )}

      <Text size="sm" tone="tertiary">
        Tek tek Director pozisyonları karar kaydında saklanmaz (ODIN şeması);
        kalıcı olan uzlaşma skoru ve azınlık görüşleridir.
      </Text>
    </section>
  );
}
