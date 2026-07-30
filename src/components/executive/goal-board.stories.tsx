/** S5 · 18 — GoalBoard (eski MissionBoard; ODIN ADR-0132 · UI-ADR-107) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Goal } from "@/types/screens";
import { GoalBoard } from "./goal-board";
import { envelope } from "./stories.fixtures";

const meta: Meta = {
  title: "Executive/18 · GoalBoard",
  parameters: { layout: "padded" },
};
export default meta;

/* Kolonlar ODIN'in GERÇEK `level` alanından türer; icat edilmiş status
   kanban'ı yok. Kaynaksız alanlar (termin, sorumlu, engel) sözleşmede yok. */
const goals: Goal[] = [
  {
    id: "g1",
    level: "urgent",
    label: "PPC verimliliğini toparla",
    target: "ACOS 30 gün içinde %16 altına",
    progressPct: 42,
  },
  {
    id: "g2",
    level: "urgent",
    label: "SKU-1042 tükenmesini önle",
    target: "Stoksuz gün sayısı 0",
    progressPct: 15,
  },
  {
    /* İlerleme ölçülmüyor → çubuk çizilmez, NoData çıkar. Nötr 50 buraya
       asla yazılmaz (ADR-0132 tuzağı). */
    id: "g3",
    level: "quarter",
    label: "Kur riskini sınırla",
    target: "Birim maliyet öngörülebilir",
    progressPct: null,
  },
  {
    id: "g4",
    level: "quarter",
    label: "Listeleme kalitesini yükselt",
    target: "Organik trafik +%10",
    progressPct: 0,
  },
  {
    /* Hedef ifadesi yayınlanmamış → satır çizilmez, uydurulmaz. */
    id: "g5",
    level: "annual",
    label: "İade politikası güncellemesi",
    target: null,
    progressPct: 100,
  },
];

export const SeviyeKolonlari: StoryObj = {
  render: () => <GoalBoard env={envelope(goals, { source: "mock" })} />,
};

export const AramaEslesmedi: StoryObj = {
  render: () => (
    <GoalBoard env={envelope(goals, { source: "mock" })} filter="zzz" />
  ),
};

export const HedefYok: StoryObj = {
  render: () => <GoalBoard env={envelope([], { source: "mock" })} />,
};

export const VeriYok: StoryObj = {
  render: () => <GoalBoard env={null} />,
};
