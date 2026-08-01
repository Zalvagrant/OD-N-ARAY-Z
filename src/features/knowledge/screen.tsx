"use client";

/**
 * Knowledge Workspace — 06-workspaces.md §3.
 *
 * SPESİFİKASYON ON ÜÇ ÖZELLİK İSTİYOR, ODIN BİRİNİ YAYINLIYOR:
 *   ✓ Envanter (promote edilmiş kayıtlar, kaynağı ve güveniyle)
 *   ✗ Semantic Search · Knowledge Graph · Memory Graph · Evidence Explorer
 *     · Citation Viewer · Relationship Explorer · Knowledge Timeline
 *     · Document Viewer · Contradictions · Related Decisions
 *     — hiçbirinin ucu yayınlanmıyor
 *
 * GRAF ÇİZİLMİYOR ve sebebi bir SAYIYLA söyleniyor: ODIN'de 36 varlık var
 * ama **sıfır ilişki** kayıtlı. Otuz altı bağlantısız düğümü "graf" diye
 * çizmek, olmayan bir yapıyı varmış gibi göstermek olurdu.
 *
 * ÇEKİRDEK ile KARANTİNA ayrı: burada yalnız promote edilmiş kayıtlar var
 * (ADR-0004). Staging sayısı ayrıca gösteriliyor çünkü 340 bekleyen kayıt,
 * 36 kabul edilmiş kaydın bağlamıdır — ama ikisi aynı listede DEĞİL.
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinKnowledge } from "@/lib/data/odin-state";
import { relativeTime, useNow } from "@/lib/clock/tick";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Caption, Heading, Num, Text } from "@/components/ui/typography";
import { Stat } from "@/components/ui/stat";
import { Section } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { DataGuard } from "@/components/executive/data-guard";

const DEMO_ERROR = demoError(
  "Bilgi çekirdeği okunamadı",
  "Kayıtlar güncel değil."
);

export function KnowledgeWorkspace({ demo }: { demo?: DemoState }) {
  const knowledge = useOdinKnowledge();
  const now = useNow();

  const { loading, error, isEmpty, reloadAll } = screenState({
    demo,
    primary: knowledge,
    sources: [knowledge],
    error: DEMO_ERROR,
  });

  return (
    <div className="flex max-w-screen-2xl flex-col gap-8">
      <WorkspaceHeader
        title="Knowledge"
        context="ODIN neyi biliyor ve nereden biliyor?"
        lastSync={knowledge.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Çekirdek"
        description="Promote edilmiş kayıtlar — karantinadakiler ayrı sayılır."
        loading={loading}
        loadingLayout="list"
        loadingCount={4}
        error={error}
        onRetry={reloadAll}
        empty={isEmpty}
        emptyTitle="Bilgi kaydı yok"
        emptyDescription="ODIN henüz kayıt promote etmedi."
      >
        <DataGuard env={knowledge.envelope} reason="Bilgi verisi yok">
          {(k) => (
            <div className="flex flex-col gap-6">
              <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0">
                <Stat
                  label="Çekirdek kaydı"
                  note="promote edilmiş"
                  value={<Num value={k.objects.length} size="lg" noDataReason="Sayılmadı" />}
                />
                <Stat
                  label="Karantinada"
                  note={
                    k.stagingAvgTrust !== null
                      ? `ort. güven ${k.stagingAvgTrust}`
                      : "güven ölçülmedi"
                  }
                  value={<Num value={k.stagingCount} size="lg" noDataReason="Sayılmadı" />}
                />
                <Stat
                  label="Graf varlığı"
                  value={
                    <Num
                      value={k.graph?.entities ?? null}
                      size="lg"
                      noDataReason="Graf okunamadı"
                    />
                  }
                />
                <Stat
                  label="Graf ilişkisi"
                  /* SIFIR ÖLÇÜLMÜŞ SIFIRDIR: kayıt yok demek, okunamadı
                     demek değil. Bu yüzden NoData değil, "0" yazıyor. */
                  note="kayıtlı ilişki"
                  value={
                    <Num
                      value={k.graph?.relationships ?? null}
                      size="lg"
                      noDataReason="Graf okunamadı"
                    />
                  }
                />
              </dl>

              {k.graph?.relationships === 0 ? (
                <Text size="sm" tone="tertiary">
                  Graf görünümü çizilmiyor: {k.graph.entities} varlık var ama
                  hiç ilişki kayıtlı değil. Bağlantısız düğümleri graf diye
                  göstermek, olmayan bir yapıyı varmış gibi sunmak olurdu.
                </Text>
              ) : null}

              <div className="flex flex-col gap-3">
                {k.objects.map((o) => (
                  <Card key={o.id}>
                    <CardHeader
                      title={
                        <span className="flex flex-wrap items-center gap-2">
                          <Heading level={3} size={4}>
                            {o.title}
                          </Heading>
                          <Badge variant="secondary" size="xs">
                            {o.type}
                          </Badge>
                          {o.domain ? (
                            <Badge variant="secondary" size="xs">
                              {o.domain}
                            </Badge>
                          ) : null}
                        </span>
                      }
                      actions={
                        <Caption>
                          güven{" "}
                          <Num
                            value={o.trust}
                            size="sm"
                            noDataReason="Güven ölçülmedi"
                          />
                        </Caption>
                      }
                    />
                    <CardBody className="flex flex-col gap-2">
                      {o.topics.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {o.topics.map((t) => (
                            <li key={t}>
                              <Badge variant="secondary" size="xs">
                                {t}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <Caption>
                        {/* Kaynak ve onaylayan GİZLENMEZ: alıntılanabilir
                            bir kaydın kimden geldiği kaydın parçasıdır
                            (ADR-0081 provenance zorunluluğu). */}
                        {o.id} · durum {o.lifecycleState} · kaynak{" "}
                        {o.source ?? "—"} · onaylayan {o.approvedBy ?? "—"}
                        {o.promotedAt
                          ? ` · promote ${relativeTime(o.promotedAt, now) ?? ""}`
                          : ""}
                      </Caption>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DataGuard>
      </Section>
    </div>
  );
}
