/**
 * `registry.ts`'in RELEASE İKİZİ — S8 (UI-ADR-123).
 *
 * Gerçek mod derlemesinde paketleyici `@/mocks/registry` yerine BU dosyayı
 * çözer (`next.config.ts` → `turbopack.resolveAlias`). İçinde tek bir
 * `import()` yoktur; dolayısıyla mock modülleri paketin grafiğine hiç
 * girmez ve çıktıda hiçbir parçası bulunmaz.
 *
 * NEDEN STUB, NEDEN ÖLÜ KOD ELEMESİ DEĞİL: paketleyici dinamik import'ları
 * ayrıştırma aşamasında toplar; sabit bir koşulun altında olsalar bile
 * chunk'ları üretir. Ölçüldü — `if (REAL_MODE) return null` sunucu paketini
 * temizledi ama istemcide dört lazy chunk kaldı.
 *
 * Meclis "paketleyici hilesi" konusunda haklı olarak uyarmıştı: alias, dağınık
 * statik import'ları sürdürmek için kullanılırsa geçici bir hiledir. Burada
 * öyle değil — tüm mock erişimi ÖNCE tek bir modüle toplandı, alias yalnız o
 * TEK DİKİŞ YERİNİ değiştiriyor.
 *
 * Tip güvenliği korunur: `tsc` gerçek `registry.ts`'i görür (alias yalnız
 * paketleyicidedir), imzalar ayrışırsa derleme düşer.
 */

export type { MockKey, MockMap } from "./registry";
import type { MockKey, MockMap } from "./registry";

/** Gerçek modda mock YOKTUR. Fail-closed kanca bunu "veri yok"a çevirir. */
export async function loadMock<K extends MockKey>(key: K): Promise<MockMap[K] | null> {
  void key; // imza gerçek registry ile aynı kalmalı; değer kullanılmaz
  return null;
}
