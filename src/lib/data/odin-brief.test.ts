/**
 * Brifing adaptörü — fixture'ın yerini alan gerçek yol.
 *
 * Derdi tek: ODIN'in ÖLÇTÜĞÜ yayınlanıyor, ölçmediği UYDURULMUYOR.
 */
import { describe, expect, it } from "vitest";

import { adaptBrief } from "./odin-state";

const durum = {
  generated_at: "2026-08-01T05:00:00Z",
  core_count: 36,
  events_today: 40,
  staging_stats: { count: 340, avg_trust: 56.1 },
  health_score: {
    score: 68,
    coverage: "6/6",
    operational: { score: 67 },
    critical: [
      { label: "Likidite riski: nakit akışı -70,188 TL/ay, runway 1.3 ay" },
      { label: "Kaldıraç tavanı aşıldı: borç 5.9 aylık işletme neti" },
    ],
  },
} as never;

describe("brifing adaptörü", () => {
  it("ODIN'in ölçtüğü her sayıyı etiketiyle taşır", () => {
    const b = adaptBrief(durum);
    expect(b.numbers).toEqual({
      "Şirket sağlığı": 68,
      "Operasyonel hazırlık": 67,
      "Core kayıt": 36,
      "Bekleyen staging": 340,
      "Ortalama güven": 56.1,
      "Bugünkü olay": 40,
      Kapsam: "6/6",
    });
  });

  it("ANALİZ ODIN'in kendi cümlesidir — arayüz cümle kurmaz", () => {
    expect(adaptBrief(durum).analysis).toBe(
      "Likidite riski: nakit akışı -70,188 TL/ay, runway 1.3 ay · " +
        "Kaldıraç tavanı aşıldı: borç 5.9 aylık işletme neti"
    );
  });

  it("ODIN'in ÜRETMEDİĞİ üç adım UYDURULMAZ", () => {
    /* Bu testin tamamı tek bir kuralı koruyor: yorum, öneri ve kanıt
       ODIN'de yok. Adaptör bunlara değer atarsa ekranda ölçülmemiş bir
       AI çıktısı belirir ve okuyan gerçek olandan ayırt edemez. */
    const b = adaptBrief(durum);
    expect(b.interpretation).toBeUndefined();
    expect(b.recommendation).toBeUndefined();
    expect(b.evidence).toBeUndefined();
  });

  it("ÖLÇÜLMEMİŞ sayı satır AÇMAZ — sıfır yazılmaz", () => {
    /* `0` yazmak "ölçtük, sıfır çıktı" demektir; okuyan ayırt edemez. */
    const eksik = {
      generated_at: "2026-08-01T05:00:00Z",
      core_count: null,
      events_today: 40,
      staging_stats: { count: null, avg_trust: null },
      health_score: { score: null, operational: null, critical: [] },
    } as never;
    const b = adaptBrief(eksik);
    expect(b.numbers).toEqual({ "Bugünkü olay": 40 });
    expect(Object.values(b.numbers)).not.toContain(0);
  });

  it("kritik durum yoksa boş string DEĞİL, ölçümün kendisi yazılır", () => {
    const sakin = { ...(durum as object), health_score: { score: 90, critical: [] } } as never;
    expect(adaptBrief(sakin).analysis).toMatch(/ölçülmedi/);
  });

  it("health_score HİÇ yoksa çökmez", () => {
    const bos = { generated_at: "x", health_score: null } as never;
    expect(adaptBrief(bos).numbers).toEqual({});
  });
});
