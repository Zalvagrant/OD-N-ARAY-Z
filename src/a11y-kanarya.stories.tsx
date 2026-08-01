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
 *   · anahtarın değerini bir çift PARANTEZ içine almak — regex birebir
 *     süslü parantez beklediği için eşleşmiyordu
 *     (örneği burada birebir yazamıyorum: kapının "yutma imzası" onu
 *     gerçek yapılandırma sanıp kırmızıya düşürüyor. Üçüncü kez aynı
 *     ders — imler metnin içinde de imdir.)
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

import { a11yCalismaZamaniSorunlari } from "@/lib/a11y-gate";

const meta: Meta = {
  title: "Kapılar/A11y Kanaryası",
  parameters: { layout: "centered" },
};
export default meta;

export const YapilandirmaCozulmusHaliyleDogru: StoryObj = {
  name: "axe taraması çalışma zamanında GERÇEKTEN etkin",
  render: () => (
    <p className="text-content">
      Bu story bir bileşen sınamıyor. Erişilebilirlik taramasının kendisinin
      hâlâ açık olduğunu sınıyor.
    </p>
  ),
  /* ⚠️ MANTIK BURADA DEĞİL — UI-ADR-172. Aynı kural artık
     `preview.tsx`in `beforeEach`inde HER story için koşuyor; kopyalamak
     iki kaynak yaratırdı ve biri güncellenmeden diğeri kalırdı.
     Bu story o kuralın ADI ve REGRESYONU: kural sessizce gevşetilirse
     burada bir test düşer ve `ZORUNLU` listesi dosyanın koştuğunu
     ayrıca doğrular. Kuralın kendi birim testi `lib/a11y-gate.test.ts`. */
  play: async ({ parameters, globals }) => {
    await expect(
      a11yCalismaZamaniSorunlari({
        parameters,
        globals,
        env: (import.meta as unknown as { env?: Record<string, string> }).env,
      }),
    ).toEqual([]);
  },
};
