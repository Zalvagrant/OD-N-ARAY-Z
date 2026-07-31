/**
 * Release çıktısında mock verisi taraması — S8 (UI-ADR-123).
 *
 * Meclisin teslim şartı: "sahte ekran verisi üretim paketinde HİÇ
 * bulunmamalı." Bu şart bir kez sağlandı ve ÖLÇÜLMEDİĞİ takdirde geri
 * gelir: biri ekrana `import { skusMock } from "@/mocks/amazon"` yazdığı
 * an mock modülü grafiğe geri girer ve kimse fark etmez.
 *
 * Tarama dizeye bakar, import grafiğine değil — çıktının KENDİSİNİ ölçmek,
 * niyeti ölçmekten güvenilirdir.
 *
 * Kullanım: `npm run build:release` bunu derlemeden SONRA çalıştırır.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * ELLE tutulan çekirdek imzalar — S8'den (UI-ADR-123). Korunuyor: bunlar
 * kanıtlanmış yakalayıcılar ve otomatik çıkarım onları kaçırırsa kapı
 * yine de görür.
 */
const SIGNATURES = [
  "SKU-1042",
  "PPC verimliliğini toparla",
  "Kampanya D",
  "CapDome",
  "amazonKpisMock",
  "snapshotMock",
  "feedMock",
  "goalsMock",
  "GOAL-MOCK-STOK",
];

const ROOTS = [".next/static", ".next/server", ".next/standalone"];

/* ---------------------------------------------------------------------
   OTOMATİK İMZA ÇIKARIMI — S10 eki (UI-ADR-126)

   Elle tutulan liste yeni fixture eklendiğinde SESSİZCE eskir ve kapı
   yanlış yeşil yanar; S8'in bulduğu blokajın kökeni tam olarak buydu.
   Bu yüzden imzalar artık fixture dosyalarından da ÇIKARILIYOR: 24+
   karakterlik dize sabitleri, modül yolu görünümlüler elenerek.

   `src/` kesişimi ZORUNLU bir eleme: `"Gross Profit (ücretler hariç)"`
   hem fixture'da hem gerçek üretim kodunda meşru olarak yaşıyor ve onu
   imza saymak kapıyı HER derlemede kırmızı yakardı — her zaman kırmızı
   yanan kapı kapatılır, yani hiç ölçmez.

   Ama eleme SESSİZ OLMAMALI. Düşen imzalar yazdırılıyor: bu görünürlük,
   `src/` altında yaşayan ikinci bir fixture setinin (`stories.fixtures.ts`)
   tek başına düzinelerce imzayı susturabildiğini gösterdi.
   --------------------------------------------------------------------- */

/** Fixture kaynakları — bunların içeriği imza HAVUZUDUR. */
const FIXTURE_FILES = [
  "src/mocks/amazon.ts",
  "src/mocks/briefing.ts",
  "src/mocks/feed.ts",
  "src/mocks/goals.ts",
  "src/components/executive/stories.fixtures.ts",
];

/** Üretim kodu = `src/` altında fixture/story/test OLMAYAN her şey.
 *  Yol ayracı NORMALLENİR: Windows'ta `join()` ters bölü üretir ve
 *  yalnız `/` arayan bir desen `src\mocks\...`i üretim sanardı —
 *  o zaman TÜM fixture dizeleri "üretimde de var" diye elenir ve kapı
 *  otomatik imzaların hemen hepsini sessizce düşürürdü. Ölçüldü: 166. */
const NOT_PRODUCTION = /\.(stories|test|fixtures)\.tsx?$|\/mocks\//;

const LITERAL = /"([^"\\\n]{24,})"|'([^'\\\n]{24,})'/g;
const MODULE_SPECIFIER = /^(@\/|\.{1,2}\/|@?[\w-]+\/)/;

function literalsOf(paths) {
  const out = new Set();
  for (const file of paths) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const m of text.matchAll(LITERAL)) {
      const value = m[1] ?? m[2];
      if (!MODULE_SPECIFIER.test(value)) out.add(value);
    }
  }
  return out;
}

function productionFiles() {
  const out = [];
  for (const file of files("src")) {
    const norm = file.split("\\").join("/");
    if (/\.tsx?$/.test(norm) && !NOT_PRODUCTION.test(norm)) out.push(file);
  }
  return out;
}

const inProduction = literalsOf(productionFiles());
const extracted = [...literalsOf(FIXTURE_FILES)];
const dropped = extracted.filter((v) => inProduction.has(v));
const MARKERS = [...new Set([...SIGNATURES, ...extracted.filter((v) => !inProduction.has(v))])];

function* files(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // derlenmemiş kök — sessizce atla
  }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else yield p;
  }
}

const hits = [];
for (const root of ROOTS) {
  for (const file of files(root)) {
    if (!/\.(js|mjs|json|txt|html)$/.test(file)) continue;
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const sig of MARKERS) {
      if (text.includes(sig)) hits.push(`${file}  ←  "${sig}"`);
    }
  }
}

if (hits.length > 0) {
  console.error(
    `HATA: release paketinde MOCK VERİSİ bulundu (${hits.length} eşleşme).\n` +
      hits.slice(0, 20).map((h) => `  ${h}`).join("\n") +
      `\n\nMuhtemel sebep: bir ekran mock modülünü DOĞRUDAN import ediyor.\n` +
      `Mock erişimi yalnız "@/mocks/registry" üzerinden ve anahtarla olur\n` +
      `(UI-ADR-123); gerçek mod derlemesinde o modül stub'a çözülür.`
  );
  process.exit(1);
}

if (dropped.length > 0) {
  console.log(
    `NOT: ${dropped.length} fixture dizesi üretim kodunda da geçtiği için ` +
      `imza sayılmadı (kapı bunları ARAMAZ):`
  );
  for (const d of dropped.slice(0, 10)) console.log(`  ${JSON.stringify(d.slice(0, 70))}`);
  if (dropped.length > 10) console.log(`  … ve ${dropped.length - 10} tane daha`);
}

console.log(
  `✓ release paketinde mock verisi yok (${MARKERS.length} imza tarandı; ` +
    `${SIGNATURES.length} elle, ${MARKERS.length - SIGNATURES.length} otomatik).`
);
