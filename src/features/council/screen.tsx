"use client";

/**
 * Executive Council — 06-workspaces.md §5.
 *
 * SPESİFİKASYON ON KALEM İSTİYOR, ODIN BEŞİNİ YAYINLIYOR:
 *   ✓ Council Members (oy veren modeller) · Voting · Agreement Score
 *     · Recommendation (öne çıkan seçenek) · Consensus Timeline
 *   ✗ Current Discussion · Arguments · Supporting/Opposing Evidence
 *     · Confidence — `panel_log` bunları taşımıyor
 *
 * AZINLIK GÖRÜŞÜ ÇİZİLMEZ. Panelde karşı oy VAR ama gerekçe YOK; karşı oyu
 * "azınlık görüşü" diye sunmak, kimsenin yazmadığı bir itirazı yazılmış
 * göstermek olurdu. `council-view.tsx` bu ayrımı zaten kilitlemişti
 * ("Azınlık görüşü kaydedilmemiş" ≠ "uzlaşma tam").
 *
 * Uzlaşma ve anlaşmazlık yüzdeleri ODIN'de hesaplanır (`odin/consensus.py`);
 * arayüz oy sayısından yeniden türetmez — iki sayı aynı ekranda çelişirdi.
 */

import {
  demoError,
  emptied,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinCouncil } from "@/lib/data/odin-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Caption, Heading, Text } from "@/components/ui/typography";
import { Section } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { ConsensusIndicator } from "@/components/executive/council-view";

const DEMO_ERROR = demoError(
  "Konsey kaydı okunamadı",
  "Panel geçmişi güncel değil."
);

export function ExecutiveCouncil({ demo }: { demo?: DemoState }) {
  const council = useOdinCouncil();

  const { loading, error, isEmpty, reloadAll } = screenState({
    demo,
    primary: council,
    sources: [council],
    error: DEMO_ERROR,
  });

  const env = isEmpty ? emptied(council.envelope) : council.envelope;
  const panels = env?.data ?? [];

  return (
    <div className="flex max-w-screen-2xl flex-col gap-8">
      <WorkspaceHeader
        title="Executive Council"
        context="Konsey neye, ne kadar uzlaşarak karar verdi?"
        lastSync={council.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Koşmuş paneller"
        description="Her panel: soru, model başına oy ve ODIN'in hesapladığı uzlaşma."
        loading={loading}
        loadingLayout="list"
        loadingCount={3}
        error={error}
        onRetry={reloadAll}
        empty={isEmpty || panels.length === 0}
        emptyTitle="Panel kaydı yok"
        emptyDescription="Henüz konsey paneli koşmadı."
      >
        <div className="flex flex-col gap-4">
          {panels.map((p) => (
            <Card key={`${p.date}-${p.question}`}>
              <CardHeader
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    <Heading level={3} size={4}>
                      {p.question}
                    </Heading>
                    <Badge variant="secondary" size="xs">
                      öne çıkan: {p.leading}
                    </Badge>
                  </span>
                }
                actions={<Caption>{p.date}</Caption>}
              />
              <CardBody className="flex flex-col gap-3">
                <ConsensusIndicator
                  consensus={p.consensus}
                  disagreement={p.disagreement}
                />

                {/* Oylar model adıyla durur: kimin ne dediği gizlenmez.
                    Seçeneğin ADI (A/B'nin karşılığı) ODIN'de yayınlanmıyor,
                    bu yüzden etiket olduğu gibi taşınır — açıklama
                    UYDURULMAZ. */}
                <ul className="flex flex-wrap gap-2">
                  {p.votes.map((v) => (
                    <li key={v.model}>
                      <Badge
                        variant={v.vote === p.leading ? "success" : "secondary"}
                        size="xs"
                      >
                        {v.model}: {v.vote}
                      </Badge>
                    </li>
                  ))}
                </ul>

                <Text size="sm" tone="tertiary">
                  Gerekçe ve kanıt kaydedilmiyor — ODIN panelde yalnız oyu
                  taşıyor.
                </Text>
              </CardBody>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
