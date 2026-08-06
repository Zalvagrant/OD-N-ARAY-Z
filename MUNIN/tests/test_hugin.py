"""HUGIN köprüsü testleri — elle veri alışverişinin sessizce bozulduğu
her yol burada bir testtir."""
import json
import tempfile
import unittest
from pathlib import Path

from munin import hugin

BASLIK = ('# {"sozlesme":1,"kaynak":"HUGIN","tur":"arama_terimi",'
          '"baslangic":"2026-07-01","bitis":"2026-07-31","para":"USD"}')
SUTUNLAR = "arama_terimi,gosterim,tiklama,harcama,siparis"


def dosya_yaz(klasor, ad, icerik):
    yol = Path(klasor) / ad
    yol.write_text(icerik, encoding="utf-8")
    return yol


class BaslikZorunlu(unittest.TestCase):
    def setUp(self):
        self.gecici = tempfile.TemporaryDirectory()
        self.klasor = Path(self.gecici.name)

    def tearDown(self):
        self.gecici.cleanup()

    def test_basliksiz_dosya_reddedilir(self):
        yol = dosya_yaz(self.klasor, "a.csv", f"{SUTUNLAR}\nkedi,10,2,1.5,1\n")
        with self.assertRaises(hugin.KopruHatasi) as ctx:
            hugin.oku(yol)
        self.assertIn("donem basligi", str(ctx.exception))

    def test_eksik_baslik_alani_reddedilir(self):
        kotu = '# {"sozlesme":1,"kaynak":"HUGIN","tur":"arama_terimi"}'
        yol = dosya_yaz(self.klasor, "b.csv",
                        f"{kotu}\n{SUTUNLAR}\nkedi,10,2,1.5,1\n")
        with self.assertRaises(hugin.KopruHatasi) as ctx:
            hugin.oku(yol)
        self.assertIn("eksik alan", str(ctx.exception))

    def test_yanlis_sozlesme_surumu_reddedilir(self):
        kotu = BASLIK.replace('"sozlesme":1', '"sozlesme":2')
        yol = dosya_yaz(self.klasor, "c.csv",
                        f"{kotu}\n{SUTUNLAR}\nkedi,10,2,1.5,1\n")
        with self.assertRaises(hugin.KopruHatasi) as ctx:
            hugin.oku(yol)
        self.assertIn("sozlesme surumu", str(ctx.exception))

    def test_gecersiz_tur_reddedilir(self):
        kotu = BASLIK.replace('"arama_terimi"', '"rastgele"')
        yol = dosya_yaz(self.klasor, "d.csv",
                        f"{kotu}\n{SUTUNLAR}\nkedi,10,2,1.5,1\n")
        with self.assertRaises(hugin.KopruHatasi) as ctx:
            hugin.oku(yol)
        self.assertIn("hedefleme_kelimesi", str(ctx.exception))

    def test_ters_tarih_reddedilir(self):
        kotu = BASLIK.replace('"2026-07-01"', '"2026-08-01"')
        yol = dosya_yaz(self.klasor, "e.csv",
                        f"{kotu}\n{SUTUNLAR}\nkedi,10,2,1.5,1\n")
        with self.assertRaises(hugin.KopruHatasi):
            hugin.oku(yol)


class SutunlarKatiEslesir(unittest.TestCase):
    def setUp(self):
        self.gecici = tempfile.TemporaryDirectory()
        self.klasor = Path(self.gecici.name)

    def tearDown(self):
        self.gecici.cleanup()

    def test_eksik_sutun_reddedilir_tahmin_edilmez(self):
        yol = dosya_yaz(self.klasor, "a.csv",
                        f"{BASLIK}\narama_terimi,gosterim\nkedi,10\n")
        with self.assertRaises(hugin.KopruHatasi) as ctx:
            hugin.oku(yol)
        self.assertIn("TAHMIN ETMEZ", str(ctx.exception))

    def test_benzer_isimli_sutun_otomatik_eslesmez(self):
        yol = dosya_yaz(self.klasor, "b.csv",
                        f"{BASLIK}\narama_term,gosterim,tiklama,harcama,siparis"
                        f"\nkedi,10,2,1.5,1\n")
        with self.assertRaises(hugin.KopruHatasi):
            hugin.oku(yol)


class SayiCozumuKati(unittest.TestCase):
    def setUp(self):
        self.gecici = tempfile.TemporaryDirectory()
        self.klasor = Path(self.gecici.name)

    def tearDown(self):
        self.gecici.cleanup()

    def test_us_bicimi_okunur(self):
        yol = dosya_yaz(self.klasor, "a.csv",
                        f'{BASLIK}\n{SUTUNLAR}\nkedi,"1,234",56,"1,234.56",3\n')
        kelimeler, makbuz = hugin.oku(yol)
        self.assertEqual(kelimeler[0].gosterim, 1234)
        self.assertAlmostEqual(kelimeler[0].harcama, 1234.56)
        self.assertEqual(makbuz.cozulemeyen_satir, 0)

    def test_tr_bicimi_okunur(self):
        yol = dosya_yaz(self.klasor, "b.csv",
                        f'{BASLIK}\n{SUTUNLAR}\nkedi,"1.234",56,"1.234,56",3\n')
        kelimeler, _ = hugin.oku(yol)
        self.assertEqual(kelimeler[0].gosterim, 1234)
        self.assertAlmostEqual(kelimeler[0].harcama, 1234.56)

    def test_cozulemeyen_satir_sayilir_sifira_dusmez(self):
        yol = dosya_yaz(self.klasor, "c.csv",
                        f"{BASLIK}\n{SUTUNLAR}\n"
                        f"kedi,10,2,1.5,1\nkopek,abc,def,ghi,jkl\n")
        kelimeler, makbuz = hugin.oku(yol)
        self.assertEqual(len(kelimeler), 1)
        self.assertEqual(makbuz.cozulemeyen_satir, 1)
        self.assertTrue(any("cozulemedi" in u for u in makbuz.uyarilar))

    def test_hicbir_satir_cozulmezse_alim_reddedilir(self):
        yol = dosya_yaz(self.klasor, "d.csv",
                        f"{BASLIK}\n{SUTUNLAR}\nkedi,abc,def,ghi,jkl\n")
        with self.assertRaises(hugin.KopruHatasi) as ctx:
            hugin.oku(yol)
        self.assertIn("hicbiri", str(ctx.exception))

    def test_makbuz_toplamlari_dogru(self):
        yol = dosya_yaz(self.klasor, "e.csv",
                        f"{BASLIK}\n{SUTUNLAR}\nkedi,10,4,2.50,1\n"
                        f"kopek,20,6,3.50,2\n")
        _, makbuz = hugin.oku(yol)
        self.assertEqual(makbuz.toplam_tiklama, 10)
        self.assertEqual(makbuz.toplam_siparis, 3)
        self.assertAlmostEqual(makbuz.toplam_harcama, 6.00)


class MukerrerVeBoslukTespiti(unittest.TestCase):
    def setUp(self):
        self.gecici = tempfile.TemporaryDirectory()
        self.klasor = Path(self.gecici.name)
        self.hugin_kok = self.klasor / "hugin"
        self.hugin_kok.mkdir()

    def tearDown(self):
        self.gecici.cleanup()

    def test_ayni_dosya_ikinci_kez_uyari_verir(self):
        yol = dosya_yaz(self.klasor, "a.csv",
                        f"{BASLIK}\n{SUTUNLAR}\nkedi,10,2,1.5,1\n")
        _, ilk = hugin.oku(yol, self.hugin_kok)
        hugin.deftere_yaz(self.hugin_kok, ilk)
        _, ikinci = hugin.oku(yol, self.hugin_kok)
        self.assertTrue(any("AYNISI daha once" in u for u in ikinci.uyarilar))

    def test_donem_boslugu_yakalanir(self):
        ilk_yol = dosya_yaz(self.klasor, "a.csv",
                            f"{BASLIK}\n{SUTUNLAR}\nkedi,10,2,1.5,1\n")
        _, ilk = hugin.oku(ilk_yol, self.hugin_kok)
        hugin.deftere_yaz(self.hugin_kok, ilk)

        # 07-31'de bitti, 08-10'da basliyor → 9 gun bosluk
        sonraki_baslik = BASLIK.replace('"baslangic":"2026-07-01"',
                                        '"baslangic":"2026-08-10"'
                                        ).replace('"bitis":"2026-07-31"',
                                                  '"bitis":"2026-08-20"')
        yol = dosya_yaz(self.klasor, "b.csv",
                        f"{sonraki_baslik}\n{SUTUNLAR}\nkopek,10,2,1.5,1\n")
        _, ikinci = hugin.oku(yol, self.hugin_kok)
        self.assertTrue(any("gun veri YOK" in u for u in ikinci.uyarilar),
                        ikinci.uyarilar)

    def test_ortusen_donem_yakalanir(self):
        ilk_yol = dosya_yaz(self.klasor, "a.csv",
                            f"{BASLIK}\n{SUTUNLAR}\nkedi,10,2,1.5,1\n")
        _, ilk = hugin.oku(ilk_yol, self.hugin_kok)
        hugin.deftere_yaz(self.hugin_kok, ilk)

        ortusen = BASLIK.replace('"baslangic":"2026-07-01"',
                                 '"baslangic":"2026-07-15"'
                                 ).replace('"bitis":"2026-07-31"',
                                           '"bitis":"2026-08-15"')
        yol = dosya_yaz(self.klasor, "b.csv",
                        f"{ortusen}\n{SUTUNLAR}\nkopek,10,2,1.5,1\n")
        _, ikinci = hugin.oku(yol, self.hugin_kok)
        self.assertTrue(any("ORTUSUYOR" in u for u in ikinci.uyarilar),
                        ikinci.uyarilar)


class GidenDosya(unittest.TestCase):
    def test_giden_dosya_aksiyon_listesi_olmadigini_beyan_eder(self):
        with tempfile.TemporaryDirectory() as gecici:
            yol = hugin.giden_yaz(
                Path(gecici) / "giden.csv",
                [{"arama_terimi": "kedi kumu", "listingde_geciyor": "hayir",
                  "gectigi_alanlar": "", "ba_rank": 120,
                  "munin_notu": "hic gecmiyor"}],
                baslangic="2026-07-01", bitis="2026-07-31",
                kaynak_notu="test")
            metin = yol.read_text(encoding="utf-8")
            baslik = json.loads(metin.splitlines()[0].lstrip("#").strip())
            self.assertIn("AKSIYON LISTESI DEGILDIR", baslik["uyari"])
            self.assertEqual(baslik["kaynak"], "MUNIN")
            self.assertIn("kedi kumu", metin)


if __name__ == "__main__":
    unittest.main()
