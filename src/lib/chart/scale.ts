/**
 * Chart ölçekleme — saf fonksiyonlar, DOM'suz, test edilebilir.
 *
 * Neden kütüphane yok (UI-ADR-087): "executive glance" grafikleri için
 * Recharts'ın getirdiği bağımlılık ve API yüzeyi gereksiz. Zoom, brush,
 * çoklu seri senkronizasyonu backlog'a girerse karar yeniden değerlendirilir.
 *
 * Anti-fake: veri yoksa fonksiyonlar boş sonuç döner — 0 çizgisi UYDURULMAZ.
 */

export interface Point {
  x: number;
  y: number;
}

/** Değer aralığı. Tüm değerler eşitse sıfır yükseklikli alan üretmemek için genişletilir. */
export function getDomain(
  values: number[],
  { includeZero = false }: { includeZero?: boolean } = {}
): [number, number] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [0, 0];

  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  if (min === max) {
    const pad = Math.abs(min) || 1;
    return [min - pad, max + pad];
  }
  return [min, max];
}

/** Değeri [0..height] piksel uzayına çevirir. SVG'de y aşağı doğru büyür. */
export function toY(
  value: number,
  [min, max]: [number, number],
  height: number
): number {
  if (max === min) return height / 2;
  return height - ((value - min) / (max - min)) * height;
}

/** Seriyi noktalara çevirir. Sonlu olmayan değerler ATLANIR (boşluk kalır). */
export function toPoints(
  values: (number | null)[],
  width: number,
  height: number,
  domain: [number, number]
): (Point | null)[] {
  const n = values.length;
  if (n === 0) return [];
  const step = n === 1 ? 0 : width / (n - 1);
  return values.map((v, i) =>
    v === null || !Number.isFinite(v)
      ? null
      : { x: n === 1 ? width / 2 : i * step, y: toY(v, domain, height) }
  );
}

/** Kesikli seri: null'lar yeni bir alt yol başlatır — sahte ara değer çizilmez. */
export function toLinePath(points: (Point | null)[]): string {
  let d = "";
  let pen = false;
  for (const p of points) {
    if (!p) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${round(p.x)} ${round(p.y)} `;
    pen = true;
  }
  return d.trim();
}

/** Alan yolu — yalnızca kesintisiz ilk parçayı doldurur. */
export function toAreaPath(points: (Point | null)[], baselineY: number): string {
  const solid: Point[] = [];
  for (const p of points) {
    if (!p) break;
    solid.push(p);
  }
  if (solid.length < 2) return "";
  const first = solid[0]!;
  const last = solid[solid.length - 1]!;
  return `${toLinePath(solid)} L${round(last.x)} ${round(baselineY)} L${round(
    first.x
  )} ${round(baselineY)} Z`;
}

/** Okunabilir eksen değerleri (1, 2, 5 × 10^n adımları). */
export function niceTicks(
  [min, max]: [number, number],
  count = 4
): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [];
  const raw = (max - min) / Math.max(count, 1);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / magnitude;
  /* 1 · 2 · 2.5 · 5 · 10 merdiveni — insan bu adımları hızlı okur. */
  const step = ([1, 2, 2.5, 5, 10].find((m) => norm <= m) ?? 10) * magnitude;
  const start = Math.ceil(min / step) * step;

  const ticks: number[] = [];
  for (let t = start; t <= max + step / 1000; t += step) {
    ticks.push(Number(t.toFixed(10)));
  }
  return ticks;
}

/** İmleç x konumuna en yakın veri noktasının indeksi — tooltip/crosshair için. */
export function nearestIndex(points: (Point | null)[], x: number): number | null {
  let best: number | null = null;
  let bestDist = Infinity;
  points.forEach((p, i) => {
    if (!p) return;
    const d = Math.abs(p.x - x);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
