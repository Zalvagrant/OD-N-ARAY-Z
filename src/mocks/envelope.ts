/**
 * Mock zarf üreticisi — UI-ADR-094.
 *
 * Buradan çıkan HER zarfın `meta.source` alanı `"mock"`tur. Başka bir kaynak
 * adı yazmak yasak: S8'de gerçek veriye geçerken tek arama (`source: "mock"`)
 * tüm mock'ları bulabilmelidir.
 *
 * Fonksiyon, sabit değil: `Date.now()` modül yüklenirken DEĞİL, istemcide
 * çağrıldığında okunur (bkz. use-mock.ts).
 */

import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import type { ExecutiveKPI } from "@/types/executive";

export const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
export const ahead = (ms: number) => new Date(Date.now() + ms).toISOString();

export function mockMeta(over: Partial<Omit<DataMeta, "source">> = {}): DataMeta {
  return {
    source: "mock",
    lastUpdated: ago(2 * 60_000),
    freshness: "live",
    ...over,
  };
}

export function mockEnvelope<T>(
  data: T,
  over: Partial<Omit<DataMeta, "source">> = {}
): DataEnvelope<T> {
  return { data, meta: mockMeta(over) };
}

/**
 * KPI kaydı — UI-ADR-137.
 *
 * `briefing.ts:404` ve `amazon.ts:338`te BİREBİR AYNI gövdeyle iki kez
 * yazılıydı. Tekrarın maliyeti dört satır değil, bu üç varsayılanın
 * SESSİZCE AYRILABİLMESİDİR: `status: "available"` (ADR-0143 §2 sınır
 * zarfı) · `value: null` (anti-fake — ölçüm yoksa değer yok) · `asOf`.
 * Birine dokunulup diğerine dokunulmadığı gün, iki ekran aynı sözleşmeyi
 * farklı yorumlar ve fark hiçbir testte görünmez.
 *
 * Sparkline · forecast · insight sözleşmenin PARÇASI DEĞİL, bu yüzden
 * burada da yok — anti-fake mock'ta da geçerlidir.
 */
export function mockKpi(
  over: Partial<ExecutiveKPI> & Pick<ExecutiveKPI, "id" | "label" | "unit">
): ExecutiveKPI {
  return { status: "available", value: null, asOf: ago(30 * 60_000), ...over };
}
