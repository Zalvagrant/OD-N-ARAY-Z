"use client";

/**
 * Sağ bağlam panelinin içerik sağlayıcısı — UI-ADR-130.
 *
 * NEDEN APP KATMANINDA: bu eşleme daha önce `components/layout/app-shell.tsx`
 * içindeydi ve kabuk, iki EKRANI doğrudan import ediyordu
 * (`layout → screens`). Bu ters bir bağımlılıktı: kabuk her feature'ı
 * tanıyorsa, hiçbir feature kabuktan bağımsız taşınamaz ve yeni bir
 * workspace eklemek kabuğu düzenlemeyi gerektirir.
 *
 * Şimdi kabuk yalnızca bir SLOT tanımlıyor; hangi ekranın o slotu
 * dolduracağını kompozisyon kökü — yani `app/` — biliyor. Yön düzeldi:
 * app → screens, app → layout.
 *
 * 03-information-architecture.md §7 zaten böyle diyordu: "sağ panel
 * bileşeni modüle özel YAZILMAZ; kabuk aynı kalır, yalnızca içerik
 * sağlayıcısı değişir." Kural doğruydu, uygulaması kabuğun içine
 * sızmıştı.
 */

import type { ContextPanelSlot } from "@/components/layout/app-shell";
import { AMAZON_SKU_KIND } from "@/features/amazon/presentation/sku";
import { AmazonSkuPanel } from "@/features/amazon/sku/screen";
import { IntelligenceFeed } from "@/features/intelligence-feed/screen";

/**
 * Executive Briefing'de akan istihbarat paneli (05-dashboard.md §6);
 * Amazon'da seçili SKU'nun detayı.
 *
 * Amazon'da SKU SEÇİLİ DEĞİLKEN sağlayıcı verilmez — kabuğun kendi
 * "seçili nesne yok" boş durumu doğru olandır.
 */
export const contextPanel: ContextPanelSlot = ({ workspaceId, selectedKind }) => {
  if (workspaceId === "briefing") return <IntelligenceFeed />;
  if (workspaceId === "amazon" && selectedKind === AMAZON_SKU_KIND) {
    return <AmazonSkuPanel />;
  }
  return undefined;
};
