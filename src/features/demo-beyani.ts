/**
 * Ekranın `demo` prop'undan BEYAN ETTİĞİ durumları çözer — UI-ADR-179.
 *
 * ⚠️ BU DOSYA BİR KAPININ PARÇASI ve dört turda dört kez yanıldı. Kısa
 * tarihi, çünkü her turu bir sonraki okuyucunun bilmesi gerekiyor:
 *
 *   UI-ADR-174  regex — JSDoc'taki ÖRNEĞİ gerçek beyan sandı
 *   UI-ADR-175  regex — tek tırnak · çok satırlı union · `DemoStateish`
 *   UI-ADR-177  AST'ye geçti — yorum/dizge sınıfı yapısal olarak kapandı
 *   UI-ADR-178  üç kusur: sessiz muafiyet · yanlış prop · yerel gölgeleme
 *   UI-ADR-179  (burası) — KISITLI DİLBİLGİSİ + özyinelemeli çözücü
 *
 * Dördüncü turda `ask_yazilimcilar` **4/4** cevap verdi ve teşhis şuydu:
 * ayrıştırıcı **her şeyi anlamaya çalışıyor** ve anlamadığında sessizce
 * bir şey uyduruyordu. Doğrusu tersi — **DAR bir dilbilgisi tanı, geri
 * kalan her şeye KIRMIZI de.**
 *
 * TANINAN DİLBİLGİSİ (hepsi bu):
 *   · `"loading"` gibi dize literali
 *   · `A | B` union · `(A)` parantez · `A | undefined`
 *   · YEREL `type X = …` alias (özyinelemeli, döngü KIRMIZI)
 *   · TEK HOP import edilen alias — dosya okunur ve orada çözülür
 *
 * Geri kalan HER ŞEY kırmızı: `Props["demo"]` (alias arkasına saklansa
 * bile), koşullu tip, generic, `any`, şablon literal, nesne tipi.
 *
 * ⚠️ EN ÖNEMLİ DEĞİŞİKLİK — `DemoState` YEDEĞİ KALDIRILDI.
 * Önce şöyleydi: *"referans `DemoState` adını taşıyorsa üç durum
 * varsay."* terra bunu **kanıtsız iddia** diye işaretledi ve haklı:
 * çözülemeyen bir tip için üç durum İDDİA ETMEK, bu reponun 2 numaralı
 * kuralının (karşılığı olmayan gösterge çizilmez) test tarafındaki
 * ihlalidir. Artık import GERÇEKTEN okunuyor — iddia ölçüme dayanıyor.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const DURUMLAR = ["loading", "empty", "error"] as const;
export type Durum = (typeof DURUMLAR)[number];

export type BeyanSonucu =
  | { tur: "durumlar"; durumlar: Durum[] }
  | { tur: "yok" }
  | { tur: "cozulemedi"; neden: string };

const kirmizi = (neden: string): BeyanSonucu => ({ tur: "cozulemedi", neden });

/** Bir tipin çözüldüğü DOSYA bağlamı — dosya sınırı geçilince taşınır. */
type Baglam = {
  dosya: ts.SourceFile;
  dosyaYolu: string;
  yerel: Map<string, ts.TypeNode>;
};
type Hedef = { tip: ts.TypeNode; baglam: Baglam };

function ayrıştır(kaynak: string, ad = "x.tsx"): ts.SourceFile {
  return ts.createSourceFile(ad, kaynak, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

/** Bir dosyadaki `type X = …` bildirimleri. */
function aliaslar(dosya: ts.SourceFile): Map<string, ts.TypeNode> {
  const m = new Map<string, ts.TypeNode>();
  for (const st of dosya.statements) {
    if (ts.isTypeAliasDeclaration(st)) m.set(st.name.text, st.type);
  }
  return m;
}

/**
 * `import { type X } from "..."` → o dosyadaki alias'ı getirir. TEK HOP.
 *
 * Bunun VAR OLMA sebebi: eskiden import edilen `DemoState` için üç durum
 * "varsayılıyordu". Varsaymak yerine okuyoruz; bulunamazsa KIRMIZI.
 */
function importtanAlias(b: Baglam, ad: string): Hedef | undefined {
  for (const st of b.dosya.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
    const isimler = st.importClause?.namedBindings;
    if (!isimler || !ts.isNamedImports(isimler)) continue;

    /* TAKMA AD — `import { type X as Y }`: YEREL ad `Y`, UZAK ad `X`.
       Eskiden yerel adı uzakta arıyordum ve hedef dosyada `Y` diye bir
       alias olmadığı için sessizce "çözülemedi" diyordu (denetim 3/4).
       Ölçüldü: `import type { X }` biçimi ZATEN yakalanıyordu — kurulun
       o kısmı deneyle çürüdü, ama takma ad gerçek bir kusurdu. */
    const oge = isimler.elements.find((e) => e.name.text === ad);
    if (!oge) continue;
    const uzakAd = oge.propertyName?.text ?? oge.name.text;

    const spec = st.moduleSpecifier.text;
    const temel = spec.startsWith("@/")
      ? join(process.cwd(), "src", spec.slice(2))
      : resolve(dirname(b.dosyaYolu), spec);

    for (const uzanti of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
      const yol = temel + uzanti;
      if (!existsSync(yol)) continue;
      const hedefDosya = ayrıştır(readFileSync(yol, "utf8"), yol);
      const tip = aliaslar(hedefDosya).get(uzakAd);
      if (!tip) return undefined;
      /* ⚠️ BAĞLAM DA TAŞINIR — UI-ADR-180 (denetim 3/3 aynı bulgu).
         Eskiden yalnız `TypeNode` dönüyordu ve özyineleme ÇAĞIRAN
         dosyanın alias haritasıyla devam ediyordu: import edilen tipin
         gövdesindeki bir referans YANLIŞ dosyada aranırdı — ya sessizce
         "çözülemedi" ya da aynı adlı BAŞKA bir tip. */
      return { tip, baglam: { dosya: hedefDosya, dosyaYolu: yol, yerel: aliaslar(hedefDosya) } };
    }
  }
  return undefined;
}

/**
 * KISITLI DİLBİLGİSİ ÇÖZÜCÜSÜ. Tanımadığı her şeye kırmızı der.
 *
 * `gorulen` döngü koruması: `type A = B; type B = A` sonsuz döngü yerine
 * kırmızı verir (denetim bulgusu).
 */
function cozumle(
  t: ts.TypeNode,
  b: Baglam,
  gorulen: Set<string>
): { ok: true; lit: string[] } | { ok: false; neden: string } {
  const dosya = b.dosya;
  if (ts.isParenthesizedTypeNode(t)) return cozumle(t.type, b, gorulen);

  if (ts.isLiteralTypeNode(t)) {
    if (ts.isStringLiteral(t.literal)) return { ok: true, lit: [t.literal.text] };
    return { ok: false, neden: `dize olmayan literal: ${t.getText(dosya)}` };
  }

  /* `A | undefined` meşru; `undefined` bir DURUM değil, yokluğudur. */
  if (t.kind === ts.SyntaxKind.UndefinedKeyword) return { ok: true, lit: [] };

  if (ts.isUnionTypeNode(t)) {
    const hepsi: string[] = [];
    for (const alt of t.types) {
      const r = cozumle(alt, b, gorulen);
      if (!r.ok) return r;
      hepsi.push(...r.lit);
    }
    return { ok: true, lit: hepsi };
  }

  if (ts.isTypeReferenceNode(t)) {
    /* Generic (`Partial<X>`) tanınmaz — sessizce boş dönmek yerine kırmızı. */
    if (t.typeArguments?.length) {
      return { ok: false, neden: `generic tip: ${t.getText(dosya)}` };
    }
    /* `A.B` gibi nitelikli ad desteklenmiyor — sessizce "çözülemedi"
       demek yerine ADIYLA söylenir (denetim bulgusu). */
    if (!ts.isIdentifier(t.typeName)) {
      return { ok: false, neden: `nitelikli tip referansı: ${t.getText(dosya)}` };
    }
    const ad = t.typeName.text;

    const yerelTip = b.yerel.get(ad);
    const hedef: Hedef | undefined = yerelTip
      ? { tip: yerelTip, baglam: b }
      : importtanAlias(b, ad);
    if (!hedef) {
      return {
        ok: false,
        neden: `\`${ad}\` çözülemedi — ne yerel alias ne de tek-hop import`,
      };
    }

    /* ⚠️ ANAHTAR DOSYA+KONUM, yalnız AD DEĞİL — UI-ADR-180.
       Ada göre anahtarlamak İKİ yanlış üretiyordu: (1) iki farklı
       dosyadaki aynı adlı alias "döngüsel" sanılıyordu; (2) küme hiç
       temizlenmediği için aynı alias'ı bir union'ın İKİ kolunda
       kullanmak da döngü sayılıyordu. Anahtar artık benzersiz ve küme
       yalnız AKTİF ZİNCİRİ tutuyor (`finally` ile geri alınıyor). */
    const anahtar = `${hedef.baglam.dosyaYolu}:${hedef.tip.pos}`;
    if (gorulen.has(anahtar)) return { ok: false, neden: `döngüsel tip: ${ad}` };
    gorulen.add(anahtar);
    try {
      return cozumle(hedef.tip, hedef.baglam, gorulen);
    } finally {
      gorulen.delete(anahtar);
    }
  }

  /* `Props["demo"]` · koşullu · eşlemeli · nesne · şablon literal · any …
     ALIAS ARKASINA SAKLANSA BİLE buraya düşer, çünkü özyineleme
     hedefi de bu fonksiyondan geçer (denetim bulgusu). */
  return { ok: false, neden: `tanınmayan tip: ${t.getText(dosya).replace(/\s+/g, " ")}` };
}

/** Bir parametre tipinin ÜST SEVİYE `demo` özelliği (iç içe olan sayılmaz). */
function ustSeviyeDemo(t: ts.TypeNode, dosya: ts.SourceFile): ts.TypeNode | undefined {
  if (!ts.isTypeLiteralNode(t)) return undefined;
  for (const uye of t.members) {
    if (
      ts.isPropertySignature(uye) &&
      uye.name.getText(dosya) === "demo" &&
      uye.questionToken &&
      uye.type
    ) {
      return uye.type;
    }
  }
  return undefined;
}

/** Export edilen çağrılabilir bileşenlerin ilk parametre tipleri. */
function exportluParametreler(
  dosya: ts.SourceFile
): { tipler: (ts.TypeNode | undefined)[]; callableVar: boolean } {
  const tipler: (ts.TypeNode | undefined)[] = [];
  let callableVar = false;

  for (const st of dosya.statements) {
    const disaAcik =
      ts.canHaveModifiers(st) &&
      ts.getModifiers(st)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!disaAcik) continue;

    if (ts.isFunctionDeclaration(st)) {
      callableVar = true;
      tipler.push(st.parameters[0]?.type);
      continue;
    }
    /* `export const X = (…) => …` — eskiden HİÇ görülmüyordu ve o ekran
       sessizce matristen düşerdi (denetim 4/4). */
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (d.initializer && ts.isArrowFunction(d.initializer)) {
          callableVar = true;
          tipler.push(d.initializer.parameters[0]?.type);
        }
      }
    }
  }
  return { tipler, callableVar };
}

export function beyanEdilenDurumlar(kaynak: string, dosyaYolu = "screen.tsx"): BeyanSonucu {
  const dosya = ayrıştır(kaynak, dosyaYolu);
  const { tipler, callableVar } = exportluParametreler(dosya);

  if (!callableVar) {
    return kirmizi("export edilen çağrılabilir bileşen bulunamadı");
  }

  const yerel = aliaslar(dosya);
  const bulunanlar: ts.TypeNode[] = [];
  for (const pt of tipler) {
    if (!pt) continue;
    const d = ustSeviyeDemo(pt, dosya);
    if (d) bulunanlar.push(d);
  }

  if (bulunanlar.length === 0) return { tur: "yok" };
  /* İki export'ta birden `demo` varsa hangisinin ekran olduğu BELİRSİZDİR
     — "ilkini al" sessiz bir tahmindir (denetim bulgusu). */
  if (bulunanlar.length > 1) {
    return kirmizi(`${bulunanlar.length} export edilen bileşende \`demo\` var — belirsiz`);
  }

  const r = cozumle(bulunanlar[0], { dosya, dosyaYolu, yerel }, new Set());
  if (!r.ok) return kirmizi(r.neden);

  const benzersiz = [...new Set(r.lit)];
  const bilinmeyen = benzersiz.filter(
    (x) => !(DURUMLAR as readonly string[]).includes(x)
  );
  if (bilinmeyen.length > 0) {
    return kirmizi(`bilinmeyen demo durumu: ${bilinmeyen.join(", ")}`);
  }
  if (benzersiz.length === 0) {
    return kirmizi("`demo` hiçbir durum beyan etmiyor");
  }
  return { tur: "durumlar", durumlar: benzersiz as Durum[] };
}
