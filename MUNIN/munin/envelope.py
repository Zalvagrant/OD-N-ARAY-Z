"""Veri zarfı — MUNIN'in tek bağlayıcı kuralı.

Bu dosya şu kuralın uygulamasıdır:

    ÖLÇÜLMEMİŞ HİÇBİR SAYI BASILMAZ.

Bir rapor satırında bir sayı görüyorsan, o sayı gerçekten bir kaynaktan
gelmiştir ve kaynağı `Olculen.kaynak` alanında yazılıdır. Veri yoksa
placeholder, tahmin, "—" ya da 0 yazılmaz; `Yok` döner ve raporda
GEREKÇESİYLE birlikte "ölçülmedi" olarak basılır.

Gerekçe: sahip bir kez sahte bir göstergeyi fark ederse, hiçbir göstergeye
bir daha güvenmez. O noktadan sonra programın tamamı çöp olur.

Kullanım:

    >>> baslik = olculen("Kedi Maması 2kg", kaynak="listings-api")
    >>> baslik.deger
    'Kedi Maması 2kg'
    >>> bsr = yok("rakip BSR", "Catalog API bu ASIN icin salesRanks dondurmedi")
    >>> bsr.var
    False
    >>> bsr.metin()
    'olculmedi (Catalog API bu ASIN icin salesRanks dondurmedi)'
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Iterable


@dataclass(frozen=True)
class Olculen:
    """Gerçekten ölçülmüş bir değer. `kaynak` boş olamaz."""

    deger: Any
    kaynak: str
    olcum_zamani: str | None = None
    notlar: tuple[str, ...] = field(default_factory=tuple)

    var: bool = field(default=True, init=False)

    def __post_init__(self) -> None:
        if not str(self.kaynak).strip():
            # Kaynaksız ölçüm ölçüm değildir. Burada patlamak, raporda
            # kaynağı bilinmeyen bir sayı basmaktan iyidir.
            raise ValueError("Olculen kaynaksiz olusturulamaz")

    def metin(self, bicim: Callable[[Any], str] | None = None) -> str:
        return bicim(self.deger) if bicim else str(self.deger)

    def esle(self, fn: Callable[[Any], Any]) -> "Olculen | Yok":
        """Değeri dönüştür, kaynağı koru. Dönüşüm patlarsa ölçüm kaybolur —
        sessizce 0'a düşmez, `Yok` olur."""
        try:
            return Olculen(fn(self.deger), self.kaynak, self.olcum_zamani,
                           self.notlar)
        except (TypeError, ValueError, ZeroDivisionError) as exc:
            return Yok(self.kaynak,
                       f"deger donusturulemedi — {type(exc).__name__}: {exc}")


@dataclass(frozen=True)
class Yok:
    """Ölçülemeyen değer. `gerekce` ZORUNLUDUR — "veri yok" demek yetmez,
    NEDEN yok yazılır ki sahip neyi düzelteceğini bilsin."""

    ne: str
    gerekce: str

    var: bool = field(default=False, init=False)
    deger: Any = field(default=None, init=False)

    def __post_init__(self) -> None:
        if not str(self.gerekce).strip():
            raise ValueError(f"'{self.ne}' icin gerekcesiz Yok yazilamaz")

    def metin(self, bicim: Callable[[Any], str] | None = None) -> str:
        return f"olculmedi ({self.gerekce})"

    def esle(self, fn: Callable[[Any], Any]) -> "Yok":
        return self


Deger = Olculen | Yok


def olculen(deger: Any, kaynak: str, olcum_zamani: str | None = None,
            *notlar: str) -> Olculen:
    return Olculen(deger, kaynak, olcum_zamani, tuple(notlar))


def yok(ne: str, gerekce: str) -> Yok:
    return Yok(ne, gerekce)


def olculen_ya_da_yok(deger: Any, kaynak: str, ne: str, gerekce: str,
                      olcum_zamani: str | None = None) -> Deger:
    """API alanı `None`/boş geldiyse ölçüm YOKTUR — 0 ya da "" değildir.

    Bu ayrım programın en çok işe yarayan yeri: `0 gorsel` ile
    `gorsel sayisi okunamadi` bambaska iki bulgudur, ve ikisi de bir
    aksiyon gerektirir ama AYNI aksiyonu değil.
    """
    if deger is None or deger == "":
        return Yok(ne, gerekce)
    return Olculen(deger, kaynak, olcum_zamani)


def oran(bolunen: Deger, bolen: Deger, kaynak: str) -> Deger:
    """İki ölçümün oranı. Taraflardan BİRİ bile ölçülmemişse sonuç
    ölçülmemiştir — eksik tarafı 0 sayıp oran uydurmak yasak."""
    if not bolunen.var:
        return Yok(kaynak, f"pay olculmedi: {bolunen.gerekce}")   # type: ignore[union-attr]
    if not bolen.var:
        return Yok(kaynak, f"payda olculmedi: {bolen.gerekce}")   # type: ignore[union-attr]
    try:
        payda = float(bolen.deger)
    except (TypeError, ValueError):
        return Yok(kaynak, "payda sayiya cevrilemedi")
    if payda == 0:
        # Sıfıra bölme "sonsuz" ya da 0 değildir; ölçülemeyen bir orandır.
        return Yok(kaynak, "payda sifir — oran tanimsiz")
    try:
        return Olculen(float(bolunen.deger) / payda, kaynak)
    except (TypeError, ValueError):
        return Yok(kaynak, "pay sayiya cevrilemedi")


def basilabilir(*degerler: Deger) -> bool:
    """Bir rapor bölümü, ölçümlerinin TAMAMI varsa basılır.

    `canRender()` mantığının aynısı: yarısı ölçülmüş bir tablo, tamamı
    ölçülmüş gibi okunur. Yarım tablo basmaktansa bölümü hiç basmayıp
    eksiği adıyla bildirmek doğrudur.
    """
    return all(d.var for d in degerler)


def eksikler(degerler: dict[str, Deger]) -> list[str]:
    """Basılamayan alanların "ad — gerekçe" listesi. Rapordaki
    'Ölçülemeyenler' bölümü bundan üretilir."""
    return [f"{ad} — {d.gerekce}"                      # type: ignore[union-attr]
            for ad, d in degerler.items() if not d.var]


def kapsam_kaniti(satirlar: Iterable[Any], beklenen: int | None,
                  ne: str) -> Deger:
    """Bir listenin TAM olduğunu kanıtla.

    Sayfalanmış bir API'den 20 satır dönmesi, gerçekten 20 tane olduğu
    anlamına gelmez — sayfalama yarıda kalmış da olabilir. Kapsam
    kanıtlanamıyorsa sayı yayımlanmaz: eksik bir listeden üretilen "en kötü
    5 SKU" listesi, tam bir liste gibi okunur ve yanlış aksiyona götürür.
    """
    satirlar = list(satirlar)
    if beklenen is None:
        return Yok(ne, "kapsam kaniti yok — kac kayit bekledigimiz bilinmiyor")
    if len(satirlar) != beklenen:
        return Yok(ne, f"kapsam eksik — {beklenen} beklendi, {len(satirlar)} geldi")
    return Olculen(satirlar, f"kapsam dogrulandi ({beklenen} kayit)")
