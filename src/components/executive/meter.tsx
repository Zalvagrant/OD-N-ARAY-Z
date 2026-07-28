/**
 * Meter — 0–100 bir skorun segmentli görsel karşılığı.
 *
 * Executive katmanının iç yardımcısıdır (public bileşen envanterine
 * girmez, 10b-executive-components.md §0.3'te kayıtlı).
 *
 * NEDEN SEGMENT, NEDEN İLERLEME ÇUBUĞU DEĞİL: sürekli bir çubuk dinamik
 * genişlik ister → inline `style` → token kuralının ihlali. 10 segment
 * sabit sınıflarla çizilir, ayrıca renk körü için sayılabilir bir biçimdir.
 *
 * Anti-fake: değer üretilmemişse hiçbir segment doldurulmaz — NoData çıkar.
 */

import { NoData } from "@/components/ui/no-data";

const SEGMENTS = 10;

const TONE = {
  ai: "bg-ai",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-icon-muted",
} as const;

export type MeterTone = keyof typeof TONE;

export function Meter({
  value,
  label,
  tone = "ai",
  noDataReason,
}: {
  /** 0–100 */
  value: number | null | undefined;
  /** Erişilebilir ad — zorunlu. */
  label: string;
  tone?: MeterTone;
  noDataReason?: string;
}) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <NoData reason={noDataReason ?? `${label}: ölçülmedi`} />;
  }

  const clamped = Math.min(100, Math.max(0, value));
  const filled = Math.round((clamped / 100) * SEGMENTS);

  return (
    <span
      className="inline-flex items-center gap-1"
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-1 rounded-xs ${i < filled ? TONE[tone] : "bg-line"}`}
          />
        ))}
      </span>
    </span>
  );
}
