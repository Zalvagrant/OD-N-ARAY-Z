/**
 * Evren (universe) — hangi işletmenin verisine bakıyoruz. S7 D7.3.
 *
 * ODIN çok-evrenlidir (`universe_id`, S8 D8.8). Arayüzde tek yerde tutulur
 * çünkü ÖNBELLEK ANAHTARININ parçasıdır: evren değişince Lillu'nun KPI'ı
 * başka bir evrenin ekranında görünmemelidir. Bileşenler bunu prop olarak
 * taşımaz — taşınan bir değer bir yerde taşınmayı unutulur.
 *
 * Diske YAZILMAZ: yanlış evrende açılan bir oturum, doğru sanılan yanlış
 * sayılar demektir. Her oturum bilinen evrenle başlar.
 */

import { create } from "zustand";

/** S8'de ODIN'in evren listesinden gelecek. Şimdilik tek evren. */
export const DEFAULT_UNIVERSE_ID = "lillu";

interface UniverseState {
  activeUniverseId: string;
  setUniverse: (id: string) => void;
}

export const useUniverseStore = create<UniverseState>()((set) => ({
  activeUniverseId: DEFAULT_UNIVERSE_ID,
  setUniverse: (activeUniverseId) => set({ activeUniverseId }),
}));
