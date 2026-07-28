/** S3 · 12 — EmptyState / ErrorState / LoadingState (10-...md §11) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { LoadingState } from "./loading-state";
import { Button } from "./button";

const meta: Meta = {
  title: "Core/12 · Empty · Error · Loading",
  parameters: { layout: "padded" },
};
export default meta;

/** Açıklama → Öneri → Örnek → Sonraki adım */
export const Empty: StoryObj = {
  render: () => (
    <EmptyState
      title="Henüz karar yok"
      description="Decision Center'da onayını bekleyen bir karar bulunmuyor."
      suggestion="Kararlar AI önerilerinden doğar; bir Director analiz ürettiğinde burada belirir."
      example="Amazon Director → ACOS artışı → Kampanya bütçesini düşür önerisi"
      nextStep={
        <Button size="sm" variant="secondary">
          Amazon Director&apos;a git
        </Button>
      }
    />
  ),
};

/** Ne oldu → Neden oldu → Etkisi → Çözüm → [Retry] */
export const Error: StoryObj = {
  render: () => (
    <ErrorState
      what="Amazon verisi alınamadı"
      why="SP-API belirteci süresi doldu."
      impact="Ciro, ACOS ve stok KPI'ları şu an güncel değil; gösterilen son değerler eski."
      fix="Settings → Veri Kaynakları altından Amazon bağlantısını yenile."
      technical="HTTP 401 · x-amzn-ErrorType: UnauthorizedException"
      onRetry={() => {}}
    />
  ),
};

export const Loading: StoryObj = {
  render: () => <LoadingState layout="card" />,
};
