/**
 * Mock → gerçek geçiş anahtarı — TEK YER (S7 D7.10, UI-ADR-109).
 *
 * Derleme zamanı seçilir (meclis 5/5: gavadolar + yazılımcılar). Çalışma
 * zamanı bir düğme olsaydı mock kodu her derlemede paketin içinde kalırdı;
 * "gerçek sanılan mock" bu projenin en pahalı hatasıdır.
 *
 * S8'de çevrilecek anahtar budur:
 *     NEXT_PUBLIC_ODIN_DATA_MODE=odin
 */

export type DataMode = "mock" | "odin";

const RAW = process.env.NEXT_PUBLIC_ODIN_DATA_MODE ?? "mock";

if (RAW !== "mock" && RAW !== "odin") {
  throw new Error(
    `NEXT_PUBLIC_ODIN_DATA_MODE geçersiz: "${RAW}". Beklenen: "mock" | "odin".`
  );
}

export const DATA_MODE: DataMode = RAW;
export const IS_MOCK = DATA_MODE === "mock";

/**
 * ODIN isteklerinin ön eki — S8 (UI-ADR-119).
 *
 * TARAYICIDA aynı kökende bir YOL: istek Next'in `rewrites()` vekilinden
 * geçip `http://127.0.0.1:8765`'e ulaşır (`next.config.ts`). Neden vekil:
 * cockpit CORS başlığı yayınlamıyor (ölçüldü — yanıt başlıkları yalnız
 * Content-Type/Length/Cache-Control) ve yayınlaması da İSTENMİYOR;
 * 127.0.0.1'e bağlı kalması bilinçli bir güvenlik kararıdır.
 *
 * SUNUCUDA mutlak adres: Node'un `fetch`'i göreli URL çözemez ve
 * `/odin/api/state` ile çağrılırsa "Failed to parse URL" diye ÇÖKER
 * (meclis bulgusu). Bugün hiçbir sunucu yolu bunu çağırmıyor — ön yükleme
 * yapılmıyor — ama tuzağı açıkta bırakmanın anlamı yok.
 *
 * `ODIN_ORIGIN` bilerek `NEXT_PUBLIC_*` DEĞİL: ODIN'in gerçek adresi
 * tarayıcı paketine gömülmez.
 */
export const ODIN_BASE_URL =
  typeof window === "undefined"
    ? (process.env.ODIN_ORIGIN ?? "http://127.0.0.1:8765")
    : "/odin";
