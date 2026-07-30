/** Merkezi saat — saf mantık testleri (tarayıcı gerekmez). */
import { describe, expect, it } from "vitest";
import { relativeTime, remainingTime } from "./tick";

const NOW = Date.parse("2026-07-29T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const ahead = (ms: number) => new Date(NOW + ms).toISOString();

describe("relativeTime", () => {
  it("saat ya da damga yoksa metin uydurmaz", () => {
    expect(relativeTime(ago(1000), null)).toBeNull();
    expect(relativeTime(null, NOW)).toBeNull();
    expect(relativeTime("çöp", NOW)).toBeNull();
  });

  it("eşikleri doğru yazar", () => {
    expect(relativeTime(ago(30_000), NOW)).toBe("az önce");
    expect(relativeTime(ago(2 * 60_000), NOW)).toBe("2 dk önce");
    expect(relativeTime(ago(3 * 3_600_000), NOW)).toBe("3 sa önce");
    expect(relativeTime(ago(2 * 86_400_000), NOW)).toBe("2 gün önce");
  });
});

describe("remainingTime", () => {
  it("saat ya da damga yoksa metin uydurmaz", () => {
    expect(remainingTime(ahead(1000), null)).toBeNull();
    expect(remainingTime(null, NOW)).toBeNull();
    expect(remainingTime("çöp", NOW)).toBeNull();
  });

  /* relativeTime bu tarihlerin HEPSİNE "birazdan" derdi — termin ile yaş
     farklı sorulardır (brifing ekranında görsel incelemede yakalandı). */
  it("gelecek terminleri kalan süreyle yazar", () => {
    expect(remainingTime(ahead(9 * 86_400_000), NOW)).toBe("9 gün kaldı");
    expect(remainingTime(ahead(3 * 3_600_000), NOW)).toBe("3 sa kaldı");
    expect(remainingTime(ahead(90_000), NOW)).toBe("1 dk kaldı");
  });

  it("geçmiş termin gecikmedir, 'birazdan' değil", () => {
    expect(remainingTime(ago(30 * 60_000), NOW)).toBe("süresi doldu");
    expect(remainingTime(ago(5 * 3_600_000), NOW)).toBe("5 sa gecikti");
    expect(remainingTime(ago(2 * 86_400_000), NOW)).toBe("2 gün gecikti");
  });
});
