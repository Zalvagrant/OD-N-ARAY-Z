/**
 * `/api/state` adaptörünün sözleşme kapısı — S8.
 *
 * Fixture UYDURULMADI: aşağıdaki satırlar 30 Temmuz 2026'da çalışan ODIN
 * cockpit'inden (`GET /api/state`) alınmış GERÇEK yayının kısaltılmışıdır.
 * Adaptör testinin değeri, ODIN'in gerçekten ürettiği biçimi kilitlemesidir;
 * hayalî bir biçme karşı yazılan test, biçim değişince sessiz kalır.
 */

import { describe, expect, it } from "vitest";
import { adaptGoals } from "./odin-state";
import { goalSchema } from "./schemas";

/** ODIN'in canlı yayınından — `cockpit.py` satır 179-183. */
const LIVE = {
  generated_at: "2026-07-30T20:28:51+00:00",
  goals: [
    {
      id: "GOAL-ACIL-STOK-2026-07",
      level: "urgent",
      label: "ACIL: 8 urun icin tedarikci siparisi",
      target: "OTICON (1.5 ay tedarik, simdi ver)",
      progress_pct: 25,
    },
    {
      id: "GOAL-ADS-API-BASVURU",
      level: "weekly",
      label: "ACIL YAPILACAK: Amazon Ads API erisim basvurusu",
      target: "Basvuru gonderildi -> onay bekleniyor",
      progress_pct: 0,
    },
    {
      id: "GOAL-RETURN-INTEL",
      level: "quarterly",
      label: "Return Intelligence Engine",
      target: "Her SKU icin Return Risk Index (0-100)",
      progress_pct: null,
    },
  ],
};

describe("adaptGoals — ODIN yayını → Goal sözleşmesi", () => {
  it("canlı yayının tamamı kanonik şemayı geçer", () => {
    for (const g of adaptGoals(LIVE)) {
      expect(() => goalSchema.parse(g)).not.toThrow();
    }
  });

  it("alan adları çevrilir: progress_pct → progressPct", () => {
    expect(adaptGoals(LIVE)[0]).toEqual({
      id: "GOAL-ACIL-STOK-2026-07",
      level: "urgent",
      label: "ACIL: 8 urun icin tedarikci siparisi",
      target: "OTICON (1.5 ay tedarik, simdi ver)",
      progressPct: 25,
    });
  });

  it("ölçülmemiş ilerleme NULL kalır — sıfırla karıştırılmaz", () => {
    const [stok, ads, ret] = adaptGoals(LIVE);
    /* 0 gerçek bir ölçümdür ("başlamadı"), null ise "hiç ölçülmedi".
       İkisini birleştirmek, başlamamış bir hedefi ölçülmemiş gibi
       göstermek (ya da tersi) demektir. */
    expect(ads.progressPct).toBe(0);
    expect(ret.progressPct).toBeNull();
    expect(stok.progressPct).toBe(25);
  });

  it("BOŞ hedef metni null'a çevrilir — ekranda boş satır olmaz", () => {
    /* ODIN tanımsız hedefi boş string yayınlıyor (`goal.get("target", "")`),
       null değil. Çevrilmezse `target` doluymuş gibi render edilir. */
    const out = adaptGoals({ goals: [{ ...LIVE.goals[0], target: "   " }] });
    expect(out[0].target).toBeNull();
  });

  it("hedef yoksa boş liste — uydurma kayıt üretilmez", () => {
    expect(adaptGoals({ goals: [] })).toEqual([]);
    expect(adaptGoals({})).toEqual([]);
  });

  it("ODIN beklenmedik biçim yayınlarsa SESSİZ GEÇMEZ", () => {
    /* progress_pct string gelirse: sayıya zorlamak yerine patlar; hata
       `useOdinQuery` içinde beş adımlı sözleşme hatasına dönüşür. */
    expect(() =>
      adaptGoals({ goals: [{ ...LIVE.goals[0], progress_pct: "25" }] })
    ).toThrow();
  });
});
