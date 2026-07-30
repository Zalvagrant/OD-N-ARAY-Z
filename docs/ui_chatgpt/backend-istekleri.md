# ODIN'den İstenenler — arayüzün canlıya çıkması için

**Tarih:** 30 Temmuz 2026 · **Kaynak sprint:** S8 (Amazon Canlı Veri)
**Yöntem:** çalışan ODIN cockpit'i ölçüldü (`python -m odin cockpit 8765`,
`GET /api/state` → 200, 116 KB). Aşağıdaki her satır ölçüme dayanır.
**Hazırlayan:** arayüz oturumu. **ODIN reposuna DOKUNULMADI.**

> Bu dosya bir talep listesidir, bir tasarım dayatması değil. ODIN'in kendi
> governance süreci vardır (ADR-0050 / R-006 request registry) ve kanonik
> kaynak ODIN'dir — arayüz, backend'i kendi modelini karşılamaya zorlamaz.
> Aşağıdakiler "arayüz şunu istiyor" değil, **"arayüz şu bilgiyi
> gösteremiyor, çünkü yayınlanmıyor"** biçiminde okunmalıdır.

---

## 0. Tek cümlelik özet

**Veri VAR, uç nokta SERVİS ETMİYOR.** `odin-data/core/` içinde bugünün
tarihiyle promote edilmiş SP-API ve Ads kayıtları duruyor; `/api/state`
bunların hiçbirini yayınlamıyor ve onun yerine `staging/`'deki dokuz gün
eski, elle girilmiş bir bilgi kaydını yayınlıyor.

---

## 1. En öncelikli: promote edilmiş Amazon verisi yayınlanmıyor

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

Promote edilmiş bu kayıtlardan beslenen bir **projeksiyon uç noktası**
(ör. `GET /api/amazon`). Arayüz ham KO dosyalarını okumaz ve okumamalıdır —
`odin-data/` dizinine erişmek hem mimariyi (arayüz `IRenderer` portunun
adaptörüdür, ADR-0080) hem governance'ı çiğner. Meclis bu yolu 2/2
reddetti.

**Zarf beklentisi (pazarlık konusu değil, güven şartı):** her kayıt kendi
`source` · `collection_date`/`fetched_at` · `report_period` bilgisini
taşımalı. Bu üçü olmadan arayüz "bu sayı ne kadar eski" sorusunu
cevaplayamaz ve **veriyi gösteremez** (Trust Signals kuralı).

---

## 2. `ExecutiveKPI` — kanonik metrik yayını yok

Bugün `/api/state` ham alanlar veriyor (`sales_snapshot.orders`,
`revenue_usd` …). Arayüzün FR-0046 v1 sözleşmesi (09b §10) ise
`{id, metricKey, label, value:{status,value,reason}, unit, currencyCode|scale, asOf, source}`
bekliyor.

**Kritik olan `value` zarfıdır:** ölçülemeyen bir metrik `null` + **neden**
taşımalı. `"Data Required"` gibi bir metin sayı alanına giremez (ADR-0135).
ODIN `amazon_director.py`'da bu ayrımı zaten yapıyor ama cockpit'e bağlı
değil.

---

## 3. `Alert` — `requiresAction` yayınlanmıyor

`/api/state.risks` bugün `{name, level, status}` veriyor.
Kanonik `Alert` (09b §10) `requiresAction` (zorunlu, varsayılansız) ·
`id` · `asOf` · `source` istiyor.

**Neden zorunlu:** `requiresAction=false` olan kayıt Alerts listesine
GİRMEZ (06 §1.4). Üretici bunu semantik olarak belirleyemiyorsa kaydı
kanonik Alert olarak yayınlamamalı — arayüz varsayılan atayamaz, çünkü
atadığı an "aksiyon gerekiyor" ya da "gerekmiyor" diye **uydurmuş** olur.

`severity` opsiyoneldir ama **`null` yazılmamalıdır**: belgelenmiş
eşlemesi olmayan üretici alanı atlar.

---

## 4. `Opportunity` — `suggestedAction` yayınlanmıyor

`/api/state.recommendations` bugün `{type, text, reason}` veriyor.
Kanonik `Opportunity` `id` · `source` · `title` · `summary` ·
**`suggestedAction`** · `asOf` istiyor.

Uygulanabilir öneri veremeyen kayıt tanım gereği Opportunity değildir; o
hâlde üreticiye özel çıktısında kalmalıdır.

---

## 5. `Decision` — şemanın zorunlu alanları yayınlanmıyor

`/api/state.decision_cards` bugün `{id, title, type, trust}` veriyor —
bunlar **staging kayıtlarıdır**, karar kaydı değil.

`schemas/decision-record.schema.json` sekiz alanı zorunlu tutuyor
(`date` · `question` · `tier` · `alternatives` (minItems 2) ·
`recommendation` · `human_decision` · `status` …) ve `recommendation`
kendi içinde on alan istiyor (`flip_conditions` · `assumptions` ·
`confidence_breakdown` dahil).

**Kayıp alan uydurulmuş alandan tehlikelidir:** uydurulmuş alan hiç
değilse `NoData` gösterir, kayıp alan sessizdir — sahip o bilgiyi hiç
görmemiş olur. Decision Center (S11) bu yayın olmadan yazılamaz.

---

## 6. `DirectorHeartbeat` — `agents` düz string listesi

`/api/state.agents` bugün `["watcher", "transcript", "analyze", …]`.
Arayüzün canlılık göstergesi `lastBeat` + `beatIntervalMs` istiyor
(`orchestration/health.py` bunları ÜRETİYOR, cockpit yayınlamıyor).

**S8'de somut sonucu:** Mission Control'ün üç Director sayacı artık `—`
gösteriyor. Önceden `0` gösteriyordu ve bu bir ÖLÇÜM iddiasıydı — "0
Director canlı" ile "ölçülmedi" aynı şey değildir (UI-ADR-118).

---

## 7. `SkuHealth` · `PPCOverview` — karşılığı yok

`sku_stats` bugün `null`. PPC için hiçbir alan yok — oysa
`KO-ads-ads_report-2026-07-30` içinde 94 satır kampanya verisi var ve
ACOS/ROAS/harcama **oradan hesaplanabilir** (ODIN tarafında; arayüz
oran hesaplamaz).

`SkuHealth` sözleşmesi hâlâ 🟡 teklif (UI-ADR-104) ve açık sorusu
`buyBoxRate`'in kaynağı/marketplace/dönem/paydası — 13-...md §16.2.

---

## 8. COGS girişi — kalıcı kayıt ve komut sözleşmesi

Amazon COGS vermiyor; sahip girecek. **Arayüzün kalıcı deposu yoktur ve
olmamalıdır** (adaptör). Bu yüzden gereken:

1. `POST /api/command` beyaz listesinde COGS yazımı için bir komut,
2. ODIN tarafında kanonik ve **tarih bazlı** bir maliyet kaydı (maliyet
   değişir; tek bir güncel değer geçmişi bozar),
3. yazımın denetlenebilir olması (kim, ne zaman, hangi değer).

Bu sözleşme onaylanana kadar arayüz yalnız "COGS girilmedi, net kâr
hesaplanamıyor" der. Meclis kararı 2/2.

---

## 9. Net kâr — ODIN'in işi, arayüzün değil

`Net Kâr = Satış − Amazon ücretleri − Reklam − İade − COGS − Nakliye/gümrük`

Kalemlerden **biri bile eksikse net kâr gösterilmez**; yerine "Gross Profit
(ücretler hariç)" ve neyin hariç tutulduğu yazılır (UI-ADR-099).

`amazon_director.py` bu hesabı yapıyor ve yapamayınca `"Data Required"`
diyor — ama cockpit'e bağlı değil. Arayüzün bu hesabı yapması **kabul
edilmedi** (meclis 2/2): yanlış bir kâr rakamı, eksik bir kâr rakamından
tehlikelidir ve tüm ODIN'in güvenilirliğini bitirir.

---

## 10. CORS — istenmedi, arayüz kendi çözdü

Ölçüm: cockpit yanıt başlıkları yalnız `Content-Type` · `Content-Length` ·
`Cache-Control`. `Access-Control-Allow-Origin` **yok**, dolayısıyla
tarayıcıdaki arayüz `127.0.0.1:8765`'e doğrudan gidemiyordu.

**ODIN'den CORS İSTENMİYOR.** Sunucunun 127.0.0.1'e bağlı kalması ve
dışarı açılmaması bilinçli bir güvenlik kararıdır; onu arayüzün rahatlığı
için gevşetmek yanlış olurdu. Arayüz kendi tarafında Next `rewrites()`
vekili kurdu (`/odin/*` → cockpit) — tarayıcı için aynı köken, ODIN için
hâlâ yerel bir istemci. Hiçbir başlık gevşetilmedi (UI-ADR-117).

Bu madde bilgi amaçlıdır; **aksiyon gerektirmez.**

---

## 11. Yayınlanan ve DOĞRU çalışan tek sözleşme

`/api/state.goals` → `{id, level, label, target, progress_pct}`,
arayüzün `Goal` tipiyle **birebir**. S8'de canlıya bağlandı ve Mission
Control'ün Goal Board'u gerçek ODIN hedeflerini gösteriyor.

İki küçük not (talep değil, kayıt):
- `target` tanımsızken **boş string** yayınlanıyor (`goal.get("target","")`),
  `null` değil. Arayüz boş metni `null`'a çeviriyor.
- `progress_pct` tanımsızken `None` — doğru. `goals.py::alignment()`'in
  nötr 50'si BU ALANA ait değil (o, metin-hedef hizası puanıdır ve cockpit
  onu yayınlamıyor). 09b §10'daki tuzak uyarısı iki şeyi karıştırıyordu;
  kaynak okunarak düzeltildi.
