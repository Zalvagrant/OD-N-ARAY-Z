/**
 * FAIL-CLOSED kapısı — S7 · UI-ADR-115.
 *
 * Meclis (yazılımcılar · terra) S7 kapanışını bu testin varlığına bağladı:
 * "S8'de yanlışlıkla mock veri gösterilmesini engelleyen kritik güvenlik
 * davranışı testsiz kalamaz."
 */

import { describe, expect, it } from "vitest";
import { mockGate } from "./use-mock";

const payload = { kpi: 42 };

describe("mockGate", () => {
  it("gerçek modda veriyi KAPATIR — taşınmamış bölüm mock gösteremez", () => {
    const r = mockGate(false, payload);
    expect(r.data).toBeNull();
    /* Sonsuz iskelet bir cevap değildir: bölüm "veri yok" gerekçesini
       basabilmek için yüklemenin BİTTİĞİNİ görmek zorunda. */
    expect(r.loading).toBe(false);
  });

  it("mock modda veriyi geçirir", () => {
    expect(mockGate(true, payload).data).toEqual(payload);
    expect(mockGate(true, payload).loading).toBe(false);
  });

  it("mock modda veri henüz yokken yükleme durumudur", () => {
    const r = mockGate<typeof payload>(true, null);
    expect(r.data).toBeNull();
    expect(r.loading).toBe(true);
  });

  it("gerçek modda veri VARSA BİLE kapatır — kapı bayrağa bakar, veriye değil", () => {
    expect(mockGate(false, payload).data).toBeNull();
  });
});
