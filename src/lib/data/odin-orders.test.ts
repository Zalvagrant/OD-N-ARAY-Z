/**
 * `/api/orders` adaptörü — GERÇEK ODIN yüküne karşı (UI-ADR-202).
 * Fixture çalışan cockpit'ten alındı (2 Ağu 2026: KO-spapi-orders-2026-07-31,
 * 49 sipariş).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptOrders, ordersSchema } from "./odin-orders";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-orders.json"),
    "utf8"
  )
);

describe("gerçek /api/orders yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => ordersSchema.parse(raw)).not.toThrow();
  });

  it("durum dağılımının toplamı sipariş sayısına eşittir", () => {
    const o = adaptOrders(ordersSchema.parse(raw));
    expect(o.byStatus.reduce((s, b) => s + b.count, 0)).toBe(o.count);
    expect(o.orders).toHaveLength(o.count);
  });

  it("TUTARSIZ SİPARİŞ 0 DEĞİL null — ve sayısı beyan edilir", () => {
    const o = adaptOrders(ordersSchema.parse(raw));
    const tutarsiz = o.orders.filter((x) => x.total === null);
    expect(o.totals).not.toBeNull();
    expect(tutarsiz).toHaveLength(o.totals!.ordersWithoutTotal);
    /* Hiçbiri 0,00 olarak taşınmamalı. */
    expect(o.orders.some((x) => x.total?.amount === 0)).toBe(false);
  });

  it("siparişler en yeni satın alma üstte gelir", () => {
    const o = adaptOrders(ordersSchema.parse(raw));
    const ts = o.orders.map((x) => x.purchasedAt ?? "");
    expect(ts).toEqual([...ts].sort().reverse());
  });

  it("ayrıştırılamayan tutar 0'a düşmez, null olur", () => {
    const parsed = ordersSchema.parse(raw);
    const bozuk = {
      ...parsed,
      orders: parsed.orders.map((x, i) =>
        i === 0 && x.OrderTotal
          ? { ...x, OrderTotal: { ...x.OrderTotal, Amount: "abc" } }
          : x
      ),
    };
    const ilkTutarli = parsed.orders.findIndex((x) => x.OrderTotal);
    if (ilkTutarli === 0) {
      expect(adaptOrders(bozuk).orders[0].total).toBeNull();
    }
  });

  it("kaydın kendi penceresi taşınır, normalleştirilmez", () => {
    const o = adaptOrders(ordersSchema.parse(raw));
    expect(o.period.basis).toBe("rolling_window");
    expect(o.period.windowDays).toBe(7);
    expect(o.recordId).toMatch(/^KO-spapi-orders-/);
  });

  it("snake_case sızmaz", () => {
    const o = adaptOrders(ordersSchema.parse(raw));
    expect(JSON.stringify(o)).not.toMatch(
      /record_id|by_status|orders_with_total|window_days|AmazonOrderId/
    );
  });
});
