/**
 * Amazon Director — seçili SKU.
 * Kaynak: 06-workspaces.md §1.7 (SKU seçilince sağ bağlam paneli).
 *
 * NEDEN GLOBAL: seçim SKU tablosunda yapılır, sonucu App Shell'in sağ
 * panelinde görünür. İkisi kardeş ağaçlardadır; prop ile taşımak App Shell'i
 * Amazon'a bağımlı kılardı — panel KABUĞU modülden habersiz kalmalıdır
 * (03-...md §7).
 *
 * DİSKE YAZILMAZ: seçim anlık bir durumdur, tercih değil.
 */

import { create } from "zustand";
import type { SkuHealth } from "@/types/screens";

interface AmazonState {
  selectedSku: SkuHealth | null;
  selectSku: (sku: SkuHealth | null) => void;
}

export const useAmazonStore = create<AmazonState>()((set) => ({
  selectedSku: null,
  selectSku: (selectedSku) => set({ selectedSku }),
}));
