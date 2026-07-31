/**
 * Kayıt defteri kapıları — S8 (UI-ADR-123).
 *
 * İki şey ölçülür: her anahtarın gerçekten çözülmesi (tipe eklenip
 * switch'e eklenmeyen anahtar sessizce `null` dönerdi) ve aynı anahtarın
 * eşzamanlı iki isteğinin TEK yükleme yapması.
 */

import { describe, expect, it, vi } from "vitest";

import { loadMock, type MockKey } from "./registry";

const KEYS: MockKey[] = [
  "amazon.snapshot", "amazon.kpis", "amazon.skus", "amazon.ppc",
  "amazon.campaigns", "amazon.simulations", "amazon.alerts",
  "amazon.opportunities", "briefing.brief", "briefing.decisions",
  "briefing.directors", "briefing.hero", "briefing.kpis",
  "briefing.opportunities", "briefing.pulse", "briefing.risks",
  "briefing.timeline", "feed.items", "goals.items",
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

/*
 * EŞZAMANLI YÜKLEME TEKİLLEŞTİRMESİ buradan KALDIRILDI — UI-ADR-135.
 *
 * Eskiden `use-mock.ts` içindeki `INFLIGHT` haritası test ediliyordu. O
 * harita, React Query'ye PARALEL ikinci bir önbellek uygulamasıydı; fixture
 * kaynakları tek boruya (`useOdinFixture` → `useOdinQuery`) bağlanınca
 * tekilleştirme React Query'nin kendi sorumluluğu oldu: aynı `queryKey` ile
 * eşzamanlı iki gözlemci tanım gereği tek istek yapar.
 *
 * Bu dosyanın kendi kuralı (data-layer.test.ts başlığı): "React Query'nin
 * KENDİ önbellek/observer uygulamasını yeniden test etmeyiz." Testin
 * silinmesi kapsam kaybı değil, o kuralın uygulanmasıdır.
 */

describe("gerçek modda fixture kapısı KAPALI", () => {
  it("her anahtar null döner — taşınmamış bölüm mock gösteremez", async () => {
    /* FAIL-CLOSED — S7 · UI-ADR-115'in taşındığı yer.
       Önceden bu güvence `mockGate` üzerinden ölçülüyordu; `use-mock.ts`
       emekliye ayrılınca güvencenin KENDİSİ burada ölçülür, emekli
       uygulamada değil. Kapı kalkarsa gerçek ve sahte sayılar aynı
       ekranda yan yana durur ve hangisinin hangisi olduğu görünmez. */
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ODIN_DATA_MODE", "odin");

    const { loadMock: realModeLoad } = await import("./registry");
    for (const key of KEYS) {
      expect(await realModeLoad(key), `${key} gerçek modda sızdı`).toBeNull();
    }

    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
