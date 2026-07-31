"use client";

/**
 * AIPulse — AI Core telemetrisi. 05-dashboard.md §7, UI-ADR-071.
 *
 * "Bu bölüm bir dekorasyon değil, bir TELEMETRİ EKRANIDIR."
 *
 * ÜÇ HALKA, YEDİ DEĞİL. `reasoning`, `planning`, `learning`, `reflection`
 * ölçülebilir bir kaynağa sahip olmadıkları için `available: false` ve
 * ÇİZİLMEZLER. Olmayan bir şeye nabız takmak, ürünün tamamının
 * güvenilirliğini bozar.
 *
 * ÇİZİM İÇİN İKİ KAPI — ikisi de geçilmeli:
 *   1. `activePulseChannels()` — registry kanalı açmış mı? (UI-ADR-083)
 *   2. Gelen `ChannelState.available` — bu oturumda veri var mı?
 * Kapılardan biri kapalıysa halka yoktur; "veri bekleniyor" bile yazılmaz,
 * çünkü o kanal bu sürümde mevcut değildir.
 *
 * DÖNÜŞ HIZI VERİDEN GELİR: `load` 0 → sakin (20 sn/tur), 100 → hızlı
 * (4 sn/tur). `active: false` ise halka DURUR. Sabit hızlı bir halka,
 * sahte telemetridir.
 */

import { motion as fm, useReducedMotion } from "framer-motion";
import type { PulseChannelStates } from "@/types/executive";
import type { DataEnvelope } from "@/types/data-envelope";
import { activePulseChannels } from "@/lib/telemetry/registry";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/empty-state";
import { DataGuard } from "./data-guard";
import { TrustSignal } from "./trust-signal";

/* Halka geometrisi — en fazla 3 kanal çizilir (UI-ADR-071). */
const RINGS = [
  { r: 50, stroke: "stroke-ai", dot: "bg-ai", dash: "180 134" },
  { r: 38, stroke: "stroke-chart-2", dot: "bg-chart-2", dash: "120 119" },
  { r: 26, stroke: "stroke-chart-3", dot: "bg-chart-3", dash: "80 83" },
] as const;

const SLOW_SECONDS = 20;
const FAST_SECONDS = 4;

/** load 0–100 → saniye/tur. Ölçülmemiş yük en yavaş kabul edilir. */
export function rotationSeconds(load: number | null | undefined): number {
  if (!Number.isFinite(load as number)) return SLOW_SECONDS;
  const clamped = Math.min(100, Math.max(0, load as number));
  return SLOW_SECONDS - (clamped / 100) * (SLOW_SECONDS - FAST_SECONDS);
}

export function AIPulse({
  env,
  title = "AI Core",
}: {
  env: DataEnvelope<PulseChannelStates> | null | undefined;
  title?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <DataGuard env={env} reason="AI telemetrisi yok">
      {(states, meta) => {
        /* İki kapı: registry + gelen veri. */
        const drawable = activePulseChannels()
          .map((c) => ({ channel: c, state: states[c.id] }))
          .filter((x) => x.state?.available === true)
          .slice(0, RINGS.length);

        return (
          <Card tone="ai">
            <CardHeader title={title} description="Gerçek ölçülen kanallar" />
            <CardBody>
              {drawable.length === 0 ? (
                <EmptyState
                  title="Ölçülebilir kanal yok"
                  description="Şu an hiçbir AI kanalı veri üretmiyor."
                  suggestion="Boş bir çekirdek animasyonu çizilmez — dönen halka, dönen bir iş demektir."
                  nextStep="AI Gateway bağlandığında kanallar kendiliğinden görünür."
                />
              ) : (
                <div className="flex flex-wrap items-center gap-6">
                  <svg
                    viewBox="0 0 120 120"
                    className="h-32 w-32 shrink-0"
                    role="img"
                    aria-label={`${drawable.length} aktif AI kanalı`}
                  >
                    {drawable.map(({ channel, state }, i) => {
                      const ring = RINGS[i]!;
                      const spinning = state.active && !reduced;
                      const seconds = rotationSeconds(state.load);
                      /* Süre veriden gelir; motion.ts token'ları UI geçişleri
                         içindir, telemetri hızı için değil. */
                      const spin = {
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear" as const,
                        duration: seconds,
                      };
                      return (
                        <fm.g
                          key={channel.id}
                          className="origin-center"
                          animate={spinning ? { rotate: 360 } : { rotate: 0 }}
                          transition={spinning ? spin : undefined}
                        >
                          <circle
                            cx="60"
                            cy="60"
                            r={ring.r}
                            fill="none"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={ring.dash}
                            className={`${ring.stroke} ${state.active ? "" : "opacity-40"}`}
                          />
                        </fm.g>
                      );
                    })}
                  </svg>

                  <dl className="flex flex-col gap-2 text-sm">
                    {drawable.map(({ channel, state }, i) => (
                      <div key={channel.id} className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${RINGS[i]!.dot}`}
                          aria-hidden="true"
                        />
                        <dt className="text-content-secondary">{channel.label}</dt>
                        <dd className="text-content-tertiary">
                          {/* ÖLÇÜLMEMİŞ YÜK "0" DEĞİLDİR — UI-ADR-155.
                              `load` null iken `Math.round(null)` = 0 basıyor,
                              undefined iken "NaN" yazıyordu. Aynı dosyadaki
                              `rotationSeconds` (satır 45) `load`u
                              `number | null | undefined` kabul edip
                              `Number.isFinite` ile koruyor — yani null
                              BEKLENEN bir değer; metin onu korumuyordu.
                              Halka doğru şekilde en yavaş dönerken yazının
                              "yük 0" demesi, ölçülmemişi ölçülmüş gösterir. */}
                          {!state.active
                            ? "boşta"
                            : Number.isFinite(state.load)
                              ? `çalışıyor · yük ${Math.round(state.load)}`
                              : "çalışıyor · yük ölçülmedi"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <Text size="sm" tone="tertiary" className="mt-4">
                Karşılığı olmayan kanal çizilmez (UI-ADR-071).
              </Text>
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
