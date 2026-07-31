/**
 * Selamlama — saat bandı (UI-ADR-130).
 *
 * İş kuralı DEĞİL, yerel sunum tercihidir (gavadolar: "bu bir presentation
 * fonksiyonudur"). Yine de ekrandan çıkarıldı: saf, saat enjekte edilebilir
 * ve test edilebilir olması JSX'in içinde mümkün değildi.
 */

/** Saat istemciden gelir; gelmeden selamlama YAZILMAZ (uydurma yok). */
export function greeting(now: number | null): string | null {
  if (now === null) return null;
  const h = new Date(now).getHours();
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}
