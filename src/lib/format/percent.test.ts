import { describe, expect, it } from "vitest";
import { percentFactor, toPercentUnit } from "./percent";
import { formatDate, parseIso } from "./date";

describe("percentFactor", () => {
  it("bildirilmemiş ölçek null döner — tahmin YOK", () => {
    expect(percentFactor(undefined)).toBeNull();
  });

  it("iki ölçeği ayırır", () => {
    expect(percentFactor("0-1")).toBe(1);
    expect(percentFactor("0-100")).toBe(1 / 100);
  });
});

describe("toPercentUnit", () => {
  it("0-100 ölçeğini Num'ın beklediği 0-1'e çevirir", () => {
    expect(toPercentUnit(18.1, "0-100")).toBeCloseTo(0.181, 10);
  });

  it("0-1 ölçeğine dokunmaz", () => {
    expect(toPercentUnit(0.181, "0-1")).toBe(0.181);
  });

  it("ölçek yoksa değer VARSA BİLE null — 100 kat hata riski", () => {
    expect(toPercentUnit(18.1, undefined)).toBeNull();
  });

  it("ölçülemeyen değer null kalır, 0'a düşmez", () => {
    expect(toPercentUnit(null, "0-100")).toBeNull();
    expect(toPercentUnit(Number.NaN, "0-100")).toBeNull();
  });

  it("sıfır geçerli bir ölçümdür, null değildir", () => {
    expect(toPercentUnit(0, "0-100")).toBe(0);
  });
});

/* ------------------------------------------------------------------ */

describe("formatDate — geçersiz tarih ÇÖKERTMEZ (UI-ADR-158)", () => {
  it("geçerli ISO biçimlenir", () => {
    const out = formatDate("2026-07-31T10:00:00Z", {
      day: "2-digit",
      month: "2-digit",
    });
    expect(out).not.toBeNull();
    expect(out).toContain("07");
  });

  it("GEÇERSİZ dize null döner — RangeError ATMAZ", () => {
    /* `Intl.DateTimeFormat.format(new Date(x))` geçersiz tarihte istisna
       FIRLATIR ve render sırasında ekranın tamamını götürür. `report_period`
       alanları şemada yalnız `z.string()`; "2026-W30" bugün de gelebilir. */
    expect(() => formatDate("2026-W30", { day: "2-digit" })).not.toThrow();
    expect(formatDate("2026-W30", { day: "2-digit" })).toBeNull();
    expect(formatDate("", { day: "2-digit" })).toBeNull();
    expect(formatDate(null, { day: "2-digit" })).toBeNull();
    expect(formatDate(undefined, { day: "2-digit" })).toBeNull();
  });

  it("parseIso aynı kuralı paylaşır", () => {
    expect(parseIso("2026-07-31")).toBeInstanceOf(Date);
    expect(parseIso("bozuk")).toBeNull();
  });
});
