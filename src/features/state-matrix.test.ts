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
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const FEATURES = join(process.cwd(), "src", "features");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
  );
}

const screens = walk(FEATURES)
  .filter((f) => f.endsWith("screen.tsx"))
  .filter((f) => /demo\?:\s*DemoState/.test(readFileSync(f, "utf8")));

/** Her durum için story adında aranan iz — Türkçe adlar kullanılıyor. */
const STATES = [
  { key: "loading", demo: /demo="loading"/ },
  { key: "empty", demo: /demo="empty"/ },
  { key: "error", demo: /demo="error"/ },
] as const;

describe("ekran durum matrisi kapısı (UI-ADR-151)", () => {
  it("demo durumu olan en az bir ekran var (kapı boşa çalışmıyor)", () => {
    /* Kapının kendisi de körleşebilir: `screen.tsx` adlandırması değişirse
       liste sessizce boşalır ve test hep yeşil kalır. */
    expect(screens.length).toBeGreaterThan(0);
  });

  it.each(screens.map((f) => f.slice(process.cwd().length + 1).replace(/\\/g, "/")))(
    "%s — üç durumun ÜÇÜ de story'li ve her biri bir şey İDDİA EDİYOR",
    (rel) => {
      const storyPath = join(process.cwd(), rel).replace(
        /screen\.tsx$/,
        "screen.stories.tsx"
      );
      const src = readFileSync(storyPath, "utf8");

      /* Dosyayı `export const` sınırlarından bloklara ayır — `play`in
         DOĞRU story'de olduğunu ancak böyle sorabiliriz. */
      const bloklar = src.split(/^export const /m).slice(1);

      for (const s of STATES) {
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
      }
    }
  );
});
