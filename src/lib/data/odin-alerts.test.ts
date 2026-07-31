/**
 * Runtime Alert sözleşmesi — ODIN ADR-0151 (UI-ADR-129).
 *
 * Fixture ODIN'in yayınladığı biçimden alındı; eşik, gruplama ve
 * `requires_action` kararı ODIN'de verilir — arayüz hiçbirini hesaplamaz.
 */

import { describe, expect, it } from "vitest";

import { alertSchema } from "./schemas";

const RUNTIME_ALERT = {
  id: "AL-runtime-creator_curator",
  severity: "critical" as const,
  title: "creator_curator işi 5 kez üst üste başarısız",
  module: "runtime",
  requiresAction: true,
  evidence: ["runtime/metrics.json#creator_curator"],
  createdAt: "2026-07-31T00:00:43",
  suggestedAction: "`creator_curator` işinin son hatasına bak (RuntimeError)",
};

describe("runtime Alert", () => {
  it("kanonik Alert şemasından geçer — çeviri gerekmiyor", () => {
    /* ADR-0151 `runtime`ı ADR-0143'ün modül sözlüğüne açıkça ekledi;
       arayüzün `module` alanı serbest metin olduğu için ayrı bir tip
       gerekmiyor. */
    expect(() => alertSchema.parse(RUNTIME_ALERT)).not.toThrow();
  });

  it("`module` alanı altyapı alarmını iş alarmından ayırt ettirir", () => {
    const parsed = alertSchema.parse(RUNTIME_ALERT);
    expect(parsed.module).toBe("runtime");
  });

  it("kanıtsız alarm GEÇMEZ", () => {
    /* ADR-0081: kanıtsız iddia yayınlanmaz. */
    expect(() =>
      alertSchema.parse({ ...RUNTIME_ALERT, evidence: undefined })
    ).toThrow();
  });

  it("`requiresAction` varsayılansızdır", () => {
    const without: Record<string, unknown> = { ...RUNTIME_ALERT };
    delete without.requiresAction;
    expect(() => alertSchema.parse(without)).toThrow();
  });

  it("ODIN sözlüğü dışında bir severity geçmez", () => {
    expect(() =>
      alertSchema.parse({ ...RUNTIME_ALERT, severity: "high" })
    ).toThrow();
  });
});
