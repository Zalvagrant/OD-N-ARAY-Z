"use client";

/**
 * Finance — sahibin defter pozisyonu (UI-ADR-195).
 *
 * KAYNAK: `/api/state.finance_position` — ODIN `finance/director.py`
 * `current_position()` hesaplar, arayüz YALNIZ taşır. Kur çevirisi,
 * oran türetme, eşik/renk hükmü YOK (gavadolar 2/2):
 *
 *  · Ekrandaki her tutar ODIN'in bildirdiği para biriminde (`currency`,
 *    bugün TRY). USD gelir/marj bu ekranda ÇİZİLMEZ — onlar briefing'in
 *    şirket KPI'larında kendi para birimleriyle yaşıyor; iki birimi aynı
 *    ekranda toplamak/oranlamak bu reponun en tehlikeli hata sınıfıdır.
 *  · `operating_net` (borç servisi ÖNCESİ) ile `cash_flow_net` (SONRASI)
 *    ayrımı ODIN'in ayrımıdır ve korunur; ikisine de "net kâr" DENMEZ.
 *  · Runway ile hedefi yan yana HAM gösterilir — ikisi de ODIN verisi;
 *    kıyası renklendirmek arayüzün hüküm üretmesi olurdu (UI-ADR-111).
 *  · `source_not_connected` ölçümün kendisidir: bağlı olmayan kaynaklar
 *    ADIYLA listelenir ve onlardan türeyecek hiçbir alan çizilmez.
 */

import {
  demoError,
  screenState,
} from "@/features/shell/screen-state";
import { useOdinFinance, type FinancePosition } from "@/lib/data/odin-state";
import { formatDate } from "@/lib/format/date";
import { Card, CardBody } from "@/components/ui/card";
import { Caption, Money, Num, Pct, Text } from "@/components/ui/typography";
import { NoData } from "@/components/ui/no-data";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

const DEMO_ERROR = demoError(
  "Finans pozisyonu yüklenemedi",
  "Sahibin defter pozisyonu (nakit, aylık akış, runway) görünmüyor."
);

/** Etiket + tutar satırı — tüm bölümler aynı düzeni kullanır. */
function Satir({
  label,
  children,
  note,
}: {
  label: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <div className="min-w-0">
        <Text size="sm">{label}</Text>
        {note ? <Caption className="block">{note}</Caption> : null}
      </div>
      <div className="shrink-0 text-right">{children}</div>
    </div>
  );
}

/** Sahip hedefi — ham aktarım: değer + yön + kaynak, renk/hüküm yok. */
function Hedef({
  target,
  unit,
}: {
  target: { value: string; direction: string; source: string } | null;
  unit: string;
}) {
  if (!target) return <NoData reason="Sahip bu hedefi beyan etmedi" />;
  const DIRECTION: Record<string, string> = { floor: "taban", ceiling: "tavan" };
  return (
    <Text size="sm">
      {target.value} {unit}{" "}
      <Caption>
        ({DIRECTION[target.direction] ?? target.direction} ·{" "}
        {target.source === "owner-declared" ? "sahip beyanı" : target.source})
      </Caption>
    </Text>
  );
}

export function Finance({
  demo,
}: {
  /**
   * Yalnızca Storybook/görsel doğrulama için durum zorlaması.
   * `empty` BEYAN EDİLMİYOR (UI-ADR-174 deseni): pozisyon tek bir
   * nesnedir; cockpit "defter boş"u `null` yayınlar ve o dal HATA olarak
   * çizilir ("boş ya da okunamadı" — cockpit ikisini ayıramıyor).
   */
  demo?: "loading" | "error";
}) {
  const finance = useOdinFinance();
  const zorlama = screenState({
    demo,
    primary: finance,
    sources: [finance],
    error: DEMO_ERROR,
  });

  const error: SectionError | null =
    zorlama.error ??
    (finance.error
      ? {
          what: finance.error.what,
          why: finance.error.why,
          impact: finance.error.impact,
          fix: finance.error.fix,
        }
      : null);

  const p: FinancePosition | null = finance.envelope?.data ?? null;
  const ccy = p?.currency;
  const prov = p?.cashProvenance;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <WorkspaceHeader
        title="Finance"
        context="Sahibin defter pozisyonu — ODIN hesaplar, arayüz taşır"
        lastSync={finance.envelope?.meta.lastUpdated ?? null}
      />

      <Section
        title="Nakit pozisyonu"
        description="Sahip beyanı açılış + nakit defteri hareketleri."
        loading={zorlama.loading}
        error={error}
      >
        {p && (
          <Card>
            <CardBody>
              <Satir
                label={`Nakit (${p.currency})`}
                note={
                  prov
                    ? `Kaynak: ${prov.source === "owner-declared" ? "sahip beyanı" : prov.source ?? "—"} — ${prov.amount} ${prov.currency} × ${prov.fxToTry} kur` +
                      (formatDate(prov.asOf, { dateStyle: "medium" })
                        ? ` · ${formatDate(prov.asOf, { dateStyle: "medium" })}`
                        : "")
                    : undefined
                }
              >
                <Money
                  value={{ amount: p.cashTry, currency: ccy }}
                  noDataReason="ODIN nakit anlık görüntüsü yayınlamadı"
                />
              </Satir>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Aylık akış"
        description={
          p
            ? `Defter penceresi ${p.windowMonths} ay — aylık ortalamalar bu pencereden.`
            : "Aylık ortalamalar defter penceresinden."
        }
        loading={zorlama.loading}
        error={error}
      >
        {p && (
          <Card>
            <CardBody>
              <Satir label="Aylık gelir">
                <Money value={{ amount: p.monthlyRevenue, currency: ccy }} />
              </Satir>
              <Satir label="Aylık işletme gideri">
                <Money value={{ amount: p.monthlyOpex, currency: ccy }} />
              </Satir>
              <Satir label="Aylık borç servisi">
                <Money value={{ amount: p.monthlyDebtService, currency: ccy }} />
              </Satir>
              <Satir
                label="İşletme neti"
                note="Borç servisi ÖNCESİ — net kâr değildir."
              >
                <Money value={{ amount: p.operatingNet, currency: ccy }} />
              </Satir>
              <Satir
                label="Nakit akışı neti"
                note="Borç servisi SONRASI — runway bu sayıdan türer (ODIN'de)."
              >
                <Money value={{ amount: p.cashFlowNet, currency: ccy }} />
              </Satir>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Runway ve borç"
        description="Runway ve hedefler ODIN'den ham aktarılır; kıyas hükmü üretilmez."
        loading={zorlama.loading}
        error={error}
      >
        {p && (
          <Card>
            <CardBody>
              <Satir label="Runway" note={p.runwayNote ?? undefined}>
                {p.runwayMonths === null ? (
                  <NoData reason="ODIN runway yayınlamadı" />
                ) : (
                  <Text size="sm">
                    <Num value={p.runwayMonths} fractionDigits={1} /> ay
                  </Text>
                )}
              </Satir>
              <Satir label="Runway hedefi">
                <Hedef target={p.runwayTarget} unit="ay" />
              </Satir>
              <Satir label="Kalan borç">
                <Money value={{ amount: p.remainingDebt, currency: ccy }} />
              </Satir>
              <Satir label="Kart limit kullanımı">
                <Pct
                  value={p.cardUtilisationPct}
                  scale="0-100"
                  noDataReason="Kart limiti tanımlı değil — oran hesaplanmıyor"
                />
              </Satir>
              <Satir label="Kaldıraç hedefi">
                <Hedef target={p.leverageTarget} unit="ay" />
              </Satir>
            </CardBody>
          </Card>
        )}
      </Section>

      <Section
        title="Zorunlu rezerv"
        description="ODIN'in hesapladığı asgari nakit tamponu."
        loading={zorlama.loading}
        error={error}
      >
        {p &&
          (p.requiredReserve ? (
            <Card>
              <CardBody>
                <Satir
                  label="Zorunlu rezerv"
                  note={`Pencere: ${p.requiredReserve.monthsWindow} ay`}
                >
                  <Money
                    value={{ amount: p.requiredReserve.requiredReserve, currency: ccy }}
                  />
                </Satir>
                <Satir label="Kişisel taban">
                  <Money
                    value={{ amount: p.requiredReserve.personalFloor, currency: ccy }}
                  />
                </Satir>
                <Satir label="Bilinen yükümlülükler">
                  <Money
                    value={{ amount: p.requiredReserve.knownObligations, currency: ccy }}
                  />
                </Satir>
                <Satir label="Kritik yeniden sipariş nakdi">
                  <Money
                    value={{
                      amount: p.requiredReserve.criticalReorderCash,
                      currency: ccy,
                    }}
                  />
                </Satir>
              </CardBody>
            </Card>
          ) : (
            <Card density="compact">
              <CardBody density="compact">
                <NoData reason="ODIN zorunlu rezerv hesabı yayınlamadı" />
              </CardBody>
            </Card>
          ))}
      </Section>

      <Section
        title="Bağlı olmayan kaynaklar"
        description="Bu kaynaklar ODIN'e bağlı değil; onlardan türeyecek hiçbir alan bu ekranda çizilmiyor. Liste ölçümün kendisidir."
        loading={zorlama.loading}
        error={error}
      >
        {p && (
          <Card density="compact">
            <CardBody density="compact">
              {p.sourceNotConnected.length === 0 ? (
                <Text size="sm" tone="tertiary">
                  ODIN bağlı olmayan kaynak bildirmedi.
                </Text>
              ) : (
                <div role="note" aria-label="Bağlı olmayan veri kaynakları">
                  <ul className="flex flex-col gap-1">
                    {p.sourceNotConnected.map((s) => (
                      <li key={s}>
                        <Text size="sm" tone="tertiary">
                          {s} — bağlı değil
                        </Text>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </Section>

      {finance.envelope && (
        <TrustSignal
          meta={finance.envelope.meta}
          refreshFailed={finance.refreshError?.what}
        />
      )}
    </div>
  );
}
