/**
 * Storybook test kapısı — fail-closed.
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
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";

const REPORT = ".artifacts/storybook-vitest.json";

/* Alt sınır — sahip kararı (sabit sayı değil). Sabit sayı her yeni story'de
   kapıyı kırar; alt sınır yalnız DÜŞÜŞÜ yakalar. Bugün ölçülen: 43 dosya /
   140 test. Bu sayı büyüdüğünde sınırı yükseltmek serbesttir, düşürmek bir
   karardır — düşürüyorsan aynı PR'da nedenini yaz. */
const FLOOR = 140;

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
export function evaluate(report, { runFailed = false, floor = FLOOR } = {}) {
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
  if (runFailed && problems.length === 0) {
    problems.push("vitest sıfırdan farklı çıkış kodu döndürdü ama rapor temiz — " +
                  "raporlanmayan bir hata var, kapı kapalı");
  }
  return { problems, files, passed };
}

if (process.argv.includes("--self-check")) {
  const { strict: assert } = await import("node:assert");
  const ok = { numPassedTests: 140, numFailedTests: 0, numPendingTests: 0,
               numTodoTests: 0, testResults: new Array(43) };
  const red = (r, o) => assert.ok(evaluate(r, o).problems.length > 0);

  assert.equal(evaluate(ok).problems.length, 0);              // sağlıklı koşu
  red({ ...ok, numPassedTests: 139 });                         // alt sınır altı
  red({ ...ok, numPassedTests: 0, testResults: [] });          // tarayıcı düştü
  red({ ...ok, numFailedTests: 1 });                           // düşen test
  red({ ...ok, numPendingTests: 1 });                          // sessizce atlandı
  red({ ...ok, numTodoTests: 1 });                             // todo
  red(ok, { runFailed: true });          // rapor temiz ama süreç hata verdi
  // Sınır büyüyünce eski alt sınır kapıyı körleştirmemeli:
  assert.equal(evaluate({ ...ok, numPassedTests: 400 }).problems.length, 0);
  console.log("self-check: 8 senaryo — kapı beklenen yerlerde kırmızı");
  process.exit(0);
}

const abs = new URL(`./../${REPORT}`, import.meta.url).pathname.replace(/^\//, "");
rmSync(REPORT, { force: true });
mkdirSync(dirname(REPORT), { recursive: true });

let runFailed = false;
try {
  execFileSync(
    "npx",
    ["vitest", "run", "--project", "storybook",
     "--reporter=json", `--outputFile=${REPORT}`],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
} catch {
  // Çıkış kodunu YUTMUYORUZ ama tek kanıt saymıyoruz: rapor yine de
  // yazılmış olabilir ve asıl teşhisi o taşır. Önce raporu oku, sonra bunu ekle.
  runFailed = true;
}

if (!existsSync(REPORT)) {
  throw new Error(
    `Storybook kapısı KAPALI: rapor yazılmadı (${REPORT}). ` +
    "Testler koşmadı — tarayıcı oturumu kurulamamış olabilir. " +
    `Teşhis: npx vitest run --project storybook  (abs: ${abs})`,
  );
}

let report;
try {
  report = JSON.parse(readFileSync(REPORT, "utf8"));
} catch (e) {
  throw new Error(`Storybook kapısı KAPALI: rapor bozuk JSON — ${e.message}`);
}

const { problems, files, passed } = evaluate(report, { runFailed });

if (problems.length > 0) {
  throw new Error(`Storybook kapısı KAPALI: ${problems.join(" · ")}`);
}

console.log(`Storybook kapısı AÇIK: ${files} dosya / ${passed} test geçti ` +
            `(alt sınır ${FLOOR}, atlanan 0, düşen 0)`);
