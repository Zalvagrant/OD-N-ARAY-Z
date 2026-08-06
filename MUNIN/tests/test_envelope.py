"""Veri zarfı testleri — programın tek bağlayıcı kuralının testi.

Buradaki her test tek bir soruyu sorar: ölçülmemiş bir sayı, ölçülmüş
gibi görünebilir mi?
"""
import unittest

from munin.envelope import (Olculen, Yok, basilabilir, eksikler,
                            kapsam_kaniti, olculen, olculen_ya_da_yok, oran,
                            yok)


class KaynaksizOlcumOlmaz(unittest.TestCase):
    def test_bos_kaynak_reddedilir(self):
        with self.assertRaises(ValueError):
            Olculen(42, "")
        with self.assertRaises(ValueError):
            Olculen(42, "   ")

    def test_gerekcesiz_yok_reddedilir(self):
        with self.assertRaises(ValueError):
            Yok("BSR", "")


class SifirIleYoklukAyrimi(unittest.TestCase):
    """Bu sınıf programın en önemli ayrımını korur."""

    def test_sifir_olculmus_bir_degerdir(self):
        d = olculen_ya_da_yok(0, "catalog", "gorsel", "yok")
        self.assertTrue(d.var)
        self.assertEqual(d.deger, 0)

    def test_none_olcum_degildir(self):
        d = olculen_ya_da_yok(None, "catalog", "gorsel", "alan bos geldi")
        self.assertFalse(d.var)
        self.assertIn("alan bos geldi", d.metin())

    def test_bos_dize_olcum_degildir(self):
        self.assertFalse(olculen_ya_da_yok("", "k", "n", "g").var)

    def test_bos_liste_de_yokluk_sayilir(self):
        # [] "sifir bullet" degil, "bullet okunamadi" demektir — cagiran
        # bunu bilerek `or None` ile gecirir.
        self.assertFalse(olculen_ya_da_yok(None, "k", "bullet", "g").var)


class OranTaraflardanBiriEksikseUretilmez(unittest.TestCase):
    def test_pay_eksikse_yok(self):
        s = oran(yok("pay", "olculmedi"), olculen(10, "k"), "oran")
        self.assertFalse(s.var)
        self.assertIn("pay olculmedi", s.gerekce)

    def test_payda_eksikse_yok(self):
        s = oran(olculen(5, "k"), yok("payda", "olculmedi"), "oran")
        self.assertFalse(s.var)
        self.assertIn("payda olculmedi", s.gerekce)

    def test_sifira_bolme_sonsuz_degil_olculemez(self):
        s = oran(olculen(5, "k"), olculen(0, "k"), "ACOS")
        self.assertFalse(s.var)
        self.assertIn("tanimsiz", s.gerekce)

    def test_gecerli_oran_hesaplanir(self):
        s = oran(olculen(5, "k"), olculen(2, "k"), "oran")
        self.assertTrue(s.var)
        self.assertEqual(s.deger, 2.5)


class BolumYarimBasilmaz(unittest.TestCase):
    def test_bir_eksik_alan_bolumu_kapatir(self):
        self.assertFalse(basilabilir(olculen(1, "k"), yok("b", "g")))

    def test_hepsi_olculmusse_basilir(self):
        self.assertTrue(basilabilir(olculen(1, "k"), olculen(2, "k")))

    def test_eksikler_adiyla_ve_gerekcesiyle_listelenir(self):
        cikti = eksikler({"BSR": yok("BSR", "salesRanks bos"),
                          "fiyat": olculen(9.9, "pricing")})
        self.assertEqual(cikti, ["BSR — salesRanks bos"])


class DonusumKaybiSessizDegil(unittest.TestCase):
    def test_bozuk_donusum_sifira_dusmez(self):
        s = olculen("abc", "k").esle(int)
        self.assertFalse(s.var)
        self.assertIn("donusturulemedi", s.gerekce)

    def test_yok_uzerinde_esleme_yok_kalir(self):
        self.assertFalse(yok("a", "b").esle(int).var)


class KapsamKanitlanmadanYayimlanmaz(unittest.TestCase):
    def test_eksik_sayfa_kapsami_dusurur(self):
        s = kapsam_kaniti([1, 2], 5, "rakip listesi")
        self.assertFalse(s.var)
        self.assertIn("5 beklendi, 2 geldi", s.gerekce)

    def test_beklenen_bilinmiyorsa_kapsam_yok(self):
        self.assertFalse(kapsam_kaniti([1, 2], None, "liste").var)

    def test_tam_liste_gecer(self):
        self.assertTrue(kapsam_kaniti([1, 2, 3], 3, "liste").var)


if __name__ == "__main__":
    unittest.main()
