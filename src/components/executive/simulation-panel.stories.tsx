/** S6 · 19 — SimulationPanel */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { simulationsMock } from "@/mocks/amazon";
import { SimulationPanel } from "./simulation-panel";

const meta: Meta = {
  title: "Executive/19 · SimulationPanel",
  parameters: { layout: "padded" },
};
export default meta;

const base = simulationsMock();

/**
 * Kaynak mock olduğu için başlıkta "SİMÜLASYON — MOCK" yazar.
 * Üçüncü senaryonun varsayımı yoktur → gösterilmez, elendiği altta yazılır.
 * İstemci hiçbir sayı hesaplamaz (UI-ADR-100).
 */
export const HazirSenaryolar: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <SimulationPanel env={base} />
    </div>
  ),
};

/** Varsayımı bildirilmeyen tek senaryo → panel boş durum gösterir. */
export const VarsayimYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <SimulationPanel
        env={{
          data: [
            {
              request: { parameter: "ppc_budget", changePercent: 25 },
              result: {
                scenarios: [{ metric: "Satış", expectedChange: "+%14" }],
                confidence: 55,
                assumptions: [],
              },
            },
          ],
          meta: base.meta,
        }}
      />
    </div>
  ),
};

export const MotorYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <SimulationPanel env={{ data: [], meta: base.meta }} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <SimulationPanel env={null} />,
};
