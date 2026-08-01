/**
 * `/api/state.decisions` adaptörü — fixture'ın yerini alan gerçek yol.
 *
 * Bu dosyanın tek derdi: ODIN'in KARAR KAYDI şekli, arayüzün `Decision`
 * sözleşmesine UYDURMADAN çevriliyor mu?
 */
import { describe, expect, it } from "vitest";

import { adaptDecisions } from "./odin-state";

/** ODIN `/api/state.decisions[0]` — `decision-record.schema.json` şekli. */
const odinKarari = {
  id: "DR-2026-901",
  question: "Reklam bütçesi P1 SKU'ya kaydırılsın mı?",
  date: "2026-07-20",
  tier: "D2" as const,
  status: "monitoring" as const,
  domain: "amazon",
  outcome: "approved",
  alternatives: [
    { option: "Kaydır", assessment: "ACOS düşebilir" },
    { option: "Bekle", assessment: "veri yetersiz", risk: "stok tükenir" },
  ],
  recommendation: {
    text: "Kaydır.",
    confidence: 70,
    confidence_breakdown: {
      knowledge_coverage: 70, evidence_strength: 83, expert_agreement: 60,
      model_agreement: 60, historical_success: 50, risk_level: 30,
      missing_information: 20, decision_complexity: 20,
    },
    consensus: { consensus: 75, disagreement: 25 },
    evidence: [
      { knowledge_id: "KO-ads-0001", trust_at_decision: 82,
        role: "supporting", summary: "ACOS 31%" },
      { knowledge_id: "KO-stok-0002", trust_at_decision: 40,
        role: "contradicting", summary: "stok 12 gün" },
    ],
    flip_conditions: ["ACOS 45% üstüne çıkarsa"],
    risks: ["stok tükenmesi"],
    assumptions: ["talep sabit"],
  },
  human_decision: { outcome: "approved", human_reasoning: "kabul" },
};

const zarf = (decisions: unknown[]) =>
  ({ generated_at: "2026-08-01T00:00:00Z", decisions }) as never;

describe("karar adaptörü — ODIN kaydı → Decision", () => {
  it("kartın çizilmesi için gereken HER alanı taşır", () => {
    const [d] = adaptDecisions(zarf([odinKarari]));
    expect(d.id).toBe("DR-2026-901");
    expect(d.tier).toBe("D2");
    expect(d.status).toBe("monitoring");
    expect(d.domain).toBe("amazon");
    expect(d.date).toBe("2026-07-20");
    /* minItems 2 bir ŞEMA kuralı — adaptör düzleştirmemeli. */
    expect(d.alternatives).toHaveLength(2);
    expect(d.alternatives[1].risk).toBe("stok tükenir");
    expect(d.recommendation.recommendation).toBe("Kaydır.");
    expect(d.recommendation.confidence).toBe(70);
    expect(d.recommendation.confidenceBreakdown.evidence_strength).toBe(83);
    expect(d.recommendation.potentialRisks).toEqual(["stok tükenmesi"]);
    expect(d.recommendation.assumptions).toEqual(["talep sabit"]);
    expect(d.recommendation.flipConditions).toEqual(["ACOS 45% üstüne çıkarsa"]);
    expect(d.recommendation.consensusScore).toBe(75);
    expect(d.recommendation.disagreementScore).toBe(25);
    expect(d.humanDecision?.outcome).toBe("approved");
  });

  it("kanıtın YÖNÜ korunur — çelişen kanıt destekleyene dönüşmez", () => {
    /* En tehlikeli sessiz hata bu olurdu: `role` eşlenmeseydi her kanıt
       "supports" görünür ve kart çelişkiyi GİZLERDİ. */
    const ev = adaptDecisions(zarf([odinKarari]))[0].recommendation.evidence;
    expect(ev.map((e) => e.supportsOrContradicts)).toEqual([
      "supports", "contradicts",
    ]);
    expect(ev[0].sourceQuality).toBe(82);
    expect(ev[1].id).toBe("KO-stok-0002");
  });

  it("BİLİNMEYEN rol nötr sayılır — 'destekliyor' varsayılmaz", () => {
    const kayit = structuredClone(odinKarari);
    kayit.recommendation.evidence[0].role = "kim-bilir";
    const [e] = adaptDecisions(zarf([kayit]))[0].recommendation.evidence;
    expect(e.supportsOrContradicts).toBe("neutral");
  });

  it("ODIN'de OLMAYAN kanıt alanları UYDURULMAZ", () => {
    /* `type` ve `freshness` `evidence_snapshot`ta yok. Adaptör bunlara bir
       değer atarsa ekranda ölçülmemiş bir tür/tarih belirir. */
    const [e] = adaptDecisions(zarf([odinKarari]))[0].recommendation.evidence;
    expect(e.type).toBeUndefined();
    expect(e.freshness).toBeUndefined();
  });

  it("verdict verilmemiş karar humanDecision TAŞIMAZ", () => {
    const kayit = { ...odinKarari, human_decision: null };
    expect(adaptDecisions(zarf([kayit]))[0].humanDecision).toBeUndefined();
  });

  it("kayıt yoksa boş dizi — uydurma kart yok", () => {
    expect(adaptDecisions(zarf([]))).toEqual([]);
  });
});
