"""Yapılandırma ve kimlik bilgisi yükleme.

MUNIN'in ODIN ile HİÇBİR kod bağlantısı yoktur: import yok, ortak modül yok,
ortak veri klasörü yok. Kendi kimlik dosyasını kendi okur.

GÜVENLİK — bu dosyanın en önemli işi
------------------------------------
Refresh token düz metindir. Masaüstündeki bir klasör çoğu makinede
iCloud Drive / OneDrive / Dropbox ile senkronlanır; oraya konan bir token
sessizce buluta kopyalanır ve bir daha geri alınamaz. `kimlik_yolu()` bu
yüzden VARSAYILAN OLARAK masaüstünü değil, kullanıcının ev dizinindeki
senkronsuz `~/.munin/` klasörünü kullanır ve senkron şüphesi varsa uyarır.

Ayarlanabilir üç şey:
  MUNIN_KIMLIK   — kimlik dosyasının tam yolu (varsayılan ~/.munin/kimlik.json)
  MUNIN_VERI     — snapshot/rapor klasörü (varsayılan <program>/veri)
  MUNIN_<ALAN>   — tek tek alan geçersiz kılma (ör. MUNIN_REFRESH_TOKEN)
"""
from __future__ import annotations

import json
import os
import stat
from dataclasses import dataclass
from pathlib import Path

# Kimlik dosyasında beklenen alanlar. Eksik olan ADIYLA bildirilir —
# "kimlik hatalı" demek sahibin neyi düzelteceğini göstermez.
ZORUNLU_ALANLAR = ("lwa_client_id", "lwa_client_secret", "refresh_token",
                   "marketplace_id", "seller_id")
ISTEGE_BAGLI = {"region": "na", "aws_region": "us-east-1"}

# Bulut senkron klasörü olduğu bilinen yol parçaları. Kimlik dosyası
# bunlardan birinin altındaysa program yüksek sesle uyarır.
_SENKRON_IZLERI = ("icloud", "onedrive", "dropbox", "google drive",
                   "googledrive", "yandex.disk", "mega", "pcloud", "box sync")

BOLGE_UCLARI = {"na": "https://sellingpartnerapi-na.amazon.com",
                "eu": "https://sellingpartnerapi-eu.amazon.com",
                "fe": "https://sellingpartnerapi-fe.amazon.com"}


class KimlikYok(Exception):
    """Kimlik sağlanmamış. Mesaj KURULUM talimatı içerir, ASLA anahtar
    değeri içermez."""


@dataclass(frozen=True)
class Kimlik:
    lwa_client_id: str
    lwa_client_secret: str
    refresh_token: str
    marketplace_id: str
    seller_id: str
    region: str = "na"

    @property
    def uc_nokta(self) -> str:
        return BOLGE_UCLARI.get(self.region, BOLGE_UCLARI["na"])

    def __repr__(self) -> str:
        # Bir traceback'te ya da print()'te token'ın görünmesini engeller.
        # Bu satır olmasaydı tek bir hata ayıklama print'i token'ı loglara
        # yazardı ve kimse fark etmezdi.
        return (f"Kimlik(seller_id={self.seller_id!r}, "
                f"marketplace_id={self.marketplace_id!r}, "
                f"region={self.region!r}, gizli_alanlar=<gizlendi>)")


def kimlik_yolu() -> Path:
    ozel = os.environ.get("MUNIN_KIMLIK")
    if ozel:
        return Path(ozel).expanduser()
    return Path.home() / ".munin" / "kimlik.json"


def veri_yolu() -> Path:
    ozel = os.environ.get("MUNIN_VERI")
    if ozel:
        return Path(ozel).expanduser()
    return Path(__file__).resolve().parent.parent / "veri"


def senkron_uyarilari(yol: Path) -> list[str]:
    """Kimlik dosyası bulut senkronlu bir klasörde mi, izinleri açık mı."""
    uyarilar: list[str] = []
    dusuk = str(yol).lower()
    for iz in _SENKRON_IZLERI:
        if iz in dusuk:
            uyarilar.append(
                f"Kimlik dosyasi bulut senkronlu gorunen bir yolda: '{iz}'. "
                f"Refresh token buluta kopyalanir. Dosyayi ~/.munin/ altina "
                f"tasi ve MUNIN_KIMLIK'i ayarla.")
            break
    try:
        kip = yol.stat().st_mode
    except OSError:
        return uyarilar
    if os.name != "nt" and kip & (stat.S_IRGRP | stat.S_IROTH):
        uyarilar.append(
            f"Kimlik dosyasi baskalarinca okunabilir (izin "
            f"{stat.filemode(kip)}). Duzelt: chmod 600 {yol}")
    return uyarilar


def kimlik_yukle(yol: Path | None = None) -> Kimlik:
    """Kimlik dosyasını (veya MUNIN_* ortam değişkenlerini) oku.

    Ortam değişkeni dosyayı EZER — tek seferlik koşumlar ve CI için.
    Hiçbir hata mesajı anahtar değeri içermez.
    """
    yol = yol or kimlik_yolu()
    ham: dict[str, str] = {}
    if yol.exists():
        try:
            ham = json.loads(yol.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise KimlikYok(
                f"{yol} gecerli JSON degil (satir {exc.lineno}). "
                f"Ornek icin KURULUM.md'ye bak.") from None
        if not isinstance(ham, dict):
            raise KimlikYok(f"{yol} bir JSON nesnesi olmali, liste degil.")

    alanlar: dict[str, str] = {}
    for ad in ZORUNLU_ALANLAR:
        deger = os.environ.get(f"MUNIN_{ad.upper()}") or ham.get(ad, "")
        alanlar[ad] = str(deger).strip()
    for ad, varsayilan in ISTEGE_BAGLI.items():
        if ad == "aws_region":
            continue
        alanlar[ad] = str(os.environ.get(f"MUNIN_{ad.upper()}")
                          or ham.get(ad) or varsayilan).strip()

    eksik = [ad for ad in ZORUNLU_ALANLAR if not alanlar[ad]]
    if eksik:
        ornek = json.dumps({ad: "..." for ad in ZORUNLU_ALANLAR}, indent=2)
        raise KimlikYok(
            f"Kimlik eksik: {', '.join(eksik)}.\n"
            f"Sahip su dosyayi KENDI olusturur: {yol}\n"
            f"Icerik (yalniz bu alanlar):\n{ornek}\n"
            f"Anahtarlari HICBIR sohbete yapistirma.")

    if alanlar["region"] not in BOLGE_UCLARI:
        raise KimlikYok(f"region '{alanlar['region']}' bilinmiyor — "
                        f"gecerli: {', '.join(BOLGE_UCLARI)}")
    return Kimlik(**alanlar)   # type: ignore[arg-type]
