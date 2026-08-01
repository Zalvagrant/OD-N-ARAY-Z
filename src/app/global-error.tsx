"use client";

import Link from "next/link";

/**
 * KÖK hata sınırı — UI-ADR-191.
 *
 * NEDEN VAR: `(shell)/error.tsx` bir ROUTE SEGMENT sınırıdır; `layout.tsx`
 * ile birlikte render edilir ve bu yüzden **layout'un KENDİSİ** patlarsa
 * devreye giremez. O durumda React ağacı kökten çöker ve kullanıcı
 * **boş beyaz bir sayfa** görür — `10-component-library.md` §11'in
 * ("Kullanıcı hiçbir zaman sadece 'Error' görmez") sessizce ihlal
 * edildiği son yer.
 *
 * Mimari denetimde ölçüldü: `src/app/` altında `error.tsx` VARDI,
 * `global-error.tsx` YOKTU. Aradaki fark küçük görünür ama kapsadıkları
 * hata kümesi ayrıktır: biri ekranı, öteki kabuğun kendisini korur.
 *
 * ⚠️ NEDEN `<html>` ve `<body>` BURADA: `global-error` kök layout'un
 * YERİNE geçer, içine değil. Next.js bunu şart koşar — layout çöktüğü
 * için onun ürettiği belge iskeleti de yoktur.
 *
 * ⚠️ TOKEN KURALI KORUNDU. İlk yazışımda "kök çöktüyse `globals.css`
 * yüklendiğine güvenilemez" diye inline stil kullanmıştım ve ESLint token
 * kapısı dokuz satırda birden durdurdu — haklıydı. Varsayımı gözden
 * geçirdim: stil yüklenmezse sayfa STİLSİZ ama OKUNUR kalır (tarayıcı
 * varsayılanı siyah/beyaz). Yani kuralı çiğnemeye gerekçe yoktu; bir
 * kapıyı susturmak için bulunan gerekçe, gerekçe değildir.
 *
 * Beş adımlı hata anlatısı burada KISALTILDI: bu noktada uygulama
 * hakkında hiçbir şey bilinmiyor, sebebi uydurmak "sahte veri" olurdu.
 * Söylenebilecek dürüst şey: ne olduğu, verinin güvende olduğu ve iki
 * çıkış yolu.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      {/* `bg-bg` — kabuğun (`app-shell.tsx:92`) kullandığı sayfa zemininin
          AYNISI. İlk yazışımda `bg-surface-base` yazmıştım; öyle bir token
          YOK (kullanımdan türetildi: repoda tek geçtiği yer benim
          satırımdı) ve Tailwind onu sessizce yok sayardı — hata sayfası
          zeminsiz kalırdı. */}
      <body className="flex min-h-screen items-center justify-center bg-bg p-8 text-content">
        <main className="max-w-prose">
          <h1 className="text-2xl font-semibold tracking-tight">
            ODIN açılamadı
          </h1>
          <p className="mt-3 text-content-secondary">
            Uygulama kabuğu beklenmeyen bir hatayla durdu. Bu bir ekran
            hatası değil, kökten bir çökme — bu yüzden menü ve başlık da
            görünmüyor.
          </p>
          <p className="mt-3 text-content-secondary">
            <strong className="text-content">Verin güvende:</strong> bu ekran
            yalnızca görüntüleme katmanıdır, ODIN&apos;in kayıtlarına yazmaz.
            Hiçbir karar kaybolmadı.
          </p>

          {/* Hata kimliği ancak Next üretmişse basılır — uydurulmaz. */}
          {error.digest && (
            <p className="odin-mono mt-4 text-xs text-content-tertiary">
              Hata kimliği: {error.digest}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {/* `reset()` React'in kendi yeniden deneme kancasıdır: ağacı
                yeniden kurar. Geçici bir hataysa (ör. tek seferlik bir veri
                biçimi) sayfa yenilenmeden döner. */}
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex h-10 items-center justify-center rounded px-4 font-medium bg-ai text-content-inverse hover:brightness-110"
            >
              Yeniden dene
            </button>
            {/* `<Link>` — ilk yazışımda `<a>` koymuştum, gerekçem "kök
                çöktüyse istemci gezinmesi de çökmüş olabilir, sert gezinme
                daha sağlam" idi. Kapı reddetti ve repo `noInlineConfig`
                kullanıyor: bu repoda hiçbir kural satır içi
                SUSTURULAMIYOR. Gerekçemi yeniden tarttım ve SPEKÜLATİFTİ —
                `global-error` taze bir React kökü kurar, router'ın da
                çöktüğüne dair hiçbir kanıtım yoktu. Kanıtsız bir gerekçeyle
                kapı esnetilmez; bu oturumun tekrar eden dersi. */}
            <Link
              href="/briefing"
              className="inline-flex h-10 items-center justify-center rounded border border-line px-4 font-medium text-content hover:border-line-active"
            >
              Brifinge dön
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
