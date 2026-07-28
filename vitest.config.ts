import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        // Saf mantık testleri (chart ölçekleme gibi) — tarayıcı gerekmez.
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        /* @testing-library/dom'un CJS bağımlılıkları (aria-query, lz-string)
           ön-paketlemeye girmeyince tarayıcı onları ham ESM sanıyor ve
           `elementRoles` / `default` export'unu bulamıyor — TÜM story
           testleri import aşamasında düşüyordu. Ağacı tek girişten zorla
           optimize ettiriyoruz. (package.json'daki aria-query 5.3.2
           override'ı sürümü düzeltir, CJS↔ESM interop'unu değil.) */
        optimizeDeps: { include: ["@testing-library/dom", "aria-query", "lz-string"] },
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
