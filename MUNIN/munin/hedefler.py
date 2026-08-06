"""`hedefler.json` — sahibin MUNIN'e ne izleyeceğini söylediği dosya.

Bu dosya kimlik bilgisi İÇERMEZ; gizli bir şey yoktur, program klasöründe
durabilir ve sürüm kontrolüne girebilir.

Biçim:

    {
      "skular": ["SKU-1", "SKU-2"],
      "hedef_keywordler": { "SKU-1": "cat litter mat" },
      "rakip_asinler": ["B0XXXXXXX1", "B0XXXXXXX2"],
      "kendi_asinlerim": ["B0YYYYYYY1"],
      "kesif_kelimeleri": ["cat litter mat", "litter trapping mat"],
      "fiyat_tabani": 25.0
    }

`skular` boşsa MUNIN hiçbir şey denetleyemez ve bunu ADIYLA söyler —
sessizce 0 SKU denetleyip "hepsi temiz" demez.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

DOSYA_ADI = "hedefler.json"

ORNEK = {
    "skular": [],
    "hedef_keywordler": {},
    "rakip_asinler": [],
    "kendi_asinlerim": [],
    "kesif_kelimeleri": [],
    "fiyat_tabani": 25.0,
}


class HedefYok(Exception):
    pass


@dataclass(frozen=True)
class Hedefler:
    skular: list[str] = field(default_factory=list)
    hedef_keywordler: dict[str, str] = field(default_factory=dict)
    rakip_asinler: list[str] = field(default_factory=list)
    kendi_asinlerim: list[str] = field(default_factory=list)
    kesif_kelimeleri: list[str] = field(default_factory=list)
    fiyat_tabani: float = 25.0

    def dogrula(self, gereken: str) -> None:
        """İstenen komut için gereken alan boşsa ADIYLA reddet."""
        eksikler = {
            "skular": ("denetle / kelimeler",
                       "izlenecek SKU listesi"),
            "rakip_asinler": ("rakipler",
                              "izlenecek rakip ASIN listesi"),
            "kesif_kelimeleri": ("kesfet",
                                 "rakip kesfi icin kelime listesi"),
        }
        if gereken in eksikler and not getattr(self, gereken):
            komut, aciklama = eksikler[gereken]
            raise HedefYok(
                f"'{komut}' icin {DOSYA_ADI} icindeki '{gereken}' dolu "
                f"olmali ({aciklama}).\n"
                f"Bos birakip devam etmek, 0 kayit denetleyip "
                f"'sorun yok' demek olurdu.")


def yol(veri_kok: Path) -> Path:
    return Path(veri_kok) / DOSYA_ADI


def yukle(veri_kok: Path) -> Hedefler:
    dosya = yol(veri_kok)
    if not dosya.exists():
        raise HedefYok(
            f"{dosya} yok. Once olustur:\n"
            f"    python -m munin hedefler-olustur\n"
            f"Sonra icine SKU'larini ve rakip ASIN'lerini yaz.")
    try:
        ham = json.loads(dosya.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HedefYok(f"{dosya} gecerli JSON degil (satir {exc.lineno})") from None
    if not isinstance(ham, dict):
        raise HedefYok(f"{dosya} bir JSON nesnesi olmali")

    return Hedefler(
        skular=[str(s) for s in ham.get("skular") or []],
        hedef_keywordler={str(k): str(v) for k, v in
                          (ham.get("hedef_keywordler") or {}).items()},
        rakip_asinler=[str(a).upper() for a in ham.get("rakip_asinler") or []],
        kendi_asinlerim=[str(a).upper() for a in
                         ham.get("kendi_asinlerim") or []],
        kesif_kelimeleri=[str(k) for k in ham.get("kesif_kelimeleri") or []],
        fiyat_tabani=float(ham.get("fiyat_tabani") or 25.0))


def olustur(veri_kok: Path) -> Path:
    dosya = yol(veri_kok)
    if dosya.exists():
        return dosya
    dosya.parent.mkdir(parents=True, exist_ok=True)
    dosya.write_text(json.dumps(ORNEK, ensure_ascii=False, indent=2),
                     encoding="utf-8")
    return dosya


def ozet(hedefler: Hedefler) -> dict[str, Any]:
    return {"sku": len(hedefler.skular),
            "hedef_keyword": len(hedefler.hedef_keywordler),
            "rakip_asin": len(hedefler.rakip_asinler),
            "kendi_asin": len(hedefler.kendi_asinlerim),
            "kesif_kelimesi": len(hedefler.kesif_kelimeleri)}
