/** Merkezi saat — saf mantık testleri (tarayıcı gerekmez). */
import { describe, expect, it } from "vitest";
import { liveness, relativeTime } from "./tick";

const NOW = Date.parse("2026-07-29T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe("liveness", () => {
  it("saat bilinmiyorken asla karar vermez", () => {
    expect(liveness(ago(1000), 5000, null)).toBe("unknown");
  });

  it("lastBeat yoksa offline değil, bilinmiyor", () => {
    expect(liveness(null, 5000, NOW)).toBe("unknown");
  });

  it("geçersiz beatIntervalMs bilinmiyor sayılır", () => {
    expect(liveness(ago(1000), 0, NOW)).toBe("unknown");
    expect(liveness(ago(1000), Number.NaN, NOW)).toBe("unknown");
  });

  it("3 aralık içindeyse canlı", () => {
    expect(liveness(ago(14_000), 5000, NOW)).toBe("live");
  });

  it("tam 3 aralıkta hâlâ canlı, aşınca offline", () => {
    expect(liveness(ago(15_000), 5000, NOW)).toBe("live");
    expect(liveness(ago(15_001), 5000, NOW)).toBe("offline");
  });
});

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
