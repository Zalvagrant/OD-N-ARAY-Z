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

/** Yalnız mock verisinde geçen, ürün metninde geçmeyen imzalar. */
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

const ROOTS = [".next/static", ".next/server"];

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
    for (const sig of SIGNATURES) {
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

console.log("✓ release paketinde mock verisi yok (9 imza tarandı).");
