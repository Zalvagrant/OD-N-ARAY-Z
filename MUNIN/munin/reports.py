"""Rapor uçları: Reports API 2021-06-30 + Data Kiosk 2023-11-15.

Buradaki üç rapor MUNIN'in üç sorusuna karşılık gelir:

| Rapor | Cevapladığı soru |
|---|---|
| Brand Analytics Search Terms | Pazarda hangi kelimeler aranıyor, top-3'te kim var |
| Sales & Traffic (ASIN) | Değişikliğim işe yaradı mı? (session, birim-session %) |
| FBA Customer Returns | Neden iade ediliyor — listing sorunu mu, ürün sorunu mu |

RAPOR AKIŞI create → poll → getDocument → indir. Rapor kuyruğu gerçekte
1–15 dakika sürer, bu yüzden bloklayan bekleme İKİ FAZLIDIR: bir koşum
ister ve kimliği kaydeder, sonraki koşum toplar. `bekle=True` verilirse
tek koşumda bekler (sahip başındayken kullanışlı).

⚠ BRAND ANALYTICS ÖN KOŞULU: Brand Registry + geliştirici profilinde
"Brand Analytics" rolü. İkisi yoksa uç 403 döner ve MUNIN bunu ADIYLA
bildirir — "veri yok" demez.

⚠ ARAMA HACMİ DİYE BİR ALAN YOKTUR. Brand Analytics `searchFrequencyRank`
verir, hacim vermez. Rank'i hacme çeviren hiçbir formül bu dosyada yoktur
ve olmayacaktır; öyle bir sayı uydurma olur.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any, Callable

from .http import ApiHatasi, Oturum, satirlari_coz

RAPOR_KOK = "/reports/2021-06-30"
KIOSK_KOK = "/dataKiosk/2023-11-15"

BA_ARAMA_TERIMLERI = "GET_BRAND_ANALYTICS_SEARCH_TERMS_REPORT"
IADE_RAPORU = "GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA"

_BITEN_DURUMLAR = ("DONE", "FATAL", "CANCELLED")


class RaporHatasi(ApiHatasi):
    pass


@dataclass(frozen=True)
class RaporTalebi:
    rapor_id: str
    tur: str
    baslangic: str
    bitis: str
    istendi: str


def hafta_hizala(bitis: date | None = None, geri: int = 1) -> tuple[str, str]:
    """Brand Analytics WEEK dönemi Pazar→Cumartesi'dir.

    Hizasız tarih verilirse Amazon raporu FATAL ile reddeder — hatanın
    kendisi de tarihin yanlış olduğunu söylemez, sadece "FATAL" der. Bu
    yüzden hizalama burada zorlanır.

    `geri=1` → en son TAMAMLANMIŞ hafta. Brand Analytics ~2 gün gecikmeli
    yayımlandığı için içinde bulunulan hafta istenmez.
    """
    bugun = bitis or datetime.now(timezone.utc).date()
    # weekday(): Pazartesi=0 … Pazar=6. En son geçmiş Cumartesi'yi bul.
    gun_farki = (bugun.weekday() + 2) % 7   # Cumartesi'ye kaç gün geriye
    son_cumartesi = bugun - timedelta(days=gun_farki or 7)
    cumartesi = son_cumartesi - timedelta(weeks=geri - 1)
    pazar = cumartesi - timedelta(days=6)
    return pazar.isoformat(), cumartesi.isoformat()


def _iso(gun: date) -> str:
    return datetime(gun.year, gun.month, gun.day,
                    tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


class Raporlar:
    def __init__(self, oturum: Oturum, kimlik: Any):
        self.oturum = oturum
        self.kimlik = kimlik

    # -- create → poll → download --------------------------------------
    def talep_et(self, tur: str, baslangic: str, bitis: str,
                 secenekler: dict[str, str] | None = None) -> RaporTalebi:
        govde: dict[str, Any] = {
            "reportType": tur,
            "marketplaceIds": [self.kimlik.marketplace_id],
            "dataStartTime": _iso(date.fromisoformat(baslangic)),
            "dataEndTime": _iso(date.fromisoformat(bitis))}
        if secenekler:
            govde["reportOptions"] = secenekler
        yanit = self.oturum.post(f"{RAPOR_KOK}/reports", govde)
        rapor_id = yanit.get("reportId")
        if not rapor_id:
            raise RaporHatasi(f"{tur}: createReport reportId dondurmedi")
        return RaporTalebi(rapor_id, tur, baslangic, bitis,
                           datetime.now(timezone.utc).isoformat())

    def durum(self, rapor_id: str) -> dict[str, Any]:
        return self.oturum.get(f"{RAPOR_KOK}/reports/{rapor_id}")

    def belge_al(self, belge_id: str) -> bytes:
        kayit = self.oturum.get(f"{RAPOR_KOK}/documents/{belge_id}")
        url = kayit.get("url")
        if not url:
            raise RaporHatasi("getReportDocument indirme adresi dondurmedi")
        return self.oturum.belge_indir(url)

    def topla(self, rapor_id: str) -> tuple[str, bytes | None]:
        """Raporun durumunu döndürür; bittiyse ham baytları da.

        `FATAL` dönerse SESSİZCE BOŞ dönmez — istisna atar. Bir raporun
        fatal olması ile boş olması bambaşka iki şeydir: ilki tarih/izin
        hatasıdır ve düzeltilebilir, ikincisi gerçek bir olgudur.
        """
        kayit = self.durum(rapor_id)
        islem = str(kayit.get("processingStatus", "")).upper()
        if islem == "FATAL":
            raise RaporHatasi(
                f"rapor FATAL — Amazon isteyi reddetti. En sik iki sebep: "
                f"(1) tarih araligi donem sinirina hizali degil, "
                f"(2) hesapta bu rapor icin izin/rol yok. Rapor: {rapor_id}")
        if islem == "CANCELLED":
            raise RaporHatasi(f"rapor iptal edildi (veri yok olabilir): "
                              f"{rapor_id}")
        if islem != "DONE":
            return islem or "IN_QUEUE", None
        belge_id = kayit.get("reportDocumentId")
        if not belge_id:
            raise RaporHatasi(f"rapor DONE ama reportDocumentId yok: {rapor_id}")
        return "DONE", self.belge_al(belge_id)

    def bekleyerek_al(self, talep: RaporTalebi, *, azami_saniye: float = 900,
                      taban: float = 15.0,
                      uyu: Callable[[float], None] | None = None,
                      saat: Callable[[], float] | None = None) -> bytes:
        """Rapor bitene kadar bekle. Sahip başındayken kullanılır."""
        import time as _t
        uyu = uyu or _t.sleep
        saat = saat or _t.monotonic
        biter = saat() + azami_saniye
        gecikme = taban
        while saat() < biter:
            islem, ham = self.topla(talep.rapor_id)
            if ham is not None:
                return ham
            uyu(min(gecikme, max(0.0, biter - saat())))
            gecikme = min(gecikme * 1.5, 60.0)
        raise RaporHatasi(
            f"{talep.tur}: {azami_saniye:.0f} sn icinde bitmedi. Rapor "
            f"kimligi {talep.rapor_id} — sonraki kosumda 'topla' ile alinir.")

    # -- somut raporlar -------------------------------------------------
    def brand_analytics_arama(self, baslangic: str, bitis: str,
                              donem: str = "WEEK") -> RaporTalebi:
        return self.talep_et(BA_ARAMA_TERIMLERI, baslangic, bitis,
                             {"reportPeriod": donem})

    def iadeler(self, baslangic: str, bitis: str) -> RaporTalebi:
        return self.talep_et(IADE_RAPORU, baslangic, bitis)

    @staticmethod
    def ba_coz(ham: bytes) -> list[dict[str, Any]]:
        """Brand Analytics arama terimleri raporunu satırlara çevirir.

        Amazon bu raporu GZIP JSON olarak yollar ama bazı hesaplarda TSV
        gelir. İkisi de denenir — biçimi varsaymak, çalışan bir raporu
        "bozuk" diye reddetmek demektir.
        """
        try:
            veri = json.loads(ham.decode("utf-8-sig"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return satirlari_coz(ham)
        if isinstance(veri, list):
            return veri
        for anahtar in ("dataByDepartmentAndSearchTerm", "reportData",
                        "rows", "data"):
            if isinstance(veri.get(anahtar), list):
                return veri[anahtar]
        return []

    @staticmethod
    def iade_coz(ham: bytes) -> list[dict[str, Any]]:
        return satirlari_coz(ham)   # bu rapor TSV'dir

    # -- Data Kiosk ------------------------------------------------------
    def kiosk_sor(self, graphql: str) -> str:
        yanit = self.oturum.post(f"{KIOSK_KOK}/queries", {"query": graphql})
        sorgu_id = yanit.get("queryId")
        if not sorgu_id:
            raise RaporHatasi("Data Kiosk queryId dondurmedi")
        return sorgu_id

    def kiosk_durum(self, sorgu_id: str) -> dict[str, Any]:
        return self.oturum.get(f"{KIOSK_KOK}/queries/{sorgu_id}")

    def kiosk_topla(self, sorgu_id: str) -> tuple[str, list[dict[str, Any]] | None]:
        kayit = self.kiosk_durum(sorgu_id)
        islem = str(kayit.get("processingStatus", "")).upper()
        if islem == "FATAL":
            hata_belge = kayit.get("errorDocumentId")
            raise RaporHatasi(
                f"Data Kiosk sorgusu FATAL. GraphQL semasi ya da tarih "
                f"araligi gecersiz olabilir. Hata belgesi: {hata_belge}")
        if islem == "CANCELLED":
            raise RaporHatasi(f"Data Kiosk sorgusu iptal edildi: {sorgu_id}")
        if islem != "DONE":
            return islem or "IN_QUEUE", None
        belge_id = kayit.get("dataDocumentId")
        if not belge_id:
            # DONE + belge yok = sorgu çalıştı, sonuç boş. Bu GERÇEK bir
            # olgudur (o dönemde veri yok), hata değil.
            return "DONE_BOS", []
        belge = self.oturum.get(f"{KIOSK_KOK}/documents/{belge_id}")
        url = belge.get("documentUrl")
        if not url:
            raise RaporHatasi("Data Kiosk belge adresi dondurmedi")
        ham = self.oturum.belge_indir(url)
        return "DONE", _jsonl_coz(ham)


def _jsonl_coz(ham: bytes) -> list[dict[str, Any]]:
    """Data Kiosk belgeleri JSONL'dir (satır başına bir JSON nesnesi)."""
    satirlar = []
    for cizgi in ham.decode("utf-8-sig").splitlines():
        cizgi = cizgi.strip()
        if not cizgi:
            continue
        try:
            satirlar.append(json.loads(cizgi))
        except json.JSONDecodeError:
            continue
    return satirlar


# -- doğrulanmış GraphQL sorgusu ---------------------------------------
# Şema adı doğrulandı: analytics_salesAndTraffic_2024_04_24
# (API sürümü 2023-11-15 — ikisi FARKLI, karıştırma).
SATIS_TRAFIK_SORGUSU = """
query MuninSalesAndTraffic {{
  analytics_salesAndTraffic_2024_04_24 {{
    salesAndTrafficByAsin(
      startDate: "{baslangic}"
      endDate: "{bitis}"
      aggregateBy: CHILD
      marketplaceIds: ["{pazar}"]
    ) {{
      startDate
      endDate
      childAsin
      sku
      trafficByAsin {{
        sessions
        pageViews
        buyBoxPercentage
        unitSessionPercentage
      }}
      salesByAsin {{
        unitsOrdered
        orderedProductSales {{ amount currencyCode }}
        totalOrderItems
      }}
    }}
  }}
}}
"""


def satis_trafik_sorgusu(baslangic: str, bitis: str, pazar: str) -> str:
    return SATIS_TRAFIK_SORGUSU.format(baslangic=baslangic, bitis=bitis,
                                       pazar=pazar)


# Search Query Performance şemasının TAM ADI DOĞRULANAMADI.
# Uydurulmuş bir şema adı ile sorgu göndermek her koşumda FATAL üretir ve
# sahibi "programım bozuk" diye yanıltır. Bu yüzden sorgu, sahibin Amazon
# şema gezgininden (developer-docs.amazon.com → Data Kiosk → Schema
# Explorer) yapıştıracağı bir dosyadan okunur. Dosya yoksa MUNIN komutu
# ADIYLA reddeder — sessizce atlamaz.
SQP_DOSYA_ADI = "sqp-sorgusu.graphql"


def sqp_sorgusu_oku(veri_kok: Any) -> str | None:
    from pathlib import Path
    yol = Path(veri_kok) / SQP_DOSYA_ADI
    if not yol.exists():
        return None
    metin = yol.read_text(encoding="utf-8").strip()
    return metin or None
