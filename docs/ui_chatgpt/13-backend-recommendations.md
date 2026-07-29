# 13 — Backend Recommendations

**Durum:** 🟡 ÖNERİ — hiçbiri mevcut ODIN backend'i ile doğrulanmadı
**Kaynak:** dosya_3 (Memory, Universe), dosya_7 (AI Gateway, Project Intelligence), + arayüz kararlarından türetilenler

⚠️ Bu dosyadaki hiçbir madde mevcut ODIN mimarisini değiştirme talebi
değildir. Bunlar, tanımlanan arayüzün **çalışabilmesi için** backend'de
karşılığı olması gereken şeylerin listesidir.

---

## 1. AI Gateway (Model Router) ⭐ EN ÖNCELİKLİ

Bu, sohbetin en pratik ve en yüksek getirili teknik kararıdır.

### Neden gerekli

ODIN'in tüm AI özellikleri tek bir modele giderse maliyet kontrolsüz büyür ve
tek sağlayıcıya bağımlılık oluşur.

### Router mantığı

Her AI isteği şu kapıdan geçer:

```
İstek gelir
  ↓
1. Bu iş gerçekten AI gerektiriyor mu?
     Hayır → deterministik kod ile çöz, dön
  ↓
2. İş tipi nedir?
     Küçük  → yerel / küçük model
     Orta   → orta model
     Büyük  → büyük model
  ↓
3. Önbellekte var mı? (aynı soru, aynı veri)
     Evet → cache'ten dön
  ↓
4. Modeli çağır
  ↓
5. Sonucu logla: model, token, süre, maliyet
```

### İş tipi kademelendirmesi

| Kademe | Örnek işler | Model |
|---|---|---|
| **Küçük** | Hatırlatma, dosya sınıflandırma, etiketleme, basit özet | Yerel / küçük |
| **Orta** | E-posta yazma, rapor özetleme, tek modül analizi | Orta |
| **Büyük** | Tüm Amazon hesabı analizi, strateji üretimi, finans tahmini, Council Debate | Büyük |

### Sağlayıcı stratejisi

| Sağlayıcı | Kullanım |
|---|---|
| Yerel model | Basit, sık tekrarlanan işler — 0 maliyet |
| OpenAI | Karmaşık analizler |
| Claude | Kod üretimi, büyük doküman işleme |
| Diğer | İhtiyaca göre |

### Zorunlu telemetri

Router her çağrıyı kaydeder: `model` · `tokenIn` · `tokenOut` · `latencyMs`
· `cost` · `module` · `cacheHit`

Bu veri System Director'da gösterilir ve maliyet optimizasyonunun temelidir.

### Maliyet gerçeği (kullanıcıya net cevap)

| Aktivite | Token |
|---|---|
| Dashboard açmak | 0 |
| Amazon siparişlerini görüntülemek | 0 |
| Finans tablosu incelemek | 0 |
| Grafik, rapor, senkronizasyon | 0 |
| AI'a soru sormak | Token harcar |
| Analiz istemek | Token harcar |

ODIN çalışırken sürekli token yemez. **Yalnızca AI düşündüğünde** harcar.
Yüksek limitli plan **geliştirme döneminde** işe yarar (Claude Code büyük
dosyalarla çalışır); günlük kullanımda zorunlu değildir.

---

## 2. Multi-Tenancy / Universe Katmanı

`01-product-vision.md` §13'teki Executive Universe kararının backend
karşılığı.

**Gereklilik:** Tüm veri modelinin bir `universe_id` boyutu taşıması.

```
universes
  ├── id, name, type (business | personal | trading | holding)
  ├── data_sources[]
  └── active_directors[]

her tablo → universe_id (indeksli, zorunlu)
```

⚠️ **DOĞRULANMADI:** Mevcut ODIN'de bu var mı? Yoksa, **şimdi eklenmesi
sonradan eklenmesinden 10 kat ucuzdur.** Multi-tenancy, retrofit edilmesi en
pahalı özelliklerden biridir.

### Cross Universe Intelligence

Evrenler arası olay akışı gerekir:

```
Trading Universe: kâr olayı
  → Event Bus
  → Finance Universe: nakit akışı güncelleme önerisi
  → Decision Engine: yeni karar teklifi oluştur
```

Bu, bir **event bus** ve **kural motoru** gerektirir.

---

## 3. Üç Katmanlı Hafıza

`07-ai-directors.md` §9'un backend karşılığı.

| Katman | Saklama | Erişim hızı |
|---|---|---|
| Short-Term | Oturum / cache | Anında |
| Working | Veritabanı, son N hafta | Hızlı |
| Long-Term Executive | Kalıcı, vektör indeksli | Semantik arama |

**En kritik bileşen: Memory Classifier**

Her yeni bilgi bir sınıflandırmadan geçer:

```
Geçici mi? → at
Kalıcı mı? → Working Memory
Stratejik mi? → Long-Term Executive Memory
Arşivlik mi? → Archive
```

Bu sınıflandırıcı olmadan Long-Term Memory çöplüğe döner ve `07-...` §9'daki
"otomatik büyümez" kuralı ihlal edilir.

---

## 4. Amazon Veri Katmanı

### Mevcut durum
⚠️ SP-API bağlantısı olduğu biliniyor (Marketplace Participations, Orders,
FBA Inventory, Sales & Traffic raporu).

### Eksikler

| Gereksinim | Durum |
|---|---|
| **Ads API** | ⚠️ Bağlı mı? PPC Intelligence bunsuz çalışmaz |
| **Finance / Fees** | ⚠️ Net kâr için zorunlu |
| **COGS** | ❌ Amazon'da yok — kullanıcı girmeli |
| **Buy Box oranı** | ⚠️ Kaynağı belirsiz |
| **Returns** | ⚠️ |
| **Storage fees** | ⚠️ |

### Net Kâr Hesabı — en riskli nokta

`09-data-contracts.md` §8'de `netProfit` alanı var. Ama:

```
Net Kâr = Satış
        − Amazon ücretleri (referral, FBA, storage)
        − Reklam harcaması (Ads API)
        − İade maliyeti
        − COGS (kullanıcı girişi)
        − Nakliye / gümrük
```

Bu kalemlerden biri eksikse gösterilen net kâr **yanlıştır.** Yanlış bir kâr
rakamı, tüm ODIN'in güvenilirliğini bitirir.

**Öneri:** Net kâr hesaplanamıyorsa gösterilmez. Yerine "Gross Profit
(ücretler hariç)" gösterilir ve neyin hariç olduğu açıkça yazılır. Trust
Signals kuralı burada en katı şekilde uygulanır.

---

## 5. Decision Engine — kalıcı saklama

`06-workspaces.md` §2'deki Decision Center bir arayüz değil, bir **motor**
gerektirir.

Gerekenler:

- `decisions` tablosu — Executive Decision DNA'nın 12 alanı
- `decision_events` — timeline
- `decision_relationships` — kararlar arası etki grafiği
- `decision_scores` — tamamlanan kararın puanı
- `director_opinions` — council kayıtları
- `evidence` — kanıt referansları, kalıcı

**Kritik:** `actualROI` ve `lessonsLearned` alanları, karar tamamlandıktan
**sonra** doldurulur. Bu, bir arka plan işi gerektirir: karar uygulandıktan N
gün sonra gerçek sonucu ölç ve geri yaz.

Bu iş yapılmazsa Executive Decision Score hiçbir zaman dolmaz ve ODIN'in
"öğrenen sistem" iddiası boşa çıkar.

---

## 6. Tahmin / Simülasyon Motoru

`06-workspaces.md` §1.5 Executive Simulator ve KPI `forecast` alanı bunu
gerektirir.

⚠️ **Mevcut ODIN'de karşılığı yok.** Bu bağımsız bir çalışmadır.

Minimum uygulanabilir yaklaşım:

1. **Faz 1 — İstatistiksel:** Trend ekstrapolasyonu + mevsimsellik. Basit,
   açıklanabilir, hızlı.
2. **Faz 2 — Kural tabanlı:** "PPC %15 artarsa satış ~%9 artar" gibi geçmiş
   veriden çıkarılmış elastikiyet katsayıları.
3. **Faz 3 — Model:** Gerçek tahmin modeli.

**Zorunlu:** Her simülasyon sonucu `assumptions[]` döndürür. Varsayımları
gösterilmeyen simülasyon, Explainability sözleşmesini ihlal eder.

---

## 7. Telemetri ve Gözlemlenebilirlik

Arayüzde 13 telemetri kanalı ve 7 AI Pulse kanalı tanımlandı. Bunların
karşılığı olmalıdır:

| Kanal grubu | Kaynak |
|---|---|
| Background Jobs, Scheduler, Event Queue | Job runner |
| API Trafiği | Gateway metrikleri |
| Memory Indexing, Knowledge Sync | Memory servisi |
| AI Queue, Agent Bus | AI Orchestrator |
| Reasoning/Planning/Learning/... | AI Orchestrator (7 kanal) |

**Kural:** Karşılığı olmayan kanal `available: false` döner ve arayüzde
**gösterilmez.** Sahte telemetri, "Fake Dashboard" yasağının ihlalidir.

---

## 8. Director Heartbeat Servisi

Her Director için periyodik durum yayını gerekir:

```
GET /api/directors/heartbeat
→ DirectorHeartbeat[]  (bkz. 09-data-contracts.md §4)
```

Gerçek zamanlı olması tercih edilir (WebSocket / SSE). Polling kullanılacaksa
`beatIntervalMs` ile senkron olmalıdır.

**Anti-fake:** `lastBeat` eskiyse Director `offline` olur. Backend
"her zaman canlı" numarası yapmaz.

---

## 9. Confidence Score Üretimi ⚠️

`02-design-principles.md` §1'de "Confidence Everywhere" kuralı var. Bu, her
önemli bilginin bir güven skoru taşıması demek.

**Kritik soru:** Bu skorlar nereden geliyor?

| Kaynak | Meşru mu |
|---|---|
| Model logprob / self-reported confidence | 🟡 Kalibre edilmeli |
| Kanıt sayısı ve kalitesi | ✅ |
| Geçmiş tahmin doğruluğu | ✅ En güçlüsü |
| Director'lar arası consensus | ✅ |
| Rastgele / sabit sayı | ❌ **Kesinlikle hayır** |

**Uyarı:** Kullanıcı bir kez sahte bir güven skoru fark ederse hiçbir skora
bir daha güvenmez. Skor üretilemiyorsa **gösterilmez.**

`DecisionScore.aiPredictionAccuracy` alanı tam da bu kalibrasyon için vardır:
zamanla AI'ın kendi güven skorlarının ne kadar doğru olduğunu ölçer.

---

## 10. Event Bus

Birçok özellik olay tabanlıdır:

- Cross Universe Intelligence
- Executive Timeline
- Decision lifecycle geçişleri
- Alert üretimi
- Knowledge güncellemeleri

Merkezi bir event bus olmadan bunların hepsi ayrı ayrı polling ile yazılır ve
sistem dağılır.

---

## 11. ODIN Project Intelligence 🟡

Sohbetin en iddialı önerisi: ODIN'in kendi geliştirme sürecini yönetmesi.

Otomatik olarak:
- Yapılacak işleri analiz eder
- Eksik dokümanları bulur
- Kod tekrarlarını raporlar
- Kullanılmayan bileşenleri listeler
- Eski bağımlılıkları tespit eder
- Mimari ihlalleri gösterir
- Teknik borç puanı üretir
- Sprint ilerlemesini hesaplar
- Sonraki önerilen işi belirler

**Değerlendirme:** Fikir güçlü ama **v1.0 kapsamında değildir.** ODIN henüz
çalışan bir arayüze sahip değilken kendi kendini denetleyen bir modül yazmak,
tam olarak `08-decision-log.md` UI-ADR-063'te eleştirilen kapsam büyütmesidir.

🟡 **Öneri:** v2.0 backlog'una alınsın. v1.0'da yerine basit bir CI kontrolü
yeterlidir (lint + type check + test + token compliance).

---

## 12. Öncelik Sırası

Backend tarafında yapılacak işlerin sırası:

| # | İş | Neden bu sırada |
|---|---|---|
| 1 | Mevcut API envanteri çıkar | Neyin var olduğunu bilmeden plan yapılamaz |
| 2 | `09-data-contracts.md` ile eşle | Boşluklar görünür olur |
| 3 | Universe / multi-tenancy kararı | Sonradan eklemek 10 kat pahalı |
| 4 | AI Gateway | Maliyet kontrolü, hemen getiri |
| 5 | Director Heartbeat servisi | Arayüzün en görünür parçası |
| 6 | Decision Engine kalıcı saklama | Ürünün çekirdeği |
| 7 | Ads API + fee/COGS → net kâr | En yüksek iş değeri |
| 8 | Event Bus | Gerçek zamanlılık |
| 9 | Memory Classifier | Uzun vadeli sağlık |
| 10 | Tahmin motoru | En son — diğerleri olmadan anlamsız |

---

## 13. S4'ten çıkan sorular (Executive Components)

Bileşenler yazılırken sözleşmede karşılığı bulunamayan üç nokta. CLAUDE.md §7
gereği kendi başımıza veri modeli değiştirmedik — **sorular burada.**

### 13.1 `Decision.recommendation` alanı yok

`05-dashboard.md` §3.2 karar kartında bir `Recommendation` satırı istiyor.
`09-data-contracts.md` §2 `Decision` sözleşmesinde böyle bir alan yok;
`alternatives` ve `directorOpinions` var ama bunların hiçbiri "kurulun nihai
önerisi" değil.

**Şimdilik yapılan:** `Decision.recommendation?: AIRecommendation` olarak
**opsiyonel** eklendi. Gelirse gösterilir, gelmezse satır hiç çizilmez.
Uydurma yapılmıyor.

**Soru:** Decision Engine kurul sonunda tek bir `AIRecommendation` üretiyor mu?
Üretmiyorsa kararın "önerisi" nedir — en yüksek destekli alternatif mi?
Bu bir türetme olurdu ve arayüz türetme yapmamalı.

### 13.2 Yüzde birimi ölçeği tanımsız

`ExecutiveKPI.unit: "percent"` ve `trend.changePercent` için ölçek yazılmamış.
ACOS 18,1 mi gelir, 0,181 mi?

**Yapılan (UI-ADR-093, gavadolar danışıldı):** Varsayım **kaldırıldı.**
`unit === "percent"` ise `scale: "0-1" | "0-100"` alanı **zorunludur.**
Gelmezse değer render edilmez. Arayüz veriyi tamir etmez, tahmin etmez.

**Backend'den istenen:** `ExecutiveKPI` üretirken `scale` alanını doldurun.
Doldurulmadığı sürece yüzde KPI'ları arayüzde boş görünür — bu bilinçlidir.

### 13.3 Confidence eşikleri UI kararı

`ConfidenceBadge` renk eşikleri (≥80 yüksek, ≥50 orta, <50 düşük) dokümanda
yok; `07-ai-directors.md` §11 yalnızca "yüksek → yeşil, düşük → amber" diyor.

**Şimdilik yapılan:** Eşikler `confidence-badge.tsx` içinde tek yerde sabit
(`CONFIDENCE_HIGH` / `CONFIDENCE_LOW`) ve dışa açık.

**Soru:** Confidence Engine'in kalibrasyonu biliniyor mu? Model %70'te
gerçekten %70 haklı çıkıyorsa eşikler böyle kalabilir; çıkmıyorsa eşikler
kalibrasyona göre belirlenmeli. Bu bir tasarım tercihi değil, ölçüm sorusudur.

---

## 14. S5'ten çıkan sorular (Executive Briefing + Mission Control)

Ekranlar kurulurken sözleşmede karşılığı bulunamayan noktalar. CLAUDE.md §7
gereği veri modeli kendi başımıza değiştirilmedi — **sorular burada.**
İlgili karar: UI-ADR-096.

### 14.1 `AI Readiness` göstergesinin karşılığı yok

`05-dashboard.md` §3.1 Hero'da "AI Readiness" istiyor. `09-data-contracts.md`
§10 `AIPulse` içinde `overallConfidence` var ama bu "hazırlık" değil, anlık
güven ortalamasıdır; §11 `SystemHealth.score` ise sistemin geneli.

**Şimdilik yapılan:** `ExecutiveHero.aiReadiness: number | null` — `null`
gelir ve Hero'da `NoData` çıkar. Uydurma yapılmıyor.

**Soru:** AI hazırlığı ölçülebilir bir şey mi? Ölçülecekse tanımı ne —
açık kanal oranı mı, model erişilebilirliği mi, kuyruk boşluğu mu?
Ölçülemiyorsa alan sözleşmeden **kaldırılmalı**, çünkü kalıcı olarak boş bir
gösterge de bilgi kirliliğidir.

### 14.2 Mission Control'ün üç bölümünün sözleşmesi yok

`05-dashboard.md` §5 dokuz bölüm sayıyor. Karşılığı olanlar: Executive
Alerts (§6 `Alert`), Director Coordination (§4 `DirectorHeartbeat`),
Operational Status (telemetry registry). Karşılığı **olmayanlar:**

| Bölüm | Gereken sözleşme | Şimdiki durum |
|---|---|---|
| Mission Board / Current Objectives | `Mission` | 🟡 `types/screens.ts`'te TEKLİF |
| Active Projects | `Project` | Ekranda gerekçeli boş durum |
| Resource Allocation | `ResourceAllocation` | Ekranda gerekçeli boş durum |
| Automation Queue | `AutomationQueue` | Ekranda gerekçeli boş durum |

**Teklif edilen `Mission` alanları:** `id · title · objective · status
(planned|active|blocked|done) · progressPercent (0–100, ölçülmüyorsa null)
· ownerDirector · deadline (ISO, yoksa null) · relatedDecisionId? ·
blockedReason?`

**Sorular:**
1. ODIN'de "mission" kavramı var mı, yoksa onaylanan Decision'ların
   yürütme kaydı mı? İkincisiyse `Mission` ayrı bir varlık değil,
   `Decision.status ∈ {executing, monitoring}` görünümüdür — bu durumda
   sözleşme yazmak yerine mevcut alanları kullanırız.
2. `progressPercent` gerçekten ölçülüyor mu? Ölçülmüyorsa alan `null`
   kalmalı; arayüz yüzde uydurmaz.
3. Projects ve Automation ayrı workspace'lerdir (`04-navigation-system.md`).
   Mission Control'deki karşılıkları bir ÖZET mi, yoksa aynı verinin ikinci
   bir görünümü mü? İkincisiyse o workspace'ler yazılmadan bu bölümler
   doldurulmamalı.

### 14.3 `Alert` sözleşmesi risk skoru / olasılık / etki taşımıyor

`05-dashboard.md` §3.3 "Critical Risks" için Risk Score · Probability ·
Impact istiyor ve "risk skoruna göre otomatik sıralanır" diyor.
`09-...md` §6 `Alert` bunların hiçbirini içermiyor; yalnızca `severity` var.

**Şimdilik yapılan:** Sıralama `severity` ile yapılıyor
(critical → risk → warning → info). Türetilmiş bir skor **üretilmedi** —
arayüz türetme yapmaz.

**Soru:** Risk skoru üretiliyor mu? Üretiliyorsa `Alert`'e
`riskScore · probability · impact` eklenmeli. Üretilmiyorsa dokümandaki
"risk skoruna göre sırala" ifadesi `severity`'ye göre güncellenmeli —
ikisinden biri seçilmeli, ekran şu an sözleşmeye uyuyor ama dokümana
uymuyor.

### 14.4 Intelligence Feed öğesinin sözleşmesi yok

`05-dashboard.md` §6 on kategori sayıyor ve "öncelik sıralamasını AI yapar"
diyor. Akan öğenin kendisi için sözleşme yok.

**Şimdilik yapılan:** `IntelligenceItem` (`types/screens.ts`) —
`id · category (10 kategori) · title · detail? · at (ISO, yoksa null) ·
priority (1–5) · actor?`.

**Soru:** Bu akış `IEventBus` (ADR-0021) üzerinden mi gelecek? Öyleyse
`priority` alanını kim üretiyor — event üreticisi mi, Executive AI mi?
"AI sıralar" cümlesinin teknik karşılığı netleşmeli; arayüz şu an
`priority` + zaman ile sıralıyor ve bunu türetme değil, sözleşme
kullanımı sayıyor.

### 14.5 `Decision` onayının kalıcı karşılığı yok

Karar kartındaki `Onayla` düğmesi çalışıyor ama gidecek yeri yok.
Ekranda onay yalnızca **o oturum için** işaretleniyor ve altında
"backend bağlanınca kalıcı olacak, şu an hiçbir yere yazılmadı" yazıyor.

**Soru:** Onay hangi uçtan geçecek? `POST /api/command` beyaz listesi mi,
ayrı bir `POST /api/decisions/{id}/approve` mi? ADR-0086 Human Sign-off
Gate'in teknik karşılığı nedir — imza, kullanıcı kimliği ve zaman damgası
saklanıyor mu?

---

## 15. SAHİBİN KARAR VERMESİ GEREKENLER

29 Temmuz 2026, S5 sonrası. `09b-verified-contracts.md` ile ODIN çekirdeği
doğrulandıktan sonra geriye kalan **beş karar.** Bunların hiçbiri
mühendislik sorusu değildir; gavadolar iki tur danışıldı ve "bunlar sahip
kararı" dedi. §14'teki soruların çoğu bu doğrulamayla **cevaplandı** ve
aşağıda tekrarlanmıyor.

Her madde bir soru değil, bir **seçim**. Cevap "A" ya da "B" olabilir.

---

### 15.1 Karar onayı: tek tık mı, gerekçeli mi?

**Olgu:** ODIN'de onayın gideceği yer var —
`record_decision(..., outcome, decided_by="human-owner", human_reasoning="")`.
Şema `human_reasoning`'i **zorunlu tutmuyor** ama alanı taşıyor. Yani ODIN
"insan neden böyle karar verdi" sorusunun cevabını saklamaya hazır.

**A)** Tek tık onay. Hızlı; brifingde karar kartından çıkmadan onaylanır.
`human_reasoning` boş kalır ve karar kaydında gerekçe olmaz.

**B)** Gerekçe zorunlu. Onay tıklanınca küçük bir alan açılır, CEO bir
cümle yazar. Karar kaydı tam olur; ileride `lessons_learned` ve
`checkpoint_evaluations` ile karşılaştırılabilir.

**C)** Tier'a göre: D3 tek tık, D1/D2 gerekçeli.

> Bu bir UX tercihi değil, **karar kaydının kalitesi** tercihidir. ODIN'in
> tüm öğrenme döngüsü (ADR-0046 Feedback Loop) insanın gerekçesine dayanır.

---

### 15.2 Reddetme ve erteleme arayüzde olacak mı?

**Olgu:** ODIN'de `outcome` serbest metin; `record_decision` reddi de
**kayıt** olarak saklar (`status: "closed"`). Yani "hayır" da bir karardır
ve izi kalır.

Arayüzde şu an yalnızca **Onayla** var.

**A)** Yalnızca Onayla kalsın; ret ve erteleme Decision Center'da olsun.
**B)** Karar kartında üçü de olsun: Onayla · Reddet · Ertele.

> Ret bir eylem olarak yoksa CEO "karar vermemek" yoluyla erteler ve
> ODIN bunu hiç öğrenmez.

---

### 15.3 Yeni ürün kavramları isteniyor mu?

**Olgu:** Arayüzün beklediği dört kavramın ODIN'de karşılığı **yok**:

| Kavram | Bugünkü durum |
|---|---|
| `ExecutiveKPI` (Revenue · Net Profit · Cash Flow · …) | ODIN parça parça üretiyor ama tek bir KPI sözleşmesi yok |
| `Alert` (severity · requiresAction) | yok — `improvement_detectors` ve `finance/quality` benzer şeyler üretiyor |
| `Opportunity` (revenueImpact · deadline) | `amazon_director` ve `innovation` içinde var ama ortak sözleşme yok |
| `Mission` (görev tahtası) | yok |

**A)** İstiyorum → ODIN'de ADR-0050 / R-006 üzerinden **talep satırı**
açılır, sözleşme orada tanımlanır, arayüz sonra bağlanır.

**B)** İstemiyorum → arayüz bu bölümleri kaldırır; ekranlar ODIN'in
gerçekten ürettiği kavramlar üzerine kurulur (karar · öneri · kanıt ·
sağlık skoru · olay akışı · onay kuyruğu).

**C)** Kısmi — hangileri? (ör. KPI ve Alert evet, Mission hayır.)

> Bu, arayüzün ne kadarının yaşayacağını belirler. B seçilirse Mission
> Control'ün yarısı ve KPI şeridi gider; A seçilirse S7/S8 uzar.

---

### 15.4 Amazon verisi cockpit'e bağlanacak mı?

**Olgu:** `odin/amazon_director.py` net kâr, ACOS, stok, BuyBox tarafında
gerçek hesap yapıyor ve hesaplayamadığında dürüstçe `"Data Required"`
yazıyor. Ama bu çıktı **`/api/state`'e bağlı değil** — cockpit onu
görmüyor.

**A)** Bağlansın → S6 Amazon Director ekranı gerçek veriyle çalışabilir
(mock yalnızca eksik alanlar için kalır).
**B)** Bağlanmasın → S6 tamamen mock kalır, gerçek veri S8'e ertelenir.

> A, ODIN tarafında bir iş demektir (projection'a Amazon bölümü eklemek).
> B, S6'nın şablon değerini düşürmez ama "çalışan ekran" hissini geciktirir.

---

### 15.5 Sprint sırası: S5.5 eklensin mi?

**Olgu:** gavadolar (iki üye, aynı yönde) sözleşme düzeltmesinin **S6'dan
önce** yapılmasını söyledi: S6 diğer yedi workspace'in şablonu olacak,
yanlış sözleşmeyle üretilen şablon hatayı sekize çoğaltır.

**A)** S5.5 — Sözleşme Hizalama sprinti eklensin (tahmini: bileşen
refactor + mock güncelleme + contract fixture testleri).
**B)** S6 mock'la devam etsin, hizalama S7'ye bırakılsın.
**C)** İkisi paralel — görsel şablon S6'da, sözleşme S7'de.

> gavadolar A dedi. C'yi terra açıkça riskli buldu: "yanlış varsayımlar
> bileşen API'lerine gömülü, görsel kabuk paralel gidebilir ama veri
> modeli ve bileşen şablonu contract düzeltmesi bitmeden genişletilmemeli."

**Ne oldu:** S6 sahibin talimatıyla **C** yolundan gitti — görsel şablon
üretildi, sözleşme hizalaması S5.5'te ayrı yürüdü. terra'nın uyarısı kısmen
gerçekleşti: S6 `09-data-contracts.md` üzerine kuruldu ve §16'daki sapmaların
bir kısmı 09b ile yeniden hizalanmak zorunda kaldı. Ayrıntı `10c` §7.7.

---

## 16. S6'dan çıkan sorular (Amazon Director)

Referans modül kurulurken sözleşmede karşılığı bulunamayan noktalar.
CLAUDE.md §7 gereği veri modeli tek başımıza değiştirilmedi — **sorular
burada.** §14'teki beş soru hâlâ açıktır ve tekrarlanmadı; §15'teki beş
karar da sahibi bekliyor.
İlgili kararlar: UI-ADR-099 · 100 · 101.

### 16.1 Kâr alanları hesaplanamayan durumu ifade edemiyor ⚠️ EN ÖNCELİKLİ

`09-...md` §8 `netProfit: Money` ve §9 `profitAfterAds: Money` — ikisi de
**zorunlu.** Ama §4'te (bu dosya) yazdığımız gerçek şu: COGS Amazon'da yok,
kullanıcı girmeli ve girilmemiş. Zorunlu bir alan "hesaplanamadı"yı ifade
edemez; tek çıkış uydurmaktır.

**Arayüzde şimdilik yapılan (UI-ADR-098):**

```ts
AmazonSnapshot.netProfit: Money | null      // SAPMA
AmazonSnapshot.grossProfit?: Money          // SAPMA — net kâr yokken ikame
AmazonSnapshot.profitBasis?: { excluded: string[] }   // SAPMA — zorunlu görünür
PPCOverview.profitAfterAds: Money | null    // SAPMA
```

Net kâr `null` iken KPI şeridinde "Net Profit" kartı **hiç çizilmiyor**;
yerine "Gross Profit (ücretler hariç)" ve hariç tutulan kalemler listeleniyor.

**Sorular:**
1. `netProfit` nullable yapılabilir mi? Yapılamıyorsa arayüz hesaplanabilirliği
   neresinden anlayacak — arayüz türetme yapmamalı.
2. `grossProfit`'in tanımı ne olacak? Şu an mock'ta *satış − reklam
   harcaması*. Backend hangi kalemleri düşüyor?
3. `profitBasis.excluded` `string[]` mi olsun, enum mu? terra enum önerdi
   (çeviri arayüzün i18n katmanında kalsın diye). Karar sizin.
4. COGS girişi hangi ekrandan yapılacak? Bu, arayüzde **yeni bir yazma
   akışı** demektir ve S6 kapsamında değildi.

### 16.2 SKU sözleşmesi yok — `SkuHealth` 🟡 TEKLİF

`09-...md` SKU için hiçbir şey tanımlamıyor; oysa Amazon Director'ın
merkezinde SKU Health tablosu (§1.4) ve SKU bağlam paneli (§1.7) var.
S5'te `Mission` için izlenen yol izlendi (UI-ADR-100): tip
`types/screens.ts`'te **teklif** olarak yazıldı, mock ile beslendi, kaynağı
olmayan alanlar `null` bırakıldı.

**Teklif edilen alanlar:** `sku · asin · title · healthScore (0–100, yoksa
null) · status (healthy|watch|at_risk|critical) · unitsAvailable ·
daysOfSupply · estimatedStockoutAt (ISO) · reorderUnits · unitsSoldLast30d ·
revenueLast30d · conversionRate · buyBoxRate · adSpendLast30d ·
adSalesLast30d · acos · grossMarginPerUnit · price`.
**Tüm yüzdeler 0–100** — teklifin parçası olarak bildirildi (UI-ADR-093).

**Sorular:**
1. `healthScore` formülü ne? Türetilmiş bir skordur ve arayüz türetme
   yapmaz — backend'in üretmesi gerekir. Üretilemiyorsa alan kalkmalı.
2. `status` eşikleri nedir, kim belirler?
3. `daysOfSupply` ve `estimatedStockoutAt` **aynı gerçeğin iki biçimi**.
   İkisi de mi gelecek, biri ötekinden mi türetilecek? Türetilecekse hangisi
   kaynaktır (yuvarlama farkı ekranda çelişki gibi görünüyor)?
4. `buyBoxRate`'in kaynağı §4'te "⚠️ belirsiz" yazıyor. Sales & Traffic
   raporundaki Buy Box yüzdesi mi? Yeni listelenen SKU'da gelmiyorsa `null`
   mü döner?
5. SKU seviyesinde bir `AIRecommendation` üretiliyor mu? Şu an panel yalnızca
   `Alert.affectedEntities` eşleşmesini gösteriyor — türetme yapılmadı.
6. SKU **olay geçmişi** (§1.7 "History") için sözleşme var mı? Yoksa o bölüm
   boş kalmaya devam eder.

### 16.3 `AmazonSnapshot` ve `PPCOverview` yüzde ölçeği bildirmiyor

UI-ADR-093 "yüzde ölçeği bildirilir, tahmin edilmez" diyor ve `ExecutiveKPI`
için `scale` alanı zorunlu. Ama §8'in `acos · tacos · buyBoxRate ·
inventoryHealth` ve §9'un `acos` alanlarında böyle bir bilgi **yok.**

**Yapılan:** her iki arayüze zarf başına tek `percentScale: PercentScale`
alanı eklendi ve **zorunlu** yapıldı — TypeScript zorladığı için backend
atlayamaz. Metrik başına alan eklemek gürültü olurdu.

**Soru:** Bu tercih uygun mu, yoksa ölçek global bir sözleşme kuralı olarak
(“ODIN'de tüm yüzdeler 0–100”) bir kez mi dondurulsun? İkincisi daha temiz
ama o zaman `ExecutiveKPI.scale` da kalkmalı — ikisi bir arada tutarsız.

### 16.4 Zaman serisi ve sipariş akışı sözleşmesi yok

İki bölüm bu yüzden gerekçeli boş durumda (UI-ADR-096 deseni):

| Bölüm | Eksik olan |
|---|---|
| Sales & Profit Analytics (§1.4 "günlük/haftalık/aylık/yıllık") | **Etiketli zaman serisi.** `ExecutiveKPI.sparkline` sadece `number[]` — yön gösterir, tarihi yoktur. Eksen etiketi uydurulamaz |
| Orders (§1.4 "sipariş akışı ve anomaliler") | Sipariş seviyesinde sözleşme. `AmazonSnapshot.orders` bir SAYIDIR |
| Layer 3'ün SKU-üstü kalemleri (§1.3: Compare · Decision History · Related Documents / Missions / Directors) | Hiçbirinin sözleşmesi yok |

**Sorular:**
1. Zaman serisi için ortak bir tip yazılsın mı? Öneri:
   `MetricSeries { metric: string; points: { at: string; value: number | null }[]; granularity: "day"|"week"|"month"|"year" }`.
   `value: null` "o gün ölçülmedi" demektir ve `Chart` onu interpolasyonla
   doldurmaz (UI-ADR-087).
2. Sipariş akışı SP-API Orders'tan mı gelecek? Anomali tespiti backend'de mi
   yapılacak, yoksa arayüz mü sınıflandıracak? (Arayüz sınıflandırmamalı.)

### 16.5 Simülasyon motoru — §6'nın somut karşılığı

Panel yazıldı ama **hesap yapmıyor** (UI-ADR-099): senaryolar zarftan gelir,
`assumptions[]` boşsa senaryo hiç gösterilmez, mock kaynakta
"SİMÜLASYON — MOCK" rozeti çıkar.

**Sorular:**
1. §6'daki Faz 1 (trend ekstrapolasyonu) ne zaman gelir? Gelene kadar panel
   "motor yok" boş durumunda kalacak.
2. Uç noktası ne olacak — `POST /api/simulate` mi, hazır senaryo listesi mi?
   Arayüz şu an **liste** bekliyor (`SimulationCase[]`); serbest parametreli
   bir uç gelirse kullanıcı girdi verebilecek ve panel yeniden tasarlanır.
3. `SimulationResult.confidence` nereden gelir? §9'daki uyarı burada da
   geçerli: üretilemiyorsa gösterilmemeli.

### 16.6 Para birimi ve türetilebilir metriklerin tutarlılığı

S6 kapanış incelemesinde PPC kartındaki dört sayı birbirini yalanlıyordu
(UI-ADR-103). Mock tarafı düzeltildi, ama gerçek veri geldiğinde aynı sorun
**backend'de** doğar. İki soru:

**1. Reklam verisi hangi para biriminde gelecek?**

Ads API harcamayı marketplace para biriminde (US için USD) verir; SP-API
cirosu ise raporlama para biriminde gelebilir. TACOS = reklam harcaması /
toplam satış olduğu için ikisi **aynı birimde** olmak zorundadır.

- Backend tek bir raporlama para birimine mi çevirecek? Çeviriyorsa
  **hangi kur, hangi tarihli**? Bu bilgi zarfa girmeli — arayüz kur
  çevirmez, çeviremez.
- Yoksa her `Money` kendi biriminde mi gelecek? O zaman TACOS gibi
  ORANLAR backend'de hesaplanmalı; arayüz farklı birimdeki iki tutarı
  oranlamaz, `NoData` gösterir.

luna bu noktada `Money`'ye kur + kur tarihi eklenmesini önerdi. Bu bir veri
modeli değişikliğidir; CLAUDE.md §7 gereği **karar sahibindedir**, arayüz
kendi başına alan eklemedi.

**2. Türetilebilir metrikleri kim üretecek?**

`ACOS = spend / adSales`, `ROAS = adSales / spend`, `TACOS = spend / revenue`.
Backend bu üçünü **kendi bileşenlerinden** üretmeli ve aynı yanıtta tutarlı
göndermelidir. Arayüz hiçbirini hesaplamaz (UI-ADR-093 · UI-ADR-099) ve
tutarsızlığı **düzeltemez** — yalnızca gösterir. Tutarsız bir üçlü ekrana
düştüğü an kullanıcı tüm göstergelere olan güvenini kaybeder.

Öneri: bu üç oranın tutarlılığı için backend tarafında bir doğrulama testi
bulunsun (ODIN'in `tests/test_math_audit.py` deseni).
