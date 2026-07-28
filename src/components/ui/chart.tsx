"use client";

/**
 * Chart temel seti — Line · Area · Bar (UI-ADR-087)
 *
 * Elle yazılmış SVG. Grafik kütüphanesi EKLENMEDİ: "executive glance"
 * grafikleri için gereksiz bağımlılık ve API yüzeyi. Tüm renkler
 * chart token'larından (`stroke-chart-*`, `fill-chart-*`) gelir.
 *
 * Anti-fake (CLAUDE.md §2):
 *   - Veri yoksa sıfır çizgisi çizilmez, EmptyState gösterilir.
 *   - Eksik nokta (null) interpolasyonla DOLDURULMAZ, çizgi kesilir.
 *
 * Hareket: varsayılan olarak animasyon YOK. Grafik bir durum göstergesidir;
 * çizginin "büyümesi" dekoratif olurdu (12-...md §1).
 *
 * Klavye: ← → ile veri noktaları gezilir, okunan değer `aria-live` ile
 * duyurulur. Fare olmadan da her nokta okunabilir.
 *
 * Desteklenmeyen durumlar: Pressed / Disabled / ReadOnly / Success —
 * grafik bir kontrol değil, bir görüntüdür.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getDomain,
  nearestIndex,
  niceTicks,
  toAreaPath,
  toLinePath,
  toPoints,
  toY,
} from "@/lib/chart/scale";
import { formatNumber, type NumFormat } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

export interface ChartDatum {
  label: string;
  /** Ölçülemeyen nokta null'dır — 0 ile karıştırılmaz. */
  value: number | null;
}

const PAD = { left: 48, right: 8, top: 8, bottom: 20 };

interface ChartProps {
  data: ChartDatum[];
  /** Erişilebilir ad — ne ölçtüğünü söyler. */
  label: string;
  height?: number;
  format?: NumFormat;
  currency?: string;
  /** Taban sıfırdan başlasın mı? Bar grafikte varsayılan açık. */
  includeZero?: boolean;
  loading?: boolean;
  error?: { what: string; why: string; impact: string; fix: string };
  onRetry?: () => void;
  emptyDescription?: string;
}

/** Container genişliğini ölçer — viewBox esnetmesi çizgi kalınlığını bozardı. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* İlk ölçüm doğrudan okunur: ResizeObserver'ın ilk çağrısı ancak bir
       çizim fırsatı doğunca gelir; arka plandaki bir sekmede bu hiç olmaz ve
       grafik boş kalırdı. */
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

function ChartFrame({
  data,
  label,
  height = 160,
  format = "plain",
  currency,
  includeZero = false,
  loading,
  error,
  onRetry,
  emptyDescription = "Bu metrik için henüz veri gelmedi.",
  render,
}: ChartProps & {
  render: (ctx: {
    width: number;
    innerW: number;
    innerH: number;
    domain: [number, number];
    points: ReturnType<typeof toPoints>;
    active: number | null;
  }) => React.ReactNode;
}) {
  const { ref, width } = useWidth();
  const [active, setActive] = useState<number | null>(null);

  const values = useMemo(() => data.map((d) => d.value), [data]);
  const domain = useMemo(
    () => getDomain(values.filter((v): v is number => v !== null), { includeZero }),
    [values, includeZero]
  );

  const innerW = Math.max(width - PAD.left - PAD.right, 0);
  const innerH = Math.max(height - PAD.top - PAD.bottom, 0);
  const points = useMemo(
    () => toPoints(values, innerW, innerH, domain),
    [values, innerW, innerH, domain]
  );
  const ticks = useMemo(() => niceTicks(domain, 3), [domain]);

  if (error) return <ErrorState {...error} onRetry={onRetry} />;

  if (loading) {
    return (
      <SkeletonRegion label={`${label} yükleniyor`}>
        {/* Skeleton grafiğin GERÇEK yüksekliğini kaplar — layout shift yok.
            (+20: değer okuma satırı) */}
        <div style={{ height: height + 20 }}>
          <Skeleton className="h-full w-full" rounded="rounded-md" />
        </div>
      </SkeletonRegion>
    );
  }

  const hasData = values.some((v) => v !== null);
  if (data.length === 0 || !hasData) {
    return (
      <EmptyState
        title={label}
        description={emptyDescription}
        suggestion="Veri kaynağı bağlandığında grafik otomatik çizilir."
      />
    );
  }

  const activeDatum = active === null ? null : data[active];

  const move = (dir: 1 | -1) => {
    const n = data.length;
    setActive((a) => (a === null ? 0 : (a + dir + n) % n));
  };

  return (
    <div ref={ref} className="w-full">
      {/* Okunan değer — fare ve klavye için aynı satır. */}
      <div className="flex h-5 items-center justify-end gap-2 text-xs" aria-live="polite">
        {activeDatum && (
          <>
            <span className="text-content-secondary">{activeDatum.label}</span>
            <span className="odin-num text-content">
              {activeDatum.value === null
                ? "—"
                : formatNumber(activeDatum.value, { format, currency })}
            </span>
          </>
        )}
      </div>

      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={label}
          tabIndex={0}
          className="block outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-line-focus"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              move(1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              move(-1);
            } else if (e.key === "Escape") {
              setActive(null);
            }
          }}
          onPointerMove={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            setActive(nearestIndex(points, e.clientX - box.left - PAD.left));
          }}
          onPointerLeave={() => setActive(null)}
        >
          {/* Izgara + değer ekseni */}
          <g>
            {ticks.map((t) => {
              const y = PAD.top + toY(t, domain, innerH);
              return (
                <g key={t}>
                  <line
                    x1={PAD.left}
                    x2={PAD.left + innerW}
                    y1={y}
                    y2={y}
                    className="stroke-chart-grid"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD.left - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-chart-axis text-xs [font-variant-numeric:tabular-nums]"
                  >
                    {formatNumber(t, { format: "compact" })}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Kategori ekseni — ilk ve son etiket (arası kalabalık yapar) */}
          <text
            x={PAD.left}
            y={height - 4}
            className="fill-chart-axis text-xs"
          >
            {data[0]?.label}
          </text>
          <text
            x={PAD.left + innerW}
            y={height - 4}
            textAnchor="end"
            className="fill-chart-axis text-xs"
          >
            {data[data.length - 1]?.label}
          </text>

          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {render({ width, innerW, innerH, domain, points, active })}
          </g>
        </svg>
      )}
    </div>
  );
}

/* ── Line ──────────────────────────────────────────────────────────────── */

export function LineChart(props: ChartProps) {
  return (
    <ChartFrame
      {...props}
      render={({ points, active, innerH }) => (
        <>
          <path
            d={toLinePath(points)}
            className="fill-none stroke-chart-line"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <Crosshair points={points} active={active} innerH={innerH} />
        </>
      )}
    />
  );
}

/* ── Area ──────────────────────────────────────────────────────────────── */

export function AreaChart(props: ChartProps) {
  return (
    <ChartFrame
      {...props}
      render={({ points, active, innerH }) => (
        <>
          <path d={toAreaPath(points, innerH)} className="fill-chart-area stroke-none" />
          <path
            d={toLinePath(points)}
            className="fill-none stroke-chart-line"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <Crosshair points={points} active={active} innerH={innerH} />
        </>
      )}
    />
  );
}

/* ── Bar ───────────────────────────────────────────────────────────────── */

export function BarChart({ includeZero = true, ...props }: ChartProps) {
  return (
    <ChartFrame
      {...props}
      includeZero={includeZero}
      render={({ points, innerW, innerH, domain, active }) => {
        const n = points.length;
        const slot = innerW / Math.max(n, 1);
        const barW = Math.max(slot * 0.6, 1);
        const zeroY = toY(Math.max(domain[0], 0), domain, innerH);

        return (
          <>
            {points.map((p, i) => {
              if (!p) return null;
              const x = slot * i + (slot - barW) / 2;
              const top = Math.min(p.y, zeroY);
              const h = Math.max(Math.abs(zeroY - p.y), 1);
              return (
                <rect
                  key={i}
                  x={x}
                  y={top}
                  width={barW}
                  height={h}
                  rx={2}
                  className={i === active ? "fill-chart-2" : "fill-chart-1"}
                />
              );
            })}
          </>
        );
      }}
    />
  );
}

/* ── Crosshair ─────────────────────────────────────────────────────────── */

function Crosshair({
  points,
  active,
  innerH,
}: {
  points: ReturnType<typeof toPoints>;
  active: number | null;
  innerH: number;
}) {
  const p = active === null ? null : points[active];
  if (!p) return null;
  return (
    <g aria-hidden>
      <line
        x1={p.x}
        x2={p.x}
        y1={0}
        y2={innerH}
        className="stroke-chart-grid"
        strokeWidth={1}
      />
      <circle cx={p.x} cy={p.y} r={3} className="fill-chart-line" />
    </g>
  );
}
