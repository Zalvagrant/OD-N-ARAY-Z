"""Listing denetimi testleri."""
import unittest

from munin import audit
from munin.envelope import olculen, yok
from munin.metin import bayt, kelimeler


def listing(**degisiklik):
    temel = {
        "sku": "TEST-1",
        "asin": "B0TEST00001",
        "urun_tipi": "PET_SUPPLIES",
        "baslik": olculen("Marka Kedi Kumu Paspasi 60x45 cm Su Gecirmez",
                          "listings"),
        "bulletlar": olculen([f"Fayda {i}" for i in range(5)], "listings"),
        "backend_keywords": olculen(["kedi kumu paspas", "litter mat"],
                                    "listings"),
        "aciklama": olculen("Aciklama metni", "listings"),
        "gorsel_sayisi": olculen(7, "listings"),
        "amazon_sorunlari": [],
    }
    temel.update(degisiklik)
    return temel


def bul(bulgular, kural):
    for b in bulgular:
        if b.kural == kural:
            return b
    raise AssertionError(f"'{kural}' bulgusu uretilmedi")


class OlculemezGectiSayilmaz(unittest.TestCase):
    """Denetimin dürüstlüğü burada."""

    def test_okunamayan_baslik_gecti_degil(self):
        b = bul(audit.denetle(listing(baslik=yok("baslik", "alan yok"))),
                "Baslik uzunlugu")
        self.assertEqual(b.durum, audit.OLCULEMEZ)
        self.assertNotEqual(b.durum, audit.GECTI)

    def test_okunamayan_backend_gecti_degil(self):
        b = bul(audit.denetle(
            listing(backend_keywords=yok("backend", "generic_keyword yok"))),
            "Backend bayt kullanimi")
        self.assertEqual(b.durum, audit.OLCULEMEZ)

    def test_icerik_yargilari_daima_olculemez(self):
        bulgular = audit.denetle(listing())
        for kural in ("Bullet'lar benefit-odakli mi", "Infografik var mi",
                      "Urun videosu var mi", "A+ icerik var mi"):
            self.assertEqual(bul(bulgular, kural).durum, audit.OLCULEMEZ,
                             f"{kural} olculebilir gibi isaretlenmis")

    def test_hedef_keyword_yoksa_konum_olculemez(self):
        b = bul(audit.denetle(listing()), "Ana keyword baslikta once mi")
        self.assertEqual(b.durum, audit.OLCULEMEZ)
        self.assertIn("hedefler.json", b.gerekce)


class BaslikKurali(unittest.TestCase):
    def test_200_karakteri_asan_baslik_kalir(self):
        b = bul(audit.denetle(listing(baslik=olculen("x" * 201, "l"))),
                "Baslik uzunlugu")
        self.assertEqual(b.durum, audit.KALDI)
        self.assertIn("1 karakter fazla", b.gerekce)

    def test_tam_200_gecer(self):
        b = bul(audit.denetle(listing(baslik=olculen("x" * 200, "l"))),
                "Baslik uzunlugu")
        self.assertEqual(b.durum, audit.GECTI)

    def test_hedef_keyword_bastaysa_gecer(self):
        kayit = listing(baslik=olculen("Kedi Kumu Paspasi — Marka", "l"))
        kayit["hedef_keyword"] = "kedi kumu paspasi"
        self.assertEqual(bul(audit.denetle(kayit),
                             "Ana keyword baslikta once mi").durum, audit.GECTI)

    def test_hedef_keyword_sondaysa_kalir(self):
        kayit = listing(baslik=olculen("A" * 120 + " kedi kumu paspasi", "l"))
        kayit["hedef_keyword"] = "kedi kumu paspasi"
        self.assertEqual(bul(audit.denetle(kayit),
                             "Ana keyword baslikta once mi").durum, audit.KALDI)


class BackendBaytKurali(unittest.TestCase):
    def test_turkce_karakter_iki_bayt_sayilir(self):
        # 'ş' UTF-8'de 2 bayt. Karakterle olcen bir denetim bunu kacirir.
        self.assertEqual(bayt("şşş"), 6)
        self.assertEqual(len("şşş"), 3)

    def test_249_bayti_asan_backend_kalir(self):
        uzun = ["a" * 130, "b" * 130]     # 261 bayt (aradaki bosluk dahil)
        b = bul(audit.denetle(listing(backend_keywords=olculen(uzun, "l"))),
                "Backend bayt kullanimi")
        self.assertEqual(b.durum, audit.KALDI)
        self.assertIn("SESSIZCE keser", b.gerekce)

    def test_yarim_dolu_backend_kayip_olarak_isaretlenir(self):
        b = bul(audit.denetle(listing(backend_keywords=olculen(["kisa"], "l"))),
                "Backend alani doluluk")
        self.assertEqual(b.durum, audit.KALDI)
        self.assertIn("bos", b.gerekce)

    def test_backend_ic_tekrari_yakalanir(self):
        self.assertEqual(audit.backend_ic_tekrar(["mat mat", "kedi"]), ["mat"])

    def test_baslikta_gecen_kelime_backendde_israf(self):
        israf = audit.backend_tekrarlari(
            ["kedi paspas", "yeni kelime"], "Kedi Kumu Paspasi", [])
        self.assertIn("kedi", israf)
        self.assertNotIn("yeni", israf)

    def test_israf_kelimeleri_tekrarsiz_doner(self):
        israf = audit.backend_tekrarlari(["kedi kedi kedi"], "Kedi", [])
        self.assertEqual(israf, ["kedi"])


class GorselKurali(unittest.TestCase):
    def test_yedi_gorsel_gecer(self):
        self.assertEqual(bul(audit.denetle(listing()), "Gorsel sayisi").durum,
                         audit.GECTI)

    def test_alti_gorsel_kalir(self):
        b = bul(audit.denetle(listing(gorsel_sayisi=olculen(6, "l"))),
                "Gorsel sayisi")
        self.assertEqual(b.durum, audit.KALDI)
        self.assertIn("1 gorsel eksik", b.gerekce)

    def test_sifir_gorsel_ile_okunamayan_gorsel_ayri_sonuc_verir(self):
        sifir = bul(audit.denetle(listing(gorsel_sayisi=olculen(0, "l"))),
                    "Gorsel sayisi")
        okunmayan = bul(audit.denetle(
            listing(gorsel_sayisi=yok("gorsel", "nitelik yok"))),
            "Gorsel sayisi")
        self.assertEqual(sifir.durum, audit.KALDI)
        self.assertEqual(okunmayan.durum, audit.OLCULEMEZ)


class AmazonUyarilari(unittest.TestCase):
    def test_error_seviyesi_kaldi_uretir(self):
        b = bul(audit.denetle(listing(amazon_sorunlari=[
            {"severity": "ERROR", "message": "Eksik boyut bilgisi"}])),
            "Amazon listing uyarilari")
        self.assertEqual(b.durum, audit.KALDI)
        self.assertIn("Eksik boyut", b.gerekce)

    def test_yalnizca_warning_gecer(self):
        b = bul(audit.denetle(listing(amazon_sorunlari=[
            {"severity": "WARNING", "message": "Oneri"}])),
            "Amazon listing uyarilari")
        self.assertEqual(b.durum, audit.GECTI)


class PuanUretilmez(unittest.TestCase):
    def test_ozet_yalnizca_ham_sayilar(self):
        ozet = audit.ozet(audit.denetle(listing()))
        self.assertEqual(set(ozet), {audit.GECTI, audit.KALDI,
                                     audit.OLCULEMEZ})
        for anahtar in ozet:
            self.assertIsInstance(ozet[anahtar], int)

    def test_puan_fonksiyonu_gerekce_dondurur(self):
        self.assertIn("agirliklari sahip onaylamadi", audit.puan_yok())


class KelimeKurali(unittest.TestCase):
    def test_tek_karakterler_atilir(self):
        self.assertEqual(kelimeler("a bc d ef"), ["bc", "ef"])

    def test_kok_bulma_yapilmaz(self):
        # 'mat' ile 'mats' AYRI kelimedir — gevsek eslesme olmayan bir
        # kapsami var gibi gosterirdi.
        self.assertNotEqual(kelimeler("mat"), kelimeler("mats"))


if __name__ == "__main__":
    unittest.main()
