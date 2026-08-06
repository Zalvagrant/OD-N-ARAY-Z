# MUNIN

**Amazon listing optimizasyonu ve rakip istihbaratı.**

Hugin düşünceyi taşır, Munin hafızayı. HUGIN reklamı yönetir; MUNIN
listing'in bugün ne olduğunu, dün ne olduğunu ve rakiplerin ne
değiştirdiğini hatırlar.

MUNIN **bağımsızdır.** ODIN'e de HUGIN'e de kod olarak bağlı değildir:
hiçbir şey import etmez, ortak veritabanı okumaz, ortak klasör
kullanmaz. Kendi kimliği, kendi verisi, kendi raporları vardır.

Python 3.10+ · **sıfır bağımlılık** (yalnızca standart kütüphane) ·
`pip install` yok.

---

## Tek bağlayıcı kural

> **Ölçülmemiş hiçbir sayı basılmaz.**

Bir raporda bir sayı görüyorsan, o sayı gerçekten bir kaynaktan gelmiştir.
Veri yoksa placeholder, tahmin, `—` ya da `0` yazılmaz; **"ölçülemedi"**
yazılır ve **neden** ölçülemediği yanında durur.

Bunun somut sonuçları:

- **Listing sağlık puanı YOK.** "Başlık uzunluğu görsel sayısından kaç kat
  önemli?" sorusunun ölçülmüş bir cevabı yok. Uydurma ağırlıklarla üretilen
  tek bir sayı, altındaki on ölçümü gizler.
- **Rakip rating / review sayısı YOK.** Hiçbir SP-API ucundan gelmez. Boş
  kolon bile bırakılmadı — bir gün dolacağı izlenimi verirdi.
- **Arama hacmi YOK.** Brand Analytics *sıklık sırası* verir, hacim vermez.
  Rank'ten hacim türeten her formül uydurmadır.
- **"Tehdit seviyesi" YOK.** Ölçülen değişim basılır: fiyat %12 düştü,
  başlığını değiştirdi, iki görsel ekledi. Tehdidi sen okursun.
- **"İade riski skoru" YOK.** İade neden kodlarının dağılımı basılır.

---

## Ne yapar

| Komut | Ne yapar |
|---|---|
| `dogrula` | Kimlik ve bağlantı kontrolü |
| `denetle` | Kendi listing'lerini kendi kural setinle denetler |
| `kelimeler` | Brand Analytics × listing içeriği → keyword boşluğu |
| `iadeler` | İade neden ayrıştırması: listing sorunu mu, ürün sorunu mu |
| `basari` | Session / dönüşüm — **değişiklik işe yaradı mı** |
| `kesfet` | Kelimeden rakip *adayı* keşfi |
| `rakipler` | Rakip profilleri + haftalık değişim |
| `hugin-al` | HUGIN'in reklam çıktısını alır (elle, katı sözleşmeyle) |
| `bekleyenler` | Amazon kuyruğundaki raporları toplar |

---

## Beş dakikada başla

```bash
# 1. Kimlik dosyanı oluştur (senkronsuz klasörde — masaüstünde DEĞİL)
mkdir -p ~/.munin && chmod 700 ~/.munin
nano ~/.munin/kimlik.json        # içerik için KURULUM.md
chmod 600 ~/.munin/kimlik.json

# 2. Neyi izleyeceğini söyle
python3 -m munin hedefler-olustur
nano veri/hedefler.json          # SKU'ların, rakip ASIN'lerin

# 3. Bağlantıyı doğrula
python3 -m munin dogrula

# 4. İlk denetim
python3 -m munin denetle
```

Raporlar `veri/rapor/` altına Markdown, JSON ve HTML olarak yazılır.
HTML'i çift tıklayıp tarayıcıda okuyabilirsin.

---

## Hangi sırayla koşmalı

İlk hafta, bu sırayla:

1. **`iadeler`** — önce bunu koş. İade oranın kritikse, listing
   optimizasyonu yanlış tedavi olabilir. Neden dağılımı "defective"
   ağırlıklıysa daha çok trafik daha çok iade demektir.
2. **`basari`** — değişiklik ÖNCESİ ölçüm. Bunu almadan hiçbir şeyi
   değiştirme; sonra "işe yaradı mı" sorusunu cevaplayamazsın.
3. **`denetle`** — listing'lerindeki ölçülebilir kusurlar.
4. **`kelimeler`** — pazarda aranan ama listing'inde geçmeyen kelimeler.
5. **`kesfet` → `rakipler`** — rakip taban ölçümü.

Sonra değişiklikleri yap, iki hafta bekle, **`basari`**'yi tekrar koş.
İkinci ölçüm birinciyle karşılaştırılır.

---

## HUGIN ile ilişki

Kod bağlantısı **yok**. Aralarındaki tek bağ, senin elle taşıdığın iki
dosya:

```
veri/hugin/gelen/   ← HUGIN'den MUNIN'e  (reklam kelime performansı)
veri/hugin/giden/   → MUNIN'den HUGIN'e  (listing tarafındaki olgular)
```

MUNIN'in HUGIN'den istediği tam dosya biçimi: **`HUGIN-KOPRUSU.md`**.

MUNIN, HUGIN'e *"şu kelimeyi negatife al"* demez. Negatif ve bütçe
kararları MUNIN'in ölçmediği şeylere bağlıdır (marj, stok, kampanya
hedefi). MUNIN yalnızca listing tarafındaki olguyu bildirir.

---

## Güvenlik

- **Kimlik dosyanı masaüstüne koyma.** Masaüstü çoğu makinede iCloud /
  OneDrive / Dropbox ile senkronlanır; oraya konan bir refresh token
  sessizce buluta kopyalanır. Varsayılan konum `~/.munin/kimlik.json`
  ve program senkron şüphesi görürse yüksek sesle uyarır.
- MUNIN **salt okunur**dur. Hiçbir yazma ucu yoktur; listing'ini kendisi
  değiştirmez. Değişikliği Seller Central'da sen yaparsın.
- Hiçbir hata mesajı, hiçbir log satırı token ya da client secret içermez.
- **Scraping yoktur ve eklenmemelidir** — satıcı hesabını riske atar.

---

## Testler

```bash
python3 -m unittest discover -s tests
```

103 test, hepsi çevrimdışı (ağa çıkmaz).

---

## Bu tasarım nasıl oluştu

İlk tasarım iki bağımsız incelemeden geçti ve **üç iddiası çürütüldü**:

1. **`searchCatalogItems` indeksleme kontrolü değildir.** Katalog eşleme
   aramasıdır, müşterinin gördüğü arama motoru (A9) değil. "Bu kelimede
   indeksliyim" sonucu üretmek yanlış pozitif ve negatif verirdi. Çıkarıldı;
   uç yalnızca rakip *adayı* keşfi için kaldı.
2. **Başarı ölçütü ilk tasarımda yoktu.** Listing optimize edilip "işe
   yaradı mı" sorusu yapısal olarak cevapsız kalıyordu. Sales & Traffic
   (session, birim/session %) çekirdek hale getirildi.
3. **İade krizi ile listing arasındaki bağ ölçülemez.** Uydurma bir "iade
   riski skoru" yerine iade *neden kodları* getirildi — çünkü "not as
   described" ile "defective" bambaşka iki teşhistir ve ikincisinde listing
   optimizasyonu yanlış tedavidir.

Ayrıntı: `TASARIM-NOTLARI.md`.
