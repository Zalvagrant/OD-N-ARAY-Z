/**
 * S3 · 2 — DataTable (VirtualTable)
 *
 * "10.000 satırda akıcı olmalı" doğrulaması burada yapılır: `TenThousandRows`
 * hikâyesi gerçek 10.000 satır üretir, DOM'da yalnızca görünen satırlar olur.
 * Veri deterministiktir (Math.random YOK) — görsel regresyon testi kırılmasın.
 */
import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ColumnDef } from "@tanstack/react-table";
import { expect, waitFor } from "storybook/test";
import { DataTable, type TableDensity } from "./table";
import { Mono, Num } from "./typography";
import { Badge } from "./badge";
import { SegmentedControl } from "./selection";

interface Sku {
  sku: string;
  title: string;
  units: number;
  revenue: number;
  acos: number;
  status: "healthy" | "risk";
}

function makeRows(n: number): Sku[] {
  return Array.from({ length: n }, (_, i) => ({
    sku: `LLU-${String(i).padStart(5, "0")}`,
    title: `Ürün ${i}`,
    units: (i * 7) % 900,
    revenue: ((i * 137) % 9000) + 100,
    acos: ((i * 13) % 60) / 100,
    status: i % 5 === 0 ? "risk" : "healthy",
  }));
}

const columns: ColumnDef<Sku, unknown>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: (c) => <Mono>{String(c.getValue())}</Mono>,
  },
  { accessorKey: "title", header: "Başlık" },
  { accessorKey: "units", header: "Adet" },
  {
    accessorKey: "revenue",
    header: "Ciro",
    cell: (c) => <Num value={Number(c.getValue())} format="currency" />,
  },
  {
    accessorKey: "acos",
    header: "ACOS",
    meta: { numeric: true },
    cell: (c) => <Num value={Number(c.getValue())} format="percent" fractionDigits={1} />,
  },
  {
    accessorKey: "status",
    header: "Durum",
    meta: { numeric: false },
    cell: (c) =>
      c.getValue() === "risk" ? (
        <Badge variant="warning">Risk</Badge>
      ) : (
        <Badge variant="success">Sağlıklı</Badge>
      ),
  },
];

const meta: Meta = {
  title: "Core/2 · Table",
  parameters: { layout: "padded" },
};
export default meta;

export const Default: StoryObj = {
  render: function Render() {
    const [density, setDensity] = useState<TableDensity>("compact");
    const [selected, setSelected] = useState<Sku | null>(null);
    const data = useMemo(() => makeRows(50), []);

    return (
      <div className="flex flex-col gap-3">
        <SegmentedControl
          label="Yoğunluk"
          value={density}
          onChange={setDensity}
          options={[
            { value: "comfortable", label: "Comfortable" },
            { value: "compact", label: "Compact" },
            { value: "dense", label: "Dense" },
          ]}
        />
        <DataTable
          label="SKU listesi"
          data={data}
          columns={columns}
          density={density}
          onSelect={setSelected}
        />
        <p className="text-sm text-content-secondary">
          Context Panel&apos;e giden seçim:{" "}
          {selected ? <Mono>{selected.sku}</Mono> : "yok"}
        </p>
      </div>
    );
  },
};

/** Performans doğrulaması — 10.000 satır. */
export const TenThousandRows: StoryObj = {
  render: function Render() {
    const data = useMemo(() => makeRows(10_000), []);
    return (
      <DataTable
        label="10.000 satırlık SKU listesi"
        data={data}
        columns={columns}
        density="dense"
      />
    );
  },
};

/**
 * S3 BORCUNUN KAPANIŞI — UI-ADR-097.
 *
 * NE ÖLÇÜLMÜYOR VE NEDEN: ne FPS ne de "50 ms üzeri long task sayısı".
 * İkisi de zaman temellidir ve bu ortamda TAŞINABİLİR DEĞİLDİR. Ölçtüm:
 * aynı kodda tekerlek senaryosu bir koşumda 5, diğerinde 18 long task
 * verdi; `table-layout: fixed` gibi teorik olarak İYİLEŞTİRMESİ gereken bir
 * değişiklikten sonra sayı 3,6 kat arttı. Yani sinyal koda değil, o andaki
 * makine yüküne tepki veriyor (kontrol grubu her koşumda 0 —
 * dolayısıyla gürültü kaydırmadan değil, zamanlamadan geliyor).
 * Kırmızı ama güvenilmez bir test, testsizlikten kötüdür: insanlara
 * kırmızıyı yok saymayı öğretir. (gavadolar · terra + luna, aynı yönde;
 * karar 08-decision-log.md UI-ADR-097'de.)
 *
 * NE ÖLÇÜLÜYOR: sanallaştırmanın makineden bağımsız DÖRT INVARIANT'I.
 * Bunlar "scroll başına O(N) DOM işi yapmıyoruz" garantisinin doğrudan
 * karşılığıdır ve her makinede aynı sonucu verir:
 *   1. DOM satır sayısı pencere + overscan sınırını aşmaz (veri
 *      büyüklüğünden bağımsız: 10.000 satırda ~40 DOM satırı).
 *   2. Kaydırma adımı başına DOM değişimi sınırlıdır — tüm liste yeniden
 *      kurulmaz.
 *   3. `scrollHeight` kaydırma boyunca kaymaz.
 *   4. Kaydırma konumu değişince DOĞRU veri aralığı görünür (sanallaştırma
 *      hızlı ama yanlış satırı göstermiyor).
 *
 * SABİT "≤30" EŞİĞİ KULLANILMADI: sınır viewport yüksekliğine bağlıdır.
 * 60vh'lik tabloda 32 px satırla ~15 satır görünür, `overscan: 12` iki
 * yönde 24 satır ekler — yapısal alt sınır zaten ~39'dur. Ölçülen değeri
 * kırpmak yerine sınır EKRANDAN HESAPLANIR; test 1080p'de de 4K'da da
 * doğru şeyi ölçer.
 */
export const SanallastirmaAltindaKaydirma: StoryObj = {
  render: function Render() {
    const data = useMemo(() => makeRows(10_000), []);
    return (
      <DataTable
        label="10.000 satır — kaydırma altında sanallaştırma"
        data={data}
        columns={columns}
        density="dense"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector<HTMLElement>('[role="grid"]');
    expect(grid).not.toBeNull();

    const indices = () =>
      [...grid!.querySelectorAll<HTMLElement>("tbody tr[data-index]")].map((tr) =>
        Number(tr.dataset.index)
      );

    await waitFor(() => expect(indices().length).toBeGreaterThan(0));

    const heightBefore = grid!.scrollHeight;

    /* Sınır ekrandan hesaplanır: görünen satır + iki yönde overscan + pay. */
    const OVERSCAN = 12;
    const rowPx =
      grid!.querySelector("tbody tr[data-index]")!.getBoundingClientRect().height || 32;
    const visibleRows = Math.ceil(grid!.clientHeight / rowPx);
    const domRowBudget = visibleRows + 2 * OVERSCAN + 2;

    const twoFrames = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );

    let maxRows = indices().length;
    let maxChurn = 0;
    const wrongRange: string[] = [];

    const scrollTo = async (top: number) => {
      const before = new Set(indices());
      grid!.scrollTop = top;
      await twoFrames();

      const after = indices();
      maxRows = Math.max(maxRows, after.length);

      /* 2 — adım başına DOM değişimi: kaç satır yenilendi? */
      maxChurn = Math.max(maxChurn, after.filter((i) => !before.has(i)).length);

      /* 4 — doğru aralık mı? İlk görünen satır scrollTop'tan hesaplanandır;
         overscan payıyla birlikte aralık onu KAPSAMALIDIR. Ayrıca satırın
         metni deterministik üreticiyle eşleşmelidir (makeRows). */
      const expectedTop = Math.floor(grid!.scrollTop / rowPx);
      if (!after.includes(expectedTop)) {
        wrongRange.push(`aralık ${after[0]}..${after.at(-1)} içinde ${expectedTop} yok`);
      } else {
        const tr = grid!.querySelector(`tbody tr[data-index="${expectedTop}"]`);
        const sku = `LLU-${String(expectedTop).padStart(5, "0")}`;
        if (!tr?.textContent?.includes(sku)) {
          wrongRange.push(`satır ${expectedTop} ${sku} göstermiyor`);
        }
      }
    };

    /* Gerçek kullanıcı kaydırması — fare tekerleği ≈ 4 satır. */
    for (let step = 1; step <= 30; step++) await scrollTo(grid!.scrollTop + rowPx * 4);

    /* Stres — scrollbar sürükleme, adım başına ~500 satır atlama. */
    const span = grid!.scrollHeight - grid!.clientHeight;
    for (let step = 1; step <= 20; step++) await scrollTo((span * step) / 20);

    /* 1 — DOM satır sayısı sınırlı ve veri büyüklüğünden bağımsız. */
    expect(maxRows).toBeLessThanOrEqual(domRowBudget);
    expect(maxRows).toBeLessThan(100);

    /* 2 — adım başına yenilenen satır sayısı bir pencereyi aşamaz. Sıçramalı
       kaydırmada pencerenin tamamı değişir, bu beklenendir; ölçülen şey
       "10.000 satırın hepsi yeniden kurulmuyor"dur. */
    expect(maxChurn).toBeLessThanOrEqual(domRowBudget);

    /* 3 — yükseklik kaymıyor. Tam eşitlik beklenmez: sanallaştırıcı gerçek
       satır yüksekliğini ölçtükçe tahmini düzeltir (ölçülen sapma 320.035 →
       320.038 px = 3 px). Kabul sınırı BİR SATIR; üstü zıplama demektir. */
    expect(Math.abs(grid!.scrollHeight - heightBefore)).toBeLessThanOrEqual(rowPx);

    /* 4 — hızlı olmak yetmez, DOĞRU satır görünmeli. */
    expect(wrongRange).toEqual([]);
  },
};

export const Loading: StoryObj = {
  render: () => (
    <DataTable label="SKU listesi" data={[]} columns={columns} loading />
  ),
};

export const Empty: StoryObj = {
  render: () => (
    <DataTable
      label="SKU listesi"
      data={[]}
      columns={columns}
      emptyTitle="Henüz SKU yok"
      emptyDescription="Amazon hesabı bağlandığında ürünler buraya otomatik gelir."
      emptySuggestion="Bağlantıyı Settings → Veri Kaynakları altından kurabilirsin."
    />
  ),
};

export const Error: StoryObj = {
  render: () => (
    <DataTable
      label="SKU listesi"
      data={[]}
      columns={columns}
      error={{
        what: "SKU listesi yüklenemedi",
        why: "ODIN yerel sunucusu (127.0.0.1) yanıt vermedi.",
        impact: "Ürün tablosu ve ona bağlı KPI'lar şu an güncel değil.",
        fix: "ODIN sunucusunu başlat, sonra yeniden dene.",
      }}
      onRetry={() => {}}
    />
  ),
};
