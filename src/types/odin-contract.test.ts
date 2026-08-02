/**
 * SÖZLEŞME FIXTURE TESTİ — UI-ADR-099 (drift muhafızı).
 *
 * Amaç "tip derleniyor mu" değil: "backend'le hâlâ aynı dili mi
 * konuşuyoruz". `contracts/odin/decision-record.valid.json` ODIN'in KENDİ
 * doğrulayıcısından (odin/schema.py) geçirilerek üretildi — elle yazılmış
 * "geçerli sandığımız" bir örnek değildir.
 *
 * Sözleşme iki yönden kayabilir; ikisi de burada kırılır:
 *  - ODIN alan ekler/değiştirir → snapshot güncellenince yapı denetimleri düşer.
 *  - UI tipi sessizce alan düşürür → satisfies ataması derlemede düşer.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ODIN_MIN_REASON_CHARS,
  ODIN_VERDICTS,
  odinConfidenceLevel,
  toRecClass,
  type OdinConfidenceBreakdown,
  type OdinDecisionRecord,
} from "./odin";

const raw = readFileSync(
  join(__dirname, "../../contracts/odin/decision-record.valid.json"),
  "utf-8"
);
/* Tip ataması testin yarısıdır: alan adı/tip kayarsa tsc burada düşer. */
const record: OdinDecisionRecord = JSON.parse(raw);

const schema = JSON.parse(
  readFileSync(
    join(__dirname, "../../contracts/odin/decision-record.schema.json"),
    "utf-8"
  )
);

describe("ODIN sözleşme fixture'ı", () => {
  it("şemanın zorunlu kök alanları tipte ve örnekte var", () => {
    for (const key of schema.required as string[]) {
      expect(record, `kök alan eksik: ${key}`).toHaveProperty(key);
    }
  });

  it("recommendation'ın 10 zorunlu alanı örnekte var — flip_conditions dahil", () => {
    const req = schema.properties.recommendation.required as string[];
    expect(req).toContain("flip_conditions");
    expect(req).toContain("assumptions");
    expect(req).toContain("confidence_breakdown");
    for (const key of req) {
      expect(record.recommendation, `recommendation.${key} eksik`).toHaveProperty(key);
    }
  });

  it("confidence_breakdown şemadaki 8 kanonik bileşeni taşıyor", () => {
    const req = schema.properties.recommendation.properties.confidence_breakdown
      .required as (keyof OdinConfidenceBreakdown)[];
    expect(req).toHaveLength(8);
    for (const key of req) {
      expect(typeof record.recommendation.confidence_breakdown[key]).toBe("number");
    }
  });

  it("alternatives KARARIN alanı ve şema en az 2 istiyor", () => {
    expect(schema.properties.alternatives.minItems).toBe(2);
    expect(record.alternatives.length).toBeGreaterThanOrEqual(2);
    /* Önerinin içinde alternatives OLMADIĞINI da sabitle — UI-ADR-091
       düzeltmesinin dayanağı budur. */
    expect(schema.properties.recommendation.properties).not.toHaveProperty("alternatives");
  });

  it("karar kapatma yalnızca insana ait (decided_by const)", () => {
    expect(record.human_decision.decided_by).toBe("human-owner");
  });

  it("tier ve status sözlükleri ODIN'inki — UI'nın eski 9 durumu değil", () => {
    expect(schema.properties.tier.enum).toEqual(["D1", "D2", "D3"]);
    expect(schema.properties.status.enum).toEqual(["open", "monitoring", "closed"]);
  });

  it("verdict sözlüğü ve gerekçe kuralı lifecycle.py ile aynı", () => {
    expect([...ODIN_VERDICTS]).toEqual(["approved", "rejected", "deferred"]);
    expect(ODIN_MIN_REASON_CHARS).toBe(8);
  });

  it("kanonik güven bantları trust.py ile aynı (80/60/40/20)", () => {
    expect(odinConfidenceLevel(85)).toBe("very-high");
    expect(odinConfidenceLevel(80)).toBe("very-high");
    expect(odinConfidenceLevel(71.35)).toBe("high");
    expect(odinConfidenceLevel(59.9)).toBe("moderate");
    expect(odinConfidenceLevel(20)).toBe("low");
    expect(odinConfidenceLevel(3)).toBe("very-low");
    /* Eski UI eşiği 50'nin bant SINIRI OLMADIĞINI sabitle. */
    expect(odinConfidenceLevel(50)).toBe(odinConfidenceLevel(41));
  });

  it("disagreement türetilmiştir: 100 - consensus (consensus.py)", () => {
    const r = record.recommendation;
    expect(r.consensus_score + r.disagreement_score).toBeCloseTo(100, 1);
  });

  it("toRecClass fail-closed: yalnız A/B/C geçer, gerisi undefined (UI-ADR-194)", () => {
    expect(toRecClass("A")).toBe("A");
    expect(toRecClass("B")).toBe("B");
    expect(toRecClass("C")).toBe("C");
    /* `undefined` = "sınıf bilinmiyor" → VerdictForm gerekçeyi ZORUNLU
       kılar (UI-ADR-156). Sessizce bir sınıfa dönüştürme yok. */
    expect(toRecClass(null)).toBeUndefined();
    expect(toRecClass(undefined)).toBeUndefined();
    expect(toRecClass("D")).toBeUndefined();
    expect(toRecClass("a")).toBeUndefined();
    expect(toRecClass("")).toBeUndefined();
  });
});
