"use client";

/**
 * Ekranların TEK veri kancası — S7 D7.1 · D7.8 · D7.11.
 *
 * Bir bileşen `fetch` çağırmaz, `useQuery` çağırmaz, kendi hata metnini
 * yazmaz. Buradan `envelope` + `error` alır; ikisi de yoksa iskelet basar.
 *
 * ÖNBELLEK ANAHTARI İZOLASYONU (D7.11): anahtarın başında mod ve evren
 * vardır. Mock'ta doldurulan bir önbellek gerçek modda okunamaz; Lillu'nun
 * verisi başka bir evrenin ekranında görünemez. İkisi de "olmaz zaten"
 * denip atlanan, olunca da sessizce yanlış sayı gösteren hatalardır.
 */

import { useQuery, type QueryKey } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import type { z } from "zod";
import type { DataEnvelope } from "@/types/data-envelope";
import { useUniverseStore } from "@/lib/store/universe";
import { parseEnvelope } from "./client";
import { classifyError, type OdinError } from "./errors";
import { DATA_MODE } from "./mode";
import { policyFor, type OdinModule } from "./policy";

export interface OdinQueryResult<T> {
  envelope: DataEnvelope<T> | null;
  /** Elde HİÇ veri yokken dolu — `ErrorState` bununla basılır. */
  error: OdinError | null;
  /**
   * Elde veri VARKEN son yenilemenin başarısız olması — UI-ADR-115.
   *
   * Meclis bu alanı zorunlu kıldı (yazılımcılar 2/2 RET): eski veriyi
   * yalnız "bayat" damgasıyla göstermek sistemin ÇÖKTÜĞÜ bilgisini
   * maskeler. Bayatlık "hafta sonu güncellenmedi" de demek olabilir;
   * "ODIN üç saattir 500 dönüyor" bambaşka bir şeydir ve CEO'nun o eski
   * sayıya dayanarak karar vermesi bu farkı bilmesine bağlıdır.
   */
  refreshError: OdinError | null;
  /** İlk veri henüz yokken true — iskelet bu bayrakla basılır. */
  loading: boolean;
  /** Arka planda tazeleniyor; ekranda eski veri duruyor. */
  refreshing: boolean;
  /** Çevrimdışıyken elde kalan veri AÇIKÇA işaretlenmelidir (D7.8). */
  offline: boolean;
  refetch: () => void;
}

export function useOdinQuery<T>({
  key,
  module,
  schema,
  load,
  enabled = true,
}: {
  /** Ekran tarafı anahtar — mod ve evren OTOMATİK eklenir. */
  key: QueryKey;
  module: OdinModule;
  schema: z.ZodType<T>;
  /** Ham yükü getirir: mock üreticisi ya da `httpLoad(path)`. */
  load: (signal: AbortSignal) => Promise<unknown>;
  enabled?: boolean;
}): OdinQueryResult<T> {
  const universeId = useUniverseStore((s) => s.activeUniverseId);
  const offline = useOnline() === false;
  const policy = policyFor(module);
  /* Hata metninde görünen ad — anahtarın TAMAMI. Yalnız ilk parça
     kullanılınca ekranda "amazon yanıtı uymuyor" yazıyordu; hangi bölümün
     reddedildiği belli değildi (canlı denemede görüldü). */
  const where = (key as unknown[]).join(".");

  const q = useQuery<DataEnvelope<T>, OdinError>({
    queryKey: [DATA_MODE, universeId, ...(key as unknown[])],
    enabled,
    ...policy,
    /* Çevrimdışıyken arka plan yenilemesi kapanır: her aralıkta bir hata
       üretip elde kalan veriyi şüpheli göstermenin kimseye faydası yok. */
    refetchInterval: offline ? false : policy.refetchInterval,
    queryFn: async ({ signal }) => {
      try {
        return parseEnvelope(await load(signal), schema, where, module);
      } catch (err) {
        throw classifyError(err, where);
      }
    },
  });

  return {
    envelope: q.data ?? null,
    /* Elde geçerli veri varken tam ekran hata basmayız — ama hatayı da
       YUTMAYIZ; `refreshError` olarak dışarı verilir (UI-ADR-115). */
    error: q.data ? null : (q.error ?? null),
    refreshError: q.data ? (q.error ?? null) : null,
    loading: q.isPending && enabled,
    refreshing: q.isFetching && !!q.data,
    offline: offline && !!q.data,
    refetch: () => void q.refetch(),
  };
}

/**
 * Bağlantı durumu — D7.8.
 *
 * Sunucuda daima `true` döner: sunucunun bağlantısı kullanıcınınki değildir
 * ve "çevrimdışı" damgası sunucu HTML'ine basılırsa hydration çatlar.
 */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

function subscribeOnline(cb: () => void): () => void {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}
