"use client";

/**
 * CampaignIntelligenceList — PPC Intelligence Center Katman 2.
 * Kaynak: 06-workspaces.md §1.5 K2, 09-data-contracts.md §9.
 *
 * "Kullanıcı kampanyaları tek tek dolaşmaz." AI her kampanyayı analiz eder,
 * ekran yalnızca sonucu ve gerekçesini taşır.
 *
 * SIRALAMA SORUNLUDAN SAĞLIKLIYA. Gerekçe EvidenceChain ile aynıdır: çelişen
 * kanıt listenin dibine gömülmez. Sorunlu kampanyayı alfabetik sıranın
 * ortasına gömmek, onu hiç göstermemekten iyi değildir.
 *
 * ANTI-FAKE:
 *  - Durum RENKLE TAŞINMAZ: her durumun glyph'i ve Türkçe metin etiketi var.
 *  - Önerilen aksiyon açıklanabilirlik şartını (UI-ADR-091) sağlamıyorsa
 *    öneri çizilmez; bastırma gerçeği bu katmanda yazılır — kaç önerinin
 *    neden gösterilmediği görünür.
 */

import { useId, useState } from "react";
import type { CampaignIntelligence, CampaignStatus } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/typography";
import {
  AIRecommendationView,
  canRenderRecommendation,
} from "./ai-recommendation-card";
import { DataGuard } from "./data-guard";
import { Disclosure } from "./disclosure";
import { TrustSignal } from "./trust-signal";

const STATUS: Record<
  CampaignStatus,
  { rank: number; label: string; variant: BadgeVariant }
> = {
  underperforming: { rank: 0, label: "Zayıf performans", variant: "danger" },
  acos_rising: { rank: 1, label: "ACOS yükseliyor", variant: "danger" },
  budget_exhausting: { rank: 2, label: "Bütçe erken bitiyor", variant: "warning" },
  scalable: { rank: 3, label: "Ölçeklenebilir", variant: "success" },
  healthy: { rank: 4, label: "Sağlıklı", variant: "success" },
};

/** Sıralama kuralı tek yerde, test edilebilir. */
export function sortCampaigns(list: CampaignIntelligence[]): CampaignIntelligence[] {
  return [...list].sort(
    (a, b) => (STATUS[a.status]?.rank ?? 9) - (STATUS[b.status]?.rank ?? 9)
  );
}

function CampaignRow({ c }: { c: CampaignIntelligence }) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  const status = STATUS[c.status];
  const actions = c.suggestedActions ?? [];
  const shown = actions.filter(canRenderRecommendation);
  const suppressed = actions.length - shown.length;

  return (
    <li className="border-l-2 border-line pl-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 truncate text-content">{c.name}</span>
        {status ? (
          <Badge variant={status.variant} size="sm">
            {status.label}
          </Badge>
        ) : (
          <Badge variant="tertiary" size="sm">
            Durum bilinmiyor
          </Badge>
        )}
      </div>

      <Text size="sm" tone="secondary" className="mt-1">
        {c.aiSummary}
      </Text>

      {shown.length > 0 && (
        <div className="mt-2">
          <Button
            variant="tertiary"
            size="xs"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={bodyId}
          >
            {open ? "Önerileri kapat" : `Önerilen aksiyon (${shown.length})`}
          </Button>
          <Disclosure open={open} id={bodyId}>
            <div className="mt-3 flex flex-col gap-4">
              {shown.map((rec) => (
                <div key={rec.id} className="odin-ai-region p-3">
                  <AIRecommendationView rec={rec} compact />
                </div>
              ))}
            </div>
          </Disclosure>
        </div>
      )}

      {/* Bastırma gerçeği — UI-ADR-091: bastırmayı bilen katman yazar. */}
      {suppressed > 0 && (
        <Text size="sm" tone="tertiary" className="mt-1">
          {suppressed} öneri açıklanabilirlik şartını sağlamadığı için gösterilmiyor.
        </Text>
      )}
    </li>
  );
}

export function CampaignIntelligenceList({
  env,
  title = "AI Campaign Intelligence",
}: {
  env: DataEnvelope<CampaignIntelligence[]> | null | undefined;
  title?: string;
}) {
  return (
    <DataGuard env={env} reason="Kampanya analizi üretilmedi">
      {(list, meta) => {
        const sorted = sortCampaigns(list);
        return (
          <Card>
            <CardHeader
              title={title}
              description="Katman 2 — sorunlu kampanya üstte, sağlıklı altta"
            />
            <CardBody>
              {sorted.length ? (
                <ul className="flex flex-col gap-4">
                  {sorted.map((c) => (
                    <CampaignRow key={c.campaignId} c={c} />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="Kampanya analizi yok"
                  description="Ads API'den kampanya gelmedi ya da hiçbiri analiz edilmedi."
                  suggestion="Ads API bağlantısını doğrula (13-backend-recommendations.md §4)."
                />
              )}
            </CardBody>
            <CardFooter>
              <TrustSignal meta={meta} />
            </CardFooter>
          </Card>
        );
      }}
    </DataGuard>
  );
}
