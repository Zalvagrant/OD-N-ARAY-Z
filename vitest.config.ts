import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  /* `@/` yolu tsconfig'te tanımlı ve tüm kaynak ağacı onu kullanıyor; Next
     ve Storybook kendi çözücülerinden biliyor ama saf `unit` projesi (node
     ortamı) bilmiyordu. Alias burada olmadan `@/` import eden HİÇBİR unit
     testi yazılamaz — S7 veri katmanı ilk denemede buna takıldı. */
  resolve: {
    alias: { '@': path.join(dirname, 'src') },
  },
  /* VERİ MODU TESTTE SABİTLENİR — ÇALIŞTIRAN MAKİNEDEN OKUNMAZ.
   *
   * `.env.local` (NEXT_PUBLIC_ODIN_DATA_MODE=odin) launcher için gerekli ve
   * doğru: `next start` onsuz sessizce mock servis eder. Ama Vite o dosyayı
   * testte de okuyup `process.env.NEXT_PUBLIC_ODIN_DATA_MODE`i gömüyor,
   * `IS_MOCK` false oluyor ve mock kayıt defteri gerçek modda bilerek `null`
   * dönüyor: `registry.test.ts`in 25 testi + 14 story testi toptan düştü.
   * Kapı `.env.local` yazılmadan önce yeşildi — yani yeşillik bir dosyanın
   * YOKLUĞUNA bağlıydı ve bunu hiçbir kapı söylemiyordu.
   *
   * `define` ŞART, `test.env` YETMEZ: unit projesi node'da koşar ve
   * `process.env`i görür, ama storybook projesi TARAYICIDA koşar — orada
   * `process.env` diye bir şey yok, Vite değeri transform anında gömer.
   * Yalnız `test.env` konsaydı unit yeşil, storybook kırmızı kalırdı
   * (ölçüldü: 369 geçti / 234 geçti-14 düştü). */
  define: {
    'process.env.NEXT_PUBLIC_ODIN_DATA_MODE': JSON.stringify('mock'),
  },
  test: {
    /* TARAYICI BAĞLANTI ZAMAN AŞIMI — KÖKTE OLMAK ZORUNDA.
     *
     * İKİ OTURUM AYNI KÖK NEDENİ BAĞIMSIZ BULDU (S13 ve S17): vitest bu
     * değeri `project.vitest.config.browser.connectTimeout ?? 6e4` ile
     * KÖK config'ten okur; proje içine yazılırsa SESSİZCE yok sayılır ve
     * varsayılan 60 sn yürürlükte kalır. İkisi de bir kez proje içine
     * yazıp yeşil sonucu ayara bağlama hatasını yaptı — yeşillik sıcak
     * önbellekten geliyordu.
     *
     * DEĞER S17'DEN: 300 sn, SOĞUK `node_modules/.vite` ile ölçüldü.
     * S13 merge'ünde 180 sn'ye düşürülmüştü — o ölçüm SICAK önbellekle
     * yapılmıştı, yani düşük olan değer doğrulanmamıştı. S17'nin uyarısı
     * geçerlidir: **düşürmeden önce `rm -rf node_modules/.vite` ile
     * SOĞUK ölç.** Bu bir kalibrasyon değeridir, bir tercih değil.
     *
     * ⚠️ `unit` ile `storybook` AYNI ANDA koşturulmaz (S13 ölçümü): node
     * işçileri CPU'yu tutunca bağlantı yine düşüyor. `npm run test:ci`
     * ikisini sırayla çalıştırır. */
    browser: { connectTimeout: 300_000 },
    /* Node tarafı için ikinci kemer; tarayıcı tarafını yukarıdaki `define`
       kapatır. İkisi de gerekli, biri diğerini kapsamıyor. */
    env: { NEXT_PUBLIC_ODIN_DATA_MODE: 'mock' },
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
        /* `storybook/test` ilk `play` fonksiyonuyla birlikte geldi; ön
           paketlemeye dahil edilmezse Vite testin ORTASINDA optimize edip
           sayfayı yeniden yüklüyor ve o dosyadaki tüm story'ler düşüyor. */
        optimizeDeps: {
          include: ["@testing-library/dom", "aria-query", "lz-string", "storybook/test"],
        },
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          /* Tam ekran story'leri (Screens/*) bileşen story'lerinden ağırdır:
             tek story'de 4 karar kartı + 9 KPI + 6 Director kartı render
             edilir ve addon-a11y hepsini axe ile tarar. Varsayılan 15 sn
             bu makinede sınırda kalıyordu. */
          testTimeout: 40_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
            /* `connectTimeout` BURAYA YAZILMAZ — kökte olmak zorunda,
               yukarıdaki nota bak (UI-ADR-142). */
          },
        },
      },
    ],
  },
});
