# 15 — Execution Plan (Bitirme Planı)

**Tarih:** 28 Temmuz 2026
**Hedef:** ODIN v1.0 — çalışan, günlük kullanılan Executive arayüzü.
**Durum:** Tüm tasarım kararları kapandı. Bundan sonrası sadece üretim.

---

## Bu planın tek kuralı

> **Her sprint sonunda çalışan bir şey olacak.**

Doküman değil, plan değil, tasarım değil. **Açılan, tıklanan, çalışan bir şey.**

Bir sprint bu şartı sağlamıyorsa yanlış bölünmüştür — böl.

---

## Genel Harita

```
FAZ A  İSKELET          S0 · S1 · S2          → Uygulama açılıyor
FAZ B  BİLEŞENLER       S3 · S4               → Ekran yapılabilir
FAZ C  İLK EKRANLAR     S5 · S6               → Mock veriyle görünüyor
FAZ D  CANLI VERİ       S7 · S8               → 🎯 KULLANMAYA BAŞLIYORSUN
FAZ E  AI CANLI         S9                    → ODIN düşünmeye başlıyor
FAZ F  KALAN MODÜLLER   S10 · S11             → Tüm workspace'ler
FAZ G  ÇOKLU CİHAZ      S12                   → Tablet + Mobil
FAZ H  SERTLEŞTİRME     S13                   → 🚀 v1.0
```

**Kritik nokta: FAZ D sonu.** Orada ODIN'i günlük kullanmaya başlıyorsun.
Kalan dört faz, sen zaten kullanırken devam eder. Bu, planın en önemli
tasarım kararıdır — "her şey bitince kullanırım" yaklaşımı projeleri
öldürür.

---

# FAZ A — İSKELET

## S0 — Repo Audit (iki parça)

**Sorumlu:** Claude Code
**Süre:** 2 oturum
**Ön koşul:** `docs/ui_chatgpt/` arayüz reposunda

### İki repo yapısı

| Repo | Rol | Bu projede |
|---|---|---|
| `Zalvagrant/ODIN` | Backend — Amazon API, veri, iş mantığı, Board raporu | Okunur + sınırlı ek (universe_id, AI Gateway) |
| `Zalvagrant/OD-N-ARAY-Z` | Arayüz | **Tüm UI kodu burada.** Dokümanlar burada |

**Kural:** ODIN reposundaki iş mantığına dokunulmaz. Yalnızca
`13-backend-recommendations.md`'deki maddeler eklenir, o da S8'den itibaren.

### S0-A — Arayüz reposu (8 soru)

Mevcut durum, teknoloji stack'i, var olan bileşenler, routing, kod/ klasörü
entegrasyon planı. Prompt: `_BURADAN_BASLA.md` §2A.
Çıktı: `docs/ui_chatgpt/audit-frontend.md`

### S0-B — ODIN reposu (11 soru)

API envanteri, universe_id, SP-API/Ads durumu, COGS/net kâr, confidence
üretimi, decision saklama, telemetri, AI çağrı yapısı.
Prompt: `_BURADAN_BASLA.md` §2B.
Çıktı: `ODIN/docs/audit-backend.md`

### Görevler

| # | İş | Repo |
|---|---|---|
| A0.1 | Arayüz reposu durum ve stack analizi | OD-N-ARAY-Z |
| A0.2 | `kod/` klasörü entegrasyon planı | OD-N-ARAY-Z |
| A0.3 | ODIN backend API envanteri | ODIN |
| A0.4 | `09-data-contracts.md` ile mevcut API karşılaştırması | ODIN |
| A0.5 | İsim çakışması taraması (`00-index.md` §3 sözlüğü) | ikisi |
| A0.6 | İki rapor dosyası üret | ikisi |

### Done

- [ ] `audit-frontend.md` var — 8 sorunun hepsi cevaplı
- [ ] `audit-backend.md` var — 11 sorunun hepsi cevaplı
- [ ] Hiçbir kod değişmemiş
- [ ] Emin olunmayan yerlere "BİLİNMİYOR" yazılmış, tahmin edilmemiş

⚠️ **Bu sprint atlanamaz.** Mevcut kodu bilmeden yazılan her şey çakışır.

---

## S1 — Token & Theme Katmanı

**Sorumlu:** Claude Code
**Ön koşul:** S0 bitti

### Görevler

| # | İş | Referans |
|---|---|---|
| — | **Bu sprintin kodu hazır: `kod/` klasörü.** Sıfırdan yazılmayacak, entegre edilecek | `kod/KURULUM.md` |
| A1.1 | Primitive token'ları CSS değişkeni olarak tanımla | ✅ `kod/tokens.css` |
| A1.2 | Semantic katmanı primitive'lere bağla | `11-...` §3 |
| A1.3 | Renk semantiğini sabitle (kırmızı/amber/mor/mavi/yeşil) | `11-...` §4 |
| A1.4 | Paleti uygula: `#070B14` / `#111827` / `#1E293B` + mor + turuncu | `11-...` §5 |
| A1.5 | **Typography System** — type scale, line height, `tabular-nums`, monospace | `11-...` §16 |
| A1.6 | Spacing, radius, blur, shadow, elevation token'ları | `11-...` §2, §10 |
| A1.7 | Glass token'ları + kısıt kuralları (max 2 katman) | `11-...` §11 |
| A1.8 | Motion token'ları (önerilen değerlerle) | `12-...` §2 |
| A1.9 | AI token'ları (`ai.surface`, `ai.glow`...) | `11-...` §13 |
| A1.10 | Chart token'ları | `11-...` §12 |
| A1.11 | Tailwind config'i semantic token'lardan üret | |
| A1.12 | Theme provider — Executive Dark | `11-...` §7 |
| A1.13 | **Lint kuralı:** hardcoded renk/spacing yasak | ✅ `kod/eslint-token-rule.md` |
| A1.14 | Storybook token showcase sayfası | |

### Done

- [ ] Hiçbir hardcoded renk yok, lint bunu yakalıyor
- [ ] `tabular-nums` çalışıyor — sayılar sütunda hizalanıyor
- [ ] Theme provider Dark ile çalışıyor
- [ ] Token showcase açılıyor ve tüm token'ları gösteriyor

⚠️ **Bu katman bitmeden hiçbir bileşen yazılmaz.** Yazılırsa hepsi yeniden
yazılır.

---

## S2 — App Shell

**Sorumlu:** Claude Code
**Ön koşul:** S1 bitti

### Görevler

| # | İş | Referans |
|---|---|---|
| A2.1 | `<AppShell>` — tek layout, sayfa değişiminde remount yok | `03-...` §1 |
| A2.2 | TopHeader — 4 görünür ikon + "more" menüsü | `04-...` §8 |
| A2.3 | Universe switcher (header sol üst) | UI-ADR-073 |
| A2.4 | LeftSidebar — hibrit menü, kategori etiketleri + düz maddeler | `04-...` §3 |
| A2.5 | Adaptive alt menü — aynı anda tek modül açık | `04-...` §4 |
| A2.6 | Sidebar daraltma + tercih kalıcılığı | `04-...` §6 |
| A2.7 | WorkspaceContainer — scroll yalnızca burada | `03-...` §1 |
| A2.8 | RightContextPanel — 4 durum (Closed/Preview/Expanded/Pinned) | `04-...` §11 |
| A2.9 | StatusBar — telemetri registry deseni, 6 kanal açık | UI-ADR-083 |
| A2.10 | Routing + Navigation Store (Zustand) | `04-...` §12 |
| A2.11 | Bağlam zinciri (breadcrumb) — tıklanabilir | `04-...` §5 |
| A2.12 | Command Palette `Ctrl+K` — global | `04-...` §9 |
| A2.13 | Workspace transition animasyonu — bağlam değişimi hissi | `12-...` §6 |
| A2.14 | Kullanım olayı kaydı (adaptive UI için, özellik kapalı) | UI-ADR-082 |

### Done

- [ ] Uygulama açılıyor
- [ ] Menüden her workspace'e gidilebiliyor (boş sayfa olsa da)
- [ ] `Ctrl+K` çalışıyor
- [ ] Context panel 4 durumu da çalışıyor
- [ ] Geri dönüşte scroll ve seçim korunuyor
- [ ] App Shell geçişte remount olmuyor
- [ ] `04-navigation-system.md` §12'deki 9 maddenin hepsi ✅

**🎉 Bu sprint sonunda ODIN ilk kez açılıyor.**

---

# FAZ B — BİLEŞENLER

## S3 — Core Components

**Sorumlu:** Claude Code + Claude Design (paralel)

### Sıra önemli

| # | Bileşen | Neden bu sırada |
|---|---|---|
| B3.1 | **Table / VirtualTable** | En çok kullanılan, en karmaşık |
| B3.2 | Button (8 variant × 5 size × 11 state) | Her yerde |
| B3.3 | Card | Her yerde |
| B3.4 | Input ailesi + Field Anatomy | `10-...` §8 |
| B3.5 | Search (ayrı primitive) | `10-...` §8.5 |
| B3.6 | Filter (ayrı primitive) | `10-...` §8.6 |
| B3.7 | Selection family (Checkbox/Radio/Toggle/Segmented) | |
| B3.8 | Modal / Drawer | Glass overlay burada |
| B3.9 | Badge / Tooltip / Avatar / Icon | |
| B3.10 | Skeleton — gerçek yerleşimi temsil eden | `12-...` §7 |
| B3.11 | EmptyState / ErrorState / LoadingState | `10-...` §11 |
| B3.12 | Chart temel seti (line, area, bar) | |
| B3.13 | Sparkline | KPI kartı için gerekli |
| B3.14 | Timeline | |
| B3.15 | Tabs (workspace header sekmeleri) | UI-ADR-072 |

### Her bileşen için zorunlu

- 11 durumun tamamı (`10-...` §6)
- Klavye ile tam kullanım
- `prefers-reduced-motion`
- Token'dan gelen değerler, hardcode yok
- Storybook kaydı
- `10-...` §14 şablonuyla dokümantasyon

### Done

- [ ] Storybook'ta 15 bileşen de var
- [ ] Hiçbiri token ihlali yapmıyor
- [ ] Klavye ile hepsi kullanılabiliyor
- [ ] Tablo 10.000 satırda akıcı (sanallaştırma çalışıyor)

---

## S4 — Executive Components ⭐

**Sorumlu:** Claude Code + Claude Design

Bunlar ODIN'i ODIN yapan bileşenler. Başka üründe yok.

| # | Bileşen | Referans |
|---|---|---|
| B4.1 | **ExecutiveKPICard** — katmanlı, kapalıyken sade | `05-...` §4 |
| B4.2 | **DecisionCard** — üzerinden onay verilebilen | `05-...` §3.2 |
| B4.3 | **DirectorCard** — heartbeat, anti-fake kuralıyla | `07-...` §12 |
| B4.4 | **AIBrief** — 5 adımlı format | `06-...` §1.3 |
| B4.5 | **AIRecommendationCard** — 7 alanlı explainability | `07-...` §7, §8 |
| B4.6 | **EvidenceChain** | `09-...` §5 |
| B4.7 | **ConfidenceBadge** | |
| B4.8 | **TrustSignal** (lastUpdated + source) | `02-...` §8 |
| B4.9 | **AlertStack** | |
| B4.10 | **OpportunityCard** | |
| B4.11 | **CouncilView** + ConsensusIndicator | `07-...` §4-6 |
| B4.12 | **MinorityOpinionBanner** | `07-...` §6 |
| B4.13 | **AIPulse** (3 kanallı, registry deseni) | UI-ADR-071, 083 |
| B4.14 | **TelemetryBar** | UI-ADR-083 |
| B4.15 | **HeartbeatIndicator** | |

### Kritik kurallar

- **Anti-fake:** Veri yoksa "veri yok" gösterilir. Sahte heartbeat, sahte
  confidence, sahte halka **yok.**
- Her AI bileşeni `accent.ai` mor glow alır (UI-ADR-069)
- Her veri bileşeni `meta` zarfını (`source`, `lastUpdated`) gösterir

### Done

- [ ] Storybook'ta 15 executive bileşen
- [ ] Boş veri durumunda hiçbiri sahte içerik üretmiyor
- [ ] KPI kartı kapalıyken sade, açıkken mini-rapor

---

# FAZ C — İLK EKRANLAR (mock veri)

## S5 — Executive Briefing + Mission Control

**Sorumlu:** Claude Design (tasarım) → Claude Code (kod)

| # | İş | Referans |
|---|---|---|
| C5.1 | Executive Briefing — Desktop/Dark high-fidelity tasarım | `05-...` §3 |
| C5.2 | Mission Control — Desktop/Dark tasarım | `05-...` §5 |
| C5.3 | **Senin onayın** — revizyon listesi | |
| C5.4 | Executive Briefing kod (mock veri) | |
| C5.5 | Mission Control kod (mock veri) | |
| C5.6 | Executive Intelligence Feed (sağ panel) | `05-...` §6 |
| C5.7 | Executive Timeline | `03-...` §16 |
| C5.8 | 0-3-10-30 saniye açılış deneyimi | `05-...` §2 |
| C5.9 | Loading / Empty / Error halleri | |

### Done

- [ ] Açılıştan brifinge < 10 saniye
- [ ] Attention Economy'ye uyuyor (1 hero, 3 primary)
- [ ] Layout shift yok
- [ ] `05-dashboard.md` §8'deki 8 kabul kriteri ✅

---

## S6 — Amazon Director ⭐ (referans modül)

**Sorumlu:** Claude Design → Claude Code

Bu modül diğer 7'nin şablonudur. Burada doğrulanan dil aynen kopyalanır.

| # | İş | Referans |
|---|---|---|
| C6.1 | Amazon Director tasarım — Desktop/Dark | `06-...` §1 |
| C6.2 | **Senin onayın** | |
| C6.3 | KPI Strip (8 metrik) | `06-...` §1.2 |
| C6.4 | Layer 1 Executive Glance | `06-...` §1.3 |
| C6.5 | Layer 2 Executive Intelligence (5 adımlı AI formatı) | |
| C6.6 | Layer 3 Deep Analysis | |
| C6.7 | SKU Health · Sales & Profit · Inventory · Orders · Alerts | `06-...` §1.4 |
| C6.8 | PPC Intelligence — 4 katman | `06-...` §1.5 |
| C6.9 | Opportunity Feed | `06-...` §1.6 |
| C6.10 | Sağ Context Panel — SKU seçilince | `06-...` §1.7 |

Hepsi mock veriyle.

### Done

- [ ] `06-workspaces.md` §1.8'deki 6 kalite kriteri ✅
- [ ] Tasarım dili Mission Control ile birebir aynı
- [ ] SKU seçildiğinde ekran değiştirmeden tüm detay görünüyor

---

# FAZ D — CANLI VERİ 🎯

**Bu fazın sonunda ODIN'i kullanmaya başlıyorsun.**

## S7 — State & Data Layer

| # | İş |
|---|---|
| D7.1 | React Query kurulumu + cache stratejisi |
| D7.2 | API Client — `DataEnvelope` zarfı zorunlu |
| D7.3 | Global Store (Zustand) — navigation, universe, ui state |
| D7.4 | Error handling — `10-...` §11 Error Pattern'e uygun |
| D7.5 | Loading state yönetimi — skeleton entegrasyonu |
| D7.6 | Freshness hesabı (`live` / `recent` / `stale`) |
| D7.7 | Real-time katmanı (WebSocket veya SSE) |
| D7.8 | Offline durumu |

### Done

- [ ] Her veri çağrısı `meta` (source + lastUpdated) taşıyor
- [ ] Hata durumunda kullanıcı "Error" değil, 5 adımlı açıklama görüyor
- [ ] Stale veri görsel olarak işaretleniyor

---

## S8 — Amazon Canlı Bağlantı

**Bu sprint biterse ODIN kullanılabilir hale gelir.**

| # | İş | Not |
|---|---|---|
| D8.1 | SP-API bağlantısı → Orders, Inventory, Sales & Traffic | Mevcut driver'dan geçiş |
| D8.2 | **Ads API bağlantısı** | S0'da yoksa bu sprint'te kurulacak |
| D8.3 | Fee / ücret verisi çekimi | Net kâr için zorunlu |
| D8.4 | **COGS giriş ekranı** — SKU başına maliyet | Amazon'da yok, sen gireceksin |
| D8.5 | Net kâr hesap motoru | `13-...` §4 |
| D8.6 | Mock verinin kaldırılması |
| D8.7 | Authentication |
| D8.8 | `universe_id` uygulaması (Lillu universe aktif) | S0'a bağlı |

### ⚠️ Net kâr kuralı

Kalemlerden biri eksikse **net kâr gösterilmez.** Yerine "Gross Profit
(ücretler hariç)" gösterilir ve neyin hariç olduğu yazılır. Yanlış bir kâr
rakamı, tüm ODIN'in güvenilirliğini bitirir.

### Done

- [ ] Amazon Director gerçek veriyle çalışıyor
- [ ] Net kâr doğru VEYA gösterilmiyor (uydurulmuyor)
- [ ] Executive Briefing gerçek KPI gösteriyor
- [ ] Bir hafta boyunca hata almadan açılıyor

## 🎯 **BURADA DURUP ODIN'İ KULLANMAYA BAŞLA**

Kalan fazlar sen kullanırken devam eder. Bu noktadan sonraki her sprint,
**gerçek kullanım geri bildirimiyle** şekillenir — bu, plandan gitmekten
çok daha değerlidir.

Bir hafta kullan, sonra devam et. Muhtemelen S9'un önceliği değişecek.

---

# FAZ E — AI CANLI

## S9 — AI Gateway + AI Özellikleri

| # | İş | Referans |
|---|---|---|
| E9.1 | **AI Gateway / Model Router** | `13-...` §1 |
| E9.2 | İş tipi sınıflandırma (küçük/orta/büyük) | |
| E9.3 | Model seçimi + hibrit sağlayıcı (yerel/OpenAI/Claude) | |
| E9.4 | Önbellek katmanı | |
| E9.5 | **Telemetri:** model, token, süre, maliyet, cache hit | UI-ADR-071 |
| E9.6 | `ai_queue` + `ai_cost` kanallarını `available: true` yap | UI-ADR-083 |
| E9.7 | AI Pulse Processing halkasını canlıya bağla | |
| E9.8 | AI Brief üretimi (Executive Briefing + Amazon) | `07-...` §7 |
| E9.9 | AIRecommendation — 7 alanlı, en az 2 alternatif zorunlu | `09-...` §3 |
| E9.10 | Confidence skoru — **gerçek kaynaktan** | `13-...` §9 |
| E9.11 | Evidence toplama ve saklama | |
| E9.12 | AI Assisted Input (Suggest/Rewrite/Summarize/Expand/Translate) | `10-...` §8.10 |

### ⚠️ Confidence kuralı

Skor gerçekten üretilemiyorsa **gösterilmez.** Sabit veya rastgele sayı
kesinlikle yasak. Kullanıcı bir kez sahte skor fark ederse hiçbir skora bir
daha güvenmez.

### Done

- [ ] AI Runtime sekmesinde token/maliyet görünüyor
- [ ] Her AI önerisi 7 alanı da taşıyor
- [ ] Hiçbir öneri 2 alternatiften az sunmuyor
- [ ] Confidence gerçek kaynaktan geliyor veya gösterilmiyor

---

# FAZ F — KALAN MODÜLLER

## S10 — Finance + Trading

| # | İş |
|---|---|
| F10.1 | **Finance Workspace tanımı** — Amazon Director seviyesinde |
| F10.2 | Finance tasarım + onay + kod |
| F10.3 | AI CFO ekibi (8 rol) |
| F10.4 | **Trading Workspace tanımı** |
| F10.5 | Trading tasarım + onay + kod |
| F10.6 | Trading universe verisi (XAU/USD, XAU/TRY, USD/TRY, EUR/TRY, prop hesaplar) |
| F10.7 | Cross Universe Intelligence — ilk kural (Trading kârı → Finance nakit akışı) |

⚠️ F10.1 ve F10.4 **tasarım işidir**, kod değil. Tanım olmadan kod yazılmaz.

---

## S11 — Decision Center + Knowledge + System

| # | İş | Referans |
|---|---|---|
| F11.1 | **Decision Engine** backend — decisions, events, relationships, scores | `13-...` §5 |
| F11.2 | Decision Center workspace | `06-...` §2 |
| F11.3 | Executive Decision DNA (12 alan) | |
| F11.4 | Decision Timeline + Relationships grafiği | |
| F11.5 | Executive Council + Debate + Minority Opinion | `07-...` §4-6 |
| F11.6 | Karar sonrası ölçüm işi (actualROI geri yazma) | `13-...` §5 |
| F11.7 | Knowledge Workspace | `06-...` §3 |
| F11.8 | Memory Workspace + 3 katmanlı hafıza | `07-...` §9 |
| F11.9 | Memory Classifier | `13-...` §3 |
| F11.10 | System Director + AI Runtime sekmesi | `06-...` §8 |
| F11.11 | ODIN HQ (universe genel bakış) | UI-ADR-073 |
| F11.12 | Projects + Automation workspace'leri | UI-ADR-079 |
| F11.13 | Settings |

---

# FAZ G — ÇOKLU CİHAZ

## S12 — Tablet + Mobile

| # | İş |
|---|---|
| G12.1 | Tablet: 8 kolon grid'e düşüş, aynı bileşenler |
| G12.2 | Tablet: tüm workspace'lerde test |
| G12.3 | Mobile companion: Executive Briefing (brief oku) |
| G12.4 | Mobile companion: Alerts (alarm gör) |
| G12.5 | Mobile companion: Decision onayı |
| G12.6 | Mobile navigasyon (sidebar → alt bar veya drawer) |
| G12.7 | Touch etkileşim gözden geçirme |

**Kalite hedefi:** "Çalışır durumda." Piksel cilalaması v1.1'de.

---

# FAZ H — SERTLEŞTİRME

## S13 — Production Hardening

| # | İş | Referans |
|---|---|---|
| H13.1 | Performans — 60 FPS doğrulama, virtualization kontrolü | `02-...` §14 |
| H13.2 | Accessibility — axe-core otomatik test | `02-...` §13 |
| H13.3 | Klavye haritası tamamlama | `04-...` §10 |
| H13.4 | Reduced motion tam denetimi | `12-...` §9 |
| H13.5 | Motion denetimi — 9 maddelik liste | `12-...` §12 |
| H13.6 | Token compliance taraması — hardcode yok | `11-...` §15 |
| H13.7 | Global Design Audit | `02-...` §15 |
| H13.8 | TypeScript hatası: 0 |
| H13.9 | ESLint hatası: 0 |
| H13.10 | Test kapsamı |
| H13.11 | Güvenlik kontrolü |
| H13.12 | Canary kullanım — 1 hafta |
| H13.13 | 🚀 v1.0 etiketi |

---

# Sprint Onay Ritüeli

Her sprint sonunda **sen** şu beş soruyu soruyorsun:

```
1. Çalışıyor mu?
2. Responsive mi?
3. Hata var mı?
4. Mimariye uygun mu?
5. Merge edilmeye hazır mı?
```

**Beşi de "Evet" olmadan sonraki sprinte geçilmez.**

Bu tek kural, projenin bitip bitmemesini belirleyecek. Şimdiye kadarki en
büyük hata "bir sonraki işi bitirelim" diyerek ilerlemekti — o yöntem işi
bitirmez, kapsamı büyütür (UI-ADR-063).

---

# Görev Formatı

Her görev bu dört alanı taşır. Taşımıyorsa görev değil, dilektir.

```
Girdi:    Ne kullanılacak?
Çıktı:    Ne teslim edilecek?
Kontrol:  Nasıl doğrulanacak?
Done:     Hangi şartlarda tamamlandı sayılacak?
```

---

# İlerleme Takibi

```
FAZ A  İSKELET
  ⬜ S0   Repo Audit
  ⬜ S1   Token & Theme
  ⬜ S2   App Shell              → uygulama açılıyor

FAZ B  BİLEŞENLER
  ⬜ S3   Core Components
  ⬜ S4   Executive Components

FAZ C  İLK EKRANLAR
  ⬜ S5   Briefing + Mission Control
  ⬜ S6   Amazon Director

FAZ D  CANLI VERİ
  ⬜ S7   State & Data Layer
  ⬜ S8   Amazon canlı           → 🎯 KULLANMAYA BAŞLA

FAZ E  AI
  ⬜ S9   AI Gateway + AI özellikleri

FAZ F  MODÜLLER
  ⬜ S10  Finance + Trading
  ⬜ S11  Decision + Knowledge + System

FAZ G  CİHAZLAR
  ⬜ S12  Tablet + Mobile

FAZ H  RELEASE
  ⬜ S13  Hardening              → 🚀 v1.0
```

**Toplam: 14 sprint.**

---

# v1.1 Yapılacaklar (v1.0'dan sonra)

| Madde | Kaynak |
|---|---|
| Light tema (tüm ekranlar) | UI-ADR-075 |
| Tablet + Mobile piksel cilalaması | UI-ADR-075 |
| Varyant başına ayrı loading/empty/error tasarımı | UI-ADR-075 |
| Adaptive UI'ı aç (3 kuralla) | UI-ADR-082 |
| Voice Workspace | UI-ADR-080 |
| Kalan telemetri kanalları | UI-ADR-083 |
| Visual Regression Pipeline | `10-...` §16 |
| Figma → kod token otomasyonu | `10-...` §16 |

# v2 Backlog

Strategy Workspace · ODIN Project Intelligence · Security/Legal/Marketing
Director'ları · CRM Workspace · Presentation/Wallboard/High Contrast temaları

---

# Bir Son Not

Bu plan 14 sprint gösteriyor ama **8. sprintte ODIN'i kullanmaya
başlıyorsun.** Kalan 6 sprint, sen zaten her gün kullanırken devam ediyor.

Bu bilinçli bir tercih. "Her şey bitince kullanırım" yaklaşımı, bu projenin
şimdiye kadarki en büyük riskiydi — bitmeyen mükemmelleştirme döngüsü.
FAZ D bir duraktır, oradan sonrası zaten çalışan bir ürünün geliştirilmesidir.

Gerçek kullanım, en iyi plandan daha iyi yol gösterir. S8'den sonra bu planın
kalanı muhtemelen değişecek — ve bu iyi bir şey olacak.
