"""İade neden ayrıştırması — listing sorunu mu, ürün sorunu mu?

Bu modül gavadolar/terra incelemesinin doğrudan sonucudur. Sahibin iade
oranı altı ayda %0,69'dan %15,79'a çıkmış. "Listing'i optimize et"
demeden önce cevaplanması gereken soru şu:

    İnsanlar aldıkları şeyi BEĞENMEDİĞİ için mi iade ediyor,
    yoksa ALDIĞINI SANDIĞI şey gelmediği için mi?

Birincisi ürün/tedarik sorunudur — listing optimizasyonu onu ÇÖZMEZ,
hatta daha çok trafik getirip daha çok iade üretir. İkincisi listing
sorunudur ve tam olarak MUNIN'in işidir.

⚠ BU MODÜL "İADE RİSKİ SKORU" ÜRETMEZ. Neden kodlarının hangi ağırlıkla
bir riske dönüştüğü ölçülmüş bir şey değildir. Üretilen şey betimsel bir
tablodur: hangi ASIN, kaç iade, hangi neden dağılımı. Yorum sahibindir.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import Any

# Amazon'un iade neden kodları üç kovaya ayrılır. Bu eşleme bir POLİTİKA
# kararıdır, ölçüm değil — bu yüzden burada, tek yerde, açıkça durur ki
# sahip itiraz edebilsin.
LISTING_KAYNAKLI = {
    # "Aldığım şey anlatılan şey değildi" — beklenti listing'de kurulur.
    "NOT_AS_DESCRIBED", "not_as_described",
    "ORDERED_WRONG_ITEM", "ordered_wrong_item",
    "MISSING_PARTS", "missing_parts",
    "SWITCHEROO", "switcheroo",
    "UNWANTED_ITEM", "unwanted_item",
    "NO_REASON_GIVEN", "no_reason_given",
}
URUN_KAYNAKLI = {
    # Ürünün kendisi bozuk/hatalı — listing metni bunu düzeltmez.
    "DEFECTIVE", "defective",
    "DAMAGED_BY_FC", "damaged_by_fc",
    "DAMAGED_BY_CARRIER", "damaged_by_carrier",
    "QUALITY_UNACCEPTABLE", "quality_unacceptable",
    "EXPIRED", "expired",
}
LOJISTIK_KAYNAKLI = {
    "MISSED_ESTIMATED_DELIVERY", "missed_estimated_delivery",
    "NEVER_ARRIVED", "never_arrived",
    "UNDELIVERABLE_REFUSED", "undeliverable_refused",
    "APPAREL_TOO_SMALL", "APPAREL_TOO_LARGE",   # beden — sınırda vaka
    "apparel_too_small", "apparel_too_large",
}

KOVA_ADLARI = {"listing": "Listing kaynakli (beklenti uyusmazligi)",
               "urun": "Urun kaynakli (kusur/hasar)",
               "lojistik": "Lojistik kaynakli (teslimat/beden)",
               "bilinmeyen": "Eslenemeyen neden kodu"}

_SUTUN_ADLARI = {
    "asin": ("asin", "ASIN"),
    "sku": ("sku", "seller-sku", "SKU"),
    "neden": ("reason", "return-reason", "Reason"),
    "adet": ("quantity", "Quantity"),
    "tarih": ("return-date", "Return Date", "return_date"),
    "urun": ("product-name", "Product Name"),
    "yorum": ("customer-comments", "Customer Comments"),
}


def _al(satir: dict[str, Any], alan: str) -> Any:
    for ad in _SUTUN_ADLARI[alan]:
        if ad in satir and satir[ad] not in (None, ""):
            return satir[ad]
    return None


def kova(neden: str) -> str:
    if neden in LISTING_KAYNAKLI:
        return "listing"
    if neden in URUN_KAYNAKLI:
        return "urun"
    if neden in LOJISTIK_KAYNAKLI:
        return "lojistik"
    return "bilinmeyen"


@dataclass(frozen=True)
class AsinIade:
    asin: str
    urun_adi: str
    toplam: int
    kovalar: dict[str, int]
    nedenler: dict[str, int]

    @property
    def listing_orani(self) -> float | None:
        """Listing kaynaklı iadelerin payı. Toplam 0 ise None — 0/0'ı
        yüzde diye basmak yanlıştır."""
        if self.toplam == 0:
            return None
        return self.kovalar.get("listing", 0) / self.toplam


def ayristir(satirlar: list[dict[str, Any]]) -> dict[str, Any]:
    """İade raporunu ASIN ve neden kırılımına ayır.

    Dönen `atlanan` sayısı önemlidir: ASIN'i ya da nedeni okunamayan
    satırlar hesaba KATILMAZ ve sayısı raporda görünür. Onları
    "bilinmeyen" kovasına atmak, ölçülmemiş bir şeyi ölçülmüş gibi
    gösterirdi.
    """
    asin_bazli: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"urun": "", "nedenler": Counter(), "toplam": 0})
    genel_neden: Counter = Counter()
    genel_kova: Counter = Counter()
    atlanan = 0

    for satir in satirlar:
        asin = _al(satir, "asin")
        neden = _al(satir, "neden")
        if not asin or not neden:
            atlanan += 1
            continue
        try:
            adet = int(_al(satir, "adet") or 1)
        except (TypeError, ValueError):
            adet = 1
        neden = str(neden).strip()
        kayit = asin_bazli[str(asin)]
        kayit["nedenler"][neden] += adet
        kayit["toplam"] += adet
        if not kayit["urun"]:
            kayit["urun"] = str(_al(satir, "urun") or "")
        genel_neden[neden] += adet
        genel_kova[kova(neden)] += adet

    asinler = []
    for asin, kayit in asin_bazli.items():
        kovalar: Counter = Counter()
        for neden, sayi in kayit["nedenler"].items():
            kovalar[kova(neden)] += sayi
        asinler.append(AsinIade(asin, kayit["urun"], kayit["toplam"],
                                dict(kovalar), dict(kayit["nedenler"])))
    asinler.sort(key=lambda a: -a.toplam)

    toplam = sum(genel_kova.values())
    return {
        "toplam_iade_adedi": toplam,
        "okunamayan_satir": atlanan,
        "islenen_satir": len(satirlar) - atlanan,
        "kova_dagilimi": dict(genel_kova),
        "neden_dagilimi": dict(genel_neden.most_common()),
        "asin_bazli": asinler,
        "eslenemeyen_kodlar": sorted(
            {n for n in genel_neden if kova(n) == "bilinmeyen"}),
    }


def teshis(sonuc: dict[str, Any]) -> str:
    """Tek cümlelik betimleme — TAVSİYE DEĞİL, ölçümün özeti.

    Bilerek "şunu yap" demiyor: neden dağılımından aksiyona geçen adım
    sahibin ürün bilgisini gerektirir ve program o bilgiye sahip değildir.
    """
    kovalar = sonuc.get("kova_dagilimi") or {}
    toplam = sum(kovalar.values())
    if toplam == 0:
        return ("Iade kaydi yok ya da hicbir satir okunamadi — "
                "kapsam dogrulanmadan yorum yapilamaz.")
    siralı = sorted(kovalar.items(), key=lambda p: -p[1])
    ust, sayi = siralı[0]
    yuzde = sayi * 100 // toplam
    bilinmeyen = kovalar.get("bilinmeyen", 0)
    ek = ""
    if bilinmeyen and bilinmeyen * 100 // toplam >= 20:
        ek = (f" UYARI: iadelerin %{bilinmeyen * 100 // toplam}'i eslenemeyen "
              f"neden kodu tasiyor; bu dagilim eksik okunmus olabilir.")
    if ust == "listing":
        return (f"Iadelerin %{yuzde}'i {KOVA_ADLARI['listing']} kovasinda "
                f"({sayi}/{toplam}). Listing metni ve gorselleri "
                f"beklentiyi yanlis kuruyor olabilir — MUNIN'in "
                f"denetim bulgularina bak.{ek}")
    if ust == "urun":
        return (f"Iadelerin %{yuzde}'i {KOVA_ADLARI['urun']} kovasinda "
                f"({sayi}/{toplam}). BU BIR LISTING SORUNU DEGILDIR; "
                f"listing optimizasyonu daha cok trafik getirip daha cok "
                f"iade uretebilir. Once tedarik/kalite tarafina bak.{ek}")
    return (f"Iadelerin %{yuzde}'i {KOVA_ADLARI.get(ust, ust)} kovasinda "
            f"({sayi}/{toplam}).{ek}")
