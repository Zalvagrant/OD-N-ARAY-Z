/** S5 · 18 — MissionBoard */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Mission } from "@/types/screens";
import { MissionBoard } from "./mission-board";
import { ago, envelope } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/18 · MissionBoard",
  parameters: { layout: "padded" },
};
export default meta;

const missions: Mission[] = [
  {
    id: "m1",
    title: "PPC verimliliğini toparla",
    objective: "ACOS'u %16 altına indirmek",
    status: "active",
    progressPercent: 42,
    ownerDirector: "Amazon AI",
    deadline: ago(-9 * 24 * 60 * 60_000),
  },
  {
    id: "m2",
    title: "SKU-1042 tükenmesini önle",
    objective: "Stoksuz gün sayısını sıfırda tutmak",
    status: "blocked",
    progressPercent: 15,
    ownerDirector: "Amazon AI",
    deadline: ago(-3 * 24 * 60 * 60_000),
    blockedReason: "Tedarik kararı onay bekliyor",
  },
  {
    /* İlerleme ölçülmüyor → çubuk çizilmez, NoData çıkar. */
    id: "m3",
    title: "Kur riskini sınırla",
    objective: "Birim maliyeti öngörülebilir tutmak",
    status: "active",
    progressPercent: null,
    ownerDirector: "Trading AI",
    deadline: null,
  },
  {
    id: "m4",
    title: "Listeleme kalitesini yükselt",
    objective: "Organik trafiği %10 artırmak",
    status: "planned",
    progressPercent: 0,
    ownerDirector: "Amazon AI",
    deadline: ago(-46 * 24 * 60 * 60_000),
  },
  {
    id: "m5",
    title: "İade politikası güncellemesi",
    objective: "İade oranını %1,4 altına indirmek",
    status: "done",
    progressPercent: 100,
    ownerDirector: "Executive AI",
    deadline: ago(2 * 24 * 60 * 60_000),
  },
];

export const DortSutun: StoryObj = {
  render: () => <MissionBoard env={envelope(missions, { source: "mock" })} />,
};

export const AramaEslesmedi: StoryObj = {
  render: () => (
    <MissionBoard env={envelope(missions, { source: "mock" })} filter="zzz" />
  ),
};

export const GorevYok: StoryObj = {
  render: () => <MissionBoard env={envelope([], { source: "mock" })} />,
};

export const VeriYok: StoryObj = {
  render: () => <MissionBoard env={null} />,
};
