/**
 * `directors` sözleşmesi — ODIN ADR-0148 (UI-ADR-127).
 *
 * Fixture ODIN'in CANLI `/api/state` yanıtından kopyalandı
 * (2026-07-31). Uydurulmuş bir örnek, sözleşme değiştiğinde testi yeşil
 * bırakır.
 */

import { describe, expect, it } from "vitest";

import { runtimeDirectorSchema } from "./schemas";

const LIVE = {
  id: "data-director",
  status: "unknown",
  lastBeat: "2026-07-31T13:37:48.383464",
  beatIntervalMs: 3600000,
  failuresTotal: 2,
  lastError: null,
  jobs: [
    {
      id: "amazon_ingest",
      agent: "data-director",
      cadence: "saatlik",
      status: "unknown",
      lastBeat: "2026-07-31T13:37:48.383464",
      beatIntervalMs: 3600000,
      runs: 35,
      failuresTotal: 1,
      lastError: "NameError",
    },
  ],
};

const clone = () => JSON.parse(JSON.stringify(LIVE)) as typeof LIVE;

describe("RuntimeDirector şeması", () => {
  it("ODIN'in canlı yanıtını kabul eder", () => {
    expect(() => runtimeDirectorSchema.parse(LIVE)).not.toThrow();
  });

  it("DÖRT durumu da tanır — `stale` üçe sıkıştırılmadı", () => {
    for (const status of ["healthy", "stale", "failed", "unknown"]) {
      const raw = clone();
      raw.status = status;
      expect(() => runtimeDirectorSchema.parse(raw), status).not.toThrow();
    }
  });

  it("sözlük dışı bir durum sessizce geçmez", () => {
    const raw = clone();
    raw.status = "degraded";
    expect(() => runtimeDirectorSchema.parse(raw)).toThrow();
  });

  it("bilinmeyen cadence `null` olarak KABUL edilir — tahmin beklenmiyor", () => {
    const raw = clone();
    raw.beatIntervalMs = null as unknown as number;
    expect(() => runtimeDirectorSchema.parse(raw)).not.toThrow();
  });

  it("hiç çalışmamış direktörün `lastBeat`i null olabilir", () => {
    const raw = clone();
    raw.lastBeat = null as unknown as string;
    expect(() => runtimeDirectorSchema.parse(raw)).not.toThrow();
  });

  it("`consecutiveFailures` diye bir alan BEKLENMEZ", () => {
    /* ODIN ardışık seri ölçmüyor; o adı sözleşmeye koymak, arayüzün
       fark edemeyeceği bir yalan olurdu (ADR-0148 §6). */
    const parsed = runtimeDirectorSchema.parse(LIVE);
    expect(parsed).not.toHaveProperty("consecutiveFailures");
    expect(parsed.failuresTotal).toBe(2);
  });

  it("negatif hata sayısı reddedilir", () => {
    const raw = clone();
    raw.failuresTotal = -1;
    expect(() => runtimeDirectorSchema.parse(raw)).toThrow();
  });
});
