/**
 * A11Y KAPISININ ÇALIŞMA ZAMANI KURALI — UI-ADR-172.
 *
 * ⚠️ BU DOSYA NEDEN VAR: yedi tur bağımsız adversaryal denetimden sonra
 * geriye kalan en ciddi açık şuydu — **bugün TEMİZ olan bir story'yi
 * `todo`ya çevirmek raporda HİÇBİR iz bırakmıyor.** Addon şunu yazıyor:
 *
 *     status: hasViolations ? getMode() : "passed"
 *
 * Yani ihlal yoksa kip ne olursa olsun `"passed"`. Koşum kanıtı (kaç
 * kural değerlendirildi, kaç düğüm tarandı) `todo`yu göremez çünkü
 * `todo` kipinde de tarama TAM koşar — yalnız FIRLATMAZ. Korunmak
 * istenen şey ise tam olarak YARINKİ regresyondur.
 *
 * Kurul (gavadolar 2/2) bunu "niyet gerektiren bilinen sınır" değil
 * **gerçek bir fail-open** olarak sınıflandırdı ve kapanmasını şart
 * koştu.
 *
 * ÇÖZÜM: kuralı metinden ve tek bir kanarya story'sinden alıp
 * **çalışma zamanına, HER story'ye** taşımak. `preview.tsx`in
 * `beforeEach`i bunu çağırıyor ve Storybook proje seviyesi
 * `beforeEach`i bileşen/story seviyesinden ÖNCE koşturuyor
 * (`runtime.js` → `applyBeforeEach`), yani bir story kendi
 * `beforeEach`iyle bunu ATLAYAMAZ.
 *
 * Ve bu, statik metin denetiminin göremediği İKİ sınıfı da kapatır:
 * hesaplanmış anahtar (`{ [K]: … }`) ve başka dosyadan gelen yayılım —
 * çünkü burada okunan şey KAYNAK değil, BİRLEŞMİŞ SONUÇTUR.
 *
 * Saf tutuluyor: `preview.tsx` çalıştırmadan, tarayıcı açmadan
 * `a11y-gate.test.ts` ile sınanabiliyor.
 */

/** `parameters.a11y` içinde meşru olan TEK anahtar. */
const IZIN_VERILEN = ["test"];

export interface A11yCozulmusDurum {
  parameters?: { a11y?: Record<string, unknown> } | Record<string, unknown>;
  globals?: Record<string, unknown>;
  /** `import.meta.env` — addon ihlali yalnız `"false"` iken FIRLATIR. */
  env?: Record<string, string | undefined>;
}

/**
 * Çözülmüş yapılandırmayı denetler. Boş dizi = kapı açık.
 *
 * Nereden geldiği ÖNEMSİZ: preview, meta, story, ayrı bir annotation
 * dosyası ya da bir vite config'i — birleşmiş hâli buradan görünür.
 */
export function a11yCalismaZamaniSorunlari({
  parameters,
  globals,
  env,
}: A11yCozulmusDurum): string[] {
  const sorunlar: string[] = [];
  const p = (parameters ?? {}) as { a11y?: Record<string, unknown> };
  const a11y = p.a11y;

  /* Bloğun HİÇ olmaması da kırmızıdır: addon'un kendi varsayılanı
     `{ test: "todo" }` ve o sessizce devreye girer. */
  if (!a11y || typeof a11y !== "object") {
    sorunlar.push("`parameters.a11y` yok — addon varsayılanı `todo`ya düşer");
    return sorunlar;
  }

  if (a11y.test !== "error") {
    sorunlar.push(
      `a11y.test = ${JSON.stringify(a11y.test)} — "todo" raporlar ama DÜŞÜRMEZ, ` +
        '"off" hiç koşmaz. Tek kabul edilen değer "error".',
    );
  }

  /* İZİN LİSTESİ — BİÇİMİN TAMAMI, anahtar listesi DEĞİL (kurul önerisi,
     `ask_yazilimcilar`).
     İlk yazımda "şu beş tehlikeli anahtar prototipte var mı" diye
     bakıyordum; bu YİNE bir yasak listeydi ve bilinmeyen bir anahtarı
     kaçırırdı. Doğrusu nesnenin TAM BİÇİMİNİ istemek:
       · prototipi `Object.prototype` ya da `null` (miras yok)
       · TEK own anahtar, adı `test`
       · değer bir veri özelliği, getter DEĞİL
     Bu üç satır şunların hepsini birden kapatır ve hiçbirini adıyla
     tanımaz: `Object.create({ yarinIcatEdilecek: 1 })` ·
     `{ get test() { return "error" } }` · `{ [Symbol("gizli")]: 1 }`. */
  const proto = Object.getPrototypeOf(a11y);
  const anahtarlar = Reflect.ownKeys(a11y);
  const tanim = Object.getOwnPropertyDescriptor(a11y, "test");
  if (
    (proto !== Object.prototype && proto !== null) ||
    anahtarlar.length !== 1 ||
    anahtarlar[0] !== IZIN_VERILEN[0] ||
    tanim?.get !== undefined ||
    tanim?.set !== undefined
  ) {
    sorunlar.push(
      `a11y bloğu TAM BİÇİMDE değil — tek meşru hâli \`{ test: "error" }\` ` +
        `(own anahtar: ${anahtarlar.map(String).join(", ") || "yok"}` +
        `${proto !== Object.prototype && proto !== null ? " · MİRAS ALIYOR" : ""}` +
        `${tanim?.get || tanim?.set ? " · GETTER/SETTER" : ""})`,
    );
  }

  /* Global taraftan susturma. İkisi de addon'un `shouldRun` koşulunu
     TEK BAŞINA düşürür; `ghostStories` üstelik bir ortam değişkeniyle
     (`STORYBOOK_COMPONENT_PATHS`) depoda iz bırakmadan doldurulabiliyor. */
  const g = (globals ?? {}) as { a11y?: { manual?: boolean }; ghostStories?: unknown };
  if (g.a11y?.manual === true) sorunlar.push("globals.a11y.manual = true — tarama susar");
  if (g.ghostStories !== undefined) {
    sorunlar.push("globals.ghostStories dolu — addon taramayı tamamen atlar");
  }

  /* İhlal yalnızca bu değer "false" iken FIRLATILIR. `main.ts`teki
     `viteFinal` kapının çocuk-süreç ortam pinini EZEBİLİYOR; burası
     ezilmiş hâli görür. */
  if (env && env.VITEST_STORYBOOK !== undefined && env.VITEST_STORYBOOK !== "false") {
    sorunlar.push(
      `VITEST_STORYBOOK = ${JSON.stringify(env.VITEST_STORYBOOK)} — ihlaller ` +
        "raporlanır ama hiçbir test DÜŞMEZ",
    );
  }

  return sorunlar;
}

/**
 * Kapıdan GEÇTİKTEN SONRA parametreyi kilitler — UI-ADR-173.
 *
 * ⚠️ NEDEN GEREKLİ: kapı "atlanamaz" çünkü proje seviyesi `beforeEach`
 * ÖNCE koşuyor. Ama madalyonun diğer yüzü şu — **story seviyesi
 * `beforeEach` SONRA koşuyor ve AYNI `context` nesnesini alıyor**
 * (`runtime.js` → `applyBeforeEach`, tek döngü: project → component →
 * story). Yani bir story kapıyı geçirip ardından şunu yazabilirdi:
 *
 *     beforeEach({ parameters }) {
 *       parameters.a11y = { test: "error", context: "#kucuk-parca" };
 *     }
 *
 * Kapı yeşil, axe daraltılmış. Kurul (`ask_yazilimcilar`) bunu buldu ve
 * doğrulandı: `beforeEach` sırası kaynaktan okundu.
 *
 * Doğrulamak yetmiyor; **kanonik değeri sabitlemek** gerekiyor.
 * `writable: false, configurable: false` ile hem yeniden atama hem
 * yeniden tanımlama sessizce değil, HATA ile düşer (modüller strict).
 */
export function a11yParametreleriniKilitle(parameters: unknown): void {
  if (!parameters || typeof parameters !== "object") return;
  Object.defineProperty(parameters, "a11y", {
    value: Object.freeze({ test: "error" }),
    writable: false,
    configurable: false,
    enumerable: true,
  });
}
