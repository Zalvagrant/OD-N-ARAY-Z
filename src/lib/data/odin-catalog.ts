"use client";

/**
 * `/api/catalog` adaptörü — ODIN `amazon_api.build_catalog()`.
 *
 * İKİ EKRAN, TEK YÜK: Listings ve Returns aynı uçtan beslenir (KPI ile
 * Alert'in `/api/amazon`ı paylaşması gibi), ama AYRI `queryKey` alırlar —
 * iki bölüm bağımsız yenilenebilmeli.
 *
 * HESAP YOK: dönüşüm, buy-box, iade oranı kayıtta ne ise o. Arayüz
 * ortalama, sıralama skoru ya da "sağlık" TÜRETMEZ.
 *
 * İADE ORANI 0-1 GELİR ve ölçeği çekirdek BEYAN EDER. Değer olduğu gibi
 * taşınır; yüzdeye çevirmek `toPercentUnit` + beyan edilen ölçekle
 * yapılır (UI-ADR-093). Beyan yoksa değer BASILMAZ.
 */

import { z } from "zod";

import { internalEnvelope } from "@/types/data-envelope";
import type { PercentScale } from "@/types/executive";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

const provenanceSchema = {
  available: z.boolean(),
  reason: z.string().nullable(),
  record_id: z.string().nullable(),
  as_of: z.string().nullable(),
  source_detail: z.string().nullable(),
};

const listingRowSchema = z.object({
  asin: z.string().nullable(),
  title: z.string().nullable(),
  sessions: z.number().nullable(),
  units: z.number().nullable(),
  revenue: z.number().nullable(),
  conversion_pct: z.number().nullable(),
  buybox_pct: z.number().nullable(),
});

const returnRowSchema = z.object({
  product_group: z.string().nullable(),
  title: z.string().nullable(),
  stars: z.number().nullable(),
  raw_stars: z.number().nullable(),
  reviews: z.number().nullable(),
  refund_rate: z.number().nullable(),
  ordered_units: z.number().nullable(),
  ordered_revenue: z.number().nullable(),
});

export const catalogSchema = z.object({
  generated_at: z.string(),
  listings: z.object({
    ...provenanceSchema,
    currency: z.string().nullish(),
    asin_count: z.number().nullish(),
    inventory_units_total: z.number().nullish(),
    notes: z.array(z.string()).nullish(),
    rows: z.array(listingRowSchema),
  }),
  returns: z.object({
    ...provenanceSchema,
    refund_rate_scale: z.string().nullish(),
    currency: z.string().nullish(),
    total: returnRowSchema.nullish(),
    rows: z.array(returnRowSchema),
  }),
});

type Raw = z.infer<typeof catalogSchema>;

export type Provenance = {
  available: boolean;
  reason: string | null;
  recordId: string | null;
  asOf: string | null;
  sourceDetail: string | null;
};

export type ListingRow = {
  asin: string | null;
  title: string | null;
  sessions: number | null;
  units: number | null;
  revenue: number | null;
  conversionPct: number | null;
  buyboxPct: number | null;
};

export type ReturnRow = {
  productGroup: string | null;
  title: string | null;
  stars: number | null;
  rawStars: number | null;
  reviews: number | null;
  /** Ham oran. Ölçek `refundRateScale`ten okunur, tahmin edilmez. */
  refundRate: number | null;
  orderedUnits: number | null;
  orderedRevenue: number | null;
};

export type Listings = Provenance & {
  currency: string | null;
  asinCount: number | null;
  inventoryUnitsTotal: number | null;
  /** Kaydın KENDİ notları — ölçüm değil, öyle etiketlenir. */
  notes: string[];
  rows: ListingRow[];
};

export type Returns = Provenance & {
  refundRateScale: PercentScale | undefined;
  currency: string | null;
  total: ReturnRow | null;
  rows: ReturnRow[];
};

function prov(raw: Raw["listings"] | Raw["returns"]): Provenance {
  return {
    available: raw.available,
    reason: raw.reason,
    recordId: raw.record_id,
    asOf: raw.as_of,
    sourceDetail: raw.source_detail,
  };
}

const toReturnRow = (r: z.infer<typeof returnRowSchema>): ReturnRow => ({
  productGroup: r.product_group,
  title: r.title,
  stars: r.stars,
  rawStars: r.raw_stars,
  reviews: r.reviews,
  refundRate: r.refund_rate,
  orderedUnits: r.ordered_units,
  orderedRevenue: r.ordered_revenue,
});

export function adaptListings(raw: Raw): Listings {
  return {
    ...prov(raw.listings),
    currency: raw.listings.currency ?? null,
    asinCount: raw.listings.asin_count ?? null,
    inventoryUnitsTotal: raw.listings.inventory_units_total ?? null,
    notes: raw.listings.notes ?? [],
    rows: raw.listings.rows.map((r) => ({
      asin: r.asin,
      title: r.title,
      sessions: r.sessions,
      units: r.units,
      revenue: r.revenue,
      conversionPct: r.conversion_pct,
      buyboxPct: r.buybox_pct,
    })),
  };
}

export function adaptReturns(raw: Raw): Returns {
  const scale = raw.returns.refund_rate_scale;
  return {
    ...prov(raw.returns),
    /* Sözlük dışı bir ölçek beyanı KABUL EDİLMEZ: `undefined` kalır ve
       `toPercentUnit` null döner — ekran sayıyı basmaz (UI-ADR-093). */
    refundRateScale:
      scale === "0-1" || scale === "0-100" ? (scale as PercentScale) : undefined,
    currency: raw.returns.currency ?? null,
    total: raw.returns.total ? toReturnRow(raw.returns.total) : null,
    rows: raw.returns.rows.map(toReturnRow),
  };
}

const CATALOG_PATH = "/api/catalog";

export function useOdinListings(): OdinQueryResult<Listings> {
  return useOdinQuery({
    key: ["odin", "catalog", "listings"],
    module: "amazon",
    schema: z.custom<Listings>(),
    load: IS_MOCK
      ? async () => loadMock("amazon.listings")
      : async (signal) => {
          const raw = catalogSchema.parse(
            await httpLoad(CATALOG_PATH, { signal })
          );
          return internalEnvelope(raw.generated_at, adaptListings(raw));
        },
  });
}

export function useOdinReturns(): OdinQueryResult<Returns> {
  return useOdinQuery({
    key: ["odin", "catalog", "returns"],
    module: "amazon",
    schema: z.custom<Returns>(),
    load: IS_MOCK
      ? async () => loadMock("amazon.returns")
      : async (signal) => {
          const raw = catalogSchema.parse(
            await httpLoad(CATALOG_PATH, { signal })
          );
          return internalEnvelope(raw.generated_at, adaptReturns(raw));
        },
  });
}
