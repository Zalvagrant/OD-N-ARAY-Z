"use client";

/**
 * ODIN `/api/state` adaptörü — S8 D8.A · D8.B.
 *
 * S7'de `httpLoad()` yazılmış ama hiçbir ekran çağırmamıştı. Burası onu
 * bağlayan yer: ODIN'in ham projeksiyonu, arayüzün kanonik sözleşmelerine
 * ÇEVRİLİR ve `DataEnvelope` zarfına sarılır.
 *
 * SINIR (meclis 2/2, UI-ADR-116): arayüz ODIN'in DİSKİNİ OKUMAZ.
 * `odin-data/core/` içinde bugünün tarihiyle promote edilmiş SP-API ve Ads
 * kayıtları duruyor ama `/api/state` onları yayınlamıyor; dosyayı doğrudan
 * okumak hem mimariyi (arayüz `IRenderer` portunun adaptörüdür, ADR-0080)
 * hem governance'ı (ADR-0050 / R-006) çiğnerdi. Eksikler talep olarak
 * `backend-istekleri.md`'ye yazıldı; gelene kadar ekran "kaynak bağlı
 * değil" der. Boş bir bölüm dürüsttür, doldurulmuş olanı değildir.
 *
 * TEK TÜKETİCİ NOTU: bugün yalnız `goals` bağlı, bu yüzden her dilim kendi
 * isteğini yapıyor. İkinci dilim bağlandığında `/api/state` tek bir sorgu
 * anahtarına alınıp React Query'nin `select`'iyle bölünmeli — 116 KB'ı iki
 * kez çekmenin anlamı yok.
 */

import { z } from "zod";
import type { DataEnvelope } from "@/types/data-envelope";
import type { Goal } from "@/types/screens";
import { goalsMock } from "@/mocks/mission-control";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { goalSchema } from "./schemas";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";

const STATE_PATH = "/api/state";

/**
 * Kaynağı MODA göre seçer — S8'in bütün dilimleri bunu kullanır.
 *
 * Mock modda ODIN'e gitmek cazip görünür ("veri zaten gerçek") ama
 * ekranda gerçek sayılarla "MOCK DATA" rozetini yan yana bırakırdı:
 * kullanıcı hangisinin ne olduğunu bilemez. Tek anahtar tam olarak bunun
 * içindir — `NEXT_PUBLIC_ODIN_DATA_MODE=odin` ile gerçek kaynak açılır.
 */
function bySource<T>(
  live: (signal: AbortSignal) => Promise<DataEnvelope<T>>,
  mock: () => DataEnvelope<T>
): (signal: AbortSignal) => Promise<unknown> {
  return IS_MOCK ? async () => mock() : live;
}

/**
 * ODIN'in ham durum projeksiyonundan İHTİYAÇ DUYULAN alanlar.
 *
 * `looseObject`: ODIN 30 üst düzey anahtar yayınlıyor ve arayüz onların
 * çoğunu tüketmiyor. Bilinmeyen alanı REDDETMEK yanlış olurdu — ODIN'in
 * kendi hızında büyümesi arayüzü kırmamalı (kanonik kaynak ODIN'dir).
 */
const rawStateSchema = z.looseObject({
  /* Zarfın `lastUpdated`'ı budur. Yoksa verinin YAŞI bilinemez ve tazelik
     hesaplanamaz — o hâlde veri gösterilemez. */
  generated_at: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "geçerli ISO 8601 değil"),
});

/** ODIN'in yayınladığı ham hedef satırı — `cockpit.py` satır 179-183. */
const rawGoalSchema = z.looseObject({
  id: z.string(),
  level: z.string(),
  label: z.string(),
  /* ODIN tanımsız hedefi BOŞ STRING olarak yayınlıyor (`goal.get("target", "")`),
     null olarak değil. */
  target: z.string(),
  progress_pct: z.number().nullable(),
});

/**
 * `/api/state.goals` → `Goal[]`.
 *
 * ⚠️ 09b §10'daki "nötr 50 tuzağı" BU ALANA AİT DEĞİL — kaynak okundu:
 * `goals.py::alignment()` metin-hedef hizasını puanlar ve hedef yokken 50
 * döner, ama cockpit onu YAYINLAMAZ. Buradaki `progress_pct` doğrudan
 * sahibin `odin-data/goals.json`'ından gelir ve tanımsızsa `None`'dır
 * (`cockpit.py` satır 183). Yani çevrilecek bir 50 yok; olmayan bir tuzağa
 * karşı kod yazmak, olan bir tuzağı kaçırmak kadar yanıltıcıdır.
 */
export function adaptGoals(raw: unknown): Goal[] {
  const rows = z.array(rawGoalSchema).parse((raw as { goals?: unknown }).goals ?? []);
  return rows.map((g) => ({
    id: g.id,
    level: g.level,
    label: g.label,
    /* Boş hedef "hedef yok" demektir; ekranda boş bir satır değil, hiçbir
       şey görünmeli. */
    target: g.target.trim() === "" ? null : g.target,
    progressPct: g.progress_pct,
  }));
}

/**
 * Ham ODIN durumunu zarfa sarar.
 *
 * `source: "internal"` — ODIN çekirdeğinin kendi projeksiyonu; `sp-api`
 * DEĞİL. Sipariş verisi nihayetinde Amazon'dan gelse bile bu uç nokta onu
 * yayınlamıyor; kaynağı olduğundan başka türlü etiketlemek TrustSignal'ı
 * yalancı yapardı.
 *
 * `freshness` burada geçici bir değer alır; `parseEnvelope` istemcide
 * `generated_at`'e göre yeniden hesaplar.
 */
function envelope<T>(raw: unknown, data: T): DataEnvelope<T> {
  const state = rawStateSchema.parse(raw);
  return {
    data,
    meta: { source: "internal", lastUpdated: state.generated_at, freshness: "live" },
  };
}

/** Sahibin ODIN'de tanımladığı hedefler — CANLI. */
export function useOdinGoals(): OdinQueryResult<Goal[]> {
  return useOdinQuery({
    key: ["odin", "goals"],
    module: "default",
    schema: z.array(goalSchema),
    load: bySource(async (signal) => {
      const raw = await httpLoad(STATE_PATH, { signal });
      return envelope(raw, adaptGoals(raw));
    }, goalsMock),
  });
}
