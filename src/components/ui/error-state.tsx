"use client";

/**
 * Error Pattern — 10-component-library.md §11
 *
 * Sıra sabittir: Ne oldu → Neden oldu → Etkisi → Çözüm → [Retry].
 * "Kullanıcı hiçbir zaman sadece 'Error' görmez."
 *
 * Bu yüzden `what`, `why`, `impact`, `fix` alanları ZORUNLUDUR. Biri
 * bilinmiyorsa uydurulmaz — çağıran taraf bilmediğini açıkça yazar
 * ("Sebep henüz belirlenemedi").
 */

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  what,
  why,
  impact,
  fix,
  onRetry,
  retrying = false,
  technical,
}: {
  /** Ne oldu — kullanıcının diliyle, hata kodu değil. */
  what: string;
  /** Neden oldu */
  why: string;
  /** Etkisi — hangi veri/eylem şu an kullanılamıyor. */
  impact: string;
  /** Çözüm — kullanıcının atabileceği somut adım. */
  fix: string;
  onRetry?: () => void;
  retrying?: boolean;
  /** Geliştirici detayı — açılır, varsayılan kapalı. */
  technical?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-md border border-danger bg-danger-bg p-6"
    >
      <div className="flex items-center gap-2">
        {/* Renkten bağımsız gösterge: ikon + "Hata" kelimesi */}
        <AlertTriangle className="h-4 w-4 text-danger" aria-hidden />
        <h2 className="text-md font-medium text-content">{what}</h2>
      </div>

      <dl className="grid gap-2 text-base">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-content-tertiary">Neden</dt>
          <dd className="max-w-prose text-content-secondary">{why}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-content-tertiary">Etkisi</dt>
          <dd className="max-w-prose text-content-secondary">{impact}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-content-tertiary">Çözüm</dt>
          <dd className="max-w-prose text-content-secondary">{fix}</dd>
        </div>
      </dl>

      {technical && (
        <details className="w-full">
          <summary className="cursor-pointer text-sm text-content-tertiary">
            Teknik detay
          </summary>
          <pre className="odin-mono mt-2 max-w-full overflow-x-auto rounded-sm bg-surface p-3 text-xs text-content-secondary">
            {technical}
          </pre>
        </details>
      )}

      {onRetry && (
        <Button variant="danger" size="sm" loading={retrying} onClick={onRetry}>
          Yeniden dene
        </Button>
      )}
    </div>
  );
}
