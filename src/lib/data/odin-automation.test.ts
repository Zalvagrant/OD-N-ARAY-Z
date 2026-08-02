/**
 * `/api/automation` adaptörü — GERÇEK yüke karşı (UI-ADR-210).
 * Fixture çalışan cockpit'ten (2 Ağu 2026: 21 iş).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { adaptAutomation, automationSchema } from "./odin-automation";

const raw = JSON.parse(
  readFileSync(
    join(process.cwd(), "src/lib/data/__fixtures__/api-automation.json"),
    "utf8"
  )
);

describe("gerçek /api/automation yükü", () => {
  it("ham yük adaptörün şemasından geçer", () => {
    expect(() => automationSchema.parse(raw)).not.toThrow();
  });

  it("sayaçlar iş listesiyle tutarlıdır", () => {
    const a = adaptAutomation(automationSchema.parse(raw));
    expect(a.jobs).toHaveLength(a.total);
    expect(a.jobs.filter((j) => j.dueNow)).toHaveLength(a.dueNow);
    expect(a.jobs.filter((j) => j.lastRunAt === null)).toHaveLength(
      a.neverRun
    );
  });

  it("VADE TAŞINIR, HESAPLANMAZ — bayrak çekirdeğin", () => {
    const parsed = automationSchema.parse(raw);
    const zorla = {
      ...parsed,
      jobs: parsed.jobs.map((j) => ({ ...j, due_now: true })),
      due_now: parsed.jobs.length,
    };
    const a = adaptAutomation(zorla);
    /* Son koşumu AZ ÖNCE olan bir iş bile, çekirdek "vadesi geldi"
       diyorsa öyle taşınır. Arayüz zaman aritmetiğiyle itiraz etmez. */
    expect(a.jobs.every((j) => j.dueNow)).toBe(true);
  });

  it("vadesi gelenler listenin başında gelir", () => {
    const a = adaptAutomation(automationSchema.parse(raw));
    const ilkVadesizIndex = a.jobs.findIndex((j) => !j.dueNow);
    if (ilkVadesizIndex >= 0) {
      expect(a.jobs.slice(ilkVadesizIndex).some((j) => j.dueNow)).toBe(false);
    }
  });

  it("her işin tetikleyicisi KENDİ sözlüğüyle taşınır", () => {
    const a = adaptAutomation(automationSchema.parse(raw));
    for (const j of a.jobs) {
      expect(j.trigger.length).toBeGreaterThan(0);
      expect(j.kind.length).toBeGreaterThan(0);
    }
  });

  it("watchdog gözettiği portu bildirir", () => {
    const a = adaptAutomation(automationSchema.parse(raw));
    expect(a.watchdog.cockpitPort).toBeGreaterThan(0);
    expect(typeof a.watchdog.cockpitListening).toBe("boolean");
  });

  it("snake_case sızmaz", () => {
    const a = adaptAutomation(automationSchema.parse(raw));
    expect(JSON.stringify(a)).not.toMatch(
      /due_now|last_run_at|heartbeat_age_s|cockpit_port|autostart_installed/
    );
  });
});
