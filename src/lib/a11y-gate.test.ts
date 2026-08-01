/**
 * A11Y ÇALIŞMA ZAMANI KAPISININ KENDİ TESTİ — UI-ADR-172.
 *
 * Bu oturumun en pahalı dersi: **kuralın kendi testi, kuralın
 * kendisinden önemlidir.** Kapının metin kilidi bir kez gözle doğru
 * görünüp hiç eşleşmedi (regex'e görünmez bir 0x08 baytı girmişti) ve
 * yalnızca self-check olduğu için yakalandı. Burası tarayıcı açmadan
 * koşuyor: `preview.tsx`in `beforeEach`i bu fonksiyona güveniyor.
 */
import { describe, expect, it } from "vitest";
import { a11yCalismaZamaniSorunlari } from "./a11y-gate";

const SAGLAM = {
  parameters: { a11y: { test: "error" } },
  globals: { a11y: { manual: false } },
  env: { VITEST_STORYBOOK: "false" },
};

describe("a11yCalismaZamaniSorunlari", () => {
  it("yürürlükteki yapılandırma kapıdan GEÇER", () => {
    expect(a11yCalismaZamaniSorunlari(SAGLAM)).toEqual([]);
  });

  /* `todo` — yedi turluk denetimin geriye bıraktığı EN CİDDİ açık.
     Rapor tarafı bunu göremiyor çünkü ihlal yoksa addon kip ne olursa
     olsun "passed" yazıyor. Tek yakalayan yer burası. */
  it.each(["todo", "off", undefined, ""])(
    "a11y.test = %o → KIRMIZI",
    (deger) => {
      expect(
        a11yCalismaZamaniSorunlari({
          ...SAGLAM,
          parameters: { a11y: { test: deger } },
        }).length,
      ).toBeGreaterThan(0);
    },
  );

  it("`parameters.a11y` HİÇ yoksa kırmızı — addon varsayılanı `todo`", () => {
    expect(
      a11yCalismaZamaniSorunlari({ ...SAGLAM, parameters: {} }).length,
    ).toBeGreaterThan(0);
  });

  /* İZİN LİSTESİ: yasak kelime listesi sonsuza kadar eksik kalır —
     `disable`ı yasakla, `context.exclude` kalır; onu yasakla,
     `options.runOnly` kalır. Fazladan HER anahtar kırmızı. */
  it.each([
    { disable: true },
    { manual: true },
    { context: { exclude: ["#storybook-root"] } },
    { options: { runOnly: ["image-alt"] } },
    { config: { rules: [{ id: "color-contrast", enabled: false }] } },
    { yarinIcatEdilecekAnahtar: 1 },
  ])("fazladan anahtar %o → KIRMIZI", (ek) => {
    expect(
      a11yCalismaZamaniSorunlari({
        ...SAGLAM,
        parameters: { a11y: { test: "error", ...ek } },
      }).length,
    ).toBeGreaterThan(0);
  });

  /* PROTOTİP ZİNCİRİ — bir denetim turu tam olarak bunu kullandı:
     `Object.keys` yalnız KENDİ anahtarlarını görür, addon ise `?.disable`
     ile zincire bakar. `Object.create` ile saklanan anahtar kanaryayı
     yeşil bırakıyordu. */
  it("prototipe saklanan `disable` → KIRMIZI", () => {
    const gizli = Object.assign(Object.create({ disable: true }), {
      test: "error",
    });
    expect(
      a11yCalismaZamaniSorunlari({ ...SAGLAM, parameters: { a11y: gizli } })
        .length,
    ).toBeGreaterThan(0);
  });

  it.each([
    { globals: { a11y: { manual: true } } },
    { globals: { ghostStories: { enabled: true } } },
  ])("global susturma %o → KIRMIZI", (g) => {
    expect(
      a11yCalismaZamaniSorunlari({ ...SAGLAM, ...g }).length,
    ).toBeGreaterThan(0);
  });

  /* İhlal YALNIZCA bu değer "false" iken fırlatılır; `main.ts`teki
     `viteFinal` kapının çocuk-süreç pinini ezebiliyor. */
  it("VITEST_STORYBOOK ezilmişse → KIRMIZI", () => {
    expect(
      a11yCalismaZamaniSorunlari({
        ...SAGLAM,
        env: { VITEST_STORYBOOK: "true" },
      }).length,
    ).toBeGreaterThan(0);
  });

  /* YANLIŞ KIRMIZI OLMAMALI — kapının üç sürümü de bu sınıftan
     kusurluydu ve yalan teşhis basıyordu. */
  it("env hiç verilmemişse yanlış kırmızı VERMEZ", () => {
    expect(
      a11yCalismaZamaniSorunlari({
        parameters: { a11y: { test: "error" } },
        globals: {},
      }),
    ).toEqual([]);
  });
});
