/**
 * Test kapısı — fail-closed. HER İKİ proje için (UI-ADR-153).
 *
 * NEDEN VAR: 31 Temmuz 2026'da ölçüldü — `npx vitest run` şunu bastı:
 *   Test Files  12 passed (55)      ← 55 dosyanın 43'ü HİÇ KOŞMADI
 *   Tests      161 passed (161)
 *   Errors       1 error  "Failed to connect to the browser session"
 * 140 Storybook testi tarayıcı bağlanamadığı için hiç çalışmadı, özet satırı
 * yine de "passed" yazdı ve `package.json`'da bunu koşturacak bir `test`
 * script'i bile yoktu. Koşmamış bir testi "geçti" diye raporlamak, bu reponun
 * 2 numaralı kuralının (sahte veri yasak) test tarafındaki karşılığıdır.
 *
 * Çıkış kodu tek başına yetmez: `vitest list` aynı çöküşte exit 0 döndü.
 * Bu yüzden kapı, komutun ne dediğine değil, RAPOR DOSYASININ VARLIĞINA ve
 * içindeki sayılara bakar.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";

/* PROJE VE ALT SINIR DIŞARIDAN — UI-ADR-153.
   Kapı önce yalnız `storybook`u koruyordu ve `unit` projesi çıplaktı:
   `state-matrix.test.ts`i `state-matrix.spec.ts` diye yeniden adlandırmak
   (ya da silmek) kapıyı SESSİZCE buharlaştırıyordu — `include` onu görmez,
   geriye 15 dosya kaldığı için "no test files" hatası da çıkmaz ve
   `test:ci` YEŞİL kalırdı. Bağımsız denetimde bulundu. Aynı `evaluate()`
   mantığı iki projeye de uygulanıyor. */
const PROJECT = process.argv[2] ?? "storybook";
const REPORT = `.artifacts/${PROJECT}-vitest.json`;

/* Alt sınır — sabit sayı değil, DÜŞÜŞ dedektörü. Sabit sayı her yeni
   story'de kapıyı kırar; alt sınır yalnız kaybı yakalar. Yükseltmek
   serbesttir, DÜŞÜRMEK bir karardır — düşürüyorsan aynı PR'da nedenini yaz.

   140 → 190 (S13 kapanışı). Gerekçe: S17 bu sınırı koyduğunda ölçüm 43
   dosya / 140 testti; S13 ile 51 dosya / 193 teste çıktı. 140'ta bırakmak
   **53 testin sessizce kaybolmasına izin vermek** demekti — kapı açık
   görünürken kapsamın üçte biri buharlaşabilirdi. Sınır ölçümün hemen
   altında durmalı ki gerçekten bir şey korusun; 190 küçük dalgalanmaya
   pay bırakır, kayba bırakmaz. */
const FLOOR = Number(process.argv[3] ?? 190);

/* ponytail: kapı testlerin SAYISINI doğruluyor, KİMLİKLERİNİ değil. Meclis
   (gavadolar 2/2) daha güçlüsünü önerdi: `vitest list` ile keşfedilen test
   kimliklerinin tamamının çalıştığını doğrula — böylece 140 test korunurken
   içeriğin sessizce değişmesi de yakalanır. Alınmadı çünkü `vitest list
   --json` çıktısını gürültüyle karıştırıyor (`--outputFile` bu sürümde dosya
   yazmıyor, ölçüldü) ve ayrı bir tarayıcı açılışı kapı süresini ikiye
   katlıyor. Kimlik karşılaştırması, sayı düşmeden içerik bozulduğunda gerekir;
   o gün geldiğinde yükseltme yolu budur. */

/** Raporu değerlendirir. Saf — dosya sistemi ve ağ yok, bu yüzden aşağıdaki
 *  `--self-check` kapının KENDİSİNİ tarayıcı açmadan sınayabiliyor. */
/* KOŞMASI ZORUNLU DOSYALAR — UI-ADR-154.
   Alt sınır TOPLAMA bakar, KİMLİĞE bakmaz: commit A'da bir yere 15 önemsiz
   test ekleyip commit B'de kapı dosyasını silmek toplamı koruyordu ve kapı
   YEŞİL kalıyordu. Bağımsız denetimde ölçüldü. Kapıların kendisi artık
   adlarıyla aranıyor — iki satır, kimlik kontrolünün büyük kısmını verir. */
const ZORUNLU = {
  unit: ["state-matrix.test", "inventory.test"],
  storybook: [],
};

/** Yorumları söker. String içindeki `//` yanlış kesilmesin diye önce
 *  blok yorumları, sonra YALNIZ satır başındaki/boşluk sonrası `//`. */
function yorumsuz(k) {
  return k.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*/g, "$1");
}

/** `a11y: { … }` bloklarının GÖVDESİNİ parantez sayarak çıkarır.
 *
 *  Regex ile blok sonu aramak (satır sonu + `\},`) İKİ yönden yanlıştı ve
 *  denetim ikisini de ölçtü: blok tek satıra sıkışınca bir SONRAKİ bloğu
 *  yutuyordu (gerçek `preview.tsx`te hemen altta `backgrounds: { disable:
 *  true }` var — kilit "a11y bloğunda `disable`" diye YALAN bir teşhis
 *  basıyordu), ve kapanışta virgül yoksa bloğu hiç bulamıyordu.
 *  Ayrıca `String.match` global değildi: dosyanın başına sağlam görünen
 *  bir YEM blok koymak gerçek bloğu denetimden tamamen kaçırıyordu. */
export function a11yBloklari(kaynak) {
  const bloklar = [];
  const re = /["']?a11y["']?\s*:\s*\{/g;
  let m;
  while ((m = re.exec(kaynak)) !== null) {
    let derinlik = 1;
    let i = m.index + m[0].length;
    const bas = i;
    while (i < kaynak.length && derinlik > 0) {
      if (kaynak[i] === "{") derinlik += 1;
      else if (kaynak[i] === "}") derinlik -= 1;
      i += 1;
    }
    bloklar.push(kaynak.slice(bas, i - 1));
  }
  return bloklar;
}

/**
 * A11Y KAPISININ KİLİDİ — UI-ADR-165 → 166 → **167'de üçüncü kez yazıldı.**
 *
 * ⚠️ BAŞLIK BİLEREK "SÖKÜLEMEZ" DEMİYOR. 165 ve 166 öyle diyordu ve İKİSİ
 * DE YANILDI — birincisi dört, ikincisi altı ölçülmüş yoldan sökülüyordu.
 * Bir kilit ancak "bugün ölçülen şu yolları kapatıyor" diyebilir; bunu
 * "sökülemez"e yuvarlamak, sonraki okuyucuyu aramayı bırakmaya ikna eder.
 * Aşağıda kapatılanlar VE bilinen sınır yazılı. Yeni bir yol bulursan
 * listeye ekle — kapatılamadığını değil, HENÜZ kapatılmadığını varsay.
 *
 * `addon-a11y` `test: "todo"` iken ihlalleri GÖSTERİR ama hiçbir testi
 * düşürmez. Tek kelimelik bir düzenleme 206 testin hepsini yeşil bırakarak
 * erişilebilirlik kapsamının TAMAMINI kapatır; ne alt sınır ne kimlik
 * kontrolü görür, ikisi de SAYIYA bakar, sayı hiç değişmez.
 *
 * ⚠️ İKİ KEZ YETERSİZ ÇIKTI ve iki kez bağımsız denetim ölçtü. 165 yalnız
 * `preview.tsx`te metin arıyordu; 166 dört yolu kapattı ve ALTI yol daha
 * açık kaldı. Kök hata her ikisinde de aynıydı: **yasak kelime listesi.**
 * `disable`ı yasaklayınca `context: { exclude: ["#storybook-root"] }`
 * kalıyor; onu da yasaklayınca `options: { runOnly: [...] }`, sonra
 * `config: { checks: [...] }`. Liste sonsuza kadar eksik kalır.
 *
 * Bu yüzden kural artık İZİN LİSTESİDİR: bir `a11y` bloğunun tek meşru
 * içeriği `test: "error"`tür. Fazladan HER anahtar kırmızıdır — ne
 * yaptığını bilmeye gerek kalmaz.
 *
 * Kapatılan yollar (hepsi kaynaktan doğrulandı):
 *   1. `main.ts`ten addon'u çıkar → axe hiç yüklenmez. Artık `addons`
 *      DİZİSİNİN İÇİNDE aranıyor: dosyanın başka bir yerinde geçen
 *      (`const KALDIRILDI = ["@storybook/addon-a11y"]`) dizge saymaz.
 *   2. Story'ye `parameters.a11y` yaz → story `project`i EZER. Aynı izin
 *      listesi story'lere de uygulanır; bu sayede kapıyı SIKILAŞTIRAN bir
 *      story artık yanlışlıkla kırmızı olmuyor.
 *   3-6. `disable` · `manual` · `context.exclude` · `options.runOnly` ·
 *      `config.checks` — hepsi "fazladan anahtar" olarak tek kuralla düşer.
 *   7. `VITEST_STORYBOOK` ve `STORYBOOK_COMPONENT_PATHS` ortam
 *      değişkenleri — ikincisi `globals.ghostStories`i doldurup taramayı
 *      koda hiç dokunmadan susturuyordu. Kapı kendi ortamını sabitler.
 *
 * BİLİNEN SINIR — dürüstçe yazılıyor: statik metin denetimi, parametreyi
 * BAŞKA bir dosyadan import eden ya da hesaplanmış anahtar kullanan bir
 * düzenlemeyi göremez. Bu kilidin amacı da o değil: **niyet göstermeden**
 * yapılan sökmeleri kapatmak. Import indirection niyettir.
 */
export function a11ySorunlari({ main, preview, storyler = [] }) {
  const sorunlar = [];
  /* Blok gövdesi boşluksuz hâliyle TAM olarak buna eşit olmalı. */
  const SAGLAM = /^test:["']error["'],?$/;
  const denetle = (ad, kaynak, zorunlu) => {
    const bloklar = a11yBloklari(yorumsuz(kaynak));
    if (zorunlu && bloklar.length === 0) {
      sorunlar.push(`${ad}: \`a11y: { … }\` bloğu bulunamadı`);
      return;
    }
    for (const blok of bloklar) {
      const sade = blok.replace(/\s+/g, "");
      if (!SAGLAM.test(sade)) {
        sorunlar.push(
          `${ad}: a11y bloğu \`test: "error"\` DIŞINDA içerik taşıyor → \`${sade.slice(0, 60)}\`. ` +
          "Tek meşru içerik budur; fazladan her anahtar taramayı daraltabilir " +
          "(disable · manual · context.exclude · options.runOnly · config.checks).",
        );
      }
    }
  };

  /* Anahtar TIRNAKLI olabilir — gerçek `main.ts` `"addons": [` yazıyor.
     Bu kaçak, self-check'e gerçek dosyaları okutan satır sayesinde
     yakalandı: uydurma girdilerle yazılmış senaryolar yeşildi ama kilit
     yürürlükteki yapılandırmayı düşürüyordu. */
  const addons = yorumsuz(main).match(/["']?addons["']?\s*:\s*\[[\s\S]*?\]/);
  if (!addons || !/["']@storybook\/addon-a11y["']/.test(addons[0])) {
    sorunlar.push(
      "main.ts `addons` DİZİSİNDE @storybook/addon-a11y yok — axe hiç yüklenmez, " +
      "tarama sıfırdır (test sayısı değişmediği için alt sınır bunu göremez)",
    );
  }

  denetle("preview.tsx", preview, true);
  for (const { ad, kaynak } of storyler) denetle(ad, kaynak, false);

  return sorunlar;
}

export function evaluate(report, { runFailed = false, floor = FLOOR, zorunlu = [] } = {}) {
  const passed = report.numPassedTests ?? 0;
  const failed = report.numFailedTests ?? 0;
  const pending = report.numPendingTests ?? 0;
  const todo = report.numTodoTests ?? 0;
  const files = report.testResults?.length ?? 0;

  const problems = [];
  if (files === 0) problems.push("hiçbir test dosyası koşmadı");
  if (failed > 0) problems.push(`${failed} test düştü`);
  // Atlanan test sessiz bir boşluktur: sayı korunur, kapsam kaybolur.
  if (pending > 0) problems.push(`${pending} test atlandı (skip)`);
  if (todo > 0) problems.push(`${todo} test todo`);
  if (passed < floor) problems.push(`geçen test ${passed} < alt sınır ${floor}`);
  const adlar = (report.testResults ?? []).map((r) => String(r.name ?? ""));
  for (const z of zorunlu) {
    if (!adlar.some((a) => a.includes(z))) {
      problems.push(`KAPI DOSYASI KOŞMADI: ${z} — silinmiş ya da yeniden adlandırılmış olabilir`);
    }
  }
  if (runFailed && problems.length === 0) {
    problems.push("vitest sıfırdan farklı çıkış kodu döndürdü ama rapor temiz — " +
                  "raporlanmayan bir hata var, kapı kapalı");
  }
  return { problems, files, passed };
}

if (process.argv.includes("--self-check")) {
  const { strict: assert } = await import("node:assert");

  /* Self-check MANTIĞI sınar, KALİBRASYONU değil: bu yüzden `FLOOR`
     sabitini kullanmaz, kendi sınırını AÇIKÇA verir. İlk hâli `FLOOR`a
     bağlıydı ve sınır 140→190 yükseltilince senaryolar çöktü — oysa
     mantıkta hiçbir şey bozulmamıştı. Kalibrasyon değişince kırılan bir
     testi, kalibrasyonu değiştirmemek için bahane olarak kullanmak
     kolaydır; o yüzden bağ koparıldı. */
  const F = { floor: 140 };
  const ok = { numPassedTests: 140, numFailedTests: 0, numPendingTests: 0,
               numTodoTests: 0, testResults: new Array(43) };
  const red = (r, o) => assert.ok(evaluate(r, { ...F, ...o }).problems.length > 0);

  assert.equal(evaluate(ok, F).problems.length, 0);            // sağlıklı koşu
  red({ ...ok, numPassedTests: 139 });                         // alt sınır altı
  red({ ...ok, numPassedTests: 0, testResults: [] });          // tarayıcı düştü
  red({ ...ok, numFailedTests: 1 });                           // düşen test
  red({ ...ok, numPendingTests: 1 });                          // sessizce atlandı
  red({ ...ok, numTodoTests: 1 });                             // todo
  red(ok, { runFailed: true });          // rapor temiz ama süreç hata verdi
  // Sınır büyüyünce eski alt sınır kapıyı körleştirmemeli:
  assert.equal(evaluate({ ...ok, numPassedTests: 400 }, F).problems.length, 0);
  // Yürürlükteki FLOOR gerçekten koruyor mu: bugünkü ölçümün altı kırmızı.
  assert.ok(evaluate({ ...ok, numPassedTests: FLOOR - 1 }).problems.length > 0);
  // Kimlik kontrolü: zorunlu dosya raporda yoksa kırmızı.
  red({ ...ok, testResults: [{ name: "baska.test.ts" }] }, { zorunlu: ["kapi.test"] });
  assert.equal(
    evaluate({ ...ok, testResults: [{ name: "x/kapi.test.ts" }] },
             { ...F, zorunlu: ["kapi.test"] }).problems.length, 0);
  /* A11Y KİLİDİ — UI-ADR-167. Önceki dokuz senaryo YETERSİZDİ ve denetim
     bunu ölçtü: `manual` ile `enabled: false` HİÇBİR senaryoda
     sınanmıyordu (oysa doküman ikisini de sökme yolu diye sayıyordu), ve
     senaryoların hiçbiri GERÇEK dosyaları okumadığı için "doğru
     yapılandırmayı yanlışlıkla düşürme" sınıfı yapısal olarak
     görünmezdi. Artık ikisi de var. */
  const MAIN = 'addons: ["@storybook/addon-a11y"],';
  const PRE = (govde) => `  parameters: {
    a11y: {
${govde}
    },
    backgrounds: { disable: true },
  },`;
  const a11y = (o) => a11ySorunlari({ main: MAIN, preview: PRE('      test: "error",'), ...o });

  assert.equal(a11y({}).length, 0);                                        // sağlıklı
  /* YANLIŞ KIRMIZI OLMAMALI — dördü de a11y'yi tam AÇIK bırakan biçimler.
     Eskisi dördünde de kırmızıydı ve mesajı yanlış yeri gösteriyordu. */
  assert.equal(a11y({ preview: `a11y: { test: "error" },
backgrounds: { disable: true },` }).length, 0);
  assert.equal(a11y({ preview: `a11y: {
  test: "error"
}
` }).length, 0);   // kapanışta virgül yok
  assert.equal(a11y({ preview: `a11y: { test: 'error' },` }).length, 0);          // tek tırnak
  assert.equal(a11y({ storyler: [{ ad: "s.stories.tsx", kaynak: 'parameters:{a11y:{test:"error"}}' }] }).length, 0);
  assert.equal(a11y({ storyler: [{ ad: "s.stories.tsx", kaynak: 'const skor = { a11y: 92 };' }] }).length, 0);
  /* SÖKME YOLLARI — hepsi kırmızı olmalı. */
  for (const govde of [
    `      test: "todo",`,
    `      test: "off",`,
    `      test: "error",
      disable: true,`,
    `      test: "error",
      manual: true,`,
    `      test: "error",
      options: { rules: [{ id: "color-contrast", enabled: false }] },`,
    `      test: "error",
      context: { exclude: ["#storybook-root"] },`,
    `      /* test: "error", */
      test: "todo",`,
  ]) assert.ok(a11y({ preview: PRE(govde) }).length > 0, govde);
  // YEM BLOK: sağlam görünen ilk blok, gerçeği gizleyemez.
  assert.ok(a11y({ preview: 'const not = { a11y: { test: "error" } };' + PRE('      test: "todo",') }).length > 0);
  // main.ts: dizge dosyada geçiyor ama `addons` DİZİSİNDE değil.
  assert.ok(a11y({ main: 'const KALDIRILDI = ["@storybook/addon-a11y"]; addons: ["@storybook/addon-vitest"],' }).length > 0);
  assert.ok(a11y({ storyler: [{ ad: "x.stories.tsx", kaynak: 'parameters: { a11y: { test: "todo" } }' }] }).length > 0);
  /* GERÇEK DOSYALAR — senaryolar uydurma girdiyle yeşil olup yürürlükteki
     yapılandırmayı düşürebilirdi; bu satır o boşluğu kapatır. */
  const gercek = (yol) => readFileSync(new URL(`./../${yol}`, import.meta.url), "utf8");
  assert.equal(
    a11ySorunlari({ main: gercek(".storybook/main.ts"), preview: gercek(".storybook/preview.tsx") }).length,
    0, "yürürlükteki .storybook yapılandırması kilitten geçmeli");

  console.log(`self-check: 11 + 17 senaryo — kapı beklenen yerlerde kırmızı (FLOOR=${FLOOR})`);
  process.exit(0);
}

if (PROJECT === "storybook") {
  const oku = (p) => readFileSync(new URL(`./../${p}`, import.meta.url), "utf8");
  const storyler = [];
  const gez = (dizin) => {
    for (const g of readdirSync(new URL(`./../${dizin}`, import.meta.url), { withFileTypes: true })) {
      const yol = `${dizin}/${g.name}`;
      if (g.isDirectory()) gez(yol);
      /* Uzantı kümesi `main.ts` globuyla AYNI olmalı: o beşini indeksliyor
         (`js|jsx|mjs|ts|tsx`), yürüyüş yalnız `.tsx` arıyordu. Bugün 54
         dosyanın 54'ü `.tsx` — yani delik açık değil, ama bir
         `kapali.stories.ts` eklemek onu sessizce açardı (UI-ADR-167). */
      else if (/\.stories\.(m?[jt]sx?)$/.test(g.name)) storyler.push({ ad: yol, kaynak: oku(yol) });
    }
  };
  gez("src");
  const sorunlar = a11ySorunlari({
    main: oku(".storybook/main.ts"),
    preview: oku(".storybook/preview.tsx"),
    storyler,
  });
  if (sorunlar.length > 0) {
    throw new Error(`storybook kapısı KAPALI (a11y sökülmüş): ${sorunlar.join(" · ")}`);
  }
}

const abs = new URL(`./../${REPORT}`, import.meta.url).pathname.replace(/^\//, "");
rmSync(REPORT, { force: true });
mkdirSync(dirname(REPORT), { recursive: true });

let runFailed = false;
try {
  execFileSync(
    "npx",
    ["vitest", "run", "--project", PROJECT,
     "--reporter=json", `--outputFile=${REPORT}`],
    { stdio: "inherit", shell: process.platform === "win32",
      /* `VITEST_STORYBOOK` — DÖRDÜNCÜ sökme yolu, UI-ADR-166.
         `addon-a11y` ihlali yalnız `import.meta.env.VITEST_STORYBOOK === "false"`
         iken FIRLATIR; plugin bu değeri `process.env`den türetir. Yani CI
         runner'ında ya da bir geliştiricinin kabuğunda `VITEST_STORYBOOK=1`
         durursa ihlaller rapora yazılır ama HİÇBİR TEST DÜŞMEZ — ve depoda
         hiçbir iz kalmaz. Kapı, korumasını dışarıdaki bir ortam
         değişkenine emanet edemez; kendi ortamını sabitler. */
      env: { ...process.env,
             VITEST_STORYBOOK: "false",
             /* `STORYBOOK_COMPONENT_PATHS` — UI-ADR-167. Doluysa plugin
                `globals.ghostStories`i dolduruyor ve addon-a11y'nin
                `!!!globals.ghostStories` koşulu axe'i HİÇ çağırmıyor.
                166 tek değişkeni sabitledi ve "kapı kendi ortamını
                sabitler" dedi; aynı işi yapan İKİNCİSİ açıktı. Tez
                doğruydu, uygulaması eksikti. */
             STORYBOOK_COMPONENT_PATHS: undefined } },
  );
} catch {
  // Çıkış kodunu YUTMUYORUZ ama tek kanıt saymıyoruz: rapor yine de
  // yazılmış olabilir ve asıl teşhisi o taşır. Önce raporu oku, sonra bunu ekle.
  runFailed = true;
}

if (!existsSync(REPORT)) {
  throw new Error(
    `${PROJECT} kapısı KAPALI: rapor yazılmadı (${REPORT}). ` +
    "Testler koşmadı — tarayıcı oturumu kurulamamış olabilir. " +
    `Teşhis: npx vitest run --project ${PROJECT}  (abs: ${abs})`,
  );
}

let report;
try {
  report = JSON.parse(readFileSync(REPORT, "utf8"));
} catch (e) {
  throw new Error(`${PROJECT} kapısı KAPALI: rapor bozuk JSON — ${e.message}`);
}

const { problems, files, passed } = evaluate(report, {
  runFailed,
  zorunlu: ZORUNLU[PROJECT] ?? [],
});

if (problems.length > 0) {
  throw new Error(`${PROJECT} kapısı KAPALI: ${problems.join(" · ")}`);
}

console.log(`${PROJECT} kapısı AÇIK: ${files} dosya / ${passed} test geçti ` +
            `(alt sınır ${FLOOR}, atlanan 0, düşen 0)`);
