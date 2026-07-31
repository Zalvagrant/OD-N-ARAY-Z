// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Token uyum kuralları — kaynak: docs/ui_chatgpt/kod/eslint-token-rule.md
 * (11-design-tokens.md §15)
 *
 * Amaç: hardcoded renk/ölçü/animasyon süresi yazılamasın. Yazılırsa tema
 * sistemi çöker — light tema eklendiğinde o bileşen kararmış kalır.
 */
const tokenRules = {
  "no-restricted-syntax": [
    "error",
    {
      selector:
        "Literal[value=/(bg|text|border|shadow|fill|stroke)-\\[#[0-9a-fA-F]{3,8}\\]/]",
      message:
        "Hardcoded renk yasak. docs/ui_chatgpt/11-design-tokens.md'deki semantic token'ı kullan (bg-surface, text-content, border-line...).",
    },
    {
      selector: "Literal[value=/(p|m|gap|w|h)-\\[[0-9]+px\\]/]",
      message: "Hardcoded ölçü yasak. 8px taban spacing token'ını kullan.",
    },
    {
      selector:
        "TemplateElement[value.raw=/(bg|text|border|shadow|fill|stroke)-\\[#[0-9a-fA-F]{3,8}\\]/]",
      message:
        "Hardcoded renk yasak (template literal içinde de). Semantic token kullan.",
    },
    {
      selector:
        "Property[key.name='transition'] ObjectExpression Property[key.name='duration']",
      message:
        "Inline animasyon süresi yasak. src/animations/motion.ts'ten import et.",
    },
  ],
  "react/forbid-dom-props": [
    "error",
    {
      forbid: [
        {
          propName: "style",
          message:
            "Inline style yerine token tabanlı Tailwind sınıfı kullan. İstisna: dinamik ölçü (grafik yüksekliği, ilerleme genişliği) — renk asla.",
        },
      ],
    },
  ],
};

const eslintConfig = defineConfig([...nextVitals, ...nextTs, {
  files: ["src/**/*.{ts,tsx}", "*.{ts,tsx}"],
  rules: tokenRules,
}, {
  // motion.ts token kaynağının kendisidir — transition preset'lerini
  // tanımladığı için inline-süre kuralından muaftır.
  files: ["src/animations/motion.ts"],
  rules: { "no-restricted-syntax": "off" },
}, {
  /* Sanallaştırma boşluğu ve grafik yüksekliği DİNAMİK ÖLÇÜDÜR: değer
     çalışma anında hesaplanır, token ile ifade edilemez. Bu, kuralın kendi
     metnindeki açık istisnadır ("dinamik ölçü — renk asla"). Bu dosyalarda
     inline style YALNIZCA height/transform için kullanılır; renk her zaman
     Tailwind semantic sınıfından gelir. */
  files: ["src/components/ui/table.tsx", "src/components/ui/chart.tsx"],
  rules: { "react/forbid-dom-props": "off" },
}, {
  /* AÇIK BORÇ — sahibin kararı bekleniyor.
     theme-provider.tsx `kod/` klasöründen geldi; KURULUM.md "içeriğini
     değiştirme" diyor. React 19'un yeni react-hooks/set-state-in-effect
     kuralı, localStorage'dan tema okuyup setState eden effect'i işaretliyor.
     Desen SSR açısından doğru (sunucuda localStorage yok), ama kural
     hoşlanmıyor. Dosyayı düzeltmek yerine kuralı burada kapattım.
     Kalıcı çözüm: 11-design-tokens.md güncellenip kod yenilenmeli. */
  files: ["src/components/layout/theme-provider.tsx"],
  rules: { "react-hooks/set-state-in-effect": "off" },
}, {
  /* MOCK ERİŞİMİ TEK KAPIDAN — UI-ADR-123.
     Bir ekran mock modülünü doğrudan import ederse modül üretim paketine
     geri girer; `build:release` kapısı bunu yakalar ama derleme sonunda,
     yani en geç. Kural aynı hatayı düzenleyicide yakalar.
     Muafiyet: kayıt defterinin kendisi, hikâyeler ve testler (bunlar
     üretim paketine girmez). */
  files: ["src/**/*.{ts,tsx}"],
  ignores: [
    "src/mocks/**",
    "src/**/*.stories.tsx",
    "src/**/*.test.{ts,tsx}",
  ],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{
        group: ["@/mocks/amazon", "@/mocks/briefing", "@/mocks/feed", "**/mocks/amazon", "**/mocks/briefing", "**/mocks/feed"],
        message: "Mock modülünü doğrudan import etme (UI-ADR-123): üretim paketine girer. useMockData(\"anahtar\") kullan — anahtarlar src/mocks/registry.ts'te.",
      }],
    }],
  },
}, globalIgnores([
  // Default ignores of eslint-config-next:
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
  "storybook-static/**",
  // Spesifikasyon klasörü — kaynak kod değil, lint kapsamı dışı.
  "docs/**",
]), ...storybook.configs["flat/recommended"]]);

export default eslintConfig;
