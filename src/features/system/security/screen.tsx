"use client";

/**
 * System · Security — ölçülen olgular, puan YOK (UI-ADR-209).
 *
 * YEDİNCİ ÖLÇÜM DÜZELTMESİ, ama yarısı: gece taraması "güvenlik
 * telemetrisi yayınlanmıyor" diyordu ve bu PUAN için doğru. ODIN'in
 * tarayıcısı yok; 0-100'lük bir güvenlik sayısı en tehlikeli uydurma
 * olurdu ve bu ekran onu ÜRETMEZ — reddin gerekçesi ekranın en üstünde
 * durur.
 *
 * Ama beş olgu her gün ölçülüyordu ve hiçbiri görünmüyordu: soketin
 * bağlı olduğu adres · sır dosyalarının varlığı ve BOŞLUĞU · vault'un
 * kendi erişim/ıskalama izi · konsolun komut yüzeyi · kapıda bekleyen
 * incelenmemiş kayıt.
 *
 * BAĞLAMA SOKETTEN OKUNUR: "kod 127.0.0.1 diyor" bir iddiadır, "soket
 * 127.0.0.1'e bağlı" bir ölçümdür. Bu ekranda yalnız ikincisi yazar.
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinSecurity } from "@/lib/data/odin-security";
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
  "Güvenlik olguları okunamadı",
  "Bağlama, sır envanteri ve denetim izi güncel değil."
);

export function SystemSecurity({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const security = useOdinSecurity();
  const now = useNow();

  const zorlama = screenState({
    demo,
    primary: security,
    sources: [security],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (security.error
      ? {
          what: security.error.what,
          why: security.error.why,
          impact: security.error.impact,
          fix: security.error.fix,
        }
      : null);

  const live = security.envelope?.data ?? null;
  /** `empty` = "ÖLÇÜLDÜ, hiçbir olgu bulunamadı" (boş kurulum). */
  const s =
    zorlama.isEmpty && live
      ? {
          ...live,
          secrets: { count: 0, empty: [], files: [] },
          audit: {
            accesses: 0,
            misses: 0,
            lastAccessAt: null,
            lastMissAt: null,
            missingNames: [],
          },
        }
      : live;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <WorkspaceHeader
        title="Security"
        context="Ölçülen olgular — güvenlik PUANI üretilmez"
        lastSync={security.envelope?.meta.lastUpdated ?? null}
        actions={
          <Button variant="tertiary" size="sm" onClick={zorlama.reloadAll}>
            Yenile
          </Button>
        }
      />

      <Section
        title="Neden puan yok"
        description="Bu ekranın ilk bilgisi, üretmediği şeydir."
        loading={zorlama.loading}
        loadingLayout="card"
        loadingCount={1}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {s && (
          <Card>
            <CardBody>
              <Text>{s.scoreReason}</Text>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Saldırı yüzeyi"
        description="Soketin GERÇEKTEN bağlı olduğu adres ve konsolun çalıştırabileceği komut sayısı."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={3}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {s && (
          <Card>
            <CardBody className="flex flex-col gap-6">
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                <Stat
                  label="Bağlı adres"
                  value={
                    s.binding.host === null ? (
                      <NoData reason="Sunucu adresi ölçülemedi" />
                    ) : (
                      <Mono size="sm">
                        {s.binding.host}:{s.binding.port}
                      </Mono>
                    )
                  }
                  note={
                    s.binding.measured
                      ? "çalışan soketten ölçüldü"
                      : "ölçülmedi — koddan varsayılmadı"
                  }
                />
                <Stat
                  label="Dışa açık mı"
                  value={
                    s.binding.loopbackOnly === null ? (
                      <NoData reason="Bağlama ölçülmedi" />
                    ) : (
                      <Badge
                        variant={s.binding.loopbackOnly ? "success" : "danger"}
                        size="xs"
                      >
                        {s.binding.loopbackOnly
                          ? "Yalnız loopback"
                          : "DIŞA AÇIK"}
                      </Badge>
                    )
                  }
                  note="ADR-0025/0028 — cockpit sahibin yerel yüzeyidir"
                />
                <Stat
                  label="Konsol komutu"
                  value={<Num value={s.console.count} />}
                  note="beyaz listedeki tüm fiiller"
                />
              </dl>
              <div className="flex flex-col gap-1.5">
                <Caption>İzin verilen komutlar</Caption>
                <div className="flex flex-wrap gap-2">
                  {s.console.allowedCommands.map((c) => (
                    <Badge key={c} variant="secondary" size="xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Kimlik bilgileri"
        description="Yalnız AD ve DOLU MU okunur — içerik asla (SEC2). Boş bir anahtar dosyası, yapılandırılmış görünen bozuk bir kimliktir."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={4}
        error={error}
        onRetry={zorlama.reloadAll}
        empty={s !== null && s.secrets.count === 0}
        emptyTitle="Kayıtlı anahtar yok"
        emptyDescription="secrets/ dizininde hiçbir anahtar dosyası bulunmuyor."
      >
        {s && s.secrets.count > 0 && (
          <Card>
            <CardBody className="flex flex-col gap-3">
              {s.secrets.empty.length > 0 && (
                <Text size="sm" tone="tertiary">
                  BOŞ anahtar: {s.secrets.empty.join(", ")} — dosya var ama
                  içerik yok; kimlik doğrulama sessizce başarısız olur.
                </Text>
              )}
              <div className="flex flex-wrap gap-2">
                {s.secrets.files.map((f) => (
                  <Badge
                    key={f.name}
                    variant={f.present ? "success" : "danger"}
                    size="xs"
                  >
                    {f.name} · {f.present ? "dolu" : "BOŞ"}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Denetim izi"
        description="Vault'un kendi kaydı. ISKALAMA da sayılır: istenip bulunamayan bir ad ya yapılandırma eksiğidir ya da olmayan bir kimliğin aranmasıdır."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={2}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {s && (
          <Card>
            <CardBody className="flex flex-col gap-6">
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Stat
                  label="Erişim"
                  value={<Num value={s.audit.accesses} />}
                  note={
                    s.audit.lastAccessAt
                      ? `son ${relativeTime(s.audit.lastAccessAt, now) ?? "—"}`
                      : "hiç erişim yok"
                  }
                />
                <Stat
                  label="Iskalama"
                  value={<Num value={s.audit.misses} />}
                  note={
                    s.audit.lastMissAt
                      ? `son ${relativeTime(s.audit.lastMissAt, now) ?? "—"}`
                      : "hiç ıskalama yok"
                  }
                />
              </dl>
              {s.audit.missingNames.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <Caption>Aranıp bulunamayan adlar</Caption>
                  <div className="flex flex-wrap gap-2">
                    {s.audit.missingNames.map((m) => (
                      <Badge key={m.name} variant="warning" size="xs">
                        {m.name} · {m.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Yönetişim kapısı"
        description="İçeri girmiş ama hiçbir insanın onaylamadığı kayıt (ADR-0004 karantinası)."
        loading={zorlama.loading}
        loadingLayout="kpi"
        loadingCount={1}
        error={error}
        onRetry={zorlama.reloadAll}
      >
        {s && (
          <Card density="compact">
            <CardBody density="compact">
              <dl>
                <Stat
                  label="Kapıda bekleyen"
                  value={
                    s.gate.stagedPending === null ? (
                      <NoData reason="Staging deposu okunamadı" />
                    ) : (
                      <Num value={s.gate.stagedPending} />
                    )
                  }
                  note="incelenmemiş kayıt — bir hata değil, bir maruziyet"
                />
              </dl>
            </CardBody>
          </Card>
        )}
      </Section>

      {security.envelope && (
        <TrustSignal
          meta={security.envelope.meta}
          refreshFailed={security.refreshError?.what}
        />
      )}
    </div>
  );
}
