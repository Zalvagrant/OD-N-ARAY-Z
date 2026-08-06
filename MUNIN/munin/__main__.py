"""MUNIN komut satırı.

    python -m munin dogrula            kimlik + baglanti kontrolu
    python -m munin hedefler-olustur   hedefler.json iskeletini yaz
    python -m munin denetle            listing denetimi (kendi SKU'larim)
    python -m munin kelimeler          Brand Analytics + keyword bosluk
    python -m munin iadeler            iade neden ayristirmasi
    python -m munin basari             session/donusum — degisiklik ise yaradi mi
    python -m munin kesfet             kelimeden rakip ADAYI kesfi
    python -m munin rakipler           rakip profilleri + haftalik degisim
    python -m munin hugin-al <dosya>   HUGIN ciktisini al
    python -m munin hugin-ver          HUGIN'e gozlem dosyasi uret
    python -m munin bekleyenler        kuyruktaki raporlari topla

Rapor uçları asenkrondur (1–15 dk). `--bekle` verilmezse komut raporu
İSTER ve kimliğini kaydeder; `bekleyenler` ile sonra toplanır.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from . import __version__, audit, competitors, hedefler as hedef_mod
from . import hugin as hugin_mod
from . import keywords, report, returns, store
from .config import KimlikYok, kimlik_yolu, kimlik_yukle, senkron_uyarilari, veri_yolu
from .envelope import Yok
from .http import ApiHatasi, Oturum
from .reports import (Raporlar, RaporTalebi, hafta_hizala, satis_trafik_sorgusu,
                      sqp_sorgusu_oku)
from .spapi import FIYAT_YIGIN_BOYU, SpApi

BEKLEYEN_DOSYA = "bekleyen-raporlar.json"


# -- yardımcılar --------------------------------------------------------
def _yaz(*parcalar: Any) -> None:
    print(*parcalar, file=sys.stdout, flush=True)


def _hata(mesaj: str) -> int:
    print(f"\n✗ {mesaj}\n", file=sys.stderr, flush=True)
    return 1


def _baglan(argv: argparse.Namespace) -> tuple[SpApi, Raporlar, Path]:
    kimlik = kimlik_yukle()
    for uyari in senkron_uyarilari(kimlik_yolu()):
        print(f"⚠ GUVENLIK: {uyari}", file=sys.stderr)
    oturum = Oturum(kimlik)
    kok = Path(argv.veri) if argv.veri else veri_yolu()
    kok.mkdir(parents=True, exist_ok=True)
    return SpApi(oturum, kimlik), Raporlar(oturum, kimlik), kok


def _bekleyenler_oku(kok: Path) -> list[dict[str, Any]]:
    yol = kok / BEKLEYEN_DOSYA
    if not yol.exists():
        return []
    try:
        veri = json.loads(yol.read_text(encoding="utf-8"))
        return veri if isinstance(veri, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def _bekleyen_ekle(kok: Path, talep: RaporTalebi, tur: str) -> None:
    kayitlar = _bekleyenler_oku(kok)
    kayitlar.append({"rapor_id": talep.rapor_id, "tur": tur,
                     "amazon_tur": talep.tur, "baslangic": talep.baslangic,
                     "bitis": talep.bitis, "istendi": talep.istendi})
    (kok / BEKLEYEN_DOSYA).write_text(
        json.dumps(kayitlar, ensure_ascii=False, indent=1), encoding="utf-8")


def _bekleyen_sil(kok: Path, rapor_id: str) -> None:
    kayitlar = [k for k in _bekleyenler_oku(kok)
                if k.get("rapor_id") != rapor_id]
    (kok / BEKLEYEN_DOSYA).write_text(
        json.dumps(kayitlar, ensure_ascii=False, indent=1), encoding="utf-8")


# -- komutlar -----------------------------------------------------------
def komut_dogrula(argv: argparse.Namespace) -> int:
    _yaz(f"MUNIN {__version__} — kimlik ve baglanti kontrolu\n")
    yol = kimlik_yolu()
    _yaz(f"  kimlik dosyasi : {yol}  {'✓ var' if yol.exists() else '✗ YOK'}")

    uyarilar = senkron_uyarilari(yol)
    for uyari in uyarilar:
        _yaz(f"  ⚠ GUVENLIK    : {uyari}")

    try:
        kimlik = kimlik_yukle()
    except KimlikYok as exc:
        return _hata(str(exc))

    _yaz(f"  satici        : {kimlik.seller_id}")
    _yaz(f"  pazar         : {kimlik.marketplace_id}  ({kimlik.region})")
    _yaz(f"  uc nokta      : {kimlik.uc_nokta}")

    kok = Path(argv.veri) if argv.veri else veri_yolu()
    _yaz(f"  veri klasoru  : {kok}")
    hedeflerim: hedef_mod.Hedefler | None = None
    try:
        hedeflerim = hedef_mod.yukle(kok)
        _yaz(f"  hedefler.json : ✓ {hedef_mod.ozet(hedeflerim)}")
    except hedef_mod.HedefYok as exc:
        _yaz(f"  hedefler.json : ✗ {exc}")

    _yaz("\n  LWA token aliniyor...")
    oturum = Oturum(kimlik)
    api = SpApi(oturum, kimlik)
    # En ucuz gerçek çağrı: kendi SKU'larından biri varsa onu oku. SKU yoksa
    # canlı çağrı yapılmaz ve "baglanti calisiyor" DENMEZ — denenmemiş bir
    # bağlantıyı çalışıyor ilan etmek tam olarak bu programın yasakladığı şey.
    if hedeflerim is None or not hedeflerim.skular:
        _yaz("  — SKU tanimli degil, canli cagri DENENMEDI")
        _yaz("\n⚠ Kimlik dosyasi okundu ama hicbir canli cagri yapilmadi.\n"
             "  Baglantinin gercekten calistigini dogrulamak icin "
             "hedefler.json'a\n  en az bir SKU yaz ve tekrar kos.")
        return 0
    try:
        api.listing(hedeflerim.skular[0])
        _yaz(f"  ✓ Listings API calisti ({hedeflerim.skular[0]})")
    except ApiHatasi as exc:
        return _hata(f"canli cagri basarisiz: {exc}")

    _yaz("\n✓ Kimlik gecerli, baglanti calisiyor.")
    if uyarilar:
        _yaz("⚠ Yukaridaki guvenlik uyarilarini duzelt.")
    return 0


def komut_hedefler_olustur(argv: argparse.Namespace) -> int:
    kok = Path(argv.veri) if argv.veri else veri_yolu()
    yol = hedef_mod.olustur(kok)
    _yaz(f"✓ {yol}\n\nSimdi bu dosyayi doldur:\n"
         f"  skular            — denetlenecek kendi SKU'larin\n"
         f"  hedef_keywordler  — SKU basina ana keyword (baslikta once mi "
         f"olctugu icin)\n"
         f"  rakip_asinler     — izlenecek rakip ASIN'ler\n"
         f"  kendi_asinlerim   — Brand Analytics top-3'te kendini tanimak icin\n"
         f"  kesif_kelimeleri  — rakip adayi aranacak kelimeler")
    return 0


def komut_denetle(argv: argparse.Namespace) -> int:
    api, _, kok = _baglan(argv)
    hedeflerim = hedef_mod.yukle(kok)
    hedeflerim.dogrula("skular")
    depo = store.Depo(kok)
    depo.hazirla()

    _yaz(f"{len(hedeflerim.skular)} SKU okunuyor...")

    def ilerleme(sku: str, sira: int, toplam: int) -> None:
        print(f"  [{sira}/{toplam}] {sku}", file=sys.stderr, flush=True)

    listingler, hatalar = api.listingleri_cek(hedeflerim.skular, ilerleme)

    bolumler: list[str] = []
    olculemeyen_kayit: list[str] = []
    toplam = {audit.GECTI: 0, audit.KALDI: 0, audit.OLCULEMEZ: 0}
    json_veri: list[dict[str, Any]] = []

    for listing in listingler:
        sku = listing["sku"]
        listing["hedef_keyword"] = hedeflerim.hedef_keywordler.get(sku)
        bulgular = audit.denetle(listing)
        ozet = audit.ozet(bulgular)
        for anahtar, sayi in ozet.items():
            toplam[anahtar] += sayi
        bolumler.append(report.denetim_markdown(sku, listing, bulgular))
        for bulgu in bulgular:
            if bulgu.durum == audit.OLCULEMEZ:
                olculemeyen_kayit.append(f"`{sku}` {bulgu.kural} — "
                                         f"{bulgu.gerekce}")
        json_veri.append({
            "sku": sku, "asin": listing.get("asin"), "ozet": ozet,
            "bulgular": [b.__dict__ for b in bulgular]})

    kapak_satirlari = [
        f"**{len(listingler)}** SKU denetlendi"
        + (f" · **{len(hatalar)}** SKU okunamadi" if hatalar else ""),
        "",
        f"- Geçen kural: **{toplam[audit.GECTI]}**",
        f"- Kalan kural: **{toplam[audit.KALDI]}**",
        f"- Ölçülemeyen kural: **{toplam[audit.OLCULEMEZ]}**",
        "",
        f"> {audit.puan_yok()}",
        "",
    ]
    if hatalar:
        kapak_satirlari.append("## Okunamayan SKU'lar\n")
        for hata in hatalar:
            kapak_satirlari.append(f"- `{hata['sku']}` — {hata['hata']}")
        kapak_satirlari.append("")

    metin = (report.kapak("Listing Denetimi", kapak_satirlari)
             + "\n## SKU bazlı bulgular\n\n" + "\n\n".join(bolumler) + "\n\n"
             + report.olculemeyenler_bolumu(sorted(set(olculemeyen_kayit))))

    depo.yaz("listing", [{k: (v.deger if hasattr(v, "var") and v.var
                              else None) if hasattr(v, "var") else v
                          for k, v in l.items() if k != "amazon_sorunlari"}
                         for l in listingler],
             kaynak="listings-items-2021-08-01",
             donem={"tip": "anlik", "an": store.damga()},
             kapsam={"istenen_sku": len(hedeflerim.skular),
                     "okunan_sku": len(listingler),
                     "okunamayan_sku": len(hatalar)})

    yollar = report.rapor_yaz(depo.rapor, "denetim", metin,
                              {"ozet": toplam, "skular": json_veri,
                               "okunamayan": hatalar})
    _yaz(f"\n✓ {toplam[audit.KALDI]} kural kaldi, "
         f"{toplam[audit.OLCULEMEZ]} kural olculemedi")
    for ad, yol in yollar.items():
        _yaz(f"  {ad}: {yol}")
    return 0


def komut_kelimeler(argv: argparse.Namespace) -> int:
    api, raporlar, kok = _baglan(argv)
    hedeflerim = hedef_mod.yukle(kok)
    hedeflerim.dogrula("skular")
    depo = store.Depo(kok)
    depo.hazirla()

    baslangic, bitis = hafta_hizala(geri=argv.hafta)
    _yaz(f"Brand Analytics arama terimleri isteniyor: {baslangic} → {bitis} "
         f"(Pazar→Cumartesi hizali)")

    try:
        talep = raporlar.brand_analytics_arama(baslangic, bitis)
    except ApiHatasi as exc:
        return _hata(
            f"{exc}\n\n  Brand Analytics icin IKI sey gerekir:\n"
            f"  1. Brand Registry\n"
            f"  2. Gelistirici profilinde 'Brand Analytics' rolu\n"
            f"  403 aliyorsan ikisinden biri eksiktir.")

    if not argv.bekle:
        _bekleyen_ekle(kok, talep, "brand_analytics")
        _yaz(f"✓ Rapor istendi: {talep.rapor_id}\n"
             f"  Amazon kuyrugu 1–15 dk surer. Hazir olunca:\n"
             f"      python -m munin bekleyenler")
        return 0

    ham = raporlar.bekleyerek_al(talep, azami_saniye=argv.azami)
    satirlar = raporlar.ba_coz(ham)
    return _kelime_analizi(api, depo, hedeflerim, satirlar, baslangic, bitis)


def _kelime_analizi(api: SpApi, depo: store.Depo,
                    hedeflerim: hedef_mod.Hedefler,
                    ba_satirlari: list[dict[str, Any]],
                    baslangic: str, bitis: str) -> int:
    terimler, atlanan = keywords.ba_terimleri(ba_satirlari)
    _yaz(f"  {len(terimler)} arama terimi okundu, {atlanan} satir atlandi")

    depo.yaz("brand_analytics", ba_satirlari,
             kaynak="GET_BRAND_ANALYTICS_SEARCH_TERMS_REPORT",
             donem={"tip": "hafta", "baslangic": baslangic, "bitis": bitis},
             kapsam={"okunan_satir": len(ba_satirlari),
                     "cozulen_terim": len(terimler),
                     "atlanan_satir": atlanan})

    listingler, hatalar = api.listingleri_cek(hedeflerim.skular)
    kendi = set(hedeflerim.kendi_asinlerim)

    bolumler: list[str] = []
    olculemeyen: list[str] = []
    giden_gozlemler: list[dict[str, Any]] = []

    for listing in listingler:
        sku = listing["sku"]
        bosluklar = keywords.bosluk_analizi(terimler, listing, kendi)
        ozet = keywords.bosluk_ozeti(bosluklar)
        bolumler.append(f"### {sku}\n")
        bolumler.append(
            f"{ozet['incelenen_terim']} terim incelendi · "
            f"**{ozet['hic_gecmeyen']}** hiçbir alanda geçmiyor · "
            f"{ozet['sadece_backendde']} yalnızca backend'de · "
            f"{ozet['top3te_oldugum_terim']} terimde ASIN'im top-3'te\n")
        if ozet["en_yuksek_10_bosluk"]:
            bolumler.append(report._tablo(
                ["Arama terimi", "Sıklık sırası", "Top-3 tıklanan ASIN"],
                [[b["terim"], b["rank"], ", ".join(b["top3_asinler"]) or "—"]
                 for b in ozet["en_yuksek_10_bosluk"]]))
            bolumler.append(
                "> Sıklık sırası bir **sıralamadır, arama hacmi değildir.** "
                "1. sıradaki kelimenin 2. sıradakinden kaç kat çok arandığı "
                "Brand Analytics'te yer almaz ve MUNIN bunu tahmin etmez.\n"
                "> Top-3 tıklanan ASIN'ler o kelimedeki tıklama payına "
                "sahiptir; **senin ASIN'in o üçte değilse o kelimedeki payın "
                "hakkında hiçbir ölçüm yoktur.**\n")
        for bosluk in bosluklar:
            if bosluk.hic_gecmiyor:
                giden_gozlemler.append({
                    "arama_terimi": bosluk.terim,
                    "listingde_geciyor": "hayir",
                    "gectigi_alanlar": "",
                    "ba_rank": bosluk.rank,
                    "munin_notu": f"{sku} listing'inde hicbir alanda gecmiyor"})

    for hata in hatalar:
        olculemeyen.append(f"`{hata['sku']}` listing okunamadi — {hata['hata']}")
    if atlanan:
        olculemeyen.append(
            f"Brand Analytics raporunda {atlanan} satir cozulemedi "
            f"(terim ya da siklik sirasi alani okunamadi)")

    metin = (report.kapak("Keyword Boşluk Analizi", [
        f"Dönem: **{baslangic} → {bitis}** (Brand Analytics haftası)",
        f"{len(terimler)} arama terimi · {len(listingler)} SKU",
        "",
        f"Eşleşme kuralı: `{audit.KELIME_KURALI}`",
        ""]) + "\n" + "\n".join(bolumler) + "\n\n"
        + report.olculemeyenler_bolumu(olculemeyen))

    yollar = report.rapor_yaz(depo.rapor, "kelimeler", metin,
                              {"donem": {"baslangic": baslangic, "bitis": bitis},
                               "terim_sayisi": len(terimler),
                               "atlanan_satir": atlanan})
    if giden_gozlemler:
        giden = hugin_mod.giden_yaz(
            depo.hugin / "giden" / f"munin-gozlem-{bitis}.csv",
            giden_gozlemler, baslangic=baslangic, bitis=bitis,
            kaynak_notu="Brand Analytics x listing icerigi kesisimi")
        _yaz(f"  HUGIN'e gozlem dosyasi: {giden}")
    for ad, yol in yollar.items():
        _yaz(f"  {ad}: {yol}")
    return 0


def komut_iadeler(argv: argparse.Namespace) -> int:
    _, raporlar, kok = _baglan(argv)
    depo = store.Depo(kok)
    depo.hazirla()

    bitis = date.today()
    baslangic = bitis - timedelta(days=argv.gun)
    _yaz(f"Iade raporu isteniyor: {baslangic} → {bitis}")
    talep = raporlar.iadeler(baslangic.isoformat(), bitis.isoformat())

    if not argv.bekle:
        _bekleyen_ekle(kok, talep, "iadeler")
        _yaz(f"✓ Rapor istendi: {talep.rapor_id}\n"
             f"      python -m munin bekleyenler")
        return 0

    ham = raporlar.bekleyerek_al(talep, azami_saniye=argv.azami)
    return _iade_analizi(depo, raporlar.iade_coz(ham),
                         baslangic.isoformat(), bitis.isoformat())


def _iade_analizi(depo: store.Depo, satirlar: list[dict[str, Any]],
                  baslangic: str, bitis: str) -> int:
    sonuc = returns.ayristir(satirlar)
    depo.yaz("iadeler", satirlar, kaynak="GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA",
             donem={"tip": "aralik", "baslangic": baslangic, "bitis": bitis},
             kapsam={"okunan_satir": len(satirlar),
                     "islenen_satir": sonuc["islenen_satir"],
                     "okunamayan_satir": sonuc["okunamayan_satir"]})

    kovalar = sonuc["kova_dagilimi"]
    toplam = sonuc["toplam_iade_adedi"]
    satirlar_md = [
        f"Dönem: **{baslangic} → {bitis}**",
        f"Toplam iade adedi: **{toplam}** "
        f"({sonuc['islenen_satir']} satır işlendi, "
        f"{sonuc['okunamayan_satir']} satır okunamadı)",
        "",
        "## Teşhis\n",
        f"> {returns.teshis(sonuc)}",
        "",
        "## Neden kovaları\n",
        report._tablo(["Kova", "Adet", "Pay"],
                      [[returns.KOVA_ADLARI.get(k, k), s,
                        f"%{s * 100 // toplam}" if toplam else "—"]
                       for k, s in sorted(kovalar.items(),
                                          key=lambda p: -p[1])]),
        "",
        "> Kova eşlemesi bir **politika kararıdır**, ölçüm değil. "
        "`munin/returns.py` içindeki üç kümede duruyor ve değiştirilebilir.",
        "",
        "## En çok iade edilen 15 ASIN\n",
        report._tablo(
            ["ASIN", "Ürün", "Toplam", "Listing kaynaklı", "Ürün kaynaklı",
             "En sık neden"],
            [[a.asin, a.urun_adi[:44], a.toplam,
              a.kovalar.get("listing", 0), a.kovalar.get("urun", 0),
              max(a.nedenler, key=lambda n: a.nedenler[n]) if a.nedenler else "—"]
             for a in sonuc["asin_bazli"][:15]]),
    ]
    if sonuc["eslenemeyen_kodlar"]:
        satirlar_md += [
            "", "## Eşlenemeyen neden kodları\n",
            "Bu kodlar üç kovadan hiçbirine yazılmadı — `munin/returns.py` "
            "içine eklenmeli:\n",
            *[f"- `{k}`" for k in sonuc["eslenemeyen_kodlar"]]]

    olculemeyen = []
    if sonuc["okunamayan_satir"]:
        olculemeyen.append(
            f"{sonuc['okunamayan_satir']} iade satiri ASIN ya da neden alani "
            f"okunamadigi icin HESABA KATILMADI")
    olculemeyen.append(
        "Iade orani (%) — MUNIN iade SAYISINI olcer; oran icin ayni donemin "
        "SIPARIS sayisi gerekir, o da bu raporda yoktur")

    metin = (report.kapak("İade Neden Ayrıştırması", satirlar_md) + "\n"
             + report.olculemeyenler_bolumu(olculemeyen))
    yollar = report.rapor_yaz(depo.rapor, "iadeler", metin,
                              {k: v for k, v in sonuc.items()
                               if k != "asin_bazli"})
    _yaz(f"\n{returns.teshis(sonuc)}")
    for ad, yol in yollar.items():
        _yaz(f"  {ad}: {yol}")
    return 0


def komut_basari(argv: argparse.Namespace) -> int:
    """Sales & Traffic — 'değişiklik işe yaradı mı' sorusunun tek cevabı."""
    _, raporlar, kok = _baglan(argv)
    depo = store.Depo(kok)
    depo.hazirla()
    kimlik = kimlik_yukle()

    bitis = date.today() - timedelta(days=2)      # Amazon ~2 gun gecikmeli
    baslangic = bitis - timedelta(days=argv.gun)
    sorgu = satis_trafik_sorgusu(baslangic.isoformat(), bitis.isoformat(),
                                 kimlik.marketplace_id)
    _yaz(f"Data Kiosk sorgusu gonderiliyor: {baslangic} → {bitis}")
    sorgu_id = raporlar.kiosk_sor(sorgu)
    _yaz(f"  sorgu kimligi: {sorgu_id}")

    if not argv.bekle:
        _bekleyen_ekle(kok, RaporTalebi(sorgu_id, "datakiosk-satis-trafik",
                                        baslangic.isoformat(),
                                        bitis.isoformat(),
                                        datetime.now(timezone.utc).isoformat()),
                       "satis_trafik")
        _yaz("  Hazir olunca: python -m munin bekleyenler")
        return 0

    import time
    biter = time.monotonic() + argv.azami
    while time.monotonic() < biter:
        durum, satirlar = raporlar.kiosk_topla(sorgu_id)
        if satirlar is not None:
            return _basari_raporu(depo, satirlar, baslangic.isoformat(),
                                  bitis.isoformat())
        time.sleep(15)
    return _hata(f"Data Kiosk sorgusu {argv.azami} sn icinde bitmedi "
                 f"({sorgu_id}) — 'bekleyenler' ile sonra topla")


def _basari_raporu(depo: store.Depo, satirlar: list[dict[str, Any]],
                   baslangic: str, bitis: str) -> int:
    duz: list[dict[str, Any]] = []
    for satir in satirlar:
        trafik = satir.get("trafficByAsin") or {}
        satis = satir.get("salesByAsin") or {}
        duz.append({
            "asin": satir.get("childAsin"), "sku": satir.get("sku"),
            "sessions": trafik.get("sessions"),
            "page_views": trafik.get("pageViews"),
            "buybox_yuzde": trafik.get("buyBoxPercentage"),
            "birim_session_yuzde": trafik.get("unitSessionPercentage"),
            "birim": satis.get("unitsOrdered"),
            "ciro": (satis.get("orderedProductSales") or {}).get("amount"),
            "para": (satis.get("orderedProductSales") or {}).get("currencyCode"),
        })

    depo.yaz("satis_trafik", duz, kaynak="datakiosk-analytics_salesAndTraffic_2024_04_24",
             donem={"tip": "aralik", "baslangic": baslangic, "bitis": bitis},
             kapsam={"satir": len(duz)})

    onceki = depo.onceki("satis_trafik")
    karsilastirma = ""
    if onceki:
        eski = {s["asin"]: s for s in onceki.satirlar if s.get("asin")}
        satirlar_md = []
        for kayit in duz:
            e = eski.get(kayit["asin"])
            if not e:
                continue
            satirlar_md.append([
                kayit["asin"],
                f"{e.get('sessions')} → {kayit.get('sessions')}",
                f"{e.get('birim_session_yuzde')} → "
                f"{kayit.get('birim_session_yuzde')}",
                f"{e.get('birim')} → {kayit.get('birim')}"])
        if satirlar_md:
            karsilastirma = (
                f"\n## Önceki ölçümle karşılaştırma\n\n"
                f"Önceki ölçüm dönemi: **{onceki.donem.get('baslangic')} → "
                f"{onceki.donem.get('bitis')}**\n\n"
                + report._tablo(["ASIN", "Session", "Birim/Session %",
                                 "Birim"], satirlar_md)
                + "\n> İki dönem **aynı uzunlukta değilse** bu karşılaştırma "
                  "yanıltıcıdır — dönem başlıklarını kontrol et.\n")
    else:
        karsilastirma = ("\n## Önceki ölçümle karşılaştırma\n\n"
                         "_Bu ilk ölçüm. Karşılaştırma için en az iki koşum "
                         "gerekir — listing değişikliğinden ÖNCE ve SONRA._\n")

    metin = (report.kapak("Başarı Ölçümü — Session ve Dönüşüm", [
        f"Dönem: **{baslangic} → {bitis}**",
        f"{len(duz)} ASIN satırı",
        "",
        "Bu rapor tek bir soruyu cevaplar: **listing değişikliğim işe "
        "yaradı mı?** Cevap `unitSessionPercentage` (birim/session dönüşümü) "
        "ve `sessions` (trafik) alanlarındadır.",
        "",
        report._tablo(
            ["ASIN", "Session", "Sayfa görüntüleme", "Birim/Session %",
             "Birim", "Ciro"],
            [[k["asin"], k["sessions"], k["page_views"],
              k["birim_session_yuzde"], k["birim"],
              f"{k['ciro']} {k['para'] or ''}".strip()]
             for k in sorted(duz, key=lambda k: -(k.get("sessions") or 0))[:30]]),
    ]) + karsilastirma + "\n"
        + report.olculemeyenler_bolumu([]))

    yollar = report.rapor_yaz(depo.rapor, "basari", metin, {"satirlar": duz})
    for ad, yol in yollar.items():
        _yaz(f"  {ad}: {yol}")
    return 0


def komut_kesfet(argv: argparse.Namespace) -> int:
    api, _, kok = _baglan(argv)
    hedeflerim = hedef_mod.yukle(kok)
    hedeflerim.dogrula("kesif_kelimeleri")

    _yaz("⚠ Bu komut ARAMA SIRALAMASI VERMEZ. `searchCatalogItems` bir "
         "katalog\n  eslesme aramasidir; musterinin gordugu arama motoru "
         "DEGILDIR.\n  Ciktisi yalnizca rakip ADAYI listesidir.\n")

    bulunanlar: dict[str, dict[str, Any]] = {}
    for kelime in hedeflerim.kesif_kelimeleri:
        try:
            for oge in api.katalog_ara(kelime):
                asin = oge.get("asin")
                if not asin or asin in set(hedeflerim.kendi_asinlerim):
                    continue
                kayit = bulunanlar.setdefault(
                    asin, {**oge, "kelimeler": []})
                kayit["kelimeler"].append(kelime)
            _yaz(f"  '{kelime}' → {len(bulunanlar)} benzersiz ASIN (kumulatif)")
        except ApiHatasi as exc:
            _yaz(f"  '{kelime}' basarisiz: {exc}")

    sirali = sorted(bulunanlar.values(), key=lambda o: -len(o["kelimeler"]))
    _yaz(f"\n{len(sirali)} rakip adayi bulundu. Kac kelimede ciktigina gore "
         f"sirali:\n")
    for oge in sirali[:25]:
        _yaz(f"  {oge['asin']}  [{len(oge['kelimeler'])} kelime]  "
             f"{str(oge.get('marka') or '?')[:18]:18}  "
             f"{str(oge.get('baslik') or '')[:60]}")
    _yaz(f"\nIzlemek istediklerini hedefler.json → rakip_asinler'e ekle, "
         f"sonra:\n    python -m munin rakipler")
    return 0


def komut_rakipler(argv: argparse.Namespace) -> int:
    api, _, kok = _baglan(argv)
    hedeflerim = hedef_mod.yukle(kok)
    hedeflerim.dogrula("rakip_asinler")
    depo = store.Depo(kok)
    depo.hazirla()

    asinler = hedeflerim.rakip_asinler
    _yaz(f"{len(asinler)} rakip ASIN okunuyor...")

    fiyatlar: dict[str, Any] = {}
    for basla in range(0, len(asinler), FIYAT_YIGIN_BOYU):
        yigin = asinler[basla:basla + FIYAT_YIGIN_BOYU]
        try:
            fiyatlar.update(api.fiyat_coz(api.rekabetci_ozet(yigin)))
        except ApiHatasi as exc:
            _yaz(f"  fiyat yigini basarisiz ({yigin[0]}…): {exc}")

    kartlar: list[dict[str, Any]] = []
    hatalar: list[str] = []
    for sira, asin in enumerate(asinler, 1):
        print(f"  [{sira}/{len(asinler)}] {asin}", file=sys.stderr, flush=True)
        try:
            katalog = api.katalog_coz(asin, api.katalog_oge(asin))
        except ApiHatasi as exc:
            hatalar.append(f"`{asin}` katalog okunamadi — {exc}")
            continue
        kartlar.append(competitors.profil_kartı(katalog, fiyatlar.get(asin)))

    onceki = depo.son("rakipler")
    depo.yaz("rakipler", kartlar, kaynak="catalog-2022-04-01 + pricing-2022-05-01",
             donem={"tip": "anlik", "an": store.damga()},
             kapsam={"istenen": len(asinler), "okunan": len(kartlar)})

    satirlar_md = [
        f"**{len(kartlar)}/{len(asinler)}** rakip ASIN okundu",
        "",
        report._tablo(
            ["ASIN", "Marka", "Fiyat", "BSR", "Görsel", "Bullet", "Başlık"],
            [[k["asin"], k["marka"] or "—",
              f"{k['fiyat_tutar']} {k['fiyat_para'] or ''}".strip()
              if k["fiyat_tutar"] is not None else "ölçülmedi",
              k["bsr"] if k["bsr"] is not None else "ölçülmedi",
              k["gorsel_sayisi"] if k["gorsel_sayisi"] is not None else "—",
              k["bullet_sayisi"] if k["bullet_sayisi"] is not None else "—",
              str(k["baslik"] or "")[:52]] for k in kartlar]),
        "",
        "> **Rating ve review sayısı bilerek yok.** Hiçbir SP-API ucundan "
        "gelmez; scraping ile doldurmak satıcı hesabını riske atar. Boş "
        "kolon bile bırakılmadı çünkü bir gün dolacağı izlenimi verirdi.",
        "",
        "> **Tehdit seviyesi üretilmiyor.** Bir rakibin tehdit olup olmadığı "
        "ölçülmemiş ağırlıklarla üretilecek bir yargıdır. Onun yerine "
        "ölçülen değişim aşağıda.",
        ""]

    taban_ihlali = competitors.fiyat_tabani_ihlali(kartlar,
                                                   hedeflerim.fiyat_tabani)
    if taban_ihlali:
        satirlar_md += [
            f"## Fiyat tabanının (${hedeflerim.fiyat_tabani:.0f}) altındakiler\n",
            report._tablo(["ASIN", "Marka", "Fiyat"],
                          [[k["asin"], k["marka"] or "—",
                            f"{k['fiyat_tutar']} {k['fiyat_para'] or ''}"]
                           for k in taban_ihlali]),
            "> Kendi kuralın: *dibe yarışma, tabanı koru.* Bu bir gözlemdir, "
            "aksiyon değil.\n"]

    if onceki:
        karsilastirma = competitors.karsilastir(onceki.satirlar, kartlar)
        dikkat = competitors.dikkat_cekenler(karsilastirma)
        satirlar_md += [
            f"## Değişim — önceki ölçüm: {onceki.alindi}\n",
            f"{karsilastirma['degisen_rakip']} rakipte değişiklik · "
            f"{karsilastirma['sabit_rakip']} sabit\n"]
        satirlar_md += ([f"- {d}" for d in dikkat] if dikkat
                        else ["_Eşiği aşan bir hareket yok._"])
        satirlar_md.append("")
    else:
        satirlar_md += ["## Değişim\n",
                        "_Bu ilk ölçüm. Değişim için en az iki koşum gerekir._\n"]

    olculemeyen = list(hatalar)
    for kart in kartlar:
        for ad, gerekce in (kart.get("_olculemeyenler") or {}).items():
            olculemeyen.append(f"`{kart['asin']}` {ad} — {gerekce}")

    metin = (report.kapak("Rakip İstihbaratı", satirlar_md) + "\n"
             + report.olculemeyenler_bolumu(sorted(set(olculemeyen))))
    yollar = report.rapor_yaz(depo.rapor, "rakipler", metin,
                              {"kartlar": kartlar})
    for ad, yol in yollar.items():
        _yaz(f"  {ad}: {yol}")
    return 0


def komut_hugin_al(argv: argparse.Namespace) -> int:
    kok = Path(argv.veri) if argv.veri else veri_yolu()
    depo = store.Depo(kok)
    depo.hazirla()
    try:
        kelimeler_listesi, makbuz = hugin_mod.oku(Path(argv.dosya), depo.hugin)
    except hugin_mod.KopruHatasi as exc:
        return _hata(str(exc))

    _yaz(f"✓ {len(kelimeler_listesi)} kelime alindi\n")
    _yaz(f"  kaynak      : {makbuz.kaynak} ({makbuz.tur})")
    _yaz(f"  donem       : {makbuz.baslangic} → {makbuz.bitis} "
         f"[{makbuz.para}]")
    _yaz(f"  satir       : {makbuz.okunan_satir} okundu, "
         f"{makbuz.cozulemeyen_satir} cozulemedi")
    _yaz(f"  toplam      : {makbuz.toplam_tiklama} tiklama · "
         f"{makbuz.toplam_harcama:.2f} {makbuz.para} · "
         f"{makbuz.toplam_siparis} siparis")
    _yaz(f"  icerik hash : {makbuz.icerik_hash}")
    for uyari in makbuz.uyarilar:
        _yaz(f"  ⚠ {uyari}")

    hugin_mod.deftere_yaz(depo.hugin, makbuz)
    depo.yaz("hugin_kelimeler",
             [{"terim": k.terim, "gosterim": k.gosterim, "tiklama": k.tiklama,
               "siparis": k.siparis, "harcama": k.harcama}
              for k in kelimeler_listesi],
             kaynak=f"HUGIN/{makbuz.tur}",
             donem={"tip": "aralik", "baslangic": makbuz.baslangic,
                    "bitis": makbuz.bitis, "para": makbuz.para},
             kapsam=makbuz.sozluk())
    _yaz(f"\n  Kaydedildi. Simdi: python -m munin denetle  (ya da kelimeler)")
    return 0


def komut_hugin_ver(argv: argparse.Namespace) -> int:
    kok = Path(argv.veri) if argv.veri else veri_yolu()
    depo = store.Depo(kok)
    depo.hazirla()
    son = depo.son("hugin_kelimeler")
    if son is None:
        return _hata("Once HUGIN verisi al: python -m munin hugin-al <dosya>")
    _yaz(f"Son HUGIN alimi: {son.donem.get('baslangic')} → "
         f"{son.donem.get('bitis')} ({len(son.satirlar)} kelime)\n"
         f"Gozlem dosyasi 'kelimeler' komutunda uretiliyor — once onu kos.")
    return 0


def komut_bekleyenler(argv: argparse.Namespace) -> int:
    api, raporlar, kok = _baglan(argv)
    depo = store.Depo(kok)
    depo.hazirla()
    bekleyen = _bekleyenler_oku(kok)
    if not bekleyen:
        _yaz("Kuyrukta rapor yok.")
        return 0

    _yaz(f"{len(bekleyen)} bekleyen rapor:\n")
    for kayit in list(bekleyen):
        rapor_id = kayit["rapor_id"]
        tur = kayit["tur"]
        try:
            if tur == "satis_trafik":
                durum, satirlar = raporlar.kiosk_topla(rapor_id)
                if satirlar is None:
                    _yaz(f"  {tur} ({rapor_id}): {durum} — henuz hazir degil")
                    continue
                _basari_raporu(depo, satirlar, kayit["baslangic"],
                               kayit["bitis"])
            else:
                durum, ham = raporlar.topla(rapor_id)
                if ham is None:
                    _yaz(f"  {tur} ({rapor_id}): {durum} — henuz hazir degil")
                    continue
                if tur == "brand_analytics":
                    hedeflerim = hedef_mod.yukle(kok)
                    _kelime_analizi(api, depo, hedeflerim,
                                    raporlar.ba_coz(ham), kayit["baslangic"],
                                    kayit["bitis"])
                elif tur == "iadeler":
                    _iade_analizi(depo, raporlar.iade_coz(ham),
                                  kayit["baslangic"], kayit["bitis"])
        except ApiHatasi as exc:
            _yaz(f"  {tur} ({rapor_id}): ✗ {exc}")
            _bekleyen_sil(kok, rapor_id)
            continue
        _bekleyen_sil(kok, rapor_id)
        _yaz(f"  ✓ {tur} toplandi")
    return 0


# -- giriş noktası ------------------------------------------------------
def olustur_ayristirici() -> argparse.ArgumentParser:
    ana = argparse.ArgumentParser(
        prog="munin",
        description="MUNIN — Amazon listing optimizasyonu ve rakip "
                    "istihbarati. Olculmemis hicbir sayi basilmaz.")
    ana.add_argument("--veri", help="veri klasoru (varsayilan: <program>/veri)")
    ana.add_argument("--surum", action="version", version=f"MUNIN {__version__}")
    alt = ana.add_subparsers(dest="komut", required=True)

    alt.add_parser("dogrula", help="kimlik + baglanti kontrolu"
                   ).set_defaults(fn=komut_dogrula)
    alt.add_parser("hedefler-olustur", help="hedefler.json iskeletini yaz"
                   ).set_defaults(fn=komut_hedefler_olustur)
    alt.add_parser("denetle", help="listing denetimi"
                   ).set_defaults(fn=komut_denetle)

    p = alt.add_parser("kelimeler", help="Brand Analytics + keyword bosluk")
    p.add_argument("--hafta", type=int, default=1,
                   help="kac hafta geriye (1 = son tamamlanmis hafta)")
    p.add_argument("--bekle", action="store_true", help="rapor bitene kadar bekle")
    p.add_argument("--azami", type=int, default=900, help="azami bekleme (sn)")
    p.set_defaults(fn=komut_kelimeler)

    p = alt.add_parser("iadeler", help="iade neden ayristirmasi")
    p.add_argument("--gun", type=int, default=60)
    p.add_argument("--bekle", action="store_true")
    p.add_argument("--azami", type=int, default=900)
    p.set_defaults(fn=komut_iadeler)

    p = alt.add_parser("basari", help="session/donusum olcumu")
    p.add_argument("--gun", type=int, default=30)
    p.add_argument("--bekle", action="store_true")
    p.add_argument("--azami", type=int, default=900)
    p.set_defaults(fn=komut_basari)

    alt.add_parser("kesfet", help="kelimeden rakip adayi kesfi"
                   ).set_defaults(fn=komut_kesfet)
    alt.add_parser("rakipler", help="rakip profilleri + degisim"
                   ).set_defaults(fn=komut_rakipler)

    p = alt.add_parser("hugin-al", help="HUGIN ciktisini al")
    p.add_argument("dosya")
    p.set_defaults(fn=komut_hugin_al)

    alt.add_parser("hugin-ver", help="HUGIN'e gozlem dosyasi"
                   ).set_defaults(fn=komut_hugin_ver)
    alt.add_parser("bekleyenler", help="kuyruktaki raporlari topla"
                   ).set_defaults(fn=komut_bekleyenler)
    return ana


def main(argv: list[str] | None = None) -> int:
    ayristirici = olustur_ayristirici()
    secenekler = ayristirici.parse_args(argv)
    try:
        return int(secenekler.fn(secenekler) or 0)
    except KimlikYok as exc:
        return _hata(str(exc))
    except hedef_mod.HedefYok as exc:
        return _hata(str(exc))
    except ApiHatasi as exc:
        return _hata(str(exc))
    except KeyboardInterrupt:
        return _hata("kullanici iptal etti")


if __name__ == "__main__":
    raise SystemExit(main())
