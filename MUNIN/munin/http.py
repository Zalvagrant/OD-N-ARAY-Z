"""stdlib HTTP taşıma katmanı — SP-API için.

Neden elle yazıldı: MUNIN masaüstüne kopyalanıp `python -m munin` ile
çalışsın diye hiçbir pip paketi kullanmaz. Bedeli bu dosyadır — 429
geri çekilmesi, gzip açma ve hata haritalama elle yazılmıştır.

İKİ DEĞİŞMEZ:
1. Hiçbir hata mesajı, hiçbir istisna, hiçbir günlük satırı token ya da
   client_secret İÇERMEZ. Hata mesajları yolun yalnızca sorgu-öncesi
   kısmını taşır.
2. Kısmi sonuç TAM sonuç gibi dönmez. Sayfalama yarıda kalırsa istisna
   atılır; kısa liste sessizce dönmez (bkz. envelope.kapsam_kaniti).

AWS SigV4 YOKTUR. SP-API 2023'ten beri yalnızca LWA access token ister;
`x-amz-access-token` başlığı yeterlidir.
"""
from __future__ import annotations

import gzip
import io
import json
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib
from typing import Any, Callable

KULLANICI_AJANI = "MUNIN/1.0 (Language=Python; stdlib)"
LWA_URL = "https://api.amazon.com/auth/o2/token"

# SP-API'nin geçici olarak reddettiği durumlar — geri çekilip tekrar denenir.
_GECICI_KODLAR = (429, 500, 502, 503, 504)


class ApiHatasi(Exception):
    """SP-API çağrısı başarısız. Mesaj asla gizli veri içermez."""

    def __init__(self, mesaj: str, kod: int | None = None,
                 gecici: bool = False):
        super().__init__(mesaj)
        self.kod = kod
        self.gecici = gecici


def _govde_ac(ham: bytes, kodlama: str | None) -> bytes:
    """gzip/deflate açar. Amazon rapor belgeleri çoğu zaman gzip'tir ama
    `Content-Encoding` başlığı her zaman doğru gelmez — sihirli baytlara da
    bakılır, yoksa rapor 'bozuk JSON' diye reddedilirdi."""
    if ham[:2] == b"\x1f\x8b":
        return gzip.decompress(ham)
    if kodlama == "gzip":
        return gzip.decompress(ham)
    if kodlama == "deflate":
        return zlib.decompress(ham, -zlib.MAX_WBITS)
    return ham


def istek(url: str, basliklar: dict[str, str], govde: bytes | None = None,
          yontem: str = "GET", zaman_asimi: int = 40) -> tuple[int, bytes, dict[str, str]]:
    """Tek HTTP çağrısı. Ham bayt döner — JSON çözümü çağırana ait."""
    basliklar = {"User-Agent": KULLANICI_AJANI, **basliklar}
    req = urllib.request.Request(url, data=govde, headers=basliklar,
                                 method=yontem)
    guvenli_url = url.split("?")[0]
    try:
        with urllib.request.urlopen(req, timeout=zaman_asimi) as yanit:
            bas = {k.lower(): v for k, v in yanit.headers.items()}
            return (yanit.status,
                    _govde_ac(yanit.read(), bas.get("content-encoding")),
                    bas)
    except urllib.error.HTTPError as exc:
        # Gövde HATA AYIKLAMA için okunur ama mesaja yalnızca Amazon'un
        # `errors[].code` alanı girer — gövdenin tamamı bazen isteği,
        # dolayısıyla token'ı yankılar.
        kod_metni = ""
        try:
            ayrinti = json.loads(exc.read().decode("utf-8", "replace"))
            hatalar = ayrinti.get("errors") or []
            if hatalar:
                kod_metni = f" ({hatalar[0].get('code', '')}: "
                kod_metni += f"{str(hatalar[0].get('message', ''))[:200]})"
        except Exception:
            pass
        raise ApiHatasi(f"SP-API HTTP {exc.code} — {guvenli_url}{kod_metni}",
                        exc.code, exc.code in _GECICI_KODLAR) from None
    except urllib.error.URLError as exc:
        raise ApiHatasi(f"baglanti hatasi — {guvenli_url}: {exc.reason}",
                        None, True) from None
    except OSError as exc:
        # urllib soket hatalarının ÇOĞUNU URLError'a sarar, hepsini değil.
        # RemoteDisconnected ve antivirüs kaynaklı PermissionError ham
        # gelir; sarmalanmazsa tek geçici arıza tüm koşumu öldürür.
        raise ApiHatasi(f"tasima hatasi — {guvenli_url}: "
                        f"{type(exc).__name__}", None, True) from None


def geri_cekilerek(cagri: Callable[[], Any], deneme: int = 5,
                   taban: float = 2.0,
                   uyu: Callable[[float], None] = time.sleep) -> Any:
    """Geçici hatalarda üstel geri çekilme. Kalıcı hata (401/403/404)
    ANINDA yükselir — 5 kez denemek yanlış kimliği doğru yapmaz."""
    son: ApiHatasi | None = None
    for sira in range(1, deneme + 1):
        try:
            return cagri()
        except ApiHatasi as exc:
            if not exc.gecici:
                raise
            son = exc
            if sira < deneme:
                uyu(taban * (2 ** (sira - 1)))
    raise son if son else ApiHatasi("bilinmeyen tasima hatasi")


class Oturum:
    """LWA access token'ı tutan ve SP-API çağrılarını imzalayan oturum.

    Token bellekte yaşar, diske YAZILMAZ, `repr`'de görünmez ve süresi
    dolmadan 60 sn önce kendini yeniler.
    """

    def __init__(self, kimlik: Any, taşıma: Callable[..., Any] = istek,
                 saat: Callable[[], float] = time.monotonic):
        self._kimlik = kimlik
        self._tasima = taşıma
        self._saat = saat
        self._token: str | None = None
        self._biter: float = 0.0
        self.cagri_sayisi = 0

    def __repr__(self) -> str:
        return f"Oturum(seller={self._kimlik.seller_id!r}, token=<gizlendi>)"

    def _access_token(self) -> str:
        if self._token and self._saat() < self._biter:
            return self._token
        form = urllib.parse.urlencode({
            "grant_type": "refresh_token",
            "refresh_token": self._kimlik.refresh_token,
            "client_id": self._kimlik.lwa_client_id,
            "client_secret": self._kimlik.lwa_client_secret,
        }).encode("ascii")
        durum, govde, _ = geri_cekilerek(lambda: self._tasima(
            LWA_URL, {"Content-Type": "application/x-www-form-urlencoded"},
            form, "POST"))
        try:
            yanit = json.loads(govde.decode("utf-8"))
        except json.JSONDecodeError:
            raise ApiHatasi("LWA yaniti JSON degil") from None
        token = yanit.get("access_token")
        if not token:
            # Amazon'un hata gövdesi buraya GİRMEZ; içinde client_id olabilir.
            raise ApiHatasi("LWA access_token dondurmedi — client_id/secret/"
                            "refresh_token uclusunu kontrol et")
        self._token = token
        self._biter = self._saat() + max(60.0, float(yanit.get("expires_in", 3600)) - 60)
        return token

    def get(self, yol: str, parametreler: dict[str, str] | None = None) -> dict[str, Any]:
        url = self._kimlik.uc_nokta + yol
        if parametreler:
            url += "?" + urllib.parse.urlencode(parametreler)
        return self._json_cagri(url, None, "GET")

    def post(self, yol: str, govde: dict[str, Any]) -> dict[str, Any]:
        return self._json_cagri(self._kimlik.uc_nokta + yol,
                                json.dumps(govde).encode("utf-8"), "POST")

    def _json_cagri(self, url: str, govde: bytes | None, yontem: str) -> dict[str, Any]:
        basliklar = {"x-amz-access-token": self._access_token()}
        if govde is not None:
            basliklar["Content-Type"] = "application/json"

        def cagir():
            return self._tasima(url, basliklar, govde, yontem)

        _, ham, _ = geri_cekilerek(cagir)
        self.cagri_sayisi += 1
        if not ham:
            return {}
        try:
            return json.loads(ham.decode("utf-8"))
        except json.JSONDecodeError:
            raise ApiHatasi(f"yanit JSON degil — {url.split('?')[0]}") from None

    def belge_indir(self, url: str) -> bytes:
        """Ön-imzalı rapor belgesi. Auth başlığı YOK (url zaten imzalı).
        gzip otomatik açılır."""
        def cagir():
            return istek(url, {}, None, "GET", zaman_asimi=180)

        _, ham, _ = geri_cekilerek(cagir)
        return ham


def satirlari_coz(ham: bytes) -> list[dict[str, str]]:
    """Amazon'un TAB ile ayrılmış rapor metnini satır sözlüklerine çevirir.

    Kodlama sırası bilerek seçildi: Amazon bu raporları çoğunlukla
    ISO-8859-1 (latin-1) yollar ama bazı pazarlarda UTF-8 BOM ile gelir.
    Yanlış kodlama okunan Türkçe/Almanca karakterleri bozar ve keyword
    eşleşmesini sessizce düşürür — o yüzden BOM önce denenir.
    """
    for kodlama in ("utf-8-sig", "utf-8", "iso-8859-1"):
        try:
            metin = ham.decode(kodlama)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ApiHatasi("rapor belgesi hicbir bilinen kodlamayla okunamadi")

    okuyucu = io.StringIO(metin)
    basliklar = okuyucu.readline().rstrip("\r\n").split("\t")
    satirlar: list[dict[str, str]] = []
    for cizgi in okuyucu:
        cizgi = cizgi.rstrip("\r\n")
        if not cizgi:
            continue
        alanlar = cizgi.split("\t")
        # Kısa satırı doldurmak veri uydurmaktır; satır atlanır ve
        # çağıran kapsam kanıtı ile eksikliği görür.
        if len(alanlar) != len(basliklar):
            continue
        satirlar.append(dict(zip(basliklar, alanlar)))
    return satirlar
