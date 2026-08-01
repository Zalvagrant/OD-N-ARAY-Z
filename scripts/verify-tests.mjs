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

/**
 * A11Y KAPISI SÖKÜLEMEZ — UI-ADR-165, **UI-ADR-166'da yeniden yazıldı.**
 *
 * `addon-a11y` `test: "todo"` iken ihlalleri GÖSTERİR ama hiçbir testi
 * düşürmez. Yani tek kelimelik bir düzenleme 206 testin hepsini yeşil
 * bırakarak erişilebilirlik kapsamının TAMAMINI kapatır — ne alt sınır ne
 * kimlik kontrolü görür, ikisi de SAYIYA bakar, sayı hiç değişmez.
 *
 * ⚠️ İLK KİLİDİM YETERSİZDİ ve bunu bağımsız denetim ölçtü. Yalnız
 * `preview.tsx`te `test: "error"` metnini arıyordu; kapı **niyet
 * göstermeyen ÜÇ ayrı yoldan** sökülebiliyordu:
 *
 *   1. `main.ts`ten `"@storybook/addon-a11y"` satırını sil → axe HİÇ
 *      yüklenmez. `preview.tsx` el değmeden durur, kilit YEŞİL kalırdı.
 *      (Kapıyı taşıyan dosya, ayarı taşıyan dosya DEĞİLDİ.)
 *   2. Bir story'ye `parameters: { a11y: { test: "todo" } }` yaz.
 *      Storybook story > meta > project sırasıyla birleştirir; story
 *      SON yazandır ve global `error`ü ezer.
 *   3. `a11y` bloğuna `disable: true` ya da `manual: true` ekle —
 *      `test: "error"` satırı yerinde kalır, tarama yine susar.
 *
 * Ayrıca regex `disable`li bir blokta da, salt biçim değişikliğinde
 * (tek satıra sıkışma, sondaki virgülün düşmesi) YANLIŞ KIRMIZI veriyordu
 * ve mesajı yanlış yeri gösteriyordu.
 *
 * Bu yüzden kilit artık **saf bir fonksiyon**: `evaluate()` gibi, dosya
 * sistemi olmadan `--self-check` ile sınanabilir. Kendi testi olmayan bir
 * kapı, kapı değildir — ilk kilidin en büyük kusuru buydu: `--self-check`
 * satır 122'de `process.exit(0)` yaptığı için kilide HİÇ ULAŞMIYORDU.
 */
export function a11ySorunlari({ main, preview, storyler = [] }) {
  const sorunlar = [];
  /* Yorumlar SAYILMAZ: bir yorum içindeki `test: "error"` kapıyı açık
     gösteriyordu — metin varlığı bir kanıt değildir. */
  const yorumsuz = (s) =>
    s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

  if (!/["']@storybook\/addon-a11y["']/.test(yorumsuz(main))) {
    sorunlar.push(
      "main.ts `addons` içinde @storybook/addon-a11y YOK — axe hiç yüklenmez, " +
      "tarama sıfırdır (test sayısı değişmediği için alt sınır bunu göremez)",
    );
  }

  const blok = yorumsuz(preview).match(/a11y\s*:\s*\{([\s\S]*?)\n\s*\},/);
  if (!blok) {
    sorunlar.push("preview.tsx içinde `a11y: { … }` bloğu bulunamadı");
  } else {
    if (!/test\s*:\s*"error"/.test(blok[1])) {
      sorunlar.push(
        'preview.tsx a11y.test "error" değil — "todo" raporlar ama düşürmez, "off" hiç koşmaz',
      );
    }
    const susturucu = blok[1].match(/disable|manual|enabled\s*:\s*false/);
    if (susturucu) {
      sorunlar.push(
        `preview.tsx a11y bloğunda susturucu anahtar: \`${susturucu[0]}\` — ` +
        '`test: "error"` yerinde dursa bile tarama susar',
      );
    }
  }

  for (const { ad, kaynak } of storyler) {
    if (/\ba11y\s*:/.test(yorumsuz(kaynak))) {
      sorunlar.push(
        `${ad}: story seviyesi \`a11y\` parametresi global kapıyı EZER ` +
        "(Storybook story > meta > project sırasıyla birleştirir)",
      );
    }
  }

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
  /* A11Y KİLİDİ — sekiz senaryo. İlk kilidin HİÇ testi yoktu ve üç
     sökme yolunu birden kaçırıyordu; bağımsız denetim ölçtü. */
  const MAIN = 'addons: ["@storybook/addon-a11y"],';
  const PRE = (govde) => `  parameters: {\n    a11y: {\n${govde}\n    },\n  },`;
  const SAGLAM = PRE('      test: "error",');
  const a11y = (o) => a11ySorunlari({ main: MAIN, preview: SAGLAM, ...o });

  assert.equal(a11y({}).length, 0);                                   // sağlıklı
  // 1. Biçim değişikliği YANLIŞ KIRMIZI vermemeli (eski regex veriyordu):
  assert.equal(a11y({ preview: PRE('      test: "error"') }).length, 0);   // virgülsüz
  assert.equal(a11ySorunlari({ main: MAIN, preview: 'a11y: {\n test: "error"\n },' }).length, 0);
  // 2. Gerçek sökme yolları KIRMIZI olmalı:
  assert.ok(a11y({ preview: PRE('      test: "todo",') }).length > 0);
  assert.ok(a11y({ preview: PRE('      test: "off",') }).length > 0);
  assert.ok(a11y({ preview: PRE('      test: "error",\n      disable: true,') }).length > 0);
  assert.ok(a11y({ main: 'addons: ["@storybook/addon-vitest"],' }).length > 0);
  assert.ok(a11y({ storyler: [{ ad: "x.stories.tsx", kaynak: 'parameters: { a11y: { test: "todo" } }' }] }).length > 0);
  // 3. Yorum içindeki metin KANIT DEĞİLDİR (eski regex buna kanıyordu):
  assert.ok(a11y({ preview: PRE('      /* test: "error", */\n      test: "todo",') }).length > 0);

  console.log(`self-check: 11 + 9 senaryo — kapı beklenen yerlerde kırmızı (FLOOR=${FLOOR})`);
  process.exit(0);
}

if (PROJECT === "storybook") {
  const oku = (p) => readFileSync(new URL(`./../${p}`, import.meta.url), "utf8");
  const storyler = [];
  const gez = (dizin) => {
    for (const g of readdirSync(new URL(`./../${dizin}`, import.meta.url), { withFileTypes: true })) {
      const yol = `${dizin}/${g.name}`;
      if (g.isDirectory()) gez(yol);
      else if (g.name.endsWith(".stories.tsx")) storyler.push({ ad: yol, kaynak: oku(yol) });
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
      env: { ...process.env, VITEST_STORYBOOK: "false" } },
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
