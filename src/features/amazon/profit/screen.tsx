"use client";

/**
 * Amazon · Profit — ODIN'in ölçtüğü kâr zinciri (UI-ADR-204).
 *
 * BEŞİNCİ ÖLÇÜM DÜZELTMESİ: gece taraması "SKU bazlı gerçek kâr COGS
 * ister; COGS kapsamı SAHİP KARARI bekliyor" demişti. Doğru ama EKSİK:
 * TOPLAM kâr zinciri bugün TAMAMEN ÖLÇÜLÜ — 42/42 ASIN eşleşmiş, 0
 * eşleşmemiş birim. Bekleyen sahip kararı SKU KIRILIMI içindir, toplam
 * için değil. Bu ekran ölçüleni gösterir, bekleyeni adıyla bildirir.
 *
 * "NET KÂR" KELİMESİ BU EKRANDA GEÇMEZ (UI-ADR-116). Zincirin son
 * halkası KATKI MARJIDIR; kayıt neyi hariç tuttuğunu kendisi söylüyor
 * (iadeler, reklam). Reklam ayrı bir katmanda, kendi kaydından gelir.
 *
 * HESAP YOK: her tutar ve her yüzde çekirdeğin yayınıdır.
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinProfit } from "@/lib/data/odin-state";
import { useAmazonPpc } from "@/lib/data/odin-amazon";
import { formatDate } from "@/lib/format/date";
import { toPercentUnit } from "@/lib/format/percent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { Stat } from "@/components/ui/stat";
import { Caption, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "Kâr zinciri okunamadı",
  "Ciro, maliyet ve katkı marjı güncel değil."
);

function Money({
  value,
  currency,
}: {
  value: number | null;
  currency: string | null;
}) {
  if (value === null) return <NoData reason="Çekirdek bu tutarı yayınlamıyor" />;
  return (
    <span className="tabular-nums">
      <Num value={value} fractionDigits={2} /> {currency ?? ""}
    </span>
  );
}

export function AmazonProfit({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const profit = useOdinProfit();
  const ppc = useAmazonPpc();

  const zorlama = screenState({
    demo,
    primary: profit,
    sources: [profit, ppc],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (profit.error
      ? {
          what: profit.error.what,
          why: profit.error.why,
          impact: profit.error.impact,
          fix: profit.error.fix,
        }
      : null);

  const live = profit.envelope?.data ?? null;
  /** `empty` = "ölçüldü, kâr kaydı yok" — çekirdek `null` yayınlamış. */
  const p = zorlama.isEmpty ? null : live;
  const ads = zorlama.isEmpty ? null : (ppc.envelope?.data ?? null);
  const cur = p?.currency ?? null;

  const acosPct =
    ads && ads.acos !== null
      ? toPercentUnit(ads.acos, ads.percentScale)
      : null;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <WorkspaceHeader
        title="Profit"
        context="Ciro → maliyet → ücretler → KATKI. Net kâr değildir; hariç tutulanlar aşağıda."
        lastSync={profit.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Kâr zinciri"
        description="Her tutar ve her yüzde ODIN'in yayınıdır — arayüz çıkarma yapmaz."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={5}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={!zorlama.loading && !error && p === null}
        emptyTitle="Kâr kaydı ölçülemedi"
        emptyDescription="Katalog ya da maliyet kaydı promote edilmemiş; çekirdek katkı marjı yayınlamıyor."
      >
        {p && (
          <Card>
            <CardBody className="flex flex-col gap-6">
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                <Stat
                  label="Ciro"
                  value={<Money value={p.revenue} currency={cur} />}
                  note={`${p.units} birim · ${p.asinsMatched}/${p.asinsTotal} ASIN eşleşti`}
                />
                <Stat
                  label="Ürün maliyeti (COGS)"
                  value={<Money value={p.cogs} currency={cur} />}
                  note="maliyet beyanlarından"
                />
                <Stat
                  label="Brüt kâr"
                  value={<Money value={p.grossProfit} currency={cur} />}
                  note={
                    <>
                      %<Num value={p.grossMarginPct} fractionDigits={1} size="sm" />{" "}
                      brüt marj
                    </>
                  }
                />
                <Stat
                  label="Amazon ücretleri"
                  value={<Money value={p.fees} currency={cur} />}
                  note="komisyon + diğer"
                />
                <Stat
                  label="Katkı"
                  value={<Money value={p.contribution} currency={cur} />}
                  note={
                    <>
                      %<Num value={p.marginPct} fractionDigits={1} size="sm" />{" "}
                      katkı marjı — NET KÂR DEĞİL
                    </>
                  }
                />
                <Stat
                  label="Sahibin hedefi"
                  value={
                    p.target ? (
                      <>
                        %<Num value={Number(p.target.value)} />
                      </>
                    ) : (
                      <NoData reason="Sahip hedef beyan etmedi" />
                    )
                  }
                  note={
                    p.target
                      ? `${p.target.direction === "floor" ? "taban" : p.target.direction} · ${p.target.period ?? ""} (${p.target.source ?? "beyan"})`
                      : "—"
                  }
                />
              </dl>
              {p.unmatchedUnits > 0 && (
                <Text size="sm" tone="tertiary">
                  {p.unmatchedUnits} birimin maliyeti bilinmiyor ve bu
                  satırlar zincire KATILMADI — dahil edilseydi marj olduğundan
                  yüksek görünürdü.
                </Text>
              )}
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Reklam katmanı"
        description="Reklam katkı marjının DIŞINDADIR; ayrı kayıttan gelir ve ayrı gösterilir."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={3}
        error={
          error ??
          (ppc.error
            ? {
                what: ppc.error.what,
                why: ppc.error.why,
                impact: "Reklam sonrası kalan tutar çizilemiyor.",
                fix: ppc.error.fix,
              }
            : null)
        }
        onRetry={zorlama.reloadAll}
      >
        {ads && (
          <Card>
            <CardBody>
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <Stat
                  label="Reklam harcaması"
                  value={
                    <Money
                      value={ads.spend.amount}
                      currency={ads.spend.currency}
                    />
                  }
                  note="ölçülen dönem reklam kaydında"
                />
                <Stat
                  label="Reklam satışı"
                  value={
                    <Money
                      value={ads.sales.amount}
                      currency={ads.sales.currency}
                    />
                  }
                  note="reklama atfedilen satış"
                />
                <Stat
                  label="ACOS"
                  value={
                    acosPct === null ? (
                      <NoData reason="Ölçek bildirilmedi" />
                    ) : (
                      <>
                        %<Num value={acosPct * 100} fractionDigits={2} />
                      </>
                    )
                  }
                  note={
                    <>
                      ROAS <Num value={ads.roas} fractionDigits={2} size="sm" />
                    </>
                  }
                />
                <Stat
                  label="Reklam sonrası"
                  value={
                    <Money
                      value={ads.profitAfterAds?.amount ?? null}
                      currency={ads.profitAfterAds?.currency ?? null}
                    />
                  }
                  note="çekirdeğin net_after_ads yayını"
                />
              </dl>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Bu sayı neden net kâr değil"
        description="Zincirin dışında kalanlar — kaydın kendi beyanı, arayüzün yorumu değil."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={2}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {p && (
          <Card>
            <CardBody className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Caption>Katkı marjının HARİÇ tuttukları</Caption>
                <div className="flex flex-wrap gap-2">
                  {p.excludes.map((e) => (
                    <Badge key={e} variant="warning" size="xs">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
              {p.dated === false && (
                <Text size="sm" tone="tertiary">
                  Kayıt kendi tarihlemesini eksik bildiriyor: maliyet
                  beyanları{" "}
                  {p.declaredFrom
                    ? formatDate(p.declaredFrom, { dateStyle: "medium" })
                    : "—"}
                  &apos;den geçerli, ölçülen dönem ise{" "}
                  {p.periodEnd
                    ? formatDate(p.periodEnd, { dateStyle: "medium" })
                    : "—"}{" "}
                  bitiyor. Yani bu marj o dönemi TARİHLENDİRMİYOR.
                </Text>
              )}
              <Text size="sm" tone="tertiary">
                SKU kırılımlı kâr burada YOK: COGS kapsamı sahip kararı
                bekliyor. Toplam zincir ölçülü ({p.asinsMatched}/
                {p.asinsTotal} ASIN), kırılım değil.
              </Text>
            </CardBody>
          </Card>
        )}
      </Section>

      {profit.envelope && (
        <TrustSignal
          meta={profit.envelope.meta}
          refreshFailed={profit.refreshError?.what}
        />
      )}
    </div>
  );
}
