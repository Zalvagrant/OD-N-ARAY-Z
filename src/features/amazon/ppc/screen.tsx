"use client";

/**
 * Amazon · PPC — reklam performansı (UI-ADR-197).
 *
 * KAYNAK: `/api/amazon.kpis` içindeki beş reklam kalemi — Director'ın
 * kanonik `useAmazonPpc` kancası, ikinci boru yok. Beşi de bugün CANLI
 * (ad_spend · ad_sales · acos · roas · net_after_ads, ADR-0112/FR-0026).
 *
 * KAMPANYA KIRILIMI FAIL-CLOSED: ODIN `/api/amazon`da kampanya kırılımı
 * YAYINLAMIYOR. Veri çekirdekte VAR (`KO-ads-ads_report-2026-07-30`,
 * 94 satır) ama sözleşmesi açılmadı — talep `backend-istekleri.md`'de
 * kayıtlı. `CampaignIntelligenceList` null zarfla "üretilmedi" basar;
 * 94 satırı arayüzün KO'dan okuyup kendi kırılımını üretmesi, çekirdeğin
 * yapmadığı bir değerlendirmeyi arayüzde icat etmek olurdu (UI-ADR-111).
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useAmazonPpc } from "@/lib/data/odin-amazon";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { PPCOverviewCard } from "@/components/executive/ppc-overview";
import { CampaignIntelligenceList } from "@/components/executive/campaign-intelligence";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "PPC özeti okunamadı",
  "Reklam harcaması ve kâra etkisi güncel değil."
);

export function AmazonPpc({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const ppc = useAmazonPpc();

  const zorlama = screenState({
    demo,
    primary: ppc,
    sources: [ppc],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (ppc.error
      ? {
          what: ppc.error.what,
          why: ppc.error.why,
          impact: ppc.error.impact,
          fix: ppc.error.fix,
        }
      : null);

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <WorkspaceHeader
        title="PPC"
        context="Reklamın kâra etkisi — sayılar ODIN'in promote edilmiş reklam raporundan"
        lastSync={ppc.envelope?.meta.lastUpdated ?? null}
      />

      <Section
        title="PPC Performance"
        description="Katman 1 — toplam harcama, reklam satışı, ACOS/ROAS ve reklam sonrası net."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={6}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        <PPCOverviewCard env={zorlama.isEmpty ? null : ppc.envelope} />
      </Section>

      <Section
        title="Kampanya kırılımı"
        description="ODIN /api/amazon'da kampanya kırılımı yayınlamıyor — veri çekirdekte var (94 satırlık reklam raporu) ama sözleşmesi açılmadı; talep backend-istekleri.md'de. Arayüz kendi kırılımını üretmez."
        loading={zorlama.loading}
        loadingLayout="card"
        loadingCount={2}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {/* null zarf → "Kampanya analizi üretilmedi" (DataGuard). Sözleşme
            yayınlandığı gün buraya gerçek zarf bağlanır. */}
        <CampaignIntelligenceList env={null} />
      </Section>

      {ppc.envelope && (
        <TrustSignal
          meta={ppc.envelope.meta}
          refreshFailed={ppc.refreshError?.what}
        />
      )}
    </div>
  );
}
