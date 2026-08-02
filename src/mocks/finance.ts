/**
 * Finance mock'u — UI-ADR-195.
 *
 * Şekil, çalışan cockpit'ten ÖLÇÜLEREK alındı (2 Ağu 2026,
 * `api-state-finance.json` fixture'ı ile aynı sözleşme). Sayılar gerçek
 * defterin YAPISINI taklit eder, değerlerini değil — `runway_note` ve
 * `card_utilisation_pct` dahil, ekranın her dalı mock modda da uyanır.
 */

import type { DataEnvelope } from "@/types/data-envelope";
import type { FinancePosition } from "@/lib/data/odin-state";

export function financePositionMock(): DataEnvelope<FinancePosition> {
  return {
    data: {
      currency: "TRY",
      windowMonths: 9,
      cashTry: 120000,
      cashProvenance: {
        amount: 2500,
        currency: "USD",
        fxToTry: 48,
        asOf: "2026-07-20",
        source: "owner-declared",
      },
      monthlyRevenue: 300000,
      monthlyOpex: 130000,
      monthlyDebtService: 210000,
      operatingNet: 170000,
      cashFlowNet: -40000,
      remainingDebt: 900000,
      runwayMonths: 3,
      runwayNote: "MOCK: runway nakit-akışı netinden",
      requiredReserve: {
        requiredReserve: 260000,
        personalFloor: 50000,
        knownObligations: 210000,
        criticalReorderCash: 0,
        monthsWindow: 1,
      },
      sourceNotConnected: ["tax", "bank_reconciliation", "payroll"],
      cardUtilisationPct: 12.5,
      runwayTarget: { value: "5", direction: "floor", source: "owner-declared" },
      leverageTarget: { value: "4", direction: "ceiling", source: "owner-declared" },
    },
    meta: { source: "mock", lastUpdated: new Date().toISOString(), freshness: "live" },
  };
}
