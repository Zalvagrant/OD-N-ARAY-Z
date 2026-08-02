/**
 * `/api/ai` adaptörü — GERÇEK ODIN yüküne karşı (UI-ADR-205).
 * Fixture çalışan cockpit'ten (2 Ağu 2026: 12 çağrı, 13 hata, maliyet null).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptAi, aiSchema } from "./odin-ai";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-ai.json"),
    "utf8"
  )
);

describe("gerçek /api/ai yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => aiSchema.parse(raw)).not.toThrow();
  });

  it("BİLİNMEYEN MALİYET NULL KALIR — 0'a çevrilmez", () => {
    const a = adaptAi(aiSchema.parse(raw));
    expect(a.costUsd).toBeNull();
    expect(a.costKnownCalls).toBe(0);
    expect(a.unknownCostCalls).toBe(a.calls);
  });

  it("model kırılımının toplamı çağrı sayısına eşittir", () => {
    const a = adaptAi(aiSchema.parse(raw));
    expect(a.byModel.reduce((s, m) => s + m.calls, 0)).toBe(a.calls);
  });

  it("model listesi çoktan aza sıralanır", () => {
    const a = adaptAi(aiSchema.parse(raw));
    const counts = a.byModel.map((m) => m.calls);
    expect(counts).toEqual([...counts].sort((x, y) => y - x));
  });

  it("son çağrılar en yeni üstte gelir", () => {
    const a = adaptAi(aiSchema.parse(raw));
    const ts = a.recent.map((c) => c.at ?? "");
    expect(ts).toEqual([...ts].sort().reverse());
  });

  it("maliyet bilinen bir çağrı geldiğinde sayaçlar ayrışır", () => {
    const parsed = aiSchema.parse(raw);
    const a = adaptAi({
      ...parsed,
      usage: { ...parsed.usage, cost_usd: 0.42, cost_known_calls: 3 },
    });
    expect(a.costUsd).toBe(0.42);
    expect(a.costKnownCalls).toBe(3);
    expect(a.unknownCostCalls).toBe(a.calls - 3);
  });

  it("anahtar İÇERİĞİ taşınmaz — yalnız ad ve varlık", () => {
    const a = adaptAi(aiSchema.parse(raw));
    expect(a.providers.length).toBeGreaterThan(0);
    for (const p of a.providers) {
      expect(Object.keys(p).sort()).toEqual(["keyPresent", "name"]);
    }
  });

  it("snake_case sızmaz", () => {
    const a = adaptAi(aiSchema.parse(raw));
    expect(JSON.stringify(a)).not.toMatch(
      /cost_usd|by_model|tokens_in|input_tokens|key_present|last_success/
    );
  });
});
