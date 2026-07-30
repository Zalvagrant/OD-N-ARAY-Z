"use client";

/**
 * Mock verinin ekrana giriş kapısı — UI-ADR-094.
 *
 * NEDEN SUNUCUDA `null`: mock kayıtların `lastUpdated` alanı `Date.now()`
 * ile üretilir. Sunucuda üretilirse istemcideki ilk render başka bir değer
 * hesaplar → hydration mismatch. `getServerSnapshot` daima `null` döner;
 * sunucu HTML'i bu yüzden GERÇEKTEN yükleme durumunu basar.
 *
 * ÜRETİM YERİ (S1-S5 denetimi, yazılımcılar — UI-ADR-099): eski sürüm
 * `getSnapshot` İÇİNDE cache dolduruyordu. `getSnapshot` saf olmak
 * zorundadır; render sırasında yazmak React 19 concurrent modda tearing
 * üretebilir. Store artık MODÜL SEVİYESİNDE yaşar (üretici fonksiyona
 * WeakMap ile bağlı); okuma/yazma/abonelik modül fonksiyonlarındadır,
 * bileşen render'ı hiçbir store nesnesini ne okurken mutasyona uğratır ne
 * de hook'lara geçirir. Yan fayda: aynı üreticiyi kullanan bileşenler tek
 * snapshot'ı paylaşır.
 *
 * Yapay gecikme (setTimeout) EKLENMEDİ: sahte veri kadar sahte davranış da
 * yasaktır. Mock yereldir, ilk effect tick'inde gelir.
 *
 * FAIL-CLOSED (S7 · UI-ADR-115) bu saf store'un ÜSTÜNE bindirilmiştir:
 * iki karar da korunur, biri diğerinin yerine geçmez.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { IS_MOCK } from "@/lib/data/mode";

export interface MockState<T> {
  /** Sunucuda ve ilk hydration render'ında null — yükleme durumu budur. */
  data: T | null;
  loading: boolean;
  /** Zaman damgalarını tazeleyerek yeniden üretir (Quick Action). */
  reload: () => void;
}

interface Store {
  snapshot: unknown;
  listeners: Set<() => void>;
}

/* ---- React dışı durum: üretici fonksiyon → store ---- */

const STORES = new WeakMap<() => unknown, Store>();

function storeFor(build: () => unknown): Store {
  let s = STORES.get(build);
  if (!s) {
    s = { snapshot: null, listeners: new Set() };
    STORES.set(build, s);
  }
  return s;
}

function subscribeTo(build: () => unknown, listener: () => void): () => void {
  const s = storeFor(build);
  s.listeners.add(listener);
  return () => s.listeners.delete(listener);
}

function readSnapshot(build: () => unknown): unknown {
  return storeFor(build).snapshot; // saf okuma — yan etki YOK
}

function fillStore(build: () => unknown, force: boolean): void {
  const s = storeFor(build);
  if (!force && s.snapshot !== null) return;
  s.snapshot = build();
  s.listeners.forEach((l) => l());
}

/**
 * FAIL-CLOSED KARARI — S7 · UI-ADR-115 (meclis kapanış koşulu).
 *
 * Gerçek modda mock kancası VERİ VERMEZ. S8'de anahtar çevrildiğinde henüz
 * yeni boruya taşınmamış bölümler, aksi hâlde mock göstermeye sessizce
 * devam ederdi: aynı ekranda gerçek ve sahte sayılar yan yana durur ve
 * hangisinin hangisi olduğu GÖRÜNMEZDİ. Sahte verinin en tehlikeli hâli
 * budur — yanında gerçeği durduğu için inandırıcıdır.
 *
 * `loading` false döner: sonsuz iskelet bir cevap değildir. Bölümler
 * `data === null` yolundan zaten "veri yok" gerekçesini basıyor.
 *
 * Kancadan AYRI bir saf fonksiyon çünkü kritik olan dal budur ve
 * doğrulanması için tarayıcı ya da renderer gerekmemeli (meclis şartı).
 */
export function mockGate<T>(isMock: boolean, data: T | null): MockState<T> {
  if (!isMock) return { data: null, loading: false, reload: () => {} };
  return { data, loading: data === null, reload: () => {} };
}

/**
 * @param build Modül seviyesinde tanımlı, argümansız üretici. Sonuç effect
 *              içinde üretilir ve `reload`a kadar aynı referans döner.
 */
export function useMockData<T>(build: () => T): MockState<T> {
  const subscribe = useCallback(
    (l: () => void) => subscribeTo(build, l),
    [build]
  );

  const data = useSyncExternalStore(
    subscribe,
    () => readSnapshot(build) as T | null,
    () => null
  );

  /* Üretim render'da değil effect'te: ilk mount'ta bir kez doldurulur.
     Gerçek modda hiç üretilmez — fail-closed (UI-ADR-115). */
  useEffect(() => {
    if (!IS_MOCK) return;
    fillStore(build, false);
  }, [build]);

  const reload = useCallback(() => fillStore(build, true), [build]);

  return { ...mockGate(IS_MOCK, data), reload };
}
