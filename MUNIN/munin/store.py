"""Yerel anlık görüntü deposu — MUNIN'in "hafıza" tarafı.

Her çekim tarihli bir JSON dosyası olarak saklanır ve HİÇBİR ZAMAN
üzerine yazılmaz. Bir listing'in dün ne olduğunu bilmeden bugün ne
değiştiğini söyleyemezsin; rakip istihbaratının tamamı bu dosyaların
farkından üretilir.

Dosya düzeni:
    veri/
      anlik/<tur>/<tur>-YYYY-MM-DDTHH-MM-SSZ.json
      rapor/<ad>-YYYY-MM-DD.md | .html | .json
      hugin/gelen/... , hugin/giden/...

Her anlık görüntü kendi DÖNEMİNİ beyan eder. Bir kaydın ne zamana ait
olduğu okuyanın varsayımına bırakılırsa, 7 günlük pencere ile 30 günlük
pencere sessizce karşılaştırılır ve çıkan yüzde anlamsız olur.
"""
from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

SOZLESME_SURUMU = 1
_ZAMAN_BICIMI = "%Y-%m-%dT%H-%M-%SZ"
_DOSYA_DESENI = re.compile(r"^(?P<tur>[a-z0-9_\-]+)-(?P<zaman>\d{4}-\d{2}-\d{2}T"
                           r"\d{2}-\d{2}-\d{2}Z)\.json$")


def simdi() -> datetime:
    return datetime.now(timezone.utc)


def damga(an: datetime | None = None) -> str:
    return (an or simdi()).strftime(_ZAMAN_BICIMI)


@dataclass(frozen=True)
class AnlikGoruntu:
    """Tek bir çekimin tamamı. `donem` ZORUNLU beyandır."""

    tur: str
    alindi: str
    donem: dict[str, Any]
    kaynak: str
    satirlar: list[dict[str, Any]]
    kapsam: dict[str, Any] = field(default_factory=dict)
    yol: Path | None = None

    @property
    def zaman(self) -> datetime:
        return datetime.strptime(self.alindi, _ZAMAN_BICIMI).replace(
            tzinfo=timezone.utc)

    def sozluk(self) -> dict[str, Any]:
        return {"sozlesme": SOZLESME_SURUMU, "tur": self.tur,
                "alindi": self.alindi, "donem": self.donem,
                "kaynak": self.kaynak, "kapsam": self.kapsam,
                "sayi": len(self.satirlar), "satirlar": self.satirlar}


class Depo:
    def __init__(self, kok: Path):
        self.kok = Path(kok)
        self.anlik = self.kok / "anlik"
        self.rapor = self.kok / "rapor"
        self.hugin = self.kok / "hugin"

    def hazirla(self) -> None:
        for yol in (self.anlik, self.rapor, self.hugin / "gelen",
                    self.hugin / "giden"):
            yol.mkdir(parents=True, exist_ok=True)

    # -- yazma ---------------------------------------------------------
    def yaz(self, tur: str, satirlar: list[dict[str, Any]], *, kaynak: str,
            donem: dict[str, Any], kapsam: dict[str, Any] | None = None,
            an: datetime | None = None) -> AnlikGoruntu:
        """Anlık görüntüyü atomik yaz. Aynı saniyede iki çekim olursa
        ikincisi birinciyi EZMEZ — sonuna sayaç eklenir."""
        klasor = self.anlik / tur
        klasor.mkdir(parents=True, exist_ok=True)
        alindi = damga(an)
        gor = AnlikGoruntu(tur, alindi, donem, kaynak, satirlar, kapsam or {})

        yol = klasor / f"{tur}-{alindi}.json"
        sayac = 1
        while yol.exists():
            yol = klasor / f"{tur}-{alindi}-{sayac}.json"
            sayac += 1

        gecici = yol.with_suffix(".json.tmp")
        gecici.write_text(json.dumps(gor.sozluk(), ensure_ascii=False,
                                     indent=1), encoding="utf-8")
        os.replace(gecici, yol)
        return AnlikGoruntu(tur, alindi, donem, kaynak, satirlar,
                            gor.kapsam, yol)

    # -- okuma ---------------------------------------------------------
    def _dosyalar(self, tur: str) -> list[Path]:
        klasor = self.anlik / tur
        if not klasor.is_dir():
            return []
        return sorted(p for p in klasor.glob(f"{tur}-*.json")
                      if p.is_file())

    def oku(self, yol: Path) -> AnlikGoruntu | None:
        """Bozuk dosya None döner — tek bozuk kayıt tüm geçmişi
        kilitlemez, ama sessizce boş da sayılmaz (çağıran farkı görür)."""
        try:
            ham = json.loads(yol.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None
        if not isinstance(ham, dict) or "satirlar" not in ham:
            return None
        return AnlikGoruntu(
            tur=str(ham.get("tur", yol.parent.name)),
            alindi=str(ham.get("alindi", "")),
            donem=ham.get("donem") or {},
            kaynak=str(ham.get("kaynak", "")),
            satirlar=list(ham.get("satirlar") or []),
            kapsam=ham.get("kapsam") or {},
            yol=yol)

    def tum(self, tur: str) -> Iterator[AnlikGoruntu]:
        for yol in self._dosyalar(tur):
            gor = self.oku(yol)
            if gor is not None:
                yield gor

    def son(self, tur: str) -> AnlikGoruntu | None:
        for yol in reversed(self._dosyalar(tur)):
            gor = self.oku(yol)
            if gor is not None:
                return gor
        return None

    def onceki(self, tur: str, referans: AnlikGoruntu | None = None
               ) -> AnlikGoruntu | None:
        """Diff'in "dün" tarafı — `referans`tan bir önceki anlık görüntü.

        `referans` verilmezse en yenisi referans alınır ve SONDAN BİR
        ÖNCEKİ döner. Burada `son()` ile aynı kaydı döndürmek, her koşumda
        anlık görüntüyü kendisiyle karşılaştırmak demektir: fark her zaman
        boş çıkar ve "rakiplerde değişiklik yok" satırı, ölçüm gibi
        görünen bir yokluk olur.
        """
        gorler = list(self.tum(tur))
        if not gorler:
            return None
        sinir = referans.alindi if referans is not None else gorler[-1].alindi
        oncekiler = [g for g in gorler if g.alindi < sinir]
        return oncekiler[-1] if oncekiler else None

    def bozuk_dosyalar(self, tur: str) -> list[Path]:
        return [y for y in self._dosyalar(tur) if self.oku(y) is None]


def fark(eski: list[dict[str, Any]], yeni: list[dict[str, Any]], *,
         anahtar: str, izlenen: tuple[str, ...]) -> dict[str, Any]:
    """İki anlık görüntü arasındaki değişim.

    Dört kova döner: `degisen`, `eklenen`, `kaybolan`, `sabit`.
    `kaybolan` ayrı tutulur çünkü bir rakibin listeden düşmesi ile
    fiyatının değişmesi bambaşka iki olaydır — ilki stok tükenmesi ya da
    listing kapanması olabilir, ikincisi fiyat hamlesi.
    """
    eski_ix = {str(s.get(anahtar)): s for s in eski if s.get(anahtar)}
    yeni_ix = {str(s.get(anahtar)): s for s in yeni if s.get(anahtar)}

    degisen: list[dict[str, Any]] = []
    sabit: list[str] = []
    for kimlik, y in yeni_ix.items():
        e = eski_ix.get(kimlik)
        if e is None:
            continue
        alanlar = {}
        for alan in izlenen:
            onceki, sonraki = e.get(alan), y.get(alan)
            if onceki != sonraki:
                alanlar[alan] = {"onceki": onceki, "sonraki": sonraki}
        if alanlar:
            degisen.append({anahtar: kimlik, "alanlar": alanlar})
        else:
            sabit.append(kimlik)

    return {"degisen": degisen,
            "eklenen": [yeni_ix[k] for k in yeni_ix if k not in eski_ix],
            "kaybolan": [eski_ix[k] for k in eski_ix if k not in yeni_ix],
            "sabit": sabit}
