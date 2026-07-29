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
