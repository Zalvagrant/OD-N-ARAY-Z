/**
 * `/api/state.finance_position` adaptörü — GERÇEK ODIN yüküne karşı
 * (UI-ADR-195). Fixture çalışan cockpit'ten alındı (2 Ağu 2026).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptFinance, financeStateSchema } from "./odin-state";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-state-finance.json"),
    "utf8"
  )
);

describe("gerçek /api/state.finance_position yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => financeStateSchema.parse(raw)).not.toThrow();
  });

  it("pozisyon camelCase'e dönüşür — değerler DEĞİŞMEZ", () => {
    const parsed = financeStateSchema.parse(raw);
    const p = adaptFinance(parsed.finance_position!);
    const kaynak = parsed.finance_position!;
    expect(p.cashTry).toBe(kaynak.cash_try);
    expect(p.operatingNet).toBe(kaynak.operating_net);
    expect(p.cashFlowNet).toBe(kaynak.cash_flow_net);
    expect(p.runwayMonths).toBe(kaynak.runway_months);
    expect(p.currency).toBe(kaynak.currency);
  });

  it("operating_net ile cash_flow_net AYRI taşınır — ayrım kaybolmaz", () => {
    const p = adaptFinance(financeStateSchema.parse(raw).finance_position!);
    /* Gerçek defterde ikisi farklı işaretli: işletme kârda, nakit akışı
       ekside. Aynı değere düşmeleri fixture bayatladı demektir. */
    expect(p.operatingNet).not.toBe(p.cashFlowNet);
  });

  it("bağlı olmayan kaynak listesi aynen taşınır — eksik gizlenmez", () => {
    const parsed = financeStateSchema.parse(raw);
    const p = adaptFinance(parsed.finance_position!);
    expect(p.sourceNotConnected).toEqual(
      parsed.finance_position!.source_not_connected
    );
    expect(p.sourceNotConnected.length).toBeGreaterThan(0);
  });

  it("snake_case sızmaz", () => {
    const p = adaptFinance(financeStateSchema.parse(raw).finance_position!);
    expect(p).toHaveProperty("cashFlowNet");
    expect(p).not.toHaveProperty("cash_flow_net");
    expect(p).not.toHaveProperty("window_months");
  });
});
