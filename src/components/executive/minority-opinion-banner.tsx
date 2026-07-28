/**
 * MinorityOpinionBanner — azınlık görüşü. 07-ai-directors.md §6.
 *
 * İKİ KURAL, BİRBİRİYLE ÇEKİŞİR VE İKİSİ DE ZORUNLUDUR:
 *
 * 1. ASLA katlanıp gizlenmez. Bu yüzden burada `open/collapsed` prop'u
 *    YOKTUR — teknik olarak gizlenebilir hâle getirilmemiştir. "Bazen
 *    azınlık haklı çıkar."
 * 2. Görsel olarak BASTIRILMIŞTIR. Nötr ton kullanılır, amber/turuncu
 *    DEĞİL: azınlık görüşü bir uyarı değildir, bir bakış açısıdır. Amber
 *    ton onu her kararda alarm gibi gösterir ve alarm körlüğü yaratır.
 *
 * Bu yüzden dokümandaki `⚠` glyph'i yerine nötr `◂` kullanılır.
 */

import type { DirectorOpinion } from "@/types/executive";
import { Text } from "@/components/ui/typography";
import { ConfidenceBadge } from "./confidence-badge";

export function MinorityOpinionBanner({
  opinion,
  className = "",
}: {
  opinion: DirectorOpinion | null | undefined;
  className?: string;
}) {
  /* Azınlık görüşü yoksa kutu da yok — boş "görüş yok" kutusu gürültüdür. */
  if (!opinion || !opinion.argument) return null;

  return (
    <aside
      className={`rounded-sm border border-line bg-bg-secondary p-3 ${className}`}
      aria-label="Azınlık görüşü"
    >
      <p className="flex flex-wrap items-center gap-2 text-xs text-content-tertiary">
        <span aria-hidden="true">◂</span>
        <span className="uppercase tracking-wide">Azınlık görüşü</span>
        <span className="text-content-secondary">{opinion.directorId}</span>
        <ConfidenceBadge value={opinion.confidence} size="xs" />
      </p>
      <Text size="sm" tone="secondary" className="mt-1">
        {opinion.argument}
      </Text>
    </aside>
  );
}
