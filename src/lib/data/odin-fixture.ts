"use client";

/**
 * Fixture kaynağı — TEK boruya bağlanır (UI-ADR-135).
 *
 * NEDEN VAR: bu repoda İKİ paralel veri zinciri vardı.
 *
 *   A) `useOdinQuery` → React Query → `httpLoad` → `parseEnvelope` → zod →
 *      tazelik yeniden hesabı → `OdinError`. 6 ekran yuvası bunu kullanıyordu.
 *
 *   B) `useMockData` → `src/mocks/use-mock.ts` içindeki modül-global `Map`.
 *      15 ekran yuvası bunu kullanıyordu ve zincir A'nın HİÇBİR kapısından
 *      geçmiyordu: şema yok, tazelik yeniden hesabı yok, evren anahtarı yok,
 *      çöp toplama yok — ve `MockState` tipinde `error` ALANI HİÇ YOKTU.
 *      Yani o 15 bölüm için bir hata OLUŞSA BİLE ekrana çıkacak yolu yoktu.
 *
 * İki zincir olması yalnız tekrar değil, GÜVEN sorunuydu: aynı ekranda
 * yan yana duran iki sayıdan biri doğrulanmış borudan, diğeri
 * doğrulanmamış borudan geliyordu ve bakan kişi hangisinin hangisi
 * olduğunu ayırt edemiyordu.
 *
 * Bu modül B'yi kaldırır: fixture artık ayrı bir zincir değil, aynı
 * borunun bir TAŞIYICISIDIR.
 *
 * ŞEMA KAPSAMI — UI-ADR-113 korunur: ODIN'de karşılığı olmayan tipler için
 * "mock-only" şema YAZILMADI, çünkü öyle bir şema sahte yeteneği
 * meşrulaştırır ve zamanla gerçek sanılır. Bunun yerine ayrım şu:
 *   · Telden gelen veri (wire) → payload şeması ZORUNLU.
 *   · Süreç içi fixture      → payload'ı biz yazdık, `satisfies` ile
 *                              derlemede zaten kilitli; tekrar doğrulamak
 *                              kendi yazdığımızı kendimize kanıtlamaktır.
 * Her iki durumda da ZARF (`meta.source` · `lastUpdated` · `freshness` ·
 * AI-confidence kuralı) doğrulanır — atlanmaz.
 */

import { z } from "zod";
import type { DataEnvelope } from "@/types/data-envelope";
import { loadMock, type MockKey, type MockMap } from "@/mocks/registry";
import { IS_MOCK } from "./mode";
import type { OdinModule } from "./policy";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";

/** `MockMap` değerleri zaten zarftır; taşıdıkları yükü çıkarır. */
type FixtureOf<K extends MockKey> =
  MockMap[K] extends DataEnvelope<infer T> ? T : never;

/**
 * Payload'ı geçiren şema. `parseEnvelope` yine `meta`yı doğrular; yalnız
 * yükü olduğu gibi bırakır (yukarıdaki ŞEMA KAPSAMI gerekçesi).
 */
const passthrough = z.unknown();

/**
 * Bir fixture anahtarını ekranın tek veri kancasına bağlar.
 *
 * GERÇEK MODDA SORGU HİÇ KOŞMAZ (`enabled: IS_MOCK`). Bu bilinçli ve
 * davranışı birebir korur: `loadMock` gerçek modda `null` döner, `null`
 * `parseEnvelope`'a girseydi sözleşme hatası fırlatırdı ve ODIN'in henüz
 * YAYINLAMADIĞI bir bölüm, ekranda kırmızı bir hata gibi görünürdü. Oysa
 * doğru anlatım "sözleşme yok" boş durumudur (UI-ADR-096) — sorgu kapalı
 * kalınca `envelope: null · error: null · loading: false` döner ve
 * `Section` bugünkü boş metnini aynen basar.
 *
 * Yan fayda: kapalı sorgu `loadMock`'u çağırmaz, yani gerçek derlemede
 * mock grafiğine çalışma zamanında da dokunulmaz (UI-ADR-123 kapısı
 * bozulmadan kalır).
 */
export function useOdinFixture<K extends MockKey>(
  key: K,
  module: OdinModule = "default"
): OdinQueryResult<FixtureOf<K>> {
  return useOdinQuery({
    key: ["fixture", key],
    module,
    /* Tip, anahtardan `MockMap` üzerinden geliyor; şema yalnız zarfı
       doğruladığı için burada bir daraltma yapılır. */
    schema: passthrough as unknown as z.ZodType<FixtureOf<K>>,
    enabled: IS_MOCK,
    load: async () => loadMock(key),
  });
}
