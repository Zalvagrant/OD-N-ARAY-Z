/**
 * Amazon SKU sunum eşlemeleri — UI-ADR-130.
 *
 * SINIR KURALI (gavadolar 2/2): burada YALNIZCA kanonik kodun görsel
 * karşılığı bulunur. Eşik hesabı, skor→durum bandı, risk kohortu türetme
 * BURAYA GİREMEZ — onların sahibi ODIN'dir. Bir `>= 80` ya da `< 90` bu
 * dosyaya yazılırsa, uydurulmuş bir politika "domain katmanı" adı altında
 * meşrulaştırılmış olur; taşımak temizlemek değildir.
 *
 * NEDEN BURADA: bu haritalar `features/amazon/sku/screen.tsx`
 * içinde yaşıyordu ve `amazon-director.tsx` onları KARDEŞ EKRANDAN import
 * ediyordu. Ekranlar birbirinin iç detayına bağlanınca ikisi de tek
 * başına taşınamaz hâle gelir.
 */

import type { BadgeVariant } from "@/components/ui/badge";
import type { SkuHealth } from "@/types/screens";

/** Bu panelin çizildiği seçim türü. App Shell bu sabitle eşleştirir. */
export const AMAZON_SKU_KIND = "sku";

/**
 * ODIN'in stockout motorunun BEŞ değeri (ADR-0149) → etiket + rozet tonu.
 * Değer kümesi ODIN'den gelir; arayüz onu sıkıştırmaz (UI-ADR-128).
 */
export const SKU_STATUS: Record<
  SkuHealth["status"],
  { label: string; variant: BadgeVariant }
> = {
  ok: { label: "Sağlıklı", variant: "success" },
  warn: { label: "İzlemede", variant: "warning" },
  critical: { label: "Kritik", variant: "danger" },
  /* Stok VAR, satış YOK — kendi başına bir bulgu. `ok` saymak da
     `critical` saymak da ayrı birer yalan olurdu. */
  no_movement: { label: "Hareketsiz", variant: "info" },
  /* Hızı ölçülemeyen SKU. Bugün 48'in 29'u bu — ve bu bir sağlık
     durumu DEĞİL, bir ölçüm boşluğudur. */
  unknown: { label: "Ölçülmedi", variant: "secondary" },
};

/**
 * SKU yüzdeleri 0–100 ölçeğindedir; teklif sözleşmesinde bildirilmiştir.
 *
 * İki ekranda AYRI AYRI tanımlıydı. Ölçek bir gün değişirse iki yerden
 * birinin unutulması, ekranda yüz kat sapmış bir yüzde demektir.
 */
export const SKU_SCALE = "0-100" as const;

/** Skor gerekçesinin yönü — renk tek başına anlam taşımaz (10a §0.2). */
export const DIRECTION = {
  positive: { glyph: "▲", word: "olumlu" },
  negative: { glyph: "▼", word: "olumsuz" },
  neutral: { glyph: "■", word: "nötr" },
} as const;
