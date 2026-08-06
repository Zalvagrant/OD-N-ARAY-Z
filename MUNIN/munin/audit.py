"""Listing denetimi — sahibin kendi kural setinden.

Kurallar `amazon-jarvis-vault/02_Listing_Optimization/_Agent_Instructions.md`
belgesindeki denetim listesinden alındı:

    Title: 200 karakter max, ana keyword başta
    Bullet Points: 5 adet, her biri benefit-focused
    Backend Search Terms: 249 byte max, tekrar yok
    Images: 7+ görsel, infographic dahil
    Video: en az 1 ürün videosu

Bu dosyanın en önemli tasarım kararı: **her kural kendi ölçülebilirliğini
beyan eder.** "Bullet benefit-odaklı mı" sorusunun API'den ölçülebilir bir
cevabı yoktur; onu "geçti" diye işaretlemek yalandır, "kaldı" diye
işaretlemek de yalandır. Böyle kurallar `OLCULEMEZ` döner ve raporda ayrı
bir bölümde, neden ölçülemediğiyle birlikte listelenir.

Sonuçta üç kova olur: GEÇTİ · KALDI · ÖLÇÜLEMEZ. Üçüncüsü gizlenmez —
denetimin dürüstlüğü oradadır.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .envelope import Deger
from .metin import KELIME_KURALI, bayt as _bayt, kelimeler as _kelimeler

__all__ = ["GECTI", "KALDI", "OLCULEMEZ", "Bulgu", "ESIKLER", "KELIME_KURALI",
           "denetle", "ozet", "puan_yok", "backend_tekrarlari",
           "backend_ic_tekrar"]

GECTI = "GECTI"
KALDI = "KALDI"
OLCULEMEZ = "OLCULEMEZ"

# Sahibin kural setinden gelen eşikler. Kod sabiti DEĞİL, politika —
# hepsi tek yerde ki sahip değiştirebilsin.
ESIKLER = {
    "baslik_azami_karakter": 200,
    "bullet_sayisi": 5,
    "backend_azami_bayt": 249,
    "asgari_gorsel": 7,
}


@dataclass(frozen=True)
class Bulgu:
    kural: str
    durum: str
    olculen: str
    beklenen: str
    gerekce: str = ""
    onem: str = "orta"

    @property
    def gecti(self) -> bool:
        return self.durum == GECTI


def backend_tekrarlari(backend: list[str], baslik: str,
                       bulletlar: list[str]) -> list[str]:
    """Backend'de olup başlıkta/bullet'ta ZATEN geçen kelimeler.

    Amazon başlıkta geçen bir kelimeyi backend'de tekrar okumaz — o bayt
    boşa gider. 249 baytın dolu olması iyi bir şey değildir; DOĞRU
    kelimelerle dolu olması iyi bir şeydir.
    """
    onde = set(_kelimeler(baslik)) | {k for b in bulletlar
                                      for k in _kelimeler(b)}
    arka: list[str] = []
    gorulen: set[str] = set()
    for oge in backend:
        for kelime in _kelimeler(str(oge)):
            if kelime in onde and kelime not in gorulen:
                arka.append(kelime)
                gorulen.add(kelime)
    return arka


def backend_ic_tekrar(backend: list[str]) -> list[str]:
    """Backend alanının KENDİ İÇİNDE tekrarlanan kelimeler."""
    sayac: dict[str, int] = {}
    for oge in backend:
        for kelime in _kelimeler(str(oge)):
            sayac[kelime] = sayac.get(kelime, 0) + 1
    return sorted(k for k, n in sayac.items() if n > 1)


def _deger(alan: Deger) -> Any:
    return alan.deger if alan.var else None


def denetle(listing: dict[str, Any],
            esikler: dict[str, int] | None = None) -> list[Bulgu]:
    """Tek bir listing'i denetle. Ölçülemeyen kural GEÇTİ sayılmaz."""
    e = {**ESIKLER, **(esikler or {})}
    bulgular: list[Bulgu] = []

    # --- başlık ---
    baslik_alan = listing["baslik"]
    if not baslik_alan.var:
        bulgular.append(Bulgu(
            "Baslik uzunlugu", OLCULEMEZ, "—",
            f"<= {e['baslik_azami_karakter']} karakter",
            baslik_alan.gerekce, "yuksek"))
        baslik = ""
    else:
        baslik = str(baslik_alan.deger)
        uzunluk = len(baslik)
        bulgular.append(Bulgu(
            "Baslik uzunlugu",
            GECTI if uzunluk <= e["baslik_azami_karakter"] else KALDI,
            f"{uzunluk} karakter",
            f"<= {e['baslik_azami_karakter']} karakter",
            "" if uzunluk <= e["baslik_azami_karakter"]
            else f"{uzunluk - e['baslik_azami_karakter']} karakter fazla — "
                 f"Amazon fazlasini kesebilir", "yuksek"))

    # "Ana keyword başta mı" — ana keyword'ün NE olduğunu program bilmiyor.
    # Sahip `hedef_keyword` verirse ölçülür, vermezse ölçülemez denir.
    hedef = listing.get("hedef_keyword")
    if not hedef:
        bulgular.append(Bulgu(
            "Ana keyword baslikta once mi", OLCULEMEZ, "—",
            "ana keyword ilk 80 karakterde",
            "bu SKU icin hedef keyword tanimlanmamis — "
            "hedefler.json'a ekle", "yuksek"))
    elif not baslik:
        bulgular.append(Bulgu(
            "Ana keyword baslikta once mi", OLCULEMEZ, "—",
            "ana keyword ilk 80 karakterde",
            "baslik okunamadi", "yuksek"))
    else:
        yer = baslik.lower().find(str(hedef).lower())
        bulgular.append(Bulgu(
            "Ana keyword baslikta once mi",
            GECTI if 0 <= yer < 80 else KALDI,
            f"'{hedef}' konumu: {yer if yer >= 0 else 'hic gecmiyor'}",
            "ilk 80 karakterde",
            "" if 0 <= yer < 80 else
            "ana keyword basligin basinda degil", "yuksek"))

    # --- bullet'lar ---
    bullet_alan = listing["bulletlar"]
    if not bullet_alan.var:
        bulgular.append(Bulgu("Bullet sayisi", OLCULEMEZ, "—",
                              f"{e['bullet_sayisi']} adet",
                              bullet_alan.gerekce, "yuksek"))
        bulletlar: list[str] = []
    else:
        bulletlar = [str(b) for b in bullet_alan.deger]
        bulgular.append(Bulgu(
            "Bullet sayisi",
            GECTI if len(bulletlar) >= e["bullet_sayisi"] else KALDI,
            f"{len(bulletlar)} adet", f"{e['bullet_sayisi']} adet",
            "" if len(bulletlar) >= e["bullet_sayisi"]
            else f"{e['bullet_sayisi'] - len(bulletlar)} bullet eksik",
            "yuksek"))

    bulgular.append(Bulgu(
        "Bullet'lar benefit-odakli mi", OLCULEMEZ, "—",
        "her bullet bir faydayi anlatir",
        "bu bir icerik yargisidir; API'den olculemez. Rapordaki bullet "
        "metinlerini sahip ya da bir dil modeli degerlendirmeli.", "orta"))

    # --- backend search terms ---
    backend_alan = listing["backend_keywords"]
    if not backend_alan.var:
        bulgular.append(Bulgu("Backend bayt kullanimi", OLCULEMEZ, "—",
                              f"<= {e['backend_azami_bayt']} bayt",
                              backend_alan.gerekce, "yuksek"))
    else:
        backend = [str(b) for b in backend_alan.deger]
        bayt = _bayt(" ".join(backend))
        bulgular.append(Bulgu(
            "Backend bayt kullanimi",
            GECTI if bayt <= e["backend_azami_bayt"] else KALDI,
            f"{bayt} bayt ({len(backend)} alan)",
            f"<= {e['backend_azami_bayt']} bayt",
            "" if bayt <= e["backend_azami_bayt"] else
            f"{bayt - e['backend_azami_bayt']} bayt asim — Amazon fazlasini "
            f"SESSIZCE keser, kesilen kelimeler indekslenmez", "yuksek"))

        if bayt < e["backend_azami_bayt"] * 0.6:
            bulgular.append(Bulgu(
                "Backend alani doluluk", KALDI,
                f"{bayt}/{e['backend_azami_bayt']} bayt (%{bayt * 100 // e['backend_azami_bayt']})",
                f"~{e['backend_azami_bayt']} bayt",
                f"{e['backend_azami_bayt'] - bayt} bayt bos — bedava "
                f"indeksleme alani kullanilmiyor", "orta"))

        ic_tekrar = backend_ic_tekrar(backend)
        bulgular.append(Bulgu(
            "Backend kendi icinde tekrar",
            GECTI if not ic_tekrar else KALDI,
            f"{len(ic_tekrar)} tekrar" + (f": {', '.join(ic_tekrar[:8])}"
                                          if ic_tekrar else ""),
            "tekrar yok",
            "" if not ic_tekrar else
            "ayni kelime iki kez yazilmis — ikincisi bayt israfi", "orta"))

        one_tekrar = backend_tekrarlari(backend, baslik, bulletlar)
        bulgular.append(Bulgu(
            "Backend'de baslik/bullet tekrari",
            GECTI if not one_tekrar else KALDI,
            f"{len(one_tekrar)} kelime" + (f": {', '.join(one_tekrar[:8])}"
                                           if one_tekrar else ""),
            "on yuzde gecen kelime backend'de tekrarlanmaz",
            "" if not one_tekrar else
            "Amazon bu kelimeleri zaten indeksliyor; backend'deki kopyalari "
            "bayt harciyor ve yeni kelimeye yer birakmiyor", "orta"))

    # --- görseller ---
    gorsel_alan = listing["gorsel_sayisi"]
    if not gorsel_alan.var:
        bulgular.append(Bulgu("Gorsel sayisi", OLCULEMEZ, "—",
                              f">= {e['asgari_gorsel']} gorsel",
                              gorsel_alan.gerekce, "yuksek"))
    else:
        sayi = int(gorsel_alan.deger)
        bulgular.append(Bulgu(
            "Gorsel sayisi",
            GECTI if sayi >= e["asgari_gorsel"] else KALDI,
            f"{sayi} gorsel", f">= {e['asgari_gorsel']} gorsel",
            "" if sayi >= e["asgari_gorsel"]
            else f"{e['asgari_gorsel'] - sayi} gorsel eksik", "yuksek"))

    bulgular.append(Bulgu(
        "Infografik var mi", OLCULEMEZ, "—", "en az 1 infografik",
        "gorselin TURU API'den okunamaz — yalnizca sayisi ve adresi gelir",
        "orta"))
    bulgular.append(Bulgu(
        "Urun videosu var mi", OLCULEMEZ, "—", "en az 1 video",
        "video varligi Listings Items API'de guvenilir bir alanla gelmiyor; "
        "Seller Central'dan elle dogrulanmali", "orta"))
    bulgular.append(Bulgu(
        "A+ icerik var mi", OLCULEMEZ, "—", "A+ modulleri yayinda",
        "A+ Content ayri bir API'dir (aplus-content-2020-11-01) ve bu "
        "surumun kapsaminda degil", "orta"))

    # --- Amazon'un kendi bildirdiği sorunlar ---
    sorunlar = listing.get("amazon_sorunlari") or []
    if sorunlar:
        agir = [s for s in sorunlar
                if str(s.get("severity", "")).upper() == "ERROR"]
        bulgular.append(Bulgu(
            "Amazon listing uyarilari",
            KALDI if agir else GECTI,
            f"{len(sorunlar)} uyari ({len(agir)} hata)",
            "hata yok",
            "; ".join(str(s.get("message", ""))[:120] for s in agir[:3]),
            "yuksek" if agir else "dusuk"))

    return bulgular


def ozet(bulgular: list[Bulgu]) -> dict[str, int]:
    return {
        GECTI: sum(1 for b in bulgular if b.durum == GECTI),
        KALDI: sum(1 for b in bulgular if b.durum == KALDI),
        OLCULEMEZ: sum(1 for b in bulgular if b.durum == OLCULEMEZ),
    }


def puan_yok() -> str:
    """MUNIN listing'e 0–100 arası bir 'sağlık puanı' VERMEZ.

    Böyle bir puan, ağırlıkları sahibin onaylamadığı bir politikadır:
    "başlık uzunluğu görsel sayısından kaç kat önemli?" sorusunun ölçülmüş
    bir cevabı yok. Uydurma ağırlıklarla üretilen tek bir sayı, altındaki
    on ölçümü gizler ve sahip yanlış olana odaklanır.

    Rapor bunun yerine ham sayıları basar: kaç geçti, kaç kaldı, kaç
    ölçülemedi — ve hangileri.
    """
    return ("MUNIN listing puani uretmez — agirliklari sahip onaylamadi. "
            "Bkz. audit.puan_yok()")
