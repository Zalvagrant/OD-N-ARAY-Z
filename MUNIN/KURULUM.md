# MUNIN — Kurulum

Python 3.10+ dışında hiçbir şey gerekmez. `pip install` yok.

```bash
python3 --version      # 3.10 ya da uzeri olmali
```

---

## 1. Klasörü masaüstüne koy

Klasörü olduğu gibi masaüstüne kopyala. Sonra:

```bash
cd ~/Desktop/MUNIN          # Windows: cd %USERPROFILE%\Desktop\MUNIN
python3 -m munin --help
```

Yardım metni geldiyse program çalışıyor demektir.

---

## 2. Kimlik dosyası — ⚠ MASAÜSTÜNE KOYMA

Refresh token düz metindir. Masaüstü çoğu makinede iCloud Drive,
OneDrive ya da Dropbox ile senkronlanır — oraya konan bir token sessizce
buluta kopyalanır ve geri alınamaz.

Bu yüzden kimlik dosyası **ayrı ve senkronsuz** bir yerde durur:

**macOS / Linux**

```bash
mkdir -p ~/.munin && chmod 700 ~/.munin
nano ~/.munin/kimlik.json
chmod 600 ~/.munin/kimlik.json
```

**Windows (PowerShell)**

```powershell
mkdir $HOME\.munin
notepad $HOME\.munin\kimlik.json
```

Dosyanın içeriği **tam olarak** şu beş alan:

```json
{
  "lwa_client_id": "amzn1.application-oa2-client....",
  "lwa_client_secret": "amzn1.oa2-cs.v1....",
  "refresh_token": "Atzr|....",
  "marketplace_id": "ATVPDKIKX0DER",
  "seller_id": "A1XXXXXXXXXXXX",
  "region": "na"
}
```

| Alan | Nereden alınır |
|---|---|
| `lwa_client_id` · `lwa_client_secret` | Seller Central → Developer Central → uygulaman → LWA credentials |
| `refresh_token` | Uygulamayı kendi hesabına yetkilendirince (self-authorize) çıkar |
| `marketplace_id` | ABD için `ATVPDKIKX0DER` |
| `seller_id` | Seller Central → Account Info → Merchant Token |
| `region` | ABD/Kanada/Meksika → `na` · Avrupa → `eu` · Uzak Doğu → `fe` |

> **Anahtarlarını hiçbir sohbete yapıştırma.** Bu dosyayı sen kendin
> oluşturursun; MUNIN dosyayı okur ama içeriğini asla loglamaz, hata
> mesajına koymaz, `repr()` çıktısında göstermez.

Tek seferlik koşum için ortam değişkeni de kullanabilirsin — dosyayı ezer:

```bash
MUNIN_REFRESH_TOKEN="Atzr|..." python3 -m munin dogrula
```

---

## 3. Gereken SP-API rolleri

Uygulamanın geliştirici profilinde şu roller açık olmalı:

| Rol | Hangi komut için |
|---|---|
| Product Listing | `denetle` |
| Amazon Fulfillment | `iadeler` |
| Brand Analytics | `kelimeler` ← **Brand Registry de şart** |
| Pricing | `rakipler` (rakip fiyatı) |
| Selling Partner Insights | `basari` (Data Kiosk) |

`kelimeler` komutu 403 alıyorsa: ya Brand Registry yok, ya da geliştirici
profilinde "Brand Analytics" rolü işaretli değil. MUNIN bunu adıyla söyler.

---

## 4. Neyi izleyeceğini söyle

```bash
python3 -m munin hedefler-olustur
```

`veri/hedefler.json` oluşur. İçini doldur:

```json
{
  "skular": ["SKU-001", "SKU-002"],
  "hedef_keywordler": {
    "SKU-001": "cat litter mat"
  },
  "rakip_asinler": ["B0XXXXXXX1", "B0XXXXXXX2"],
  "kendi_asinlerim": ["B0YYYYYYY1", "B0YYYYYYY2"],
  "kesif_kelimeleri": ["cat litter mat", "litter trapping mat"],
  "fiyat_tabani": 25.0
}
```

| Alan | Ne işe yarar |
|---|---|
| `skular` | Denetlenecek kendi SKU'ların |
| `hedef_keywordler` | SKU başına ana keyword — "başlıkta önde mi" bunu ölçer. Yazmazsan o kural **ölçülemez** kalır |
| `rakip_asinler` | Haftalık izlenecek rakipler |
| `kendi_asinlerim` | Brand Analytics top-3 listesinde kendini tanımak için |
| `kesif_kelimeleri` | `kesfet` komutunun tarayacağı kelimeler |
| `fiyat_tabani` | Senin marj tabanın (varsayılan $25) |

Bu dosya gizli bir şey içermez; sürüm kontrolüne girebilir.

---

## 5. Doğrula

```bash
python3 -m munin dogrula
```

Beklenen çıktı:

```
  kimlik dosyasi : /Users/sen/.munin/kimlik.json  ✓ var
  satici        : A1XXXXXXXXXXXX
  pazar         : ATVPDKIKX0DER  (na)
  hedefler.json : ✓ {'sku': 2, ...}
  ✓ Listings API calisti (SKU-001)
✓ Kimlik gecerli, baglanti calisiyor.
```

SKU tanımlı değilse MUNIN **canlı çağrı yapmaz** ve "bağlantı çalışıyor"
demez — denenmemiş bir bağlantıyı çalışıyor ilan etmek, bu programın
yasakladığı şeyin ta kendisi.

---

## 6. İlk koşum

```bash
python3 -m munin iadeler --gun 60 --bekle     # once bunu: dogru teshis
python3 -m munin basari  --gun 30 --bekle     # degisiklik ONCESI olcum
python3 -m munin denetle
```

Rapor uçları asenkrondur; Amazon kuyruğu **1–15 dakika** sürer.
`--bekle` vermezsen komut raporu ister ve kimliğini kaydeder:

```bash
python3 -m munin kelimeler          # ister, hemen doner
# ... 10 dakika sonra ...
python3 -m munin bekleyenler        # toplar ve raporu yazar
```

---

## Veri nereye yazılır

```
MUNIN/
  veri/
    hedefler.json          neyi izliyorum
    anlik/                 tarihli anlık görüntüler — ÜZERİNE YAZILMAZ
      listing/  rakipler/  iadeler/  brand_analytics/  satis_trafik/
    rapor/                 denetim-2026-08-06.md / .json / .html
    hugin/
      gelen/   giden/   alim-defteri.json
    bekleyen-raporlar.json Amazon kuyruğundaki rapor kimlikleri
```

`anlik/` klasörü **hiç silinmemeli** — rakip farkı ve önce/sonra
karşılaştırması tamamen oradan üretilir. MUNIN'in "hafıza" tarafı budur.

Veri klasörünü başka yere almak istersen:

```bash
MUNIN_VERI=~/munin-veri python3 -m munin denetle
```

---

## Sorun giderme

| Belirti | Sebep |
|---|---|
| `Kimlik eksik: ...` | `~/.munin/kimlik.json` yok ya da alan eksik — mesaj hangi alan olduğunu yazar |
| `SP-API HTTP 403` | Uygulamada o rol açık değil (yukarıdaki rol tablosu) |
| `rapor FATAL` | Tarih aralığı dönem sınırına hizalı değil, ya da rol yok |
| `kelimeler` 403 | Brand Registry ya da "Brand Analytics" rolü eksik |
| `LWA access_token dondurmedi` | client_id / secret / refresh_token üçlüsünden biri yanlış |
| `HTTP 429` | Rate limit — MUNIN kendisi geri çekilip tekrar dener, bekle |
| `⚠ GUVENLIK: ... bulut senkronlu` | Kimlik dosyanı `~/.munin/` altına taşı |
