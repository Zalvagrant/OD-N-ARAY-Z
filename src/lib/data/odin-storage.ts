"use client";

/**
 * `/api/storage` adaptörü — ODIN `odin/storage.py`.
 *
 * Kendi ucu var çünkü envanter veri dizinindeki her dosyayı sayıyor
 * (~3.000) ve `/api/state`i her açık ekran yokluyor. `/api/amazon` ile
 * aynı gerekçe.
 *
 * HESAP YOK: bayt, dosya sayısı, açıklık ve bayt/gün ODIN'in ÖLÇTÜĞÜ
 * değerlerdir. Arayüz "şu kadar gün sonra dolar" gibi bir projeksiyon
 * TÜRETMEZ — ölçülen büyüme hızıyla ölçülen boş alan yan yana durur,
 * hüküm sahibindir.
 */

import { z } from "zod";

import { internalEnvelope } from "@/types/data-envelope";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

const entrySchema = z.object({
  name: z.string(),
  kind: z.enum(["dir", "file"]),
  files: z.number(),
  bytes: z.number(),
});

/** Bir ekleme-yalnız günlüğün ÖLÇÜLEN büyümesi. `bytes_per_day` bir saatten
 *  kısa gözlemde `null` gelir — çekirdek orada da tahmin etmiyor. */
const logSchema = z.object({
  name: z.string(),
  bytes: z.number(),
  first_ts: z.string().nullable(),
  last_ts: z.string().nullable(),
  span_days: z.number().nullable(),
  bytes_per_day: z.number().nullable(),
});

export const storageSchema = z.object({
  generated_at: z.string(),
  data_dir: z.string(),
  total_bytes: z.number(),
  total_files: z.number(),
  entries: z.array(entrySchema),
  logs: z.array(logSchema),
  disk: z.object({
    total_bytes: z.number(),
    free_bytes: z.number(),
    used_pct: z.number(),
  }),
});

export type StorageEntry = {
  name: string;
  kind: "dir" | "file";
  files: number;
  bytes: number;
};

export type StorageLog = {
  name: string;
  bytes: number;
  firstAt: string | null;
  lastAt: string | null;
  spanDays: number | null;
  bytesPerDay: number | null;
};

export type StorageInventory = {
  dataDir: string;
  totalBytes: number;
  totalFiles: number;
  entries: StorageEntry[];
  logs: StorageLog[];
  disk: { totalBytes: number; freeBytes: number; usedPct: number };
};

export function adaptStorage(
  raw: z.infer<typeof storageSchema>
): StorageInventory {
  return {
    dataDir: raw.data_dir,
    totalBytes: raw.total_bytes,
    totalFiles: raw.total_files,
    entries: raw.entries,
    logs: raw.logs.map((l) => ({
      name: l.name,
      bytes: l.bytes,
      firstAt: l.first_ts,
      lastAt: l.last_ts,
      spanDays: l.span_days,
      bytesPerDay: l.bytes_per_day,
    })),
    disk: {
      totalBytes: raw.disk.total_bytes,
      freeBytes: raw.disk.free_bytes,
      usedPct: raw.disk.used_pct,
    },
  };
}

export function useOdinStorage(): OdinQueryResult<StorageInventory> {
  return useOdinQuery({
    key: ["odin", "storage"],
    module: "runtime",
    schema: z.custom<StorageInventory>(),
    load: IS_MOCK
      ? async () => loadMock("system.storage")
      : async (signal) => {
          const raw = storageSchema.parse(
            await httpLoad("/api/storage", { signal })
          );
          return internalEnvelope(raw.generated_at, adaptStorage(raw));
        },
  });
}
