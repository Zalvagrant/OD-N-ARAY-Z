"use client";

/**
 * SKU Health tablosunun sütun tanımı (UI-ADR-134).
 *
 * `amazon-director.tsx` içinden çıkarıldı. Sütunlar dar kolona sığacak
 * kadar; gerisi sağ paneldedir.
 *
 * Ayrı dosyada olmasının sebebi boyut değil SORUMLULUK: sütun tanımı bir
 * VERİ→HÜCRE eşlemesidir, ekran düzeni değildir. Ekranın yerleşimi
 * değiştiğinde bu dosyaya dokunulmaz.
 */

import type { ColumnDef } from "@tanstack/react-table";
import type { SkuHealth } from "@/types/screens";
import { Badge } from "@/components/ui/badge";
import { NoData } from "@/components/ui/no-data";
import { Mono, Num } from "@/components/ui/typography";
import { toPercentUnit } from "@/lib/format/percent";
import { SKU_SCALE, SKU_STATUS } from "@/features/amazon/presentation/sku";

/* --------------------------------------------------------------------------
   SKU Health tablosu — sütunlar dar kolona sığacak kadar; gerisi sağ panelde
   -------------------------------------------------------------------------- */


/* `now` PARAMETRESİ DÜŞTÜ: tabloda artık geri sayım yok — tükenme
   tarihi ODIN tarafından üretilmiyor (ADR-0149). Envanter bölümü
   kendi `now`unu kullanmaya devam ediyor. */
export function skuColumns(): ColumnDef<SkuHealth, unknown>[] {
  return [
    {
      id: "sku",
      accessorKey: "sku",
      header: "SKU",
      cell: (c) => <Mono size="sm">{c.getValue() as string}</Mono>,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Durum",
      cell: (c) => {
        const s = SKU_STATUS[c.getValue() as SkuHealth["status"]];
        return s ? (
          <Badge variant={s.variant} size="xs">
            {s.label}
          </Badge>
        ) : (
          <NoData reason="Durum bilinmiyor" />
        );
      },
    },
    /*
     * ÖLÇÜLENİ GÖSTER — S12 düzeltmesi (UI-ADR-128).
     *
     * Burada üç kolon vardı: Sağlık skoru · Tükenme tarihi · BuyBox. ODIN
     * ADR-0149 ile üçünün de KARARLA null olduğu kesinleşti (skorlama
     * politikası yok, tükenme tarihi bir tahmin politikasının çıktısı,
     * BuyBox'ın kaynağı dönemini beyan etmiyor). Canlı ekranda görüldü:
     * beş kolonun üçü her satırda "—" idi.
     *
     * Sürekli boş bir kolon, veri yokluğunu bildirmez — tabloyu okunmaz
     * yapar ve gerçekten ölçülmüş olanı gizler. Yerlerine ODIN'in
     * yayınladığı gerçek alanlar kondu. Skor/tükenme/BuyBox bir üretici
     * kazandığı gün geri gelir; o güne kadar yerlerini işgal etmezler.
     */
    {
      id: "daysOfSupply",
      accessorKey: "daysOfSupply",
      header: "Kalan gün",
      meta: { numeric: true },
      cell: (c) => (
        <Num
          value={c.getValue() as number | null}
          fractionDigits={1}
          size="sm"
          noDataReason="Satış hızı ölçülmedi"
        />
      ),
    },
    {
      id: "unitsAvailable",
      accessorKey: "unitsAvailable",
      header: "Stok",
      meta: { numeric: true },
      cell: (c) => (
        <Num
          value={c.getValue() as number | null}
          size="sm"
          noDataReason="Envanter kaydı yok"
        />
      ),
    },
    {
      id: "unitsSold",
      accessorFn: (r) => r.sales.unitsSold,
      header: "Satılan",
      meta: { numeric: true },
      cell: (c) => (
        <Num
          value={c.getValue() as number | null}
          size="sm"
          noDataReason="Bu SKU satış penceresinde yok"
        />
      ),
    },
    {
      id: "acos",
      accessorFn: (r) => r.advertising.acos,
      header: "ACOS",
      meta: { numeric: true },
      cell: (c) => (
        <Num
          value={toPercentUnit(c.getValue() as number | null, SKU_SCALE)}
          format="percent"
          fractionDigits={1}
          size="sm"
          noDataReason="Reklam verisi yok"
        />
      ),
    },
  ];
}

