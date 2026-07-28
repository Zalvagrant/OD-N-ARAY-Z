/** S3 · 13 — Chart temel seti: Line · Area · Bar (UI-ADR-087) */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
