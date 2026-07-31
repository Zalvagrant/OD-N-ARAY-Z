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
import { IS_MOCK } from "./mode";
import { goalSchema } from "./schemas";
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
