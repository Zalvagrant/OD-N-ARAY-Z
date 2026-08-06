"""Keyword boşluk analizi.

Üç kaynak birleşir:
  1. Brand Analytics arama terimleri — pazarda ne aranıyor (RANK, hacim DEĞİL)
  2. Kendi listing içeriğim — başlık + bullet + backend
  3. HUGIN'den gelen reklam verisi — hangi kelime gerçekten dönüşüyor

Üç YASAK — gavadolar/terra incelemesinden, bağlayıcı:

  ✗ ARAMA HACMİ ÜRETİLMEZ. Brand Analytics `searchFrequencyRank` verir.
    Rank bir sıralamadır; 1. sıradaki kelimenin 2. sıradakinin kaç katı
    arandığı BİLİNMEZ. Rank'ten hacim türeten her formül uydurmadır.

  ✗ CLICK/CONVERSION SHARE KENDİNE MAL EDİLMEZ. O paylar raporda listelenen
    top-3 ASIN'e aittir. Senin ASIN'in o üçünde değilse, o kelimedeki
    payın hakkında hiçbir ölçüm YOKTUR.

  ✗ "KAÇIRILAN SATIŞ" HESAPLANMAZ. Bir kelimede görünmüyor olman, o
    kelimeden gelecek satışın miktarı hakkında hiçbir şey söylemez.

Ne ÜRETİLİR: "bu kelime pazarda X. sırada aranıyor ve benim listing'imde
hiç geçmiyor" — ikisi de ölçülmüş, ikisi de doğrulanabilir.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable

from .metin import KELIME_KURALI, kelimeler as _kelimeler

# Brand Analytics sütun adları hesaplar arasında biraz değişebiliyor;
# her alan için kabul edilen adlar. Bulunamazsa satır ATLANIR ve kapsam
# raporda eksik olarak görünür — varsayılan değerle doldurulmaz.
_TERIM_ADLARI = ("searchTerm", "search_term", "Search Term")
_RANK_ADLARI = ("searchFrequencyRank", "search_frequency_rank",
                "Search Frequency Rank")
_ASIN_ADLARI = (("clickedAsin", "clickedAsin1", "#1 Clicked ASIN"),
                ("clickedAsin2", "#2 Clicked ASIN"),
                ("clickedAsin3", "#3 Clicked ASIN"))


def _al(satir: dict[str, Any], adlar: Iterable[str]) -> Any:
    for ad in adlar:
        if ad in satir and satir[ad] not in (None, ""):
            return satir[ad]
    return None


@dataclass(frozen=True)
class AramaTerimi:
    terim: str
    rank: int
    tiklanan_asinler: tuple[str, ...]

    def benim_mi(self, kendi_asinlerim: set[str]) -> bool:
        return any(a in kendi_asinlerim for a in self.tiklanan_asinler)


def ba_terimleri(satirlar: list[dict[str, Any]]
                 ) -> tuple[list[AramaTerimi], int]:
    """Brand Analytics satırlarını terime çevirir.

    `atlanan` sayısı da döner: kaç satır okunamadı. Bu sayı raporda basılır
    — 1033 satırlık bir rapordan 40 terim çıkarıp "pazarı taradım" demek,
    993 satırın ne olduğunu bilmeden konuşmaktır.
    """
    terimler: list[AramaTerimi] = []
    atlanan = 0
    for satir in satirlar:
        terim = _al(satir, _TERIM_ADLARI)
        rank = _al(satir, _RANK_ADLARI)
        if not terim or rank is None:
            atlanan += 1
            continue
        try:
            rank_sayi = int(str(rank).replace(",", "").replace(".", ""))
        except ValueError:
            atlanan += 1
            continue
        asinler = tuple(str(a) for a in
                        (_al(satir, adlar) for adlar in _ASIN_ADLARI) if a)
        terimler.append(AramaTerimi(str(terim).strip().lower(), rank_sayi,
                                    asinler))
    terimler.sort(key=lambda t: t.rank)
    return terimler, atlanan


def listing_kelime_kumesi(listing: dict[str, Any]) -> dict[str, set[str]]:
    """Listing'in her alanındaki kelimeler. Hangi alanda geçtiği önemli:
    başlıkta geçen bir kelime ile yalnızca backend'de geçen kelime aynı
    şey değildir."""
    def coz(alan: str) -> set[str]:
        deger = listing.get(alan)
        if deger is None or not getattr(deger, "var", False):
            return set()
        ham = deger.deger
        if isinstance(ham, list):
            return {k for oge in ham for k in _kelimeler(str(oge))}
        return set(_kelimeler(str(ham)))

    return {"baslik": coz("baslik"), "bullet": coz("bulletlar"),
            "backend": coz("backend_keywords"), "aciklama": coz("aciklama")}


@dataclass(frozen=True)
class Bosluk:
    terim: str
    rank: int
    nerede_geciyor: tuple[str, ...]
    tiklanan_asinler: tuple[str, ...]
    benim_asinim_top3te: bool

    @property
    def hic_gecmiyor(self) -> bool:
        return not self.nerede_geciyor


def bosluk_analizi(terimler: list[AramaTerimi], listing: dict[str, Any],
                   kendi_asinlerim: set[str],
                   ilk_n: int = 200) -> list[Bosluk]:
    """Yüksek sıradaki arama terimlerinden listing'de geçmeyenler.

    Eşleşme kuralı: bir terimin TÜM kelimeleri o alanda geçiyorsa terim o
    alanda "geçiyor" sayılır. Kök bulma yapılmaz — 'shoe' ile 'shoes' ayrı
    kelimedir. Bu katı kural bilerek seçildi: gevşek eşleşme, olmayan bir
    kapsamı var gibi gösterir.
    """
    alanlar = listing_kelime_kumesi(listing)
    bosluklar: list[Bosluk] = []
    for terim in terimler[:ilk_n]:
        parcalar = set(_kelimeler(terim.terim))
        if not parcalar:
            continue
        nerede = tuple(ad for ad, kume in alanlar.items()
                       if parcalar <= kume)
        bosluklar.append(Bosluk(
            terim.terim, terim.rank, nerede, terim.tiklanan_asinler,
            terim.benim_mi(kendi_asinlerim)))
    return bosluklar


def bosluk_ozeti(bosluklar: list[Bosluk]) -> dict[str, Any]:
    hic = [b for b in bosluklar if b.hic_gecmiyor]
    sadece_backend = [b for b in bosluklar
                      if b.nerede_geciyor == ("backend",)]
    top3te = [b for b in bosluklar if b.benim_asinim_top3te]
    return {
        "incelenen_terim": len(bosluklar),
        "hic_gecmeyen": len(hic),
        "sadece_backendde": len(sadece_backend),
        "top3te_oldugum_terim": len(top3te),
        "eslesme_kurali": KELIME_KURALI,
        "en_yuksek_10_bosluk": [
            {"terim": b.terim, "rank": b.rank,
             "top3_asinler": list(b.tiklanan_asinler)}
            for b in sorted(hic, key=lambda b: b.rank)[:10]],
    }


# -- HUGIN reklam verisiyle çapraz kontrol ------------------------------
@dataclass(frozen=True)
class ReklamKelimesi:
    terim: str
    gosterim: int
    tiklama: int
    siparis: int
    harcama: float


def reklam_capraz(reklam: list[ReklamKelimesi], listing: dict[str, Any],
                  asgari_tiklama: int = 10) -> dict[str, Any]:
    """HUGIN'in kanıtladığı kelimeler listing'de var mı?

    Bu, keyword araştırmasının en güvenilir sinyalidir: Brand Analytics
    "pazarda aranıyor" der, HUGIN "SENDEN satın alındı" der. İkincisi
    kanıttır.

    `asgari_tiklama` eşiği ZORUNLUDUR: 1 tıklamada 1 sipariş almış bir
    kelime %100 dönüşüm göstermez, hiçbir şey göstermez.
    """
    alanlar = listing_kelime_kumesi(listing)
    tum = set().union(*alanlar.values()) if alanlar else set()

    kanitli_eksik, olu_kelime = [], []
    yetersiz = 0
    for kelime in reklam:
        if kelime.tiklama < asgari_tiklama:
            yetersiz += 1
            continue
        parcalar = set(_kelimeler(kelime.terim))
        if not parcalar:
            continue
        listingde = parcalar <= tum
        if kelime.siparis > 0 and not listingde:
            kanitli_eksik.append(kelime)
        elif kelime.siparis == 0 and listingde and kelime.tiklama >= asgari_tiklama:
            olu_kelime.append(kelime)

    return {
        "asgari_tiklama_esigi": asgari_tiklama,
        "esigin_altinda_atlanan": yetersiz,
        "kanitli_eksik": sorted(kanitli_eksik,
                                key=lambda k: -k.siparis)[:25],
        "olu_kelime": sorted(olu_kelime, key=lambda k: -k.harcama)[:25],
        "eslesme_kurali": KELIME_KURALI,
    }
