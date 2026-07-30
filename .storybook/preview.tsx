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
