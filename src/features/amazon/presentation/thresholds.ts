/**
 * ARAYÜZ TARAFINDA KALAN EŞİKLER — UI-ADR-130.
 *
 * ⚠️ BU DOSYADAKİ HER SAYI BİR BORÇTUR.
 *
 * Bunlar ODIN'in yayınlaması gereken politikalardır; bugün arayüzde
 * duruyorlar çünkü ODIN henüz yayınlamıyor. Dosya onları MEŞRULAŞTIRMAK
 * için değil, GÖRÜNÜR ve TEK yapmak için var:
 *
 *   · Eskiden JSX'in içine gömülüydüler (`s.healthScore >= 80 ? ... : ...`)
 *     ve 90 sayısı ayrıca İKİ YERDE düz metin olarak da yazılıydı
 *     ("BuyBox oranı %90'ın altına inen SKU'lar"). Sayıyı değiştiren
 *     kişinin metni de değiştirmesi gerektiğini hiçbir şey söylemiyordu.
 *   · Şimdi tek kaynak burası ve metin de buradan üretiliyor.
 *
 * Provenance'ları `unapproved_default`tur ve ekranda `ThresholdNote` ile
 * İŞARETLENİRLER (UI-ADR-126 / ODIN ADR-0146 deseni): seviye kullanılabilir
 * kalır ama bir iş kararıymış gibi davranmayı bırakır. İşaretlemeden
 * göstermek, uydurulmuş bir SAYI değil uydurulmuş bir OTORİTE sunmaktır —
 * sahte veri yasağının daha sinsi biçimi.
 *
 * KAPANIŞ YOLU: `backend-istekleri.md` §18. ODIN bu alanları yayınladığı
 * gün bu dosya SİLİNİR; sabitler değil, kaynak değişir.
 */

import type { ThresholdProvenance } from "@/types/executive";

/**
 * Bu modüldeki her eşiğin kaynağı. Sahibin onayı yok; ODIN de yayınlamıyor.
 * Bileşenler bunu `ThresholdNote`a geçirir.
 */
export const UI_THRESHOLD_PROVENANCE: ThresholdProvenance = "unapproved_default";

/**
 * Amazon genel sağlık skorunun "iyi" sayıldığı sınır (0–100).
 *
 * Yalnızca Meter'ın TONUNU seçer — bir karar üretmez. Skorun kendisi
 * ekranda sayı olarak zaten görünür; ton, sayının yerine geçmez.
 */
export const HEALTH_SCORE_GOOD_MIN = 80;

/** BuyBox oranının "kaybediliyor" sayıldığı sınır (yüzde, 0–100). */
export const BUY_BOX_RISK_BELOW = 90;

/**
 * Bölüm açıklaması eşikten ÜRETİLİR — sayı ile metin ayrışamasın diye.
 * Önceki hâlde `90` sabiti ile "%90'ın altına inen" cümlesi bağımsızdı.
 */
export const BUY_BOX_RISK_DESCRIPTION = `BuyBox oranı %${BUY_BOX_RISK_BELOW}'ın altına inen SKU'lar.`;
