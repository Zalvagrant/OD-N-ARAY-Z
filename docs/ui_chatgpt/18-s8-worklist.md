# 18 — S8 İş Listesi (Amazon Canlı Veri)

**Tarih:** 30 Temmuz 2026
**Dal:** `feature/s8-amazon-live` (S7 ucundan) · worktree `Desktop\ODIN\ODIN-UI-s8`
**Kaynaklar:** `PROMPTLAR.md` §S8 · `15-execution-plan.md` D8.1–D8.8 ·
`13-backend-recommendations.md` §4 · **canlı ODIN ölçümü (aşağıda)**

> ⚠️ **S8 promptu eski bir zemine dayanıyor.** ODIN bugün ölçüldü ve prompt'un
> varsaydığı durum değişmiş. Aşağıdaki tablo iddia değil, çalışan sunucudan
> alınmış ölçümdür — plan ona göre yeniden kuruldu.

---

## 0. ODIN'in BUGÜN gerçekten verdiği (ölçüm)

`python -m odin cockpit 8765` çalıştırıldı. `GET /api/state` → 200, 116 KB,
geçerli UTF-8 (`charset=utf-8`, 30 üst düzey anahtar).

| UI sözleşmesi | `/api/state` karşılığı | Durum |
|---|---|---|
| **`Goal`** | `goals[8]` = `{id, level, label, target, progress_pct}` | ✅ **BİREBİR** |
| `ExecutiveKPI[]` | yok — yalnız ham `sales_snapshot` | adaptör + eksik alanlar |
| `Alert[]` | `risks[3]` = `{name, level, status}` — `requiresAction` yok | eksik |
| `Opportunity[]` | `recommendations[3]` = `{type, text, reason}` — `id`/`asOf`/`suggestedAction` yok | eksik |
| `Decision` | `decision_cards[4]` = `{id, title, type, trust}` — şemanın 8 zorunlu alanının **hiçbiri** yok | çok eksik |
| `DirectorHeartbeat` | `agents` = düz string listesi | çok eksik |
| `AmazonSnapshot` | `sales_snapshot` = `{period, orders 28, units 27, revenue_usd 1970.15, sku_total 48, critical_stock_skus 29, as_of "2026-07-21"}` | kısmi |
| `SkuHealth` | `sku_stats` = **`null`** | yok |
| `PPCOverview` | yok | yok |
| Şirket sağlık skoru | `health_score.score = null`, `coverage "0/6"`, altı finansal bileşenin hepsi "kaynak bağlı değil"; yalnız `operational` 55 (4/4) | **dürüst null** |

### Bu sprintin en önemli bulgusu — VERİ VAR, UÇ NOKTA SERVİS ETMİYOR

`sales_snapshot` **SP-API'den gelmiyor.** `cockpit.py::_executive_extras`
`staging/` içindeki elle girilmiş bir bilgi kaydını (`KO-jarvis-0002`) okuyor;
`as_of` **2026-07-21**, yani dokuz gün eski. `sku_stats` `null`, çünkü eşi
(`KO-jarvis-0001`) pending staging'de değil.

Buna karşılık `odin-data/core/` içinde **bugünün tarihiyle promote edilmiş
gerçek veri** duruyor ve `/api/state` hiçbirini yayınlamıyor:

| Kayıt | İçerik | Pencere |
|---|---|---|
| `KO-spapi-orders-2026-07-30` | 44 sipariş satırı | 7 günlük kayan |
| `KO-spapi-sku_sales-2026-07-30` | 19 satır `{sku, units_sold}` | 7 günlük kayan |
| `KO-spapi-inventory-2026-07-30` | 48 satır `{asin, sellerSku, inventoryDetails{...}}` | `as_of` anlık |
| `KO-ads-ads_report-2026-07-30` | 94 satır `{campaign_id, campaign_name, advertised_sku, impressions, clicks, cost, orders, units, sales7d/14d/30d}` | 2026-07-01→30 |
| `KO-amazon-{sales,traffic,search-terms,catalog}-2026H1` | dönemsel | 2026H1 |

**ACOS/ROAS/harcama bu Ads kaydından hesaplanabilir** — ama ODIN tarafında,
UI'da değil.

---

## 1. Altı karar — MECLİS CEVAPLADI (gavadolar terra + luna, **2/2 oybirliği**)

| # | Soru | Karar |
|---|---|---|
| **S8-Q1** | UI bu veriye nasıl ulaşsın? | **C — ODIN'e projeksiyon uç noktası TALEP EDİLİR.** `odin-data/core/*.json`'ı doğrudan okumak (A) hem mimari (arayüz `IRenderer` adaptörüdür, ODIN'in diskini okumaz) hem governance (ADR-0050/R-006) ihlalidir. Talep gelene kadar `/api/state` dışındaki her şey "kaynak bağlı değil" gösterir |
| **S8-Q2** | "TÜM MOCK VERİYİ KALDIR"? | **C — üretim paketinden çıkar, fixture olarak test/Storybook'ta kalır.** Gerçek modda fail-closed'a güvenmek yetmez; sahte ekran verisi üretim paketinde HİÇ bulunmamalı |
| **S8-Q3** | COGS girişi nereye yazılacak? | **C — ODIN tarafında beyaz listeli `POST /api/command` + kalıcı kanonik kayıt gerekir.** O sözleşme onaylanana kadar UI yalnız "COGS girilmedi" der; arayüzün kalıcı deposu yoktur ve olmamalıdır |
| **S8-Q4** | Net kârı UI hesaplasın mı? | **A — HAYIR, "Data Required" kalır.** UI-ADR-100'ün ilkesi ("istemci hesap yapmaz") kâr için evleviyetle geçerli; yanlış bir kâr rakamı tüm ODIN'in güvenilirliğini bitirir |
| **S8-Q5** | Auth/session? | **B — YAGNI.** Sunucu 127.0.0.1'e bağlı, tek yerel kullanıcı. Yazma komutları açılırsa origin/CSRF + localhost sınırı ayrıca değerlendirilir |
| **S8-Q6** | Dal/worktree? | **Doğru — S7 ucundan ayrı dal (stacked).** Son entegrasyon S7 merge + rebase ve sahip onayından sonra |

---

## 2. S8'in gerçekçi kapsamı

Prompt'un "mock kalkacak, gerçek Amazon verisi gelecek" hedefi bugünkü
`/api/state` ile **karşılanamaz.** Kaynağı olan tek tam sözleşme `Goal`.
Dolayısıyla S8 şu üç işi yapar:

| # | İş | Neden |
|---|---|---|
| **D8.A** | `/api/state` adaptörü — ham yanıtı `DataEnvelope` zarfına sarar, `meta.source="internal"`, `lastUpdated=generated_at`, tazelik istemcide | S7'nin `httpLoad()`'u yazılmıştı ama hiçbir ekran çağırmıyordu; bu onu bağlar |
| **D8.B** | **`Goal` CANLIYA BAĞLANIR** — Mission Control'ün Goal Board'u gerçek ODIN hedeflerini gösterir | Tek birebir eşleşen sözleşme. TUZAK: `progress_pct` nötr 50 = "ölçülmedi" → `null`'a çevrilir, %50 ÇİZİLMEZ (ADR-0132) |
| **D8.C** | `backend-istekleri.md` — kanıtlı, dosya/satır gösteren talep listesi | Prompt §3'ün zorunlu çıktısı; ODIN tarafı R-006'ya bunu alacak |
| **D8.D** | Mock'un üretim paketinden çıkarılması | Meclis Q2=C |

### KAPSAM DIŞI ve nedeni

- COGS ekranı (D8.4) → sözleşmesi yok, meclis Q3=C
- Net kâr motoru (D8.5) → meclis Q4=A, ODIN'in işi
- SP-API/Ads doğrudan bağlantısı (D8.1/D8.2) → veri ODIN'de zaten var; UI'ın
  Amazon'a doğrudan bağlanması mimariyi ters çevirirdi
- Auth (D8.7) → meclis Q5=B
- `universe_id` (D8.8) → `/api/state` evren yayınlamıyor; tek evren, switcher pasif

---

## 3. Teslim edilen (ölçüldü)

| Kapı | Sonuç |
|---|---|
| `/api/state.goals` → Goal Board | **CANLI** — 8 gerçek hedef, `level`e göre gruplu (urgent 2 / weekly 1 / quarterly 5) |
| Ölçülmemiş ilerleme | `—` gösteriliyor; `0` ile karıştırılmıyor |
| TrustSignal | "● canlı · ODIN çekirdeği · az önce" — kaynak `internal`, tazelik istemcide |
| `/odin/api/state` vekili | 200 |
| Gerçek mod üretim derlemesi | başarılı (`build:release` kapısından geçti) |
| Birim testleri | **101/101** (6'sı adaptör; fixture canlı yayından) |
| Storybook | **146/146** |
| `tsc` · eslint | temiz |
| `backend-istekleri.md` | 11 madde, her biri dosya/satır kanıtlı |

Görsel inceleme bir hata çıkardı, test yakalamadı: gerçek moda geçince
Operational Status üç sayacı `0` gösterdi (UI-ADR-118).

---

## 4. AÇIK BLOKAJ — mock verisi üretim paketinde (S9'un ilk işi)

**Şart (gavadolar Q2=C):** "sahte ekran verisi üretim paketinde HİÇ
bulunmamalı."

**Ölçüm** (gerçek mod, `.next` silinip yeniden derlendi):

| Mock dizesi | istemci | sunucu |
|---|---|---|
| "PPC verimliliğini toparla" | 2 dosya | 4 dosya |
| "SKU-1042" | 4 dosya | 8 dosya |
| "Kampanya D ölçeklenebilir" | 1 dosya | 2 dosya |

**Kök neden:** ekranlar mock'ları **doğrudan statik import** ediyor ve
`useMockData(xMock)` çağrılarına veriyor; bu çağrılar `IS_MOCK` dalının
İÇİNDE DEĞİL. Modüller gerçekten erişilebilir olduğu için paketleyicinin
elememesi DOĞRU davranıştır. `IS_MOCK` ölü-kod-elemesine uygun hâle
getirildi (UI-ADR-119) ama tek başına yetmedi — sorun ifade değil, import
grafiği.

**Meclis (yazılımcılar):** teşhis 3/3 onaylandı; `sideEffects:false` veya
paketleyici hilesi işe yaramaz, tek yol import grafiğini kesmek.
Zamanlamada bölündüler — terra "S8 blokajı, şimdi", DeepSeek + Gemini
"koruma yapısal, S9'a borç yaz" (2/3). Borç yazıldı.

**Neden ertelenebilir:** mock'un EKRANA çıkması zaten yapısal olarak
imkânsız (S7 fail-closed, testli) ve mock modda release derlemesi
reddediliyor. Pakette kalan ölü dize bir güvenlik açığı değil, hijyen
borcudur. **Ama onaylanmış bir teslim şartıdır ve kapanana kadar S8
"koşullu" sayılır.**

### Kararlaştırılmış tasarım (S9 doğrudan uygular)

1. `useMockData` **uygulama ekranlarından emekli edilir**; yalnız
   test/Storybook yardımcı katmanında kalır. İki kanca = iki veri yaşam
   döngüsü, iki hata modeli, yeniden sızıntı riski (meclis 3/3).
2. Her bölüm tek boruya geçer:
   `useOdinQuery({ key, module, schema, load: bySource(live, mockLoader) })`
3. `bySource` değer değil **loader** alır; mock tarafı dinamik `import()`
   ile yüklenir → mock modülleri gerçek-mod grafiğine hiç girmez.
4. ODIN'in henüz yayınlamadığı bölümlerde `enabled: IS_MOCK` — gerçek modda
   sorgu hiç çalışmaz; zarf `null`, hata `null`, yükleme `false` olur ve
   bileşenler `NoData` basar. Bu doğru semantiktir: kaynağın olmaması bir
   ARIZA değildir, beş adımlı hata kutusu göstermek yanıltıcı olurdu.
5. Kalıcı kapı: gerçek-mod release çıktısında bilinen fixture dizelerini
   tarayan bir test. Ölçülmeyen şart geri gelir.

**Kapsam:** `mission-control.tsx` 2 bölüm (`directors`, `alerts`) +
`amazon-director.tsx` 5 bölüm (`snapshot`, `skus`, `ppc`, `campaigns`,
`simulations`).

⚠️ 4. maddedeki şemalar için not: `AmazonSnapshot` · `PPCOverview` ·
`SkuHealth` gibi tiplerin kanonik şeması YOK ve UI-ADR-113 gereği
yazılmayacak. Bu bölümlerde doğrulama yerine açıkça "sözleşmesiz" işareti
taşıyan geçirgen bir şema kullanılmalı; sessizce `z.any()` koymak, şemayı
olduğundan güçlü göstermek olurdu.
