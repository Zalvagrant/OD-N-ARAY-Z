"use client";

/**
 * `/api/requests` adaptörü — ODIN `odin/requests.py` (R-006, ADR-0050).
 *
 * Gece taraması "/projects: proje varlığı core'da yok" demişti; ODIN'in
 * işi ADR-0050'den beri R-006 talep defterinde izleniyor — 129 tipli
 * satır, epic'ler altında. Proje panosu buydu, kimse okumuyordu.
 *
 * DURUM NORMALLEŞTİRİLMEZ: `status` sahibin kendi cümlesidir ve tam
 * hâliyle taşınır. `state` çekirdeğin ilk-kelime okumasıdır ve onun
 * YERİNE değil YANINDA durur — bir enum'a sıkıştırmak, defterin
 * anlattığı şeyi silmek olurdu.
 */

import { z } from "zod";

import { internalEnvelope } from "@/types/data-envelope";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

const bucketSchema = z.object({ name: z.string(), count: z.number() });

const rowSchema = z.object({
  id: z.string(),
  type: z.enum(["FR", "ER", "BR", "RR", "ACR"]),
  epic: z.string().nullable(),
  title: z.string(),
  priority: z.string().nullable(),
  status: z.string(),
  state: z.enum(["open", "done", "dropped", "unknown"]),
  closed_by: z.string().nullable(),
});

export const requestsSchema = z.object({
  generated_at: z.string(),
  available: z.boolean(),
  reason: z.string().nullable(),
  source: z.string(),
  total: z.number(),
  rows: z.array(rowSchema),
  by_epic: z.array(bucketSchema),
  by_type: z.array(bucketSchema),
  by_state: z.array(bucketSchema),
  by_priority: z.array(bucketSchema),
});

export type RequestState = "open" | "done" | "dropped" | "unknown";

export type RequestRow = {
  id: string;
  type: "FR" | "ER" | "BR" | "RR" | "ACR";
  epic: string | null;
  title: string;
  priority: string | null;
  /** Sahibin kendi cümlesi — kısaltılmaz. */
  status: string;
  /** Çekirdeğin ilk-kelime okuması — `status`un yerine geçmez. */
  state: RequestState;
  closedBy: string | null;
};

/**
 * DÖRT DURUMUN TAMAMI, sıfırlar dahil.
 *
 * `byState` bir BÖLÜNTÜDÜR: çekirdek her satırı tam olarak bir duruma
 * sayar, yani listede olmayan bir durumun sayısı GERÇEKTEN sıfırdır —
 * ölçülmemiş değil, ölçülüp sıfır bulunmuş. Bu ayrım burada, adaptörde
 * yapılır; ekranda `?? 0` yazmak aynı sonucu verirdi ama gerekçesiz
 * olurdu (repo kapısı da onu SAHTE VERİ sayıyor ve haklı).
 */
export type StateCounts = Record<RequestState, number>;

export type RequestLedger = {
  available: boolean;
  reason: string | null;
  source: string;
  total: number;
  rows: RequestRow[];
  byEpic: { name: string; count: number }[];
  byType: { name: string; count: number }[];
  byState: { name: string; count: number }[];
  stateCounts: StateCounts;
  byPriority: { name: string; count: number }[];
};

export function adaptRequests(
  raw: z.infer<typeof requestsSchema>
): RequestLedger {
  return {
    available: raw.available,
    reason: raw.reason,
    source: raw.source,
    total: raw.total,
    rows: raw.rows.map((r) => ({
      id: r.id,
      type: r.type,
      epic: r.epic,
      title: r.title,
      priority: r.priority,
      status: r.status,
      state: r.state,
      closedBy: r.closed_by,
    })),
    byEpic: raw.by_epic,
    byType: raw.by_type,
    byState: raw.by_state,
    stateCounts: {
      open: raw.by_state.find((b) => b.name === "open")?.count ?? 0,
      done: raw.by_state.find((b) => b.name === "done")?.count ?? 0,
      dropped: raw.by_state.find((b) => b.name === "dropped")?.count ?? 0,
      unknown: raw.by_state.find((b) => b.name === "unknown")?.count ?? 0,
    },
    byPriority: raw.by_priority,
  };
}

export function useOdinRequests(): OdinQueryResult<RequestLedger> {
  return useOdinQuery({
    key: ["odin", "requests"],
    module: "runtime",
    schema: z.custom<RequestLedger>(),
    load: IS_MOCK
      ? async () => loadMock("projects.requests")
      : async (signal) => {
          const raw = requestsSchema.parse(
            await httpLoad("/api/requests", { signal })
          );
          return internalEnvelope(raw.generated_at, adaptRequests(raw));
        },
  });
}
