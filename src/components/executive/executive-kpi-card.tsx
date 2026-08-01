"use client";

/**
 * ExecutiveKPICard — ODIN **ADR-0143 §2** sınır zarfının kartı.
 * Kaynak: 05-dashboard.md §4 (anatomi) · 09b §10.
 *
 * ⚠️ KART TEK KATMANA İNDİ (ADR-0143 §2). Eski Level 2/3 —
 * AI yorumu · confidence · forecast · risk · önerilen aksiyon — ODIN'in
 * yayınladığı zarfın PARÇASI DEĞİLDİR; ADR "gerçek kaynakları oluşana kadar
 * beklerler" diyor. Açılır bölümü bırakıp içini `NoData` ile doldurmak,
 * olmayan bir yeteneği varmış gibi göstermektir (UI-ADR-104 dersi: kalıcı
 * boş kalacak alan sahte kapasitedir). Katmanlar, kaynakları ODIN'de
 * doğduğunda ayrı bir kararla geri gelir.
 *
 * ANTI-FAKE:
 *  - Zarf boşsa kart hiç çizilmez (DataGuard).
 *  - `status !== "available"` → sayı değil, zarfın kendi GEREKÇESİ basılır.
 *    Literal "Data Required" sayısal alana asla girmez (ADR-0135).
 *  - `unit: "percent"` ve `scale` yoksa değer gösterilmez (UI-ADR-093).
 */

import type { ExecutiveKPI, MetricReportPeriod } from "@/types/executive";
import { formatDate } from "@/lib/format/date";
import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import { PERCENT_SCALE_MISSING, percentFactor } from "@/lib/format/percent";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Heading, Num, Text } from "@/components/ui/typography";
import { DataGuard } from "./data-guard";
import { ThresholdNote } from "./threshold-note";
import { TrustSignal } from "./trust-signal";

/**
 * UI-ADR-093 — yüzde ölçeği TAHMİN EDİLMEZ.
 * `factor === null` → ölçek bildirilmemiş, değer gösterilmez.
 * 18.1'i 0.181 sanmak %1810 yazmaktır; sessiz 100 kat hata, sahte veriden
 * daha tehlikelidir çünkü makul görünür.
 */
function numProps(kpi: Pick<ExecutiveKPI, "unit" | "currency" | "scale">) {
  switch (kpi.unit) {
    case "currency":
      return {
        format: "currency" as const,
        currency: kpi.currency,
        factor: 1 as number | null,
        fractionDigits: undefined as number | undefined,
      };
    case "percent":
      return {
        format: "percent" as const,
        currency: undefined,
        factor: percentFactor(kpi.scale),
        /* Intl varsayılanı yuvarlar: ACOS 18.1 → "%18". Amazon tarafında o
           ondalık karar değiştirir, bilgi kaybı kabul edilemez. */
        fractionDigits: 1 as number | undefined,
      };
    default:
      return {
        format: "compact" as const,
        currency: undefined,
        factor: 1 as number | null,
        fractionDigits: undefined as number | undefined,
      };
  }
}

function KPIView({ kpi, meta }: { kpi: ExecutiveKPI; meta: DataMeta }) {
  const { format, currency, factor, fractionDigits } = numProps(kpi);

  const available = kpi.status === "available";
  const shown =
    available && factor !== null && Number.isFinite(kpi.value as number)
      ? (kpi.value as number) * factor
      : null;

  /* Neden gösterilmediği HER ZAMAN yazılır: önce zarfın kendi gerekçesi,
     sonra ölçek eksikliği, en sonda genel hâl. */
  const reason = !available
    ? (kpi.reason ?? "Değer üretilmedi")
    : factor === null
      ? PERCENT_SCALE_MISSING
      : `${kpi.label} hesaplanamadı`;

  return (
    <Card>
      <CardHeader
        title={
          <Heading level={3} size={4}>
            {kpi.label}
          </Heading>
        }
      />

      <CardBody>
        {/* min-w-0: değer bloğu esneyebilsin. Olmadan blok, içindeki
            BÖLÜNEMEZ para sayısı kadar geniş olmayı dayatır ve dar kolonda
            satırı kartın dışına iter. Kartın kendisi kaç kolona sığdığını
            bilemez — kolon genişliği kuralı çağıranın gridindedir. */}
        <div className="min-w-0">
          <Num
            value={shown}
            format={format}
            currency={currency}
            fractionDigits={fractionDigits}
            size="3xl"
            noDataReason={reason}
          />
          {/* Sayının HEMEN altında: "kritik" hükmünün onaylanmamış bir
              eşikten geldiğini görmeyen okur, ölçülmüş bir sayıyı
              kararlaştırılmış bir sınırla karıştırır (UI-ADR-126). */}
          {/* Dönem, değerin hemen altında ve kompakt: "38 adet" ile
              "hangi 38 gün" ayrı bilgilerdir ve kart kendi kendini
              anlatmalıdır (UI-ADR-140). */}
          {periodLabel(kpi.reportPeriod) && (
            <Text size="sm" tone="tertiary" className="mt-1">
              {periodLabel(kpi.reportPeriod)}
            </Text>
          )}
          <ThresholdNote provenance={kpi.thresholdProvenance} className="mt-1" />
        </div>
      </CardBody>

      <CardFooter>
        <TrustSignal meta={meta} />
      </CardFooter>
    </Card>
  );
}


/**
 * ODIN'in bildirdiği ölçüm penceresini okunur yazar — UI-ADR-140.
 *
 * HESAP YOK, ÇEVİRİ VAR: kayan pencerenin başlangıcı burada
 * TÜRETİLMEZ. Kayıt "30 Temmuz'da biten 7 günlük pencere" diyorsa ekran
 * da onu der; sabit bir tarihe çevirmek kaydın söylemediği bir kesinlik
 * iddia etmek olurdu.
 *
 * HER KARTTA gösterilir, yalnız farklı olanlarda değil (meclis · luna):
 * dönemi karttan koparmak bağlamı da koparır ve ekran okuyucuda metrik
 * penceresiz kalır. Bugün üç farklı pencere yan yanadır.
 */
function periodLabel(p: MetricReportPeriod | null | undefined): string | null {
  if (!p) return null;
  /* Geçersiz tarih ÇÖKERTMEZ — `formatDate` null döner (UI-ADR-158). */
  const d = (iso: string) => formatDate(iso, { day: "2-digit", month: "short" });
  if (p.basis === "as_of" || p.at) return "anlık";
  if (typeof p.windowDays === "number" && p.end) {
    const bitis = d(p.end);
    /* Tarih okunamıyorsa pencere yine de söylenir — sayı ölçülmüştür,
       yalnız damgası bozuktur. Tamamen susmak bilgiyi de götürürdü. */
    return bitis ? `son ${p.windowDays} gün · ${bitis}'e kadar` : `son ${p.windowDays} gün`;
  }
  if (p.start && p.end) {
    const a = d(p.start);
    const b = d(p.end);
    return a && b ? `${a} – ${b}` : null;
  }
  if (p.end) return `${d(p.end)}'e kadar`;
  return null;
}

export function ExecutiveKPICard({
  env,
}: {
  env: DataEnvelope<ExecutiveKPI> | null | undefined;
}) {
  return (
    <DataGuard env={env} reason="KPI verisi yok">
      {(kpi, meta) => <KPIView kpi={kpi} meta={meta} />}
    </DataGuard>
  );
}
