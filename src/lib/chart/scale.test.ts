/**
 * Chart ölçekleme birim testleri.
 * Grafiğin doğruluğu göze değil bu dosyaya bağlıdır: yanlış ölçek, sahte
 * bir trend gösterir — CLAUDE.md §2'nin en sinsi ihlali.
 */
import { describe, expect, it } from "vitest";
import {
  getDomain,
  nearestIndex,
  niceTicks,
  toAreaPath,
  toLinePath,
  toPoints,
  toY,
} from "./scale";

describe("getDomain", () => {
  it("boş seride sıfır aralık döner", () => {
    expect(getDomain([])).toEqual([0, 0]);
  });

  it("düz seriyi genişletir — sıfır yükseklikli alan üretmez", () => {
    expect(getDomain([5, 5, 5])).toEqual([0, 10]);
  });

  it("includeZero tabanı sıfıra çeker", () => {
    expect(getDomain([10, 20], { includeZero: true })).toEqual([0, 20]);
  });

  it("sonlu olmayan değerleri yok sayar", () => {
    expect(getDomain([1, NaN, 3, Infinity])).toEqual([1, 3]);
  });
});

describe("toY", () => {
  it("maksimum üstte, minimum altta", () => {
    expect(toY(10, [0, 10], 100)).toBe(0);
    expect(toY(0, [0, 10], 100)).toBe(100);
    expect(toY(5, [0, 10], 100)).toBe(50);
  });
});

describe("toPoints", () => {
  it("tek noktayı ortalar", () => {
    expect(toPoints([4], 100, 50, [0, 10])).toEqual([{ x: 50, y: 30 }]);
  });

  it("eksik değer için null bırakır — ara değer uydurmaz", () => {
    const pts = toPoints([0, null, 10], 100, 100, [0, 10]);
    expect(pts[1]).toBeNull();
    expect(pts[0]).toEqual({ x: 0, y: 100 });
    expect(pts[2]).toEqual({ x: 100, y: 0 });
  });
});

describe("toLinePath", () => {
  it("boşlukta yolu keser, yeni M ile başlar", () => {
    const d = toLinePath(toPoints([0, null, 10], 100, 100, [0, 10]));
    expect(d).toBe("M0 100 M100 0");
  });

  it("kesintisiz seride tek yol üretir", () => {
    const d = toLinePath(toPoints([0, 5, 10], 100, 100, [0, 10]));
    expect(d).toBe("M0 100 L50 50 L100 0");
  });
});

describe("toAreaPath", () => {
  it("tek noktalı seride alan çizmez", () => {
    expect(toAreaPath(toPoints([5], 100, 100, [0, 10]), 100)).toBe("");
  });

  it("tabanı kapatır", () => {
    const d = toAreaPath(toPoints([0, 10], 100, 100, [0, 10]), 100);
    expect(d.endsWith("Z")).toBe(true);
    expect(d).toContain("L100 100");
  });
});

describe("niceTicks", () => {
  it("düz aralıkta tick üretmez", () => {
    expect(niceTicks([5, 5])).toEqual([]);
  });

  it("okunabilir adımlar üretir", () => {
    expect(niceTicks([0, 100], 4)).toEqual([0, 25, 50, 75, 100]);
  });
});

describe("nearestIndex", () => {
  it("en yakın noktayı bulur, null'ları atlar", () => {
    const pts = toPoints([0, null, 10], 100, 100, [0, 10]);
    expect(nearestIndex(pts, 10)).toBe(0);
    expect(nearestIndex(pts, 90)).toBe(2);
  });

  it("nokta yoksa null döner", () => {
    expect(nearestIndex([], 5)).toBeNull();
  });
});
