/**
 * `/api/config` adaptörü — GERÇEK yüke karşı (UI-ADR-211).
 * Fixture çalışan cockpit'ten (2 Ağu 2026).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptSettings, adaptVersion, configSchema } from "./odin-config";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-config.json"),
    "utf8"
  )
);

describe("gerçek /api/config yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => configSchema.parse(raw)).not.toThrow();
  });

  it("İKİ EKRAN AYNI YÜKTEN beslenir", () => {
    const parsed = configSchema.parse(raw);
    const v = adaptVersion(parsed);
    const s = adaptSettings(parsed);
    /* Aynı ölçüm pası: sürüm ekranı ile ayar ekranı farklı bir kurulumu
       anlatamaz. */
    expect(v.odin).toBeTruthy();
    expect(s.cockpitPort).toBeGreaterThan(0);
  });

  it("SETTINGS YAZILABİLİR DEĞİL — şema başka bir şeyi kabul etmez", () => {
    const s = adaptSettings(configSchema.parse(raw));
    expect(s.writable).toBe(false);
    expect(s.writableReason.length).toBeGreaterThan(20);
    /* Sözleşme donduruldu: yazılabilir bir ayar yüzeyi eklemek AYRI bir
       karardır ve şemayı patlatır. */
    expect(() =>
      configSchema.parse({
        ...raw,
        settings: { ...raw.settings, writable: true },
      })
    ).toThrow();
  });

  it("kirli ağaç bayrağı taşınır — arayüz temizlemez", () => {
    const parsed = configSchema.parse(raw);
    expect(adaptVersion(parsed).workingTreeClean).toBe(
      parsed.version.working_tree_clean
    );
    const kirli = adaptVersion({
      ...parsed,
      version: { ...parsed.version, working_tree_clean: false },
    });
    expect(kirli.workingTreeClean).toBe(false);
  });

  it("git olmayan bir kopyada commit null olur, uydurulmaz", () => {
    const parsed = configSchema.parse(raw);
    const gitsiz = adaptVersion({
      ...parsed,
      version: {
        ...parsed.version,
        commit: null,
        branch: null,
        working_tree_clean: null,
      },
    });
    expect(gitsiz.commit).toBeNull();
    expect(gitsiz.workingTreeClean).toBeNull();
  });

  it("ortam değişkenleri set olup olmadıklarını bildirir", () => {
    const s = adaptSettings(configSchema.parse(raw));
    expect(s.envOverrides.length).toBeGreaterThan(0);
    for (const e of s.envOverrides) {
      expect(typeof e.set).toBe("boolean");
      if (!e.set) expect(e.value).toBeNull();
    }
  });

  it("snake_case sızmaz", () => {
    const parsed = configSchema.parse(raw);
    expect(JSON.stringify(adaptVersion(parsed))).not.toMatch(
      /working_tree_clean|adr_count|committed_at/
    );
    expect(JSON.stringify(adaptSettings(parsed))).not.toMatch(
      /writable_reason|data_dir|cockpit_port|env_overrides/
    );
  });
});
