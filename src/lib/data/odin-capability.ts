"use client";

/**
 * `/api/capabilities` adaptörü — ODIN `odin/capability.py`.
 *
 * NEDEN VAR (gavadolar 2/2): veri kaynağı olmayan hedeflerin gerekçesi
 * arayüzde rota başına ELLE yazılıyordu. Bu, raf ömrü uzun bir yalandır:
 * kaynak indiği gün ekran aynı cümleyi söylemeye devam eder ve kimse
 * fark etmez. Artık gerekçe ÇEKİRDEKTE, gerçek bir probdan üretiliyor;
 * bu dosya onu taşır, YAZMAZ.
 *
 * `evidence` bu sözleşmenin en önemli alanı: iddianın neye bakılarak
 * yapıldığı ekranda durur, yani sahibi gerekçeyi DENETLEYEBİLİR.
 */

import { z } from "zod";

import { internalEnvelope } from "@/types/data-envelope";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

const capabilitySchema = z.object({
  id: z.string(),
  label: z.string(),
  route: z.string(),
  available: z.boolean(),
  reason: z.string().nullable(),
  requires: z.string().nullable(),
  evidence: z.array(z.string()),
  measured_at: z.string(),
});

export const capabilitiesSchema = z.object({
  generated_at: z.string(),
  capabilities: z.array(capabilitySchema),
});

export type Capability = {
  id: string;
  label: string;
  route: string;
  available: boolean;
  reason: string | null;
  requires: string | null;
  evidence: string[];
  measuredAt: string;
};

export function adaptCapabilities(
  raw: z.infer<typeof capabilitiesSchema>
): Capability[] {
  return raw.capabilities.map((c) => ({
    id: c.id,
    label: c.label,
    route: c.route,
    available: c.available,
    reason: c.reason,
    requires: c.requires,
    evidence: c.evidence,
    measuredAt: c.measured_at,
  }));
}

/**
 * TEK yetenek. Anahtar `id` içerir, yani dört ekran dört ayrı
 * önbellek girdisi kullanır ama tek uç noktayı paylaşır.
 */
export function useOdinCapability(
  id: string
): OdinQueryResult<Capability | null> {
  return useOdinQuery({
    key: ["odin", "capability", id],
    module: "runtime",
    schema: z.custom<Capability | null>(),
    load: IS_MOCK
      ? async () => loadMock("system.capability")
      : async (signal) => {
          const raw = capabilitiesSchema.parse(
            await httpLoad(`/api/capabilities?id=${encodeURIComponent(id)}`, {
              signal,
            })
          );
          /* Çekirdek tanımadığı bir id için BOŞ liste döner ve arayüz de
             kayıt UYDURMAZ: null, "böyle bir yetenek tanımlı değil"
             demektir ve ekran bunu ayrı bir durum olarak gösterir. */
          return internalEnvelope(
            raw.generated_at,
            adaptCapabilities(raw)[0] ?? null
          );
        },
  });
}
