/**
 * `/api/capabilities` adaptörü — GERÇEK yüke karşı (UI-ADR-206).
 * Fixture çalışan cockpit'ten (2 Ağu 2026: 4 yetenek, dördü de kapalı).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptCapabilities, capabilitiesSchema } from "./odin-capability";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-capabilities.json"),
    "utf8"
  )
);

describe("gerçek /api/capabilities yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => capabilitiesSchema.parse(raw)).not.toThrow();
  });

  it("KAPALI her yetenek gerekçe VE kanıt taşır", () => {
    const caps = adaptCapabilities(capabilitiesSchema.parse(raw));
    expect(caps.length).toBeGreaterThan(0);
    for (const c of caps.filter((x) => !x.available)) {
      expect(c.reason).toBeTruthy();
      expect(c.evidence.length).toBeGreaterThan(0);
      expect(c.requires).toBeTruthy();
    }
  });

  it("her yetenek bir nav rotasına bağlıdır", () => {
    const caps = adaptCapabilities(capabilitiesSchema.parse(raw));
    for (const c of caps) expect(c.route.startsWith("/")).toBe(true);
  });

  it("gerekçe SABİT DEĞİL — available true ise reason düşer", () => {
    const parsed = capabilitiesSchema.parse(raw);
    const acik = {
      ...parsed,
      capabilities: [
        { ...parsed.capabilities[0], available: true, reason: null },
      ],
    };
    const c = adaptCapabilities(acik)[0];
    expect(c.available).toBe(true);
    expect(c.reason).toBeNull();
  });

  it("snake_case sızmaz", () => {
    const caps = adaptCapabilities(capabilitiesSchema.parse(raw));
    expect(JSON.stringify(caps)).not.toMatch(/measured_at/);
  });
});
