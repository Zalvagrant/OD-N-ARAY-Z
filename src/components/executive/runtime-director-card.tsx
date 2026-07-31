/**
 * RuntimeDirectorCard — ODIN ADR-0148 (UI-ADR-127).
 *
 * ODIN'in İKİ canlılık yüzeyi var ve bu kart İKİNCİSİNE aittir:
 * zamanlanmış runtime işleri, her işin KENDİ beyan ettiği agent'a göre
 * gruplanmış. `DirectorCard` birincisine (görev-kuyruğu ajanları,
 * `AgentHealth`) ait ve öyle kalıyor.
 *
 * NEDEN AYRI BİR KART (meclis 2/2): `directors`ı `AgentHealth` şekline
 * adapte etmek `failuresTotal`ı `consecutiveFailures` alanına yazmak
 * demekti — ODIN ardışık seri ÖLÇMÜYOR ve bu, arayüzün fark edemeyeceği
 * bir yalan olurdu. Mevcut kartı iki sözleşmeyi birden kabul eden bir
 * şeye dönüştürmek de aynı riski gizlice geri getirirdi.
 *
 * DÖRT DURUM KORUNUR. `stale`i `unhealthy`ye çevirmek bilgi kaybıdır:
 * gecikmiş bir kalp atışı ile hata veren bir iş aynı şey değildir ve
 * sahibin bu farkı görmesi gerekir.
 *
 * HÜKÜM ODIN'İNDİR: bu kart eşik hesaplamaz, `lastBeat`i yorumlamaz —
 * yaşını yazar, kararı ODIN'in `status`undan okur.
 */

import type { DataEnvelope, DataMeta } from "@/types/data-envelope";
import type { RuntimeDirector } from "@/types/executive";
import { relativeTime, useNow } from "@/lib/clock/tick";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { Heading, Text } from "@/components/ui/typography";
import { NoData } from "@/components/ui/no-data";
import { DataGuard } from "./data-guard";
import { TrustSignal } from "./trust-signal";

/* Glyph YOK: `Badge` variant'ına göre kendi glyph'ini basıyor. Burada da
   yazmak ekranda "✓ ● Sağlıklı" gibi çift işaret üretiyordu — canlı
   ekranda görüldü, test yakalamadı. `DirectorCard` da yalnız label
   geçiriyor; aynı sözleşmeye uyuluyor. */
const STATUS = {
  healthy: { variant: "success", label: "Sağlıklı" },
  stale: { variant: "warning", label: "Gecikmiş" },
  failed: { variant: "danger", label: "Hatalı" },
  unknown: { variant: "secondary", label: "Bilinmiyor" },
} as const;

/** `every 3600s` yerine okunur bir ifade. Yalnız BEKLENEN aralığı yazar. */
function cadenceLabel(ms: number | null): string | null {
  if (ms === null) return null;
  const s = Math.round(ms / 1000);
  if (s % 86_400 === 0) return `${s / 86_400} günde bir beklenir`;
  if (s % 3_600 === 0) return `${s / 3_600} saatte bir beklenir`;
  if (s % 60 === 0) return `${s / 60} dakikada bir beklenir`;
  return `${s} saniyede bir beklenir`;
}

function DirectorView({
  director,
  meta,
}: {
  director: RuntimeDirector;
  meta: DataMeta;
}) {
  const now = useNow();
  const s = STATUS[director.status] ?? STATUS.unknown;
  const age = director.lastBeat ? relativeTime(director.lastBeat, now) : null;
  const cadence = cadenceLabel(director.beatIntervalMs);

  return (
    <Card tone={director.status === "healthy" ? "ai" : "default"}>
      <CardHeader
        title={
          <Heading level={3} size={4}>
            {director.id}
          </Heading>
        }
        actions={
          <Badge variant={s.variant} size="sm">
            {s.label}
          </Badge>
        }
      />

      <CardBody>
        {/* UI-ADR-147: bu iki hücre elle yazılmış `<dt>/<dd>` çiftiydi ve
            `director-card`in yerel `Metric`iyle aynı şekli tekrarlıyordu.
            Sahip kararıyla ikisi de `Stat`a bağlandı. */}
        <dl className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Son atış"
            truncate
            value={
              age ? (
                <Text size="sm">{age}</Text>
              ) : (
                /* Hiç atmamış bir kalp "0 saniye önce" DEĞİLDİR. */
                <NoData reason="Bu direktör hiç çalışmadı" />
              )
            }
          />
          <Stat
            label="Beklenen ritim"
            truncate
            value={
              cadence ? (
                <Text size="sm">{cadence}</Text>
              ) : (
                <NoData reason="Cadence bildirilmedi" />
              )
            }
          />
        </dl>

        {/* Toplam, ardışık DEĞİL — alan adı bunu söylüyor (ADR-0148 §6). */}
        {director.failuresTotal > 0 && (
          <Text size="sm" tone="tertiary" className="mt-3">
            Bugüne kadar toplam {director.failuresTotal} hata
            {director.lastError ? ` · son: ${director.lastError}` : ""}
          </Text>
        )}

        {director.jobs.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {director.jobs.map((j) => {
              const js = STATUS[j.status] ?? STATUS.unknown;
              return (
                <li key={j.id}>
                  <Badge variant={js.variant} size="sm">
                    {j.id}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>

      <CardFooter>
        <TrustSignal meta={meta} />
      </CardFooter>
    </Card>
  );
}

export function RuntimeDirectorCard({
  env,
}: {
  env: DataEnvelope<RuntimeDirector> | null | undefined;
}) {
  return (
    <DataGuard env={env} reason="Runtime direktör verisi yok">
      {(director, meta) => <DirectorView director={director} meta={meta} />}
    </DataGuard>
  );
}
