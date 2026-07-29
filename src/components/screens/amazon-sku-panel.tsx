"use client";

/**
 * Amazon · SKU bağlam paneli — 06-workspaces.md §1.7.
 *
 *   SKU Summary → Financial Metrics → Advertising → Inventory
 *   → History → AI Recommendation → Actions
 *
 * PANELİN KABUĞU DEĞİŞMEZ. Bu dosya yalnızca S5'te açılan `children`
 * slot'unu doldurur (03-...md §7: kabuk sabit, içerik sağlayıcısı değişken).
 * Seçili SKU yokken hiçbir şey basmaz — kabuk kendi "seçili nesne yok" boş
 * durumunu gösterir.
 *
 * ANTI-FAKE — bu panelde üç yer bilerek boştur:
 *  · Birim kâr: COGS yok, hesaplanamaz (UI-ADR-098).
 *  · History: SKU olay geçmişi sözleşmesi yok (13-...md §15.3).
 *  · Actions: yazma uçları bağlı değil. Hiçbir şey yapmayan bir düğme,
 *    sahte bir yetenektir; çizilmez.
 */

import type { Alert } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import type { SkuHealth } from "@/types/screens";
import { remainingTime, useNow } from "@/lib/clock/tick";
import { toPercentUnit } from "@/lib/format/percent";
import { useAmazonStore } from "@/lib/store/amazon";
import { amazonAlertsMock } from "@/mocks/amazon";
import { useMockData } from "@/mocks/use-mock";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { NoData } from "@/components/ui/no-data";
import { Heading, Mono, Num, Text } from "@/components/ui/typography";
import { AlertStack } from "@/components/executive/alert-stack";
import { Meter } from "@/components/executive/meter";
import { Metric } from "@/components/executive/metric";
import { PROFIT_NEEDS_COGS } from "@/components/executive/ppc-overview";

export const SKU_STATUS: Record<
  SkuHealth["status"],
  { label: string; variant: BadgeVariant }
> = {
  healthy: { label: "Sağlıklı", variant: "success" },
  watch: { label: "İzlemede", variant: "info" },
  at_risk: { label: "Riskli", variant: "warning" },
  critical: { label: "Kritik", variant: "danger" },
};

/** SKU yüzdeleri 0–100 ölçeğindedir; teklif sözleşmesinde bildirilmiştir. */
const SKU_SCALE = "0-100" as const;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line-subtle pt-3 first:border-t-0 first:pt-0">
      <Heading level={3} size={4}>
        {title}
      </Heading>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function AmazonSkuPanel() {
  const sku = useAmazonStore((s) => s.selectedSku);
  const now = useNow();
  const alerts = useMockData(amazonAlertsMock);

  /* Seçim yoksa hiçbir şey basma — kabuğun boş durumu doğru olandır. */
  if (!sku) return null;

  const status = SKU_STATUS[sku.status];
  const stockout = remainingTime(sku.estimatedStockoutAt, now);

  /* İlgili uyarılar sözleşmeden gelir: Alert.affectedEntities (09-...md §6).
     Türetme yok, eşleşme var. */
  const related: DataEnvelope<Alert[]> | null = alerts.data
    ? {
        data: alerts.data.data.filter((a) => a.affectedEntities?.includes(sku.sku)),
        meta: alerts.data.meta,
      }
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* 1 — SKU Summary */}
      <Group title="SKU Summary">
        <div className="flex flex-col gap-2">
          <Mono size="sm">{sku.sku}</Mono>
          <Text size="sm">{sku.title}</Text>
          <p className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant} size="sm">
              {status.label}
            </Badge>
            <Mono size="sm" tone="tertiary">
              {sku.asin}
            </Mono>
          </p>
          <dl className="grid gap-3">
            <Metric
              label="Health Score"
              note={sku.healthScore === null ? "skor hesaplanmadı" : undefined}
            >
              <Meter
                value={sku.healthScore}
                label={`${sku.sku} sağlık skoru`}
                tone={sku.status === "critical" ? "danger" : "ai"}
                noDataReason="Sağlık skoru hesaplanmadı"
              />
              <Num value={sku.healthScore} size="sm" noDataReason="Skor yok" />
            </Metric>
          </dl>
        </div>
      </Group>

      {/* 2 — Financial Metrics */}
      <Group title="Financial Metrics">
        <dl className="grid gap-3">
          <Metric label="Ciro (30 gün)">
            <Num
              value={sku.revenueLast30d?.amount ?? null}
              format="currency"
              currency={sku.revenueLast30d?.currency}
              size="lg"
              noDataReason="30 günlük ciro gelmedi"
            />
          </Metric>
          <Metric label="Fiyat">
            <Num
              value={sku.price?.amount ?? null}
              format="currency"
              currency={sku.price?.currency}
              noDataReason="Fiyat gelmedi"
            />
          </Metric>
          <Metric label="Satılan adet (30 gün)">
            <Num value={sku.unitsSoldLast30d} noDataReason="Adet gelmedi" />
          </Metric>
          <Metric label="Dönüşüm oranı">
            <Num
              value={toPercentUnit(sku.conversionRate, SKU_SCALE)}
              format="percent"
              fractionDigits={1}
              noDataReason="Dönüşüm oranı ölçülmedi"
            />
          </Metric>
          {/* Birim kâr KALICI OLARAK boştur — COGS Amazon'da yoktur. */}
          <Metric label="Birim kâr" note={PROFIT_NEEDS_COGS}>
            <NoData reason={PROFIT_NEEDS_COGS} />
          </Metric>
        </dl>
      </Group>

      {/* 3 — Advertising */}
      <Group title="Advertising">
        <dl className="grid gap-3">
          <Metric label="Reklam harcaması (30 gün)">
            <Num
              value={sku.adSpendLast30d?.amount ?? null}
              format="currency"
              currency={sku.adSpendLast30d?.currency}
              noDataReason="Ads API'den harcama gelmedi"
            />
          </Metric>
          <Metric label="Reklam satışı (30 gün)">
            <Num
              value={sku.adSalesLast30d?.amount ?? null}
              format="currency"
              currency={sku.adSalesLast30d?.currency}
              noDataReason="Ads API'den satış gelmedi"
            />
          </Metric>
          <Metric label="ACOS">
            <Num
              value={toPercentUnit(sku.acos, SKU_SCALE)}
              format="percent"
              fractionDigits={1}
              noDataReason="ACOS hesaplanmadı"
            />
          </Metric>
          <Metric label="BuyBox oranı">
            <Num
              value={toPercentUnit(sku.buyBoxRate, SKU_SCALE)}
              format="percent"
              fractionDigits={1}
              noDataReason="BuyBox oranı raporlanmadı"
            />
          </Metric>
        </dl>
      </Group>

      {/* 4 — Inventory */}
      <Group title="Inventory">
        <dl className="grid gap-3">
          <Metric label="Stok">
            <Num value={sku.unitsAvailable} noDataReason="Stok adedi gelmedi" />
            <span className="text-xs text-content-tertiary">adet</span>
          </Metric>
          <Metric
            label="Tahmini tükenme"
            note={sku.estimatedStockoutAt ? "kalan süre" : undefined}
          >
            {/* GELECEK tarih → `remainingTime`. `relativeTime` bir YAŞ
                fonksiyonudur ve buraya "birazdan" yazardı (S5 dersi). */}
            {stockout ? (
              <time dateTime={sku.estimatedStockoutAt!} className="text-content">
                {stockout}
              </time>
            ) : (
              <NoData reason="Tükenme tarihi hesaplanmadı" />
            )}
          </Metric>
          <Metric label="Kalan gün">
            <Num value={sku.daysOfSupply} noDataReason="Satış hızı ölçülmedi" />
          </Metric>
          <Metric label="Önerilen sipariş">
            <Num value={sku.reorderUnits} noDataReason="Sipariş önerisi üretilmedi" />
            {sku.reorderUnits !== null && (
              <span className="text-xs text-content-tertiary">adet</span>
            )}
          </Metric>
        </dl>
      </Group>

      {/* 5 — History: sözleşme YOK (UI-ADR-096 deseni) */}
      <Group title="History">
        <Text size="sm" tone="tertiary">
          SKU olay geçmişi için veri sözleşmesi tanımlı değil. Uydurulmuş bir
          zaman çizgisi göstermek yerine boş bırakıldı; soru
          13-backend-recommendations.md §15.3&apos;e düşüldü.
        </Text>
      </Group>

      {/* 6 — AI Recommendation: türetme yok, sözleşmeden eşleşme var */}
      <Group title="AI Recommendation">
        {related && related.data.length > 0 ? (
          <AlertStack env={related} title={`${sku.sku} için aksiyon gerektirenler`} />
        ) : (
          <Text size="sm" tone="tertiary">
            Bu SKU&apos;yu etkileyen, aksiyon gerektiren bir uyarı yok. SKU
            seviyesinde ayrı bir AI önerisi sözleşmesi de tanımlı değil
            (13-...md §15.3).
          </Text>
        )}
      </Group>

      {/* 7 — Actions */}
      <Group title="Actions">
        <Text size="sm" tone="tertiary">
          Yeniden sipariş, fiyat değiştirme ve kampanya düzenleme yazma uçları
          bağlı değil. Hiçbir şey yapmayan bir düğme sahte bir yetenektir —
          uçlar gelene kadar çizilmez.
        </Text>
      </Group>
    </div>
  );
}
