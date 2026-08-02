"use client";

/**
 * Yetenek durumu ekranı — ölçülmüş yokluk (UI-ADR-206).
 *
 * TEK EKRAN, DÖRT ROTA: `/amazon/suppliers` · `/trading` ·
 * `/system/network` · `/system/backups`. Bunların ortak yanı veri
 * kaynağının GERÇEKTEN olmaması; ortak olmayan yanı SEBEBİ — ve sebep
 * bu dosyada YAZMAZ, çekirdeğin probundan gelir (gavadolar 2/2).
 *
 * BU BİR PLACEHOLDER DEĞİLDİR. Eski hâli "bu ekran henüz üretilmedi,
 * kendi sprintinde gelecek" diyordu: ölçüme dayanmayan, hiç eskimeyen,
 * kimseye bir şey söylemeyen bir cümle. Buradaki ekran ÖLÇÜLMÜŞ bir
 * durum bildirir — ne eksik, neye bakıldı, ne gerekiyor, ne zaman
 * ölçüldü. Kaynak indiği gün metin KENDİLİĞİNDEN değişir.
 *
 * SAHTE METRİK YOK: tablo, skor, sıfır, boş grafik çizilmez. Yokluğun
 * dürüst hâli boş bir grafik değil, açık bir cümledir.
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinCapability } from "@/lib/data/odin-capability";
import { formatDate } from "@/lib/format/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Caption, Mono, Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

export function CapabilityScreen({
  id,
  title,
  context,
  demo,
}: {
  /** Çekirdeğin yetenek kimliği — gerekçe buradan çözülür. */
  id: string;
  title: string;
  context: string;
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const cap = useOdinCapability(id);

  const zorlama = screenState({
    demo,
    primary: cap,
    sources: [cap],
    error: demoError(
      "Yetenek durumu okunamadı",
      "Bu hedefin neden boş olduğu ölçülemedi."
    ),
  });

  const error: SectionError | null =
    zorlama.error ??
    (cap.error
      ? {
          what: cap.error.what,
          why: cap.error.why,
          impact: cap.error.impact,
          fix: cap.error.fix,
        }
      : null);

  /** `empty` = çekirdek böyle bir yetenek TANIMAMIŞ (id yanlış/kaldırılmış). */
  const c = zorlama.isEmpty ? null : (cap.envelope?.data ?? null);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <WorkspaceHeader
        title={title}
        context={context}
        lastSync={cap.envelope?.meta.lastUpdated ?? null}
      />

      <Section
        title="Durum"
        description="Bu bir placeholder değil, ÖLÇÜLMÜŞ bir yokluktur — gerekçeyi çekirdek üretir."
        loading={zorlama.loading}
        loadingLayout="card"
        loadingCount={1}
        error={error}
        empty={!zorlama.loading && !error && c === null}
        emptyTitle="Bu yetenek çekirdekte tanımlı değil"
        emptyDescription="ODIN bu kimlik için bir prob tanımıyor; menüdeki hedef çekirdekle eşleşmiyor."
      >
        {c && (
          <Card>
            <CardBody className="flex flex-col gap-4">
              <span className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={c.available ? "success" : "warning"}
                  size="xs"
                >
                  {c.available ? "Veri var" : "Veri kaynağı bağlı değil"}
                </Badge>
                <Mono size="sm">{c.id}</Mono>
              </span>

              {c.available ? (
                <Text>
                  Çekirdek bu yetenek için veri bildiriyor ama bu ekran
                  henüz onu çizmiyor — kaynak indi, görünüm bekliyor.
                </Text>
              ) : (
                <Text>{c.reason}</Text>
              )}

              {c.requires && (
                <div className="flex flex-col gap-1.5">
                  <Caption>Ne gerekiyor</Caption>
                  <Text size="sm" tone="tertiary">
                    {c.requires}
                  </Text>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Neye bakıldı"
        description="İddianın dayanağı — gerekçe denetlenebilir olsun diye."
        loading={zorlama.loading}
        loadingLayout="list"
        loadingCount={2}
        error={error}
        empty={c !== null && c.evidence.length === 0}
        emptyTitle="Kanıt bildirilmedi"
        emptyDescription="Prob bir gerekçe verdi ama neye baktığını yazmadı."
      >
        {c && c.evidence.length > 0 && (
          <Card>
            <CardBody className="flex flex-col gap-1.5">
              {c.evidence.map((e) => (
                <Mono key={e} size="sm">
                  {e}
                </Mono>
              ))}
              <Caption>
                Ölçüm:{" "}
                {formatDate(c.measuredAt, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </Caption>
            </CardBody>
          </Card>
        )}
      </Section>

      {cap.envelope && (
        <TrustSignal
          meta={cap.envelope.meta}
          refreshFailed={cap.refreshError?.what}
        />
      )}
    </div>
  );
}
