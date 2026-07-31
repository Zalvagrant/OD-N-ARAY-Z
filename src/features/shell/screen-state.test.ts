/**
 * Ekran iskelesi — UI-ADR-131.
 *
 * Bu türetmeler üç ekranda kopyalanmıştı ve hiçbiri test edilmiyordu
 * çünkü bileşen gövdesinin içindeydiler.
 */

import { describe, expect, it, vi } from "vitest";
import { demoError, emptied, noContract, screenState } from "./screen-state";

const src = () => ({ refetch: vi.fn() });
const meta = { source: "mock", lastUpdated: "2026-07-31T00:00:00Z", freshness: "live" } as const;

describe("screenState", () => {
  it("demo yokken yalnız birincil kaynağın yüklemesini yansıtır", () => {
    const s = screenState({
      demo: undefined,
      primary: { loading: true },
      sources: [],
      error: demoError("x", "y"),
    });
    expect(s.loading).toBe(true);
    expect(s.error).toBeNull();
    expect(s.isEmpty).toBe(false);
  });

  it("demo='error' hata basar ama yüklemeyi açmaz", () => {
    const e = demoError("Amazon verisi yüklenemedi", "bütçe kararı verilmemeli");
    const s = screenState({
      demo: "error",
      primary: { loading: false },
      sources: [],
      error: e,
    });
    expect(s.error).toBe(e);
    expect(s.loading).toBe(false);
  });

  it("reloadAll HER kaynağı tazeler — biri unutulursa ekran yarım yenilenir", () => {
    const a = src();
    const b = src();
    const c = src();
    screenState({
      demo: undefined,
      primary: { loading: false },
      sources: [a, b, c],
      error: demoError("x", "y"),
    }).reloadAll();
    expect(a.refetch).toHaveBeenCalledOnce();
    expect(b.refetch).toHaveBeenCalledOnce();
    expect(c.refetch).toHaveBeenCalledOnce();
  });
});

describe("emptied", () => {
  it("veri yoksa null kalır — 'veri yok' ile 'ölçüldü, boş' AYRI ifadelerdir", () => {
    expect(emptied(null)).toBeNull();
  });

  it("boşaltır ama META'yı korur", () => {
    expect(emptied({ data: [1, 2, 3], meta })).toEqual({ data: [], meta });
  });
});

describe("demoError", () => {
  it("beş adımın dördünü doldurur; why/fix her ekranda ortaktır", () => {
    const e = demoError("Operasyon verisi yüklenemedi", "Görev tahtası güncel değil.");
    expect(e.what).toBe("Operasyon verisi yüklenemedi");
    expect(e.why).toContain("127.0.0.1");
    expect(e.fix).toContain("ODIN sunucusunu başlat");
  });
});

describe("noContract", () => {
  it("Section'ın beklediği adları ÜRETİR — adaptör gerekmez", () => {
    const v = noContract("Order", "sipariş sözleşmesi yok", "13-...md §16.4");
    expect(Object.keys(v).sort()).toEqual([
      "emptyDescription",
      "emptySuggestion",
      "emptyTitle",
    ]);
    expect(v.emptyTitle).toBe("Order sözleşmesi tanımlı değil");
  });
});
