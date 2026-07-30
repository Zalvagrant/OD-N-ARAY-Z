/**
 * Release derlemesi kapısı — S7 D7.10 (meclis kararı, UI-ADR-112).
 *
 * `npm run build` sprint boyunca serbesttir; uygulama S8'e kadar zaten
 * mock'tur ve herkesin derlemesini kırmanın anlamı yok. Korunması gereken
 * şey derleme değil, DAĞITILAN ÇIKTIDIR: mock modda üretilmiş bir paket
 * yanlışlıkla dağıtılırsa, ekrandaki her sayı gerçek sanılır.
 *
 * Kullanım:  npm run build:release
 */

const mode = process.env.NEXT_PUBLIC_ODIN_DATA_MODE;

if (mode !== "odin") {
  console.error(
    `HATA: release derlemesi mock modda yasak.\n` +
      `  NEXT_PUBLIC_ODIN_DATA_MODE = ${mode ?? "(tanımsız → mock)"}\n` +
      `  Beklenen: "odin". Geliştirme derlemesi için "npm run build" kullanın.`
  );
  process.exit(1);
}
