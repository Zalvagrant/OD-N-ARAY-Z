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
 * ponytail: kapı dosyayı METİN olarak tarıyor, AST kurmuyor. Yeni bir
 * ekran eklendiğinde ya da bir `play` silindiğinde düşer; bu yeterli.
 * Story'nin İÇERİĞİNİN doğruluğunu `play`in kendisi doğrular.
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

      for (const s of STATES) {
        expect(
          s.demo.test(src),
          `${rel}: "${s.key}" durumunun story'si yok. Ekran o durumu ` +
            `çizebiliyor ama ne gösterdiğini kimse kanıtlamıyor.`
        ).toBe(true);
      }

      /* Üç durum story'sinin ÜÇÜNDE de `play` olmalı. Sayı karşılaştırması
         yeterli: dosyada üç `demo=` var ve en az üç `play:` varsa hiçbiri
         çıplak kalmamıştır. */
      const playSayisi = (src.match(/^\s*play:/gm) ?? []).length;
      expect(
        playSayisi,
        `${rel}: durum story'lerinde ${playSayisi} adet play var, en az 3 ` +
          `olmalı. Yalnız render eden bir durum story'si ekranın o durumda ` +
          `ne gösterdiğini KANITLAMAZ (UI-ADR-150 ile aynı kural).`
      ).toBeGreaterThanOrEqual(STATES.length);
    }
  );
});
