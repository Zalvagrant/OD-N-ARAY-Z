/**
 * Section — workspace gövdesindeki bir bölümün çerçevesi.
 * Kaynak: 03-information-architecture.md §3 (workspace iskeleti), §10 (okuma ritmi)
 *
 * NEDEN VAR: Executive Briefing ve Mission Control birlikte 15+ bölüm taşıyor
 * ve her birinin başlığı, açıklaması, hızlı eylemi ve dört durumu
 * (yükleniyor · hata · boş · dolu) aynı. Bu çerçeve tek yerde durmazsa
 * "veri gelmeyen bölüm boş durum gösterir" kuralı 15 yerde tek tek yazılır ve
 * bir gün biri unutulur — DataGuard'ın Executive bileşenler için yaptığını
 * bu bölümler için yapar (UI-ADR-088'in aynı gerekçesi).
 *
 * Skeleton GERÇEK YERLEŞİMİ temsil eder: `loadingLayout` çağıran tarafından
 * verilir, çünkü hangi yerleşimin geleceğini yalnızca çağıran bilir.
 */

import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState, type LoadingLayout } from "@/components/ui/loading-state";
import { Heading, Text } from "@/components/ui/typography";

export interface SectionError {
  what: string;
  why: string;
  impact: string;
  fix: string;
}

export function Section({
  title,
  description,
  actions,
  loading = false,
  loadingLayout = "list",
  loadingCount = 3,
  error,
  onRetry,
  empty = false,
  emptyTitle = "Veri yok",
  emptyDescription,
  emptySuggestion,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  loadingLayout?: LoadingLayout;
  loadingCount?: number;
  error?: SectionError | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptySuggestion?: string;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0">
          <Heading level={2} size={4}>
            {title}
          </Heading>
          {description && (
            <Text size="sm" tone="secondary" className="mt-1">
              {description}
            </Text>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {loading ? (
        <LoadingState layout={loadingLayout} count={loadingCount} label={`${title} yükleniyor`} />
      ) : error ? (
        <ErrorState {...error} onRetry={onRetry} />
      ) : empty ? (
        <EmptyState
          title={emptyTitle}
          description={
            emptyDescription ?? "Bu bölümü besleyen kaynak henüz bağlı değil."
          }
          suggestion={emptySuggestion}
        />
      ) : (
        children
      )}
    </section>
  );
}
