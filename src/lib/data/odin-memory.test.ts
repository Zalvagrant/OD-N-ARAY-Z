/**
 * `/api/memory` adaptörü — GERÇEK ODIN yüküne karşı (UI-ADR-201).
 * Fixture çalışan cockpit'ten alındı (2 Ağu 2026: 2.329 öneri, 1 verdict).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptMemory, memorySchema } from "./odin-memory";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-memory.json"),
    "utf8"
  )
);

describe("gerçek /api/memory yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => memorySchema.parse(raw)).not.toThrow();
  });

  it("tetikleyici dağılımının toplamı öneri sayısına eşittir", () => {
    const m = adaptMemory(memorySchema.parse(raw));
    const toplam = m.recommendations.byTrigger.reduce(
      (s, b) => s + b.count,
      0
    );
    expect(toplam).toBe(m.recommendations.total);
  });

  it("her verdict NEYİ karara bağladığıyla birlikte gelir", () => {
    const m = adaptMemory(memorySchema.parse(raw));
    expect(m.verdicts.recent.length).toBeGreaterThan(0);
    for (const v of m.verdicts.recent) {
      expect(v.recId).toBeTruthy();
      expect(v.verdict).toBeTruthy();
    }
  });

  it("gerekçe FİLTRELENMEZ — null ise null taşınır, satır düşmez", () => {
    const parsed = memorySchema.parse(raw);
    const bozuk = {
      ...parsed,
      verdicts: {
        ...parsed.verdicts,
        recent: parsed.verdicts.recent.map((v) => ({ ...v, reason: null })),
      },
    };
    const m = adaptMemory(bozuk);
    expect(m.verdicts.recent).toHaveLength(parsed.verdicts.recent.length);
    expect(m.verdicts.recent[0].reason).toBeNull();
  });

  it("snake_case sızmaz", () => {
    const m = adaptMemory(memorySchema.parse(raw));
    expect(JSON.stringify(m)).not.toMatch(
      /rec_id|with_verdict|by_trigger|revisit_at|first_ts/
    );
  });
});
