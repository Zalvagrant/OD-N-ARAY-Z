/**
 * `/api/state.timeline` adaptörü — GERÇEK ODIN yüküne karşı (UI-ADR-193).
 *
 * `api-state-timeline.json` çalışan cockpit'ten (`GET /api/state`,
 * 2 Ağu 2026) doğrudan alındı — `api-state-goals.json` ile aynı gerekçe:
 * elle yazılmış örnek sözleşme kaymasını yakalayamaz.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptTimeline, timelineStateSchema } from "./odin-state";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-state-timeline.json"),
    "utf8"
  )
);

describe("gerçek /api/state.timeline yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => timelineStateSchema.parse(raw)).not.toThrow();
  });

  it("olaylar TimelineItem'a dönüşür — kimlik seq'ten, ad kaydın gerçek adı", () => {
    const parsed = timelineStateSchema.parse(raw);
    const items = adaptTimeline(parsed.timeline ?? []);
    expect(items.length).toBeGreaterThan(0);
    for (const [i, item] of items.entries()) {
      const kaynak = (parsed.timeline ?? [])[i];
      expect(item.id).toBe(String(kaynak.seq));
      expect(item.title).toBe(kaynak.event);
      expect(item.at).toBe(kaynak.ts);
      expect(item.actor).toBe(kaynak.actor);
    }
  });

  it("API sırası korunur — arayüz yeniden sıralamaz (UI-ADR-111)", () => {
    const items = adaptTimeline(timelineStateSchema.parse(raw).timeline ?? []);
    const seqler = items.map((i) => Number(i.id));
    expect([...seqler].sort((a, b) => a - b)).toEqual(seqler);
  });

  it("snake_case alan sızmaz — ts/event yerine at/title", () => {
    const items = adaptTimeline(timelineStateSchema.parse(raw).timeline ?? []);
    expect(items[0]).toHaveProperty("at");
    expect(items[0]).not.toHaveProperty("ts");
    expect(items[0]).not.toHaveProperty("seq");
  });
});
