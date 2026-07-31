/**
 * API Client — S7 D7.2 · D7.13 · D7.14.
 *
 * TEK GİRİŞ KAPISI. Mock da gerçek veri de bu borudan geçer; S7'nin bütün
 * meselesi budur. Mock'un ayrı bir yoldan girmesine izin verilseydi, S8'de
 * anahtar çevrildiğinde ilk kez doğrulanan bir yol devreye girerdi.
 *
 * Zincir: yükle → zarf var mı → şema → kaynak tutarlılığı → tazelik.
 * Halkalardan biri kopunca veri bileşene ULAŞMAZ; beş adımlı bir
 * `OdinError` döner.
 */

import type { z } from "zod";
import type { DataEnvelope } from "@/types/data-envelope";
import { computeFreshness } from "@/types/data-envelope";
import { envelopeSchema } from "./schemas";
import {
  classifyError,
  contractError,
  formatIssues,
  httpError,
  isAbortError,
  offlineError,
  OdinError,
} from "./errors";
import { IS_MOCK, ODIN_BASE_URL } from "./mode";
import type { OdinModule } from "./policy";

const DEFAULT_TIMEOUT_MS = 15_000;

/** Üretici ile istemci saati arasında hoş görülen kayma. */
const MAX_FUTURE_SKEW_MS = 5 * 60_000;

/**
 * Ham yükü zarf sözleşmesine sokar.
 *
 * `meta`sız veri REDDEDİLİR — sessizce "bilinmiyor" damgası vurulmaz:
 * kaynağı ve yaşı bilinmeyen bir sayı, ekranda kaynağı bilinen bir sayıdan
 * ayırt edilemez hâle gelirdi.
 */
export function parseEnvelope<T>(
  raw: unknown,
  schema: z.ZodType<T>,
  where: string,
  module: OdinModule
): DataEnvelope<T> {
  const parsed = envelopeSchema(schema).safeParse(raw);

  if (!parsed.success) {
    throw contractError(where, formatIssues(parsed.error.issues));
  }

  const env = parsed.data as DataEnvelope<T>;

  /* Gerçek modda mock kaynağı KABUL EDİLMEZ. Anahtarın çevrildiği gün
     ekranda kalan tek bir mock kayıt, tüm ekranı şüpheli hâle getirir. */
  if (!IS_MOCK && env.meta.source === "mock") {
    throw contractError(where, 'Gerçek veri modunda meta.source="mock" geldi.');
  }

  /* GELECEKTEN GELEN DAMGA (meclis bulgusu): saati ileri kaymış bir üretici
     `lastUpdated`'ı geleceğe yazarsa kayıt SONSUZA KADAR "canlı" görünür —
     bayatlık hiç tetiklenmez ve ekran ölü veriyi taze diye gösterir. Beş
     dakikalık saat kayması tolere edilir, ötesi sözleşme ihlalidir. */
  const skewMs = Date.parse(env.meta.lastUpdated) - Date.now();
  if (skewMs > MAX_FUTURE_SKEW_MS) {
    throw contractError(
      where,
      `meta.lastUpdated gelecekte: ${env.meta.lastUpdated} (+${Math.round(skewMs / 60_000)} dk)`
    );
  }

  /* Tazelik İSTEMCİDE yeniden hesaplanır: sunucunun damgası önbellekte
     yaşlanır, "canlı" yazan bir kayıt yarım saat sonra hâlâ "canlı" der. */
  return {
    ...env,
    meta: { ...env.meta, freshness: computeFreshness(env.meta.lastUpdated, module) },
  };
}

/**
 * ODIN'e HTTP isteği. S8'de gerçek uç noktalara bağlanacak olan budur;
 * S7'de yazıldı ve testle doğrulandı ama henüz hiçbir ekran çağırmıyor.
 */
export async function httpLoad(
  path: string,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS }: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<unknown> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw offlineError();
  }

  /* Zaman aşımı ve çağıranın iptali tek sinyalde birleşir: route değişince
     eski istek ölmezse, geç gelen yanıt yeni ekranın verisini ezer. */
  const timeout = AbortSignal.timeout(timeoutMs);
  const merged = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let res: Response;
  try {
    res = await fetch(`${ODIN_BASE_URL}${path}`, {
      signal: merged,
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    /*
     * ÇAĞIRANIN İPTALİ HER ZAMAN KAZANIR — UI-ADR-121.
     *
     * Önceki koşul `signal?.aborted && !timeout.aborted` idi: ikisi birden
     * olduğunda (kullanıcı route değiştirirken istek de zaman aşımına
     * uğradığında) zaman aşımı kazanıyor ve TERK EDİLMİŞ ekranın hata
     * kutusu açılıyordu. `timedOut` diye bir bayrakla düzeltmeye çalışmak
     * da aynı hatayı koruyordu — sorun hangi sinyalin okunduğu değil,
     * ÖNCELİK sırasıydı.
     *
     * Doğru kural tek cümle: çağıran iptal ettiyse — zaman aşımı da olsa —
     * bu bizim raporlayacağımız bir hata değildir. Kullanıcı o ekrandan
     * ayrıldı; React Query iptali zaten sessizce düşürür.
     *
     * AMA yalnız GERÇEK iptal hatası yutulur (meclis ikinci turu): ağ
     * kopması ile kullanıcının iptali aynı ana denk gelirse, `aborted`
     * bayrağına bakıp her hatayı yutmak ağ hatasını GİZLERDİ. Hata tipi
     * de kontrol edilir; iptal olmayan bir hata her zaman sınıflandırılır.
     */
    if (signal?.aborted && isAbortError(err, signal)) throw err;
    throw classifyError(err, path);
  }

  if (!res.ok) {
    throw httpError(res.status, path, await res.text().catch(() => undefined));
  }

  try {
    return await res.json();
  } catch {
    throw contractError(path, "Yanıt JSON olarak çözümlenemedi.");
  }
}

export { OdinError };
