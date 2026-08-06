"""SP-API salt-okunur okuma yüzeyleri: Listings · Catalog · Pricing.

Hiçbir yazma ucu YOKTUR. MUNIN listing'i okur, denetler ve önerir; asıl
değişikliği sahip Seller Central'da kendi yapar. Bir programın kendi
listing'ini otomatik güncellemesi ayrı bir güvenlik incelemesi ister ve
bu sürümün kapsamı dışındadır.

Doğrulanan yüzeyler (gavadolar/luna incelemesi):
  GET /listings/2021-08-01/items/{sellerId}/{sku}
  GET /catalog/2022-04-01/items            (arama)
  GET /catalog/2022-04-01/items/{asin}     (tek ASIN)
  POST /batches/products/pricing/2022-05-01/items/competitiveSummary

⚠ ÇIKARILAN İDDİA — `searchCatalogItems` İNDEKSLEME KONTROLÜ DEĞİLDİR.
Bu bir katalog EŞLEME aramasıdır; müşterinin gördüğü arama motoru (A9)
değildir. Yanlış pozitif ve yanlış negatif verir. MUNIN bu uçtan
"bu kelimede indeksliyim" sonucu ÜRETMEZ; yalnızca "bu kelimede katalogda
hangi ASIN'ler var" diye rakip keşfi için kullanır. Gerçek indeksleme
kanıtı Data Kiosk Search Query Performance'tadır (bkz. reports.py).
"""
from __future__ import annotations

from typing import Any, Callable, Iterable

from .envelope import Deger, olculen_ya_da_yok, yok
from .http import ApiHatasi, Oturum

# Amazon'un dokümante ettiği tavan: tek aramada en fazla 20 sonuç.
ARAMA_SAYFA_BOYU = 20
# competitiveSummary tek istekte en fazla 20 ASIN kabul eder.
FIYAT_YIGIN_BOYU = 20

LISTING_VERI = "summaries,attributes,issues,offers,fulfillmentAvailability"
KATALOG_VERI = "summaries,attributes,salesRanks,images,dimensions,identifiers"
ARAMA_VERI = "summaries,salesRanks,images"


def _ilk_deger(nitelik: Any) -> Any:
    """Listings/Catalog nitelikleri `[{value, marketplace_id, language_tag}]`
    biçiminde gelir. Tek değeri çıkarır; biçim beklenmedikse None döner —
    tahmin etmez."""
    if isinstance(nitelik, list) and nitelik:
        ilk = nitelik[0]
        if isinstance(ilk, dict):
            return ilk.get("value")
        return ilk
    if isinstance(nitelik, (str, int, float)):
        return nitelik
    return None


def _tum_degerler(nitelik: Any) -> list[Any]:
    if not isinstance(nitelik, list):
        return []
    cikti = []
    for oge in nitelik:
        if isinstance(oge, dict) and "value" in oge:
            cikti.append(oge["value"])
        elif isinstance(oge, (str, int, float)):
            cikti.append(oge)
    return cikti


class SpApi:
    """Salt-okunur SP-API istemcisi."""

    def __init__(self, oturum: Oturum, kimlik: Any):
        self.oturum = oturum
        self.kimlik = kimlik

    # -- kendi listing'im ----------------------------------------------
    def listing(self, sku: str) -> dict[str, Any]:
        """Tek SKU'nun listing içeriği.

        ⚠ Dönen `attributes` SENİN GÖNDERDİĞİN değerdir, Amazon'un
        indekslediği değil. Bu ayrım rapora da yazılır — aksi halde
        "backend keyword'lerim dolu" ile "backend keyword'lerim işe
        yarıyor" karıştırılır.
        """
        yol = (f"/listings/2021-08-01/items/{self.kimlik.seller_id}/"
               f"{sku}")
        return self.oturum.get(yol, {
            "marketplaceIds": self.kimlik.marketplace_id,
            "includedData": LISTING_VERI})

    def listing_coz(self, sku: str, ham: dict[str, Any]) -> dict[str, Any]:
        """Ham listing yanıtını MUNIN'in kendi şemasına indirger.

        Ölçülemeyen her alan `None` DEĞİL, gerekçeli `Yok` olur —
        "0 bullet" ile "bullet okunamadı" ayrımı denetimin tamamını
        belirler.
        """
        nitelikler = ham.get("attributes") or {}
        ozetler = ham.get("summaries") or []
        ozet = ozetler[0] if ozetler else {}
        kaynak = "listings-items-2021-08-01"

        baslik = _ilk_deger(nitelikler.get("item_name")) or ozet.get("itemName")
        bulletlar = _tum_degerler(nitelikler.get("bullet_point"))
        backend = _tum_degerler(nitelikler.get("generic_keyword"))
        aciklama = _ilk_deger(nitelikler.get("product_description"))

        # `main_product_image_locator` + `other_product_image_locator_*`
        # ayrı niteliklerdir; toplam görsel sayısı ikisinin toplamıdır.
        gorsel_sayisi = 0
        gorsel_okundu = False
        for ad, deger in nitelikler.items():
            if "image_locator" in ad:
                gorsel_okundu = True
                gorsel_sayisi += len(_tum_degerler(deger))

        sorunlar = ham.get("issues") or []

        return {
            "sku": sku,
            "asin": ozet.get("asin"),
            "urun_tipi": ozet.get("productType"),
            "durum": ozet.get("status"),
            "baslik": olculen_ya_da_yok(
                baslik, kaynak, f"{sku} baslik",
                "listing yanitinda item_name/itemName yok"),
            "bulletlar": olculen_ya_da_yok(
                bulletlar or None, kaynak, f"{sku} bullet",
                "listing yanitinda bullet_point niteligi yok"),
            "backend_keywords": olculen_ya_da_yok(
                backend or None, kaynak, f"{sku} backend keyword",
                "listing yanitinda generic_keyword niteligi yok — "
                "urun tipine gore anahtar farkli olabilir"),
            "aciklama": olculen_ya_da_yok(
                aciklama, kaynak, f"{sku} aciklama",
                "product_description niteligi yok (A+ icerik kullaniliyorsa "
                "bu normaldir)"),
            "gorsel_sayisi": olculen_ya_da_yok(
                gorsel_sayisi if gorsel_okundu else None, kaynak,
                f"{sku} gorsel sayisi",
                "hicbir *image_locator* niteligi donmedi"),
            "amazon_sorunlari": sorunlar,
            "ham_nitelik_sayisi": len(nitelikler),
        }

    def listingleri_cek(self, skular: Iterable[str],
                        ilerleme: Callable[[str, int, int], None] | None = None
                        ) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
        """Her SKU için listing. Başarısız SKU sessizce ATLANMAZ —
        `hatalar` listesinde adıyla ve sebebiyle döner ki kapsam
        kanıtlanabilsin."""
        skular = list(skular)
        cikti, hatalar = [], []
        for sira, sku in enumerate(skular, 1):
            if ilerleme:
                ilerleme(sku, sira, len(skular))
            try:
                cikti.append(self.listing_coz(sku, self.listing(sku)))
            except ApiHatasi as exc:
                hatalar.append({"sku": sku, "hata": str(exc)})
        return cikti, hatalar

    # -- katalog / rakip keşfi -----------------------------------------
    def katalog_ara(self, kelimeler: str, sayfa_boyu: int = ARAMA_SAYFA_BOYU,
                    marka_haric: str | None = None) -> list[dict[str, Any]]:
        """Bir kelime öbeğinde katalogdaki ASIN'ler.

        ⚠ Bu ARAMA SIRALAMASI DEĞİLDİR (bkz. modül başlığı). Yalnızca
        "bu kelimeyle ilgili katalogda kimler var" sorusuna cevaptır ve
        rakip ADAYI keşfi için kullanılır. Sonuçların sırası müşterinin
        gördüğü sıra ile ilgisizdir ve rapora sıra olarak basılmaz.
        """
        yanit = self.oturum.get("/catalog/2022-04-01/items", {
            "keywords": kelimeler,
            "marketplaceIds": self.kimlik.marketplace_id,
            "includedData": ARAMA_VERI,
            "pageSize": str(min(sayfa_boyu, ARAMA_SAYFA_BOYU))})
        ogeler = yanit.get("items") or []
        cikti = []
        for oge in ogeler:
            ozetler = oge.get("summaries") or []
            ozet = ozetler[0] if ozetler else {}
            marka = ozet.get("brand")
            if marka_haric and str(marka).lower() == marka_haric.lower():
                continue
            cikti.append({"asin": oge.get("asin"),
                          "baslik": ozet.get("itemName"),
                          "marka": marka,
                          "kelime": kelimeler})
        return cikti

    def katalog_oge(self, asin: str) -> dict[str, Any]:
        return self.oturum.get(f"/catalog/2022-04-01/items/{asin}", {
            "marketplaceIds": self.kimlik.marketplace_id,
            "includedData": KATALOG_VERI})

    def katalog_coz(self, asin: str, ham: dict[str, Any]) -> dict[str, Any]:
        """Rakip profil kartının ölçülebilen yarısı.

        ⚠ REVIEW SAYISI VE YILDIZ BURADA YOK — ve hiçbir SP-API ucunda
        yok. Boş bir kolon bile bırakılmıyor: olmayan bir alanı raporda
        göstermek, bir gün dolacağı izlenimi verir.
        """
        ozetler = ham.get("summaries") or []
        ozet = ozetler[0] if ozetler else {}
        kaynak = "catalog-items-2022-04-01"

        siralar = ham.get("salesRanks") or []
        en_iyi_sira, sira_kategorisi = None, None
        for kayit in siralar:
            for grup in ("classificationRanks", "displayGroupRanks"):
                for sira in kayit.get(grup) or []:
                    deger = sira.get("rank")
                    if deger is None:
                        continue
                    if en_iyi_sira is None or deger < en_iyi_sira:
                        en_iyi_sira = deger
                        sira_kategorisi = (sira.get("title")
                                           or sira.get("classificationId"))

        gorseller = ham.get("images") or []
        gorsel_sayisi = None
        if gorseller:
            # `images[]` pazar başına bir kayıt, içinde `images[]` listesi.
            gorsel_sayisi = max(len(g.get("images") or []) for g in gorseller)

        nitelikler = ham.get("attributes") or {}
        bulletlar = _tum_degerler(nitelikler.get("bullet_point"))

        return {
            "asin": asin,
            "baslik": olculen_ya_da_yok(
                ozet.get("itemName"), kaynak, f"{asin} baslik",
                "catalog summaries.itemName bos"),
            "marka": olculen_ya_da_yok(
                ozet.get("brand"), kaynak, f"{asin} marka",
                "catalog summaries.brand bos"),
            "bsr": olculen_ya_da_yok(
                en_iyi_sira, kaynak, f"{asin} BSR",
                "salesRanks bu ASIN icin sira dondurmedi — Amazon'un "
                "bilinen kusuru, kok kategori sirasi cogu ASIN'de bos"),
            "bsr_kategori": sira_kategorisi,
            "gorsel_sayisi": olculen_ya_da_yok(
                gorsel_sayisi, kaynak, f"{asin} gorsel sayisi",
                "catalog images dizisi bos"),
            "bullet_sayisi": olculen_ya_da_yok(
                len(bulletlar) if bulletlar else None, kaynak,
                f"{asin} bullet sayisi",
                "rakip ASIN'de bullet_point niteligi acik degil — "
                "katalog niteliklerinin gorunurlugu urune gore degisir"),
            "bulletlar": bulletlar,
            "urun_tipi": ozet.get("productType"),
        }

    # -- rakip fiyatı ---------------------------------------------------
    def rekabetci_ozet(self, asinler: list[str]) -> dict[str, Any]:
        """Product Pricing v2022-05-01 `getCompetitiveSummary` — 20 ASIN'lik
        yığın. Rakip fiyatının TEK yasal kaynağı budur; Catalog Items fiyat
        döndürmez."""
        istekler = [{"uri": "/products/pricing/2022-05-01/items/competitiveSummary",
                     "method": "GET",
                     "asin": asin,
                     "marketplaceId": self.kimlik.marketplace_id,
                     "includedData": ["featuredBuyingOptions"]}
                    for asin in asinler[:FIYAT_YIGIN_BOYU]]
        return self.oturum.post(
            "/batches/products/pricing/2022-05-01/items/competitiveSummary",
            {"requests": istekler})

    def fiyat_coz(self, yanit: dict[str, Any]) -> dict[str, Deger]:
        """ASIN → öne çıkan teklif fiyatı. Okunamayan ASIN gerekçeli
        `Yok` alır, 0 almaz."""
        kaynak = "pricing-2022-05-01-competitiveSummary"
        cikti: dict[str, Deger] = {}
        for yanit_oge in yanit.get("responses") or []:
            govde = yanit_oge.get("body") or {}
            asin = govde.get("asin") or (yanit_oge.get("request") or {}).get("asin")
            if not asin:
                continue
            fiyat = None
            para = None
            for secenek in govde.get("featuredBuyingOptions") or []:
                for teklif in secenek.get("segmentedFeaturedOffers") or []:
                    listeleme = (teklif.get("listingPrice") or {})
                    if listeleme.get("amount") is not None:
                        fiyat = listeleme["amount"]
                        para = listeleme.get("currencyCode")
                        break
                if fiyat is not None:
                    break
            if fiyat is None:
                cikti[asin] = yok(f"{asin} fiyat",
                                  "featuredBuyingOptions bos — ASIN'de one "
                                  "cikan teklif yok (stok disi olabilir)")
            else:
                cikti[asin] = olculen_ya_da_yok(
                    {"tutar": fiyat, "para": para}, kaynak, f"{asin} fiyat",
                    "fiyat okunamadi")
        return cikti
