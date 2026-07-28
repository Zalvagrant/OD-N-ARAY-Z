/**
 * Veri yok göstergesi — anti-fake kuralının en küçük parçası.
 * CLAUDE.md §2: veri yoksa "veri yok" gösterilir, placeholder değil.
 *
 * Sahte sayı, sahte durum, sahte zaman ÜRETİLMEZ. Kaynağı olmayan her alan
 * bu bileşeni kullanır.
 */
export function NoData({ reason }: { reason?: string }) {
  return (
    <span
      className="odin-num text-content-tertiary"
      title={reason ?? "Veri kaynağı henüz bağlı değil"}
      aria-label={reason ?? "Veri yok"}
    >
      —
    </span>
  );
}
