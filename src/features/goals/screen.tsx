"use client";

/**
 * Hedefler — ODIN'in `Goal` varlığının kanonik ekranı (UI-ADR-124).
 *
 * ⚠️ BU EKRAN BİR İLERLEME PANOSU DEĞİLDİR. Meclis (gavadolar 2/2) ayrı
 * ekranı seçerken şunu şart koştu: hedeflerin beşinde `progressPct` `null`
 * ve ADR-0143 §4 "ilerleme yüzdesi kavramı kendi ölçülmüş kaynağını ister
 * ve burada yaratılmıyor" diyor. Çubuklar etrafında kurulmuş bir ekran
 * çoğunlukla boş kutular gösterirdi. Bunun yerine ekran, hedeflerin
 * **envanteri ve ufuk görünümüdür**; ilerleme YALNIZCA ölçülmüşse çizilir.
 *
 * NEDEN AYRI EKRAN, Mission Control'de bölüm DEĞİL: Mission Control'ün
 * birincil odağı izlenen kararlar + vadesi gelen ertelemelerdir ve
 * `03-information-architecture.md` §5 "ondan ağır ikinci bir alan yoktur"
 * diyor. Ayrıca sekiz hedefin üçü operasyonel acil iş, beşi çeyreklik ürün
 * yol haritası — ikisi aynı bağlama ait değil.
 *
 * ⚠️ ADLANDIRMA HASSAS: "Mission" kelimesi kullanılmaz. ADR-0143 §4 o
 * kavramı reddetti; arayüzde geri getirmek kararı sessizce iptal ederdi.
 */

import {
  demoError,
  screenState,
  type DemoState,
} from "@/features/shell/screen-state";
import { useOdinGoals, type Goal } from "@/lib/data/odin-state";
import { Card, CardBody } from "@/components/ui/card";
import { Text } from "@/components/ui/typography";
import { Section, type SectionError } from "@/components/layout/section";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TrustSignal } from "@/components/executive/trust-signal";

/* --------------------------------------------------------------------------
   Gruplar — ODIN'in `level` sözlüğü; UI kendi sırasını icat etmez
   -------------------------------------------------------------------------- */

const GROUPS = [
  {
    level: "urgent" as const,
    title: "Acil",
    note: "Şimdi yapılacak operasyonel işler.",
  },
  {
    level: "weekly" as const,
    title: "Bu hafta",
    note: "Haftalık ufuk.",
  },
  {
    level: "quarterly" as const,
    title: "Çeyreklik",
    note: "Ürün yol haritası — ilerlemesi ODIN tarafından ölçülmüyor.",
  },
];

/* --------------------------------------------------------------------------
   Tek hedef
   -------------------------------------------------------------------------- */

function GoalRow({ goal }: { goal: Goal }) {
  const measured = goal.progressPct !== null;

  return (
    <div className="border-b border-line py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <Text className="min-w-0 flex-1">{goal.label}</Text>

        {/*
         * İLERLEME YALNIZCA ÖLÇÜLMÜŞSE (meclis 2/2).
         * `null` iken `0` yazmak "ölçüldü ve sıfır" demektir ve YANLIŞTIR.
         * Çubuk da yüzde de çizilmez; yerine ölçülmediği YAZILIR — sessizce
         * boş bırakmak, kullanıcının alanı gözden kaçırmasına yol açardı.
         */}
        {measured ? (
          <div className="shrink-0 text-right">
            <span className="odin-num text-sm text-content">%{goal.progressPct}</span>
            <div
              className="mt-1 h-1 w-24 overflow-hidden rounded-sm bg-surface"
              role="img"
              aria-label={`İlerleme yüzde ${goal.progressPct}`}
            >
              <div
                className="h-full bg-accent"
                style={{ width: `${goal.progressPct}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="shrink-0 text-xs text-content-tertiary">
            İlerleme ölçülmüyor
          </span>
        )}
      </div>

      {/* Boş hedef metni satır açmaz — boş bir satır "hedef var ama yazılmamış"
          gibi okunur; oysa cockpit tanımsız hedefi boş dize yayınlıyor. */}
      {goal.target.trim() !== "" && (
        <Text tone="tertiary" className="mt-2 text-xs">
          {goal.target}
        </Text>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Ekran
   -------------------------------------------------------------------------- */

/* UI-ADR-172 — durum zorlaması. Bu ekranın TEK story'si vardı, yani tek
   yol kanıtlanıyordu: veri geldiğinde ne çizdiği. Oysa `goals.error`
   dalı KODDA VARDI ve hiç uyandırılmıyordu — çizilen ama hiç
   görülmemiş bir yol, olmayan yoldan farksızdır.
   Diğer üç ekranın (briefing · mission-control · amazon-director)
   kullandığı ortak `screenState` deseni; yeni bir mekanizma değil. */
const DEMO_ERROR = demoError(
  "Hedefler yüklenemedi",
  "Sahibin ODIN'e yazdığı hedefler ve ölçülen ilerlemeleri görünmüyor."
);

export function Goals({
  demo,
}: {
  /** Yalnızca Storybook/görsel doğrulama için durum zorlaması. */
  demo?: DemoState;
}) {
  const goals = useOdinGoals();
  const zorlama = screenState({
    demo,
    primary: goals,
    sources: [goals],
    error: DEMO_ERROR,
  });

  /* Sözleşme ihlali/ağ hatası GÖRÜNÜR olmalı — doğrulama katmanının bütün
     değeri reddin görünmesindedir (S7 dersi).
     Demo zorlaması ÖNCE gelir ama GERÇEK hatayı EZMEZ: `??` sırası
     "zorlama yoksa gerçeği göster" demektir; ikisi de yoksa null. */
  const error: SectionError | null =
    zorlama.error ??
    (goals.error
      ? {
          what: goals.error.what,
          why: goals.error.why,
          impact: goals.error.impact,
          fix: goals.error.fix,
        }
      : null);

  /* `empty` = "ÖLÇÜLDÜ, sonuç boş" — `null` ("hiç ölçülmedi") DEĞİL.
     Bu yüzden boş DİZİ veriliyor: üç bölüm de "bu seviyede hedef yok"
     der, hiçbiri sessizce kaybolmaz (story'nin kilitlediği sınır). */
  const data: Goal[] | null = zorlama.isEmpty
    ? []
    : (goals.envelope?.data ?? null);

  return (
    <div className="flex flex-col gap-8">
      <WorkspaceHeader
        title="Hedefler"
        context="Sahibin ODIN'e yazdığı hedefler"
        lastSync={goals.envelope?.meta.lastUpdated ?? null}
      />

      {GROUPS.map((g) => {
        const items = data?.filter((x: Goal) => x.level === g.level) ?? null;

        return (
          <Section
            key={g.level}
            title={g.title}
            description={g.note}
            loading={zorlama.loading}
            error={error}
          >
            {items === null ? null : items.length === 0 ? (
              <Card density="compact">
                <CardBody density="compact">
                  <Text tone="tertiary" className="text-sm">
                    Bu seviyede hedef yok.
                  </Text>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody>
                  {items.map((goal: Goal) => (
                    <GoalRow key={goal.id} goal={goal} />
                  ))}
                </CardBody>
              </Card>
            )}
          </Section>
        );
      })}

      {goals.envelope && (
        <TrustSignal
          meta={goals.envelope.meta}
          refreshFailed={goals.refreshError?.what}
        />
      )}
    </div>
  );
}
