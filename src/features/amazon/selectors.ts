/**
 * Amazon SKU kohort seçicileri — UI-ADR-130.
 *
 * SINIR: seçici, ODIN'in YAYINLADIĞI alanlara göre süzer ve sıralar.
 * Yeni bir iş anlamı üretmez.
 *
 * İki fonksiyonun karakteri FARKLIDIR ve bu bilerek görünür bırakıldı:
 *
 *   · `atRiskSkus`  — ODIN'in kendi `status` sözlüğünü kullanır. Hangi
 *     değerlerin "risk" sayıldığı bir SEÇİMDİR ama uydurulmuş bir SAYI
 *     değildir; ODIN'in ürettiği etiketler üzerinden yapılır.
 *   · `losingBuyBoxSkus` — arayüz eşiği kullanır (`BUY_BOX_RISK_BELOW`).
 *     Bu bir BORÇTUR; çağıran ekran `ThresholdNote` basmak zorundadır.
 *
 * Ekranda değil burada olmalarının sebebi test edilebilirlik: iki kohort
 * kuralı da JSX'in içinden okunamıyordu.
 */

import type { SkuHealth } from "@/types/screens";
import { BUY_BOX_RISK_BELOW } from "./presentation/thresholds";

/**
 * Stok riski taşıyan SKU'lar.
 *
 * `unknown` ve `no_movement` DIŞARIDA: bugün 48 SKU'nun 29'u `unknown` ve
 * onları risk listesine doldurmak listeyi anlamsız yapar (UI-ADR-128).
 * `no_movement` da ayrı bir bulgudur — stok VAR, satış YOK — stok riski
 * değildir.
 */
export function atRiskSkus(rows: SkuHealth[]): SkuHealth[] {
  return rows.filter((s) => s.status === "critical" || s.status === "warn");
}

/**
 * BuyBox'ı kaybetmekte olanlar, en kötüden başlayarak.
 *
 * `buyBoxRate === null` olanlar ELENİR: ölçülmemiş bir oran "düşük" değildir.
 * Sıralama yalnızca eleme sonrası yapılır, yani `?? 0` gibi bir varsayılan
 * kullanılmaz — kullanılsaydı ölçülmemiş SKU'lar listenin en başına
 * "en kötü" gibi otururdu.
 */
export function losingBuyBoxSkus(rows: SkuHealth[]): SkuHealth[] {
  return rows
    .filter(
      (s): s is SkuHealth & { sales: { buyBoxRate: number } } =>
        s.sales.buyBoxRate !== null && s.sales.buyBoxRate < BUY_BOX_RISK_BELOW
    )
    .sort((a, b) => a.sales.buyBoxRate - b.sales.buyBoxRate);
}

/**
 * DEĞERLENDİRİLEMEYEN SKU'lar — UI-ADR-163.
 *
 * `atRiskSkus` yalnız `critical`/`warn` döner; durumu `unknown` olan
 * SKU'lar (hızı ölçülmemiş olanlar) listeye BİLEREK alınmaz — ve bu
 * doğrudur, çünkü onlar hakkında bir risk yargısı YOKTUR.
 *
 * Ama ekran boş kohortu *"Hiçbir SKU riskli ya da kritik durumda değil"*
 * diye yazıyordu. 48 SKU'nun 29'u ölçülmemişken bu cümle bir ÖLÇÜM
 * iddiasıdır ve yanlıştır: doğrusu "19'u değerlendirildi, 29'u
 * ölçülemedi". Bastırılan sayıyı SÖYLEMEK, bastırmayı meşru kılan tek
 * şeydir (`alert-stack` aynı kalıbı kullanıyor).
 */
export function unmeasuredSkus(rows: SkuHealth[]): SkuHealth[] {
  /* `no_movement` de ölçülmüş bir sonuçtur ("hareket yok"), bilinmezlik
     değil — yalnız `unknown` değerlendirilememiş sayılır. */
  return rows.filter((s) => s.status === "unknown");
}
