# HUGIN → MUNIN köprüsü

**MUNIN'in HUGIN'den istediği tek dosya budur.**

Kod bağlantısı yok. HUGIN hangi dilde yazılmış olursa olsun, bu biçimde
bir CSV üretebiliyorsa köprü çalışır.

---

## 1. MUNIN'in HUGIN'den istediği şey

### Dosya: arama terimi performansı

**En kritik nokta:** MUNIN'in istediği şey **müşterinin gerçekten yazdığı
arama sorgusu** (search term), *senin hedeflediğin keyword* değil.
Amazon Ads'te bu iki ayrı rapordur:

| İstediğim | Amazon Ads'teki adı | `tur` alanı |
|---|---|---|
| ✅ **Bu** | Search Term Report / `spSearchTerm` | `arama_terimi` |
| ⚠ Bu da alınır ama ikinci sınıf | Targeting Report / `spTargeting` | `hedefleme_kelimesi` |

İkisi karıştırılırsa keyword boşluk analizi **tersine döner**: hedeflediğin
kelimeyi "müşteri aradı" sanır. Bu yüzden `tur` alanı zorunlu ve MUNIN
bilmediği bir değeri reddeder.

### Biçim

Düz CSV, UTF-8. **İlk satır bir JSON dönem başlığıdır** ve `#` ile başlar.
İkinci satır sütun adları.

```csv
# {"sozlesme":1,"kaynak":"HUGIN","tur":"arama_terimi","baslangic":"2026-07-01","bitis":"2026-07-31","para":"USD"}
arama_terimi,gosterim,tiklama,harcama,siparis
cat litter mat,12043,187,94.55,11
litter trapping mat xl,3392,61,31.20,4
kedi kumu paspasi,880,9,4.15,0
```

### Zorunlu sütunlar

| Sütun | Tip | Açıklama |
|---|---|---|
| `arama_terimi` | metin | Müşterinin yazdığı sorgu |
| `gosterim` | tam sayı | Impressions |
| `tiklama` | tam sayı | Clicks |
| `harcama` | ondalık | Spend — **para birimi başlıkta** |
| `siparis` | tam sayı | Orders (7 günlük atıf) |

Sütun adları **birebir** eşleşmeli. MUNIN benzer isimli bir sütunu
otomatik eşleştirmez: `arama_term` yazarsan dosya reddedilir. Sebep basit
— yanlış sütundan harcama okumak, "bu kelime bedavaya dönüyor" gibi
tersine bir sonuç üretir ve bu hata sessizdir.

### İsteğe bağlı sütunlar

`satis` · `kampanya` · `eslesme_tipi` · `asin` · `sku` — varsa okunur,
yoksa sorun değil.

### Başlıktaki zorunlu alanlar

| Alan | Neden zorunlu |
|---|---|
| `sozlesme` | Şu an `1`. HUGIN çıktısı değişirse bu numara artar ve MUNIN eski biçimi sessizce yanlış okumaz |
| `kaynak` | `"HUGIN"` |
| `tur` | `arama_terimi` ya da `hedefleme_kelimesi` |
| `baslangic` · `bitis` | `YYYY-AA-GG`. Dönemsiz reklam verisi listing kararını yanlış yöne çevirir |
| `para` | `"USD"` — para birimi olmayan bir sayı, yanlış şeyden çıkarılmayı bekleyen bir sayıdır |

---

## 2. Nasıl alınır

```bash
python3 -m munin hugin-al ~/Desktop/hugin-cikti-temmuz.csv
```

Çıktı bir **alım makbuzu**dur:

```
✓ 412 kelime alindi

  kaynak      : HUGIN (arama_terimi)
  donem       : 2026-07-01 → 2026-07-31 [USD]
  satir       : 415 okundu, 3 cozulemedi
  toplam      : 2841 tiklama · 1204.85 USD · 96 siparis
  icerik hash : 3f8a1c92b7e04d16
  ⚠ 3/415 satir cozulemedi ve HESABA KATILMADI.
```

Makbuz `veri/hugin/alim-defteri.json` dosyasına yazılır ve rapora aynen
basılır.

---

## 3. MUNIN'in yakaladığı bozulmalar

Elle veri alışverişi sessizce bozulur. MUNIN her bozulma yolunu ayrı ayrı
kontrol eder:

| Bozulma | MUNIN ne yapar |
|---|---|
| Aynı dosyayı ikinci kez alırsın | İçerik hash'i tutuluyor → **uyarı**: "bu dosyanın aynısı daha önce alınmış" |
| İki alım arasında gün boşluğu | **Uyarı**: "arada 9 gün veri YOK" |
| İki alım örtüşüyor | **Uyarı**: "örtüşen günler iki kez sayılır" |
| HUGIN sütun adını değiştirdi | **Alım reddedilir** — tahmin yok |
| Çıktı biçimi değişti | `sozlesme` numarası uymuyor → **reddedilir** |
| Sayı biçimi karıştı (`1.234` vs `1,234`) | Belirsizse satır reddedilir ve **makbuzda sayılır** |
| Search term ↔ targeting karıştı | `tur` alanı → **reddedilir** |
| Hiçbir satır çözülemedi | **Alım tamamen reddedilir** — yarım dosya tam gibi rapora girmez |

Sayı çözümü kuralı:

- İki ayraç türü de varsa → sonuncusu ondalık (`1.234,56` = `1,234.56` = 1234.56)
- Tek ayraç + tam 3 hane → binlik (`1.234` = 1234)
- Tek ayraç + 1–2 hane → ondalık (`12,5` = 12.5)
- Başka her durum → **belirsiz, satır reddedilir**

---

## 4. MUNIN → HUGIN yönü

`kelimeler` komutu çalıştığında MUNIN şu dosyayı üretir:

```
veri/hugin/giden/munin-gozlem-2026-07-31.csv
```

```csv
# {"sozlesme":1,"kaynak":"MUNIN","tur":"listing_gozlemi",...,"uyari":"Bu dosya bir AKSIYON LISTESI DEGILDIR..."}
arama_terimi,listingde_geciyor,gectigi_alanlar,ba_rank,munin_notu
cat litter mat xl,hayir,,842,SKU-001 listing'inde hicbir alanda gecmiyor
```

### Bu dosya ne DEĞİLDİR

MUNIN, HUGIN'e **"şu kelimeyi negatife al"** ya da **"buna bütçe aç"**
demez. Negatif ve bütçe kararları MUNIN'in ölçmediği şeylere bağlıdır:
marj, stok durumu, kampanya hedefi, sezon.

MUNIN yalnızca listing tarafındaki **olguyu** bildirir:
*"bu arama terimi senin listing'inde hiçbir alanda geçmiyor."*

Bu olgu iki farklı yöne işaret edebilir ve hangisi olduğunu HUGIN bilir:

- Kelime **dönüşüyorsa** → listing'e eklenmeli (organik trafiği kaçırıyorsun)
- Kelime **dönüşmüyorsa** → belki de alakasız; negatife alınmalı

Kararı HUGIN'in kendi mantığı ve sen verirsiniz.

---

## 5. HUGIN tarafında yapılacak tek iş

HUGIN'in mevcut arama terimi raporunu bu beş sütuna indirip başına tek
satırlık JSON başlığı eklemek. Örnek bir dönüştürücü:

```python
import csv, json

BASLIK = {"sozlesme": 1, "kaynak": "HUGIN", "tur": "arama_terimi",
          "baslangic": "2026-07-01", "bitis": "2026-07-31", "para": "USD"}

with open("munin-icin.csv", "w", encoding="utf-8", newline="") as f:
    f.write("# " + json.dumps(BASLIK) + "\n")
    w = csv.writer(f)
    w.writerow(["arama_terimi", "gosterim", "tiklama", "harcama", "siparis"])
    for satir in hugin_arama_terimleri():          # HUGIN'in kendi fonksiyonu
        w.writerow([satir.search_term, satir.impressions, satir.clicks,
                    f"{satir.spend:.2f}", satir.orders])
```

Bundan fazlası gerekmez. Sözleşme değişirse `sozlesme` numarasını artır —
MUNIN eski biçimi sessizce yanlış okumak yerine reddeder.
