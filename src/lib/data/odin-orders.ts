"use client";

/**
 * `/api/orders` adaptörü — ODIN `amazon_api.build_orders()`.
 *
 * Gece taraması "sipariş verisi yok, SP-API orders KO'su promote
 * edilmemiş" demişti; ÖLÇÜM bunu çürüttü — core'da yedi anlık görüntü
 * var ve hiçbir uç yayınlamıyordu. Uç açıldı, ekran bağlandı.
 *
 * HESAP YOK: toplam, dağılım ve para birimi çekirdekte hesaplanır
 * (Decimal ile, kuruş kaybetmeden). Arayüz ortalama sepet, dönüşüm ya da
 * büyüme TÜRETMEZ.
 *
 * FAIL-CLOSED GEREKÇESİ ÇEKİRDEKTEN GELİR: kayıt yoksa `available:false`
 * ve `reason` ODIN'in kendi cümlesidir; arayüz rota başına sabit metin
 * taşımaz (gavadolar 2/2).
 */

import { z } from "zod";

import { internalEnvelope } from "@/types/data-envelope";
import { httpLoad } from "./client";
import { IS_MOCK } from "./mode";
import { useOdinQuery, type OdinQueryResult } from "./use-odin-query";
import { loadMock } from "@/mocks/registry";

const bucketSchema = z.object({ name: z.string(), count: z.number() });

const moneySchema = z
  .object({ CurrencyCode: z.string(), Amount: z.string() })
  .nullable();

const rawOrderSchema = z.object({
  AmazonOrderId: z.string(),
  PurchaseDate: z.string().nullable(),
  OrderStatus: z.string().nullable(),
  SalesChannel: z.string().nullable(),
  FulfillmentChannel: z.string().nullable(),
  ShipServiceLevel: z.string().nullable(),
  NumberOfItemsShipped: z.number().nullable(),
  NumberOfItemsUnshipped: z.number().nullable(),
  IsPrime: z.boolean().nullable(),
  IsBusinessOrder: z.boolean().nullable(),
  OrderTotal: moneySchema,
});

/** Kaydın KENDİ beyan ettiği pencere (ADR-0138) — normalleştirilmez. */
const periodSchema = z
  .looseObject({
    basis: z.string().optional(),
    window_days: z.number().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    as_of: z.string().optional(),
  })
  .nullable();

export const ordersSchema = z.object({
  generated_at: z.string(),
  available: z.boolean(),
  reason: z.string().nullable(),
  record_id: z.string().nullable(),
  as_of: z.string().nullable(),
  period: periodSchema,
  count: z.number(),
  currency: z.string().nullable(),
  totals: z
    .object({
      amount: z.number(),
      orders_with_total: z.number(),
      orders_without_total: z.number(),
    })
    .nullable(),
  by_status: z.array(bucketSchema),
  by_channel: z.array(bucketSchema),
  by_fulfillment: z.array(bucketSchema),
  orders: z.array(rawOrderSchema),
});

export type OrderBucket = { name: string; count: number };

export type OrderRow = {
  id: string;
  purchasedAt: string | null;
  status: string | null;
  channel: string | null;
  fulfillment: string | null;
  shipService: string | null;
  itemsShipped: number | null;
  itemsUnshipped: number | null;
  isPrime: boolean | null;
  isBusiness: boolean | null;
  /** Tutarsız sipariş (Pending/Canceled) için null — 0 DEĞİL. */
  total: { amount: number; currency: string } | null;
};

export type OrdersSnapshot = {
  available: boolean;
  reason: string | null;
  recordId: string | null;
  asOf: string | null;
  period: { basis: string | null; windowDays: number | null; end: string | null };
  count: number;
  currency: string | null;
  totals: {
    amount: number;
    ordersWithTotal: number;
    ordersWithoutTotal: number;
  } | null;
  byStatus: OrderBucket[];
  byChannel: OrderBucket[];
  byFulfillment: OrderBucket[];
  orders: OrderRow[];
};

export function adaptOrders(
  raw: z.infer<typeof ordersSchema>
): OrdersSnapshot {
  return {
    available: raw.available,
    reason: raw.reason,
    recordId: raw.record_id,
    asOf: raw.as_of,
    period: {
      basis: raw.period?.basis ?? null,
      windowDays: raw.period?.window_days ?? null,
      end: raw.period?.end ?? null,
    },
    count: raw.count,
    currency: raw.currency,
    totals: raw.totals
      ? {
          amount: raw.totals.amount,
          ordersWithTotal: raw.totals.orders_with_total,
          ordersWithoutTotal: raw.totals.orders_without_total,
        }
      : null,
    byStatus: raw.by_status,
    byChannel: raw.by_channel,
    byFulfillment: raw.by_fulfillment,
    orders: raw.orders.map((o) => ({
      id: o.AmazonOrderId,
      purchasedAt: o.PurchaseDate,
      status: o.OrderStatus,
      channel: o.SalesChannel,
      fulfillment: o.FulfillmentChannel,
      shipService: o.ShipServiceLevel,
      itemsShipped: o.NumberOfItemsShipped,
      itemsUnshipped: o.NumberOfItemsUnshipped,
      isPrime: o.IsPrime,
      isBusiness: o.IsBusinessOrder,
      /* SP-API tutarı DİZE gönderir. `Number()` yalnız taşımadır — kuruş
         toplamı çekirdekte Decimal ile yapıldı, burada tek satır okunur.
         Ayrıştırılamayan bir tutar 0'a düşmez, null olur. */
      total: o.OrderTotal
        ? Number.isFinite(Number(o.OrderTotal.Amount))
          ? {
              amount: Number(o.OrderTotal.Amount),
              currency: o.OrderTotal.CurrencyCode,
            }
          : null
        : null,
    })),
  };
}

export function useOdinOrders(): OrdersSnapshotResult {
  return useOdinQuery({
    key: ["odin", "orders"],
    module: "amazon",
    schema: z.custom<OrdersSnapshot>(),
    load: IS_MOCK
      ? async () => loadMock("amazon.orders")
      : async (signal) => {
          const raw = ordersSchema.parse(
            await httpLoad("/api/orders", { signal })
          );
          return internalEnvelope(raw.generated_at, adaptOrders(raw));
        },
  });
}

type OrdersSnapshotResult = OdinQueryResult<OrdersSnapshot>;
