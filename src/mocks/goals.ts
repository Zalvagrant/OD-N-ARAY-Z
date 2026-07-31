/**
 * Hedef mock'ları — UI-ADR-124.
 *
 * Şekil, çalışan ODIN cockpit'inden ÖLÇÜLEREK alındı (31 Tem 2026): üç
 * `urgent` hedefte `progressPct` sayı, beş `quarterly` hedefte `null`.
 * Bu dağılım kasıtlıdır — ekranın "ölçülmeyen ilerleme" yolunu mock modda
 * da göstermesi gerekir, yoksa o dal ilk kez gerçek veriyle denenirdi.
 *
 * Metinler gerçek hedeflerin YAPISINI taklit eder, içeriğini değil.
 */

import type { DataEnvelope } from "@/types/data-envelope";
import type { Goal } from "@/lib/data/odin-state";

export function goalsMock(): DataEnvelope<Goal[]> {
  return {
    data: [
      {
        id: "GOAL-ACIL-STOK-2026-07",
        level: "urgent",
        label: "ACIL: 8 ürün için tedarikçi siparişi (stok krizi)",
        target: "OTICON (1,5 ay tedarik): TV Adapter ~45 · OEM Mini ~53 | PHONAK (2 hafta): CapDome10 ~36",
        progressPct: 25,
      },
      {
        id: "GOAL-ACIL-UYUM-2026-07",
        level: "urgent",
        label: "ACIL: TV grubuna uyumluluk kılavuzu (iade düşür)",
        target: "Her TV ürünü için model uyumluluk tablosu",
        progressPct: 0,
      },
      {
        id: "GOAL-ADS-API-2026-07",
        level: "weekly",
        label: "Amazon Ads API erişim başvurusu",
        target: "Başvuru gönderilsin, onay takip edilsin",
        progressPct: 0,
      },
      {
        id: "GOAL-RETURN-ENGINE",
        level: "quarterly",
        label: "Return Intelligence Engine: iade kök-neden analizi",
        target: "",
        progressPct: null,
      },
      {
        id: "GOAL-PROFIT-ENGINE",
        level: "quarterly",
        label: "True Profit Intelligence Engine: SKU bazlı gerçek kâr",
        target: "",
        progressPct: null,
      },
      {
        id: "GOAL-VELOCITY-ENGINE",
        level: "quarterly",
        label: "Sales Velocity Intelligence Engine: momentum takibi",
        target: "",
        progressPct: null,
      },
    ],
    meta: { source: "mock", lastUpdated: new Date().toISOString(), freshness: "live" },
  };
}
