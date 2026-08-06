# MUNIN — Tasarım notları

Bu belge, MUNIN'in **yapmadığı** şeylerin gerekçesidir. Bir gün biri
"neden burada rakip rating'i yok?" diye sorduğunda cevap burada.

---

## İnceleme süreci

İlk tasarım iki bağımsız incelemeden geçti: biri yapısal (terra), biri
Amazon/SP-API uzmanı (luna). Üç iddia **ikisi de aynı şeyi söyleyerek**
çürüttü; ikisinin aynı yere parmak basması bağlayıcı sayıldı.

---

## Çürütülen 1 — "İndeksleme kontrolü"

**İddia:** `searchCatalogItems` ile bir kelimeyi aratıp kendi ASIN'im
çıkıyor mu diye bakarım; çıkıyorsa o kelimede indeksliyim.

**Çürütme (2/2):** `searchCatalogItems` bir **katalog eşleme
aramasıdır**, müşterinin gördüğü arama motoru (A9/Cosmo) değildir. Hem
yanlış pozitif hem yanlış negatif verir. Ondan üretilen "indekslidir"
cümlesi ölçüm değil, tahmindir.

**Sonuç:** İddia programdan çıkarıldı. Uç kaldı ama yalnızca **rakip
adayı keşfi** için ve `kesfet` komutu bunu her koşumda ekrana basar:

> ⚠ Bu komut ARAMA SIRALAMASI VERMEZ.

Gerçek indeksleme kanıtı Data Kiosk Search Query Performance'tadır.
O şemanın tam adını doğrulayamadım, bu yüzden uydurulmuş bir şemayla her
koşumda FATAL üretmek yerine `veri/sqp-sorgusu.graphql` dosyasına
bırakıldı — sahip Amazon şema gezgininden yapıştırır.

---

## Çürütülen 2 — Başarı ölçütü hiç yoktu

**Kusur:** İlk tasarımın beş veri kaynağının hiçbiri kendi ASIN'imin
session ve dönüşüm verisini vermiyordu. Yani MUNIN listing'i optimize
edecek ama **"işe yaradı mı?" sorusu yapısal olarak cevapsız** kalacaktı.

Bu, "sahte veri yasak" kuralının en ağır ihlali olurdu: kanıtsız öneri =
tahmin.

**Sonuç:** Sales & Traffic (Data Kiosk `analytics_salesAndTraffic_2024_04_24`,
`salesAndTrafficByAsin`) çekirdek hale getirildi. `basari` komutu
`sessions` ve `unitSessionPercentage` ölçer ve **önceki ölçümle
karşılaştırır**. Bu yüzden `anlik/` klasörü hiç silinmemeli.

Kullanım kuralı README'de: değişiklikten **önce** bir ölçüm al.

---

## Çürütülen 3 — İade riski skoru

**İddia:** İade oranı %0,69'dan %15,79'a çıkmış; listing'i optimize
edelim.

**Çürütme:** İade ile listing arasındaki bağ **ölçülemez**. Ölçülebilen
tek şey iade **neden kodları**dır. Ve bu ayrım her şeyi değiştirir:

- `NOT_AS_DESCRIBED` baskınsa → beklenti listing'de yanlış kuruluyor.
  MUNIN'in işi.
- `DEFECTIVE` baskınsa → **listing optimizasyonu yanlış tedavidir.**
  Daha çok trafik getirip daha çok iade üretir.

**Sonuç:** `iadeler` komutu bir skor değil, **betimsel tablo** üretir:
ASIN başına iade adedi, neden dağılımı, üç kova (listing / ürün /
lojistik). `returns.teshis()` ürün kaynaklıysa açıkça şunu yazar:

> BU BIR LISTING SORUNU DEGILDIR; listing optimizasyonu daha cok trafik
> getirip daha cok iade uretebilir.

Kova eşlemesi bir **politika kararıdır**, ölçüm değil — `munin/returns.py`
içinde tek yerde durur ve değiştirilebilir.

---

## Üretilmeyen sayılar ve gerekçeleri

| Üretilmeyen | Gerekçe |
|---|---|
| Listing sağlık puanı (0–100) | Ağırlıkları sahip onaylamadı. "Başlık uzunluğu görsel sayısından kaç kat önemli?" ölçülmüş bir şey değil. Tek sayı, altındaki on ölçümü gizler |
| Rakip rating / review sayısı | **Hiçbir SP-API ucundan gelmez.** Scraping satıcı hesabını riske atar. Boş kolon bile bırakılmadı |
| Rakip aylık satış tahmini | Tahmindir, ölçüm değil |
| Rakip "tehdit seviyesi" | Ölçülmemiş ağırlıklarla üretilecek yargı. Yerine ölçülen değişim basılır |
| Arama hacmi | Brand Analytics `searchFrequencyRank` verir. Rank bir sıralamadır; 1. ile 2. sıra arasındaki oran bilinmez |
| "Kaçırılan satış" | Bir kelimede görünmemek, o kelimeden gelecek satış miktarı hakkında hiçbir şey söylemez |
| Kendi click/conversion share'im | O paylar raporda listelenen **top-3 ASIN'e** aittir. ASIN'in o üçte değilse ölçüm yoktur |
| İade oranı (%) | MUNIN iade **sayısını** ölçer. Oran için aynı dönemin sipariş sayısı gerekir, o rapor bunu içermez |

---

## Sıfır ile yokluk ayrımı

Programın en çok işe yarayan tasarım kararı, `munin/envelope.py`
içindeki `Olculen` / `Yok` ayrımı:

```
0 gorsel                 → ölçüldü, sonuç sıfır → KALDI, aksiyon: görsel ekle
gorsel sayisi okunamadi  → ölçülmedi            → ÖLÇÜLEMEZ, aksiyon: API/rol kontrolü
```

İkisi **farklı aksiyon** gerektirir. Çoğu araç ikisini de `0` ya da `—`
diye basar ve fark kaybolur.

Aynı kural denetimde de geçerli: **ölçülemeyen bir kural GEÇTİ
sayılmaz.** Denetim üç kova döner — GEÇTİ / KALDI / ÖLÇÜLEMEZ — ve
üçüncüsü rapordan gizlenmez.

---

## Doğrulanmış API gerçekleri

| Gerçek | Not |
|---|---|
| AWS SigV4 **gerekmiyor** | 2 Eki 2023'ten beri LWA access token yeterli |
| `generic_keyword` = backend search terms | Ama **ürün tipine bağlı**; anahtar farklı olabilir. MUNIN yoksa gerekçesiyle söyler |
| `bullet_point` = bullet'lar | Dizi, her eleman `{value, marketplace_id, language_tag}` |
| Listings `attributes` = **senin gönderdiğin** değer | Amazon'un indekslediği değil. `spapi.py` bunu belgeliyor |
| `salesRanks` → `classificationRanks` + `displayGroupRanks` | Kök kategori BSR'ı **çoğu ASIN'de boş** (Amazon'un bilinen kusuru) |
| Brand Analytics WEEK dönemi | **Pazar → Cumartesi** hizalı olmak zorunda; değilse rapor FATAL. `hafta_hizala()` bunu zorlar |
| Brand Analytics ön koşulu | Brand Registry **+** geliştirici profilinde "Brand Analytics" rolü |
| Rakip fiyatı | Catalog Items'tan **gelmez**. Pricing v2022-05-01 `getCompetitiveSummary`, 20 ASIN'lik yığın |
| Rapor kuyruğu | Gerçekte 1–15 dk. Bu yüzden iki fazlı: iste → sonra topla |

---

## Bilerek kapsam dışı

- **Yazma uçları.** MUNIN listing'i kendisi güncellemez. `patchListingsItem`
  ayrı bir güvenlik incelemesi ister; yanlış bir yama canlı listing'i bozar.
- **A+ Content.** Ayrı API (`aplus-content-2020-11-01`).
- **Scraping.** Hiçbir koşulda eklenmemeli.
- **Otomatik fiyat değişimi.** Fiyat sahibin kararı.

---

## stdlib-only kararının bedeli

Kabul edilen bedel: 429 geri çekilmesi, rapor kuyruğu, gzip açma,
ISO-8859-1/BOM kodlama çözümü ve TSV ayrıştırması elle yazıldı
(`munin/http.py`). pandas yok → tüm birleştirmeler elde.

Karşılığında: klasörü masaüstüne kopyala, `python3 -m munin` yaz, çalışsın.
Sanal ortam yok, `pip install` yok, sürüm çakışması yok.
