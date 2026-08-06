"""Uçtan uca: sahte SP-API'den GERÇEK bir rapor dosyası çıkıyor mu?

Bu dosyanın varlık sebebi şu ders: birim testlerin yeşil olması,
programın bir çıktı ürettiği anlamına GELMEZ. Her modül ayrı ayrı
çalışıp hiçbir dosya üretmeyen bir program da tüm birim testlerini
geçer.

Buradaki testler diske bakar: rapor dosyası var mı, içinde ölçülmüş
sayılar var mı, ölçülemeyenler bölümü dolduruldu mu.
"""
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from munin import __main__ as cli
from munin.config import Kimlik

KIMLIK = Kimlik("id", "secret", "refresh", "ATVPDKIKX0DER", "A1SELLER", "na")

# Iki SKU: biri temiz, biri sorunlu. Sorunlu olan gercek bulgular uretmeli.
LISTINGLER = {
    "SKU-TEMIZ": {
        "summaries": [{"asin": "B0CLEAN0001", "productType": "PET_SUPPLIES"}],
        "attributes": {
            "item_name": [{"value": "Marka Kedi Kumu Paspasi Su Gecirmez"}],
            "bullet_point": [{"value": f"Fayda {i}"} for i in range(5)],
            "generic_keyword": [{"value": "litter trapping mat xl waterproof "
                                          "double layer honeycomb design "
                                          "large size easy clean durable pet "
                                          "supplies accessory grey"}],
            "main_product_image_locator": [{"value": "1"}],
            **{f"other_product_image_locator_{i}": [{"value": str(i)}]
               for i in range(1, 7)},
        },
        "issues": [],
    },
    "SKU-SORUNLU": {
        "summaries": [{"asin": "B0BAD000001", "productType": "PET_SUPPLIES"}],
        "attributes": {
            "item_name": [{"value": "X" * 240}],          # 200'u asiyor
            "bullet_point": [{"value": "Tek bullet"}],    # 5 degil
            "main_product_image_locator": [{"value": "1"}],   # 1 gorsel
            # generic_keyword YOK → backend olculemez
        },
        "issues": [{"severity": "ERROR", "message": "Boyut bilgisi eksik"}],
    },
}


class SahteTasima:
    def __init__(self):
        self.cagrilar = []

    def __call__(self, url, basliklar, govde=None, yontem="GET"):
        self.cagrilar.append(url)
        if "auth/o2/token" in url:
            return 200, json.dumps({"access_token": "T", "expires_in": 3600}
                                   ).encode(), {}
        for sku, yanit in LISTINGLER.items():
            if f"/{sku}" in url:
                return 200, json.dumps(yanit).encode(), {}
        from munin.http import ApiHatasi
        raise ApiHatasi("SP-API HTTP 404 — bulunamadi", 404)


class DenetlemeGercekRaporUretir(unittest.TestCase):
    def setUp(self):
        self.gecici = tempfile.TemporaryDirectory()
        self.kok = Path(self.gecici.name)
        (self.kok / "hedefler.json").write_text(json.dumps({
            "skular": ["SKU-TEMIZ", "SKU-SORUNLU", "SKU-YOK"],
            "hedef_keywordler": {"SKU-TEMIZ": "kedi kumu paspasi"},
            "rakip_asinler": [], "kendi_asinlerim": ["B0CLEAN0001"],
            "kesif_kelimeleri": [], "fiyat_tabani": 25.0,
        }), encoding="utf-8")
        self.tasima = SahteTasima()

    def tearDown(self):
        self.gecici.cleanup()

    def _kos(self):
        from munin.http import Oturum

        def sahte_oturum(kimlik):
            return Oturum(kimlik, self.tasima)

        with mock.patch("munin.__main__.kimlik_yukle", return_value=KIMLIK), \
             mock.patch("munin.__main__.senkron_uyarilari", return_value=[]), \
             mock.patch("munin.__main__.Oturum", sahte_oturum):
            return cli.main(["--veri", str(self.kok), "denetle"])

    def test_rapor_dosyalari_diske_yazilir(self):
        self.assertEqual(self._kos(), 0)
        raporlar = sorted((self.kok / "rapor").glob("denetim-*"))
        uzantilar = {y.suffix for y in raporlar}
        self.assertEqual(uzantilar, {".md", ".json", ".html"},
                         f"uretilen: {[y.name for y in raporlar]}")

    def test_raporda_gercek_bulgular_var(self):
        self._kos()
        md = next((self.kok / "rapor").glob("denetim-*.md"))
        metin = md.read_text(encoding="utf-8")
        self.assertIn("SKU-SORUNLU", metin)
        self.assertIn("240 karakter", metin)     # olculmus baslik uzunlugu
        self.assertIn("1 adet", metin)           # olculmus bullet sayisi
        self.assertIn("Boyut bilgisi eksik", metin)

    def test_olculemeyenler_bolumu_dolu_ve_gerekceli(self):
        self._kos()
        md = next((self.kok / "rapor").glob("denetim-*.md"))
        metin = md.read_text(encoding="utf-8")
        self.assertIn("## Ölçülemeyenler", metin)
        # SKU-SORUNLU'da generic_keyword yok → gerekcesiyle listelenmeli
        self.assertIn("generic_keyword", metin)
        self.assertNotIn("Yok — bu koşumda istenen her alan ölçüldü", metin)

    def test_okunamayan_sku_gizlenmez(self):
        self._kos()
        md = next((self.kok / "rapor").glob("denetim-*.md"))
        metin = md.read_text(encoding="utf-8")
        self.assertIn("Okunamayan SKU", metin)
        self.assertIn("SKU-YOK", metin)
        self.assertIn("404", metin)

    def test_puan_uretilmedigi_raporda_yazili(self):
        self._kos()
        md = next((self.kok / "rapor").glob("denetim-*.md"))
        self.assertIn("listing puani uretmez",
                      md.read_text(encoding="utf-8"))

    def test_json_ozeti_ham_sayilar_tasir(self):
        self._kos()
        js = next((self.kok / "rapor").glob("denetim-*.json"))
        veri = json.loads(js.read_text(encoding="utf-8"))
        self.assertEqual(set(veri["ozet"]), {"GECTI", "KALDI", "OLCULEMEZ"})
        self.assertGreater(veri["ozet"]["KALDI"], 0)
        self.assertGreater(veri["ozet"]["OLCULEMEZ"], 0)
        self.assertEqual(len(veri["okunamayan"]), 1)

    def test_anlik_goruntu_kapsam_kaniti_ile_saklanir(self):
        self._kos()
        anlik = sorted((self.kok / "anlik" / "listing").glob("*.json"))
        self.assertEqual(len(anlik), 1)
        kayit = json.loads(anlik[0].read_text(encoding="utf-8"))
        self.assertEqual(kayit["kapsam"]["istenen_sku"], 3)
        self.assertEqual(kayit["kapsam"]["okunan_sku"], 2)
        self.assertEqual(kayit["kapsam"]["okunamayan_sku"], 1)

    def test_html_raporu_tarayicida_acilabilir(self):
        self._kos()
        htm = next((self.kok / "rapor").glob("denetim-*.html"))
        metin = htm.read_text(encoding="utf-8")
        self.assertTrue(metin.startswith("<!doctype html>"))
        self.assertIn("<table>", metin)
        self.assertIn("ölçülmemiş hiçbir sayı basılmadı", metin)


class HedefsizCalismaz(unittest.TestCase):
    def test_bos_sku_listesi_sessizce_basarili_olmaz(self):
        with tempfile.TemporaryDirectory() as gecici:
            kok = Path(gecici)
            (kok / "hedefler.json").write_text(
                json.dumps({"skular": []}), encoding="utf-8")
            with mock.patch("munin.__main__.kimlik_yukle", return_value=KIMLIK), \
                 mock.patch("munin.__main__.senkron_uyarilari", return_value=[]):
                kod = cli.main(["--veri", str(kok), "denetle"])
            self.assertEqual(kod, 1)
            self.assertEqual(list((kok / "rapor").glob("*")), [])


if __name__ == "__main__":
    unittest.main()
