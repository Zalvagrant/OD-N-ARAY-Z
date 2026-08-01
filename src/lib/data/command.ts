/**
 * Komut kapısı — `POST /api/command` (ODIN ADR-0142 · ER-0025).
 *
 * ARAYÜZÜN TEK YAZMA YOLU. Okuma `httpLoad` ile, yazma buradan geçer;
 * ODIN'de başka bir yazma ucu YOK (meclis 3/3: ayrı `/api/verdict`
 * açılmadı, verdict MEVCUT beyaz listeden akar).
 *
 * ⚠️ SÖZLEŞME ODIN'İNDİR, ARAYÜZ ONA UYAR. Aşağıdaki üç yanıt biçimi
 * `odin/cockpit.py: run_command`'dan okunarak yazıldı ve
 * `tests/test_cockpit.py`te çivilenmiş durumda — hiçbiri burada
 * "iyileştirilmedi":
 *
 *   1. Beyaz liste reddi / doğrulama → { ok:false, error }        ← `exit` YOK
 *   2. Zaman aşımı (sunucu tarafı)   → { ok:false, error:"timeout (300s)" }  ← `exit` YOK
 *   3. Komut KOŞTU                   → { ok:exit===0, exit, output }
 *
 * ÜÇÜ DE HTTP 200 DÖNER. Ayırt edici sinyal HTTP kodu değil, **`exit`
 * anahtarının varlığıdır** — ER-0025'in kendi ifadesiyle: *"UI tells a
 * whitelist rejection [no exit key] from a refused verdict [exit!=0 +
 * REDDEDİLDİ text]"*. Backend testi de tam olarak bunu sabitliyor:
 *
 *     self.assertIn("exit", result)           # the verb DID run
 *     self.assertNotEqual(result["exit"], 0)  # the verdict was REFUSED
 *     self.assertIn("REDDED", result["output"])
 */

import { classifyError, contractError, httpError, isAbortError, OdinError } from "./errors";
import { ODIN_BASE_URL } from "./mode";

/**
 * Komutlar `httpLoad`'un 15 sn'sinden UZUN sürebilir: `run_command`
 * gerçek bir `python -m odin` alt süreci başlatıyor ve sunucu tarafı
 * sınırı `COMMAND_TIMEOUT_S = 300`. İstemci sınırı ondan KISA olursa
 * kullanıcı, sunucu hâlâ çalışırken "zaman aşımı" görür ve komutun
 * kaydedilip kaydedilmediğini bilemez — en kötü belirsizlik budur.
 * `verdict` saniyeler sürer; 30 sn cömert ama sunucunun 300'ünün çok
 * altında, yani belirsiz pencere açılmıyor.
 */
const COMMAND_TIMEOUT_MS = 30_000;

/** `run_command`'ın döndürdüğü ham gövde. */
export interface CommandResult {
  ok: boolean;
  /** YALNIZ komut gerçekten koştuysa var. Yokluğu = beyaz liste reddi. */
  exit?: number;
  /** stdout + stderr, son 20000 karakter. */
  output?: string;
  /** Yalnız komut hiç koşmadıysa var. */
  error?: string;
}

/**
 * Karar gönderiminin AYIRT EDİLMİŞ sonucu.
 *
 * `kind` tek bir yerde belirlenir; çağıranlar `output` metnini yeniden
 * yorumlamaz. Reddedilmiş bir verdict ile beyaz liste reddini aynı kutuda
 * göstermek, sahibe "ODIN kararını reddetti" ile "arayüz yanlış komut
 * gönderdi"yi aynı şey gibi okuturdu.
 */
export type CommandOutcome =
  | { kind: "success"; output: string }
  /** Komut koştu, ODIN REDDETTİ (ADR-0131 gerekçe/tarih kuralı). */
  | { kind: "refused"; exit: number; output: string }
  /** Komut hiç koşmadı: beyaz listede yok ya da argv geçersiz. */
  | { kind: "rejected"; error: string }
  /** Sunucu tarafı zaman aşımı — komutun kaydedilip kaydedilmediği BELİRSİZ. */
  | { kind: "timeout"; error: string };

/**
 * Beyaz liste reddi ile sunucu zaman aşımını ayırır.
 *
 * `run_command` ikisini de `{ok:false, error}` olarak döndürür; tek fark
 * metindir. Metne bakmak kırılgan görünür ama alternatifi yok ve
 * KAYNAKTAN alındı: `except subprocess.TimeoutExpired: return {"ok": False,
 * "error": f"timeout ({COMMAND_TIMEOUT_S}s)"}`. Ayrım önemli çünkü
 * sonuçları zıt: beyaz liste reddinde HİÇBİR ŞEY kaydedilmedi (güvenli),
 * zaman aşımında kaydedilmiş OLABİLİR (tekrar göndermek tehlikeli).
 */
function ayirtEt(r: CommandResult): CommandOutcome {
  if (typeof r.exit === "number") {
    const output = r.output ?? "";
    return r.exit === 0
      ? { kind: "success", output }
      : { kind: "refused", exit: r.exit, output };
  }
  const error = r.error ?? "ODIN komutu çalıştırmadı ve sebebini bildirmedi.";
  return /^timeout\s*\(/i.test(error)
    ? { kind: "timeout", error }
    : { kind: "rejected", error };
}

/**
 * Beyaz listeli bir ODIN komutunu çalıştırır.
 *
 * Ağ/HTTP/sözleşme hataları `OdinError` olarak FIRLATILIR (okuma yolundaki
 * sınıflandırmanın aynısı — beş adımlı anlatı orada zaten var). Komutun
 * KENDİ sonucu fırlatılmaz, `CommandOutcome` olarak DÖNER: "ODIN reddetti"
 * bir taşıma hatası değil, geçerli bir cevaptır.
 */
export async function runCommand(
  argv: string[],
  { signal }: { signal?: AbortSignal } = {}
): Promise<CommandOutcome> {
  const timeout = AbortSignal.timeout(COMMAND_TIMEOUT_MS);
  const merged = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let res: Response;
  try {
    res = await fetch(`${ODIN_BASE_URL}/api/command`, {
      method: "POST",
      signal: merged,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ argv }),
    });
  } catch (err) {
    /* Çağıranın iptali her zaman kazanır — `httpLoad`taki UI-ADR-121
       kuralının aynısı. Terk edilmiş bir gönderimin hata kutusu açılmaz. */
    if (signal?.aborted && isAbortError(err, signal)) throw err;
    throw classifyError(err, "/api/command");
  }

  /* 400 (bozuk gövde) · 413 (çok büyük) · 404 — hepsi taşıma hatasıdır ve
     düz metin döner, JSON değil. */
  if (!res.ok) {
    throw httpError(res.status, "/api/command", await res.text().catch(() => undefined));
  }

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw contractError("/api/command", "Yanıt JSON olarak çözümlenemedi.");
  }

  if (typeof raw !== "object" || raw === null || !("ok" in raw)) {
    throw contractError("/api/command", '`ok` alanı olmayan bir yanıt geldi.');
  }

  return ayirtEt(raw as CommandResult);
}

export { OdinError };
