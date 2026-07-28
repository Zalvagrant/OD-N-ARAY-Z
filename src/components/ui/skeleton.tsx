/**
 * Skeleton — 12-motion-system.md §7, 10-component-library.md §11
 *
 * KURAL: Skeleton gri kutu değildir, GERÇEK YERLEŞİMİ temsil eder.
 * İçerik geldiğinde hiçbir şey yerinden oynamaz (layout shift = 0).
 * Bu yüzden her skeleton, yerine geçtiği bileşenle AYNI yükseklik
 * sınıflarını kullanır.
 *
 * `prefers-reduced-motion` altında shimmer durur, sabit gri kalır
 * (tokens.css §REDUCED MOTION) — bilgi kaybolmaz, yalnızca hareket kalkar.
 *
 * Desteklenmeyen durumlar: Skeleton'un kendisi zaten "Loading" durumudur;
 * diğer 10 durum tanım gereği N/A.
 */

export function Skeleton({
  className = "",
  rounded = "rounded-sm",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`odin-shimmer bg-surface-elevated ${rounded} ${className}`}
      aria-hidden
    />
  );
}

/** Metin bloğu iskeleti — son satır kısadır, gerçek paragraf gibi. */
export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/**
 * Bir yükleme bölgesini erişilebilir hale getirir.
 * Ekran okuyucu "Yükleniyor" duyar; skeleton'ın kendisi `aria-hidden`.
 */
export function SkeletonRegion({
  label = "Yükleniyor",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
