"use client";

/**
 * `/api/state` adaptörü — S8 (UI-ADR-124).
 *
 * ODIN'in cockpit'i tek bir büyük projeksiyon yayınlar (`/api/state`, ~117 KB,
 * 30 anahtar) ve o yükün **zarfı yoktur**: ham alanlar döner. Bu modül onu
 * arayüzün zarf sözleşmesine sokar. Adaptör KATMANI burasıdır; ekranlar ham
 * ODIN yükünü hiç görmez.
 *
 * NE YAPMAZ: hesap. Oran, skor, ilerleme türetmez. Alanı olmayan bir şeyi
 * "hesaplayıp" göstermek, arayüzün icat etmesi demektir.
 */

import { z } from "zod";

import type { DataEnvelope } from "@/types/data-envelope";
import { httpLoad } from "./client";
import { contractError } from "./errors";
import { IS_MOCK } from "./mode";
import { goalSchema, runtimeDirectorSchema } from "./schemas";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

export type Goal = z.infer<typeof goalSchema>;

/** `/api/state`in bu adaptörün OKUDUĞU kısmı — gerisi görmezden gelinir. */
export const stateSchema = z.object({
  generated_at: z.string(),
  goals: z.array(
    z.object({
      id: z.string(),
      level: z.string(),
      label: z.string(),
      target: z.string(),
      progress_pct: z.number().nullable(),
    })
  ),
});

/**
 * Ham `/api/state` → zarf.
 *
 * `source: "internal"` çünkü veri SP-API'den DEĞİL, ODIN'in kendi
 * projeksiyonundan geliyor (`DataSource` union'ında tanımlı değer).
 * `freshness` burada yazılmaz: `parseEnvelope` onu `lastUpdated`tan
 * modül eşiğine göre İSTEMCİDE hesaplar (UI-ADR-115) — adaptörün
 * "live" damgalaması yanıltıcı olurdu.
 */
function envelope<T>(generatedAt: string, data: T): DataEnvelope<T> {
  return {
    data,
    meta: { source: "internal", lastUpdated: generatedAt, freshness: "live" },
  };
}

/** snake_case → camelCase. Değer DÖNÜŞTÜRÜLMEZ, yalnız yeniden adlandırılır. */
export function adaptGoals(raw: z.infer<typeof stateSchema>) {
  return raw.goals.map((g) => ({
    id: g.id,
    level: g.level,
    label: g.label,
    target: g.target,
    progressPct: g.progress_pct,
  }));
}

/**
 * ODIN'in hedefleri — arayüzdeki İLK canlı ODIN verisi.
 *
 * Mock modda ODIN'e HİÇ gidilmez; gerçek modda mock'a hiç bakılmaz. İki yol
 * asla karışmaz: aynı ekranda gerçek ve sahte sayıların yan yana durması,
 * sahte verinin en tehlikeli hâlidir.
 */
export function useOdinGoals(): OdinQueryResult<Goal[]> {
  return useOdinQuery({
    key: ["odin", "goals"],
    module: "default",
    schema: z.array(goalSchema),
    load: IS_MOCK
      ? async () => loadMock("goals.items")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = stateSchema.parse(raw);
          return envelope(parsed.generated_at, adaptGoals(parsed));
        },
  });
}

/* --------------------------------------------------------------------------
   Directors — ODIN ADR-0148 (UI-ADR-127)
   -------------------------------------------------------------------------- */

/**
 * ODIN'in `directors` yayını — zamanlanmış runtime işlerinin, her işin
 * KENDİ beyan ettiği agent'a göre gruplanmış sağlığı.
 *
 * Adaptör YOK: ODIN zaten camelCase ve kanonik şekilde yayınlıyor
 * (ADR-0148 sözleşmeyi bu şekilde dondurdu). Yeniden adlandırma bile
 * gerekmiyor — yalnız doğrulama.
 *
 * Hüküm (`status`) ODIN'de hesaplanır. Arayüz eşik TUTMAZ: eski
 * "beatIntervalMs × 3" kuralı UI icadıydı ve UI-ADR-111 ile kaldırıldı.
 */
const directorsStateSchema = z.object({
  generated_at: z.string(),
  /* ODIN okunamayan sağlık durumunu `null` yayınlar — boş dizi DEĞİL.
     "Okuyamadım" ile "hiç direktör yok" aynı şey değildir. */
  directors: z.array(runtimeDirectorSchema).nullable(),
});

export type RuntimeDirectorParsed = z.infer<typeof runtimeDirectorSchema>;

export function useOdinDirectors(): OdinQueryResult<RuntimeDirectorParsed[]> {
  return useOdinQuery({
    key: ["odin", "directors"],
    module: "default",
    schema: z.array(runtimeDirectorSchema),
    load: IS_MOCK
      ? async () => loadMock("briefing.directors.runtime")
      : async (signal) => {
          const raw = await httpLoad("/api/state", { signal });
          const parsed = directorsStateSchema.parse(raw);
          if (parsed.directors === null) {
            /* Fail-closed: ODIN sağlık durumunu okuyamadığını söylüyor.
               Boş dizi göstermek "hiçbir direktör yok" iddiası olurdu.

               `OdinError` olarak atılır: düz `Error` atıldığında
               `classifyError` bunu "unknown" dalına düşürüyordu ve
               kullanıcı, sebebi TAM OLARAK bilinen bir durum için
               "kaynağı sınıflandırılamadı" görüyordu. */
            throw contractError(
              "/api/state",
              "directors alanı null — ODIN direktör sağlığını okuyamadığını bildirdi."
            );
          }
          return envelope(parsed.generated_at, parsed.directors);
        },
  });
}
