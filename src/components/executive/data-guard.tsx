/**
 * DataGuard — anti-fake kuralının TEK uygulama noktası. UI-ADR-088.
 *
 * NEDEN SARMALAYICI, NEDEN HOOK DEĞİL:
 * Bir hook ("useEnvelope") çağrılmayı unutulabilir ve unutulduğunda hiçbir
 * şey bağırmaz. DataGuard ise bileşenin TEK public çıkışıdır: içerideki
 * `*View` bileşeni `env` değil, doğrulanmış `data` alır — yani zarfı
 * atlamak tip seviyesinde mümkün değildir.
 *
 * Kural (CLAUDE.md §2): veri yoksa "veri yok" gösterilir, placeholder değil.
 */

import type { ReactNode } from "react";
import { canRender, type DataEnvelope, type DataMeta } from "@/types/data-envelope";
import { NoData } from "@/components/ui/no-data";

export function DataGuard<T>({
  env,
  reason,
  fallback,
  children,
}: {
  env: DataEnvelope<T> | null | undefined;
  /** Neden veri yok — kullanıcıya gösterilir, uydurulmaz. */
  reason?: string;
  /** NoData yerine daha zengin bir boş durum (EmptyState vb.) gerekiyorsa. */
  fallback?: ReactNode;
  children: (data: T, meta: DataMeta) => ReactNode;
}) {
  if (!canRender(env)) {
    return <>{fallback ?? <NoData reason={reason} />}</>;
  }
  /* canRender true → env, data ve meta kesin var. */
  const safe = env as DataEnvelope<T>;
  return <>{children(safe.data, safe.meta)}</>;
}
