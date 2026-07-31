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
    /* SAHTE VERİ KAÇAĞI — UI-ADR-146 (yazılımcılar denetimi).
     *
     * `Num` / `Pct` / `Meter` / `Stat` hepsi `null`ı NoData'ya çevirir; bu,
     * "ölçülmedi" ile "sıfır"ı ayıran TEK mekanizmadır. Ama çağıran
     * değeri bileşene ULAŞMADAN önce ezerse mekanizma hiç devreye girmez:
     *
     *     <Num value={metrics?.confidence ?? 0} />   // ← %0 UYDURUR
     *
     * Bu kod tip-güvenlidir, render edilir, axe'tan geçer ve hiçbir
     * mevcut kapı onu görmez — ekranda ölçülmemiş bir metrik SIFIR olarak
     * görünür. Sahte veri yasağının (CLAUDE.md §2) en sessiz ihlali budur.
     *
     * Kapsam KASITLI OLARAK DAR: yalnız `value=` prop'unun içi. Sıralama
     * epoch'u (`new Date(x ?? 0)`) ve uzunluk kontrolü (`x?.length ?? 0`)
     * meşrudur ve repoda üç yerde geçer — geniş bir desen onları da
     * vururdu. */
    {
      selector:
        "JSXAttribute[name.name='value'] LogicalExpression[operator='??'][right.value=0]",
      message:
        "SAHTE VERİ: `value={x ?? 0}` ölçülmemiş bir metriği SIFIR gösterir (CLAUDE.md §2). Ham değeri geçir — Num/Pct/Meter null'ı NoData'ya çevirir; gerekçe için noDataReason kullan.",
    },
    {
      selector:
        "JSXAttribute[name.name='value'] LogicalExpression[operator='||'][right.value=0]",
      message:
        "SAHTE VERİ: `value={x || 0}` ölçülmemiş bir metriği SIFIR gösterir — üstelik GERÇEK 0'ı da ezer (CLAUDE.md §2). Ham değeri geçir.",
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
  files: [
    "src/components/ui/table.tsx",
    "src/components/ui/chart.tsx",
    /* Hedef ilerleme çubuğunun genişliği ölçülen değerden gelir —
       kuralın kendi metnindeki "ilerleme genişliği" istisnası (UI-ADR-124).
       Renk yine token'dan: bg-accent. */
    "src/features/goals/screen.tsx",
  ],
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
  /*
   * KATMAN SINIRLARI — UI-ADR-130.
   *
   * NEDEN KURAL: sınırlar S13'te ELLE onarıldı (ölçüldü: `screens → mocks`
   * 8 kenar, `layout → screens` 2 kenar, `mocks → components/ui` 1 kenar).
   * Kural yazılmazsa aynı kenarlar geri gelir — bir sonraki oturum
   * `import { skusMock } from "@/mocks/amazon"` yazdığında hiçbir şey
   * itiraz etmez ve onarım baştan yapılır. Mimarinin dokümanda değil
   * DERLEYİCİDE yaşaması gerekir.
   *
   * İZİNLİ YÖN — yukarıdan aşağı, asla ters:
   *
   *     app  →  features  →  components/{executive,layout,ui}
   *                       →  lib  →  types
   *
   * `app` kompozisyon köküdür: her şeyi tanır, kimse onu tanımaz.
   */
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/**/*.stories.tsx", "src/**/*.test.{ts,tsx}"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        {
          /* Mock erişimi TEK KAPIDAN — UI-ADR-123 · 135.
             Kayıt defteri dışındaki her mock modülü yasak; doğrudan import
             modülü üretim paketine geri sokar. */
          group: ["@/mocks/*", "**/mocks/*", "!@/mocks/registry"],
          message:
            "Mock modülünü doğrudan import etme (UI-ADR-123): üretim paketine girer. Fixture için useOdinFixture(\"anahtar\") kullan — anahtarlar src/mocks/registry.ts'te.",
        },
        {
          /* TERS BAĞIMLILIK: aşağıdaki katmanlar ekranı tanıyamaz.
             Kabuk her feature'ı tanırsa hiçbir feature tek başına
             taşınamaz; sağ panel bunun için slota çevrildi.

             ♻️ UI-ADR-143: desen `@/components/screens/**` idi; ekranlar
             `features/<alan>/screen.tsx`e taşındı. Ayırt edici artık
             KLASÖR değil DOSYA ADI: `features/` altında ekran olmayan çok
             şey var (`selectors`, `presentation`, `shell`) ve onları
             kapsayan bir desen mimariyi kilitlerdi.

             ⚠️ GÖRELİ İMPORT deseni atlatır ve dört ihlal enjekte edilip
             ölçüldü: alias (`@/features/briefing/screen`), derin alias
             (`@/features/amazon/director/screen`) ve YUKARI göreli
             (`../director/screen`) yakalandı; ama AŞAĞI göreli
             (`./director/screen`) ilk denemede KAÇTI. Desen ona göre
             tamamlandı — kapı, denenmeden kapı sayılmaz (bu repoda
             `@/components/*` deseni de tam böyle sessizce boş çıkmıştı). */
          group: [
            "@/features/*/screen", "@/features/*/*/screen",
            "**/features/*/screen", "**/features/*/*/screen",
            "./*/screen", "./*/*/screen",
            "../*/screen", "../../*/screen", "../*/*/screen",
          ],
          message:
            "Ekranı yalnızca app/ kompozisyon kökü import eder (UI-ADR-130 · 143). Kabuk bir SLOT tanımlar, içeriği app/ verir — bkz. app/(shell)/context-panel.tsx.",
        },
      ],
    }],
  },
}, {
  /* `app/` kompozisyon köküdür — ekranları o birleştirir. */
  files: ["src/app/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{
        group: ["@/mocks/*", "**/mocks/*", "!@/mocks/registry"],
        message: "Mock modülünü doğrudan import etme (UI-ADR-123).",
      }],
    }],
  },
}, {
  /* Mock katmanı VERİ üretir; onu çizen bileşeni tanımaz.
     `TimelineItem` tam olarak bu yüzden `types/`e taşındı (UI-ADR-130). */
  files: ["src/mocks/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{
        group: ["@/components/**", "**/components/**"],
        message:
          "Mock bir bileşeni import edemez (UI-ADR-130): veri şeklinin sahibi types/ katmanıdır, onu çizen bileşen değil.",
      }],
    }],
  },
}, {
  /* Tasarım sistemi primitive'i uygulama katmanlarını tanımaz — tanısaydı
     Storybook'ta tek başına render edilemezdi. */
  files: ["src/components/ui/**/*.{ts,tsx}"],
  ignores: ["src/components/ui/mock-badge.tsx", "src/**/*.stories.tsx"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{
        group: [
          "@/components/executive/**",
          "@/features/**", "@/mocks/**", "@/lib/store/**",
        ],
        message:
          "ui/ primitive katmanıdır: feature, ekran, store ya da mock tanıyamaz (UI-ADR-130).",
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
