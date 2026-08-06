"""İade ayrıştırması, anlık görüntü deposu ve rakip farkı testleri."""
import tempfile
import unittest
from pathlib import Path

from munin import competitors, returns, store


def iade(asin, neden, adet=1, urun="Urun"):
    return {"asin": asin, "reason": neden, "quantity": str(adet),
            "product-name": urun}


class IadeKovalari(unittest.TestCase):
    def test_listing_ve_urun_kovalari_ayrilir(self):
        sonuc = returns.ayristir([
            iade("B01", "NOT_AS_DESCRIBED"), iade("B01", "DEFECTIVE"),
            iade("B01", "ORDERED_WRONG_ITEM")])
        self.assertEqual(sonuc["kova_dagilimi"]["listing"], 2)
        self.assertEqual(sonuc["kova_dagilimi"]["urun"], 1)

    def test_adet_toplanir_satir_sayilmaz(self):
        sonuc = returns.ayristir([iade("B01", "DEFECTIVE", adet=5)])
        self.assertEqual(sonuc["toplam_iade_adedi"], 5)

    def test_okunamayan_satir_bilinmeyene_atilmaz_sayilir(self):
        sonuc = returns.ayristir([
            iade("B01", "DEFECTIVE"), {"asin": "", "reason": ""},
            {"reason": "DEFECTIVE"}])
        self.assertEqual(sonuc["okunamayan_satir"], 2)
        self.assertEqual(sonuc["toplam_iade_adedi"], 1)
        self.assertNotIn("bilinmeyen", sonuc["kova_dagilimi"])

    def test_eslenemeyen_kod_adiyla_bildirilir(self):
        sonuc = returns.ayristir([iade("B01", "YEPYENI_KOD")])
        self.assertIn("YEPYENI_KOD", sonuc["eslenemeyen_kodlar"])
        self.assertEqual(sonuc["kova_dagilimi"]["bilinmeyen"], 1)


class TeshisTedaviyiKaristirmaz(unittest.TestCase):
    def test_urun_kaynakliysa_listing_optimizasyonu_reddedilir(self):
        sonuc = returns.ayristir([iade("B01", "DEFECTIVE") for _ in range(9)]
                                 + [iade("B01", "NOT_AS_DESCRIBED")])
        metin = returns.teshis(sonuc)
        self.assertIn("LISTING SORUNU DEGILDIR", metin)
        self.assertIn("tedarik/kalite", metin)

    def test_listing_kaynakliysa_denetime_yonlendirir(self):
        sonuc = returns.ayristir(
            [iade("B01", "NOT_AS_DESCRIBED") for _ in range(9)]
            + [iade("B01", "DEFECTIVE")])
        self.assertIn("beklentiyi yanlis kuruyor", returns.teshis(sonuc))

    def test_veri_yoksa_yorum_yapilmaz(self):
        self.assertIn("kapsam dogrulanmadan", returns.teshis(returns.ayristir([])))

    def test_cok_eslenemeyen_kod_dagilimi_supheli_isaretler(self):
        sonuc = returns.ayristir([iade("B01", "BILINMEYEN") for _ in range(5)]
                                 + [iade("B01", "DEFECTIVE") for _ in range(5)])
        self.assertIn("UYARI", returns.teshis(sonuc))

    def test_listing_orani_sifir_toplamda_none(self):
        kayit = returns.AsinIade("B01", "U", 0, {}, {})
        self.assertIsNone(kayit.listing_orani)


class DepoAnliklariEzmez(unittest.TestCase):
    def setUp(self):
        self.gecici = tempfile.TemporaryDirectory()
        self.depo = store.Depo(Path(self.gecici.name))
        self.depo.hazirla()

    def tearDown(self):
        self.gecici.cleanup()

    def test_ayni_saniyede_iki_yazim_ikisi_de_kalir(self):
        from datetime import datetime, timezone
        an = datetime(2026, 8, 6, 12, 0, 0, tzinfo=timezone.utc)
        self.depo.yaz("rakipler", [{"asin": "A"}], kaynak="k",
                      donem={"tip": "anlik"}, an=an)
        self.depo.yaz("rakipler", [{"asin": "B"}], kaynak="k",
                      donem={"tip": "anlik"}, an=an)
        self.assertEqual(len(list(self.depo.tum("rakipler"))), 2)

    def test_son_ve_onceki_ayrilir(self):
        from datetime import datetime, timezone
        for gun, asin in ((1, "A"), (2, "B"), (3, "C")):
            self.depo.yaz("rakipler", [{"asin": asin}], kaynak="k",
                          donem={"tip": "anlik"},
                          an=datetime(2026, 8, gun, tzinfo=timezone.utc))
        self.assertEqual(self.depo.son("rakipler").satirlar[0]["asin"], "C")
        self.assertEqual(self.depo.onceki("rakipler").satirlar[0]["asin"], "B")

    def test_bozuk_dosya_gecmisi_kilitlemez(self):
        self.depo.yaz("rakipler", [{"asin": "A"}], kaynak="k",
                      donem={"tip": "anlik"})
        bozuk = self.depo.anlik / "rakipler" / "rakipler-2099-01-01T00-00-00Z.json"
        bozuk.write_text("{bozuk", encoding="utf-8")
        self.assertEqual(len(list(self.depo.tum("rakipler"))), 1)
        self.assertEqual(len(self.depo.bozuk_dosyalar("rakipler")), 1)

    def test_donem_beyani_saklanir(self):
        self.depo.yaz("iadeler", [], kaynak="k",
                      donem={"tip": "aralik", "baslangic": "2026-07-01",
                             "bitis": "2026-07-31"})
        self.assertEqual(self.depo.son("iadeler").donem["baslangic"],
                         "2026-07-01")


class RakipFarki(unittest.TestCase):
    def test_kaybolan_ile_degisen_ayri_kovalarda(self):
        eski = [{"asin": "A", "fiyat_tutar": 30.0},
                {"asin": "B", "fiyat_tutar": 25.0}]
        yeni = [{"asin": "A", "fiyat_tutar": 27.0},
                {"asin": "C", "fiyat_tutar": 40.0}]
        sonuc = competitors.karsilastir(eski, yeni)
        self.assertEqual(sonuc["degisen_rakip"], 1)
        self.assertEqual(len(sonuc["kaybolan_rakip"]), 1)
        self.assertEqual(len(sonuc["yeni_rakip"]), 1)

    def test_yuzde20_dusus_kriz_esigini_tetikler(self):
        sonuc = competitors.karsilastir(
            [{"asin": "A", "fiyat_tutar": 40.0}],
            [{"asin": "A", "fiyat_tutar": 30.0}])
        satirlar = competitors.dikkat_cekenler(sonuc)
        self.assertTrue(any("kriz protokolu" in s for s in satirlar), satirlar)

    def test_kucuk_hareket_esigin_altinda_kalir(self):
        sonuc = competitors.karsilastir(
            [{"asin": "A", "fiyat_tutar": 30.0}],
            [{"asin": "A", "fiyat_tutar": 29.5}])
        self.assertEqual(competitors.dikkat_cekenler(sonuc), [])

    def test_onceki_fiyat_okunamiyorsa_yuzde_uydurulmaz(self):
        sonuc = competitors.karsilastir(
            [{"asin": "A", "fiyat_tutar": None}],
            [{"asin": "A", "fiyat_tutar": 30.0}])
        satirlar = competitors.dikkat_cekenler(sonuc)
        self.assertTrue(any("hesaplanamadi" in s for s in satirlar), satirlar)

    def test_baslik_degisimi_bildirilir(self):
        sonuc = competitors.karsilastir(
            [{"asin": "A", "baslik": "Eski"}],
            [{"asin": "A", "baslik": "Yeni"}])
        self.assertTrue(any("BASLIK degisti" in s
                            for s in competitors.dikkat_cekenler(sonuc)))

    def test_fiyat_tabani_ihlali_listelenir(self):
        kartlar = [{"asin": "A", "fiyat_tutar": 19.99, "marka": "X"},
                   {"asin": "B", "fiyat_tutar": 31.0, "marka": "Y"},
                   {"asin": "C", "fiyat_tutar": None, "marka": "Z"}]
        ihlal = competitors.fiyat_tabani_ihlali(kartlar, 25.0)
        self.assertEqual([k["asin"] for k in ihlal], ["A"])


if __name__ == "__main__":
    unittest.main()
