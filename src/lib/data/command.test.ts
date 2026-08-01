/**
 * Komut kapısı ve karar gönderimi — ER-0025 · UI-ADR-192.
 *
 * ÖLÇÜLEN ŞEY: arayüzün ODIN'in sözleşmesine UYDUĞU. Sözleşme
 * `odin/cockpit.py: run_command`tan okundu ve `tests/test_cockpit.py`te
 * çivili; buradaki testler onun ARAYÜZ UCUdur.
 *
 * Backend testinin sabitlediği ayrım aynen burada da ölçülür:
 *     assertIn("exit", result)           → komut KOŞTU
 *     assertNotEqual(result["exit"], 0)  → verdict REDDEDİLDİ
 *     assertIn("REDDED", result["output"])
 * yani `exit` anahtarının VARLIĞI, beyaz liste reddi ile reddedilmiş
 * verdict'i ayıran tek sinyaldir — HTTP kodu değil (üçü de 200 döner).
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { runCommand } from "./command";
import { verdictArgv } from "./use-verdict";
import { OdinError } from "./errors";

/** `fetch`i tek yerden değiştirir; her test kendi yanıtını verir. */
function fetchVer(yanit: {
  ok?: boolean;
  status?: number;
  json?: unknown;
  text?: string;
  atar?: unknown;
}) {
  const sahte = vi.fn(async () => {
    if (yanit.atar) throw yanit.atar;
    return {
      ok: yanit.ok ?? true,
      status: yanit.status ?? 200,
      json: async () => {
        if (yanit.json === undefined) throw new SyntaxError("not json");
        return yanit.json;
      },
      text: async () => yanit.text ?? "",
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", sahte);
  return sahte;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("verdictArgv — CLI imzasına uyum", () => {
  /* `odin/__main__.py:98`:
       ceo verdict <rec_id> <approved|rejected|deferred> [neden] [--revisit <tarih>] */

  it("onay: gerekçe verilmişse eklenir", () => {
    expect(
      verdictArgv({
        decisionId: "rec-1",
        input: { verdict: "approved", reason: "Bütçe uygun ve risk kabul edilebilir" },
      })
    ).toEqual([
      "ceo",
      "verdict",
      "rec-1",
      "approved",
      "Bütçe uygun ve risk kabul edilebilir",
    ]);
  });

  it("BOŞ gerekçe hiç eklenmez — boş string olarak DEĞİL", () => {
    /* `args[0] if args else None` boş stringi "verilmiş gerekçe" sayar ve
       ODIN'in ADR-0131 gerekçe kapısı sessizce atlanmış olurdu. */
    expect(
      verdictArgv({ decisionId: "rec-1", input: { verdict: "approved", reason: "   " } })
    ).toEqual(["ceo", "verdict", "rec-1", "approved"]);
  });

  it("erteleme: --revisit ATLANMAZ", () => {
    /* ADR-0131 tarihsiz ertelemeyi REDDEDER; backend testi bunu sabitliyor.
       Bayrak gönderilmezse HER erteleme sunucuda reddedilirdi. */
    expect(
      verdictArgv({
        decisionId: "rec-9",
        input: { verdict: "deferred", reason: "Çeyrek sonunu bekle", revisitAt: "2026-10-01" },
      })
    ).toEqual([
      "ceo",
      "verdict",
      "rec-9",
      "deferred",
      "Çeyrek sonunu bekle",
      "--revisit",
      "2026-10-01",
    ]);
  });

  it("erteleme DEĞİLSE revisitAt gönderilmez", () => {
    expect(
      verdictArgv({
        decisionId: "rec-2",
        input: { verdict: "rejected", reason: "Kanıt yetersiz", revisitAt: "2026-10-01" },
      })
    ).toEqual(["ceo", "verdict", "rec-2", "rejected", "Kanıt yetersiz"]);
  });

  it("gerekçesiz erteleme: tarih yine de doğru konumda", () => {
    expect(
      verdictArgv({
        decisionId: "rec-3",
        input: { verdict: "deferred", revisitAt: "2026-12-31" },
      })
    ).toEqual(["ceo", "verdict", "rec-3", "deferred", "--revisit", "2026-12-31"]);
  });
});

describe("runCommand — üç yanıt biçimi ayırt edilir", () => {
  it("BAŞARI: exit 0 → success", async () => {
    fetchVer({
      json: { ok: true, exit: 0, output: "owner karari kaydedildi: rec-1 -> approved" },
    });
    const r = await runCommand(["ceo", "verdict", "rec-1", "approved"]);
    expect(r.kind).toBe("success");
    expect(r).toHaveProperty("output", "owner karari kaydedildi: rec-1 -> approved");
  });

  it("REDDEDİLMİŞ VERDICT: exit VAR ve ≠0 → refused, metin AYNEN", async () => {
    /* Backend: `print(f"REDDEDİLDİ: {exc}", file=sys.stderr); return 1` */
    const metin = "REDDEDİLDİ: deferred bir gelecek tarih ister (--revisit)";
    fetchVer({ json: { ok: false, exit: 1, output: metin } });

    const r = await runCommand(["ceo", "verdict", "rec-x", "deferred"]);
    expect(r.kind).toBe("refused");
    /* ER-0025: refusal text verbatim — arayüz metni yeniden yazmaz. */
    expect(r).toHaveProperty("output", metin);
    expect(r).toHaveProperty("exit", 1);
  });

  it("BEYAZ LİSTE REDDİ: exit YOK → rejected", async () => {
    /* Komut hiç spawn edilmedi; kayıt kesinlikle yok. */
    fetchVer({
      json: { ok: false, error: "'rm' is not an ODIN command. Allowed: ai, ceo, cogs" },
    });
    const r = await runCommand(["rm", "-rf"]);
    expect(r.kind).toBe("rejected");
    expect(r).toHaveProperty("error", expect.stringContaining("is not an ODIN command"));
  });

  it("SUNUCU ZAMAN AŞIMI: exit YOK + timeout metni → timeout", async () => {
    /* `except subprocess.TimeoutExpired: {"ok":False,"error":"timeout (300s)"}`
       Beyaz liste reddinden AYRI olmak zorunda: orada kayıt YOK, burada
       kayıt OLABİLİR ve tekrar göndermek çift kayıt üretir. */
    fetchVer({ json: { ok: false, error: "timeout (300s)" } });
    const r = await runCommand(["ceo", "verdict", "rec-1", "approved"]);
    expect(r.kind).toBe("timeout");
  });

  it("`exit` 0 ama ok:false gelse bile SUCCESS — ayrım exit'te", async () => {
    /* `ok` sunucuda `exit == 0`dan türetiliyor; tek gerçek kaynak `exit`.
       İkisi ayrışırsa `exit`e uyulur, yoksa aynı olguya iki cevap olur. */
    fetchVer({ json: { ok: false, exit: 0, output: "tamam" } });
    expect((await runCommand(["ceo", "verdict", "r", "approved"])).kind).toBe("success");
  });
});

describe("runCommand — taşıma hataları OdinError olarak FIRLATILIR", () => {
  it("HTTP 400 (bozuk gövde) → http hatası", async () => {
    fetchVer({ ok: false, status: 400, text: "bad request" });
    await expect(runCommand(["ceo"])).rejects.toBeInstanceOf(OdinError);
  });

  it("HTTP 413 (çok büyük gövde) → http hatası", async () => {
    fetchVer({ ok: false, status: 413, text: "payload too large" });
    await expect(runCommand(["ceo"])).rejects.toMatchObject({ kind: "http", status: 413 });
  });

  it("ağ kopması → network hatası", async () => {
    fetchVer({ atar: new TypeError("Failed to fetch") });
    await expect(runCommand(["ceo"])).rejects.toMatchObject({ kind: "network" });
  });

  it("JSON olmayan yanıt → sözleşme hatası", async () => {
    fetchVer({ json: undefined });
    await expect(runCommand(["ceo"])).rejects.toMatchObject({ kind: "contract" });
  });

  it("`ok` alanı olmayan yanıt → sözleşme hatası", async () => {
    /* Sunucu biçim değiştirirse sessizce "başarısız" saymak yerine
       sözleşme hatası verilir: sessiz yorum, yanlış yorumdur. */
    fetchVer({ json: { sonuc: "belki" } });
    await expect(runCommand(["ceo"])).rejects.toMatchObject({ kind: "contract" });
  });
});

describe("runCommand — istek biçimi", () => {
  it("POST · /api/command · gövde {argv}", async () => {
    const f = fetchVer({ json: { ok: true, exit: 0, output: "" } });
    await runCommand(["ceo", "verdict", "rec-1", "approved"]);

    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/api/command");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      argv: ["ceo", "verdict", "rec-1", "approved"],
    });
  });

  it("iptal sinyali geçirilir — terk edilen gönderim ölür", async () => {
    const f = fetchVer({ json: { ok: true, exit: 0, output: "" } });
    await runCommand(["pending"]);
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.signal).toBeDefined();
  });
});
