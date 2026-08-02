"use client";

/**
 * Projects — ODIN'in talep defteri (UI-ADR-208).
 *
 * ALTINCI ÖLÇÜM DÜZELTMESİ: gece taraması "proje varlığı core'da yok"
 * demişti. ODIN'in işi ADR-0050'den beri R-006'da izleniyor — 129 tipli
 * talep, yedi epic altında. Proje panosu buydu; çalışma zamanında kimse
 * okumuyordu.
 *
 * FİLTRE VE ARAMA GERÇEKTİR: `FilterBar` epic/tip/durum/öncelik ile
 * listeyi daraltır, `Search` başlık ve kimlikte arar, sonuç sayısı
 * ÖLÇÜLMÜŞ olarak yazılır. Dekoratif arama kutusu sahte yetenektir
 * (10-component-library.md) — burada kutu gerçekten filtreliyor.
 *
 * DURUM YENİDEN YAZILMAZ: `status` sahibin cümlesidir ve satırda tam
 * hâliyle durur; rozet `state`tir ve onun YERİNE geçmez.
 */

import { useMemo, useState } from "react";

import {
  demoError,
  screenState,
  sourceUnavailable,
  type DemoState,
} from "@/features/shell/screen-state";
import {
  useOdinRequests,
  type RequestRow,
  type RequestState,
} from "@/lib/data/odin-requests";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FilterBar, type FilterQuery } from "@/components/ui/filter";
import { Search } from "@/components/ui/search";
import { Stat } from "@/components/ui/stat";
import { Caption, Mono, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "Talep defteri okunamadı",
  "R-006 kayıtları ve epic dağılımı güncel değil."
);

/** Çekirdeğin `state` sözlüğü — arayüz değer icat etmez. */
const STATE: Record<RequestState, { label: string; variant: BadgeVariant }> = {
  open: { label: "Açık", variant: "warning" },
  done: { label: "Bitti", variant: "success" },
  dropped: { label: "Düşürüldü", variant: "secondary" },
  unknown: { label: "Durum yazılmamış", variant: "secondary" },
};

export function Projects({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const requests = useOdinRequests();
  const [query, setQuery] = useState<FilterQuery>({});
  const [text, setText] = useState("");

  const zorlama = screenState({
    demo,
    primary: requests,
    sources: [requests],
    error: DEMO_ERROR,
  });

  const live = requests.envelope?.data ?? null;
  /**
   * `empty` = "ÖLÇÜLDÜ, defter boş" — "ölçülmedi" DEĞİL.
   *
   * `useMemo` ŞART: aşağıdaki iki `useMemo` bunu bağımlılık olarak
   * kullanıyor ve her render'da yeni nesne üretmek onları her seferinde
   * yeniden hesaplatırdı (129 satırlık filtre). Kapı bunu uyarı olarak
   * yakaladı.
   */
  const l = useMemo(
    () =>
      zorlama.isEmpty && live
        ? {
            ...live,
            total: 0,
            rows: [],
            byEpic: [],
            byType: [],
            byState: [],
            stateCounts: { open: 0, done: 0, dropped: 0, unknown: 0 },
            byPriority: [],
          }
        : live,
    [zorlama.isEmpty, live]
  );

  const error: SectionError | null =
    zorlama.error ??
    (requests.error
      ? {
          what: requests.error.what,
          why: requests.error.why,
          impact: requests.error.impact,
          fix: requests.error.fix,
        }
      : null) ??
    sourceUnavailable(l, {
      what: "Talep defteri yayınlanmadı",
      impact: "Epic ve talep listesi çizilemiyor.",
      fix: "docs/registries/request-registry.md dosyasını yerine koy.",
    });

  /* Filtreleme ARAYÜZDE: defter bir belgedir, sorgu için uca gidilmez.
     Hesap değil SEÇİMDİR — hiçbir sayı türetilmiyor, satırlar eleniyor. */
  const rows = useMemo(() => {
    const all = l?.rows ?? [];
    const ara = text.trim().toLocaleLowerCase("tr");
    return all.filter((r) => {
      for (const [alan, secili] of Object.entries(query)) {
        if (!secili.length) continue;
        const deger =
          alan === "epic"
            ? (r.epic ?? "—")
            : alan === "type"
              ? r.type
              : alan === "state"
                ? r.state
                : (r.priority ?? "—");
        if (!secili.includes(deger)) return false;
      }
      if (!ara) return true;
      return (
        r.title.toLocaleLowerCase("tr").includes(ara) ||
        r.id.toLocaleLowerCase("tr").includes(ara)
      );
    });
  }, [l, query, text]);

  const filtreler = useMemo(
    () => [
      {
        id: "epic",
        label: "Epic",
        options: (l?.byEpic ?? []).map((b) => ({
          value: b.name,
          label: `${b.name} (${b.count})`,
        })),
      },
      {
        id: "type",
        label: "Tip",
        options: (l?.byType ?? []).map((b) => ({
          value: b.name,
          label: `${b.name} (${b.count})`,
        })),
      },
      {
        id: "state",
        label: "Durum",
        options: (l?.byState ?? []).map((b) => ({
          value: b.name,
          label: `${STATE[b.name as RequestState]?.label ?? b.name} (${b.count})`,
        })),
      },
      {
        id: "priority",
        label: "Öncelik",
        options: (l?.byPriority ?? []).map((b) => ({
          value: b.name,
          label: `${b.name} (${b.count})`,
        })),
      },
    ],
    [l]
  );

  const filtreliMi = Object.keys(query).length > 0 || text.trim().length > 0;

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <WorkspaceHeader
        title="Projects"
        context={
          l?.source
            ? `R-006 talep defteri · ${l.source}`
            : "R-006 talep defteri (ADR-0050)"
        }
        lastSync={requests.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
        search={
          <Search
            placeholder="Talep ara (kimlik ya da başlık)…"
            label="Talep ara"
            historyKey="odin.projects.search"
            resultCount={filtreliMi ? rows.length : null}
            onSearch={setText}
          />
        }
      />

      <Section
        title="Defter"
        description="Her yetenek bir epic altında tipli satır olarak girer (ADR-0050). Sayılar ham; ilerleme yüzdesi türetilmez."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {l && l.available && (
          <Card>
            <CardBody className="flex flex-col gap-6">
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <Stat
                  label="Talep"
                  value={<Num value={l.total} />}
                  note="defterdeki tüm kayıtlar"
                />
                {/* `stateCounts` dört durumu da TAŞIR (adaptör notu):
                    listede olmayan durum ölçülüp sıfır bulunmuştur,
                    ölçülmemiş değildir. */}
                {(["open", "done", "dropped"] as const).map((s) => (
                  <Stat
                    key={s}
                    label={STATE[s].label}
                    value={<Num value={l.stateCounts[s]} />}
                    note="çekirdeğin ilk-kelime okuması"
                  />
                ))}
              </dl>
              <div className="flex flex-col gap-1.5">
                <Caption>Epic dağılımı</Caption>
                <div className="flex flex-wrap gap-2">
                  {l.byEpic.map((b) => (
                    <Badge key={b.name} variant="secondary" size="xs">
                      {b.name} · {b.count}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Talepler"
        description="Filtre ve arama GERÇEKTEN daraltır; sonuç sayısı ölçülmüştür."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={8}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={l !== null && l.available && l.rows.length === 0}
        emptyTitle="Defter boş"
        emptyDescription="R-006'da hiç talep satırı yok."
      >
        {l && l.available && l.rows.length > 0 && (
          <div className="flex flex-col gap-4">
            <FilterBar
              filters={filtreler}
              query={query}
              onChange={setQuery}
            />
            <Caption>
              {filtreliMi ? (
                <>
                  <Num value={rows.length} size="sm" /> / {l.total} talep
                  gösteriliyor
                </>
              ) : (
                <>
                  <Num value={l.total} size="sm" /> talep
                </>
              )}
            </Caption>

            {rows.length === 0 ? (
              /* Filtre sonucu boş olmak, DEFTERİN boş olmasıyla aynı şey
                 değildir; ikisi ayrı cümleyle söylenir. */
              <Card>
                <CardBody>
                  <Text>
                    Bu filtreyle eşleşen talep yok. Filtreleri temizleyip
                    yeniden dene.
                  </Text>
                </CardBody>
              </Card>
            ) : (
              rows.map((r: RequestRow) => (
                <Card key={r.id}>
                  <CardBody className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Mono size="sm">{r.id}</Mono>
                        <Badge variant="secondary" size="xs">
                          {r.type}
                        </Badge>
                        <Badge variant={STATE[r.state].variant} size="xs">
                          {STATE[r.state].label}
                        </Badge>
                      </span>
                      <Caption>
                        {r.epic ?? "epic yok"}
                        {r.priority ? ` · ${r.priority}` : ""}
                      </Caption>
                    </div>
                    <Text>{r.title}</Text>
                    {r.status ? (
                      <Text size="sm" tone="tertiary">
                        {r.status}
                      </Text>
                    ) : (
                      <Caption>Durum yazılmamış</Caption>
                    )}
                    {r.closedBy ? (
                      <Caption>kapatan: {r.closedBy}</Caption>
                    ) : null}
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        )}
      </Section>

      {requests.envelope && (
        <TrustSignal
          meta={requests.envelope.meta}
          refreshFailed={requests.refreshError?.what}
        />
      )}
    </div>
  );
}
