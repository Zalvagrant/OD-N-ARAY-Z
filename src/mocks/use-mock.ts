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
/* Mutlak yol BİLEREK: gerçek mod derlemesinde paketleyici bu belirteci
   stub'a çözer (`next.config.ts` → turbopack.resolveAlias). Göreli
   "./registry" yazılırsa alias EŞLEŞMEZ ve mock chunk'ları çıktıda kalır —
   ölçülerek görüldü. */
import { loadMock, type MockKey, type MockMap } from "@/mocks/registry";

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

/* ---- React dışı durum: ANAHTAR → store ----
   Anahtar bazlı çünkü ekranlar artık üretici FONKSİYONU import etmiyor;
   ediyor olsalardı mock modülü üretim paketine geri girerdi (UI-ADR-123). */

const STORES = new Map<MockKey, Store>();

function storeFor(key: MockKey): Store {
  let s = STORES.get(key);
  if (!s) {
    s = { snapshot: null, listeners: new Set() };
    STORES.set(key, s);
  }
  return s;
}

function subscribeTo(key: MockKey, listener: () => void): () => void {
  const s = storeFor(key);
  s.listeners.add(listener);
  return () => s.listeners.delete(listener);
}

function readSnapshot(key: MockKey): unknown {
  return storeFor(key).snapshot; // saf okuma — yan etki YOK
}

/* Uçuştaki yüklemeler: aynı anahtar için ikinci bir istek YENİ bir dinamik
   import başlatmaz, mevcut sözü bekler (meclis bulgusu). Aynı mock'u iki
   bölüm kullandığında iki kez yükleme olurdu. */
const INFLIGHT = new Map<MockKey, Promise<void>>();

/**
 * Dışa açık YALNIZ tekilleştirme testi için (aşağıdaki INFLIGHT kuralı).
 *
 * `async` DEĞİL ve bu kasıtlı: `async` bir fonksiyon `return task` yaparken
 * sözü YENİ bir sözle sarmalar, uçuştaki sözün kimliği kaybolur ve ikinci
 * çağıran onu tanıyamaz. Testle yakalandı — tekilleştirme yazılmış ama
 * çalışmıyordu.
 */
export function fillStore(key: MockKey, force: boolean): Promise<void> {
  const s = storeFor(key);
  if (!force && s.snapshot !== null) return Promise.resolve();

  const running = INFLIGHT.get(key);
  if (running && !force) return running;

  const task: Promise<void> = (async () => {
    /* Gerçek modda `loadMock` daima null döner (fail-closed) ve store hiç
       dolmaz — bölümler "veri yok" gerekçesini basar. */
    const value = await loadMock(key);
    if (value === null) return;
    s.snapshot = value;
    s.listeners.forEach((l) => l());
  })().finally(() => {
    if (INFLIGHT.get(key) === task) INFLIGHT.delete(key);
  });

  INFLIGHT.set(key, task);
  return task;
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
 * @param key `registry.ts`'teki anahtar. Üretici FONKSİYON geçirilmez —
 *            geçirilseydi ekran mock modülünü import etmek zorunda kalır
 *            ve modül üretim paketine geri girerdi (UI-ADR-123).
 */
export function useMockData<K extends MockKey>(key: K): MockState<MockMap[K]> {
  const subscribe = useCallback((l: () => void) => subscribeTo(key, l), [key]);

  const data = useSyncExternalStore(
    subscribe,
    () => readSnapshot(key) as MockMap[K] | null,
    () => null
  );

  /* Üretim render'da değil effect'te: ilk mount'ta bir kez doldurulur.
     Gerçek modda hiç üretilmez — fail-closed (UI-ADR-115). */
  useEffect(() => {
    if (!IS_MOCK) return;
    void fillStore(key, false);
  }, [key]);

  const reload = useCallback(() => void fillStore(key, true), [key]);

  return { ...mockGate(IS_MOCK, data), reload };
}
