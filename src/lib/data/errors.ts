/**
 * Hata sınıflandırması + kullanıcı diline çeviri — S7 D7.5 · D7.12.
 *
 * `10-component-library.md` §11: her hata "Ne oldu → Neden oldu → Etkisi →
 * Çözüm → [Retry]" beş adımını doldurur. Bu dosya, `ErrorState` bileşeninin
 * ZORUNLU dört alanını üretir; bileşen yeniden yazılmadı, beslendi.
 *
 * Zod'un ham mesajı ("expected string, received number at path a.b.c")
 * kullanıcıya ÇIKMAZ — `technical` alanına, açılır bölüme gider.
 *
 * Retry politikası tek yerdedir: `retryable`. React Query'nin `retry`
 * seçeneği sabit bir sayı değil, bu bayrağı okuyan bir fonksiyondur —
 * 401'i üç kez denemek kullanıcıyı üç kat bekletir, sonucu değiştirmez.
 */

export type ErrorKind =
  | "offline"
  | "network"
  | "timeout"
  | "http"
  | "contract"
  | "unknown";

export class OdinError extends Error {
  readonly kind: ErrorKind;
  /** Ne oldu — kullanıcının diliyle, hata kodu değil. */
  readonly what: string;
  readonly why: string;
  readonly impact: string;
  readonly fix: string;
  /** Geliştirici detayı — açılır bölüm, varsayılan kapalı. */
  readonly technical?: string;
  readonly status?: number;

  constructor(init: {
    kind: ErrorKind;
    what: string;
    why: string;
    impact: string;
    fix: string;
    technical?: string;
    status?: number;
  }) {
    super(`${init.kind}: ${init.what}`);
    this.name = "OdinError";
    this.kind = init.kind;
    this.what = init.what;
    this.why = init.why;
    this.impact = init.impact;
    this.fix = init.fix;
    this.technical = init.technical;
    this.status = init.status;
  }

  /**
   * Yeniden denemenin sonucu DEĞİŞTİREBİLECEĞİ hatalar.
   *
   * Sözleşme ihlali tekrar denenmez: aynı sunucu aynı yanlış veriyi
   * üretecektir; tekrar denemek hatayı gizlemez, sadece geciktirir.
   * Çevrimdışıyken de denenmez — bağlantı dönünce React Query kendi
   * `onOnline` yeniden bağlanmasıyla tazeler.
   */
  get retryable(): boolean {
    if (this.kind === "network" || this.kind === "timeout") return true;
    if (this.kind !== "http") return false;
    const s = this.status ?? 0;
    return s === 408 || s === 429 || s >= 500;
  }

  /** `ErrorState` bileşeninin beklediği props. */
  toErrorState() {
    return {
      what: this.what,
      why: this.why,
      impact: this.impact,
      fix: this.fix,
      technical: this.technical,
    };
  }
}

const RETRY_HINT = "Bağlantı döndüğünde “Yeniden dene” düğmesini kullanın.";

export function offlineError(what = "Bağlantı yok"): OdinError {
  return new OdinError({
    kind: "offline",
    what,
    why: "Cihaz çevrimdışı görünüyor.",
    impact: "Yeni veri alınamıyor; ekranda son alınan veri varsa “bayat” işaretiyle kalır.",
    fix: RETRY_HINT,
  });
}

export function contractError(where: string, detail: string): OdinError {
  return new OdinError({
    kind: "contract",
    what: "Veri doğrulanamadı",
    why: `ODIN'den gelen “${where}” yanıtı beklenen sözleşmeye uymuyor.`,
    impact: "Bu bölüm için güvenilir değer gösterilemiyor; sahte değer üretilmedi.",
    fix: "Sözleşme farkı kayıt altına alındı. ODIN tarafındaki üretici güncellenmeli.",
    technical: detail,
  });
}

/** Bilinmeyeni de dahil, HER hatayı beş adımlı bir `OdinError`'a çevirir. */
export function classifyError(err: unknown, where: string): OdinError {
  if (err instanceof OdinError) return err;

  if (err instanceof DOMException && err.name === "AbortError") {
    return new OdinError({
      kind: "timeout",
      what: "İstek zaman aşımına uğradı",
      why: `“${where}” beklenen sürede yanıt vermedi.`,
      impact: "Bu bölümün verisi güncellenemedi.",
      fix: RETRY_HINT,
    });
  }

  if (err instanceof TypeError) {
    /* fetch ağ katmanında düşerse TypeError atar — sunucu kapalı,
       DNS yok, CORS reddi. Üçü de kullanıcı için aynı şeydir. */
    return new OdinError({
      kind: "network",
      what: "ODIN'e ulaşılamadı",
      why: "Yerel ODIN sunucusu yanıt vermiyor olabilir.",
      impact: "Bu bölüm için veri alınamadı.",
      fix: "ODIN sunucusunun çalıştığını doğrulayın, sonra yeniden deneyin.",
      technical: String(err),
    });
  }

  return new OdinError({
    kind: "unknown",
    what: "Beklenmeyen bir hata oluştu",
    why: "Hatanın kaynağı sınıflandırılamadı — sebep UYDURULMADI.",
    impact: "Bu bölüm için veri alınamadı.",
    fix: RETRY_HINT,
    technical: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
  });
}

export function httpError(status: number, where: string, body?: string): OdinError {
  const auth = status === 401 || status === 403;
  return new OdinError({
    kind: "http",
    status,
    what: `ODIN isteği reddetti (${status})`,
    why: auth
      ? "Oturum yetkisi geçersiz."
      : status === 404
        ? `“${where}” uç noktası bu ODIN sürümünde yok.`
        : "Sunucu isteği tamamlayamadı.",
    impact: "Bu bölüm için veri alınamadı.",
    fix: auth
      ? "ODIN oturumunu yenileyin."
      : status === 404
        ? "ODIN sürümü arayüzün beklediği uç noktayı sağlamıyor; kayıt defterine talep açılmalı."
        : RETRY_HINT,
    technical: body ? body.slice(0, 500) : undefined,
  });
}
