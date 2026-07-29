/**
 * Mission Control mock verisi — 05-dashboard.md §5.
 *
 * ⚠️ Bu ekranın dokuz bölümünden yalnızca dördünün veri sözleşmesi vardır
 * (Executive Alerts → §6 Alert, Director Coordination → §4 DirectorHeartbeat,
 * Operational Status → telemetry registry, Mission Board → burada TEKLİF).
 * Kalanları (Active Projects · Resource Allocation · Automation Queue)
 * uydurmuyoruz — ekranda gerekçeli boş durum çıkar (UI-ADR-096).
 */

import type { DataEnvelope } from "@/types/data-envelope";
import type { Mission } from "@/types/screens";
import { ago, ahead, mockEnvelope } from "./envelope";

export function missionsMock(): DataEnvelope<Mission[]> {
  return mockEnvelope(
    [
      {
        id: "m-ppc",
        title: "PPC verimliliğini toparla",
        objective: "ACOS'u 30 gün içinde %16 altına indirmek",
        status: "active",
        progressPercent: 42,
        ownerDirector: "Amazon AI",
        deadline: ahead(9 * 24 * 60 * 60_000),
        relatedDecisionId: "dec-ppc",
      },
      {
        id: "m-stock",
        title: "SKU-1042 tükenmesini önle",
        objective: "Stoksuz gün sayısını sıfırda tutmak",
        status: "blocked",
        progressPercent: 15,
        ownerDirector: "Amazon AI",
        deadline: ahead(3 * 24 * 60 * 60_000),
        relatedDecisionId: "dec-stock",
        blockedReason: "Tedarik siparişi kararı onay bekliyor",
      },
      {
        id: "m-fx",
        title: "Kur riskini sınırla",
        objective: "İthalat birim maliyetini öngörülebilir tutmak",
        status: "active",
        /* İlerleme ölçülmüyor: pozisyon kapama kısmi ve süreklidir.
           "%0" yazmak yanlış olurdu — bilinmiyor. */
        progressPercent: null,
        ownerDirector: "Trading AI",
        deadline: ahead(14 * 24 * 60 * 60_000),
        relatedDecisionId: "dec-fx",
      },
      {
        id: "m-listing",
        title: "Listeleme kalitesini yükselt",
        objective: "Organik trafiği 60 günde %10 artırmak",
        status: "planned",
        progressPercent: 0,
        ownerDirector: "Amazon AI",
        deadline: ahead(46 * 24 * 60 * 60_000),
        relatedDecisionId: "dec-listing",
      },
      {
        id: "m-cash",
        title: "Nakit tamponunu 30 güne çıkar",
        objective: "Ödeme sıkışıklığını ortadan kaldırmak",
        status: "active",
        progressPercent: 68,
        ownerDirector: "Finance AI",
        deadline: ahead(24 * 24 * 60 * 60_000),
      },
      {
        id: "m-return",
        title: "İade politikası güncellemesi",
        objective: "İade oranını %1,4'ün altına indirmek",
        status: "done",
        progressPercent: 100,
        ownerDirector: "Executive AI",
        deadline: ago(2 * 24 * 60 * 60_000),
      },
    ] satisfies Mission[],
    { lastUpdated: ago(6 * 60_000) }
  );
}
