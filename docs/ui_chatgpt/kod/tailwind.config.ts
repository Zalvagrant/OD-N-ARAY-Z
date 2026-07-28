/**
 * ODIN Tailwind Config
 * Kaynak: docs/ui_chatgpt/11-design-tokens.md
 *
 * KURAL: Burada SADECE semantic token'lar açılır.
 *        Primitive token'lar (gray-900 vb.) Tailwind'e açılmaz —
 *        böylece bileşenler onları yanlışlıkla kullanamaz.
 *
 * Kullanım:
 *   bg-surface        ✅
 *   bg-[#111827]      ❌ (lint yakalar)
 *   text-ai           ✅
 */

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="executive-dark"]'],
  content: [
    "./src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* --- Arka plan --- */
        bg: {
          DEFAULT: "var(--odin-bg-primary)",
          secondary: "var(--odin-bg-secondary)",
        },

        /* --- Yüzeyler --- */
        surface: {
          DEFAULT: "var(--odin-surface-default)",
          elevated: "var(--odin-surface-elevated)",
          floating: "var(--odin-surface-floating)",
        },

        /* --- Metin --- */
        content: {
          DEFAULT: "var(--odin-text-primary)",
          secondary: "var(--odin-text-secondary)",
          tertiary: "var(--odin-text-tertiary)",
          inverse: "var(--odin-text-inverse)",
        },

        /* --- Kenarlık --- */
        line: {
          DEFAULT: "var(--odin-border-default)",
          subtle: "var(--odin-border-subtle)",
          focus: "var(--odin-border-focus)",
          active: "var(--odin-border-active)",
        },

        /* --- İkon --- */
        icon: {
          DEFAULT: "var(--odin-icon-default)",
          active: "var(--odin-icon-active)",
          muted: "var(--odin-icon-muted)",
        },

        /* --- DURUM (semantiği dondurulmuş — ADR-069) --- */
        danger: {
          DEFAULT: "var(--odin-danger)",
          bg: "var(--odin-danger-bg)",
        },
        warning: {
          DEFAULT: "var(--odin-warning)", // AMBER — turuncu değil
          bg: "var(--odin-warning-bg)",
        },
        success: {
          DEFAULT: "var(--odin-success)",
          bg: "var(--odin-success-bg)",
        },
        info: {
          DEFAULT: "var(--odin-info)",
          bg: "var(--odin-info-bg)",
        },

        /* --- AKSAN --- */
        ai: {
          DEFAULT: "var(--odin-accent-ai)",
          surface: "var(--odin-ai-surface)",
          border: "var(--odin-ai-border)",
          text: "var(--odin-ai-text)",
          processing: "var(--odin-ai-processing)",
          streaming: "var(--odin-ai-streaming)",
        },
        accent: {
          DEFAULT: "var(--odin-accent-secondary)", // cyan #00D4FF — DEKORATİF
          amazon: "var(--odin-accent-amazon)",
          finance: "var(--odin-accent-finance)",
          trading: "var(--odin-accent-trading)",
          knowledge: "var(--odin-accent-knowledge)",
        },

        /* --- Grafik --- */
        chart: {
          line: "var(--odin-chart-line)",
          area: "var(--odin-chart-area)",
          grid: "var(--odin-chart-grid)",
          axis: "var(--odin-chart-axis)",
          positive: "var(--odin-chart-positive)",
          negative: "var(--odin-chart-negative)",
          neutral: "var(--odin-chart-neutral)",
          1: "var(--odin-chart-series-1)",
          2: "var(--odin-chart-series-2)",
          3: "var(--odin-chart-series-3)",
          4: "var(--odin-chart-series-4)",
          5: "var(--odin-chart-series-5)",
        },
      },

      /* --- Spacing: 8px taban, 4px mikro --- */
      spacing: {
        1: "var(--odin-space-1)",
        2: "var(--odin-space-2)",
        3: "var(--odin-space-3)",
        4: "var(--odin-space-4)",
        5: "var(--odin-space-5)",
        6: "var(--odin-space-6)",
        8: "var(--odin-space-8)",
        10: "var(--odin-space-10)",
        12: "var(--odin-space-12)",
        16: "var(--odin-space-16)",
        20: "var(--odin-space-20)",
        24: "var(--odin-space-24)",
        32: "var(--odin-space-32)",
      },

      borderRadius: {
        xs: "var(--odin-radius-2)",
        sm: "var(--odin-radius-4)",
        DEFAULT: "var(--odin-radius-8)",
        md: "var(--odin-radius-12)",
        lg: "var(--odin-radius-16)",
        xl: "var(--odin-radius-20)",
        "2xl": "var(--odin-radius-24)",
        "3xl": "var(--odin-radius-32)",
      },

      boxShadow: {
        e0: "var(--odin-elevation-0)",
        e1: "var(--odin-elevation-1)",
        e2: "var(--odin-elevation-2)",
        e3: "var(--odin-elevation-3)",
        e4: "var(--odin-elevation-4)",
        overlay: "var(--odin-elevation-overlay)",
        modal: "var(--odin-elevation-modal)",
        "ai-glow": "var(--odin-ai-glow)",
        "ai-glow-strong": "var(--odin-ai-glow-strong)",
      },

      backdropBlur: {
        xs: "var(--odin-blur-xs)",
        sm: "var(--odin-blur-sm)",
        md: "var(--odin-blur-md)",
        lg: "var(--odin-blur-lg)",
        xl: "var(--odin-blur-xl)",
      },

      fontFamily: {
        sans: ["var(--odin-font-sans)"],
        mono: ["var(--odin-font-mono)"],
      },

      fontSize: {
        xs: ["var(--odin-text-xs)", { lineHeight: "var(--odin-leading-normal)" }],
        sm: ["var(--odin-text-sm)", { lineHeight: "var(--odin-leading-normal)" }],
        base: ["var(--odin-text-base)", { lineHeight: "var(--odin-leading-normal)" }],
        md: ["var(--odin-text-md)", { lineHeight: "var(--odin-leading-snug)" }],
        lg: ["var(--odin-text-lg)", { lineHeight: "var(--odin-leading-snug)" }],
        xl: ["var(--odin-text-xl)", { lineHeight: "var(--odin-leading-tight)" }],
        "2xl": ["var(--odin-text-2xl)", { lineHeight: "var(--odin-leading-tight)" }],
        "3xl": ["var(--odin-text-3xl)", { lineHeight: "var(--odin-leading-tight)" }],
        "4xl": ["var(--odin-text-4xl)", { lineHeight: "var(--odin-leading-tight)" }],
      },

      transitionDuration: {
        fast: "var(--odin-duration-fast)",
        normal: "var(--odin-duration-normal)",
        slow: "var(--odin-duration-slow)",
      },

      transitionTimingFunction: {
        standard: "var(--odin-ease-standard)",
        enter: "var(--odin-ease-enter)",
        exit: "var(--odin-ease-exit)",
      },

      /* 12 kolon master grid — 03-information-architecture.md §9.3 */
      gridTemplateColumns: {
        workspace: "repeat(12, minmax(0, 1fr))",
      },
    },
  },
  plugins: [],
};

export default config;
