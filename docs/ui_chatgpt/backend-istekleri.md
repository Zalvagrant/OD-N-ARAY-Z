# ODIN'den İstenenler — arayüzün canlıya çıkması için

**Tarih:** 31 Temmuz 2026 · **Kaynak sprint:** S8 (Amazon Canlı Veri)
**Sözleşme temeli:** ODIN **ADR-0143** (dört UI kavramı, sahip onaylı)
**Yöntem:** çalışan ODIN cockpit'i ölçüldü (`python -m odin cockpit 8765`,
`GET /api/state` → 200, 116 KB). Her satır ölçüme dayanır.
**Hazırlayan:** arayüz oturumu. **ODIN reposuna DOKUNULMADI.**

> Bu bir talep listesidir, tasarım dayatması değil. Kanonik kaynak ODIN'dir;
> arayüz backend'i kendi modelini karşılamaya zorlamaz. Maddeler "arayüz
> şunu istiyor" değil, **"arayüz şu bilgiyi gösteremiyor, çünkü
> yayınlanmıyor"** diye okunmalıdır. Süreç: ADR-0050 / R-006.

---

## 0. Tek cümlelik özet

**Veri VAR, uç nokta SERVİS ETMİYOR.** `odin-data/core/` içinde bugünün
tarihiyle promote edilmiş SP-API ve Ads kayıtları duruyor; `/api/state`
bunların hiçbirini yayınlamıyor ve onun yerine `staging/`'deki dokuz gün
eski, elle girilmiş bir bilgi kaydını yayınlıyor.

---

## 1. ✅ KAPANDI — promote edilmiş Amazon verisi yayınlanıyor

**ODIN ADR-0147 / FR-0049 (31 Temmuz 2026).** `GET /api/amazon` canlı:
11 KPI + Director'ın kritik sinyalleri Alert olarak, her sayı kendi kayıt
kimliği ve kendi bildirdiği dönemiyle. Arayüz S10'da bağlandı
(UI-ADR-126). Aşağıdaki ölçüm tarihsel kayıttır.

### Tarihsel — talep edildiği günkü ölçüm

### Ölçüm

`cockpit.py::_executive_extras` (satır 63-102) `sales_snapshot`'ı
**`staging/` klasöründen** üretiyor:

```python
if record.get("id") == "KO-jarvis-0002":
    sales = {**record.get("content", {}), "as_of": ...collection_date}
```

Sonuç: `sales_snapshot.as_of = "2026-07-21"` — **9 gün eski**, kaynağı
SP-API değil elle girilmiş bir bilgi nesnesi. `sku_stats` ise `null`,
çünkü eşi (`KO-jarvis-0001`) pending staging'de değil.

Buna karşılık `odin-data/core/` içinde şunlar duruyor:

| Kayıt | İçerik | Pencere |
|---|---|---|
| `KO-spapi-orders-2026-07-30` | 44 satır sipariş | 7 günlük kayan |
| `KO-spapi-sku_sales-2026-07-30` | 19 satır `{sku, units_sold}` | 7 günlük kayan |
| `KO-spapi-inventory-2026-07-30` | 48 satır `{asin, sellerSku, inventoryDetails{fulfillableQuantity, …}}` | `as_of` anlık |
| `KO-ads-ads_report-2026-07-30` | 94 satır `{campaign_id, campaign_name, advertised_sku, impressions, clicks, cost, orders, units, sales7d/14d/30d}` | 2026-07-01→30 |
| `KO-amazon-{sales,traffic,search-terms,catalog}-2026H1` | dönemsel | 2026H1 |

### İstenen

Promote edilmiş bu kayıtlardan beslenen bir **projeksiyon uç noktası**.
Arayüz ham KO dosyalarını okumaz ve okumamalıdır — `odin-data/` dizinine
erişmek hem mimariyi (arayüz `IRenderer` portunun adaptörüdür, ADR-0080)
hem governance'ı çiğner. Meclis bu yolu 2/2 reddetti (UI-ADR-118).

**Zarf beklentisi (güven şartı):** her kayıt kendi `source` ·
`collection_date`/`fetched_at` · `report_period` bilgisini taşımalı. Bu üçü
olmadan arayüz "bu sayı ne kadar eski" sorusunu cevaplayamaz ve **veriyi
gösteremez** (Trust Signals kuralı).

---

## 2. ✅ KAPANDI (Amazon modülü) — `ExecutiveKPI`

ADR-0147 ADR-0143 §2 zarfını **birebir** yayınlıyor; arayüzün tipi zaten
o zarfın kendisi olduğu için adaptör saf yeniden adlandırmaya indi.
Executive Briefing'in KPI'ları hâlâ mock: onların üreticisi Amazon
Director değil.

### Tarihsel

ADR-0143 KPI sınır zarfını **düz** olarak dondurdu:

```json
{ "id": "net_profit", "label": "Net Profit",
  "status": "available|data_required|unavailable",
  "value": 12345.67, "unit": "currency|percent|count|score",
  "currency": "USD", "scale": "0-100", "reason": null, "as_of": "ISO" }
```

`/api/state` bugün bu zarfı **hiç yayınlamıyor**; ham alanlar veriyor
(`sales_snapshot.orders`, `revenue_usd` …). ADR-0143 "FR-0044'ün S8
uygulaması KPI satırlarını tam olarak §2 zarfında yaymalı" diyor —
**istenen budur.**

Kritik değişmez: `"Data Required"` gibi sunum metni sayısal alana asla
girmez (ADR-0135). Ölçülemeyen metrik `status` + `reason` taşır.
Sparkline/forecast/insight katmanları sözleşmenin PARÇASI DEĞİLDİR ve
istenmiyor — gerçek kaynakları olmadan eklenirlerse kalıcı `null` üretirler.

---

## 3. ✅ KAPANDI (Amazon modülü) — `Alert`

ADR-0147 yayınlıyor ve `requires_action`a varsayılan ATAMIYOR: üreticinin
belirleyemediği bulgu kanonik Alert olarak hiç yayınlanmıyor. Severity
sözlüğü de ortak — sahip 31 Temmuz'da ODIN'inkini kanonik ilan etti.

### Tarihsel

Kanonik zarf:

```json
{ "id": "AL-...", "severity": "critical|risk|warning|info",
  "title": "...", "module": "amazon", "requires_action": true,
  "evidence": ["KO-..."], "created_at": "ISO", "suggested_action": "..." }
```

`/api/state.risks` bugün `{name, level, status}` veriyor — `id` ·
`requires_action` · `module` · `evidence` · `created_at` yok.

**Neden `requires_action` zorunlu:** `false` olan kayıt alert listesine
GİRMEZ; ADR-0143 bunu üretici tarafı sözleşmesi yaptı. Arayüz varsayılan
atayamaz — attığı an "aksiyon gerekiyor/gerekmiyor" diye uydurmuş olur.

**Not:** eski arayüz `severity` kümesi `critical|high|medium|low` idi.
ADR-0143 sözlüğü `critical|risk|warning|info`. **Bu ikisi arasında sessiz
bir eşleme yapılmadı ve yapılmamalı** — anlamları birebir değil (meclis
uyarısı). Arayüz kanonik sözlüğe geçti.

---

## 4. `Opportunity` — ayrı kayıt İSTENMİYOR (ADR-0143 §3)

ADR-0143 Opportunity'yi ayrı bir kayıt olarak **reddetti**: fırsat,
recommendation kayıtlarının olumlu sınıfıdır ve improvement/innovation
hatları onu zaten üretiyor. Arayüzün "Opportunities" bölümü bu kayıtlar
üzerinde bir **görünüm** olur.

**İstenen:** `/api/state.recommendations` bugün `{type, text, reason}`
veriyor. Görünümün filtreleyebilmesi için kayıtta **kayıtlı alanlar**
gerekiyor — en azından kararlı bir `id`, üretici (`source`) ve bir zaman
damgası. Yeni bir kavram değil, var olan kaydın alanları.

---

## 5. Mission Board — izlenen kararlar + vadesi gelen ertelemeler (ADR-0143 §4)

ADR-0143 Mission'ı kavram olarak reddetti; tahtanın kaynağı artık gerçek
kayıtlar: `status: "monitoring"` kararlar, `monitoring_checkpoints`,
`related_goals` ve `lifecycle.due_deferrals()`.

**Ölçüm:** `/api/state` bugün `decisions: []` (boş) ve `due_deferrals: []`
(boş) yayınlıyor; `decision_cards` ise karar kaydı DEĞİL — staging
nesneleri (`{id, title, type, trust}`).

**İstenen:** izlenen kararların ve vadesi gelen ertelemelerin
`schemas/decision-record.schema.json`'a uygun biçimde yayınlanması.
Kayıp alan uydurulmuş alandan tehlikelidir: uydurulmuş alan `NoData`
gösterir, kayıp alan sessizdir.

---

## 6. ✅ KAPANDI — Director sağlığı

**ODIN ADR-0148 / FR-0050 (31 Temmuz 2026).** `/api/state.directors`
canlı: 18 zamanlanmış işin, her işin kendi beyan ettiği agent'a göre
gruplanmış sağlığı — hükmü ODIN veriyor
(`healthy|stale|failed|unknown`). Arayüz S11'de bağlandı (UI-ADR-127).

⚠️ Talebin `AgentHealth` yüzeyi (görev-kuyruğu ajanları) AYRI bir şeydir
ve hâlâ boştur — kuyruk hiç kullanılmadı. İkisi birleştirilmedi.

### Tarihsel

`/api/state.agents` bugün düz string listesi:
`["watcher", "transcript", "analyze", …]`.

Arayüz `orchestration/health.py`'nin ÜRETTİĞİ `verdict`
(`healthy|unhealthy|unknown`) alanını istiyor — kendi canlılık eşiğini
TÜRETMİYOR (UI-ADR-111: eski `beatIntervalMs×3` kuralı UI icadıydı).

**S8'de somut sonucu:** Mission Control'ün üç Director sayacı artık `—`
gösteriyor. Önceden `0` gösteriyordu ve bu bir ÖLÇÜM iddiasıydı — "0
sağlıksız Director" ile "ölçülmedi" aynı şey değildir (UI-ADR-120).

---

## 7. 🟡 KISMEN KAPANDI — `SkuHealth` geldi, iki parçası bilerek gelmedi

**ODIN ADR-0149 / FR-0051 (31 Temmuz 2026).** 48 satırlık per-SKU
projeksiyon canlı; arayüz S12'de bağlandı (UI-ADR-128).

**Bilerek GELMEYEN iki parça:**

1. **`healthScore`** — ODIN'de skorlama politikası yok. Uydurmak
   ADR-0144'ün (Listing) ve ADR-0146'nın (stok bandı) iki kez reddettiği
   şeydi. Sözleşme `null` skoru zaten meşru sayıyor.
2. **`buyBoxRate` + `conversionRate`** — tek kaynakları sahibin katalog
   export'u ve o kayıt `report_period` BEYAN ETMİYOR. Dönemi
   söylenemeyen bir oran yayınlanmıyor. **Bu kod işi değil, veri işi:**
   ya export dönemini beyan etmeli ya da dönemsel bir kaynak gelmeli.

**`PPCOverview` sözleşmesi YAZILMADI** (meclis 2/2): toplam ACOS/ROAS/
harcama zaten KPI, per-SKU reklam zaten `SkuHealth.advertising` içinde.
İkinci bir sözleşme aynı toplamları yeni bir adla tekrarlardı. Kampanya
düzeyi / bütçe pacing gibi yeni bir karar yüzeyi çıkarsa açılır.

### Tarihsel

`sku_stats` bugün `null`. PPC için hiçbir alan yok — oysa
`KO-ads-ads_report-2026-07-30` içinde 94 satır kampanya verisi var ve
ACOS/ROAS/harcama **oradan hesaplanabilir** (ODIN tarafında; arayüz oran
hesaplamaz).

`SkuHealth` sözleşmesi hâlâ 🟡 teklif; açık sorusu `buyBoxRate`'in
kaynağı/marketplace/dönem/paydası — 13-...md §16.2.

---

## 8. COGS girişi — kalıcı kayıt ve komut sözleşmesi

Amazon COGS vermiyor; sahip girecek. **Arayüzün kalıcı deposu yoktur ve
olmamalıdır** (adaptör). Gereken:

1. `POST /api/command` beyaz listesinde COGS yazımı için bir komut,
2. ODIN tarafında kanonik ve **tarih bazlı** maliyet kaydı (maliyet değişir;
   tek bir güncel değer geçmişi bozar),
3. yazımın denetlenebilir olması (kim, ne zaman, hangi değer).

Bu sözleşme onaylanana kadar arayüz yalnız "COGS girilmedi, net kâr
hesaplanamıyor" der. Meclis 2/2.

---

## 9. ✅ KAPANDI — net kâr yayınlanıyor

**ODIN ADR-0147 (31 Temmuz 2026).** `realized_net_profit` KPI olarak
canlı: **$653,36**, kendi kaynağı ve dönemiyle. Kural korundu —
hesaplanamadığında sayı UYDURULMUYOR, `data_required` + gerekçe
geliyor.

⚠️ İleriye dönük net kâr (Amazon ücretleri dahil) hâlâ eksik; girdisi
FR-0041 SP-API Finances adaptörü.

### Tarihsel

`Net Kâr = Satış − Amazon ücretleri − Reklam − İade − COGS − Nakliye/gümrük`

Kalemlerden **biri bile eksikse net kâr gösterilmez**; yerine "Gross Profit
(ücretler hariç)" ve neyin hariç tutulduğu yazılır (UI-ADR-116).

`amazon_director.py` bu hesabı yapıyor ve yapamayınca `"Data Required"`
diyor — ama cockpit'e bağlı değil. Arayüzün bu hesabı yapması **kabul
edilmedi** (meclis 2/2): yanlış bir kâr rakamı, eksik bir kâr rakamından
tehlikelidir.

---

## 10. CORS — istenmedi; vekilin sınırı ise açık bir borç

Ölçüm: cockpit yanıt başlıkları yalnız `Content-Type` · `Content-Length` ·
`Cache-Control`. `Access-Control-Allow-Origin` **yok**.

**ODIN'den CORS İSTENMİYOR.** Sunucunun 127.0.0.1'e bağlı kalması bilinçli
bir güvenlik kararıdır. Arayüz kendi tarafında Next `rewrites()` vekili
kurdu (`/odin/api/*` → cockpit) — tarayıcı için aynı köken, ODIN için hâlâ
yerel bir istemci. Hiçbir başlık gevşetilmedi (UI-ADR-119).

⚠️ **Ama vekil bir güvenlik sınırı değildir** (meclis uyarısı): `/odin/api/*`
tarayıcıya açık bir yoldur ve `127.0.0.1` yalnız Next sürecinin kendi
makinesini gösterir. Bugün kabul edilebilir çünkü Next de yalnız yerelde
çalışıyor. **ODIN dışarı açılırsa ya da uygulama dağıtılırsa vekilin önüne
yetkilendirme konulmalıdır.** Yol `/odin/api/*` ile daraltıldı; genel geçit
bilerek yazılmadı.

Bu madde ODIN'den aksiyon İSTEMEZ; arayüz tarafındaki borcu kayda geçirir.

---

## 11. Yayınlanan ve doğru çalışan: `goals`

`/api/state.goals` → `{id, level, label, target, progress_pct}` (ODIN
ADR-0034 Goal Engine v1, sahibin `odin-data/goals.json`'ı). ÖLÇÜLDÜ: 8
gerçek hedef geliyor (urgent 2 · weekly 1 · quarterly 5).

⚠️ **Bu veri bugün arayüzde GÖSTERİLMİYOR.** ADR-0143 §4 "Mission"ı
reddetti ve Mission Board'u izlenen-kararlar görünümüne çevirdi; `Goal`
ise ODIN'in ayrı ve gerçek bir varlığıdır. Meclis (gavadolar 2/2) ikisinin
aynı şey OLMADIĞINI, ama Goal'ün arayüzde nereye konacağının **ayrı bir
sahip kapsam kararı** gerektirdiğini söyledi. Karar verilene kadar bağlantı
kurulmadı — kaynağı olan bir veriyi göstermemek, kapsamı onaylanmamış bir
bölüm eklemekten iyidir.

İki teknik not (talep değil, kayıt):
- `target` tanımsızken **boş string** yayınlanıyor (`goal.get("target","")`),
  `null` değil.
- `progress_pct` tanımsızken `None` — doğru. `goals.py::alignment()`'in
  nötr 50'si BU ALANA ait değil (o, metin-hedef hizası puanıdır ve cockpit
  onu yayınlamıyor). 09b §10'daki tuzak uyarısı iki şeyi karıştırıyordu;
  kaynak okunarak düzeltildi.

---

## 12. ❌ REDDEDİLDİ — `meta.universeId`

**ODIN ADR-0155 / FR-0056 (31 Temmuz 2026, meclis 2/2).** Ölçüldü:
"universe" kelimesi ODIN'in **hiçbir yerinde geçmiyor** — kodda 0,
registry'de 0, 154 ADR'de 0. Karşılığı olmayan bir kavram yayınlanmaz.

Sabit bir değer yayınlamak **uydurma bir ayrım** olurdu ve ilk aldığı şey
"bu sınır uygulanıyor" yanılgısıdır. Gerçek bir evren modeli ise tek
sahipli tek işletme için çözdüğünden fazla sorun yaratır.

**Alttaki soru zaten daha iyi cevaplanıyor:** her KPI/Alert/SKU kendi
`source` (kayıt kimliği), `asOf` ve `reportPeriod` alanlarını taşıyor.
Yanıt seviyesinde bir etiket "doğru evren" der ama hangi kayıt, ne zaman,
hangi pencere sorularının hiçbirini cevaplamaz.

Arayüz `universeId` doğrulamasını v1'den çıkardı; evren anahtarlayıcısı
bugün fiilen ne ise o kalıyor — bir gezinme öğesi.

### Tarihsel

**S7'den devredilen borç** (meclis bulgusu; bu listeyi ADR-0143'e göre
yeniden yazarken bir tur düşmüş, geri kondu).

Arayüz önbellek anahtarını `[DATA_MODE, universeId, ...]` diye kuruyor;
bu **istemci tarafını** korur — bir evrenin verisi diğerinin ekranında
görünmez. Ama yanlış evrenin verisini DÖNDÜREN bir sunucuyu yakalamaz:
istek doğru evren için gitti, yanıt başka evrenin verisiyle geldiyse
arayüzün elinde bunu anlayacak hiçbir alan yok.

**İstenen:** zarfın `meta`sında `universeId`. Arayüz onu istediğiyle
karşılaştırır ve tutmuyorsa sözleşme hatası basar — sessizce göstermez.

Bu, "kayıp alan uydurulmuş alandan tehlikelidir" kuralının tam örneğidir:
alan yok olduğu için doğrulama da yok, ve yanlış evrenin sayısı doğru
evrenin sayısından ayırt edilemez.

---

## Arayüz tarafında kalan borçlar (ODIN'den aksiyon İSTEMEZ)

Kayıt için; bu maddeler backend'e sorulmuyor.

- **`OdinSectionBoundary` kalıbı** (S7 borcu, meclis önerisi): bugün her
  `Section`'a hata elle bağlanıyor. Yeni bir bölüm eklenirken unutulursa
  S7'de görülen "sessiz boş bölüm" hatası geri döner. Sarmalayıcı kalıp
  bunu yapısal olarak kapatır.
- **Beş bölüm hâlâ mock kancasında** — `AmazonSnapshot` · `PPCOverview` ·
  `CampaignIntelligence` · `SimulationCase` · `SkuHealth`. Sebep
  UI-ADR-113: doğrulanmış sözleşmeleri yok. §7 ve §2 kapanınca üçer
  satırla yeni boruya taşınırlar. Sessiz borç DEĞİL: gerçek modda
  kendiliğinden "veri yok" durumuna düşerler.
- **Vekilin önünde yetkilendirme yok** — §10'da açıklandı; dağıtım hâlinde
  gerekir.

**S7 borcu #3 KAPANDI:** "gerçek modda `ODIN_BASE_URL` 127.0.0.1'e düşüyor,
tarayıcıda bu KULLANICININ makinesidir." Artık tarayıcı 127.0.0.1'i hiç
görmüyor — aynı kökende `/odin` yolunu kullanıyor; mutlak adres yalnız
sunucu tarafında ve `NEXT_PUBLIC_` olmayan `ODIN_ORIGIN`'den geliyor
(UI-ADR-119).

---

## 13. ✅ KAPANDI — `report_period` artık okunuyor

**UI-ADR-140 (31 Temmuz 2026).** `ExecutiveKPI.reportPeriod` sözleşmeye
eklendi ve her KPI kartı kendi penceresini kompakt gösteriyor:
"son 7 gün · 30 Tem'e kadar", "anlık". Pencere normalleştirilmiyor,
beyan yoksa `null`.

### Tarihsel

ODIN ADR-0147, ADR-0143'ün dondurduğu zarfa bir **genişletme** ekledi: her
KPI kendi kaydının bildirdiği `report_period`'u taşıyor. Pencereler
gerçekten farklı — siparişler 7 günlük kayan, envanter anlık, Ads raporu
2026-07-01→30.

Arayüz bugün yalnız `asOf`u okuyor; yaş sorusu cevaplanıyor ama **pencere
sorusu cevaplanmıyor**. "38 adet satıldı" ile "hangi 38 gün" ayrı
bilgilerdir ve ikincisi ekranda yok.

**Bu bir ODIN talebi DEĞİL** — yayın zaten var. Arayüz tarafında bir
sözleşme genişletmesi ve kendi kararını hak ediyor.

---

## 14. Amazon eşik politikası — arayüz iki sayı UYDURUYOR

**Durum:** 🔴 Açık talep · UI-ADR-130 ile görünür hâle getirildi

Arayüz iki eşiği kendi kafasından uyguluyor. İkisi de bir İŞ
POLİTİKASIDIR ve sahibi ODIN olmalıdır:

| Eşik | Bugünkü değer | Nerede kullanılıyor |
|---|---|---|
| Amazon genel sağlık skorunun "iyi" sınırı | `>= 80` | Executive Glance meter tonu |
| BuyBox oranının "kaybediliyor" sınırı | `< 90` | BuyBox bölümünün tamamı |

Bunlar `src/features/amazon/presentation/thresholds.ts` içinde TEK yerde
toplandı ve `ThresholdProvenance = "unapproved_default"` ile
işaretlendiler; BuyBox bölümü artık ekranda `ThresholdNote` basıyor
(ODIN ADR-0146 / UI-ADR-126 deseni).

**Neden arayüzde bir "domain katmanına" taşınıp kapatılmadı** (gavadolar
2/2): eşiği JSX'ten alıp `domain/` klasörüne koymak onu temizlemez,
MEŞRULAŞTIRIR — uydurulmuş bir politika resmî bir katman adı kazanır.
Doğru kapanış ODIN'in yayınlamasıdır.

### İstenen

ODIN `/api/amazon` yükünde şu alanlardan birini yayınlarsa arayüz eşiği
tamamen bırakır:

- `health.tone` (ya da `health.status`) — skoru ODIN yorumlasın,
- `sales.buy_box_target_percent` — sınırı ODIN beyan etsin,
  veya doğrudan `sales.buy_box_at_risk: bool`.

`threshold_provenance` alanı zaten var ve `owner_policy` değerini
aldığında arayüzdeki uyarı notu kendiliğinden kaybolur — kod değişikliği
gerekmez.

### Kapanınca

`src/features/amazon/presentation/thresholds.ts` **silinir**. Dosyanın
başlığı bunu zaten yazıyor: "bu dosyadaki her sayı bir borçtur".


---

## `sales_change_pct` olcek beyani YANLIS - 100 kat hata (1 Agu 2026)

**Aciliyet: yuksek.** Ekranda gorunuyordu, sayi makul degil ama makul
GORUNUYOR - yani sessiz degil, YANILTICI.

### Olculen celiski

`odin/amazon_director.py:541` yuzdeyi **0-100** olcedinde uretiyor:

```python
pct = round((recent - prior) / prior * 100, 1) if prior > 0 else None
```

`odin/amazon_api.py:133-134` ayni degeri **`scale="0-1"`** diye beyan ediyor:

```python
kpi("sales_change_pct", "Satis degisimi", trend.get("pct_change"),
    "percent", scale="0-1", ...)
```

### Sonuc

Arayuz beyana guveniyor (UI-ADR-093: "olcegi tahmin etme, bildirilsin"),
`percentFactor("0-1") = 1` doner ve deger olduğu gibi `Intl`in
`style:"percent"` bicimlendiricisine giriyor - o da 100 ile carpiyor.

**Satis %12,5 dustuyse KPI kartinda "-%1.250,0" yaziyordu.**

Ayni listedeki `acos` GERCEKTEN 0-1 orani (`avg_acos = spend / sales`) ve
dogru beyan edilmis. Yani ayni sozlesmeden gelen iki yuzde, biri dogru biri
yanlis - bu, hatayi gozle yakalamayi da zorlastiriyor.

### Talep

`amazon_api.py:134`te **`scale="0-100"`**. Alternatif olarak
`amazon_director.py:541`de `* 100` kaldirilip deger 0-1 olarak uretilebilir;
hangisi ODIN'in kanonik tercihiyse. Arayuz ikisini de dogru cizer - tek
istedigi BEYANIN DEGERLE UYUSMASI.

### Arayuz tarafinda ne yapildi

`executiveKpiSchema`ya savunma kapisi kondu (UI-ADR-155):
`scale="0-1"` beyaniyla gelen bir degerin mutlak degeri **1,5**'i asamaz
(%150 bir oran degil, olcek hatasidir). Celiski halinde sayi basilmaz,
sozlesme hatasi verilir.

Yani bu duzeltilene kadar `sales_change_pct` ekranda **"Veri
dogrulanamadi"** olarak gorunecek. Bu bilincli: yanlis bir yuzde, eksik bir
yuzdeden tehlikelidir.

---

## Gece mesaisi taraması — 2 Ağu 2026: kalan nav hedeflerinin veri kaynağı ölçümü

Gece emri gereği her boş hedef için ÖNCE ölçüldü: core'da gerçek kaynak
var mı? VARSA ekran bağlandı (finance · amazon/inventory · amazon/ppc ·
system/performance bu gece açıldı). YOKSA ekran uydurulmadı — placeholder
kaldı ve gerekçesi burada. Kaynak yayınlandığı gün ekran bağlanır.

| Hedef | Tek satır gerekçe (ölçüm 2 Ağu 2026) |
|---|---|
| `/amazon/orders` | ✅ AÇILDI (UI-ADR-202). İDDİA ÇÜRÜDÜ: core/'da 7 adet `KO-spapi-orders-*` var (en yenisi 49 sipariş). Kayıt vardı, uç yoktu — `GET /api/orders` eklendi. |
| `/amazon/listings` | Listing verisi hiçbir uçta yayınlanmıyor (FR-0005 Listing işi sırada, Faz 4 notu). |
| `/amazon/profit` | SKU bazlı gerçek kâr COGS ister; COGS kapsamı SAHİP KARARI bekliyor (math-audit) — `PROFIT_NEEDS_COGS` zaten UI'da. |
| `/amazon/forecast` | Tahmin üreticisi yok (ADR-0149 stockout tahmini dahil 48/48 null; `probabilistic_forecast` finance'ta da "bağlı değil"). |
| `/amazon/suppliers` | Tedarikçi verisi hiçbir uçta yok (goals'ta metin olarak geçiyor, yapılandırılmış kaynak değil). |
| `/amazon/returns` | İade verisi yayınlanmıyor (Return Intelligence çeyreklik hedef, henüz inşa edilmedi). |
| `/system/security` | `health_score` Güvenlik bileşeni `value:null` — "güvenlik telemetrisi yayınlanmıyor" (çekirdeğin kendi beyanı). |
| `/system/ai-runtime` | `ai_spend.total_usd=null`, 12/12 çağrı `cost_known:false` — maliyet paneli kural 2 ihlali olur; meclis kararı S9 sonraya (15-execution-plan). |
| `/system/storage` | ✅ AÇILDI (UI-ADR-200). Ölçüm eksikti: iki ekran "ne kadar dolu"yu, bu ekran "hangi dizin ne hızla büyüyor"u cevaplıyor. Core'a `odin/storage.py` + `GET /api/storage` eklendi. |
| `/system/network` | Ağ telemetrisi hiçbir uçta yok. |
| `/system/backups` | Yedek kaydı/politikası yayınlanmıyor (`archive/` klasörü var ama projeksiyonu yok). |
| `/system/version` | `version` + `phases` /system ekranında ZATEN görünüyor; ayrı sayfa kopya olur. |
| `/hq` | Ayrı bir veri kaynağı yok — mevcut ekranların toplamı; kompozit ekran sahip kararı ister. |
| `/projects` | Proje varlığı core'da yok (phases roadmap'i /system'de). |
| `/automation` | Zamanlanmış işler `directors` yayınından /system/performance'ta AÇILDI; ayrı automation ekranı aynı verinin kopyası olur. |
| `/trading` | Trading verisi core'da hiç yok. |
| `/memory` | ✅ AÇILDI (UI-ADR-201). "Zaten /decisions'ta" yanlıştı: /decisions ŞU AN açık olanı (31), hafıza BUGÜNE KADARKİ her şeyi (2.335) gösterir. Core'a `lifecycle.projection()` + `GET /api/memory` eklendi. |
| `/settings` | Yazılabilir ayar ucu yok (POST /api/command beyaz listesi dışında yapılandırma yüzeyi yayınlanmıyor). |
