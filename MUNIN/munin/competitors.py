"""Rakip istihbaratı — profil kartı ve haftalık değişim.

Sahibin kendi rakip profil kartı şablonu
(`04_Competitor_Intelligence/_Agent_Instructions.md`) şu alanları
istiyordu: ASIN · Brand · Price · Rating · Review Count · BSR ·
Monthly Sales · Güçlü/Zayıf Yanlar · Tehdit Seviyesi.

Bunların hangisi GERÇEKTEN ölçülebilir (gavadolar/luna doğrulaması):

| Alan | Kaynak | Durum |
|---|---|---|
| ASIN · Brand · Başlık | Catalog Items | ✅ ölçülür |
| Fiyat | Pricing v2022-05-01 competitiveSummary | ✅ ölçülür |
| BSR | Catalog Items salesRanks | ⚠ çoğu ASIN'de boş (Amazon kusuru) |
| Görsel/bullet sayısı | Catalog Items | ⚠ ürüne göre görünürlük değişir |
| **Rating · Review sayısı** | — | ❌ **HİÇBİR SP-API UCUNDA YOK** |
| **Aylık satış tahmini** | — | ❌ ölçülemez, tahmindir |

Son iki satır rapora BOŞ KOLON OLARAK BİLE girmez. Boş bir "Review"
kolonu, bir gün dolacağı izlenimi verir; oysa yasal bir kaynağı yoktur.
Scraping ile doldurmak sahibin satıcı hesabını riske atar — MUNIN bunu
yapmaz ve yapan bir eklenti önermez.

"Tehdit seviyesi" de üretilmez: bir rakibin tehdit olup olmadığı,
ölçülmemiş ağırlıklarla üretilecek bir yargıdır. Onun yerine ÖLÇÜLEN
DEĞİŞİM basılır — fiyatı %12 düştü, başlığını değiştirdi, iki görsel
ekledi. Sahip tehdidi kendi okur.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .envelope import Deger, Yok
from .store import fark

# Snapshot diff'te izlenen alanlar. Fiyat ve BSR sayısaldır; başlık ve
# görsel sayısı içerik değişimini yakalar.
IZLENEN_ALANLAR = ("fiyat_tutar", "fiyat_para", "bsr", "baslik",
                   "gorsel_sayisi", "bullet_sayisi")

# Sahibin kendi kural setinden: private label'da fiyat tabanı $25–30,
# rakip düşse de dibe yarışılmaz. Bu bir POLİTİKA — MUNIN uygulamaz,
# yalnızca ihlali görünür kılar.
FIYAT_TABANI_VARSAYILAN = 25.0


def _duz(deger: Any) -> Any:
    """Deger zarfını diske yazılabilir düz değere indirger."""
    if isinstance(deger, Yok):
        return None
    if hasattr(deger, "var") and hasattr(deger, "deger"):
        return deger.deger
    return deger


def profil_kartı(katalog: dict[str, Any],
                 fiyat: Deger | None = None) -> dict[str, Any]:
    """Ölçülebilen alanlardan rakip profil kartı üretir.

    Her alan `Deger` zarfıyla gelir; ölçülemeyen alan gerekçesiyle
    birlikte kartta kalır ve raporda "ölçülmedi (sebep)" olarak basılır.
    """
    fiyat_tutar: Any = None
    fiyat_para: Any = None
    if fiyat is not None and fiyat.var:
        fiyat_tutar = (fiyat.deger or {}).get("tutar")
        fiyat_para = (fiyat.deger or {}).get("para")

    return {
        "asin": katalog["asin"],
        "baslik": _duz(katalog["baslik"]),
        "marka": _duz(katalog["marka"]),
        "bsr": _duz(katalog["bsr"]),
        "bsr_kategori": katalog.get("bsr_kategori"),
        "gorsel_sayisi": _duz(katalog["gorsel_sayisi"]),
        "bullet_sayisi": _duz(katalog["bullet_sayisi"]),
        "fiyat_tutar": fiyat_tutar,
        "fiyat_para": fiyat_para,
        # Ölçülemeyen alanların GEREKÇELERİ kartta taşınır — rapor bunları
        # "Ölçülemeyenler" bölümüne basar.
        "_olculemeyenler": {
            ad: katalog[ad].gerekce
            for ad in ("baslik", "marka", "bsr", "gorsel_sayisi",
                       "bullet_sayisi")
            if not katalog[ad].var},
    }


@dataclass(frozen=True)
class Degisim:
    asin: str
    alan: str
    onceki: Any
    sonraki: Any

    @property
    def yuzde(self) -> float | None:
        """Sayısal alanlarda değişim yüzdesi. Öncekinin 0 ya da okunamaz
        olduğu durumda None — 0'dan artışı "sonsuz" diye basmak yanlıştır."""
        try:
            eski = float(self.onceki)
            yeni = float(self.sonraki)
        except (TypeError, ValueError):
            return None
        if eski == 0:
            return None
        return (yeni - eski) / eski * 100


def degisimleri_coz(fark_sonucu: dict[str, Any]) -> list[Degisim]:
    cikti: list[Degisim] = []
    for kayit in fark_sonucu.get("degisen") or []:
        asin = kayit.get("asin", "")
        for alan, hareket in (kayit.get("alanlar") or {}).items():
            cikti.append(Degisim(asin, alan, hareket.get("onceki"),
                                 hareket.get("sonraki")))
    return cikti


def karsilastir(onceki: list[dict[str, Any]],
                simdiki: list[dict[str, Any]]) -> dict[str, Any]:
    """İki rakip anlık görüntüsü arasındaki fark."""
    ham = fark(onceki, simdiki, anahtar="asin", izlenen=IZLENEN_ALANLAR)
    degisimler = degisimleri_coz(ham)

    fiyat_hareketleri = [d for d in degisimler if d.alan == "fiyat_tutar"]
    icerik_hareketleri = [d for d in degisimler
                          if d.alan in ("baslik", "gorsel_sayisi",
                                        "bullet_sayisi")]
    return {
        "degisen_rakip": len({d.asin for d in degisimler}),
        "sabit_rakip": len(ham.get("sabit") or []),
        "yeni_rakip": ham.get("eklenen") or [],
        "kaybolan_rakip": ham.get("kaybolan") or [],
        "fiyat_hareketleri": fiyat_hareketleri,
        "icerik_hareketleri": icerik_hareketleri,
        "tum_degisimler": degisimler,
    }


def dikkat_cekenler(karsilastirma: dict[str, Any],
                    fiyat_esigi_yuzde: float = 5.0) -> list[str]:
    """Sahibin kendi kriz protokolündeki eşikler.

    `04_Competitor_Intelligence`: "%5'ten fazla fiyat değişikliklerini
    #urgent etiketle", "Rakip %20+ fiyat düşüşü → tüm departmanlara bildir".

    Bunlar ÖLÇÜLMÜŞ eşiklerdir (sahip koydu), uydurma değil.
    """
    satirlar: list[str] = []
    for hareket in karsilastirma.get("fiyat_hareketleri") or []:
        yuzde = hareket.yuzde
        if yuzde is None:
            satirlar.append(
                f"{hareket.asin}: fiyat {hareket.onceki} → {hareket.sonraki} "
                f"(yuzde hesaplanamadi — onceki deger okunamiyor)")
            continue
        if abs(yuzde) >= 20:
            yon = "dustu" if yuzde < 0 else "cikti"
            satirlar.append(
                f"⚠⚠ {hareket.asin}: fiyat %{abs(yuzde):.0f} {yon} "
                f"({hareket.onceki} → {hareket.sonraki}) — kriz protokolu "
                f"esigi (%20)")
        elif abs(yuzde) >= fiyat_esigi_yuzde:
            yon = "dustu" if yuzde < 0 else "cikti"
            satirlar.append(
                f"⚠ {hareket.asin}: fiyat %{abs(yuzde):.0f} {yon} "
                f"({hareket.onceki} → {hareket.sonraki})")

    for hareket in karsilastirma.get("icerik_hareketleri") or []:
        if hareket.alan == "baslik":
            satirlar.append(f"{hareket.asin}: BASLIK degisti — rakip "
                            f"listing'ini guncelledi")
        elif hareket.alan == "gorsel_sayisi":
            satirlar.append(f"{hareket.asin}: gorsel sayisi "
                            f"{hareket.onceki} → {hareket.sonraki}")
        elif hareket.alan == "bullet_sayisi":
            satirlar.append(f"{hareket.asin}: bullet sayisi "
                            f"{hareket.onceki} → {hareket.sonraki}")

    for yeni in karsilastirma.get("yeni_rakip") or []:
        satirlar.append(f"YENI rakip listede: {yeni.get('asin')} — "
                        f"{str(yeni.get('baslik') or '')[:70]}")
    for giden in karsilastirma.get("kaybolan_rakip") or []:
        satirlar.append(f"{giden.get('asin')} listeden dustu — stok tukendi "
                        f"ya da listing kapandi (MUNIN hangisi oldugunu "
                        f"olcemez)")
    return satirlar


def fiyat_tabani_ihlali(kartlar: list[dict[str, Any]],
                        taban: float = FIYAT_TABANI_VARSAYILAN
                        ) -> list[dict[str, Any]]:
    """Fiyat tabanının altına inen rakipler.

    Sahibin kuralı: "Fiyat tabanı ≥ $25–30 (marj için); rakip fiyat
    düşüşünde bu tabanı koru, dibe yarışma." MUNIN bunu bir AKSİYON değil,
    bir GÖZLEM olarak basar — fiyatı sahip belirler.
    """
    return [k for k in kartlar
            if k.get("fiyat_tutar") is not None
            and float(k["fiyat_tutar"]) < taban]
