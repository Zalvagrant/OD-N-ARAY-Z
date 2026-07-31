import type { Preview } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "../src/lib/data/query";
import "../src/app/globals.css";

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
       * ⚠️ `todo` — ve bu bir EKSİKLİK, tercih değil (UI-ADR-154).
       *
       * `error`e çevrildi ve ÖLÇÜLDÜ: **107 story düşüyor, 609 ihlal.**
       * Dağılım:
       *   582  color-contrast      ← %96
       *    12  definition-list
       *    10  dlitem
       *     2  landmark-unique · 2 label · 1 aria-valid-attr-value
       *
       * 582'nin neredeyse tamamı TEK TOKEN: `#64748b`
       * (`text-content-tertiary`). Beş zemine karşı ölçülen en kötü oran
       * **3.73:1**; WCAG AA küçük metin için 4.5:1 istiyor.
       *
       * Yani bu bir "yüzlerce hata" değil, BİR tasarım dili kararı:
       * tek token açılırsa ihlallerin ~%96'sı kapanır. Aday tonlar
       * (en kötü zemine göre): #7c8899 → 4.93 · #8593a5 → 5.67 ·
       * #94a3b8 → 6.92.
       *
       * Token değiştirmek arayüzün TAMAMININ görünümünü etkiler ve
       * SAHİBİN kararıdır — sessizce yapılmaz. Karar verilip sıfırlanana
       * kadar `todo`da kalıyor. Çevirmeden önce ölç: sayı burada yazılı,
       * tahmine gerek yok.
       */
      test: "todo",
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
