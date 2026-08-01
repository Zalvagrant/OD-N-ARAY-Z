import type { Preview } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionGlobalConfig } from "framer-motion";
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
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      /**
       * ✅ `error` — kapı KAPALI (UI-ADR-165). Bir zamanlar `todo` idi.
       *
       * Ölçüm o zaman **107 story / 609 ihlal** demişti ve 582'si (%96)
       * TEK token'dan geliyordu: `--odin-text-tertiary` = `#64748B`.
       * Karanlık temanın BEŞ zemininin hiçbirine karşı WCAG AA'yı
       * geçmiyordu (3.16 – 4.14). Token `#8593A5`'e açıldı; en kötü
       * zemine (`surface-floating` #1B2739) karşı 4.81 verir.
       *
       * ⚠️ İlk aday listem EKSİK ÖLÇÜLMÜŞTÜ: `surface-floating` ve
       * `surface-elevated` zeminleri sayılmamıştı, bu yüzden `#7c8899`
       * "4.93 geçer" görünüyordu — gerçekte 4.18 ile KALIYOR. Bir
       * kontrast iddiası, ölçüldüğü zemin kümesi kadar doğrudur.
       *
       * Bundan sonra erişilebilirlik ihlali eklemek CI'yı düşürür.
       * `todo`ya geri çevirmek bir düzeltme değil, kapıyı sökmektir.
       */
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
