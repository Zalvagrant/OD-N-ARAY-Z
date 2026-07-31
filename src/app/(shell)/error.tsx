"use client";

/**
 * Kabuk hata sınırı — UI-ADR-133.
 *
 * NEDEN VAR: `src/app/` altında HİÇBİR `error.tsx` yoktu. Bir ekran
 * render sırasında patladığında React ağacı çöküyor ve kullanıcı
 * **boş beyaz bir sayfa** görüyordu — kabuk, menü, hatta "bir şey
 * ters gitti" cümlesi bile olmadan.
 *
 * Bu, `10-component-library.md` §11'in ("Kullanıcı hiçbir zaman sadece
 * 'Error' görmez") sessizce ihlal edildiği tek yerdi: bölüm bazlı
 * hatalar `Section`/`ErrorState` ile beş adımı dolduruyordu ama
 * BEKLENMEYEN bir istisnanın hiçbir yakalayıcısı yoktu.
 *
 * Route segment sınırı olduğu için kabuk (`layout.tsx`) AYAKTA KALIR:
 * sidebar ve header çalışmaya devam eder, kullanıcı başka bir
 * workspace'e geçebilir. Tam sayfa çökme yerine tek bölüm çöker.
 *
 * `reset()` React'in kendi yeniden deneme kancasıdır — segmenti yeniden
 * render eder. Sayfayı yenilemekten farkı, uygulama durumunun (React
 * Query önbelleği dahil) korunmasıdır.
 */

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function ShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* Konsola BİR KEZ yazılır: yutulan bir istisna teşhis edilemez.
       Üretimde Next `digest` verir, mesaj istemciye gönderilmez. */
    console.error("[ODIN] ekran render hatası:", error);
  }, [error]);

  return (
    <div className="flex max-w-screen-2xl flex-col gap-8">
      <ErrorState
        what="Bu ekran çizilemedi"
        why="Arayüzde beklenmeyen bir hata oluştu — sebep UYDURULMADI, teknik detay aşağıda."
        impact="Yalnızca bu bölüm etkilendi; menü ve diğer workspace'ler çalışmaya devam ediyor."
        fix="“Yeniden dene” ile bölümü tazeleyin. Tekrarlıyorsa teknik detayı kaydedin."
        onRetry={reset}
        /* `digest` üretimde mesajın yerine geçer; ikisinden VAR OLANI
           gösterilir, ikisi de yoksa alan hiç basılmaz. */
        technical={error.digest ? `digest: ${error.digest}` : error.message || undefined}
      />
    </div>
  );
}
