import type { Preview } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionGlobalConfig } from "framer-motion";
import { a11yCalismaZamaniSorunlari } from "../src/lib/a11y-gate";
import { makeQueryClient } from "../src/lib/data/query";
import "../src/app/globals.css";

/**
 * TEST KOŞUCUSUNDA animasyon atlanır — UI-ADR-165. Storybook'un kendi
 * arayüzünde HİÇBİR ŞEY DEĞİŞMEZ; koşul yalnız Vitest tarayıcı modunda
 * doğrudur.
 *
 * Sebep: `addon-a11y` axe'i `afterEach`te koşturur. Giriş animasyonu o an
 * hâlâ opaklığı 0'dan 1'e taşıyorsa axe YARIM KAREYİ ölçer ve "kontrast
 * 1.07" der. Ekranda o renk hiç durmaz — bu bir tasarım kusuru değil, bir
 * YARIŞ. Ve yarış olduğu ölçüldü: aynı kod iki koşuda 3 ve 6 test düşürdü.
 *
 * Önce `reducedMotion: 'reduce'` denendi ve YETMEDİ: bileşenler o kipte
 * hareketi kaldırıyor ama çapraz geçişi koruyor (`disclosure.tsx:10` bunu
 * bilerek yapıyor — "hareket kalkar, bilgi kalmaz değil"). Doğru olan da
 * budur; düzeltilmesi gereken üretim değil, ölçüm anıydı.
 */
if ((globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) {
  MotionGlobalConfig.skipAnimations = true;
}

const preview: Preview = {
  /**
   * ÇALIŞMA ZAMANI KAPISI — UI-ADR-172, HER story için.
   *
   * Yedi tur denetimden sonra kalan en ciddi açık: bugün TEMİZ olan bir
   * story'yi `todo`ya çevirmek raporda hiçbir iz bırakmıyordu (addon
   * `hasViolations ? getMode() : "passed"` yazıyor). Koşum kanıtı bunu
   * göremez — `todo` kipinde tarama TAM koşar, yalnız fırlatmaz.
   *
   * Storybook proje seviyesi `beforeEach`i bileşen/story seviyesinden
   * ÖNCE koşar (`runtime.js` → `applyBeforeEach`), yani bir story bunu
   * kendi `beforeEach`iyle atlayamaz. Ve okunan şey KAYNAK değil
   * BİRLEŞMİŞ SONUÇ olduğu için, metin denetiminin göremediği
   * hesaplanmış anahtar ve başka dosyadan yayılım da buraya takılır.
   */
  beforeEach: async ({ parameters, globals }) => {
    const sorunlar = a11yCalismaZamaniSorunlari({
      parameters,
      globals,
      env: (import.meta as unknown as { env?: Record<string, string> }).env,
    });
    if (sorunlar.length > 0) {
      throw new Error(
        `A11Y KAPISI SÖKÜLMÜŞ (UI-ADR-172): ${sorunlar.join(" · ")}`,
      );
    }
  },

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    /**
     * ERİŞİLEBİLİRLİK — `test: "error"`, kapı KAPALI (UI-ADR-165).
     * Seçenekler: `todo` yalnız gösterir · `off` hiç koşmaz.
     *
     * ⚠️ GEREKÇE BLOĞUN DIŞINDA DURUYOR VE BU BİLİNÇLİ (UI-ADR-169):
     * `verify-tests.mjs` artık `a11y` bloğunun İÇİNDE yorum bulunmasını
     * yasaklıyor. Sebebi acı: yorum sökme SIRASI iki ayrı sömürüye
     * kandı — önce "satır yorumunun içindeki blok açma imi", sonra
     * "blok yorumunun içindeki `//`". İkisinde de aradaki
     * `disable: true` siliniyor ve geriye tertemiz `test: "error"`
     * kalıyordu. Sıra oyununun kazananı yok; yorumu blok dışına almak
     * soruyu tamamen ortadan kaldırıyor.
     *
     * Ölçüm (165): `error`e çevrildiğinde **107 story / 609 ihlal**di ve
     * 582'si (%96) TEK token'dan geliyordu — `--odin-text-tertiary` =
     * `#64748B`, karanlık temanın BEŞ zemininin hiçbirine karşı AA'yı
     * geçmiyordu (3.16 – 4.14). `#8593A5`'e açıldı; en kötü zemine
     * (`surface-floating` #1B2739) karşı 4.81.
     *
     * ⚠️ İlk aday listem EKSİK ÖLÇÜLMÜŞTÜ: `surface-floating` ve
     * `surface-elevated` sayılmamıştı, `#7c8899` "4.93 geçer"
     * görünüyordu — gerçekte 4.18 ile KALIYOR. **Bir kontrast iddiası,
     * ölçüldüğü zemin kümesi kadar doğrudur.**
     *
     * `todo`ya geri çevirmek bir düzeltme değil, kapıyı sökmektir — ve
     * asıl kapı artık burası bile değil: her story raporda kendi axe
     * taramasının koştuğunu KANITLIYOR (UI-ADR-169).
     */
    a11y: {
      test: "error",
    },

    backgrounds: { disable: true },
  },

  decorators: [
    /* Veri katmanı sağlayıcısı — S7. Uygulamada `(shell)/layout.tsx`'te
       yaşar; Storybook Next layout'larını çalıştırmadığı için burada da
       gerekir. Her story KENDİ QueryClient'ını alır: story'ler arasında
       önbellek taşınırsa bir story'nin verisi diğerinde görünür. */
    (Story) => {
      const [client] = useState(makeQueryClient);
      return (
        <QueryClientProvider client={client}>
          <Story />
        </QueryClientProvider>
      );
    },
    /* Storybook iframe'ine tema niteliğini basar — uygulamada bunu
       ThemeProvider yapar (11-design-tokens.md §7). */
    (Story) => {
      useEffect(() => {
        document.documentElement.setAttribute("data-theme", "executive-dark");
      }, []);
      return <Story />;
    },
  ],
};

export default preview;
