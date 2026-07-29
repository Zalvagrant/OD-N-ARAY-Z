# 06 — Workspace Specifications

**Kaynak:** dosya_2 (Screen 03–10), dosya_3 (Amazon Snapshot, PPC), dosya_7 (P5.1 Amazon, P5.7 System)

Her workspace `03-information-architecture.md` §3'teki standart iskeleti
kullanır. Bu dosya yalnızca **içerik farklarını** tanımlar.

**Olgunluk göstergesi:**

| Workspace | Durum |
|---|---|
| Amazon Director | ✅ Detaylı tanımlı |
| System Director | ✅ Detaylı tanımlı |
| Decision Center | ✅ Detaylı tanımlı |
| Knowledge | 🟡 Kısmen |
| Memory | 🟡 Kısmen |
| Executive Council | 🟡 Kısmen (bağımsız ekran değil — Decision Center içinde açılır) |
| Finance | ⬜ Sadece isim |
| Trading | ⬜ Sadece isim (Universe olarak var, workspace yok) |
| Projects | ⬜ Sadece isim |
| Automation | ⬜ Sadece isim |
| ~~Executive Director~~ | ❌ Silindi — UI-ADR-078 |

---

## 1. Amazon Director Workspace ⭐

**Referans modül.** En olgun ve en fazla veri kaynağına sahip modül olduğu için
tasarım dili **önce burada doğrulanır**, sonra diğerlerine aktarılır.

**Temel soru:** *"Bugün Amazon işinde hangi kararları vermeliyim?"*

Bu bir raporlama ekranı değildir.

### 1.1 Yerleşim

```
┌─────────────────────────────────────────────────────────────┐
│ Amazon Director Header                                      │
├─────────────────────────────────────────────────────────────┤
│ Executive KPI Strip                                         │
├──────────────┬──────────────────────────────┬───────────────┤
│ SKU Health   │ Sales & Profit Analytics     │ AI Insights   │
├──────────────┼──────────────────────────────┼───────────────┤
│ Inventory    │ PPC Performance              │ BuyBox        │
├──────────────┼──────────────────────────────┼───────────────┤
│ Orders       │ Opportunity Feed             │ Alerts        │
└──────────────┴──────────────────────────────┴───────────────┘
```

### 1.2 KPI Strip

Yalnızca en kritik metrikler:

`Net Sales` · `Net Profit` · `ACOS` · `TACOS` · `ROAS`
· `Active SKUs` · `Inventory Value` · `BuyBox Rate`

Her KPI trend, önceki dönem karşılaştırması ve risk durumu ile birlikte
gösterilir (bkz. `05-dashboard.md` §4 KPI anatomisi).

### 1.3 Üç katmanlı okuma — Amazon Executive Snapshot

**Layer 1 — Executive Glance (10–15 saniye)**

Bilgisayar açılır açılmaz görülecek bölüm. Grafik karmaşası yok, sadece:

`Amazon Health Score` · `Revenue` · `Net Profit` · `Orders` · `ACOS` · `TACOS`
· `Buy Box` · `Inventory Health` · `Top Risk` · `Top Opportunity` · `Mission Progress`

**Layer 2 — Executive Intelligence (30–60 saniye)**

AI konuşmaya başlar, ama sabit formatta:

```
📊 Numbers          Veriler
🔍 Analysis         Neden oldu?
🧠 Interpretation   Ne anlama geliyor?
🎯 Recommendation   Ne yapmalıyız?
📑 Evidence         Bu önerinin kanıtı nedir?
```

Bu beş adımlı format **tüm ODIN modüllerinde ortaktır** — bkz.
`07-ai-directors.md` §7.

**Layer 3 — Deep Executive Analysis (talep üzerine)**

Timeline · Trend · Forecast · Compare · Decision History · AI Reasoning
· Related Missions · Related Decisions · Related Documents · Related Directors

### 1.4 Ana modüller

**SKU Health** — sağlık puanı, stok durumu, BuyBox, dönüşüm oranı

**Sales & Profit** — günlük / haftalık / aylık / yıllık analiz

**Inventory Intelligence** — kritik stok, fazla stok, tahmini tükenme tarihi,
yeniden sipariş önerisi

**Orders** — sipariş akışı ve anomaliler

**Alerts** — yalnızca **aksiyon gerektiren** olaylar:
BuyBox kaybı · Stok riski · ACOS yükselişi · Listeleme hataları

### 1.5 PPC Intelligence Center — dört katman

Piyasadaki araçlar ACOS/ROAS/CPC/CTR gösterir. CEO bunlara bakarak karar
vermez. ODIN'in yaklaşımı:

**Katman 1 — Executive PPC Overview**

```
PPC Health   94
Spend        $2.420
Sales        $18.300
ACOS         18.1%
ROAS         5.4
Profit After Ads   +$4.120
```

Kritik nokta: **Profit After Ads.** Reklam metriği değil, kâr metriği.

**Katman 2 — AI Campaign Intelligence**

AI her kampanyayı tek tek analiz eder ve özetler:

```
Campaign A   🟢 Sağlıklı
Campaign B   🔴 ACOS yükseliyor
Campaign C   🟡 Bütçe erken bitiyor
Campaign D   🟢 Ölçeklenebilir
```

Kullanıcı kampanyaları tek tek dolaşmaz.

**Katman 3 — Opportunity Center** ⭐

AI sürekli fırsat arar. Sadece sorunları değil, **kazanç fırsatlarını** da
gösterir:

- Bu keyword yükseliyor
- Rakip reklamı kapattı
- CPC düştü
- Yeni Search Term oluştu
- Negatif keyword eklenmeli
- Placement değiştirilmeli
- Bütçe artırılabilir / azaltılmalı

**Katman 4 — Executive Simulator**

CEO sorar, ODIN simüle eder:

> "PPC bütçesini %15 artırırsak ne olur?"

| Senaryo | Beklenen Sonuç |
|---|---|
| Satış | +%9 |
| Reklam Harcaması | +%15 |
| Net Kâr | +%4 |
| ACOS | +0,8 puan |
| Güven Skoru | %89 |

Farklı senaryolar yan yana karşılaştırılabilir.

⚠️ **DOĞRULANMADI:** Simülasyon motorunun backend'de karşılığı yok.
Bu bir tahmin modeli gerektirir. Bkz. `13-backend-recommendations.md` §6.

### 1.6 Opportunity Feed

AI tarafından bulunan: yeni ürün fırsatları · fiyat optimizasyonu
· reklam iyileştirmeleri · bundle önerileri

### 1.7 Sağ Context Panel — SKU seçildiğinde

```
SKU Summary → Financial Metrics → Advertising → Inventory
→ History → AI Recommendation → Actions
```

Kullanıcı ekran değiştirmeden tüm detayları görür.

### 1.8 Kalite kriterleri

**S6'da üretildi** — ekran katmanı `10c-screens.md` §7'de tarif edilir.

- [x] Mission Control tasarım dili korunuyor
- [x] Aynı component kütüphanesi kullanılıyor
- [x] Aynı grid sistemi — üç kolon bağımsız akışa çevrildi, gerekçe 10c §7.2
- [x] Sağ panel davranışı değişmemiş — kabuğa dokunulmadı, `children` doldu
- [x] AI önerileri kanıtlarla destekleniyor (`EvidenceChain`, UI-ADR-091)
- [x] SP-API ve Ads API verileri **aynı yapıda** gösteriliyor — ikisi de
      `DataEnvelope` + `DataGuard` + `TrustSignal` zincirinden geçer
- [ ] Gerçek veri bağlı değil — S8. `SkuHealth` sözleşmesi 🟡 TEKLİF
      (13-...md §16.2), net kâr için sözleşme sapması onay bekliyor (§16.1)

---

## 2. Decision Center Workspace

**Bu bir dashboard değil, bir War Room'dur.** ODIN'in sinir merkezidir —
Amazon, Finance, Trading ve Knowledge modüllerinin tamamı bu ekran için veri
üretir.

### 2.1 Yerleşim akışı

```
Decision List → Decision Summary → Evidence Panel → Financial Impact
→ Director Opinions → Executive Council Votes → Risk Analysis
→ Scenario Comparison → Recommendation → Approval Panel
```

### 2.2 Her karar şunları içerir

Context · Reasoning · Evidence · Confidence · Alternatives · History
· Predictions · Future Impact · Learning Impact

**Kural:** AI gerekçesi **asla gizlenmez.**

### 2.3 Karar Yaşam Döngüsü

```
AI Insight → Decision Proposal → Evidence Collection → Risk Analysis
→ Executive Review → Approval → Execution → Monitoring
→ Outcome Analysis → Lessons Learned → Knowledge Memory
```

Her karar; alınan bir aksiyon değil, ölçülen, değerlendirilen ve kurumsal
hafızaya eklenen bir **bilgi** haline gelir.

### 2.4 Executive Decision DNA

Her kararın bir kimliği vardır:

| Alan | Açıklama |
|---|---|
| Decision ID | Benzersiz kimlik |
| Decision Type | Finans / Amazon / Trading / Strateji |
| Strategic Impact | Stratejik etki |
| Financial Impact | Beklenen finansal etki |
| Risk Level | Risk seviyesi |
| AI Confidence | AI güven skoru |
| Evidence Quality | Kanıt kalitesi |
| Reversibility | Geri alınabilir mi? |
| Execution Complexity | Uygulama zorluğu |
| Expected ROI | Beklenen geri dönüş |
| Actual ROI | Gerçekleşen sonuç |
| Lessons Learned | Öğrenilen dersler |

Bu yapı sayesinde ODIN, hangi **tür** kararların daha başarılı olduğunu zamanla
öğrenir.

### 2.5 Decision Timeline

Her kararın bir zaman çizgisi vardır: fırsatın tespitinden onaya, uygulamadan
ilk sonuçlara, oradan Knowledge Memory'ye aktarımına kadar.

### 2.6 Decision Relationships

Kararlar birbirinden bağımsız değildir ve bu grafik olarak gösterilir:

```
Amazon fiyat artırma kararı
  → Finance'i etkiler
  → Cash Flow'u etkiler
  → Inventory Plan'ı etkiler
  → PPC'yi etkiler
  → Strategy hedefini etkiler
```

### 2.7 Executive Decision Score

Karar tamamlandıktan sonra puanlanır:

| Gösterge | Örnek |
|---|---|
| Sonuç Başarısı | 96 |
| Zamanında Tamamlandı | ✅ |
| Beklenen ROI | %12 |
| Gerçek ROI | %14 |
| Risk Yönetimi | 95 |
| Kanıt Kalitesi | 98 |
| AI Tahmin Doğruluğu | 94 |

Son satır kritik: AI kendi tahmin doğruluğunu ölçer ve zamanla kalibre olur.

---

## 3. Knowledge Workspace

NotebookLM'den ilham alınmış, önemli ölçüde genişletilmiş.

**Primary Focus:** Knowledge Explorer

İçerik:

Semantic Search · Knowledge Graph · Memory Graph · Evidence Explorer
· Citation Viewer · Relationship Explorer · Knowledge Timeline
· Document Viewer · Contradictions · Related Decisions · Source Quality
· Confidence · Freshness

**Arama akışı:**

```
Knowledge Search → Semantic Results → Evidence → Graph
→ Related Decisions → AI Summary → Contradictions → Sources
→ Confidence → Memory Links
```

**Kural:** Her arama, sonuçların **neden çıktığını** açıklamak zorundadır.
Artık dosya aranmıyor; bilgiyle konuşuluyor.

**Contradictions özelliği dikkat çekicidir:** sistem, bilgi tabanındaki
çelişkileri aktif olarak yüzeye çıkarır. Bu, çoğu bilgi yönetim aracının
yapmadığı şeydir.

---

## 4. Memory Workspace

**Amaç:** AI hafızasını görselleştirmek.

Bölümler:

Working Memory · Executive Memory · Knowledge Memory · Decision Memory
· Long-Term Memory · Archived Memory · Memory Health · Memory Capacity
· Memory Retrieval · Learning Queue · Reflection Queue

İlişkiler görselleştirilir. Hafıza katmanlarının tanımı:
`07-ai-directors.md` §8.

---

## 5. Executive Council Workspace

**Amaç:** İşbirlikçi akıl yürütmeyi görselleştirmek.

Gösterilenler:

Council Members · Current Discussion · Arguments · Supporting Evidence
· Opposing Evidence · Agreement Score · Confidence · Recommendation
· Voting · Consensus Timeline

Konsey, bir yönetim danışma kurulu gibi davranır. Detaylı davranış modeli:
`07-ai-directors.md` §4–6.

---

## 6. AI Core — ❌ Ayrı workspace KALDIRILDI (UI-ADR-077)

**Karar:** AI ayrı bir yere gidilerek kullanılmaz. AI her yerde çalışır:
Executive Brief, Insight, Decision, Forecast ve Knowledge içinde doğal olarak
yaşar.

Bağımsız bir "AI Core Workspace" **yoktur.** Menüde AI Core diye bir madde
bulunmaz.

**AI telemetrisi nerede yaşar:** System Director içinde bir sekme olarak
(`06-workspaces.md` §8 → "AI Runtime" sekmesi). Orada gösterilenler:
Processing Queue · Current Tasks · AI Confidence · Aktif model · Model Router
istatistikleri · Kaynak kullanımı.

**Header'daki AI Pulse göstergesi** günlük kullanım için yeterlidir; detay
isteyen System Director'a gider.

**Kural değişmedi:** Dekoratif eleman yok. Her gösterge gerçek aktiviteyi
yansıtır.

---

## 7. Voice Workspace

**Amaç:** Doğal yönetici konuşması.

İçerik: Waveform · Conversation · Thinking Status · Knowledge Access
· Referenced Documents · Live Citations · Reasoning Timeline
· Generated Insights · Recommended Actions · Voice History
· Microphone Status · Audio Processing

**Kural:** AI durumu her zaman görünür.

❌ **v1.0 KAPSAMI DIŞI (UI-ADR-080).** Ses altyapısı (STT/TTS + ses işleme)
mevcut ODIN'de yok ve bağımsız bir çalışmadır.

**v1.0'da yapılacak tek şey:** Header'da `Voice Status` göstergesi `disabled`
durumunda durur — yer tutar, tıklanmaz.

**Backlog'a alındı:** M6 sonrası, v1.1 hedefi. Bkz. `handover.md` §12.

---

## 8. System Director Workspace

Her gün kullanılmayacak ama ODIN'in güvenilirliğini sağlayan operasyon merkezi.

**Temel soru:** *"ODIN şu anda sağlıklı, güvenli ve beklenen performansta
çalışıyor mu?"*

### 8.1 Yerleşim

```
┌────────────────────────────────────────────────────────────────┐
│ SYSTEM DIRECTOR              Search System    AI Diagnostics   │
├────────────────────────────────────────────────────────────────┤
│ Health │ Performance │ Security │ AI Runtime │ Storage         │
│        │ Network     │ Backups  │ Version                      │
├─────────────────────────┬──────────────────────────────────────┤
│ SYSTEM HEALTH           │ AI SYSTEM BRIEF                      │
├─────────────────────────┼──────────────────────────────────────┤
│ RESOURCE MONITOR        │ SERVICE STATUS                       │
├─────────────────────────┼──────────────────────────────────────┤
│ SECURITY CENTER         │ UPDATE & RELEASES                    │
├─────────────────────────┼──────────────────────────────────────┤
│ LOG & EVENTS            │ BACKUP & RECOVERY                    │
└─────────────────────────┴──────────────────────────────────────┘
```

### 8.2 KPI Strip

`System Health` · `Uptime` · `CPU` · `Memory` · `Storage`
· `Active Services` · `Critical Alerts` · `Current Version`

### 8.3 Bölümler

**System Health** — genel sağlık puanı, kritik servisler, son hata, son
yeniden başlatma, ortalama yanıt süresi

**AI System Brief** — AI loglardan anlamlı özet üretir:
```
Executive Summary → Detected Issues → Performance Insights
→ Security Warnings → Recommended Actions
```

**Resource Monitor** — CPU, RAM, Disk, ağ, GPU (varsa), arka plan görevleri;
trend grafikleriyle

**Service Status** — API Gateway · AI Orchestrator · Amazon Connector
· Finance Connector · Knowledge Engine · Automation Runtime
· Notification Service.
Her servis için: durum, son kontrol zamanı, ortalama yanıt süresi, son hata

**Security Center** — yetkilendirme durumu, API anahtarı durumu, erişim
denetimleri, başarısız giriş denemeleri, güvenlik olayları, audit kayıtları

**Update & Releases** — mevcut sürüm, yeni sürüm durumu, yayın notları,
bekleyen güncellemeler, rollback uygunluğu

**Log & Events** — filtrelenebilir olay akışı (Bilgi / Uyarı / Hata / Kritik);
zaman, servis ve modüle göre filtre

**Backup & Recovery** — son başarılı yedek, yedek boyutu, doğrulama durumu,
kurtarma noktaları, felaket kurtarma hazırlığı

**AI Runtime** ⭐ (UI-ADR-077 ile buraya taşındı) — eski "AI Core Workspace"in
yerini alır:

- Processing Queue ve aktif görevler
- AI Confidence (ortalama, son 24 saat)
- Aktif model ve **Model Router istatistikleri** (hangi iş hangi modele gitti)
- Token ve maliyet dökümü
- Kaynak kullanımı
- 3 kanallı AI Pulse görselleştirmesi (bkz. `05-dashboard.md` §7)

Bu sekme günlük kullanım için değildir. Günlük ihtiyaç header'daki AI Pulse
göstergesiyle karşılanır.

### 8.4 Sağ Context Panel

```
Overview → Diagnostics → Logs → History → Related Services
→ AI Analysis → Recommended Actions
```

---

## 9. Tanımlanmamış Workspace'ler

Aşağıdaki workspace'ler **yalnızca isim seviyesinde** vardır. Kod yazılmadan
önce en az Amazon Director seviyesinde tanımlanmaları gerekir.

| Workspace | Bilinen tek şey |
|---|---|
| **Finance Director** | Primary Focus = Cash Overview. AI CFO ekibi tanımlı (bkz. `07-...` §9) |
| **Trading** | Universe olarak var: XAU/USD, XAU/TRY, USD/TRY, EUR/TRY, Prop hesaplar, Risk, günlük performans. Workspace tanımı yok |
| ~~Executive Director~~ | ❌ **SİLİNDİ (UI-ADR-078)** — Executive Briefing ile aynı şeydi |
| **Projects Director** | İsim var |
| **Automation Director** | İsim var. Automation Queue, Workflow, Scheduler ile ilgili |
| **Strategy Workspace** | OKR, şirket hedefleri, uzun vadeli planlar, yol haritaları, KPI yönetimi, senaryo simülasyonları, AI Strategy Advisor, "What If?" — sadece madde listesi |

### ✅ Tanımlama sırası (UI-ADR-079)

| Sıra | Workspace | Gerekçe |
|---|---|---|
| 1 | **Finance** | Amazon'dan sonra en yüksek iş değeri; AI CFO ekibi zaten tanımlı |
| 2 | **Trading** | Universe olarak var, veri kaynağı belli (XAU/USD, XAU/TRY, USD/TRY, EUR/TRY, prop hesaplar) |
| 3 | **Projects** | Düşük öncelik |
| 4 | **Automation** | Düşük öncelik |
| — | ~~Executive Director~~ | Silindi (UI-ADR-078) |
| — | Strategy | v1.0 dışı — v2 backlog |

Her biri **Amazon Director seviyesinde** tanımlanmadan M3'te kod yazılmaz.

---

## 10. Yeni bir workspace nasıl eklenir

1. Altı workspace tipinden birine ata (`03-...` §8)
2. Primary Focus Area'yı tek cümlede yaz
3. 2–4 Supporting Panel seç
4. Context Panel içeriğini tanımla
5. Density modunu belirle
6. `09-data-contracts.md`'ye veri sözleşmesini ekle
7. Beş tasarım kapısından geçir (`02-...` §15)

Bu adımlar atlanırsa workspace sisteme girmez.
