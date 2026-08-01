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

import ts from "typescript";
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
const DURUMLAR = ["loading", "empty", "error"] as const;

/**
 * `demo` prop'unun tipini AST'den çözer — UI-ADR-177, **178'de üç kusuru
 * kapatıldı** (`ask_yazilimcilar` 2/4).
 *
 * ⚠️ ÖNCE REGEX'Tİ ve üç kez yamandı; her yama bir ÖRNEĞİ kapatıyordu,
 * SINIFI değil. AST'ye geçince yorum/dizge sınıfı yapısal olarak kapandı
 * ama üç kusur kaldı ve denetim üçünü de buldu:
 *
 *  1. **İLK `demo` prop'unu alıyordu.** Dosyada bir yardımcı bileşenin
 *     props tipi ÖNCE gelirse yanlış tipe bağlanırdı. Artık yalnız
 *     EXPORT EDİLEN fonksiyonun ilk parametresine bakılıyor.
 *  2. **Çözülemeyen tip SESSİZCE boş dönüyordu** (`Props["demo"]` gibi).
 *     Bunu "güvenli yön" diye yazmıştım; denetim ikisi de **"hayır, bu
 *     SESSİZ MUAFİYET"** dedi ve haklılar — ekran matristen düşüyor ve
 *     kimse fark etmiyor. Artık **KIRMIZI**.
 *  3. **Yerel `type DemoState = "loading"` gölgelemesi.** Ada bakıyordum;
 *     biri aynı dosyada daha dar bir alias tanımlarsa kapı üç story
 *     isterdi ama ekran tek durum çizerdi. Artık yerel alias önce
 *     çözülüyor.
 *
 * Tam çözüm `ts.TypeChecker` ister (denetimin önerdiği) ve o, tek dosya
 * yerine tsconfig'den TÜM PROGRAMI kurmayı gerektirir — kapı süresini
 * ölçülebilir biçimde uzatır. Bugün sözdizimi üç kusuru da kapatıyor;
 * yükseltme yolu yazılı.
 */
type BeyanSonucu =
  | { tur: "durumlar"; durumlar: string[] }
  | { tur: "yok" }
  | { tur: "cozulemedi"; neden: string };

function beyanEdilenDurumlar(kaynak: string): BeyanSonucu {
  const dosya = ts.createSourceFile(
    "screen.tsx",
    kaynak,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  /* Yerel alias'lar — `type DemoState = "loading"` gölgelemesi (kusur 3). */
  const yerelAlias = new Map<string, ts.TypeNode>();
  for (const st of dosya.statements) {
    if (ts.isTypeAliasDeclaration(st)) yerelAlias.set(st.name.text, st.type);
  }

  /* YALNIZ EXPORT EDİLEN fonksiyonun ilk parametresi (kusur 1). */
  const parametreTipleri: ts.TypeNode[] = [];
  for (const st of dosya.statements) {
    const disaAcik = ts.canHaveModifiers(st)
      ? ts
          .getModifiers(st)
          ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      : false;
    if (!disaAcik) continue;
    if (ts.isFunctionDeclaration(st) && st.parameters[0]?.type) {
      parametreTipleri.push(st.parameters[0].type);
    }
  }

  const literalleriTopla = (t: ts.TypeNode): string[] => {
    const bulunan: string[] = [];
    const gez = (n: ts.Node): void => {
      if (ts.isLiteralTypeNode(n) && ts.isStringLiteral(n.literal)) {
        bulunan.push(n.literal.text);
      }
      ts.forEachChild(n, gez);
    };
    gez(t);
    return bulunan;
  };

  for (const pt of parametreTipleri) {
    let demoTipi: ts.TypeNode | undefined;
    const bul = (n: ts.Node): void => {
      if (
        ts.isPropertySignature(n) &&
        n.name.getText(dosya) === "demo" &&
        n.questionToken &&
        n.type
      ) {
        demoTipi = n.type;
      }
      ts.forEachChild(n, bul);
    };
    bul(pt);
    if (!demoTipi) continue;

    /* DOLAYLI ERİŞİM AÇIKÇA REDDEDİLİR — UI-ADR-178.
       `P["demo"]` yazımında yerel alias'ı çözüp GÖVDESİNDEN literal
       toplamak KAZARA doğru cevap verebiliyor (`P = { demo?: "loading" }`
       örneğinde verdi) — ama `P`'de ikinci bir alan olsaydı onun
       literalini de toplar ve SESSİZCE yanlış cevap verirdi. Kazara
       doğru bir ayrıştırıcı, yanlış bir ayrıştırıcıdır. */
    if (ts.isIndexedAccessTypeNode(demoTipi)) {
      return {
        tur: "cozulemedi",
        neden: `\`demo\` tipi dolaylı erişim: \`${demoTipi.getText(dosya)}\``,
      };
    }

    /* Tip referansını çöz: önce YEREL alias, sonra kanonik ad. */
    let cozulen: ts.TypeNode = demoTipi;
    const referanslar: string[] = [];
    const refGez = (n: ts.Node): void => {
      if (ts.isTypeReferenceNode(n)) referanslar.push(n.typeName.getText(dosya));
      ts.forEachChild(n, refGez);
    };
    refGez(demoTipi);

    for (const r of referanslar) {
      const yerel = yerelAlias.get(r);
      if (yerel) cozulen = yerel;
    }

    const lit = [...new Set(literalleriTopla(cozulen))];
    const gecerli = lit.filter((x) => (DURUMLAR as readonly string[]).includes(x));

    if (gecerli.length > 0 && gecerli.length === lit.length) {
      return { tur: "durumlar", durumlar: gecerli };
    }
    /* Yerelde çözülemeyen ama KANONİK adı taşıyan referans: dış dosyadan
       gelen `DemoState`. Bu tek meşru dolaylılık. */
    if (lit.length === 0 && referanslar.includes("DemoState")) {
      return { tur: "durumlar", durumlar: [...DURUMLAR] };
    }
    /* Geri kalan her şey — `Props["demo"]`, bilinmeyen alias, karışık
       union — SESSİZ MUAFİYET DEĞİL, KIRMIZI (kusur 2). */
    return {
      tur: "cozulemedi",
      neden: `\`demo\` tipi çözülemedi: \`${demoTipi.getText(dosya).replace(/\s+/g, " ")}\``,
    };
  }

  return { tur: "yok" };
}

/* ÇÖZÜLEMEYEN tip de matrise girer — kapı orada KIRMIZI verecek.
   Sessizce dışarıda bırakmak, denetimin "sessiz muafiyet" dediği şeyin
   ta kendisiydi (UI-ADR-178). */
const demoScreens = screens.filter((f) => {
  const b = beyanEdilenDurumlar(readFileSync(f, "utf8"));
  return b.tur !== "yok";
});

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
      const sonuc = beyanEdilenDurumlar(
        readFileSync(join(process.cwd(), rel), "utf8")
      );

      /* ÇÖZÜLEMEYEN TİP KIRMIZIDIR — UI-ADR-178 (denetim 2/2).
         Önce sessizce boş dönüyordu ve ben bunu "güvenli yön" diye
         yazmıştım. Değildi: ekran matristen düşüyor, hiçbir story
         istenmiyor ve KİMSE FARK ETMİYOR — bu oturumda kapattığım her
         sessiz muafiyetin aynısı. Kural üç dallı ve net:
           `demo` yok            → ekran bu matrise tabi değil
           `demo` var, çözülüyor → beyan edilen durumlar istenir
           `demo` var, çözülmüyor → KIRMIZI: ya tipi basitleştir ya kapıyı güncelle */
      expect(
        sonuc.tur,
        `${rel}: ${sonuc.tur === "cozulemedi" ? sonuc.neden : ""} — kapı bu ` +
          `tipten hangi durum story'lerini isteyeceğini ÇIKARAMIYOR. Sessizce ` +
          `muaf tutmak yerine kırmızı veriyor: tipi doğrudan yaz ` +
          `(\`demo?: DemoState\` ya da \`demo?: "loading"\`) veya ayrıştırıcıyı güncelle.`
      ).toBe("durumlar");

      const beyan = sonuc.tur === "durumlar" ? sonuc.durumlar : [];

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

/* --------------------------------------------------------------------------
   AYRIŞTIRICININ KENDİ TESTİ — UI-ADR-178
   -------------------------------------------------------------------------- */

/**
 * Bu oturumun en pahalı dersi: **kuralın kendi testi, kuralın kendisinden
 * önemlidir.** Ayrıştırıcı bu kapıda DÖRT kez yanıldı ve üçünü yalnız
 * bağımsız denetim gördü; artık her kaçak burada kilitli.
 */
describe("beyanEdilenDurumlar — ayrıştırıcı (UI-ADR-177 → 178)", () => {
  const S = (govde: string) =>
    `export function Ekran({ demo }: { ${govde} }) { return null; }`;

  it("`DemoState` → üç durum", () => {
    expect(beyanEdilenDurumlar(S("demo?: DemoState;"))).toEqual({
      tur: "durumlar",
      durumlar: ["loading", "empty", "error"],
    });
  });

  it.each([`demo?: "loading";`, `demo?: 'loading';`])(
    "tek durum beyanı (%s) → yalnız o",
    (govde) => {
      expect(beyanEdilenDurumlar(S(govde))).toEqual({
        tur: "durumlar",
        durumlar: ["loading"],
      });
    }
  );

  it("çok satırlı union", () => {
    const r = beyanEdilenDurumlar(S(`demo?:
    | "loading"
    | "empty";`));
    expect(r).toEqual({ tur: "durumlar", durumlar: ["loading", "empty"] });
  });

  it("`demo` yoksa ekran bu matrise TABİ DEĞİL", () => {
    expect(beyanEdilenDurumlar(S("baska?: string;"))).toEqual({ tur: "yok" });
  });

  /* ⬇️ DÖRT KAÇAK — hepsi bağımsız denetimde bulundu, hepsi burada kilitli. */

  it("KAÇAK 1 — yorumdaki ÖRNEK gerçek beyan sanılmaz", () => {
    const kaynak = `/** ornek: demo?: DemoState */
` + S(`demo?: "loading";`);
    expect(beyanEdilenDurumlar(kaynak)).toEqual({
      tur: "durumlar",
      durumlar: ["loading"],
    });
  });

  it("KAÇAK 2 — YARDIMCI bileşenin props'u önce gelse bile EXPORT edilen okunur", () => {
    const kaynak =
      `function Yardimci({ demo }: { demo?: "error" }) { return null; }
` +
      S(`demo?: "loading";`);
    expect(beyanEdilenDurumlar(kaynak)).toEqual({
      tur: "durumlar",
      durumlar: ["loading"],
    });
  });

  it("KAÇAK 3 — ÇÖZÜLEMEYEN tip SESSİZ MUAFİYET değil, KIRMIZI", () => {
    const kaynak = `type P = { demo?: "loading" };
` + S(`demo?: P["demo"];`);
    const r = beyanEdilenDurumlar(kaynak);
    expect(r.tur).toBe("cozulemedi");
  });

  it("KAÇAK 4 — YEREL `DemoState` gölgelemesi gerçek tipi verir", () => {
    const kaynak = `type DemoState = "loading";
` + S("demo?: DemoState;");
    expect(beyanEdilenDurumlar(kaynak)).toEqual({
      tur: "durumlar",
      durumlar: ["loading"],
    });
  });
});
