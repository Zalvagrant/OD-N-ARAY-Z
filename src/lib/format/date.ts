/**
 * Tarih biçimlendirme — GEÇERSİZ GİRDİ ÇÖKERTMEZ. UI-ADR-158.
 *
 * NEDEN VAR: `Intl.DateTimeFormat.format(new Date(x))` geçersiz bir
 * tarihte **RangeError FIRLATIR** — sessizce boş dönmez. Bu, render
 * sırasında olur ve bölümü değil EKRANIN TAMAMINI `error.tsx` sınırına
 * kadar götürür.
 *
 * Girdi güvenli DEĞİL: `report_period` alanları (`start`/`end`/`at`)
 * şemada yalnız `z.string()`; `isoDate` doğrulayıcısı onlara
 * uygulanmamış (`asOf`/`createdAt`a uygulanmış). ODIN bu alanları
 * provenance'tan aynen taşıyor ve içerik serbest bir sözlük — yani
 * `"2026-W30"` gibi bir değer bugün de gelebilir.
 *
 * Üç dosya aynı yardımcıyı ayrı ayrı yazmıştı (`executive-kpi-card`,
 * `amazon/sku/screen`, `timeline`) ve yalnız `timeline` geçerliliği
 * kontrol ediyordu. Üç kopya, birinin korunup ikisinin korunmaması
 * demekti — UI-ADR-137'nin dersi: merkezileşmesi gereken şey bir KARARDIR,
 * ve buradaki karar "geçersiz tarihte ne yapılır"dır.
 *
 * `null` döner, boş dize DEĞİL: çağıran "tarih yok" ile "tarih boş"
 * arasında ayrım yapabilsin ve `NoData` basabilsin.
 */

/** Geçerli bir tarihse `Date`, değilse null. Tek doğrulama noktası. */
export function parseIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Biçimlendirilmiş tarih ya da `null`.
 *
 * `locale` sabit `tr-TR`: repo tek dilli ve `Num`/`Pct` de öyle yapıyor.
 * Çok dilli olursa burası tek değişecek yerdir.
 */
export function formatDate(
  iso: string | null | undefined,
  options: Intl.DateTimeFormatOptions
): string | null {
  const d = parseIso(iso);
  if (d === null) return null;
  return new Intl.DateTimeFormat("tr-TR", options).format(d);
}
