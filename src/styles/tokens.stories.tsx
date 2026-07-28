/**
 * Design Token Showcase — S1 / A1.14
 * Kaynak: docs/ui_chatgpt/11-design-tokens.md
 *
 * Bu sayfa token'ları ANLATMAZ, GÖSTERİR. Kutuların rengi doğrudan
 * Tailwind semantic sınıflarından gelir; yazan değer ise tarayıcının
 * o an hesapladığı CSS değişkenidir. Yani buradaki hiçbir renk elle
 * yazılmamıştır — sapma olursa burada görünür.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { duration } from "@/animations/motion";

/** Tarayıcının hesapladığı gerçek token değeri. */
function tokenValue(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-1 text-lg font-semibold text-content">{title}</h2>
      {note && (
        <p className="mb-4 max-w-2xl text-sm text-content-secondary">{note}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Swatch({
  cls,
  label,
  varName,
}: {
  cls: string;
  label: string;
  varName: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`h-16 w-full rounded-md border border-line-subtle ${cls}`}
      />
      <div className="leading-tight">
        <div className="text-sm text-content">{label}</div>
        <div className="odin-mono text-xs text-content-tertiary">
          {tokenValue(varName) || varName}
        </div>
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{children}</div>
  );
}

const SURFACES = [
  ["bg-bg", "background.primary", "--odin-bg-primary"],
  ["bg-bg-secondary", "background.secondary", "--odin-bg-secondary"],
  ["bg-surface", "surface.default", "--odin-surface-default"],
  ["bg-surface-elevated", "surface.elevated", "--odin-surface-elevated"],
  ["bg-surface-floating", "surface.floating", "--odin-surface-floating"],
] as const;

const STATUS = [
  ["bg-danger", "danger — gerçek kriz", "--odin-danger"],
  ["bg-warning", "warning — bekleyen risk", "--odin-warning"],
  ["bg-success", "success — onay / sağlıklı", "--odin-success"],
  ["bg-info", "info — bilgi", "--odin-info"],
] as const;

const ACCENTS = [
  ["bg-ai", "accent.ai — AI üretimi", "--odin-accent-ai"],
  ["bg-accent", "accent (cyan) — dekoratif", "--odin-accent-secondary"],
  ["bg-accent-amazon", "accent.amazon", "--odin-accent-amazon"],
  ["bg-accent-finance", "accent.finance", "--odin-accent-finance"],
  ["bg-accent-trading", "accent.trading", "--odin-accent-trading"],
  ["bg-accent-knowledge", "accent.knowledge", "--odin-accent-knowledge"],
] as const;

const CHART = [
  ["bg-chart-1", "chart.series 1", "--odin-chart-series-1"],
  ["bg-chart-2", "chart.series 2", "--odin-chart-series-2"],
  ["bg-chart-3", "chart.series 3", "--odin-chart-series-3"],
  ["bg-chart-4", "chart.series 4", "--odin-chart-series-4"],
  ["bg-chart-5", "chart.series 5", "--odin-chart-series-5"],
  ["bg-chart-positive", "chart.positive", "--odin-chart-positive"],
  ["bg-chart-negative", "chart.negative", "--odin-chart-negative"],
  ["bg-chart-neutral", "chart.neutral", "--odin-chart-neutral"],
] as const;

const TEXT = [
  ["text-content", "text.primary", "--odin-text-primary"],
  ["text-content-secondary", "text.secondary", "--odin-text-secondary"],
  ["text-content-tertiary", "text.tertiary", "--odin-text-tertiary"],
  ["text-ai-text", "ai.text", "--odin-ai-text"],
] as const;

const SPACING = [
  ["w-1", "space-1", "--odin-space-1"],
  ["w-2", "space-2", "--odin-space-2"],
  ["w-3", "space-3", "--odin-space-3"],
  ["w-4", "space-4", "--odin-space-4"],
  ["w-5", "space-5", "--odin-space-5"],
  ["w-6", "space-6", "--odin-space-6"],
  ["w-8", "space-8", "--odin-space-8"],
  ["w-10", "space-10", "--odin-space-10"],
  ["w-12", "space-12", "--odin-space-12"],
  ["w-16", "space-16", "--odin-space-16"],
  ["w-20", "space-20", "--odin-space-20"],
  ["w-24", "space-24", "--odin-space-24"],
  ["w-32", "space-32", "--odin-space-32"],
] as const;

const RADIUS = [
  ["rounded-xs", "radius-2", "--odin-radius-2"],
  ["rounded-sm", "radius-4", "--odin-radius-4"],
  ["rounded", "radius-8 (DEFAULT)", "--odin-radius-8"],
  ["rounded-md", "radius-12", "--odin-radius-12"],
  ["rounded-lg", "radius-16", "--odin-radius-16"],
  ["rounded-xl", "radius-20", "--odin-radius-20"],
  ["rounded-2xl", "radius-24", "--odin-radius-24"],
  ["rounded-3xl", "radius-32", "--odin-radius-32"],
] as const;

const ELEVATION = [
  ["shadow-e1", "elevation 1"],
  ["shadow-e2", "elevation 2"],
  ["shadow-e3", "elevation 3"],
  ["shadow-e4", "elevation 4"],
  ["shadow-overlay", "elevation overlay"],
  ["shadow-modal", "elevation modal"],
] as const;

const TYPE_SCALE = [
  ["text-xs", "xs", "--odin-text-xs"],
  ["text-sm", "sm", "--odin-text-sm"],
  ["text-base", "base", "--odin-text-base"],
  ["text-md", "md", "--odin-text-md"],
  ["text-lg", "lg", "--odin-text-lg"],
  ["text-xl", "xl", "--odin-text-xl"],
  ["text-2xl", "2xl", "--odin-text-2xl"],
  ["text-3xl", "3xl", "--odin-text-3xl"],
  ["text-4xl", "4xl — hero KPI", "--odin-text-4xl"],
] as const;

function DesignTokens() {
  return (
    <div className="min-h-screen bg-bg p-8 text-content">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-wide text-content-tertiary">
          ODIN · Design System
        </p>
        <h1 className="text-2xl font-semibold">Design Tokens — Executive Dark</h1>
        <p className="mt-2 max-w-2xl text-base text-content-secondary">
          Dört katman: Primitive → Semantic → Component → Runtime Theme.
          Hiçbir bileşen primitive token kullanmaz. Aşağıdaki değerler
          tarayıcıdan okunur, koda yazılmamıştır.
        </p>
      </header>

      <Section
        title="Yüzey ve arka plan"
        note="Çerçeve ve içerik sakin kalır (UI-ADR-069). Yükseklik arttıkça yüzey açılır."
      >
        <Grid>
          {SURFACES.map(([cls, label, v]) => (
            <Swatch key={label} cls={cls} label={label} varName={v} />
          ))}
        </Grid>
      </Section>

      <Section
        title="Durum renkleri"
        note="Kırmızı YALNIZCA gerçek krizde. Önemli ama kriz olmayan şey amberdir. Kırmızı enflasyonu gerçek krizi görünmez yapar."
      >
        <Grid>
          {STATUS.map(([cls, label, v]) => (
            <Swatch key={label} cls={cls} label={label} varName={v} />
          ))}
        </Grid>
      </Section>

      <Section
        title="Aksan renkleri"
        note="Turuncu ikincil aksan olarak kullanılmaz (UI-ADR-084) — warning ile karışırdı. İkincil aksan cyan #00D4FF."
      >
        <Grid>
          {ACCENTS.map(([cls, label, v]) => (
            <Swatch key={label} cls={cls} label={label} varName={v} />
          ))}
        </Grid>
      </Section>

      <Section
        title="Grafik renkleri"
        note="chart.positive / negative, success / danger'dan daha yumuşaktır — her düşen çizgi kriz gibi görünmesin."
      >
        <Grid>
          {CHART.map(([cls, label, v]) => (
            <Swatch key={label} cls={cls} label={label} varName={v} />
          ))}
        </Grid>
      </Section>

      <Section title="Metin renkleri">
        <div className="space-y-3 rounded-md border border-line bg-surface p-6">
          {TEXT.map(([cls, label, v]) => (
            <div key={label} className="flex items-baseline justify-between">
              <span className={`text-md ${cls}`}>
                Karar verilecek bir şey var — {label}
              </span>
              <span className="odin-mono text-xs text-content-tertiary">
                {tokenValue(v) || v}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Spacing"
        note="Temel birim 8px, mikro hizalama 4px. Tailwind'de yalnızca bu ölçek açıktır."
      >
        <div className="space-y-2">
          {SPACING.map(([cls, label, v]) => (
            <div key={label} className="flex items-center gap-4">
              <span className="odin-mono w-24 text-xs text-content-tertiary">
                {label}
              </span>
              <div className={`h-2 rounded-xs bg-ai ${cls}`} />
              <span className="odin-mono text-xs text-content-tertiary">
                {tokenValue(v) || v}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius">
        <div className="flex flex-wrap gap-4">
          {RADIUS.map(([cls, label, v]) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div
                className={`h-16 w-16 border border-line bg-surface-elevated ${cls}`}
              />
              <span className="text-xs text-content-secondary">{label}</span>
              <span className="odin-mono text-xs text-content-tertiary">
                {tokenValue(v) || v}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Elevation"
        note="Shadow + Blur + Border + Glow birleşimi. Bir ekranda en fazla 3 adet Level 3+ yüzey — yüksek blur doğrudan FPS'i düşürür."
      >
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          {ELEVATION.map(([cls, label]) => (
            <div
              key={label}
              className={`flex h-24 items-center justify-center rounded-md bg-surface-elevated text-sm text-content-secondary ${cls}`}
            >
              {label}
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Glass"
        note="Cam YALNIZCA overlay katmanında: modal, drawer, command palette. Üst üste en fazla 2 katman; glass-heavy ekranda en fazla 1 kez."
      >
        <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="odin-glass-medium rounded-md p-6">
              <div className="text-sm text-content">.odin-glass-medium</div>
              <div className="text-xs text-content-secondary">
                drawer, context panel
              </div>
            </div>
            <div className="odin-glass-modal rounded-md p-6">
              <div className="text-sm text-content">.odin-glass-modal</div>
              <div className="text-xs text-content-secondary">
                modal, command palette
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Typography"
        note="Veri yoğun arayüzde taban 14px. En kritik karar tabular-nums: sayılar sütunda hizalanmazsa hiçbir tablo okunmaz."
      >
        <div className="space-y-3 rounded-md border border-line bg-surface p-6">
          {TYPE_SCALE.map(([cls, label, v]) => (
            <div key={label} className="flex items-baseline gap-6">
              <span className="odin-mono w-24 shrink-0 text-xs text-content-tertiary">
                {label} · {tokenValue(v) || v}
              </span>
              <span className={cls}>ODIN Executive Intelligence</span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-md border border-line bg-surface p-6">
            <div className="mb-3 text-sm text-content-secondary">
              .odin-num — tabular-nums + sağa hizalı
            </div>
            <table className="w-full text-base">
              <tbody>
                {[
                  ["Net satış", "1.284.930,45"],
                  ["Reklam", "92.104,00"],
                  ["Brüt kâr", "418,70"],
                  ["İade", "11,09"],
                ].map(([k, val]) => (
                  <tr key={k} className="border-t border-line-subtle">
                    <td className="py-2 text-content-secondary">{k}</td>
                    <td className="odin-num py-2">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-md border border-line bg-surface p-6">
            <div className="mb-3 text-sm text-content-secondary">
              .odin-mono — SKU, ID, kod
            </div>
            <div className="odin-mono space-y-1 text-base">
              <div>LLU-HA-2200-BEIGE</div>
              <div>B0CX9F2L7Q</div>
              <div>ODIN-A-0118</div>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="AI token'ları"
        note="AI bölgeleri belirgin mor glow alır; çerçeve ve içerik sakin kalır. Kullanıcı bir bilginin AI üretimi mi ham veri mi olduğunu bir bakışta anlamalıdır."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="odin-ai-region p-6">
            <div className="mb-2 text-sm font-medium text-ai-text">
              .odin-ai-region
            </div>
            <p className="text-base text-content-secondary">
              AI üretimi içerik bu bölgede yaşar. Ham metrikle görsel olarak
              karışmaz.
            </p>
          </div>
          <div className="rounded-md border border-line bg-surface p-6 shadow-ai-glow-strong">
            <div className="mb-2 text-sm font-medium text-content">
              shadow-ai-glow-strong
            </div>
            <p className="text-base text-content-secondary">
              Aktif AI işlemi sırasında kullanılır — gerçekten bir şey
              çalışıyorsa.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Swatch cls="bg-ai" label="ai.accent" varName="--odin-ai-accent" />
          <Swatch
            cls="bg-ai-processing"
            label="ai.processing"
            varName="--odin-ai-processing"
          />
          <Swatch
            cls="bg-ai-streaming"
            label="ai.streaming"
            varName="--odin-ai-streaming"
          />
          <Swatch
            cls="bg-ai-surface"
            label="ai.surface"
            varName="--odin-ai-surface"
          />
        </div>
      </Section>

      <Section
        title="Motion"
        note="Animasyon yalnızca 4 amaç için: Context Change · Focus · Feedback · State Transition. Hiçbir geçiş 400ms'i aşmaz. prefers-reduced-motion açıkken süreler 1ms'ye düşer — hareket kalkar, bilgi kalkmaz."
      >
        <div className="space-y-2 rounded-md border border-line bg-surface p-6">
          {(
            [
              ["fast", "--odin-duration-fast", duration.fast],
              ["normal", "--odin-duration-normal", duration.normal],
              ["slow", "--odin-duration-slow", duration.slow],
            ] as const
          ).map(([label, v, sec]) => (
            <div key={label} className="flex items-baseline gap-6 text-sm">
              <span className="odin-mono w-24 text-content-tertiary">
                {label}
              </span>
              <span className="text-content">CSS: {tokenValue(v) || v}</span>
              <span className="text-content-secondary">
                motion.ts: {sec}s
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

const meta = {
  title: "Design System/Design Tokens",
  component: DesignTokens,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DesignTokens>;

export default meta;

export const ExecutiveDark: StoryObj<typeof meta> = {};
