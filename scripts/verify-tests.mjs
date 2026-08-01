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
   pay bırakır, kayba bırakmaz.

   **190 → 205 (UI-ADR-171).** Denetim ölçtü: ölçüm 207, sınır 190 →
   **17 story sessizce silinebiliyordu** ve hiçbir kontrol görmüyordu
   (`ZORUNLU.storybook` yalnız kanaryayı arıyor, diğer 54 dosya
   korumasız). Sentetik raporla doğrulandı: 190 geçenli koşu YEŞİL,
   189 kırmızı. Sınır ölçümün HEMEN altında durmalı; 17'lik pay
   "dalgalanma" değil, kayıp payıdır. */
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
  /* Kanarya story'si — UI-ADR-168. Metin kilidi çalışma zamanını
     ölçemiyor; asıl kapı `src/a11y-kanarya.stories.tsx`. Silinirse ya da
     yeniden adlandırılırsa toplam yalnız 1 düşer, alt sınır görmez. */
  storybook: ["a11y-kanarya.stories"],
};

/**
 * Yorumları SİLMEZ, aynı uzunlukta boşlukla DOLDURUR — UI-ADR-169.
 *
 * Silmek iki kez oyuna geldi ve üçüncüsünde kendi ayağıma sıktı:
 *   · Blok yorumları önce sökülürse, bir SATIR yorumunun içindeki blok
 *     açma imi gerçek blok sanılır ve aradaki `disable: true` silinir.
 *   · Satır yorumları önce sökülürse, bir BLOK yorumunun içindeki `//`
 *     aynı oyunu ters yönden oynar.
 *   · Ve hiç sökülmezse, bir yorumun içindeki ÖRNEK gerçek yapılandırma
 *     sanılır (kanarya dosyasının kendi belgesi kapıyı düşürdü).
 *
 * Boşlukla doldurmak üçünü birden bitirir: konumlar korunduğu için
 * blokları boşaltılmış metinden bulup **ham metinle karşılaştırarak**
 * "bu bloğun içinde yorum var mıydı" sorusunu da cevaplayabiliyoruz.
 * Satır sonları korunur ki hata mesajlarındaki satır sayısı kaymasın.
 */
function yorumBosalt(k) {
  let cikti = "";
  let i = 0;
  while (i < k.length) {
    const c = k[i];
    const d = k[i + 1];

    /* DİZGE — İÇERİĞİ KORUNUR. Korunmak zorunda: kilit `'@'`,
       `"@storybook/addon-a11y"` ve `test: "error"` dizgelerini okuyor.
       Ama dizgenin İÇİ artık kod değil: oradaki bir yorum imi yorum
       AÇMAZ. Yutma saldırısı tam olarak bunu istismar ediyordu. */
    if (c === '"' || c === "'" || c === "`") {
      cikti += c;
      i += 1;
      while (i < k.length) {
        if (k[i] === "\\") { cikti += k[i] + (k[i + 1] ?? ""); i += 2; continue; }
        cikti += k[i];
        if (k[i] === c) { i += 1; break; }
        i += 1;
      }
      continue;
    }

    if (c === "/" && d === "/") {
      while (i < k.length && k[i] !== "\n") { cikti += " "; i += 1; }
      continue;
    }

    if (c === "/" && d === "*") {
      cikti += "  ";
      i += 2;
      while (i < k.length && !(k[i] === "*" && k[i + 1] === "/")) {
        cikti += k[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      if (i < k.length) { cikti += "  "; i += 2; }
      continue;
    }

    cikti += c;
    i += 1;
  }
  return cikti;
}

export function a11yBloklari(kaynak) {
  const bloklar = [];
  /* `\(*` — UI-ADR-168. `a11y: ({ test: "todo" })` bir çift parantezle
     eşleşmeden kaçıyordu: blok bulunamıyor, story'lerde `zorunlu=false`
     olduğu için hiç denetlenmiyordu. Tek satır, sıfır dolaylılık. */
  const re = /["']?a11y["']?\s*:\s*\(*\s*\{/g;
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
    bloklar.push({ bas, son: i - 1 });
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
export function a11ySorunlari({ main, preview, vitestConfig = "", storyler = [] }) {
  const sorunlar = [];
  /* Blok gövdesi boşluksuz hâliyle TAM olarak buna eşit olmalı. */
  const SAGLAM = /^test:["']error["'],?$/;
  const denetle = (ad, kaynak, zorunlu) => {
    const bos = yorumBosalt(kaynak);
    const bloklar = a11yBloklari(bos);
    /* ⓘ Burada bir "YUTMA İMZASI" VARDI ve UI-ADR-171'de KALDIRILDI.
       Yorum boşaltıcı regex tabanlıyken bir dizgenin içindeki yorum imi
       gerçek yorum sanılıyor, aradaki `a11y` bloğu görünmez oluyordu;
       imza da "hiç blok yoksa kırmızı" diyerek bunu yakalamaya
       çalışıyordu. İki kusuru vardı: (a) dosyaya SAĞLAM görünen tek bir
       yem blok koymak imzayı tamamen susturuyordu — "blok yok" hâlini
       doğruluyordu, "bir blok EKSİK" hâlini değil; (b) yorum içindeki
       ÖRNEKLERİ gerçek sanıp meşru dosyaları düşürüyordu (kanaryanın
       kendi belgesi iki kez kurban oldu).
       Boşaltıcı artık karakter tarıyor ve dizgeyi tanıyor: **yutma
       OLUŞAMIYOR**, dolayısıyla imzaya da gerek yok. Bir sınıfı
       tamamen ortadan kaldırmak, o sınıfı tespit etmeye çalışmaktan
       iyidir. */
    if (zorunlu && bloklar.length === 0) {
      sorunlar.push(`${ad}: \`a11y: { … }\` bloğu bulunamadı`);
      return;
    }
    for (const { bas, son } of bloklar) {
      /* BLOK İÇİNDE YORUM YASAK. Boşaltılmış dilim ham dilimden
         farklıysa orada bir yorum vardı. Bu bloğun tek meşru içeriği
         zaten `test: "error"`; gerekçe bloğun DIŞINA yazılır. */
      if (bos.slice(bas, son) !== kaynak.slice(bas, son)) {
        sorunlar.push(
          `${ad}: a11y bloğunun İÇİNDE yorum var — gerekçeyi bloğun dışına yaz ` +
          "(yorum sökme sırası iki ayrı sömürüye kandı, UI-ADR-169)",
        );
        continue;
      }
      const sade = bos.slice(bas, son).replace(/\s+/g, "");
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
     Ve kontrol DİZİNİN İÇİNE indirilmiş: dosyanın başka bir yerinde geçen
     (`const KALDIRILDI = ["@storybook/addon-a11y"]`) dizge saymaz. */
  const addons = yorumBosalt(main).match(/["']?addons["']?\s*:\s*\[[\s\S]*?\]/);
  if (!addons || !/["']@storybook\/addon-a11y["']/.test(addons[0])) {
    sorunlar.push(
      "main.ts `addons` DİZİSİNDE @storybook/addon-a11y yok — axe hiç yüklenmez, " +
      "tarama sıfırdır (test sayısı değişmediği için alt sınır bunu göremez)",
    );
  }

  /* axe'İN KENDİSİ SAHTELENEBİLİR — UI-ADR-170'te İZİN LİSTESİNE çevrildi.
     `resolve.alias` ile `axe-core` sahte bir modüle bağlanırsa tarama
     "koşar", rapor yazılır, motor adını bile doğru yazar ve HİÇBİR ŞEY
     ölçmez. İlk sürüm yasak kelime arıyordu ve denetim **on biçimden
     yedisinin kaçtığını** ölçtü: Vite'ın standart DİZİ biçimi
     (`[{ find, replacement }]`), 400 karakterden uzak dolgu, addon'un
     KENDİSİNİ alias'lamak, hesaplanmış anahtar, `plugins[].resolveId`…
     Yasak liste yine sonsuza kadar eksikti.
     Artık kural: bu iki dosyada `alias` ya da `resolveId` GEÇMESİ tek
     başına kırmızıdır — tek istisna bugünkü meşru kullanım (`'@'` →
     `src`). Yeni bir alias gerçekten gerekirse bu satır da güncellenir;
     yani kapıyı gevşetmek bilinçli bir düzenleme gerektirir. */
  /* `[^:{}]*` — UI-ADR-171. Önceki hâli `[^}]*` idi ve **kardeş anahtar
     yutuyordu**: `'@'` ilk sırada olduğu sürece aynı süslü parantezin
     içine `'axe-core': './sahte.ts'` eklemek kilidi yeşil bırakıyordu.
     İzin listesi `'@'` GİRİŞİNİ doğruluyordu ama "TEK giriş" olduğunu
     değil. `:` de yasak sınıfa girince ikinci anahtar imkânsız hâle
     geliyor; gerçek değer (`path.join(dirname, 'src')`) iki nokta
     içermediği için yanlış kırmızı vermiyor.
     ⚠️ Bu izin listesi KASITLI OLARAK DAR: `'@'` ikinci sıraya alınırsa
     ya da Vite'ın dizi biçimi kullanılırsa kırmızı olur. Meşru bir
     ikinci alias gerekirse bu satır da güncellenir — yani kapıyı
     gevşetmek bilinçli bir düzenleme gerektirir. */
  const IZINLI_ALIAS = /alias\s*:\s*\{\s*['"]@['"]\s*:\s*[^:{}]*\}/g;
  for (const [ad, kaynak] of [["vitest.config.ts", vitestConfig], ["main.ts", main]]) {
    if (!kaynak) continue;
    const kalan = yorumBosalt(kaynak).replace(IZINLI_ALIAS, "");
    const m = kalan.match(/alias|resolveId/);
    if (m) {
      sorunlar.push(
        `${ad}: beklenmeyen \`${m[0]}\` — modül yeniden yönlendirme axe'i (ya da ` +
        "`storybook/test`i) sahte bir modülle değiştirebilir; tarama koşuyor " +
        "görünür ama hiçbir şey ölçmez. Meşruysa bu kuralı da güncelle (UI-ADR-170).",
      );
    }
  }

  denetle("preview.tsx", preview, true);
  for (const { ad, kaynak } of storyler) denetle(ad, kaynak, false);

  return sorunlar;
}

/**
 * HER STORY KENDİ TARAMASININ KOŞTUĞUNU KANITLAR — UI-ADR-169.
 *
 * Beş tur denetim, dört farklı kilit sürümü ve hâlâ yeni sökme yolları.
 * Sebep artık çok net: kapı YAPILANDIRMAYA bakıyordu — önce metne, sonra
 * (kanaryayla) çözülmüş parametreye. İkisi de "acaba koşacak mı" sorusunu
 * cevaplıyor. Doğru soru: **KOŞTU MU?**
 *
 * Rapor bunu zaten taşıyormuş ve kimse bakmamış: `addon-vitest`
 * (`test-utils.js`) her story'nin `meta.reports`una axe'in gerçek
 * sonucunu yazıyor — motor adı ve sürümüyle birlikte
 * (`{ type: "a11y", status: "passed", result: { testEngine: axe-core } }`).
 * Ölçüldü: 207 assertion'ın **207'sinde** var.
 *
 * Bu tek kontrol, beş turda bulunan sökme yollarının neredeyse tamamını
 * birden kapatır — çünkü hiçbirini AYRI AYRI tanımıyor:
 *   · addon `main.ts`ten çıkarılırsa rapor hiç yazılmaz
 *   · `disable`/`manual`/`ghostStories`/`context.exclude` — `shouldRun`
 *     düşer, `addReport` hiç çağrılmaz
 *   · `todo` kipi — ⚠️ YALNIZ İHLAL VARKEN. Addon
 *     `status: hasViolations ? getMode() : "passed"` yazıyor, yani
 *     BUGÜN TEMİZ olan bir story'yi `todo`ya çevirmek raporda HİÇBİR iz
 *     bırakmaz. Çalışma zamanı kanıtı `todo`yu ancak zaten ihlal varken
 *     yakalar — oysa korunmak istenen şey YARINKİ regresyondur.
 *     `todo`ya karşı tek savunma metin kilidi + kanaryadır.
 *   · `afterEach`te DOM boşaltmak ya da parametreyi ezmek — UI-ADR-168'in
 *     "AÇIK KALIYOR" diye kaydettiği delik; kanaryadan SONRA koşuyordu
 *     ama rapordan önce değil
 *   · parantezli/hesaplanmış/atamalı yazımlar — metin hiç okunmuyor
 *
 * Kapatmadığı: axe'in kendisini sahte bir modülle değiştirmek (o da
 * "passed" der). Ona karşı `a11ySorunlari` `vitest.config.ts`teki
 * `alias`a bakıyor.
 */
function a11yKanitiEksikOlanlar(report) {
  const eksik = [];
  for (const f of report.testResults ?? []) {
    for (const a of f.assertionResults ?? []) {
      if (a.status !== "passed") continue;   // düşenleri `failed` zaten sayıyor
      const raporlar = (a.meta?.reports ?? []).filter((r) => r?.type === "a11y");
      const gecerli = raporlar.filter((r) => {
        if (r.status !== "passed") return false;
        const rr = r.result ?? {};
        /* KAÇ KURAL DEĞERLENDİRİLDİ — UI-ADR-171'in ASIL sinyali.
           Önceki eşik "passes + violations >= 1" idi ve ölçüldü:
           `runOnly: ["image-alt"]` tam olarak **1** üretiyor, yani eşiği
           birebir aşıyor. Hacim story'nin İÇERİĞİNE bağlı (bu depoda
           2–35) — saldırgan onu seçebiliyor.
           Kural TOPLAMI ise içerikten neredeyse bağımsız: ölçüldü,
           **207 story'de 87–88.** `runOnly`/`config.rules`/sahte axe
           modülü bunu 0–1'e düşürür. 80 eşiği rahat pay bırakır. */
        const kural = ["passes", "violations", "incomplete", "inapplicable"]
          .reduce((t, k) => t + (rr[k]?.length ?? 0), 0);
        if (kural < 80) return false;
        /* axe KULLANILAN SEÇENEKLERİ RAPORA YAZIYOR — bedava ikinci
           sinyal. Temiz koşuda `{ reporter: "v1" }`; `runOnly` ya da
           `rules` verilince onlar da görünür. Yani daraltma, kendi izini
           bırakıyor ve bunu okumak tek satır. */
        const opt = Object.keys(rr.toolOptions ?? {}).filter((k) => k !== "reporter");
        if (opt.length > 0) return false;
        /* HACİM — UI-ADR-170. `status: "passed"` yalnız "ihlal bulunmadı"
           demektir; addon `hasViolations ? getMode() : "passed"` yazıyor.
           Yani HİÇBİR ŞEY TARAMAMAK da "passed"tir. Ölçüldü (playwright +
           axe 4.12.1): `context: { include: "head" }` → 0 kural, PASSED.
           Sahte bir axe modülü de boş sonuç döndürüp "passed" der ve motor
           adını bile doğru yazar. Ayrım tek sinyalde: KAÇ KURAL
           DEĞERLENDİRİLDİ. Bu depoda gerçek dağılım 2–7 (ölçüldü); eşik 1,
           yani yalnız "sıfır ölçüm" kırmızıdır — yanlış kırmızı payı
           bilerek geniş, çünkü asıl saldırı sıfırdır. */
        /* HACİM — artık İKİNCİL. `context` daraltması kural sayısını
           bozmadan hacmi düşürebiliyor (`#storybook-root p` → 2, yani
           deponun ölçülen minimumu). Tek başına yeterli değil, ama
           sıfır/bir hacmi elemek bedava. */
        return (rr.passes?.length ?? 0) + (rr.violations?.length ?? 0) >= 2;
      });
      if (gecerli.length === 0) {
        eksik.push(a.fullName ?? a.title ?? String(f.name ?? "?"));
      }
    }
  }
  return eksik;
}

export function evaluate(report, { runFailed = false, floor = FLOOR, zorunlu = [], a11yKaniti = false } = {}) {
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
  /* TOPLAM = GEÇEN — UI-ADR-170. `numPendingTests` `result?.state`e
     bakıyor; `result` hiç oluşmamış bir test ("pending", mode=run) ne
     oraya ne `numTodoTests`e giriyor. Yani 17 story sessizce kaybolup
     alt sınırın (190) üstünde kalabilir ve HİÇBİR sayaç görmez. Kapının
     kurulma sebebi tam olarak buydu: "tarayıcı düştü, testler koşmadı,
     özet yine passed yazdı." */
  const toplam = report.numTotalTests ?? passed;
  if (toplam !== passed) {
    problems.push(`toplam ${toplam} ≠ geçen ${passed} — ${toplam - passed} test hiçbir sayaca girmedi`);
  }
  const adlar = (report.testResults ?? []).map((r) => String(r.name ?? ""));
  for (const z of zorunlu) {
    if (!adlar.some((a) => a.includes(z))) {
      problems.push(`KAPI DOSYASI KOŞMADI: ${z} — silinmiş ya da yeniden adlandırılmış olabilir`);
    }
  }
  if (a11yKaniti) {
    /* TOPLAM TARANAN DÜĞÜM — UI-ADR-171. `context` daraltmasının
       (`include: "#storybook-root p"`) kural sayısını bozmayan tek
       görünür izi budur. Ölçüldü: 207 story'de **12.425 düğüm**. Genel
       bir daraltma bunu birkaç yüze çökertir. Bu bir KALİBRASYON
       değeridir, tercih değil: story eklendikçe yükselir, DÜŞÜRMEK bir
       karardır — düşürüyorsan aynı commit'te nedenini yaz. */
    let dugum = 0;
    for (const f of report.testResults ?? []) {
      for (const a of f.assertionResults ?? []) {
        for (const r of a.meta?.reports ?? []) {
          if (r?.type !== "a11y") continue;
          for (const k of ["passes", "violations", "incomplete"]) {
            for (const n of r.result?.[k] ?? []) dugum += (n.nodes?.length ?? 0);
          }
        }
      }
    }
    /* Eşik MUTLAK değil, story başına ORANTILI. İlk hâli sabit 9000'di
       ve kapının kendi self-check'i onu anında çürüttü: tek story'lik bir
       fixture 9000 düğüm üretemez. Ölçülen gerçek ortalama **60**
       (12.425 / 207); eşik 20'de, yani üçte bir. Genel bir daraltma
       story başına 2–3 düğüme çöker (ölçüldü) → toplam ~500, sınırın çok
       altında. Tek tek story'lere alt sınır KOYULAMAZ: gerçek minimum 2
       düğüm ve o meşru. Toplam bakılır, tek tek değil. */
    const dugumSiniri = passed * 20;
    if (dugum > 0 && dugum < dugumSiniri) {
      problems.push(
        `taranan düğüm ${dugum} < ${dugumSiniri} (story başına 20) — axe kapsamı daraltılmış olabilir`,
      );
    }
    const eksik = a11yKanitiEksikOlanlar(report);
    if (eksik.length > 0) {
      problems.push(
        `${eksik.length} story a11y taramasının koştuğunu KANITLAMIYOR ` +
        `(ilk: ${eksik.slice(0, 3).join(" · ")}) — axe koşmamış ya da ` +
        "`todo` kipinde uyarı yazmış olabilir",
      );
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
  /* UI-ADR-168 — dorduncu denetimin iki yeni yolu. Duzeltme testsiz kalmasin. */
  // (a) Satir yorumunun ICINDE blok-acma imi: TypeScript satir yorumu sayar,
  //     eski yorum sokucu blok sanip aradaki `disable: true`yu siliyordu.
  const ACIK = "/" + "*", KAPA = "*" + "/";
  assert.ok(a11y({ preview:
    `a11y: {\n  test: "error",\n  // acik ${ACIK}\n  disable: true,\n  // ${KAPA}\n},`
  }).length > 0);
  // (b) Bir cift parantez regex'ten kaciriyordu.
  assert.ok(a11y({ preview: 'a11y: ({ test: "todo" }),' }).length > 0);
  assert.ok(a11y({ storyler: [{ ad: "p.stories.tsx", kaynak: 'parameters: { a11y: ({ test: "todo" }) }' }] }).length > 0);
  // main.ts: dizge dosyada geçiyor ama `addons` DİZİSİNDE değil.
  assert.ok(a11y({ main: 'const KALDIRILDI = ["@storybook/addon-a11y"]; addons: ["@storybook/addon-vitest"],' }).length > 0);
  assert.ok(a11y({ storyler: [{ ad: "x.stories.tsx", kaynak: 'parameters: { a11y: { test: "todo" } }' }] }).length > 0);
  /* UI-ADR-169 — besinci denetimin yollari. */
  // Blok icinde yorum artik YASAK: sira oyununun iki yonu de biter.
  assert.ok(a11y({ preview: `a11y: {
  test: "error",
  /* neden: // ayrinti */
  disable: true,
},` }).length > 0);
  assert.ok(a11y({ preview: `a11y: {
  test: "error",
  // not
},` }).length > 0);
  // axe'in kendisi sahtelenirse tarama kosar ama hicbir sey olcmez.
  assert.ok(a11y({ vitestConfig: 'resolve: { alias: { "axe-core": "./sahte.ts" } }' }).length > 0);
  assert.ok(a11y({ vitestConfig: 'resolve: { alias: { "storybook/test": "./sahte.ts" } }' }).length > 0);
  assert.equal(a11y({ vitestConfig: 'resolve: { alias: { "@": "./src" } }' }).length, 0);
  /* UI-ADR-170 — dizge yutma imzasi ve alias izin listesi. */
  // Bir dizge yorum acma imi tasiyorsa aradaki HER SEY bosluga doner ve
  // gercek a11y blogu GORUNMEZ olur. Yutma girisiminin izini ariyoruz.
  assert.ok(a11y({ storyler: [{ ad: "y.stories.tsx",
    kaynak: `const A = "/*"; parameters: { a11y: { test: "todo" } }; const B = "*/";` }] }).length > 0);
  // Vite'in DIZI bicimi de dahil, her alias kirmizidir; tek istisna '@'.
  assert.ok(a11y({ vitestConfig: 'alias: [{ find: "axe-core", replacement: "./f.ts" }]' }).length > 0);
  assert.ok(a11y({ vitestConfig: 'plugins: [{ resolveId(id) { return id; } }]' }).length > 0);
  assert.ok(a11y({ main: MAIN + ' viteFinal: (c) => ({ resolve: { alias: { "axe-core": "./f.ts" } } })' }).length > 0);
  // Gercek vitest.config.ts'teki mesru alias yanlis kirmizi vermemeli.
  /* CALISMA ZAMANI KANITI — her story kendi taramasini kanitlar. */
  const rp = (st, hacim = 3, kural = 87, opt = { reporter: "v1" }) => ({
    numPassedTests: 1, numTotalTests: 1, numFailedTests: 0,
    numPendingTests: 0, numTodoTests: 0,
    testResults: [{ name: 'x', assertionResults: [{ status: 'passed', fullName: 'S',
      meta: st === null ? {} : { reports: [{ type: 'a11y', status: st, result: {
        passes: new Array(hacim).fill({ nodes: new Array(60).fill({}) }),
        violations: [],
        inapplicable: new Array(Math.max(0, kural - hacim)).fill({}),
        toolOptions: opt } }] } }] }] });
  const K = { floor: 1, a11yKaniti: true };
  assert.equal(evaluate(rp('passed'), K).problems.length, 0);
  assert.ok(evaluate(rp('warning'), K).problems.length > 0);   // ihlalli todo kipi
  assert.ok(evaluate(rp(null), K).problems.length > 0);        // axe hic kosmadi
  /* HACIM — "passed" ama neredeyse hicbir sey olculmemis. */
  assert.ok(evaluate(rp('passed', 0), K).problems.length > 0);
  assert.ok(evaluate(rp('passed', 1), K).problems.length > 0);
  /* KURAL SAYISI — UI-ADR-171'in ASIL sinyali. `runOnly` kural
     toplamini 87'den 1'e dusuruyor; hacim esigi bunu goremiyordu. */
  assert.ok(evaluate(rp('passed', 2, 1), K).problems.length > 0);
  assert.ok(evaluate(rp('passed', 2, 79), K).problems.length > 0);
  assert.equal(evaluate(rp('passed', 2, 87), K).problems.length, 0);
  /* toolOptions — daraltma kendi izini birakiyor. */
  assert.ok(evaluate(rp('passed', 3, 87, { reporter: "v1", runOnly: {} }), K).problems.length > 0);
  /* TARANAN DUGUM — `context` daraltmasinin tek gorunur izi. */
  assert.ok(evaluate(rp('passed', 3, 87, { reporter: "v1" }), { ...K }).problems.length === 0);
  const az = rp('passed');
  az.testResults[0].assertionResults[0].meta.reports[0].result.passes =
    new Array(3).fill({ nodes: [{}] });
  assert.ok(evaluate(az, K).problems.length > 0);
  assert.equal(evaluate(rp(null), { floor: 1 }).problems.length, 0);  // unit projesi etkilenmez
  /* TOPLAM = GECEN — sayaclara girmeyen test. */
  assert.ok(evaluate({ ...rp('passed'), numTotalTests: 5 }, K).problems.length > 0);
  /* GERÇEK DOSYALAR — senaryolar uydurma girdiyle yeşil olup yürürlükteki
     yapılandırmayı düşürebilirdi; bu satır o boşluğu kapatır. */
  const gercek = (yol) => readFileSync(new URL(`./../${yol}`, import.meta.url), "utf8");
  assert.equal(
    a11ySorunlari({ main: gercek(".storybook/main.ts"), preview: gercek(".storybook/preview.tsx") }).length,
    0, "yürürlükteki .storybook yapılandırması kilitten geçmeli");
  /* Gerçek `vitest.config.ts`teki meşru `@` alias'ı yanlış kırmızı vermemeli. */
  assert.equal(a11y({ vitestConfig: gercek("vitest.config.ts") }).length, 0);


  console.log(`self-check: 11 + 48 senaryo — kapı beklenen yerlerde kırmızı (FLOOR=${FLOOR})`);
  process.exit(0);
}

/* ⚠️ BU DOSYA IMPORT EDİLİRSE KAPIYI KOŞTURUR — UI-ADR-168, bilinçli.
   `a11ySorunlari` ve `a11yBloklari` `export` edilmiş ama aşağıdaki her
   şey modül üst seviyesinde: import eden bir sonda TÜM storybook
   paketini başlatır (denetimde ölçüldü, iki dakikada zaman aşımı).
   Bir `DOGRUDAN` koruması denendi ve YARIM kaldı — yalnız bu bloğu
   atlıyor, aşağıdaki `execFileSync`i atlamıyordu; yarım bir koruma,
   olmayandan kötüdür (atladığını sanırsın). Temiz çözüm saf kısmı ayrı
   bir modüle almaktır ve o gün geldiğinde yolu budur.
   BUGÜN İÇİN: bu fonksiyonları sınamanın yolu `--self-check`tir. */
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
    vitestConfig: oku("vitest.config.ts"),
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
  a11yKaniti: PROJECT === "storybook",
});

if (problems.length > 0) {
  throw new Error(`${PROJECT} kapısı KAPALI: ${problems.join(" · ")}`);
}

console.log(`${PROJECT} kapısı AÇIK: ${files} dosya / ${passed} test geçti ` +
            `(alt sınır ${FLOOR}, atlanan 0, düşen 0)`);
