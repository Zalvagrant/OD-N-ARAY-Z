/**
 * Güncelleme taşıması — S7 D7.9. ALTYAPI; bağlantı S8'de.
 *
 * KARAR (meclis 5/5, UI-ADR-114): SSE/WS İSTEMCİSİ YAZILMADI. ODIN'in
 * sunucusu (`odin/cockpit.py`, stdlib `ThreadingHTTPServer`) bugün yalnız
 * üç GET ve bir POST veriyor; akış uç noktası YOK. Olmayan bir uç noktaya
 * istemci yazmak sahte entegrasyondur — derlenir, testi bile geçer, ama
 * hiçbir şeye bağlı değildir.
 *
 * Onun yerine SEAM tanımlandı: ekranlar taşımayı bilmez. Bugün altında
 * `pollingTransport` var; S8'de ODIN akış verirse `sseTransport` yazılıp
 * tek satırda değiştirilir, ekranların hiçbiri değişmez.
 */

export interface UpdateTransport {
  /**
   * `key` için güncelleme dinler; her sinyalde `onInvalidate` çağrılır.
   * Dönen fonksiyon aboneliği kapatır.
   */
  subscribe(key: string, onInvalidate: () => void): () => void;
}

/**
 * Bugünün uygulaması: sabit aralıklarla "yenile" der. Veri TAŞIMAZ —
 * yalnız geçersiz kılar; getirme işi tek kapıdan (`useOdinQuery`) geçmeye
 * devam eder.
 */
export function pollingTransport(intervalMs: number): UpdateTransport {
  return {
    subscribe(_key, onInvalidate) {
      /* Sekme arka plandayken ya da çevrimdışıyken tetiklemez (meclis
         bulgusu): görünmeyen bir ekranı yenilemek pil ve kota harcar,
         çevrimdışı yenileme ise her aralıkta bir hata üretip elde kalan
         veriyi şüpheli gösterir. */
      const id = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        if (typeof navigator !== "undefined" && navigator.onLine === false) return;
        onInvalidate();
      }, intervalMs);
      return () => clearInterval(id);
    },
  };
}
