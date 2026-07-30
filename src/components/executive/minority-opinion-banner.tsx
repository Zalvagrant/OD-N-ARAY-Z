/**
 * MinorityOpinionBanner — azınlık görüşleri. 07-ai-directors.md §6, UI-ADR-100.
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
 * SÖZLEŞME (09b §1): ODIN `minority_opinions` bir DÜZ METİN LİSTESİDİR —
 * "üye: seçenek — gerekçe". Eski tekil `DirectorOpinion` nesnesi UI
 * uydurmasıydı; üye başına güven skoru kayıtta yok, o yüzden rozet de yok.
 */

import { Text } from "@/components/ui/typography";

export function MinorityOpinionBanner({
  opinions,
  className = "",
}: {
  /** ODIN `minority_opinions` — "üye: seçenek — gerekçe" metinleri. */
  opinions: string[] | null | undefined;
  className?: string;
}) {
  /* Azınlık görüşü yoksa kutu da yok — boş "görüş yok" kutusu gürültüdür. */
  const list = (opinions ?? []).filter((o) => o.trim().length > 0);
  if (list.length === 0) return null;

  return (
    <aside
      className={`rounded-sm border border-line bg-bg-secondary p-3 ${className}`}
      aria-label="Azınlık görüşü"
    >
      <p className="flex flex-wrap items-center gap-2 text-xs text-content-tertiary">
        <span aria-hidden="true">◂</span>
        <span className="uppercase tracking-wide">
          Azınlık görüşü{list.length > 1 ? ` (${list.length})` : ""}
        </span>
      </p>
      <ul className="mt-1 flex flex-col gap-1">
        {list.map((o) => (
          <li key={o}>
            <Text size="sm" tone="secondary">
              {o}
            </Text>
          </li>
        ))}
      </ul>
    </aside>
  );
}
