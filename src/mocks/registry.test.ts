/**
 * Kayıt defteri kapıları — S8 (UI-ADR-123).
 *
 * İki şey ölçülür: her anahtarın gerçekten çözülmesi (tipe eklenip
 * switch'e eklenmeyen anahtar sessizce `null` dönerdi) ve aynı anahtarın
 * eşzamanlı iki isteğinin TEK yükleme yapması.
 */

import { describe, expect, it } from "vitest";

import { loadMock, type MockKey } from "./registry";
import { fillStore } from "./use-mock";

const KEYS: MockKey[] = [
  "amazon.snapshot", "amazon.kpis", "amazon.skus", "amazon.ppc",
  "amazon.campaigns", "amazon.simulations", "amazon.alerts",
  "amazon.opportunities", "briefing.brief", "briefing.decisions",
  "briefing.directors", "briefing.hero", "briefing.kpis",
  "briefing.opportunities", "briefing.pulse", "briefing.risks",
  "briefing.timeline", "feed.items",
];

describe("kayıt defteri", () => {
  it.each(KEYS)("%s çözülür ve zarf döndürür", async (key) => {
    /* MockMap'e eklenip switch'e eklenmeyen bir anahtar burada yakalanır:
       sessizce null dönerdi ve ekran "veri yok" derdi — mock modda bu
       teşhis edilmesi en zor hatadır. */
    const env = await loadMock(key);
    expect(env, `${key} çözülmedi`).not.toBeNull();
    expect(env).toHaveProperty("meta.source");
    expect(env).toHaveProperty("data");
  });

  it("her anahtar mock kaynaklı damgalanır — gerçek modda reddedilsin diye", async () => {
    const env = await loadMock("amazon.skus");
    expect(env?.meta.source).toBe("mock");
  });
});

describe("eşzamanlı yükleme tekilleştirilir", () => {
  it("aynı anahtar için ikinci istek UÇUŞTAKİ sözü bekler, yenisini başlatmaz", async () => {
    /* İki bölüm aynı mock'u kullandığında (decisions hem Briefing'de hem
       Mission Control'de) iki ayrı dinamik import başlardı.

       Kapı: ikinci çağrı BİRİNCİNİN SÖZÜNÜ döndürmeli — referans eşitliği
       tekilleştirmenin doğrudan kanıtıdır. INFLIGHT kaldırılırsa iki ayrı
       söz üretilir ve bu test düşer. */
    const key: MockKey = "amazon.simulations"; // bu dosyada fillStore ile doldurulmadı
    const first = fillStore(key, false);
    const second = fillStore(key, false);
    expect(second).toBe(first);
    await Promise.all([first, second]);
  });
});
