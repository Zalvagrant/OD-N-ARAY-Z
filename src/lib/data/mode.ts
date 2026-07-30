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
 * ODIN sunucusunun kökü. 127.0.0.1'e bağlıdır ve DIŞARI AÇILMAZ
 * (ODIN güvenlik kararı) — bu yüzden varsayılan sabittir, konfigüre
 * edilebilir olması bir özellik değil bir sızıntı yüzeyi olurdu.
 */
export const ODIN_BASE_URL =
  process.env.NEXT_PUBLIC_ODIN_BASE_URL ?? "http://127.0.0.1:8765";
