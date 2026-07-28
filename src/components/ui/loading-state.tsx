/**
 * Loading Pattern — 10-component-library.md §11, 12-motion-system.md §7
 *
 * Spinner değil, SKELETON. Skeleton gerçek yerleşimi temsil eder; içerik
 * geldiğinde layout shift oluşmaz.
 *
 * `layout` prop'u hangi yerleşimin beklendiğini söyler. Yeni bir yerleşim
 * gerekirse buraya eklenir — bileşenlerin içine dağıtılmaz.
 */

import { Skeleton, SkeletonText, SkeletonRegion } from "@/components/ui/skeleton";

export type LoadingLayout = "text" | "card" | "list" | "kpi";

export function LoadingState({
  layout = "text",
  count = 3,
  label = "Yükleniyor",
}: {
  layout?: LoadingLayout;
  count?: number;
  label?: string;
}) {
  return (
    <SkeletonRegion label={label}>
      {layout === "text" && <SkeletonText lines={count} />}

      {layout === "card" && (
        <div className="rounded-md border border-line bg-surface p-6">
          <Skeleton className="mb-4 h-5 w-1/3" />
          <SkeletonText lines={count} />
        </div>
      )}

      {layout === "list" && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: count }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-sm border border-line-subtle p-3"
            >
              <Skeleton className="h-6 w-6" rounded="rounded-full" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      )}

      {layout === "kpi" && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: count }, (_, i) => (
            <div
              key={i}
              className="rounded-md border border-line bg-surface p-4"
            >
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="mt-3 h-8 w-1/2" />
              <Skeleton className="mt-3 h-6 w-full" />
            </div>
          ))}
        </div>
      )}
    </SkeletonRegion>
  );
}
