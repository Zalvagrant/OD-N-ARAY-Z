/**
 * `/api/storage` adaptörü — GERÇEK ODIN yüküne karşı (UI-ADR-200).
 * Fixture çalışan cockpit'ten alındı (2 Ağu 2026, 49 giriş / 2 günlük).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptStorage, storageSchema } from "./odin-storage";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-storage.json"),
    "utf8"
  )
);

describe("gerçek /api/storage yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => storageSchema.parse(raw)).not.toThrow();
  });

  it("dizinler büyükten küçüğe gelir ve sıra korunur", () => {
    const s = adaptStorage(storageSchema.parse(raw));
    const bytes = s.entries.map((e) => e.bytes);
    expect(bytes).toEqual([...bytes].sort((a, b) => b - a));
    expect(s.entries.length).toBeGreaterThan(0);
  });

  it("toplam, satırların toplamına eşittir — arayüz yeniden hesaplamaz", () => {
    const s = adaptStorage(storageSchema.parse(raw));
    expect(s.totalBytes).toBe(
      s.entries.reduce((sum, e) => sum + e.bytes, 0)
    );
    expect(s.totalFiles).toBe(s.entries.reduce((sum, e) => sum + e.files, 0));
  });

  it("büyüme hızı ÖLÇÜLENDİR: bayt/gün ≈ bayt / gözlenen gün", () => {
    const s = adaptStorage(storageSchema.parse(raw));
    const olculen = s.logs.filter((l) => l.bytesPerDay !== null);
    expect(olculen.length).toBeGreaterThan(0);
    for (const l of olculen) {
      expect(l.spanDays).not.toBeNull();
      /* `span_days` iki hane yuvarlanmış YAYINDIR; hızı ondan yeniden
         hesaplamak binde birlik bir sapma verir. Aranan şey kesinlik
         değil BİRİM: gün yerine saat üretilirse oran 24 kat sapar. */
      const oran = l.bytesPerDay! / (l.bytes / l.spanDays!);
      expect(oran).toBeGreaterThan(0.99);
      expect(oran).toBeLessThan(1.01);
    }
  });

  it("snake_case sızmaz — her alan camelCase'e çevrilir", () => {
    const s = adaptStorage(storageSchema.parse(raw));
    const flat = JSON.stringify({ ...s, entries: [], logs: s.logs });
    expect(flat).not.toMatch(/_ts|_per_day|span_days|free_bytes|used_pct/);
  });
});
