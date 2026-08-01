/**
 * EKRAN DURUM MATRİSİ KAPISI — UI-ADR-151.
 *
 * Bir ekran `demo?: DemoState` alıyorsa üç durumu da (`loading` · `empty` ·
 * `error`) çizebiliyor demektir — ve o üç durumun her biri kullanıcıya
 * FARKLI bir şey söyler:
 *
 *     "yükleniyor"  ≠  "ölçüldü, sonuç boş"  ≠  "ÖLÇÜLMEDİ"
 *
 * Ortadaki bir CEVAPTIR; sonuncusu cevapsızlıktır. İkisini aynı gösteren
 * bir ekran, ölçülmemiş bir şeyi ölçülmüş gibi sunar — CLAUDE.md §2'nin
 * ekran seviyesindeki hâli.
 *
 * Bu kapı yalnız story'nin VARLIĞINI değil `play`ini de ister: durum
 * story'leri bu repoda zaten vardı ve HİÇBİRİ bir şey iddia etmiyordu
 * (yazılımcılar meclisinin bulduğu eksik test sınıfı buydu). Yalnız render
 * eden bir durum story'si, ekranın o durumda ne gösterdiğini kanıtlamaz.
 *
 * ⚠️ İLK HÂLİ AÇIKTI ve kendi kapıma saldırınca çıktı: dosyadaki `play:`
 * SAYISINI sayıyordu. Bir durum story'sinin `play`ini silip ALAKASIZ bir
 * story'ye sahte bir `play` eklemek sayıyı koruyordu ve kapı geçiyordu.
 * Sayı saymak, doğru yerde olup olmadığını sormaz. Şimdi her `export
 * const` bloğu AYRI AYRI inceleniyor: `demo="..."` hangi bloktaysa `play`
 * de O BLOKTA olmak zorunda.
 *
 * ponytail: blok ayrımı `export const` sınırıyla yapılıyor, AST
 * kurulmuyor. Bu kapının yakalaması gereken hata sınıfı için yeterli;
 * story'nin İÇERİĞİNİN doğruluğunu `play`in kendisi doğrular.
 */

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const FEATURES = join(process.cwd(), "src", "features");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
  );
}

/** HER ekran — muafiyet yok (UI-ADR-153). */
const screens = walk(FEATURES).filter((f) => f.endsWith("screen.tsx"));

/**
 * EKRANIN BEYAN ETTİĞİ DURUMLAR — UI-ADR-174 (kurul kararı, gavadolar 2/2).
 *
 * Kapı önce `demo?: DemoState` gören her ekrandan ÜÇ durumu birden
 * istiyordu. Bu `intelligence-feed`de tıkandı: o ekran YALNIZCA iki dal
 * çiziyor (yükleniyor ve veri); hata/boş dalı orada hiç yok, alt bileşene
 * devredilmiş ve onun kendi story dosyası var. Üç story istemek, **olmayan
 * bir davranışı test ediyormuş gibi görünen** iddialar yazdırırdı — bu
 * reponun 2 numaralı kuralının (karşılığı olmayan gösterge çizilmez) test
 * tarafındaki karşılığı.
 *
 * Kurul ölçütü: *"çizilen ve kullanıcıya görünür her durum dalını uyandır;
 * matris simetrisi için prop ekleme."* Statik olarak ölçülebilir kılmanın
 * yolu, ekranın hangi durumları zorlayabildiğini **TİPİYLE beyan etmesi**:
 *
 *     demo?: DemoState    → üçü de istenir
 *     demo?: "loading"    → yalnız o istenir
 *
 * Böylece kural insan yargısına değil ekranın kendi imzasına bağlanıyor ve
 * beyanı daraltmak, "bu dalı çizmiyorum" demenin makinece okunabilir hâli
 * oluyor.
 */
function beyanEdilenDurumlar(kaynak: string): string[] {
  /* `^\s*` ÇAPASI ŞART. Çapasız hâli bu oturumda kendi belgesine kandı:
     `intelligence-feed`in JSDoc'unda geçen "diğer ekranlar `demo?:
     DemoState` alır" cümlesini GERÇEK BEYAN sanıp üç story istedi.
     Gerçek beyan satır başında (girintiden sonra) durur; JSDoc satırları
     `*` ile başlar ve artık eşleşemez. Yorumu yeniden yazmak geçici
     çözümdü — imler metnin içinde de imdir, ayrıştırıcı düzeltilir. */
  /* `[^;}]` — ÇOK SATIRLI union için (kurul bulgusu). Eski `[^;\n]`
     satır sonunda kesiyordu, yani
         demo?:
           | "loading"
           | "empty"
     yazımında BOŞ dönüyor ve ekran sessizce muaf kalıyordu. `}` sınırı
     satır içi tip literallerinde bir sonraki prop'a taşmayı engelliyor. */
  const m = kaynak.match(/^\s*demo\?:\s*([^;}]+)/m);
  if (!m) return [];
  const tip = m[1].trim();
  /* `\b` ŞART: çapasız `/DemoState/` bir gün `DemoStateish` diye bir tipi
     de yakalar ve o ekrandan yanlışlıkla üç story ister (kurul bulgusu). */
  if (/\bDemoState\b/.test(tip)) return ["loading", "empty", "error"];
  /* Tek tırnak da geçerli TS: `demo?: 'loading'` eskiden kaçıyordu. */
  return [...tip.matchAll(/['"](loading|empty|error)['"]/g)].map((x) => x[1]);
}

const demoScreens = screens.filter(
  (f) => beyanEdilenDurumlar(readFileSync(f, "utf8")).length > 0
);

const rel = (f: string) =>
  f.slice(process.cwd().length + 1).split("\\").join("/");
const storyPathOf = (f: string) =>
  f.replace(/screen\.tsx$/, "screen.stories.tsx");

/** `export const X` bloklarına ayır — `play`in DOĞRU story'de olduğunu
 *  ancak böyle sorabiliriz. */
const bloklarOf = (src: string) => src.split(/^export const /m).slice(1);

/** Bir bloğun bir şey İDDİA ettiğini doğrular. */
function iddiaVarMi(blok: string): boolean {
  if (!/^\s*play:/m.test(blok)) return false;
  /* YORUMLAR DÜŞÜRÜLÜR — UI-ADR-154. `expect(` düz alt dize olarak
     aranıyordu ve `/* bir gün expect( yazacağım *\/` bile kapıyı
     geçiriyordu; gövde tamamen boş olabilirdi. */
  const govde = blok
    .slice(blok.search(/^\s*play:/m))
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
  /* `expect(true).toBe(true)` biçimsel olarak geçer ama sıfır şey kanıtlar:
     sabit bir değerle kurulan iddia, ekran hiç render edilmese de doğrudur.
     Sayılmayan bu tür çağrılar düşürülüp GERÇEK bir iddia aranıyor. */
  const anlamli = govde.replace(/expect\(\s*(true|false|-?\d+)\s*\)/g, "");
  return anlamli.includes("expect(");
}

/** Her durum için story adında aranan iz — Türkçe adlar kullanılıyor. */
const STATES = [
  { key: "loading", demo: /demo="loading"/ },
  { key: "empty", demo: /demo="empty"/ },
  { key: "error", demo: /demo="error"/ },
] as const;

describe("ekran kapısı — HER ekran (UI-ADR-151 → 153)", () => {
  it("kapı boşa çalışmıyor: iki liste de dolu", () => {
    /* Kapının kendisi de körleşebilir: `screen.tsx` adlandırması değişirse
       liste sessizce boşalır ve test hep yeşil kalır. */
    expect(screens.length).toBeGreaterThan(0);
    expect(demoScreens.length).toBeGreaterThan(0);
  });

  /**
   * MUAFİYET KALDIRILDI — UI-ADR-153. Kapı önce `demo?: DemoState`
   * beyanına kilitliydi; o prop'u ALMAYAN üç ekran (`amazon/sku`,
   * `goals`, `intelligence-feed`) matristen sessizce muaftı ve muafiyet
   * gerçek bir boşluktu: `amazon/sku`ın DÖRT durum story'si vardı,
   * hiçbiri bir şey iddia etmiyordu; diğer ikisinin hiç hikâyesi yoktu.
   *
   * Ekranın durumları `demo` prop'undan gelmek ZORUNDA değil —
   * `AmazonSkuPanel` hiç prop almaz, durumları store ve sorgudan gelir.
   * Bu yüzden kural durum ADLARINA değil ŞUNA bağlandı: her ekranın
   * hikâyesi olacak ve HER story bir şey iddia edecek.
   */
  it.each(screens.map(rel))(
    "%s — hikâyesi var ve HER story bir şey İDDİA EDİYOR",
    (r) => {
      const storyPath = storyPathOf(join(process.cwd(), r));
      expect(
        existsSync(storyPath),
        `${r}: hikâyesi YOK. Bir ekranın ne çizdiğini kanıtlayan tek yer ` +
          `hikâyesidir; hikâyesiz ekran yalnız gözle doğrulanabilir.`
      ).toBe(true);

      const bloklar = bloklarOf(readFileSync(storyPath, "utf8"));
      /* SIFIR BLOK = SIFIR İDDİA ve döngü hiç dönmez → test yeşil kalırdı.
         `export default meta` ya da `export { X }` biçimine çevrilmiş bir
         story dosyası kapıyı böyle geçiyordu (UI-ADR-154). */
      expect(
        bloklar.length,
        `${r}: hikâye dosyasında hiç \`export const\` story YOK — kapı ` +
          `hiçbir şey denetleyemiyor. Story'ler \`export const\` ile yazılır.`
      ).toBeGreaterThan(0);

      for (const blok of bloklar) {
        const ad = blok.slice(0, Math.max(blok.indexOf(":"), 0));
        expect(
          iddiaVarMi(blok),
          `${r} → "${ad}" story'si hiçbir şey İDDİA ETMİYOR (play yok ya ` +
            `da play'inde expect yok). Yalnız render eden bir story, ` +
            `bileşenin patlamadığını kanıtlar — DOĞRU çizdiğini değil.`
        ).toBe(true);
      }
    }
  );

  it.each(demoScreens.map(rel))(
    "%s — BEYAN ETTİĞİ her durumun ayrı story'si var",
    (rel) => {
      const storyPath = storyPathOf(join(process.cwd(), rel));
      const src = readFileSync(storyPath, "utf8");
      const beyan = beyanEdilenDurumlar(
        readFileSync(join(process.cwd(), rel), "utf8")
      );

      /* Dosyayı `export const` sınırlarından bloklara ayır — `play`in
         DOĞRU story'de olduğunu ancak böyle sorabiliriz. */
      const bloklar = src.split(/^export const /m).slice(1);

      /* BEYAN EDİLENİ iste, üçünü birden değil — UI-ADR-174. */
      for (const s of STATES.filter((x) => beyan.includes(x.key))) {
        const blok = bloklar.find((b) => s.demo.test(b));

        expect(
          blok,
          `${rel}: "${s.key}" durumunun story'si yok. Ekran o durumu ` +
            `çizebiliyor ama ne gösterdiğini kimse kanıtlamıyor.`
        ).toBeDefined();

        /* `play` AYNI blokta olmalı. Başka bir story'deki `play` bu durumu
           kanıtlamaz — kapının ilk hâli tam olarak buna kanıyordu. */
        expect(
          /^\s*play:/m.test(blok!),
          `${rel}: "${s.key}" durum story'sinde \`play\` YOK. Yalnız render ` +
            `eden bir durum story'si ekranın o durumda ne gösterdiğini ` +
            `KANITLAMAZ (UI-ADR-150 ile aynı kural). Başka bir story'deki ` +
            `play bunun yerine geçmez.`
        ).toBe(true);

        /* Bir blok İKİ durumu birden taşıyamaz: taşısaydı tek `play` üç
           durumu birden "karşılar" görünürdü ve kapı susardı. Her durum
           kendi story'sinde, kendi iddiasıyla. */
        const demoSayisi = (blok!.match(/demo="(loading|empty|error)"/g) ?? [])
          .length;
        expect(
          demoSayisi,
          `${rel}: "${s.key}" story'si ${demoSayisi} farklı demo durumu ` +
            `çiziyor. Her durum AYRI story olmalı — tek play birden fazla ` +
            `durumu kanıtlayamaz.`
        ).toBe(1);

        /* `play` GÖVDESİ boş olamaz: `play: async () => {}` biçimsel
           olarak geçer ve sıfır şey iddia eder. En az bir `expect` istenir.

           Düz `includes` KASITLI, regex değil: ilk yazımda buraya
           `/expect…/` konmuştu ve `` yazıya GÖRÜNMEZ bir backspace
           baytı (0x08) olarak girmişti — regex hiçbir zaman eşleşmedi ve
           kapı ÜÇ dosyayı da haksız yere kırmızı gösterdi. Aranan şey düz
           bir alt dize; regex burada hiçbir şey kazandırmıyordu. */
        const govde = blok!.slice(blok!.search(/^\s*play:/m));
        expect(
          govde.includes("expect("),
          `${rel}: "${s.key}" story'sinin \`play\`inde hiç \`expect\` yok. ` +
            `Boş bir play, olmayan bir play'dir.`
        ).toBe(true);
      }
    }
  );
});
