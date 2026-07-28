/** S3 · 11 — Skeleton: gerçek yerleşimi temsil eder, layout shift üretmez */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoadingState } from "./loading-state";
import { Skeleton, SkeletonText } from "./skeleton";
import { Button } from "./button";
import { Card, CardBody, CardHeader } from "./card";
import { Text } from "./typography";

const meta: Meta = {
  title: "Core/11 · Skeleton",
  parameters: { layout: "padded" },
};
export default meta;

export const Layouts: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-8">
      <LoadingState layout="text" />
      <LoadingState layout="card" />
      <LoadingState layout="list" count={3} />
      <LoadingState layout="kpi" count={4} />
    </div>
  ),
};

/** Layout shift kanıtı: yükleme ve içerik AYNI yeri kaplar. */
export const NoLayoutShift: StoryObj = {
  render: function Render() {
    const [loading, setLoading] = useState(true);
    return (
      <div className="flex max-w-md flex-col gap-3">
        <Button size="sm" onClick={() => setLoading((l) => !l)}>
          {loading ? "İçeriği göster" : "Yüklemeye dön"}
        </Button>
        <Card>
          <CardHeader title={loading ? " " : "Net Kâr"} />
          <CardBody>
            {loading ? (
              <SkeletonText lines={3} />
            ) : (
              <Text tone="secondary">
                Üç satırlık gerçek metin. Skeleton ile aynı satır yüksekliği ve
                aynı satır sayısı kullanıldığı için kutu zıplamaz.
              </Text>
            )}
          </CardBody>
        </Card>
        <Skeleton className="h-3 w-1/2" />
      </div>
    );
  },
};
