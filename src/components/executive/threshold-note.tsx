/**
 * Eşik kaynağı işareti — UI-ADR-126 (ODIN ADR-0146).
 *
 * ODIN "3 SKU kritik stokta" dediğinde bu SAYI ölçülmüştür ama
 * **"kritik" kelimesi bir eşiğe dayanır** — ve ADR-0146 o eşiğin sahibi
 * tarafından hiç onaylanmadığını tespit etti. Meclis eşiği gerçek veriden
 * TÜRETMEYİ reddetti (bir haftalık 18 SKU bir politika değil, gürültüdür),
 * bunun yerine sonucu `threshold_provenance` ile işaretledi: seviyeler
 * kullanılabilir kalır ama bir iş kararıymış gibi davranmayı bırakır.
 *
 * Arayüz bu işareti GÖSTERMEK ZORUNDADIR. Göstermezse ekran "Kritik"
 * rozetini yetkili bir hükümmüş gibi sunar ve ODIN'in açıkça beyan ettiği
 * belirsizliği yutar — bu, sahte veri yasağının (CLAUDE.md kural 2) daha
 * sinsi bir biçimidir: uydurulmuş bir sayı değil, uydurulmuş bir OTORİTE.
 *
 * `owner_policy` için hiçbir şey çizilmez: onaylanmış eşik normal
 * durumdur ve her karta "bu onaylı" yazmak gürültüden başka bir şey
 * üretmez.
 */

import type { ThresholdProvenance } from "@/types/executive";
import { Text } from "@/components/ui/typography";

export function ThresholdNote({
  provenance,
  className,
}: {
  provenance?: ThresholdProvenance;
  className?: string;
}) {
  if (provenance !== "unapproved_default") return null;

  return (
    <Text size="sm" tone="tertiary" className={className}>
      ⚠ Bu seviye, sahibin onaylamadığı varsayılan bir eşikten geliyor —
      sayı ölçüldü, sınır kararlaştırılmadı (ODIN ADR-0146).
    </Text>
  );
}
