/**
 * ENVANTER KAPISI — UI-ADR-140 (sahip kararı).
 *
 * Dokuz bileşenin hiçbir ekran tüketicisi yok (`ui/chart` · `ui/modal` ·
 * `ui/tabs` · `ui/tooltip` · `ui/filter` · `ui/icon` · `ui/avatar` ·
 * `ui/sparkline` · `executive/telemetry-bar`). Sahip bunların **tasarım
 * sistemi envanteri olarak kalmasına** karar verdi — silinmiyorlar.
 *
 * Bu kapı o kararı YAŞATIR. "Envanter" bir etikettir; etiket tek başına
 * ölü kodu meşrulaştırır. Onu dürüst tutan tek şey, bileşenin GÖRÜLEBİLİR
 * ve ÇALIŞTIRILABİLİR olmasıdır: hikâyesi olan bir bileşen Storybook'ta
 * render edilir, addon-a11y ile taranır ve test paketinde koşar.
 * Hikâyesi olmayan ve çağıranı da olmayan bir dosya envanter değildir —
 * hiç kimsenin bakmadığı koddur.
 *
 * KURAL (iki kollu):
 *   1. **Çağıranı yoksa hikâyesi olacak.**
 *   2. **O hikâye bir DAVRANIŞ kanıtlayacak** (en az bir `play`) —
 *      UI-ADR-142'de eklendi, gerekçesi aşağıda.
 *
 * Bu kural KASITLI OLARAK DAR: çağıranı OLAN bileşen için hikâye zorunlu
 * değildir. Burada kilitlenen şey yalnızca envanter kararının bedelidir.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "src");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
  );
}

const all = walk(SRC).filter((f) => /\.tsx?$/.test(f));
const isStory = (f: string) => f.endsWith(".stories.tsx");
const isTest = (f: string) => /\.test\.tsx?$/.test(f);

/** `src/components/ui/badge.tsx` → `components/ui/badge` */
const moduleId = (f: string) =>
  f.slice(SRC.length + 1).replace(/\\/g, "/").replace(/\.tsx?$/, "");

/** Bir dosyanın import ettiği yerel modül kimlikleri. */
function importsOf(file: string): string[] {
  const body = readFileSync(file, "utf8");
  const dir = moduleId(file).split("/").slice(0, -1);
  return [...body.matchAll(/from\s+"([^"]+)"/g)].flatMap(([, spec]) => {
    if (spec.startsWith("@/")) return [spec.slice(2)];
    if (spec.startsWith("./")) return [[...dir, spec.slice(2)].join("/")];
    if (spec.startsWith("../")) {
      const up = spec.match(/^(\.\.\/)+/)![0].length / 3;
      return [[...dir.slice(0, dir.length - up), spec.replace(/^(\.\.\/)+/, "")].join("/")];
    }
    return [];
  });
}

/* `.fixtures.` hariç: hikâye verisi bir bileşen değildir, tüketicisinin
   yalnız hikâyeler olması onun DOĞRU hâlidir. */
const components = all.filter(
  (f) =>
    /[\\/]components[\\/]/.test(f) &&
    !isStory(f) &&
    !isTest(f) &&
    !f.includes(".fixtures.")
);

/* Hikâyeler ve testler TÜKETİCİ SAYILMAZ: bir bileşeni yalnız kendi
   hikâyesinin import etmesi, onun kullanıldığı anlamına gelmez. */
const productionImports = new Set(
  all.filter((f) => !isStory(f) && !isTest(f)).flatMap(importsOf)
);

describe("envanter kapısı — çağıranı yoksa hikâyesi olacak (UI-ADR-140)", () => {
  const orphans = components.filter((f) => {
    const id = moduleId(f);
    return ![...productionImports].some((i) => i === id);
  });

  /** Bir modülü import eden hikâye dosyaları. */
  const storiesFor = (id: string) =>
    all.filter(isStory).filter((f) => importsOf(f).includes(id));

  it.each(orphans.map((f) => moduleId(f)))(
    "%s — ekran tüketicisi yok, o hâlde hikâyesi olmalı",
    (id) => {
      expect(
        storiesFor(id).length > 0,
        `${id} ne bir ekrandan çağrılıyor ne de bir hikâyesi var. ` +
          `Envanter kararı (UI-ADR-140) GÖRÜLEBİLİR bileşenler içindir; ` +
          `hikâye yaz ya da dosyayı sil.`
      ).toBe(true);
    }
  );

  /**
   * KAPININ AÇIĞI — UI-ADR-142 (gavadolar 2/2 buldu).
   *
   * "Hikâyesi var" yetmez: yalnız render eden bir story kapıyı BİÇİMSEL
   * olarak geçer ama hiçbir davranış kanıtlamaz. O hâlde etiket yine tek
   * başına ölü kodu meşrulaştırır — UI-ADR-140'ın engellemek için var
   * olduğu şeyin ta kendisi.
   *
   * Ölçüldü: kapı yazıldığında envanterdeki DOKUZ bileşenin YEDİSİNİN
   * hikâyesinde hiç `play` yoktu.
   *
   * Asgari koşul: en az bir `play` — yani bileşenin kamu davranışına dair
   * en az bir iddia.
   */
  it.each(orphans.map((f) => moduleId(f)))(
    "%s — hikâyesi bir DAVRANIŞ kanıtlamalı (en az bir `play`)",
    (id) => {
      const withPlay = storiesFor(id).filter((f) =>
        /\bplay\s*:/.test(readFileSync(f, "utf8"))
      );
      expect(
        withPlay.length > 0,
        `${id} için hikâye var ama hiçbirinde \`play\` yok — yalnız render ` +
          `ediyor. Envanter kararı (UI-ADR-140) DAVRANIŞI kanıtlanmış ` +
          `bileşenler içindir; bir sözleşme iddiası yaz ya da dosyayı sil.`
      ).toBe(true);
    }
  );

  it("envanter listesi beklenenden BÜYÜMEDİ", () => {
    /* Sayı bir tavan, bir hedef değil. Büyüdüyse yeni bir bileşen
       çağıranı olmadan girmiş demektir — sahip kararı dokuz kalem
       içindi, açık uçlu bir izin değil. */
    expect(orphans.map(moduleId).sort()).toMatchInlineSnapshot(`
      [
        "components/executive/telemetry-bar",
        "components/ui/avatar",
        "components/ui/chart",
        "components/ui/filter",
        "components/ui/icon",
        "components/ui/modal",
        "components/ui/sparkline",
        "components/ui/tabs",
        "components/ui/tooltip",
      ]
    `);
  });
});
