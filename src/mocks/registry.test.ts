/**
 * Kayıt defteri kapıları — S8 (UI-ADR-123).
 *
 * İki şey ölçülür: her anahtarın gerçekten çözülmesi (tipe eklenip
 * switch'e eklenmeyen anahtar sessizce `null` dönerdi) ve aynı anahtarın
 * eşzamanlı iki isteğinin TEK yükleme yapması.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { loadMock, type MockKey } from "./registry";

/**
 * ANAHTAR LİSTESİ ARTIK ELLE TUTULMUYOR — UI-ADR-182.
 *
 * ⚠️ NEDEN DEĞİŞTİ: liste elle yazılmıştı ve **sürüklenmişti.** Ölçüldü:
 * `registry.ts` **20** anahtar çözüyor, test **19**'unu sınıyordu —
 * `briefing.directors.runtime` listeye hiç eklenmemişti. Yani o mock
 * anahtarı `null` dönse kapı fark etmezdi ve ekran sessizce "veri yok"
 * derdi; bu dosyanın başlığının **tam olarak engellemek için var
 * olduğu** hata.
 *
 * Bu, bu oturumun tekrar eden dersi: **elle tutulan bir liste çürür.**
 * Alt sınırlar (UI-ADR-176) ve envanter anlık görüntüsü aynı sınıftandı.
 * Liste artık TEK KAYNAKTAN — `loadMock`'un `switch` etiketlerinden —
 * türetiliyor; yeni bir `case` eklendiği an test onu kapsar.
 */
const KEYS: MockKey[] = [
  ...new Set(
    [
      ...readFileSync(join(process.cwd(), "src/mocks/registry.ts"), "utf8")
        .matchAll(/^\s*case\s+"([a-z][a-z.]*)":/gm),
    ].map((m) => m[1])
  ),
] as MockKey[];

describe("kayıt defteri", () => {
  /* KAPI KÖRELMESİN — türetilen liste boşalırsa `it.each([])` hiç test
     üretmez ve dosya sessizce yeşil kalır (UI-ADR-154'ün sınıfı). Sayı
     bir tavan değil, DÜŞÜŞ dedektörü: `registry.ts` bugün 20 anahtar
     çözüyor. */
  it("anahtar listesi kaynaktan türedi ve BOŞ DEĞİL", () => {
    expect(KEYS.length).toBeGreaterThanOrEqual(20);
  });

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
