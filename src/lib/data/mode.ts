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

/**
 * DOĞRUDAN `process.env` karşılaştırması — S8 (UI-ADR-119).
 *
 * `DATA_MODE === "mock"` yazmak daha okunaklı olurdu ama paketleyici için
 * ÖLÜ KOD ELEMESİNİ imkânsız kılıyordu: Next `NEXT_PUBLIC_*` değişkenlerini
 * derleme anında düz metne çevirir, ancak değer bir doğrulama adımından
 * geçip başka bir sabite atanınca bu bilgi kaybolur. Sonuç ölçüldü — mock
 * veri üretim paketine giriyordu.
 *
 * Bu hâliyle ifade derlemede `"odin" !== "odin"` → `false` olur ve
 * `IS_MOCK ? mock() : live` dallarının mock tarafı, importlarıyla birlikte
 * elenebilir. Yukarıdaki doğrulama (`RAW`) yerinde duruyor: geçersiz bir
 * mod hâlâ patlar.
 */
export const IS_MOCK = process.env.NEXT_PUBLIC_ODIN_DATA_MODE !== "odin";

/**
 * ODIN isteklerinin ön eki — S8'de DEĞİŞTİ (UI-ADR-117).
 *
 * Artık mutlak bir adres değil, AYNI KÖKENDE bir yol. İstek Next'in
 * `rewrites()` vekilinden geçip `http://127.0.0.1:8765`'e ulaşır
 * (`next.config.ts`). Neden: cockpit CORS başlığı yayınlamıyor ve
 * yayınlaması da istenmiyor — 127.0.0.1'e bağlı kalması bilinçli bir
 * güvenlik kararı.
 *
 * Yan fayda: ODIN'in gerçek adresi tarayıcı paketine GİRMEZ; hedef yalnız
 * sunucu tarafındaki `ODIN_ORIGIN` ile belirlenir.
 */
export const ODIN_BASE_URL = "/odin";
