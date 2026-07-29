/**
 * Executive Intelligence Feed mock verisi — 05-dashboard.md §6.
 *
 * On kategori tanımlı; ekranda aynı anda en fazla 5–6 öğe görünür, gerisi
 * scroll'dadır (Cognitive Load Budget). Sıralamayı normalde AI yapar; burada
 * öncelik + zaman ile sıralanır ve bu bir TÜRETME değil, sözleşmedeki
 * `priority` alanının kullanımıdır.
 */

import type { IntelligenceItem } from "@/types/screens";
import type { DataEnvelope } from "@/types/data-envelope";
import { ago, mockEnvelope } from "./envelope";

export function feedMock(): DataEnvelope<IntelligenceItem[]> {
  return mockEnvelope([
    {
      id: "if-1",
      category: "critical_risk",
      title: "BuyBox kaybı üç SKU'ya yayıldı",
      detail: "Repricer eşiği rakip fiyat hareketini yakalayamadı.",
      at: ago(11 * 60_000),
      priority: 1,
      actor: "Amazon AI",
    },
    {
      id: "if-2",
      category: "pending_approval",
      title: "PPC bütçe kararı onay bekliyor",
      detail: "Kurul %91 mutabık; azınlık görüşü 48 saat bekleme öneriyor.",
      at: ago(14 * 60_000),
      priority: 1,
      actor: "Executive AI",
    },
    {
      id: "if-3",
      category: "amazon_anomaly",
      title: "Kampanya B tıklama maliyeti bir günde %19 arttı",
      at: ago(38 * 60_000),
      priority: 2,
      actor: "Amazon AI",
    },
    {
      id: "if-4",
      category: "ai_recommendation",
      title: "SKU-1042 için acil sipariş önerisi hazır",
      detail: "İki alternatif ve kanıt zinciri ile birlikte.",
      at: ago(42 * 60_000),
      priority: 2,
      actor: "Amazon AI",
    },
    {
      id: "if-5",
      category: "financial_deviation",
      title: "Net kâr marjı bütçeden %4 sapıyor",
      at: ago(88 * 60_000),
      priority: 2,
      actor: "Finance AI",
    },
    {
      id: "if-6",
      category: "competitor_alert",
      title: "Rakip A ana kategoride fiyatı %6 düşürdü",
      at: ago(2 * 60 * 60_000),
      priority: 3,
      actor: "Amazon AI",
    },
    {
      id: "if-7",
      category: "market_intelligence",
      title: "Kategori talebi mevsimsel olarak yükseliş eğiliminde",
      detail: "Son üç yılın aynı haftasına göre +12%.",
      at: ago(4 * 60 * 60_000),
      priority: 3,
      actor: "Knowledge AI",
    },
    {
      id: "if-8",
      category: "director_activity",
      title: "Reasoning AI iki karar arasında çelişki taraması başlattı",
      at: ago(5 * 60 * 60_000),
      priority: 4,
      actor: "Reasoning AI",
    },
    {
      id: "if-9",
      category: "new_knowledge",
      title: "Repricer eşiği geri bildirimi bilgi tabanına işlendi",
      at: ago(7 * 60 * 60_000),
      priority: 4,
      actor: "Knowledge AI",
    },
    {
      id: "if-10",
      category: "security_event",
      title: "Yeni cihazdan yönetici girişi",
      detail: "Doğrulandı, aksiyon gerekmiyor.",
      at: ago(11 * 60 * 60_000),
      priority: 5,
      actor: "Sistem",
    },
  ] satisfies IntelligenceItem[]);
}
