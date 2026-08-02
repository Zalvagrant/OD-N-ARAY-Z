"use client";

/**
 * System · AI Runtime — ODIN'in model kullanımı (UI-ADR-205).
 *
 * S9 "AI Gateway" sprinti maliyet paneli yüzünden ertelenmişti; ERTELEME
 * GEREKÇESİ MALİYETE AİTTİ, ÖLÇÜME DEĞİL. `ai.usage()` çağrı sayısını,
 * model kırılımını, token'ları, gecikmeyi ve hataları başından beri
 * ölçüyordu ve hiçbir ekrana ulaşmıyordu.
 *
 * MALİYET SATIRI ÇİZİLMEZ (meclis 2/2): bugün 12/12 çağrı
 * `cost_known:false`. Ekran "0,00 USD" YAZMAZ — sıfır "bedava" diye
 * okunur. "Bilinmiyor" der ve KAÇ çağrının fiyatsız olduğunu sayar.
 * Token'dan fiyat tahmini yapılmaz.
 *
 * HATA SAYISI ÇAĞRI SAYISININ YANINDA HAM DURUR: başarı oranı
 * türetilmez (UI-ADR-111). Bugün 12 çağrıya 13 hata düşüyor ve bu, bir
 * yüzdeye sıkıştırılmaması gereken bir olgudur.
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinAi } from "@/lib/data/odin-ai";
import { formatDate } from "@/lib/format/date";
import { relativeTime, useNow } from "@/lib/clock/tick";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { Stat } from "@/components/ui/stat";
import { Caption, Mono, Num, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "AI çalışma zamanı okunamadı",
  "Model çağrıları, token'lar ve gecikme güncel değil."
);

export function SystemAiRuntime({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const ai = useOdinAi();
  const now = useNow();

  const zorlama = screenState({
    demo,
    primary: ai,
    sources: [ai],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (ai.error
      ? {
          what: ai.error.what,
          why: ai.error.why,
          impact: ai.error.impact,
          fix: ai.error.fix,
        }
      : null);

  const live = ai.envelope?.data ?? null;
  /** `empty` = "ÖLÇÜLDÜ, hiç model çağrısı yok" — "ölçülmedi" DEĞİL. */
  const a =
    zorlama.isEmpty && live
      ? {
          ...live,
          calls: 0,
          errors: 0,
          byModel: [],
          tokensIn: 0,
          tokensOut: 0,
          costKnownCalls: 0,
          unknownCostCalls: 0,
          latencyMsAvg: null,
          lastSuccessAt: null,
          lastError: null,
          recent: [],
        }
      : live;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <WorkspaceHeader
        title="AI Runtime"
        context="Ölçülen model kullanımı — maliyet ölçülmediği için yazılmıyor"
        lastSync={ai.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Kullanım"
        description="Çağrı ve hata sayıları HAM ve yan yana; başarı oranı türetilmez."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={4}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {a && (
          <Card>
            <CardBody className="flex flex-col gap-6">
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <Stat
                  label="Çağrı"
                  value={<Num value={a.calls} />}
                  note={
                    a.lastSuccessAt
                      ? `son başarılı ${relativeTime(a.lastSuccessAt, now) ?? "—"}`
                      : "hiç başarılı çağrı yok"
                  }
                />
                <Stat
                  label="Hata"
                  value={<Num value={a.errors} />}
                  note="kümülatif — oran türetilmez"
                />
                <Stat
                  label="Token"
                  value={
                    <>
                      <Num value={a.tokensIn} /> / <Num value={a.tokensOut} />
                    </>
                  }
                  note="girdi / çıktı"
                />
                <Stat
                  label="Ortalama gecikme"
                  value={
                    a.latencyMsAvg === null ? (
                      <NoData reason="Hiçbir çağrı gecikme bildirmedi" />
                    ) : (
                      <>
                        <Num
                          value={a.latencyMsAvg / 1000}
                          fractionDigits={1}
                        />{" "}
                        sn
                      </>
                    )
                  }
                  note="çekirdeğin ölçtüğü ortalama"
                />
              </dl>
              {a.lastError && (
                <Text size="sm" tone="tertiary">
                  Son hata:{" "}
                  {formatDate(a.lastError.at, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  · {a.lastError.provider ?? "—"} · {a.lastError.error ?? "—"}
                </Text>
              )}
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Maliyet"
        description="ODIN maliyeti yalnızca çağrı kendi fiyatını bildirdiğinde bilir. Bilinmeyen maliyet SIFIR DEĞİLDİR ve sıfır olarak gösterilmez."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={2}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {a && (
          <Card>
            <CardBody>
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Stat
                  label="Bilinen toplam maliyet"
                  value={
                    a.costUsd === null ? (
                      <NoData reason="Hiçbir çağrı fiyat bildirmedi" />
                    ) : (
                      <>
                        <Num value={a.costUsd} fractionDigits={4} /> USD
                      </>
                    )
                  }
                  note={`${a.costKnownCalls} çağrı fiyat bildirdi`}
                />
                <Stat
                  label="Fiyatsız çağrı"
                  value={<Num value={a.unknownCostCalls} />}
                  note="bu çağrıların bedeli ÖLÇÜLMEDİ — tahmin edilmiyor"
                />
              </dl>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Modeller"
        description="Hangi modelin kaç kez çağrıldığı — çekirdeğin kendi sayımı."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={3}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={a !== null && a.byModel.length === 0}
        emptyTitle="Hiç model çağrılmadı"
        emptyDescription="Telemetride tek bir provider.call kaydı yok."
      >
        {a && a.byModel.length > 0 && (
          <Card>
            <CardBody className="flex flex-col gap-0">
              {a.byModel.map((m) => (
                <div
                  key={m.model}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-1.5 last:border-b-0"
                >
                  <Mono size="sm">{m.model}</Mono>
                  <Caption>
                    <Num value={m.calls} size="sm" /> çağrı
                  </Caption>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Sağlayıcılar"
        description="Anahtarın VARLIĞI okunur, içeriği ASLA. Anahtarı olup hiç çağrılmamış sağlayıcı da burada görünür."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={4}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={a !== null && a.providers.length === 0}
        emptyTitle="Sağlayıcı anahtarı yok"
        emptyDescription="secrets/ dizininde hiçbir anahtar dosyası yok."
      >
        {a && a.providers.length > 0 && (
          <Card>
            <CardBody className="flex flex-wrap gap-2">
              {a.providers.map((p) => (
                <Badge
                  key={p.name}
                  variant={p.keyPresent ? "success" : "danger"}
                  size="xs"
                >
                  {p.name} · {p.keyPresent ? "anahtar var" : "anahtar BOŞ"}
                </Badge>
              ))}
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Son çağrılar"
        description="En yeni üstte. Fiyat bildirmeyen çağrıda maliyet sütunu YOKTUR, sıfır değildir."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={5}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={a !== null && a.recent.length === 0}
        emptyTitle="Kayıtlı çağrı yok"
        emptyDescription="Telemetride son çağrı penceresi boş."
      >
        {a && a.recent.length > 0 && (
          <Card>
            <CardBody className="flex flex-col gap-0">
              {a.recent.map((c, i) => (
                <div
                  key={`${c.at}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-1.5 last:border-b-0"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Badge
                      variant={c.event === "provider.error" ? "danger" : "secondary"}
                      size="xs"
                    >
                      {c.event === "provider.error" ? "hata" : "çağrı"}
                    </Badge>
                    <Mono size="sm">{c.model ?? c.provider ?? "—"}</Mono>
                  </span>
                  <Caption>
                    {c.error
                      ? c.error
                      : `${c.inputTokens ?? 0}/${c.outputTokens ?? 0} token${
                          c.latencyMs !== null
                            ? ` · ${(c.latencyMs / 1000).toFixed(1)} sn`
                            : ""
                        }${c.costKnown ? "" : " · fiyat bildirilmedi"}`}{" "}
                    · {relativeTime(c.at, now) ?? "—"}
                  </Caption>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </Section>

      {ai.envelope && (
        <TrustSignal
          meta={ai.envelope.meta}
          refreshFailed={ai.refreshError?.what}
        />
      )}
    </div>
  );
}
