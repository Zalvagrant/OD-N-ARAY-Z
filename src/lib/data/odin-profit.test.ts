/**
 * `/api/state.contribution_margin` adaptörü — GERÇEK yüke karşı
 * (UI-ADR-204). Fixture çalışan cockpit'ten (2 Ağu 2026).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptProfit, profitStateSchema } from "./odin-state";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-state-profit.json"),
    "utf8"
  )
);

describe("gerçek kâr zinciri yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => profitStateSchema.parse(raw)).not.toThrow();
  });

  it("YAYINLANAN tutar ile YAYINLANAN yüzde birbirini doğrular", () => {
    const p = adaptProfit(profitStateSchema.parse(raw))!;
    /* `toBe` DEĞİL: 70246.54 - 34414.62 float'ta 35831.91999999999 verir —
       çekirdeğin yuvarlayarak yayınlamasının sebebi tam olarak bu. */
    expect(p.grossProfit).toBeCloseTo(p.revenue - p.cogs, 2);
    expect(p.contribution).toBeCloseTo(p.revenue - p.cogs - p.fees, 2);
    expect((100 * p.contribution!) / p.revenue).toBeCloseTo(p.marginPct, 1);
  });

  it("hariç tutulanlar taşınır — 'net kâr' iddiası yok", () => {
    const p = adaptProfit(profitStateSchema.parse(raw))!;
    expect(p.excludes).toContain("refunds");
    expect(p.excludes).toContain("advertising");
  });

  it("eski çekirdek tutarı yayınlamazsa arayüz TÜRETMEZ, null bırakır", () => {
    const parsed = profitStateSchema.parse(raw);
    const eski = {
      ...parsed,
      contribution_margin: {
        ...parsed.contribution_margin!,
        gross_profit: undefined,
        contribution: undefined,
      },
    };
    const p = adaptProfit(eski)!;
    expect(p.grossProfit).toBeNull();
    expect(p.contribution).toBeNull();
    /* Yüzdeler hâlâ çekirdekten gelir — kayıp olan yalnız tutar. */
    expect(p.marginPct).toBe(parsed.contribution_margin!.margin_pct);
  });

  it("kayıt yoksa null döner — sıfır değil", () => {
    const parsed = profitStateSchema.parse(raw);
    expect(adaptProfit({ ...parsed, contribution_margin: null })).toBeNull();
  });

  it("snake_case sızmaz", () => {
    const p = adaptProfit(profitStateSchema.parse(raw))!;
    expect(JSON.stringify(p)).not.toMatch(
      /gross_profit|margin_pct|asins_matched|declared_from/
    );
  });
});
