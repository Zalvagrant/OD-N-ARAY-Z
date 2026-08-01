/**
 * A11Y KANARYASI — UI-ADR-168.
 *
 * `verify-tests.mjs`teki metin kilidi ÜÇ kez yazıldı ve ÜÇ kez kırıldı
 * (4, sonra 6, sonra 6 ölçülmüş sökme yolu). Dördüncü denetimin teşhisi
 * mimariydi ve doğruydu:
 *
 *   **Metin denetimi çalışma zamanını ölçmez.**
 *
 * Son turun altı yolunun DÖRDÜ kilit dosyasına hiç dokunmuyordu; ikisi
 * `a11y` sözcüğünü hiç yazmıyordu bile:
 *   · `a11y: ({ test: "todo" })` — bir çift parantez, regex eşleşmiyor
 *   · bir satır yorumunun İÇİNE blok-yorum açma imi koymak — TypeScript
 *     onu satır yorumu sayar, kilidin yorum sökücüsü blok yorumu sanar
 *     ve aradaki `disable: true`yu siler; geriye tertemiz `test: "error"`
 *     kalır. (Bu numara bu dosyayı da bir kez bozdu: kapanış imini
 *     örnek diye yazınca JSDoc'u erken kapattı ve Storybook dosyayı
 *     indeksleyemedi. İyi bir hatırlatma — imler metnin içinde de imdir.)
 *   · `main.ts` → `previewAnnotations` — parametreler DERİN birleşiyor,
 *     yani `disable: true` başka bir dosyadan gelip yapışabiliyor
 *   · `main.ts` → `viteFinal` → `test.env.VITEST_STORYBOOK: "true"` —
 *     ihlaller raporlanır ama hiçbir test düşmez
 *
 * Bu story onların hiçbirini AYRI AYRI kovalamıyor. Sonucu ölçüyor:
 * story'nin GERÇEKTEN çözülmüş yapılandırmasına bakıyor. Nereden
 * geldiği — preview, meta, story, bir annotation dosyası, bir vite
 * config'i — önemsiz; birleşmiş hâli buradan görünür.
 *
 * Ve kural yine İZİN LİSTESİ: `parameters.a11y`nin tek meşru anahtarı
 * `test`tir. Yarın icat edilecek bir daraltma anahtarı da düşer.
 *
 * ⚠️ NE KAPATMIYOR — dürüstçe: `main.ts`ten addon'un tamamen çıkarılması
 * (o zaman `test: "error"` yine "error" görünür, çünkü onu preview
 * yazıyor) ve `afterEach`te DOM'u boşaltan bir düzenleme. Birincisini
 * metin kilidi yakalar; ikincisi açık kalıyor ve `08-decision-log.md`
 * UI-ADR-168'de kayıtlı. İkisi birlikte, tek başına hiçbiri değil.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

const meta: Meta = {
  title: "Kapılar/A11y Kanaryası",
  parameters: { layout: "centered" },
};
export default meta;

/** `parameters.a11y`de meşru olan TEK anahtar. */
const IZIN_VERILEN = ["test"];

export const YapilandirmaCozulmusHaliyleDogru: StoryObj = {
  name: "axe taraması çalışma zamanında GERÇEKTEN etkin",
  render: () => (
    <p className="text-content">
      Bu story bir bileşen sınamıyor. Erişilebilirlik taramasının kendisinin
      hâlâ açık olduğunu sınıyor.
    </p>
  ),
  play: async ({ parameters, globals }) => {
    const a11y = (parameters as { a11y?: Record<string, unknown> }).a11y ?? {};

    /* 1. `todo` raporlar ama DÜŞÜRMEZ; `off` hiç koşmaz. */
    await expect(a11y.test).toBe("error");

    /* 2. İZİN LİSTESİ — fazladan her anahtar taramayı daraltabilir:
          `disable` · `manual` · `context.exclude` · `options.runOnly` ·
          `config.checks`. Hangisinin ne yaptığını bilmeye gerek yok. */
    await expect(Object.keys(a11y).filter((k) => !IZIN_VERILEN.includes(k))).toEqual([]);

    /* 3. Global taraftan susturma. `manual: true` ve `ghostStories`in
          ikisi de addon'un `shouldRun` koşulunu tek başına düşürür —
          ikincisi `STORYBOOK_COMPONENT_PATHS` ortam değişkeniyle, yani
          depoda tek karakter iz bırakmadan doldurulabiliyor. */
    const g = globals as { a11y?: { manual?: boolean }; ghostStories?: unknown };
    await expect(g.a11y?.manual).not.toBe(true);
    await expect(g.ghostStories).toBeUndefined();

    /* 4. İhlal yalnızca bu değer "false" iken FIRLATILIR. Kapı bunu
          çocuk sürecin ortamında sabitliyor — ama `main.ts`teki
          `viteFinal` vite yapılandırmasını SONRA eziyor ve kapının
          pini oraya yetişmiyor. Burası ezilmiş hâli görür. */
    const env = (import.meta as unknown as { env?: Record<string, string> }).env;
    await expect(env?.VITEST_STORYBOOK).toBe("false");
  },
};
