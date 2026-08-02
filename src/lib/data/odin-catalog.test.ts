/**
 * `/api/catalog` adaptörü — GERÇEK ODIN yüküne karşı (UI-ADR-203).
 * Fixture çalışan cockpit'ten (2 Ağu 2026: 42 ASIN + 42 iade satırı).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptListings, adaptReturns, catalogSchema } from "./odin-catalog";
import { toPercentUnit } from "@/lib/format/percent";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-catalog.json"),
    "utf8"
  )
);

describe("gerçek /api/catalog yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => catalogSchema.parse(raw)).not.toThrow();
  });

  it("listing satır sayısı kaydın beyan ettiği ASIN sayısına eşit", () => {
    const l = adaptListings(catalogSchema.parse(raw));
    expect(l.rows).toHaveLength(l.asinCount!);
    expect(l.recordId).toMatch(/^KO-amazon-asin-catalog-/);
  });

  it("İADE ORANI ÖLÇEĞİ BEYANDAN: 0,0922 → %9,22, %922 DEĞİL", () => {
    const r = adaptReturns(catalogSchema.parse(raw));
    expect(r.refundRateScale).toBe("0-1");
    const unit = toPercentUnit(r.total!.refundRate, r.refundRateScale);
    expect(unit! * 100).toBeCloseTo(9.22, 2);
  });

  it("beyan edilmemiş ölçek sayıyı BASTIRMAZ — null döner", () => {
    const parsed = catalogSchema.parse(raw);
    const beyansiz = {
      ...parsed,
      returns: { ...parsed.returns, refund_rate_scale: "belirsiz" },
    };
    const r = adaptReturns(beyansiz);
    expect(r.refundRateScale).toBeUndefined();
    expect(toPercentUnit(r.total!.refundRate, r.refundRateScale)).toBeNull();
  });

  it('"Total" satırı ürün listesinde YOK — iki kez sayılmaz', () => {
    const r = adaptReturns(catalogSchema.parse(raw));
    expect(r.total).not.toBeNull();
    expect(r.rows.some((x) => x.productGroup === "Total")).toBe(false);
  });

  it("iade satırları en yüksek oran üstte gelir", () => {
    const r = adaptReturns(catalogSchema.parse(raw));
    const rates = r.rows.map((x) => x.refundRate ?? 0);
    expect(rates).toEqual([...rates].sort((a, b) => b - a));
  });

  it("kayıt yoksa fail-closed VE gerekçeli — arayüz metin uydurmaz", () => {
    const parsed = catalogSchema.parse(raw);
    const yok = {
      ...parsed,
      listings: {
        ...parsed.listings,
        available: false,
        reason: "Promote edilmiş ASIN katalog kaydı yok",
        rows: [],
      },
    };
    const l = adaptListings(yok);
    expect(l.available).toBe(false);
    expect(l.reason).toContain("katalog kaydı yok");
  });

  it("snake_case sızmaz", () => {
    const parsed = catalogSchema.parse(raw);
    expect(JSON.stringify(adaptListings(parsed))).not.toMatch(
      /record_id|conversion_pct|buybox_pct|asin_count/
    );
    expect(JSON.stringify(adaptReturns(parsed))).not.toMatch(
      /refund_rate|ordered_units|product_group/
    );
  });
});
