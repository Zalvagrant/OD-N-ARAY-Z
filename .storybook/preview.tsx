import type { Preview } from "@storybook/nextjs-vite";
import { useEffect } from "react";
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
