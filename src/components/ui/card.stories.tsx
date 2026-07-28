/** S3 · 4 — Card */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card, CardBody, CardFooter, CardHeader } from "./card";
import { Button } from "./button";
import { Text } from "./typography";

const meta: Meta = {
  title: "Core/4 · Card",
  parameters: { layout: "padded" },
};
export default meta;

export const Tones: StoryObj = {
  render: () => (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader title="Default" description="Panel yüzeyi" />
        <CardBody>
          <Text tone="secondary">Standart kart. En sık kullanılan.</Text>
        </CardBody>
      </Card>

      <Card tone="elevated">
        <CardHeader title="Elevated" description="Widget yüzeyi" />
        <CardBody>
          <Text tone="secondary">Zeminden bir kademe yukarıda.</Text>
        </CardBody>
      </Card>

      <Card tone="ai">
        <CardHeader title="AI" description="AI üretimi bölge" />
        <CardBody>
          <Text tone="secondary">
            Mor glow yalnızca AI çıktısında (UI-ADR-069).
          </Text>
        </CardBody>
      </Card>
    </div>
  ),
};

export const WithFooter: StoryObj = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader
        title="PPC bütçesi"
        description="Kampanya bütçe değişikliği"
        actions={<Button size="xs" variant="tertiary">Detay</Button>}
      />
      <CardBody>
        <Text tone="secondary">
          Kartın içeriği kendi durumunu gösterir; kart yalnızca yüzeydir.
        </Text>
      </CardBody>
      <CardFooter>
        <Button variant="ghost" size="sm">
          Vazgeç
        </Button>
        <Button variant="primary" size="sm">
          Onayla
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const Densities: StoryObj = {
  render: () => (
    <div className="grid gap-4 lg:grid-cols-3">
      {(["comfortable", "compact", "dense"] as const).map((d) => (
        <Card key={d} density={d}>
          <CardHeader title={d} density={d} />
          <CardBody density={d}>
            <Text size="sm" tone="secondary">
              Yoğunluk tüm alt parçalara aynı verilir.
            </Text>
          </CardBody>
        </Card>
      ))}
    </div>
  ),
};
