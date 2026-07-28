/**
 * Sparkline — KPI kartının trend göstergesi (05-dashboard.md §4 Level 1).
 *
 * Eksen yok, ızgara yok, etiket yok. Tek işi: "yön ne?" sorusunu bir bakışta
 * cevaplamak. Değer okumak isteyen kartı açar (Level 2).
 *
 * Anti-fake: iki noktadan az veri varsa çizgi çizilmez — NoData gösterilir.
 * Tek noktalı bir "trend" trend değildir.
 *
 * Renk körü erişilebilirliği: yön yalnızca renkle değil, `aria-label`
 * içindeki metinle de verilir ("yükseliyor" / "düşüyor").
 *
 * Desteklenmeyen durumlar: tüm etkileşim durumları — Sparkline tıklanmaz,
 * odak almaz. Etkileşim gerekiyorsa LineChart kullanılır.
 */

import { getDomain, toLinePath, toPoints } from "@/lib/chart/scale";
import { NoData } from "@/components/ui/no-data";

const TONE = {
  positive: { cls: "stroke-chart-positive", word: "yükseliyor" },
  negative: { cls: "stroke-chart-negative", word: "düşüyor" },
  neutral: { cls: "stroke-chart-neutral", word: "yatay" },
} as const;

export function Sparkline({
  values,
  label,
  width = 96,
  height = 24,
  tone = "auto",
}: {
  values: (number | null)[];
  /** Neyin trendi — erişilebilir ad için zorunlu. */
  label: string;
  width?: number;
  height?: number;
  tone?: "auto" | keyof typeof TONE;
}) {
  const known = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (known.length < 2) {
    return <NoData reason={`${label}: trend için yeterli veri yok`} />;
  }

  const first = known[0]!;
  const last = known[known.length - 1]!;
  const resolved =
    tone !== "auto" ? tone : last > first ? "positive" : last < first ? "negative" : "neutral";

  const domain = getDomain(known);
  /* strokeWidth taşmasın diye üstten/alttan 1px pay bırakılır. */
  const points = toPoints(values, width - 2, height - 2, domain);

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={`${label} — ${TONE[resolved].word}`}
      className="block shrink-0"
    >
      <g transform="translate(1,1)">
        <path
          d={toLinePath(points)}
          className={`fill-none ${TONE[resolved].cls}`}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
