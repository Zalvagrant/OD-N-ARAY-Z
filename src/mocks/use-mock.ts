"use client";

/**
 * Mock verinin ekrana giriş kapısı — UI-ADR-094.
 *
 * NEDEN SUNUCUDA `null`: mock kayıtların `lastUpdated` alanı `Date.now()`
 * ile üretilir. Sunucuda üretilirse istemcideki ilk render başka bir değer
 * hesaplar → hydration mismatch. `getServerSnapshot` daima `null` döner;
 * sunucu HTML'i bu yüzden GERÇEKTEN yükleme durumunu basar. Skeleton sahte
 * bir gecikmeyle gösterilmez — gösterildiği an veri henüz yoktur.
 *
 * Yapay gecikme (setTimeout) EKLENMEDİ: sahte veri kadar sahte davranış da
 * yasaktır. Mock yereldir, anında gelir; yükleme durumu Storybook'ta ayrı
 * story olarak doğrulanır.
 */

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { IS_MOCK } from "@/lib/data/mode";

export interface MockState<T> {
  /** Sunucuda ve ilk hydration render'ında null — yükleme durumu budur. */
  data: T | null;
  loading: boolean;
  /** Zaman damgalarını tazeleyerek yeniden üretir (Quick Action). */
  reload: () => void;
}

const noopSubscribe = () => () => {};

/**
 * @param build Modül seviyesinde tanımlı, argümansız üretici. Her çağrıda
 *              yeni nesne döndürebilir; sonuç önbelleğe alınır.
 */
export function useMockData<T>(build: () => T): MockState<T> {
  const cache = useRef<T | null>(null);
  const [, bump] = useState(0);

  /*
   * FAIL-CLOSED — S7 · UI-ADR-115 (meclis kapanış koşulu).
   *
   * Gerçek modda bu kanca VERİ VERMEZ. S8'de anahtar çevrildiğinde henüz
   * yeni boruya taşınmamış bölümler, aksi hâlde mock göstermeye sessizce
   * devam ederdi: aynı ekranda gerçek ve sahte sayılar yan yana durur ve
   * hangisinin hangisi olduğu görünmezdi. Meclis kapanışı bu koşula bağladı.
   *
   * `loading` false döner — sonsuz iskelet bir cevap değildir; bölümler
   * `data === null` yolundan zaten "veri yok" gerekçesini basıyor.
   */
  const unavailable = !IS_MOCK;

  /* Mock dışarıdan değişmez; abonelik gerekmez. Yeniden üretim `reload`
     ile olur, bu yüzden subscribe modül seviyesinde sabit bir no-op'tur. */
  const getSnapshot = useCallback(() => {
    if (unavailable) return null;
    if (cache.current === null) cache.current = build();
    return cache.current;
  }, [build, unavailable]);

  const data = useSyncExternalStore(noopSubscribe, getSnapshot, () => null);

  const reload = useCallback(() => {
    cache.current = null;
    bump((n) => n + 1);
  }, []);

  return { data, loading: !unavailable && data === null, reload };
}
