/** S3 · 13 — Chart temel seti: Line · Area · Bar (UI-ADR-087) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { AreaChart, BarChart, LineChart, type ChartDatum } from "./chart";
import { Card, CardBody, CardHeader } from "./card";

const REVENUE: ChartDatum[] = [
  { label: "Pzt", value: 12400 },
  { label: "Sal", value: 15800 },
  { label: "Çar", value: 14100 },
  { label: "Per", value: 19600 },
  { label: "Cum", value: 23400 },
  { label: "Cmt", value: 21100 },
  { label: "Paz", value: 17300 },
];

/** Ölçülemeyen gün null'dır — çizgi kesilir, ara değer uydurulmaz. */
const WITH_GAP: ChartDatum[] = [
  { label: "Pzt", value: 3.2 },
  { label: "Sal", value: 4.1 },
  { label: "Çar", value: null },
  { label: "Per", value: 3.8 },
  { label: "Cum", value: 5.0 },
];

const meta: Meta = {
  title: "Core/13 · Chart",
  parameters: { layout: "padded" },
};
export default meta;

export const Line: StoryObj = {
  render: () => (
    <Card className="max-w-xl">
      <CardHeader title="Günlük ciro" description="Fare ya da ← → ile gez" />
      <CardBody>
        <LineChart data={REVENUE} label="Günlük ciro" format="currency" />
      </CardBody>
    </Card>
  ),
};

export const Area: StoryObj = {
  render: () => (
    <Card className="max-w-xl">
      <CardHeader title="Günlük ciro (alan)" />
      <CardBody>
        <AreaChart data={REVENUE} label="Günlük ciro" format="compact" />
      </CardBody>
    </Card>
  ),
};

export const Bar: StoryObj = {
  render: () => (
    <Card className="max-w-xl">
      <CardHeader title="Kampanya harcaması" />
      <CardBody>
        <BarChart data={REVENUE} label="Kampanya harcaması" format="compact" />
      </CardBody>
    </Card>
  ),
};

export const WithMissingPoint: StoryObj = {
  render: () => (
    <Card className="max-w-xl">
      <CardHeader
        title="ACOS"
        description="Çarşamba ölçülemedi — çizgi kesiliyor, interpolasyon YOK"
      />
      <CardBody>
        <LineChart data={WITH_GAP} label="ACOS" />
      </CardBody>
    </Card>
  ),
};

export const NoData: StoryObj = {
  render: () => (
    <Card className="max-w-xl">
      <CardHeader title="PPC harcaması" />
      <CardBody>
        <LineChart
          data={[]}
          label="PPC harcaması"
          emptyDescription="Amazon Ads API bağlı değil; bu grafiğin kaynağı yok."
        />
      </CardBody>
    </Card>
  ),
};

export const Loading: StoryObj = {
  render: () => (
    <Card className="max-w-xl">
      <CardHeader title="Günlük ciro" />
      <CardBody>
        <LineChart data={[]} label="Günlük ciro" loading />
      </CardBody>
    </Card>
  ),
};

/**
 * UI-ADR-142 — envanter kapısının davranış koşulu.
 *
 * Grafiğin tek gerçek anti-fake kuralı: **ölçülemeyen nokta `null`dır ve
 * 0 ile karıştırılmaz.** Bir grafikte 0, "ölçtük ve sıfır çıktı" demektir;
 * eksik günü sıfır çizmek uydurulmuş bir ölçümdür ve grafikte özellikle
 * tehlikelidir çünkü göz onu bir DÜŞÜŞ olarak okur.
 */
export const EksikNoktaSIFIR_DEGILDIR: StoryObj = {
  name: "Ölçülemeyen nokta 0 olarak çizilmez — çizgi KESİLİR",
  render: () => <LineChart data={WITH_GAP} label="ACOS" height={160} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "ACOS" })).toBeInTheDocument();

    /* ASIL DEĞİŞMEZ yolun `d` niteliğindedir: `toLinePath` bir `null`
       gördüğünde KALEMİ KALDIRIR ve yeni bir `M` yazar. Yani boşluk =
       birden fazla `M`. Tek `M` çıkarsa çizgi boşluğun üstünden geçmiş,
       yani ölçülmeyen gün için bir değer UYDURULMUŞ demektir.

       (İlk yazımda `<circle>` sayısına bakmıştım — yanlıştı: nokta
       işaretçisi yalnız klavye imleci için çizilir. Bileşen değil test
       yanlıştı; bu oturumda beşinci kez.) */
    const gaps = WITH_GAP.filter((d) => d.value === null).length;
    await expect(gaps).toBeGreaterThan(0);

    const d = canvasElement.querySelector("path.stroke-chart-line")!.getAttribute("d")!;
    await expect((d.match(/M/g) ?? []).length).toBe(gaps + 1);
  },
};

export const VeriYoksaGrafikYok: StoryObj = {
  name: "Veri yoksa boş eksen çizilmez, gerekçeli boş durum çıkar",
  render: () => (
    <LineChart
      data={[]}
      label="ACOS"
      height={160}
      emptyDescription="Bu dönem için ölçüm gelmedi"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* Boş bir eksen takımı "ölçtük, hepsi sıfır" diye okunur. */
    await expect(canvas.queryByRole("img", { name: "ACOS" })).toBeNull();
    await expect(canvas.getByText(/ölçüm gelmedi/i)).toBeInTheDocument();
  },
};
