/**
 * Veri yok göstergesi — anti-fake kuralının en küçük parçası.
 * CLAUDE.md §2: veri yoksa "veri yok" gösterilir, placeholder değil.
 *
 * Sahte sayı, sahte durum, sahte zaman ÜRETİLMEZ. Kaynağı olmayan her alan
 * bu bileşeni kullanır.
 */
export function NoData({ reason }: { reason?: string }) {
  /* Varsayılan SEBEP İDDİA ETMEZ. Eski `title` varsayılanı "Veri kaynağı
     henüz bağlı değil" idi — oysa veri ölçülüp de yok olabilir; sebebi
     bilmeden söylemek, uydurmanın küçük hâlidir. Gerekçe bilinen yerde
     çağıran `reason` geçer; bilinmiyorsa yalnız "veri yok" denir. */
  const metin = reason ?? "Veri yok";
  return (
    /**
     * GEREKÇE EKRAN OKUYUCUYA ULAŞIR — UI-ADR-156.
     *
     * Önce `<span title aria-label>` idi ve gerekçe HİÇ DUYULMUYORDU:
     * `aria-label` "generic" rolde (adsız bir `<span>`) ARIA'ya göre
     * geçersizdir ve yok sayılır; `title` ise yalnız FARE üstünde çıkar.
     * Yani klavye ve ekran okuyucu kullanıcısı her yerde sadece "—"
     * duyuyordu — bu bileşen tüm repoda gerekçe taşıyıcısıdır ve
     * "neden veri yok" sorusunun tek cevabıdır.
     *
     * Düzeltme TEK KELİME: `role="note"`. `note` adlandırmayı DESTEKLEYEN
     * bir roldür, `generic` desteklemez — aynı `aria-label` artık geçerli
     * ve duyuluyor. Rolü eklemek, metni ikinci kez `sr-only` ile basmaktan
     * iyidir: o çözüm gerekçeyi ÇİFT okuturdu.
     */
    <span
      className="odin-num text-content-tertiary"
      role="note"
      title={metin}
      aria-label={metin}
    >
      —
    </span>
  );
}
