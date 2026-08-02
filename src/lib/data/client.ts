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
 * UÇUŞTAKİ İSTEKLER — aynı yola aynı anda giden çağrılar TEK istekte birleşir.
 *
 * Bu bir önbellek DEĞİLDİR: yanıt saklanmaz, TTL yoktur, geçersizleştirme
 * yoktur. Kayıt yalnızca istek uçarken yaşar ve biter bitmez silinir.
 *
 * Neden gerekli (ÖLÇÜLDÜ): sekiz kanca — hedefler, direktörler, alarmlar,
 * fırsatlar, akış, KPI, hero, nabız — aynı `/api/state` yükünü okur ama her
 * biri KENDİ `queryKey`ine sahiptir, dolayısıyla React Query onları
 * tekilleştiremez. Sekiz eşzamanlı istek ODIN'in tek iş parçacıklı
 * projeksiyonunu sekiz kez koşturuyordu: tek istek 1,2 sn, sekizi 8,6 sn —
 * ve 15 sn'lik zaman aşımı sınırının altına ancak sunucu hızlandıktan sonra
 * indi. Öncesinde dördü zaman aşımına uğrayıp ekranda BOŞ bölüm bırakıyordu.
 *
 * Anahtarları birleştirmek yerine burada birleştirilmesinin sebebi: sekiz
 * kancanın her biri aynı ham yükten FARKLI şema doğrular ve farklı uyarlama
 * yapar. Paylaşılan olması gereken şey ağ isteğidir, ayrıştırma değil.
 */
const inFlight = new Map<string, Promise<unknown>>();

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

  let shared = inFlight.get(path);
  if (!shared) {
    /* Paylaşılan isteğe HİÇBİR çağıranın sinyali verilmez: A'nın route
       değiştirip iptal etmesi, aynı yükü bekleyen B'nin isteğini
       öldürmemelidir. İptal aşağıda, çağıran BAŞINA ele alınır. */
    shared = fetchOnce(path, timeoutMs);
    inFlight.set(path, shared);
    /* Kayıt yanıt gelir gelmez silinir — bir sonraki çağrı yeni istek açar.
       Temizlik `then(f, f)` ile yazılır, `finally` ile DEĞİL: `finally`
       aynı hatayla reddeden YENİ bir promise döndürür ve onu kimse
       beklemediği için "unhandled rejection" olarak sızar (testte görüldü).
       Bu biçim hem temizler hem reddi yutar — hatayı çağıranlar zaten
       kendi `shared` referanslarından alır. */
    const clear = () => {
      if (inFlight.get(path) === shared) inFlight.delete(path);
    };
    void shared.then(clear, clear);
  }

  if (!signal) return shared;
  /* Çağıranın iptali paylaşılan isteği beklemez (UI-ADR-121 önceliği
     korunur): terk edilmiş ekran kendi AbortError'ını alır, istek diğerleri
     için uçmaya devam eder. */
  return Promise.race([
    shared,
    new Promise<never>((_, reject) => {
      if (signal.aborted) return reject(signal.reason);
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }),
  ]);
}

async function fetchOnce(path: string, timeoutMs: number): Promise<unknown> {
  /* Yalnız zaman aşımı: çağıranın iptali `httpLoad`taki yarışta ele alınır
     ve buraya HİÇ ulaşmaz — biri iptal etti diye ortak istek ölmez.
     Zaman aşımı ilk çağıranın değerinden gelir; sekiz kancanın hepsi
     varsayılanı kullandığı için pratikte tek bir değer var. */
  const merged = AbortSignal.timeout(timeoutMs);

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
     * Bu kural artık BURADA değil, `httpLoad`taki yarışta uygulanır ve
     * yapısal olarak garantidir: iptal eden çağıran kendi `signal.reason`ı
     * ile ANINDA reddedilir, buradaki hatayı hiç görmez. Eskiden aynı
     * `catch` içinde iki sinyalin önceliğini ayırt etmek gerekiyordu —
     * `signal?.aborted && !timeout.aborted` koşulu, kullanıcı route
     * değiştirirken istek de zaman aşımına uğrayınca TERK EDİLMİŞ ekranın
     * hata kutusunu açıyordu. Sinyaller ayrıldığı için o çakışma yok.
     *
     * Geriye kalan tek durum gerçek bir ağ/zaman aşımı hatasıdır ve
     * yutulmaz: bunu bekleyen çağıranların GÖRMESİ gerekir.
     */
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
