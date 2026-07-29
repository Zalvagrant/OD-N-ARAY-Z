# 05 — Executive Briefing & Mission Control

**Durum:** ✅ DONDURULDU (yapı) / 🟡 high-fidelity üretilmedi
**Kaynak:** dosya_1 (§1 Experience Map, §7 KPI, §11 Right Panel), dosya_2 (Screen 01–02)

Bu, ODIN'in ilk ekranıdır ve tüm tasarım dilinin referansıdır. Diğer tüm
workspace'ler bu ekranda doğrulanan dili miras alır.

---

## 1. İki farklı ekran, tek dil

| Ekran | Soru | Tip |
|---|---|---|
| **Executive Briefing** | "Bugün neye karar vermeliyim?" | Executive Workspace |
| **Mission Control** | "Şu anda ne oluyor?" | Operational Workspace |

Executive Briefing gündür; Mission Control andır. İkisi ayrı workspace'lerdir
ama aynı iskeleti ve aynı bileşenleri kullanırlar.

**Açılış ekranı:** Executive Briefing. Kullanıcı ODIN'i açtığında karar
listesiyle karşılaşır, canlı operasyonla değil.

---

## 2. İlk 30 saniye — Experience Map

Bu, ürünün en önemli deneyim kararıdır. Zaman dilimleri hedeftir, süsleme değil.

### 0–3 saniye — Sistem hazır olduğunu bildirir

Aşağıdaki durumlar sırayla canlanır:

- AI Core aktif
- Voice Core Online
- Knowledge Connected
- Memory Synced
- Background Jobs Running
- Data Sources Connected

**Kural:** Bunlar popup olarak gösterilmez. Küçük, sessiz durum
animasyonlarıyla verilir. Kullanıcı okumaz — "sistem hazır" hissini alır.

Süre aşılırsa: skeleton gerçek yerleşimi temsil eder, layout shift olmaz.

### 3–10 saniye — Executive Briefing oluşur

```
Bugünkü kritik kararlar
        ↓
Riskler
        ↓
Fırsatlar
        ↓
Bekleyen onaylar
        ↓
AI tavsiyesi
```

Bu bir dashboard değil, bir **brifingdir.** Sıralama sabittir; kararlar her
zaman en üsttedir.

### 10–30 saniye — Sistem konuşmaya başlar

CEO ekranı keşfetmeye başlamaz, çünkü sistem zaten anlatmaya başlamıştır:

> "Günaydın. Bugün üç kritik karar bekliyor. Amazon kâr marjı %4 düştü.
> Forex tarafında risk arttı. Yeni satın alma önerisi hazır."

Bu metin AI tarafından üretilir ve `07-ai-directors.md` §Standart Çıktı
Formatı'na uyar. Sesli okuma opsiyoneldir; metin her zaman vardır.

---

## 3. Executive Briefing — Bölüm bölüm

### 3.1 Hero Section

| Alan | İçerik |
|---|---|
| Selamlama | Good Morning / günün saatine göre |
| Executive Summary | AI'ın 2–3 cümlelik durum özeti |
| Today's Mission | Günün ana hedefi |
| Current Focus | Şu an odaklanılması gereken konu |
| System Status | Sistem sağlık göstergesi |
| AI Readiness | AI hazırlık durumu |

Hero, ekranın tek **Hero Element**'idir (Attention Economy: en fazla 1).

### 3.2 Critical Decisions

En yüksek öncelikli kararlar. Her karar kartı şunları taşır:

```
Priority
Title
Executive Summary
Financial Impact
Risk
Confidence
Evidence Count
Recommendation
[ Approve ]  [ Open Analysis ]
```

**Kural:** `Approve` butonu kartın üzerindedir. CEO karar vermek için başka
bir ekrana gitmek zorunda değildir. Detay isterse `Open Analysis` ile
Decision Center'a geçer.

### 3.3 Critical Risks

Otomatik sıralanır (risk skoruna göre). Her risk:

- Risk Score
- Affected Departments
- Probability
- Impact
- Suggested Mitigation
- Responsible Director

### 3.4 Opportunities

Büyüme fırsatları:

- Revenue Impact
- Confidence
- Deadline
- Recommended Action

Riskler ve fırsatlar **eşit görsel ağırlıkta** gösterilir. Sadece risk gösteren
bir sistem korku üretir; ODIN denge kurar.

### 3.5 Executive KPIs

Gösterilecek KPI seti:

`Revenue` · `Net Profit` · `Cash Flow` · `Amazon` · `Inventory`
· `AI Confidence` · `Knowledge Health` · `Memory Health` · `Decision Confidence`

Son dört kalem dikkat çekicidir: ODIN yalnızca işi değil, **kendi zekâsının
sağlığını da** bir KPI olarak sunar.

### 3.6 Director Activity

Tüm Director'lar listelenir. Her kart:

- Current Status
- Heartbeat
- Current Task
- Confidence
- Queue
- Recommendation Count

✅ **ÇÖZÜLDÜ (UI-ADR-074):** Listelenecek Director'lar: Executive · Amazon
· Finance · Trading · Knowledge · Reasoning. Detay: `07-ai-directors.md` §2.

### 3.7 Executive Timeline

Son yönetici olayları (App Shell'in bir parçası, bkz. `03-...` §16).

### 3.8 Executive Footer

Live Neural Stream telemetrisi (App Shell'in bir parçası).

---

## 4. Executive KPI Card — Anatomi

Bu, ODIN'in en ayırt edici bileşenidir ve normal bir KPI kartı **değildir.**

Tek kart, ama katmanlı. Katmanlar:

```
Revenue                    ← metrik adı
₺ 1.284.000               ← değer
▲ %12  ·  sparkline       ← trend
─────────────────────────
AI Yorumu                 ← neden böyle?
Confidence      %94       ← ne kadar eminiz?
Forecast        ₺1.4M     ← nereye gidiyor?
Risk            Düşük     ← tehlike var mı?
─────────────────────────
Recommended Action        ← ne yapmalı?
Evidence        18 kaynak ← kanıtı ne?
Owner           Finance   ← kim sorumlu?
Last Update     2 dk önce ← güncel mi?
```

**Tasarım kuralı:** Üst blok her zaman görünür (Level 1). Alt bloklar
progressive disclosure ile açılır (Level 2–3). Kart kapalıyken bir KPI kartı
kadar sade, açıkken bir mini-rapor kadar zengin olmalıdır.

**Amaç:** CEO hiçbir yere gitmeden karar verebilsin.

Veri sözleşmesi: `09-data-contracts.md` §ExecutiveKPI.

---

## 5. Mission Control

Klasik ana sayfanın yerini alır. Amacı: **canlı operasyonel farkındalık.**

İçerik:

- Mission Cards
- Operational Status
- Current Objectives
- Active Projects
- Upcoming Deadlines
- Director Coordination
- Resource Allocation
- Automation Queue
- Executive Alerts

**Primary Focus Area:** Mission Board.

Her şey canlı güncellenir. Ancak `02-design-principles.md` §7 Executive Timing
geçerlidir: güncellemeler dikkat çalmadan, yumuşak geçişle olur.

---

## 6. Executive Intelligence Feed (Sağ Panel)

Executive Briefing'de sağ panel bir "detay paneli" değil, sürekli akan bir
**istihbarat akışıdır:**

- Kritik Riskler
- AI Tavsiyeleri
- Director Aktivitesi
- Bekleyen Onaylar
- Market Intelligence
- Rekabet Uyarıları
- Amazon Anomalileri
- Finansal Sapmalar
- Güvenlik Olayları
- Yeni Öğrenilen Bilgiler

**Kural:** Bu panel sürekli değişir ama **asla** bildirim sesi/animasyonu ile
dikkat çalmaz. Yeni öğe yumuşak bir giriş animasyonuyla belirir.

⚠️ Dikkat: 10 kategori, Cognitive Load Budget'ı zorlar. Öneri: aynı anda en
fazla 5–6 öğe görünür, gerisi scroll'da. Öncelik sıralaması AI tarafından
yapılır.

---

## 7. AI Core Görselleştirmesi

Bu bölüm bir dekorasyon değil, bir **telemetri ekranıdır.**

Merkezde çok katmanlı bir çekirdek; içinde halka halinde dönen bileşenler:

```
Reasoning · Planning · Learning · Knowledge · Memory · Prediction · Reflection
```

**Kritik kural — halkalar gerçek sistem durumunu gösterir:**

| Sistem durumu | Görsel karşılık |
|---|---|
| Reasoning yük altında | İlgili halka hızlanır |
| Memory indexing çalışıyor | Memory halkası parlar |
| Prediction çalışıyor | Prediction halkası aktifleşir |
| Boşta | Halkalar yavaş, sakin döner |

Gerçek veriye bağlanamayan bir halka **gösterilmez.** Bu, "Dekoratif AI"
yasağının en kritik uygulama noktasıdır — sahte animasyonlu bir AI çekirdeği,
tüm ürünün güvenilirliğini bozar.

✅ **KARAR (UI-ADR-071) — 7 halka yerine 3 gerçek halka.**

`Reasoning`, `Planning`, `Reflection` gerçek altsistem değil, kavramsal
isimlerdir. ODIN'de bunlara karşılık gelen ölçülebilir bir kaynak yoktur;
animasyonla gösterilmeleri olmayan bir şeye nabız takmak olur.

**v1.0'da gösterilecek 3 halka:**

| Halka | Neyi ölçer | Kaynak |
|---|---|---|
| **Processing** | Aktif AI çağrısı, kuyruk uzunluğu | AI Gateway |
| **Memory & Knowledge** | İndeksleme, senkronizasyon | Memory servisi |
| **Prediction** | Çalışan tahmin/forecast işi | Forecast servisi |

Sistem büyüdükçe halka eklenir. `available: false` olan kanal **çizilmez.**

**Görsel sınır:** `02-design-principles.md` "Gereksiz hologram" yasağı burada
da geçerlidir. Çekirdek sade, ölçülü ve sessiz olmalıdır; bir sci-fi
efekti değil, bir nabız göstergesi.

---

## 8. Kabul Kriterleri

Executive Briefing tamamlandı sayılmadan önce:

✅ **S5'te karşılandı** (`10c-screens.md`). Ölçümler sıcak dev sunucusunda,
1920×1080'de alındı.

- [x] Açılıştan brifinge kadar geçen süre ölçüldü ve 10 sn altında — **0,95 sn**
      (karar kartı 2,3 sn; Mission Control 0,64 sn)
- [x] Hero, Attention Economy'ye uyuyor (tek hero, 3 primary kart)
- [x] Her KPI kartı katmanlı ve kapalıyken sade
- [x] Her karar kartından doğrudan onay verilebiliyor
- [x] Risk ve fırsat eşit görsel ağırlıkta (aynı grid, eşit genişlik)
- [x] Hiçbir AI göstergesi sahte veri ile beslenmiyor — mock bile olsa
      ölçüm kaynağı olmayan alan `NoData` gösterir (UI-ADR-094)
- [x] Skeleton gerçek yerleşimi temsil ediyor, layout shift yok
- [x] Bir CEO 30 saniyede durumu anlayıp bir kararı onaylayabiliyor
