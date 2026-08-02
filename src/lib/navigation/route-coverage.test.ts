/**
 * NAVİGASYON KAPSAMA KAPISI — UI-ADR-214.
 *
 * NEDEN VAR: `NAV_GROUPS`a bir hedef eklemek BEDAVAYDI. Ekran yazılmasa
 * bile rota 200 döner — `[[...slug]]` yakalayıcısı devreye girer ve
 * "Bu ekran henüz üretilmedi" basar. Yani menü büyüyebilir, ürün
 * büyümez ve HİÇBİR KAPI ses çıkarmaz.
 *
 * Bu, bu operasyonun kapattığı 18 boş hedefin nasıl birikebildiğinin
 * tam açıklaması: her biri tek tek eklendi, hiçbiri bir testi kırmadı.
 *
 * Kapı iki yönlü:
 *   1. Menüdeki HER hedefin `app/(shell)/…/page.tsx` dosyası olacak.
 *   2. Yazılmış HER sayfa menüde bir yere bağlı olacak — erişilemeyen
 *      bir ekran da bir kusurdur (yazıldı, kimse göremiyor).
 *
 * `[[...slug]]` yakalayıcısı KASITLI olarak kapsam dışı: o bir ekran
 * değil, 404 ile menü-dışı yolları ayıran bir yönlendiricidir.
 */

import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { NAV_GROUPS } from "./registry";

const APP = join(process.cwd(), "src", "app", "(shell)");

/** Menüdeki tüm hedefler (üst öğeler + alt öğeler). */
const navHedefleri = NAV_GROUPS.flatMap((g) =>
  g.items.flatMap((i) => [i.href, ...(i.children ?? []).map((c) => c.href)])
);

/** `app/(shell)` altındaki gerçek sayfa rotaları. */
function sayfaRotalari(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      // `[[...slug]]` bir ekran değil, yakalayıcı — sayılmaz.
      if (e.name.startsWith("[")) continue;
      out.push(...sayfaRotalari(join(dir, e.name), `${prefix}/${e.name}`));
    } else if (e.name === "page.tsx" && prefix) {
      out.push(prefix);
    }
  }
  return out;
}

describe("navigasyon kapsama kapısı (UI-ADR-214)", () => {
  it("menüdeki HER hedefin bir sayfa dosyası var", () => {
    const eksik = [...new Set(navHedefleri)].filter(
      (href) => !existsSync(join(APP, ...href.split("/").filter(Boolean), "page.tsx"))
    );
    expect(
      eksik,
      `Menüde olup ekranı olmayan hedefler — bunlar yakalayıcıya düşer ve ` +
        `"henüz üretilmedi" basar: ${eksik.join(", ")}`
    ).toEqual([]);
  });

  it("yazılmış HER sayfa menüden erişilebilir", () => {
    const rotalar = sayfaRotalari(APP);
    const erisilemeyen = rotalar.filter((r) => !navHedefleri.includes(r));
    expect(
      erisilemeyen,
      `Ekranı var ama menüde yok — yazıldı, kimse göremiyor: ` +
        `${erisilemeyen.join(", ")}`
    ).toEqual([]);
  });

  it("bugünkü kapsama tam", () => {
    /* Sayı DEĞİŞEBİLİR ve değişmesi normaldir; buradaki iddia bir alt
       sınır değil, o günkü gerçeğin kaydıdır — yukarıdaki iki kural
       zaten eşitliği zorunlu kılıyor. */
    expect(new Set(navHedefleri).size).toBe(sayfaRotalari(APP).length);
  });
});
