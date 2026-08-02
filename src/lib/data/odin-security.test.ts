/**
 * `/api/security` adaptörü — GERÇEK yüke karşı (UI-ADR-209).
 * Fixture çalışan cockpit'ten (2 Ağu 2026).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptSecurity, securitySchema } from "./odin-security";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-security.json"),
    "utf8"
  )
);

describe("gerçek /api/security yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => securitySchema.parse(raw)).not.toThrow();
  });

  it("PUAN HER ZAMAN NULL — şema başka bir şeyi kabul etmez", () => {
    const s = adaptSecurity(securitySchema.parse(raw));
    expect(s.score).toBeNull();
    expect(s.scoreReason.length).toBeGreaterThan(10);
    /* Sözleşme donduruldu: bir gün puan gelirse şema PATLAR ve bu
       bilinçlidir — puan yayınlamak ayrı bir karardır. */
    expect(() =>
      securitySchema.parse({ ...raw, score: 80 })
    ).toThrow();
  });

  it("sır içeriği taşınmaz — yalnız ad, dolu mu, tarih", () => {
    const s = adaptSecurity(securitySchema.parse(raw));
    for (const f of s.secrets.files) {
      expect(Object.keys(f).sort()).toEqual(["name", "present", "updatedAt"]);
    }
  });

  it("boş anahtar listesi dosya listesiyle tutarlıdır", () => {
    const s = adaptSecurity(securitySchema.parse(raw));
    const bos = s.secrets.files.filter((f) => !f.present).map((f) => f.name);
    expect(s.secrets.empty.sort()).toEqual(bos.sort());
    expect(s.secrets.count).toBe(s.secrets.files.length);
  });

  it("bağlama ölçüldüyse loopback kararı da ölçülmüştür", () => {
    const s = adaptSecurity(securitySchema.parse(raw));
    expect(s.binding.measured).toBe(true);
    expect(s.binding.loopbackOnly).toBe(true);
    expect(s.binding.host).toBe("127.0.0.1");
  });

  it("dışa açık bir bağlama gizlenmez", () => {
    const parsed = securitySchema.parse(raw);
    const acik = adaptSecurity({
      ...parsed,
      binding: { ...parsed.binding, host: "0.0.0.0", loopback_only: false },
    });
    expect(acik.binding.loopbackOnly).toBe(false);
  });

  it("snake_case sızmaz", () => {
    const s = adaptSecurity(securitySchema.parse(raw));
    expect(JSON.stringify(s)).not.toMatch(
      /score_reason|loopback_only|allowed_commands|staged_pending|last_access/
    );
  });
});
