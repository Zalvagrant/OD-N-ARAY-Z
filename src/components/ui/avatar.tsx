/**
 * Avatar — 10-component-library.md §10 Primitives.
 *
 * Anti-fake (CLAUDE.md §2): görsel yoksa RASTGELE bir avatar üretilmez.
 * İsmin baş harfleri gösterilir; isim de yoksa nötr bir kişi ikonu.
 * Durum noktası (`status`) YALNIZCA gerçek bir durum verildiğinde çizilir.
 *
 * Desteklenmeyen durumlar: Pressed / Loading / Error / Success / ReadOnly —
 * Avatar etkileşimli değildir ve kendi veri çağrısını yapmaz.
 */

import { User } from "lucide-react";

const SIZE = {
  xs: "h-5 w-5 text-xs",
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
  xl: "h-12 w-12 text-md",
} as const;

const STATUS = {
  online: { cls: "bg-success", label: "çevrimiçi" },
  offline: { cls: "bg-icon-muted", label: "çevrimdışı" },
  busy: { cls: "bg-warning", label: "meşgul" },
} as const;

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase("tr") ?? "")
    .join("");
}

export function Avatar({
  name,
  src,
  size = "md",
  status,
}: {
  name?: string;
  src?: string;
  size?: keyof typeof SIZE;
  /** Gerçek bir durum verisi yoksa VERİLMEZ — nokta çizilmez. */
  status?: keyof typeof STATUS;
}) {
  const label = name ?? "Bilinmeyen kullanıcı";

  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={`inline-flex items-center justify-center overflow-hidden rounded-full border border-line bg-surface-elevated font-medium text-content-secondary ${SIZE[size]}`}
        title={label}
      >
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element -- avatar kaynağı
             harici olabilir; next/image optimizasyonu localhost dışına çıkar. */
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : name ? (
          <span aria-hidden>{initials(name)}</span>
        ) : (
          <User className="h-1/2 w-1/2 text-icon-muted" aria-hidden />
        )}
        {!src && <span className="sr-only">{label}</span>}
      </span>

      {status && (
        <>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-bg ${STATUS[status].cls}`}
            aria-hidden
          />
          <span className="sr-only">{STATUS[status].label}</span>
        </>
      )}
    </span>
  );
}
