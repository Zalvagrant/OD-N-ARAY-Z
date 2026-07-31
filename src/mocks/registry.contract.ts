/**
 * Release ikizi ile gerçek kayıt defteri arasındaki SÖZLEŞME KAPISI —
 * S8 (UI-ADR-123).
 *
 * KÖR NOKTA (meclis bulgusu): `turbopack.resolveAlias` yalnız PAKETLEYİCİDE
 * çalışır; `tsc` her zaman gerçek `registry.ts`'i görür. Dolayısıyla
 * `registry.release.ts` gerçek imzadan sapabilir, derleme yeşil kalır ve
 * kırılma YALNIZ release paketinde ortaya çıkar — yani en geç fark edilecek
 * yerde.
 *
 * Aşağıdaki atama o boşluğu kapatır: release modülü gerçek modülün tipine
 * atanamıyorsa `tsc` düşer. Çalışma zamanında hiçbir şey yapmaz.
 */

import type * as RealRegistry from "./registry";
import * as ReleaseRegistry from "./registry.release";

const releaseMatchesReal: typeof RealRegistry = ReleaseRegistry;

void releaseMatchesReal;
