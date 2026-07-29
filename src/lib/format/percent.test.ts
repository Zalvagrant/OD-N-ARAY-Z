import { describe, expect, it } from "vitest";
import { percentFactor, toPercentUnit } from "./percent";

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
