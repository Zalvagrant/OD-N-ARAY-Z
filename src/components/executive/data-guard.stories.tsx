/**
 * DataGuard — anti-fake kuralının TEK uygulama noktası (UI-ADR-088).
 *
 * Bu dosya UI-ADR-150'de yazıldı ve reponun EN KRİTİK sözleşme testidir:
 * `DataGuard` yanlış çalışırsa hiçbir şey patlamaz, ekran sadece
 * uydurulmuş bir şey gösterir — ve bu, ürünün tamamının güvenilirliğini
 * bitiren tek hata sınıfıdır (CLAUDE.md §2).
 *
 * gavadolar 2/2 kuralı: **"görünmüyor" YETMEZ, RENDER EDİLMEDİĞİ
 * kanıtlanmalı.** Görünmez bir çocuk yine de hesap yapar, istek atar ve
 * hata fırlatabilir. Bu yüzden aşağıdaki testler bir SPY kullanır.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";

import type { DataEnvelope } from "@/types/data-envelope";
import { DataGuard } from "./data-guard";

type ProbeArgs = { onRender: (data: string[]) => void };
type Story = StoryObj<ProbeArgs>;

const meta: Meta<ProbeArgs> = {
  title: "Executive/DataGuard",
  parameters: { layout: "padded" },
};
export default meta;

const META = {
  source: "internal",
  lastUpdated: new Date().toISOString(),
  freshness: "live",
} as const;

const full: DataEnvelope<string[]> = { data: ["ölçüldü"], meta: META };

/** Çocuğun ÇAĞRILDIĞINI kanıtlayan casus. */
function Probe({
  env,
  onRender,
}: {
  env: DataEnvelope<string[]> | null | undefined;
  onRender: (data: string[]) => void;
}) {
  return (
    <DataGuard env={env} reason="Ölçüm kaynağı bağlı değil">
      {(data) => {
        onRender(data);
        return <p data-testid="child">{data.join(", ")}</p>;
      }}
    </DataGuard>
  );
}

export const VeriVarsaCizer: Story = {
  name: "Zarf geçerliyse çocuk TAM BİR KEZ çalışır",
  args: { onRender: fn() },
  render: (args) => <Probe env={full} onRender={args.onRender} />,
  play: async ({ canvasElement, args }) => {
    await expect(args.onRender).toHaveBeenCalledTimes(1);
    await expect(within(canvasElement).getByTestId("child")).toHaveTextContent(
      "ölçüldü"
    );
  },
};

export const ZarfYoksaCocukHicCalismaz: Story = {
  name: "Zarf null ise çocuk HİÇ ÇAĞRILMAZ (gizlenmez — çalışmaz)",
  args: { onRender: fn() },
  render: (args) => <Probe env={null} onRender={args.onRender} />,
  play: async ({ canvasElement, args }) => {
    /* ASIL İDDİA. Çocuğu CSS ile gizlemek yetmezdi: gizli bir çocuk yine
       de hesap yapar, istek atar ve tanımsız alandan patlayabilir.
       `DataGuard` onu hiç ÇAĞIRMAZ. */
    await expect(args.onRender).not.toHaveBeenCalled();
    await expect(within(canvasElement).queryByTestId("child")).toBeNull();
  },
};

export const UndefinedDeAynidir: Story = {
  name: "undefined zarf da geçmez",
  args: { onRender: fn() },
  render: (args) => <Probe env={undefined} onRender={args.onRender} />,
  play: async ({ args }) => {
    await expect(args.onRender).not.toHaveBeenCalled();
  },
};

export const MetaEksikseGecmez: Story = {
  name: "META EKSİKSE veri varken bile geçmez",
  args: { onRender: fn() },
  render: (args) => (
    /* Sınır durum: `data` dolu ama `meta` yok. Zarfsız veri, kaynağı
       bilinmeyen veridir; TrustSignal onu etiketleyemez ve ekran
       "güncel mi?" sorusunu cevaplayamaz. Geçirmek, sahte veriden daha
       sinsi bir şey olurdu: GERÇEK ama KAYNAKSIZ veri. */
    <Probe
      env={{ data: ["kaynaksız"] } as unknown as DataEnvelope<string[]>}
      onRender={args.onRender}
    />
  ),
  play: async ({ args }) => {
    await expect(args.onRender).not.toHaveBeenCalled();
  },
};

export const GerekceGorunur: Story = {
  name: "Veri yokken GEREKÇE erişilebilir biçimde yazılır",
  render: () => (
    <DataGuard env={null} reason="Ölçüm kaynağı bağlı değil">
      {() => <p>asla</p>}
    </DataGuard>
  ),
  play: async ({ canvasElement }) => {
    /* "Veri yok" demek yetmez — NEDEN olmadığı söylenir. Sessiz bir tire,
       kullanıcıya sistemin bozuk mu yoksa veri mi yok olduğunu söylemez. */
    await expect(
      within(canvasElement).getByLabelText("Ölçüm kaynağı bağlı değil")
    ).toBeInTheDocument();
  },
};

export const FallbackNoDataYerineGecer: Story = {
  name: "fallback verilirse NoData yerine O çizilir",
  render: () => (
    <DataGuard
      env={null}
      reason="kullanılmaz"
      fallback={<p data-testid="fallback">Zengin boş durum</p>}
    >
      {() => <p>asla</p>}
    </DataGuard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("fallback")).toBeInTheDocument();
    await expect(canvas.queryByLabelText("kullanılmaz")).toBeNull();
  },
};
