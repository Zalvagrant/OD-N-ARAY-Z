"""HUGIN köprüsü — elle dosya alışverişi.

MUNIN, HUGIN'e KOD OLARAK BAĞLANMAZ. Ne import eder, ne API çağırır, ne
ortak veritabanı okur. Aralarındaki tek bağ, sahibin elle taşıdığı iki
dosyadır:

    veri/hugin/gelen/   ← HUGIN'den MUNIN'e (reklam kelime performansı)
    veri/hugin/giden/   → MUNIN'den HUGIN'e (listing kaynaklı gözlemler)

NEDEN BU KADAR KATI
-------------------
Elle veri alışverişi sessizce bozulur. Gavadolar/terra incelemesinin
saydığı bozulma yolları ve buradaki karşılıkları:

| Bozulma | Savunma |
|---|---|
| Eski dosya tekrar okunur | içerik hash'i + daha önce alınanlar defteri |
| HUGIN sütun adını değiştirir | KATI sütun eşleşmesi — fuzzy YOK, eksik sütun = ret |
| Dönem penceresi değişir | dosya kendi dönemini BEYAN ETMEK ZORUNDA |
| Para birimi değişir | dönem başlığında `para` alanı zorunlu |
| `%12,5` gibi yerel sayılar | sayı çözümü katı; başarısız satır sayılır |
| "search term" ile "targeting keyword" karışır | `tur` alanı zorunlu |
| İki alım arası boşluk/örtüşme | önceki alımla tarih karşılaştırması |

Tek bir çözümlenemeyen satır bile sessizce düşmez: alım makbuzunda
sayılır. Başlık geçersizse alım TAMAMEN reddedilir (fail-closed) —
yarım okunmuş bir reklam dosyası, tam okunmuş gibi rapora girerse
"bu kelime hiç dönüşmüyor" gibi TERSİNE bir sonuç üretir.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from .keywords import ReklamKelimesi

SOZLESME_SURUMU = 1

# HUGIN'in üretmesi gereken sütunlar. İsimler KATI eşleşir.
ZORUNLU_SUTUNLAR = ("arama_terimi", "gosterim", "tiklama", "harcama",
                    "siparis")
ISTEGE_BAGLI_SUTUNLAR = ("satis", "kampanya", "eslesme_tipi", "asin", "sku")

# Dosya başlığında (ilk satır, `#` ile başlayan JSON) zorunlu alanlar.
ZORUNLU_BASLIK = ("sozlesme", "kaynak", "tur", "baslangic", "bitis", "para")

GECERLI_TURLER = ("arama_terimi", "hedefleme_kelimesi")


class KopruHatasi(Exception):
    """Alım reddedildi. Mesaj her zaman NE yapılacağını söyler."""


@dataclass
class AlimMakbuzu:
    """Bir alımın kanıtı. Rapora aynen basılır."""

    dosya: str
    icerik_hash: str
    kaynak: str
    tur: str
    baslangic: str
    bitis: str
    para: str
    okunan_satir: int = 0
    cozulemeyen_satir: int = 0
    toplam_tiklama: int = 0
    toplam_harcama: float = 0.0
    toplam_siparis: int = 0
    uyarilar: list[str] = field(default_factory=list)
    alindi: str = ""

    def sozluk(self) -> dict[str, Any]:
        return {k: v for k, v in self.__dict__.items()}

    @property
    def temiz(self) -> bool:
        return self.cozulemeyen_satir == 0 and not self.uyarilar


def _sayi(ham: Any, ondalik: bool = False) -> float | int | None:
    """Katı sayı çözümü — belirsizlik varsa TAHMİN ETMEZ, None döner.

    `1.234,56` (TR) ile `1,234.56` (US) aynı sayıdır ama `1.234` tek başına
    iki farklı sayı olabilir: bin iki yüz otuz dört, ya da bir tam iki yüz
    otuz dört binde. Ayrım şu kuralla yapılır:

      · İki ayraç türü de varsa → SONUNCUSU ondalık ayracıdır (kesin).
      · Tek ayraç, ardından TAM 3 hane → binlik ayracıdır (`1.234` = 1234).
        Bir reklam harcamasının 3 ondalık hanesi olmaz; gösterim ve tıklama
        zaten tam sayıdır.
      · Tek ayraç, ardından 1–2 hane → ondalık ayracıdır (`12,5` = 12.5).
      · Başka her durum belirsizdir → None. Satır reddedilir ve makbuzda
        `cozulemeyen_satir` olarak SAYILIR.

    Tahmin etmenin bedeli somut: `1.234` yanlış okunursa harcama BİN KAT
    küçük görünür ve "bu kelime bedavaya dönüyor" gibi TERSİNE bir sonuç
    çıkar.
    """
    if ham is None:
        return None
    metin = str(ham).strip()
    for atilacak in ("$", "\u20ba", "\u20ac", "\u00a3", "%", " ", "\u00a0", "\u202f"):
        metin = metin.replace(atilacak, "")
    if not metin:
        return None

    eksi = metin.startswith("-")
    if eksi:
        metin = metin[1:]

    nokta, virgul = metin.count("."), metin.count(",")
    if nokta and virgul:
        if metin.rfind(",") > metin.rfind("."):        # 1.234,56
            metin = metin.replace(".", "").replace(",", ".")
        else:                                          # 1,234.56
            metin = metin.replace(",", "")
    elif nokta or virgul:
        ayrac = "." if nokta else ","
        parcalar = metin.split(ayrac)
        if not all(p.isdigit() for p in parcalar):
            return None
        son = parcalar[-1]
        if len(son) == 3 and len(parcalar[0]) <= 3 and all(
                len(p) == 3 for p in parcalar[1:]):
            metin = metin.replace(ayrac, "")           # binlik ayraci
        elif len(son) <= 2 and len(parcalar) == 2:
            metin = metin.replace(ayrac, ".")          # ondalik ayraci
        else:
            return None                                # belirsiz — reddet

    try:
        deger = float(metin)
    except ValueError:
        return None
    if eksi:
        deger = -deger
    return deger if ondalik else int(round(deger))


def _basligi_coz(ilk_satir: str, dosya: str) -> dict[str, Any]:
    duz = ilk_satir.strip()
    if not duz.startswith("#"):
        raise KopruHatasi(
            f"{dosya}: ilk satir donem basligi olmali.\n"
            f"Ornek:\n"
            f'# {{"sozlesme":1,"kaynak":"HUGIN","tur":"arama_terimi",'
            f'"baslangic":"2026-07-01","bitis":"2026-07-31","para":"USD"}}\n'
            f"Baslik olmadan alim REDDEDILIR — hangi doneme ait oldugu "
            f"bilinmeyen reklam verisi, listing kararini yanlis yone cevirir.")
    try:
        baslik = json.loads(duz.lstrip("#").strip())
    except json.JSONDecodeError as exc:
        raise KopruHatasi(f"{dosya}: donem basligi gecerli JSON degil "
                          f"({exc.msg})") from None
    eksik = [a for a in ZORUNLU_BASLIK if not baslik.get(a)]
    if eksik:
        raise KopruHatasi(f"{dosya}: baslikta eksik alan: {', '.join(eksik)}")
    if int(baslik["sozlesme"]) != SOZLESME_SURUMU:
        raise KopruHatasi(
            f"{dosya}: sozlesme surumu {baslik['sozlesme']}, MUNIN "
            f"{SOZLESME_SURUMU} bekliyor. HUGIN'in cikti bicimi degismis — "
            f"once HUGIN-KOPRUSU.md'yi guncelle.")
    if baslik["tur"] not in GECERLI_TURLER:
        raise KopruHatasi(
            f"{dosya}: tur '{baslik['tur']}' gecersiz. Gecerli: "
            f"{', '.join(GECERLI_TURLER)}. 'arama_terimi' musterinin GERCEKTEN "
            f"yazdigi sorgudur; 'hedefleme_kelimesi' senin hedefledigin "
            f"kelimedir. Ikisi karistirilirsa keyword bosluk analizi "
            f"tersine doner.")
    for alan in ("baslangic", "bitis"):
        try:
            date.fromisoformat(str(baslik[alan]))
        except ValueError:
            raise KopruHatasi(f"{dosya}: {alan} 'YYYY-AA-GG' bicimi degil: "
                              f"{baslik[alan]}") from None
    if baslik["baslangic"] > baslik["bitis"]:
        raise KopruHatasi(f"{dosya}: baslangic bitisten sonra")
    return baslik


def alim_defteri_yolu(hugin_kok: Path) -> Path:
    return Path(hugin_kok) / "alim-defteri.json"


def alim_defteri(hugin_kok: Path) -> list[dict[str, Any]]:
    yol = alim_defteri_yolu(hugin_kok)
    if not yol.exists():
        return []
    try:
        kayit = json.loads(yol.read_text(encoding="utf-8"))
        return kayit if isinstance(kayit, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def deftere_yaz(hugin_kok: Path, makbuz: AlimMakbuzu) -> None:
    defter = alim_defteri(hugin_kok)
    defter.append(makbuz.sozluk())
    yol = alim_defteri_yolu(hugin_kok)
    yol.parent.mkdir(parents=True, exist_ok=True)
    gecici = yol.with_suffix(".json.tmp")
    gecici.write_text(json.dumps(defter, ensure_ascii=False, indent=1),
                      encoding="utf-8")
    gecici.replace(yol)


def oku(yol: Path, hugin_kok: Path | None = None
        ) -> tuple[list[ReklamKelimesi], AlimMakbuzu]:
    """HUGIN çıktısını oku. Başlık geçersizse HİÇBİR satır alınmaz."""
    yol = Path(yol)
    ham = yol.read_bytes()
    icerik_hash = hashlib.sha256(ham).hexdigest()[:16]

    for kodlama in ("utf-8-sig", "utf-8", "iso-8859-9", "iso-8859-1"):
        try:
            metin = ham.decode(kodlama)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise KopruHatasi(f"{yol.name}: dosya hicbir bilinen kodlamayla "
                          f"okunamadi")

    satirlar = metin.splitlines()
    if not satirlar:
        raise KopruHatasi(f"{yol.name}: dosya bos")

    baslik = _basligi_coz(satirlar[0], yol.name)
    makbuz = AlimMakbuzu(
        dosya=yol.name, icerik_hash=icerik_hash,
        kaynak=str(baslik["kaynak"]), tur=str(baslik["tur"]),
        baslangic=str(baslik["baslangic"]), bitis=str(baslik["bitis"]),
        para=str(baslik["para"]),
        alindi=datetime.now(timezone.utc).isoformat())

    # -- mükerrer alım kontrolü --
    if hugin_kok is not None:
        for onceki in alim_defteri(hugin_kok):
            if onceki.get("icerik_hash") == icerik_hash:
                makbuz.uyarilar.append(
                    f"Bu dosyanin AYNISI daha once alinmis "
                    f"({onceki.get('alindi', '?')[:10]}). Ayni donem iki kez "
                    f"sayilirsa tiklama ve harcama iki katina cikar.")
                break
        else:
            _donem_bosluk_kontrolu(hugin_kok, makbuz)

    # -- gövde --
    govde = "\n".join(satirlar[1:])
    if not govde.strip():
        raise KopruHatasi(f"{yol.name}: baslik disinda satir yok")

    okuyucu = csv.DictReader(io.StringIO(govde))
    sutunlar = set(okuyucu.fieldnames or [])
    eksik = [s for s in ZORUNLU_SUTUNLAR if s not in sutunlar]
    if eksik:
        raise KopruHatasi(
            f"{yol.name}: eksik sutun: {', '.join(eksik)}.\n"
            f"Beklenen sutunlar: {', '.join(ZORUNLU_SUTUNLAR)}\n"
            f"Gelen sutunlar: {', '.join(sorted(sutunlar)) or '(yok)'}\n"
            f"MUNIN sutun adlarini TAHMIN ETMEZ — benzer isimli bir sutunu "
            f"otomatik eslestirmek, yanlis sutundan harcama okumaya yol acar.")

    kelimeler: list[ReklamKelimesi] = []
    for satir in okuyucu:
        makbuz.okunan_satir += 1
        terim = (satir.get("arama_terimi") or "").strip()
        gosterim = _sayi(satir.get("gosterim"))
        tiklama = _sayi(satir.get("tiklama"))
        siparis = _sayi(satir.get("siparis"))
        harcama = _sayi(satir.get("harcama"), ondalik=True)
        if not terim or None in (gosterim, tiklama, siparis, harcama):
            makbuz.cozulemeyen_satir += 1
            continue
        kelimeler.append(ReklamKelimesi(terim.lower(), int(gosterim),
                                        int(tiklama), int(siparis),
                                        float(harcama)))
        makbuz.toplam_tiklama += int(tiklama)
        makbuz.toplam_siparis += int(siparis)
        makbuz.toplam_harcama += float(harcama)

    if not kelimeler:
        raise KopruHatasi(
            f"{yol.name}: {makbuz.okunan_satir} satirin hicbiri "
            f"cozulemedi. Sayi bicimini kontrol et (ondalik ayraci).")
    if makbuz.cozulemeyen_satir:
        makbuz.uyarilar.append(
            f"{makbuz.cozulemeyen_satir}/{makbuz.okunan_satir} satir "
            f"cozulemedi ve HESABA KATILMADI.")
    return kelimeler, makbuz


def _donem_bosluk_kontrolu(hugin_kok: Path, makbuz: AlimMakbuzu) -> None:
    """Önceki alımla arada boşluk ya da örtüşme var mı."""
    ayni_tur = [a for a in alim_defteri(hugin_kok)
                if a.get("tur") == makbuz.tur and a.get("bitis")]
    if not ayni_tur:
        return
    son = max(ayni_tur, key=lambda a: str(a.get("bitis")))
    try:
        onceki_bitis = date.fromisoformat(str(son["bitis"]))
        yeni_baslangic = date.fromisoformat(makbuz.baslangic)
    except (ValueError, KeyError):
        return
    bosluk = (yeni_baslangic - onceki_bitis).days
    if bosluk > 1:
        makbuz.uyarilar.append(
            f"Onceki alim {son['bitis']} tarihinde bitti, bu alim "
            f"{makbuz.baslangic} tarihinde basliyor — arada {bosluk - 1} gun "
            f"veri YOK.")
    elif bosluk <= 0:
        makbuz.uyarilar.append(
            f"Bu alim onceki alimla ORTUSUYOR (onceki bitis: {son['bitis']}). "
            f"Ortusen gunler iki kez sayilir.")


# -- MUNIN → HUGIN -----------------------------------------------------
def giden_yaz(hedef: Path, gozlemler: list[dict[str, Any]], *,
              baslangic: str, bitis: str, kaynak_notu: str) -> Path:
    """MUNIN'in HUGIN'e verdiği gözlem dosyası.

    ⚠ BU DOSYA "ŞU KELİMEYİ NEGATİFE AL" DEMEZ. Bir kelimenin negatife
    alınması bir bütçe kararıdır ve MUNIN'in ölçmediği şeylere bağlıdır
    (marj, stok, kampanya hedefi). MUNIN yalnızca LISTING TARAFINDAKİ
    OLGUYU bildirir: "bu kelime listing'inde hiç geçmiyor" ya da "bu
    kelime listing'inde var ama denetimde başlık kesilmiş görünüyor".
    Kararı HUGIN'in kendi mantığı ve sahip verir.
    """
    hedef = Path(hedef)
    hedef.parent.mkdir(parents=True, exist_ok=True)
    baslik = {"sozlesme": SOZLESME_SURUMU, "kaynak": "MUNIN",
              "tur": "listing_gozlemi", "baslangic": baslangic,
              "bitis": bitis,
              "uretildi": datetime.now(timezone.utc).isoformat(),
              "not": kaynak_notu,
              "uyari": ("Bu dosya bir AKSIYON LISTESI DEGILDIR. Listing "
                        "tarafindan olculmus olgulari tasir; butce ve "
                        "negatif kararlarini HUGIN verir.")}

    sutunlar = ["arama_terimi", "listingde_geciyor", "gectigi_alanlar",
                "ba_rank", "munin_notu"]
    with hedef.open("w", encoding="utf-8", newline="") as dosya:
        dosya.write("# " + json.dumps(baslik, ensure_ascii=False) + "\n")
        yazici = csv.DictWriter(dosya, fieldnames=sutunlar)
        yazici.writeheader()
        for gozlem in gozlemler:
            yazici.writerow({s: gozlem.get(s, "") for s in sutunlar})
    return hedef
