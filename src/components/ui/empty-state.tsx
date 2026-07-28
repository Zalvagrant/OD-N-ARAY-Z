/**
 * Empty Pattern — 10-component-library.md §11
 *
 * Sıra sabittir: Açıklama → Öneri → Örnek → Sonraki adım.
 * "Boş ekran olmaz." Kullanıcı ne olduğunu ve ne yapacağını her zaman bilir.
 */
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  suggestion,
  example,
  nextStep,
}: {
  title: string;
  description: string;
  suggestion?: string;
  example?: string;
  nextStep?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-line bg-surface p-6">
      <h2 className="text-md font-medium text-content">{title}</h2>
      <p className="max-w-prose text-base text-content-secondary">
        {description}
      </p>
      {suggestion && (
        <p className="max-w-prose text-base text-content-secondary">
          {suggestion}
        </p>
      )}
      {example && (
        <p className="odin-mono max-w-prose text-sm text-content-tertiary">
          {example}
        </p>
      )}
      {nextStep && <div className="pt-2">{nextStep}</div>}
    </div>
  );
}
