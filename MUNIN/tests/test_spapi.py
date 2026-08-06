"""SP-API çözümleme testleri — sahte taşıma katmanıyla, ağa çıkmadan."""
import json
import unittest

from munin.config import Kimlik
from munin.http import ApiHatasi, Oturum, satirlari_coz
from munin.spapi import SpApi

KIMLIK = Kimlik("id", "secret", "refresh", "ATVPDKIKX0DER", "A1SELLER", "na")


class SahteTasima:
    """Kaydedilmiş yanıtları döndüren taşıma. Çağrı geçmişini tutar ki
    testler token'ın sızmadığını da doğrulayabilsin."""

    def __init__(self, yanitlar):
        self.yanitlar = yanitlar
        self.cagrilar = []

    def __call__(self, url, basliklar, govde=None, yontem="GET"):
        self.cagrilar.append({"url": url, "basliklar": dict(basliklar),
                              "yontem": yontem})
        if "auth/o2/token" in url:
            return 200, json.dumps({"access_token": "GIZLI-TOKEN",
                                    "expires_in": 3600}).encode(), {}
        for parca, yanit in self.yanitlar.items():
            if parca in url:
                return 200, json.dumps(yanit).encode(), {}
        raise ApiHatasi(f"beklenmeyen url: {url}", 404)


def api_kur(yanitlar):
    tasima = SahteTasima(yanitlar)
    return SpApi(Oturum(KIMLIK, tasima), KIMLIK), tasima


LISTING_YANITI = {
    "summaries": [{"asin": "B0OWN00001", "productType": "PET_SUPPLIES",
                   "status": ["BUYABLE"], "itemName": "Ozet Basligi"}],
    "attributes": {
        "item_name": [{"value": "Marka Kedi Kumu Paspasi 60x45",
                       "marketplace_id": "ATVPDKIKX0DER"}],
        "bullet_point": [{"value": f"Fayda {i}"} for i in range(5)],
        "generic_keyword": [{"value": "litter mat trapping"}],
        "product_description": [{"value": "Uzun aciklama"}],
        "main_product_image_locator": [{"value": "http://x/1.jpg"}],
        "other_product_image_locator_1": [{"value": "http://x/2.jpg"}],
        "other_product_image_locator_2": [{"value": "http://x/3.jpg"}],
    },
    "issues": [{"severity": "ERROR", "message": "Boyut eksik"}],
}


class ListingCozumu(unittest.TestCase):
    def setUp(self):
        self.api, self.tasima = api_kur({"/listings/2021-08-01": LISTING_YANITI})

    def test_alanlar_okunur(self):
        kayit = self.api.listing_coz("SKU-1", self.api.listing("SKU-1"))
        self.assertEqual(kayit["asin"], "B0OWN00001")
        self.assertEqual(kayit["baslik"].deger,
                         "Marka Kedi Kumu Paspasi 60x45")
        self.assertEqual(len(kayit["bulletlar"].deger), 5)
        self.assertEqual(kayit["backend_keywords"].deger,
                         ["litter mat trapping"])

    def test_gorseller_tum_locator_niteliklerinden_toplanir(self):
        kayit = self.api.listing_coz("SKU-1", self.api.listing("SKU-1"))
        self.assertEqual(kayit["gorsel_sayisi"].deger, 3)

    def test_locator_niteligi_yoksa_sifir_degil_olculemez(self):
        ham = {"summaries": [{"asin": "B0X"}], "attributes": {}}
        kayit = self.api.listing_coz("SKU-2", ham)
        self.assertFalse(kayit["gorsel_sayisi"].var)
        self.assertIn("image_locator", kayit["gorsel_sayisi"].gerekce)

    def test_backend_yoksa_gerekce_urun_tipini_isaret_eder(self):
        ham = {"summaries": [{"asin": "B0X"}],
               "attributes": {"item_name": [{"value": "A"}]}}
        kayit = self.api.listing_coz("SKU-3", ham)
        self.assertFalse(kayit["backend_keywords"].var)
        self.assertIn("urun tipine gore", kayit["backend_keywords"].gerekce)

    def test_amazon_sorunlari_tasinir(self):
        kayit = self.api.listing_coz("SKU-1", self.api.listing("SKU-1"))
        self.assertEqual(len(kayit["amazon_sorunlari"]), 1)


class TokenSizmaz(unittest.TestCase):
    def test_token_yalnizca_baslikta_urlde_degil(self):
        api, tasima = api_kur({"/listings/2021-08-01": LISTING_YANITI})
        api.listing("SKU-1")
        spapi_cagrilari = [c for c in tasima.cagrilar
                           if "/listings/" in c["url"]]
        self.assertTrue(spapi_cagrilari)
        for cagri in spapi_cagrilari:
            self.assertNotIn("GIZLI-TOKEN", cagri["url"])
            self.assertEqual(cagri["basliklar"]["x-amz-access-token"],
                             "GIZLI-TOKEN")

    def test_oturum_repr_token_gostermez(self):
        oturum = Oturum(KIMLIK, SahteTasima({}))
        oturum._access_token()
        self.assertNotIn("GIZLI-TOKEN", repr(oturum))
        self.assertIn("gizlendi", repr(oturum))

    def test_kimlik_repr_sirlari_gizler(self):
        metin = repr(KIMLIK)
        self.assertNotIn("secret", metin)
        self.assertNotIn("refresh", metin)
        self.assertIn("gizlendi", metin)


KATALOG_YANITI = {
    "asin": "B0RIVAL0001",
    "summaries": [{"itemName": "Rakip Paspas XL", "brand": "RakipMarka",
                   "productType": "PET_SUPPLIES"}],
    "salesRanks": [{"classificationRanks": [{"rank": 4210, "title": "Cat Mats"}],
                    "displayGroupRanks": [{"rank": 88010, "title": "Pet"}]}],
    "images": [{"images": [{"link": f"http://x/{i}.jpg"} for i in range(6)]}],
    "attributes": {"bullet_point": [{"value": f"R{i}"} for i in range(4)]},
}


class KatalogCozumu(unittest.TestCase):
    def setUp(self):
        self.api, _ = api_kur({"/catalog/2022-04-01": KATALOG_YANITI})

    def test_en_iyi_bsr_secilir(self):
        kart = self.api.katalog_coz("B0RIVAL0001", KATALOG_YANITI)
        self.assertEqual(kart["bsr"].deger, 4210)
        self.assertEqual(kart["bsr_kategori"], "Cat Mats")

    def test_bsr_yoksa_amazon_kusuru_gerekce_olarak_yazilir(self):
        ham = dict(KATALOG_YANITI, salesRanks=[])
        kart = self.api.katalog_coz("B0X", ham)
        self.assertFalse(kart["bsr"].var)
        self.assertIn("bilinen kusuru", kart["bsr"].gerekce)

    def test_gorsel_ve_bullet_sayilir(self):
        kart = self.api.katalog_coz("B0RIVAL0001", KATALOG_YANITI)
        self.assertEqual(kart["gorsel_sayisi"].deger, 6)
        self.assertEqual(kart["bullet_sayisi"].deger, 4)

    def test_kartta_review_alani_YOKTUR(self):
        # Bu test bilerek var: bir gun biri "review" kolonu eklemeye
        # kalkarsa, kaynagi olmadigini burada hatirlasin.
        kart = self.api.katalog_coz("B0RIVAL0001", KATALOG_YANITI)
        for yasak in ("review", "rating", "yildiz", "yorum_sayisi"):
            self.assertNotIn(yasak, kart)


FIYAT_YANITI = {"responses": [
    {"body": {"asin": "B0RIVAL0001", "featuredBuyingOptions": [
        {"segmentedFeaturedOffers": [
            {"listingPrice": {"amount": 29.99, "currencyCode": "USD"}}]}]}},
    {"body": {"asin": "B0RIVAL0002", "featuredBuyingOptions": []}},
]}


class FiyatCozumu(unittest.TestCase):
    def test_one_cikan_teklif_okunur(self):
        api, _ = api_kur({})
        fiyatlar = api.fiyat_coz(FIYAT_YANITI)
        self.assertTrue(fiyatlar["B0RIVAL0001"].var)
        self.assertEqual(fiyatlar["B0RIVAL0001"].deger["tutar"], 29.99)
        self.assertEqual(fiyatlar["B0RIVAL0001"].deger["para"], "USD")

    def test_teklifsiz_asin_sifir_degil_olculemez(self):
        api, _ = api_kur({})
        fiyatlar = api.fiyat_coz(FIYAT_YANITI)
        self.assertFalse(fiyatlar["B0RIVAL0002"].var)
        self.assertIn("stok disi", fiyatlar["B0RIVAL0002"].gerekce)


class HataMesajiSirIcermez(unittest.TestCase):
    def test_url_sorgusu_hata_mesajina_girmez(self):
        api, _ = api_kur({})       # hicbir yanit eslesmiyor
        with self.assertRaises(ApiHatasi) as ctx:
            api.listing("SKU-YOK")
        self.assertNotIn("GIZLI-TOKEN", str(ctx.exception))


class TsvCozumu(unittest.TestCase):
    def test_eksik_sutunlu_satir_doldurulmaz_atlanir(self):
        ham = b"asin\treason\tquantity\nB01\tDEFECTIVE\t2\nB02\tEKSIK\n"
        satirlar = satirlari_coz(ham)
        self.assertEqual(len(satirlar), 1)
        self.assertEqual(satirlar[0]["asin"], "B01")

    def test_bom_ile_utf8_okunur(self):
        ham = "﻿a\tb\n1\t2\n".encode("utf-8")
        self.assertEqual(satirlari_coz(ham), [{"a": "1", "b": "2"}])

    def test_latin1_okunur(self):
        # Amazon bu raporlari cogunlukla ISO-8859-1 yollar. UTF-8 olarak
        # okumaya calisan bir cozumleyici burada patlar ve tum rapor
        # "bozuk" diye reddedilir.
        ham = "a\tb\nkedi\tmüşteri\n".encode("iso-8859-9")
        satirlar = satirlari_coz(ham)
        self.assertEqual(satirlar[0]["a"], "kedi")
        # iso-8859-1 olarak cozuldugu icin 'ş' baska bir karaktere duser —
        # onemli olan satirin DUSMEMESI; kodlama farki adiyla bilinir.
        self.assertTrue(satirlar[0]["b"].startswith("m"))


if __name__ == "__main__":
    unittest.main()
