/**
 * MonitoredDecisionsBoard — `/mission-control`'ün ANA odak alanı.
 * Story UI-ADR-150'de yazıldı.
 *
 * ODIN ADR-0143 §4 "Mission" kavramını REDDETTİ; tahta artık uydurulmuş
 * görevlerin değil GERÇEK karar kayıtlarının görünümüdür. 179 satırlık bu
 * bileşen ekranın en ağır yüzeyiydi ve hiçbir testi yoktu.
 *
 * Kilitlenen şey yerleşim değil, İKİ SORU: hangi kayıt tahtaya girer, ve
 * veri yokken ne gösterilir. İkisi de anti-fake sınırıdır.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import type { Decision } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import { decision } from "./stories.fixtures";
import { MonitoredDecisionsBoard } from "./monitored-decisions-board";

const meta: Meta<typeof MonitoredDecisionsBoard> = {
  title: "Executive/MonitoredDecisionsBoard",
  component: MonitoredDecisionsBoard,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof MonitoredDecisionsBoard>;

const META = {
  source: "internal",
  lastUpdated: new Date().toISOString(),
  freshness: "live",
} as const;

const wrap = (data: Decision[]): DataEnvelope<Decision[]> => ({ data, meta: META });

const izlenen: Decision = {
  ...decision,
  id: "d-monitor",
  question: "PPC bütçesi artışı izleniyor",
  status: "monitoring",
  monitoringCheckpoints: ["ACOS 2 hafta sonra", "Gösterim payı haftalık"],
};

/** Vadesi GEÇMİŞ erteleme — tahtaya girer. */
const vadesiGelmis: Decision = {
  ...decision,
  id: "d-due",
  question: "Tedarikçi sözleşmesi yenilensin mi?",
  status: "open",
  humanDecision: { outcome: "deferred", revisitAt: "2020-01-01T00:00:00Z" },
};

/** Vadesi GELECEKTE — tahtaya GİRMEZ. */
const vadesiGelmemis: Decision = {
  ...decision,
  id: "d-future",
  question: "Yeni pazar açılsın mı?",
  status: "open",
  humanDecision: { outcome: "deferred", revisitAt: "2099-01-01T00:00:00Z" },
};

/** Ne izleniyor ne ertelenmiş — tahtaya GİRMEZ. */
const acik: Decision = { ...decision, id: "d-open", question: "Açık karar" };

export const IkiKolonDolu: Story = {
  name: "İzlenen kararlar ve vadesi gelen ertelemeler AYRI kolonlarda",
  args: { env: wrap([izlenen, vadesiGelmis]) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("PPC bütçesi artışı izleniyor")).toBeInTheDocument();
    await expect(
      canvas.getByText("Tedarikçi sözleşmesi yenilensin mi?")
    ).toBeInTheDocument();

    /* Kontrol noktaları KARARIN kendi alanıdır; varsa çizilir. */
    await expect(canvas.getByText(/ACOS 2 hafta sonra/)).toBeInTheDocument();
  },
};

export const IlgisizKayitGIRMEZ: Story = {
  name: "Açık karar ve VADESİ GELMEMİŞ erteleme tahtaya GİRMEZ",
  args: { env: wrap([izlenen, acik, vadesiGelmemis]) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("PPC bütçesi artışı izleniyor")).toBeInTheDocument();

    /* ASIL İDDİA — YOKLUK. Tahta "şu an ilgilenmen gerekenler" demektir.
       Henüz vadesi gelmemiş bir ertelemeyi göstermek, sahibi zamanı
       gelmemiş bir karara çağırmak olurdu; açık kararların yeri ise
       Decision Center'dır. Fazladan gösterilen her satır tahtanın
       anlamını siler. */
    await expect(canvas.queryByText("Açık karar")).toBeNull();
    await expect(canvas.queryByText("Yeni pazar açılsın mı?")).toBeNull();
  },
};

export const BosDurumGerekceli: Story = {
  name: "Uygun kayıt yoksa BOŞ DURUM çizilir — sahte kart üretilmez",
  args: { env: wrap([acik, vadesiGelmemis]) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/İzlenen karar ve vadesi gelen erteleme yok/)
    ).toBeInTheDocument();
    /* Boş durum bir AÇIKLAMA taşır: kullanıcı sistemin bozuk mu yoksa
       gerçekten sakin mi olduğunu bilmeli. */
    await expect(canvas.getByText(/izleme durumunda karar/i)).toBeInTheDocument();
  },
};

export const FiltreEslesmezse: Story = {
  name: "Filtre eşleşmezse AYRI bir boş durum (arama yaptığını söyler)",
  args: { env: wrap([izlenen, vadesiGelmis]), filter: "bulunamayacak-sorgu" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Eşleşen kayıt yok")).toBeInTheDocument();
    /* "Kayıt yok" ile "aramanla eşleşen kayıt yok" AYRI iddialardır;
       ilkini gösterirsek kullanıcı sistemin boş olduğunu sanır. */
    await expect(canvas.getByText(/bulunamayacak-sorgu/)).toBeInTheDocument();
  },
};

export const ZarfYoksaTahtaCizilmez: Story = {
  name: "Zarf YOKSA tahta hiç çizilmez (DataGuard kapısı)",
  args: { env: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("Karar verisi yok")).toBeInTheDocument();
    /* Kolon başlıkları bile çizilmemeli: boş bir "İzlenen kararlar 0"
       başlığı bir ÖLÇÜMDÜR ve kaynak bağlı değilken yanlıştır. */
    await expect(canvas.queryByText("İzlenen kararlar")).toBeNull();
  },
};
