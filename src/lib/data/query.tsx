"use client";

/**
 * React Query kurulumu — S7 D7.1.
 *
 * Neden hazır kütüphane (meclis 3/5 gerekçeli çoğunluk, UI-ADR-112):
 * istenen davranışlar (dedupe · stale-while-revalidate · iptal · GC ·
 * observer yaşam döngüsü) 120 satırlık bir kancada doğru yazılmaz; hepsi
 * yanlış yazıldığında SESSİZ bozulur. UI-ADR-087 (grafik kütüphanesi reddi)
 * burada emsal değildir: orada dar ve deterministik bir çizim işi vardı.
 *
 * SSR SINIRI (D7.15): sunucuda ÖN YÜKLEME YAPILMAZ. Mock kayıtların
 * `lastUpdated`'ı `Date.now()` ile üretilir; sunucuda üretilen değer
 * istemcidekiyle tutmaz ve hydration çatlar. Sunucu gerçekten "veri yok"
 * durumunu basar, iskelet o yüzden dürüsttür.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { OdinError } from "./errors";
import { policyFor } from "./policy";

export function makeQueryClient(): QueryClient {
  const base = policyFor("default");
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: base.staleTime,
        gcTime: base.gcTime,
        /* Executive Timing: pencereye her dönüşte sayıların yenilenmesi
           dikkat dağıtır. Yenileme zamana bağlıdır, göz temasına değil. */
        refetchOnWindowFocus: false,
        /* Bağlantı dönünce tazelenir — çevrimdışıyken retry denemek yerine
           doğru davranış budur. */
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          if (!(error instanceof OdinError)) return false;
          return error.retryable && failureCount < 3;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
    },
  });
}

export function OdinQueryProvider({ children }: { children: ReactNode }) {
  /* İstemci render başına BİR kez; modül seviyesinde tutulursa iki sekme
     aynı Next sunucusunda önbelleği paylaşır. */
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
