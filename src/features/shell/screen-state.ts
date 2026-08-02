/**
 * Ekran iskelesi — üç ekranın ORTAK durum türetmesi (UI-ADR-131).
 *
 * NEDEN VAR: `executive-briefing`, `mission-control` ve `amazon-director`
 * aynı beş şeyi kelimesi kelimesine tekrar yazıyordu — demo hata nesnesi,
 * demo → üç bayrak türetmesi, `reloadAll` yelpazesi, boşaltılmış zarf
 * üreteci ve "sözleşme yok" metni. Tekrar yalnız hacim değil SAPMA
 * üretiyordu: "sözleşme yok" metninin İKİ AYRI ŞEKLİ vardı
 * (`emptyTitle/...` ve `title/...`) ve `mission-control` ikisini
 * bağlamak için `emptyProps` diye bir adaptör taşıyordu.
 *
 * Hiçbiri hook DEĞİL ve bu bilinçli: saf fonksiyonlar renderer olmadan
 * test edilebilir. Repo bu dersi `mockGate`te bir kez öğrenmişti —
 * kritik dal, doğrulanması için tarayıcı gerektirmemeli.
 */

import type { DataEnvelope } from "@/types/data-envelope";
import type { SectionError } from "@/components/layout/section";
import type { OdinQueryResult } from "@/lib/data/use-odin-query";

/** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
export type DemoState = "loading" | "empty" | "error";

/**
 * Demo hata metni. `why` ve `fix` her ekranda AYNIYDI; yalnız `what` ve
 * `impact` ekrana özeldir — üç kopyada da böyleydi, sadece görünmüyordu.
 */
export function demoError(what: string, impact: string): SectionError {
  return {
    what,
    why: "ODIN yerel sunucusu (127.0.0.1) yanıt vermedi.",
    impact,
    fix: "ODIN sunucusunu başlat, sonra yeniden dene.",
  };
}

export interface ScreenState {
  /** İlk veri henüz yokken true — iskelet bu bayrakla basılır. */
  loading: boolean;
  /** Dolu yalnızca demo zorlamasında; gerçek hata bölüm bazında basılır. */
  error: SectionError | null;
  isEmpty: boolean;
  /** Ekrandaki TÜM kaynakları tazeler ("Yenile" düğmesi). */
  reloadAll: () => void;
}

/**
 * Ekranın ortak durumunu türetir.
 *
 * `primary` KASITLI olarak tek bir kaynaktır, "herhangi biri yükleniyor"
 * değil: ekranın iskeleti hero bölümünün ritmine bağlıdır. Bütün
 * kaynakları OR'lamak, en yavaş uç noktanın tüm ekranı iskelette
 * tutması demek olurdu — üç ekranda da bugünkü davranış budur ve
 * korunuyor.
 */
export function screenState({
  demo,
  primary,
  sources,
  error,
}: {
  demo: DemoState | undefined;
  primary: Pick<OdinQueryResult<unknown>, "loading">;
  sources: Pick<OdinQueryResult<unknown>, "refetch">[];
  error: SectionError;
}): ScreenState {
  return {
    loading: demo === "loading" || primary.loading,
    error: demo === "error" ? error : null,
    isEmpty: demo === "empty",
    reloadAll: () => sources.forEach((s) => s.refetch()),
  };
}

/**
 * Zarfı boşaltır ama META'YI KORUR.
 *
 * `null` döndürmek "veri yok" demektir; boş dizi + meta ise "ölçüldü,
 * sonuç boş" demektir. İkisi ayrı ifadelerdir ve demo `empty` durumu
 * ikincisini göstermek içindir — bu yüzden meta atılmaz.
 */
export function emptied<T>(
  env: DataEnvelope<T[]> | null
): DataEnvelope<T[]> | null {
  return env ? { data: [], meta: env.meta } : null;
}

/**
 * ÇEKİRDEĞİN BEYAN ETTİĞİ YOKLUK — UI-ADR-203 (gavadolar 2/2).
 *
 * ODIN artık bazı yüklerde `available:false` + `reason` gönderiyor:
 * "Promote edilmiş SP-API orders kaydı yok". Bu bir HATA değil, ölçülmüş
 * bir yokluktur — ve gerekçesi ÇEKİRDEĞİNDİR. Arayüz rota başına sabit
 * metin taşımaz: taşısaydı, kaynak durumu değiştiği gün ekran eski
 * cümleyi söylemeye devam ederdi ve kimse fark etmezdi.
 *
 * `null` döner (yani bölüm normal çizilir) yalnızca kaynak GERÇEKTEN
 * varsa. Üç ekran aynı deseni yazmıştı; dördüncüsü kopyalamasın.
 */
export function sourceUnavailable(
  source: { available: boolean; reason: string | null } | null,
  { what, impact, fix }: { what: string; impact: string; fix: string }
): SectionError | null {
  if (!source || source.available) return null;
  return {
    what,
    why: source.reason ?? "Çekirdek gerekçe bildirmedi.",
    impact,
    fix,
  };
}

/**
 * Sözleşmesi olmayan bölümlerin metni — UI-ADR-096.
 *
 * TEK ŞEKİL. Önceden iki ekran bunu farklı alan adlarıyla üretiyordu ve
 * aradaki fark bir adaptör fonksiyonuyla kapatılıyordu; `Section`'ın
 * beklediği adlar doğrudan üretiliyor.
 */
export function noContract(name: string, why: string, ref: string) {
  return {
    emptyTitle: `${name} sözleşmesi tanımlı değil`,
    emptyDescription: why,
    emptySuggestion: `Soru ${ref}'e düşüldü; sözleşme geldiğinde bölüm aynı yere oturur.`,
  };
}
