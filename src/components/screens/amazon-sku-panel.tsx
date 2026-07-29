"use client";

/**
 * Amazon · SKU bağlam paneli — 06-workspaces.md §1.7.
 *
 *   SKU Summary → Financial Metrics → Advertising → Inventory
 *   → History → AI Recommendation → Actions
 *
 * PANELİN KABUĞU DEĞİŞMEZ. Bu dosya yalnızca S5'te açılan `children`
 * slot'unu doldurur (03-...md §7: kabuk sabit, içerik sağlayıcısı değişken).
 *
 * SEÇİM KOPYA DEĞİL, KİMLİKTİR (UI-ADR-098 / `SelectedEntity`). Store'da
 * yalnızca `{workspaceId, kind, id}` durur; panel SKU'yu aynı kanonik
 * kaynaktan `id` ile okur. Nesnenin kopyasını saklamak, listeyi yenileyince
 * panelde BAYAT bir kayıt bırakırdı — kaynağıyla çelişen bir kopya, sahte
 * veriye giden en sessiz yoldur. Kimlik bulunamazsa detay UYDURULMAZ.
 *
 * ANTI-FAKE — bu panelde üç yer bilerek boştur:
 *  · Birim kâr: COGS yok, hesaplanamaz (UI-ADR-099).
 *  · History: SKU olay geçmişi sözleşmesi yok (13-...md §16.2).
 *  · Actions: yazma uçları bağlı değil. Hiçbir şey yapmayan bir düğme,
 *    sahte bir yetenektir; çizilmez.
 */

import type { Alert } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import type { SkuHealth } from "@/types/screens";
import { remainingTime, useNow } from "@/lib/clock/tick";
import { toPercentUnit } from "@/lib/format/percent";
import { useUiStore } from "@/lib/store/ui";
import { amazonAlertsMock, skusMock } from "@/mocks/amazon";
import { useMockData } from "@/mocks/use-mock";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { NoData } from "@/components/ui/no-data";
import { Stat } from "@/components/ui/stat";
import { Heading, Mono, Num, Text } from "@/components/ui/typography";
import { AlertStack } from "@/components/executive/alert-stack";
import { Meter } from "@/components/executive/meter";
import { PROFIT_NEEDS_COGS } from "@/components/executive/ppc-overview";

/** Bu panelin çizildiği seçim türü. App Shell bu sabitle eşleştirir. */
export const AMAZON_SKU_KIND = "sku";

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
  const selected = useUiStore((s) => s.selectedEntity);
  const now = useNow();
  const skus = useMockData(skusMock);
  const alerts = useMockData(amazonAlertsMock);

  /* Kimlikten kanonik kayda: kopya tutulmadığı için burada okunur. */
  const sku =
    selected?.kind === AMAZON_SKU_KIND
      ? (skus.data?.data.find((s) => s.sku === selected.id) ?? null)
      : null;

  if (!selected || selected.kind !== AMAZON_SKU_KIND) return null;

  /* Seçim var ama kayıt yok: liste yenilenmiş ve SKU düşmüş olabilir.
     Detay uydurulmaz — ne olduğu yazılır. */
  if (!sku) {
    return (
      <EmptyState
        title="Seçili SKU artık listede yok"
        description={`${selected.id} kimliği güncel SKU listesinde bulunamadı; veri yenilenmiş olabilir.`}
        suggestion="Tablodan yeniden bir satır seç."
      />
    );
  }

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
            <Stat
              label="Health Score"
              note={sku.healthScore === null ? "skor hesaplanmadı" : undefined}
              value={
                <>
                  <Meter
                    value={sku.healthScore}
                    label={`${sku.sku} sağlık skoru`}
                    tone={sku.status === "critical" ? "danger" : "ai"}
                    noDataReason="Sağlık skoru hesaplanmadı"
                  />
                  <Num value={sku.healthScore} size="sm" noDataReason="Skor yok" />
                </>
              }
            />
          </dl>
        </div>
      </Group>

      {/* 2 — Financial Metrics */}
      <Group title="Financial Metrics">
        <dl className="grid gap-3">
          <Stat
            label="Ciro (30 gün)"
            value={
              <Num
                value={sku.revenueLast30d?.amount ?? null}
                format="currency"
                currency={sku.revenueLast30d?.currency}
                size="lg"
                noDataReason="30 günlük ciro gelmedi"
              />
            }
          />
          <Stat
            label="Fiyat"
            value={
              <Num
                value={sku.price?.amount ?? null}
                format="currency"
                currency={sku.price?.currency}
                noDataReason="Fiyat gelmedi"
              />
            }
          />
          <Stat
            label="Satılan adet (30 gün)"
            value={<Num value={sku.unitsSoldLast30d} noDataReason="Adet gelmedi" />}
          />
          <Stat
            label="Dönüşüm oranı"
            value={
              <Num
                value={toPercentUnit(sku.conversionRate, SKU_SCALE)}
                format="percent"
                fractionDigits={1}
                noDataReason="Dönüşüm oranı ölçülmedi"
              />
            }
          />
          {/* Birim kâr KALICI OLARAK boştur — COGS Amazon'da yoktur. */}
          <Stat
            label="Birim kâr"
            note={PROFIT_NEEDS_COGS}
            value={<NoData reason={PROFIT_NEEDS_COGS} />}
          />
        </dl>
      </Group>

      {/* 3 — Advertising */}
      <Group title="Advertising">
        <dl className="grid gap-3">
          <Stat
            label="Reklam harcaması (30 gün)"
            value={
              <Num
                value={sku.adSpendLast30d?.amount ?? null}
                format="currency"
                currency={sku.adSpendLast30d?.currency}
                noDataReason="Ads API'den harcama gelmedi"
              />
            }
          />
          <Stat
            label="Reklam satışı (30 gün)"
            value={
              <Num
                value={sku.adSalesLast30d?.amount ?? null}
                format="currency"
                currency={sku.adSalesLast30d?.currency}
                noDataReason="Ads API'den satış gelmedi"
              />
            }
          />
          <Stat
            label="ACOS"
            value={
              <Num
                value={toPercentUnit(sku.acos, SKU_SCALE)}
                format="percent"
                fractionDigits={1}
                noDataReason="ACOS hesaplanmadı"
              />
            }
          />
          <Stat
            label="BuyBox oranı"
            value={
              <Num
                value={toPercentUnit(sku.buyBoxRate, SKU_SCALE)}
                format="percent"
                fractionDigits={1}
                noDataReason="BuyBox oranı raporlanmadı"
              />
            }
          />
        </dl>
      </Group>

      {/* 4 — Inventory */}
      <Group title="Inventory">
        <dl className="grid gap-3">
          <Stat
            label="Stok"
            value={
              <>
                <Num value={sku.unitsAvailable} noDataReason="Stok adedi gelmedi" />
                <span className="text-xs text-content-tertiary">adet</span>
              </>
            }
          />
          <Stat
            label="Tahmini tükenme"
            note={sku.estimatedStockoutAt ? "kalan süre" : undefined}
            value={
              /* GELECEK tarih → `remainingTime`. `relativeTime` bir YAŞ
                 fonksiyonudur ve buraya "birazdan" yazardı (S5 dersi). */
              stockout ? (
                <time dateTime={sku.estimatedStockoutAt!} className="text-content">
                  {stockout}
                </time>
              ) : (
                <NoData reason="Tükenme tarihi hesaplanmadı" />
              )
            }
          />
          <Stat
            label="Kalan gün"
            value={<Num value={sku.daysOfSupply} noDataReason="Satış hızı ölçülmedi" />}
          />
          <Stat
            label="Önerilen sipariş"
            value={
              <>
                <Num
                  value={sku.reorderUnits}
                  noDataReason="Sipariş önerisi üretilmedi"
                />
                {sku.reorderUnits !== null && (
                  <span className="text-xs text-content-tertiary">adet</span>
                )}
              </>
            }
          />
        </dl>
      </Group>

      {/* 5 — History: sözleşme YOK (UI-ADR-096 deseni) */}
      <Group title="History">
        <Text size="sm" tone="tertiary">
          SKU olay geçmişi için veri sözleşmesi tanımlı değil. Uydurulmuş bir
          zaman çizgisi göstermek yerine boş bırakıldı; soru
          13-backend-recommendations.md §16.2&apos;ye düşüldü.
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
            (13-...md §16.2).
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
