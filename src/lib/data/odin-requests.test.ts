/**
 * `/api/requests` adaptörü — GERÇEK ODIN yüküne karşı (UI-ADR-208).
 * Fixture çalışan cockpit'ten (2 Ağu 2026: 129 talep, 7 epic).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptRequests, requestsSchema } from "./odin-requests";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-requests.json"),
    "utf8"
  )
);

describe("gerçek /api/requests yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => requestsSchema.parse(raw)).not.toThrow();
  });

  it("her dağılımın toplamı talep sayısına eşittir", () => {
    const l = adaptRequests(requestsSchema.parse(raw));
    for (const b of [l.byEpic, l.byType, l.byState, l.byPriority]) {
      expect(b.reduce((s, x) => s + x.count, 0)).toBe(l.total);
    }
    expect(l.rows).toHaveLength(l.total);
  });

  it("DURUM METNİ KISALTILMAZ — sahibin cümlesi tam taşınır", () => {
    const l = adaptRequests(requestsSchema.parse(raw));
    const uzun = l.rows.filter((r) => r.status.length > 40);
    expect(uzun.length).toBeGreaterThan(0);
    const ham = requestsSchema.parse(raw);
    for (const r of l.rows) {
      const kaynak = ham.rows.find((x) => x.id === r.id)!;
      expect(r.status).toBe(kaynak.status);
    }
  });

  it("state yalnız çekirdeğin sözlüğünden gelir", () => {
    const l = adaptRequests(requestsSchema.parse(raw));
    for (const r of l.rows) {
      expect(["open", "done", "dropped", "unknown"]).toContain(r.state);
    }
  });

  it("her satırın kimliği ve tipi var — izlenebilirlik (ADR-0050)", () => {
    const l = adaptRequests(requestsSchema.parse(raw));
    for (const r of l.rows) {
      expect(r.id).toMatch(/^(FR|ER|BR|RR|ACR)-\d{4}$/);
      expect(r.type).toBeTruthy();
    }
  });

  it("snake_case sızmaz", () => {
    const l = adaptRequests(requestsSchema.parse(raw));
    expect(JSON.stringify(l)).not.toMatch(/closed_by|by_epic|by_state/);
  });
});
