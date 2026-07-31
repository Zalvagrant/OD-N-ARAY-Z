/**
 * `/api/state` adaptörü — GERÇEK ODIN yüküne karşı (UI-ADR-124).
 *
 * NEDEN FIXTURE, NEDEN ELLE YAZILMIŞ ÖRNEK DEĞİL: `api-state-goals.json`
 * çalışan cockpit'ten (`GET /api/state`, 31 Tem 2026) DOĞRUDAN alındı.
 * "Geçerli sandığımız" bir örnek, sözleşme kaymasını yakalayamaz — ODIN
 * alan adını değiştirirse elle yazılmış örnek de bizimle birlikte yanlış
 * kalırdı.
 *
 * Bu test, tarayıcı doğrulamasının YERİNE GEÇMEZ; ama ekranı tarayıcıda
 * doğrulayamadığım oturumda boruyu uçtan uca ölçen tek kapıdır.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

import { adaptGoals, stateSchema } from "./odin-state";
import { goalSchema } from "./schemas";

const raw = JSON.parse(
  readFileSync(join(process.cwd(), "src/lib/data/__fixtures__/api-state-goals.json"), "utf8")
);

describe("gerçek /api/state yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => stateSchema.parse(raw)).not.toThrow();
  });

  it("dönüştürülen hedefler KANONİK goalSchema'dan geçer", () => {
    /* Zincirin tamamı: ham ODIN → stateSchema → adaptGoals → goalSchema.
       Halkalardan biri koparsa ekran veri gösteremez. */
    const goals = adaptGoals(stateSchema.parse(raw));
    expect(() => z.array(goalSchema).parse(goals)).not.toThrow();
    expect(goals.length).toBeGreaterThan(0);
  });

  it("ÖLÇÜLEN ilerleme ile ölçülmeyen AYRI kalır — 0'a düşmez", () => {
    const goals = adaptGoals(stateSchema.parse(raw));
    const olculen = goals.filter((g) => g.progressPct !== null);
    const olculmeyen = goals.filter((g) => g.progressPct === null);

    /* Gerçek veride ikisi de var; biri kaybolursa fixture bayatlamıştır. */
    expect(olculen.length).toBeGreaterThan(0);
    expect(olculmeyen.length).toBeGreaterThan(0);

    /* KRİTİK: `null` asla `0`'a çevrilmemeli. `0` "ölçüldü ve sıfır"dır;
       ölçülmeyen hedefi öyle göstermek uydurma veridir (ADR-0143 §4). */
    expect(olculmeyen.every((g) => g.progressPct === null)).toBe(true);
  });

  it("level değerleri ODIN'in sözlüğünden — UI yeni seviye icat etmez", () => {
    const goals = adaptGoals(stateSchema.parse(raw));
    for (const g of goals) {
      expect(["urgent", "weekly", "quarterly"]).toContain(g.level);
    }
  });

  it("snake_case alan adı sızmaz — dönüşüm gerçekten yapılıyor", () => {
    const goals = adaptGoals(stateSchema.parse(raw));
    expect(goals[0]).toHaveProperty("progressPct");
    expect(goals[0]).not.toHaveProperty("progress_pct");
  });
});
