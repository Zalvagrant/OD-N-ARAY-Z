# PROMPTLAR — Claude Code için hazır komutlar

Her sprint için tam prompt aşağıda. **Kopyala, yapıştır, gönder.**
Başka bir şey yazman gerekmiyor.

**Kullanım kuralı:** Sırayla git. Bir sprint bitmeden diğerine geçme.
Her sprintin sonunda Claude Code sana beş soruyu cevaplayacak; beşi de
"evet" değilse aynı sprintte kal.

---

# 📋 İÇİNDEKİLER

| Sprint | Konu | Sonunda ne olur |
|---|---|---|
| [S1](#s1) | Token & Theme | Renk sistemi çalışır |
| [S2](#s2) | App Shell | **Uygulama ilk kez açılır** |
| [S3](#s3) | Core Components | Tablo, buton, kart hazır |
| [S4](#s4) | Executive Components | KPI kartı, karar kartı hazır |
| [S5](#s5) | Briefing + Mission Control | İlk gerçek ekranlar |
| [S6](#s6) | Amazon Director | Referans modül |
| [S7](#s7) | State & Data Layer | Veri katmanı |
| [S8](#s8) | Amazon canlı veri | **🎯 KULLANMAYA BAŞLA** |
| [S9](#s9) | AI Gateway | AI canlı |
| [S10](#s10) | Finance + Trading | |
| [S11](#s11) | Decision + Knowledge + System | |
| [S12](#s12) | Tablet + Mobile | |
| [S13](#s13) | Hardening | **🚀 v1.0** |

---
---

<a name="s1"></a>
# S1 — TOKEN & THEME KATMANI

```
CLAUDE.md ve docs/ui_chatgpt/15-execution-plan.md dosyalarını oku.
Ayrıca docs/ui_chatgpt/11-design-tokens.md ve docs/ui_chatgpt/kod/KURULUM.md
dosyalarını oku.

Şu an S1 — Token & Theme Katmanı sprintindeyiz. Bu repo tamamen boş,
temiz başlangıç yapıyoruz.

YAPILACAKLAR:

1. Next.js projesi kur:
   - App Router
   - TypeScript (strict mode)
   - Tailwind CSS
   - src/ dizin yapısı
   - ESLint

2. docs/ui_chatgpt/kod/ klasöründeki 6 dosyayı projeye entegre et.
   Hedef yollar (KURULUM.md'deki öneri):
   - tokens.css            → src/styles/tokens.css
   - tailwind.config.ts    → proje kökü (mevcut config ile birleştir)
   - theme-provider.tsx    → src/components/layout/theme-provider.tsx
   - motion.ts             → src/animations/motion.ts
   - telemetry-registry.ts → src/lib/telemetry/registry.ts
   - data-envelope.ts      → src/types/data-envelope.ts

   ÖNEMLİ: Bu dosyaların İÇERİĞİNİ DEĞİŞTİRME. Sadece import yollarını
   projeye uydur. Bir şeyin yanlış olduğunu düşünüyorsan bana söyle,
   kendi başına düzeltme.

3. tokens.css'i global stile import et (src/app/globals.css).
   Sıralama önemli: tokens.css EN ÖNCE gelmeli.

4. ThemeProvider'ı app root layout'una sar.
   Varsayılan tema: executive-dark

5. Storybook kur. Bir "Design Tokens" showcase sayfası oluştur:
   - Tüm semantic renkleri kare olarak göster (isim + değer)
   - Spacing ölçeğini görsel olarak göster
   - Elevation seviyelerini (e1..e4, overlay, modal) göster
   - Glass sınıflarını göster
   - Typography ölçeğini göster (xs'ten 4xl'e)
   - AI token'larını göster (.odin-ai-region sınıfı dahil)
   - Chart renk serisini göster

6. ESLint kurallarını ekle:
   docs/ui_chatgpt/kod/eslint-token-rule.md dosyasındaki kuralları uygula.
   Hardcoded renk ve ölçü yazımını engellemeli.

DOĞRULAMA (her birini test et ve sonucu raporla):
- bg-surface, text-content, border-line sınıfları çalışıyor mu?
- text-ai, bg-danger, bg-warning sınıfları doğru rengi veriyor mu?
- .odin-num sınıfı sayıları sağa hizalayıp tabular-nums uyguluyor mu?
- prefers-reduced-motion açıkken animasyon süreleri 1ms'ye düşüyor mu?
- className="bg-[#111827]" yazınca ESLint hata veriyor mu?
- Storybook açılıyor ve tüm token'lar görünüyor mu?
- npm run build hatasız geçiyor mu?
- TypeScript hatası var mı?

BİTİRİNCE:
Şu beş soruyu tek tek cevapla:
1. Çalışıyor mu?
2. Responsive mi?
3. Hata var mı?
4. Mimariye uygun mu?
5. Merge edilmeye hazır mı?

Ayrıca kurduğun paketlerin listesini ve versiyonlarını yaz.

Plan üretme. Kod üret.
```

---
---

<a name="s2"></a>
# S2 — APP SHELL

```
docs/ui_chatgpt/03-information-architecture.md ve
docs/ui_chatgpt/04-navigation-system.md dosyalarını oku.

S2 — App Shell sprintindeyiz. Bu sprint sonunda uygulama ilk kez
açılacak ve gezilebilir olacak.

YAPILACAKLAR:

1. AppShell bileşeni (03-...md §1):
   <AppShell>
     <TopHeader />
     <LeftSidebar />
     <Workspace />          ← tek scroll bölgesi
     <RightContextPanel />
     <ExecutiveTimeline />
     <StatusBar />
   </AppShell>

   KRİTİK: Sayfa değişiminde AppShell yeniden mount OLMAYACAK.
   Next.js App Router'da bunu layout ile çöz.

2. TopHeader (04-...md §8):
   SOL:  ODIN logo · Current Mission · Executive Mode · Universe seçici
   ORTA: Neural Search (global) · tek birleşik AI Pulse göstergesi
   SAĞ:  4 görünür ikon → Alerts · Tasks · AI Status · Profile
         "More" menüsünde → Notifications · Messages · System Health

   Weather ve Time YOK (UI-ADR-076 ile kaldırıldı).

3. LeftSidebar — hibrit menü (04-...md §3):
   Kategori başlıkları TIKLANAMAZ etikettir, açılır menü değil.

   ─────────────────────────
     Mission Control          ← sabit, kategorisiz, en üstte
   ─────────────────────────
     EXECUTIVE
       Executive Briefing
       Decision Center
   ─────────────────────────
     BUSINESS
       Amazon
       Finance
       Trading
   ─────────────────────────
     INTELLIGENCE
       Knowledge
       Memory
   ─────────────────────────
     OPERATIONS
       Projects
       Automation
   ─────────────────────────
     SYSTEM
       System
       Settings
   ─────────────────────────

   NOT: "AI Core" menüde YOK (UI-ADR-077).
        "Executive Director" YOK (UI-ADR-078).
        ODIN HQ, Mission Control'ün üstünde olacak (UI-ADR-073).

4. Adaptive alt menü (04-...md §4):
   - Aktif modülün alt menüsü genişler
   - Aynı anda EN FAZLA BİR modül açık
   - Modül değişince önceki otomatik kapanır

5. Sidebar daraltma:
   - Açık/ikon modu geçişi
   - İkon modunda hover'da tooltip
   - Tercih localStorage'da kalıcı

6. Director durum noktası (04-...md §6):
   Her menü öğesinin yanında küçük durum noktası.
   ŞİMDİLİK: Gerçek veri yok, o yüzden nokta GÖSTERME.
   Sahte durum uydurma (CLAUDE.md kural 2).
   Bileşeni yaz ama veri gelene kadar render etme.

7. RightContextPanel (04-...md §11):
   4 durum: Closed → Preview → Expanded → Pinned
   Tüm modüller AYNI bileşeni kullanacak.

8. StatusBar:
   src/lib/telemetry/registry.ts'ten activeTelemetryChannels() çağır.
   SADECE available:true olanları çiz.
   Şu an 4 kanal açık (last_sync, api_traffic, background_jobs, error_count).
   Veri henüz yok → "—" göster, sahte sayı üretme.

9. Routing + Navigation Store (Zustand):
   - Tek kaynak: navigation store
   - Hiçbir bileşen kendi route state'ini tutmayacak
   - Bağlam zinciri (breadcrumb) header'da, tıklanabilir
   - Geri dönüşte önceki bağlamın scroll ve seçim durumu korunur

10. Command Palette (04-...md §9):
    - Ctrl+K / Cmd+K ile global açılır
    - Navigasyon komutları (her workspace'e git)
    - Aktif workspace'in komutları listenin başında
    - Glass overlay kullan (glass-modal)

11. Workspace transition (12-...md §6):
    - "Sayfa geçişi" değil "bağlam değişimi" hissi
    - App Shell (header/sidebar/statusbar) animasyon ALMAZ
    - Sadece Workspace içeriği geçiş yapar
    - src/animations/motion.ts'ten workspaceTransition kullan

12. Kullanım olayı kaydı (UI-ADR-082):
    Adaptive UI v1.0'da KAPALI. Ama olayları şimdiden kaydet:
    hangi workspace, hangi saat, ne kadar süre kalındı.
    localStorage veya basit bir store yeterli. Özelliği AÇMA.

13. Her workspace için boş placeholder sayfa oluştur.
    İçinde sadece workspace adı ve "Bu ekran S5+ sprintlerinde gelecek"
    notu olsun. EmptyState pattern'ine uygun (10-...md §11).

DOĞRULAMA (04-...md §12'deki 9 madde):
- Tek AppShell var, sayfa değişiminde remount olmuyor mu?
- Sidebar açık/daraltılmış modda çalışıyor, tercih kalıcı mı?
- Aktif menü öğesi doğru vurgulanıyor mu?
- Adaptive alt menü çalışıyor (aynı anda tek modül açık) mu?
- Command Palette Ctrl+K ile açılıyor mu?
- Context Panel dört durumu da destekliyor mu?
- Bağlam zinciri header'da görünüyor ve tıklanabiliyor mu?
- Geri dönüşte scroll ve seçim durumu korunuyor mu?
- Navigation Store tek kaynak mı?
- Klavye ile tüm menüde gezilebiliyor mu?
- Hiçbir yerde sahte veri gösterilmiyor mu?

BİTİRİNCE beş soruyu cevapla.
Ekran görüntüsü açıklaması ver: uygulama açıldığında ne görünüyor?

Plan üretme. Kod üret.
```

---
---

<a name="s3"></a>
# S3 — CORE COMPONENTS

```
docs/ui_chatgpt/10-component-library.md dosyasını oku.
docs/ui_chatgpt/12-motion-system.md dosyasını oku.

S3 — Core Components sprintindeyiz.

ÖNEMLİ — SIRA DEĞİŞMEZ. Önce Typography, sonra Table.
Gerekçe: veri yoğun bir Executive sistemde en çok kullanılan iki şey bunlar.

YAPILACAKLAR — sırayla:

1. TYPOGRAPHY SYSTEM (11-...md §16)
   Eksik olan kısmı tamamla:
   - Type scale bileşenleri (Heading, Text, Label, Caption)
   - Number bileşeni — ZORUNLU tabular-nums, sağa hizalı
   - Mono bileşeni — SKU, ID, kod için
   - Responsive typography kuralları

2. TABLE / VirtualTable
   TanStack Table ile:
   - Sanallaştırma (10.000 satırda akıcı olmalı)
   - Sıralama, filtreleme
   - Sayı sütunları otomatik sağa hizalı + tabular-nums
   - Sticky header
   - Satır seçimi → Context Panel'i besler
   - Density: comfortable / compact / dense
   - Loading: skeleton GERÇEK YERLEŞİMİ temsil etsin
   - Empty state: açıklama + öneri + sonraki adım
   - Klavye ile gezinme (ok tuşları, Enter, Esc)

3. Button — 8 variant × 5 size × 11 state
   Variant: Primary Secondary Tertiary Ghost Danger Success Warning Info
   Size: XS SM MD LG XL
   State: Default Hover Pressed Focus Disabled Loading Empty Error
          Success Offline ReadOnly

4. Card

5. Input ailesi + Field Anatomy (10-...md §8.2)
   Label → Description → Field → Helper Text → Validation → Action
   Yaşam döngüsü: Idle → Focused → Typing → Validating → Valid|Invalid → Saved

6. Search — AYRI PRIMITIVE (10-...md §8.5)
   Input DEĞİL. Kendi davranışı var:
   sonuç sayısı, debounce, geçmiş, kısayollar, Command Palette entegrasyonu

7. Filter — AYRI PRIMITIVE (10-...md §8.6)
   Query oluşturur, veri girmez.

8. Selection family: Checkbox · Radio · Toggle · SegmentedControl
   Hepsi aynı seçim mantığını paylaşır.

9. Modal / Drawer
   Glass overlay burada kullanılır (glass-modal).

10. Badge · Tooltip · Avatar · Icon (Lucide)

11. Skeleton — gerçek yerleşimi temsil eden (12-...md §7)
    Layout shift OLMAYACAK.

12. EmptyState / ErrorState / LoadingState (10-...md §11)
    Error pattern: Ne oldu → Neden oldu → Etkisi → Çözüm → [Retry]
    Kullanıcı asla sadece "Error" görmeyecek.

13. Chart temel seti (Recharts veya benzeri):
    Line, Area, Bar. Chart token'larını kullan.

14. Sparkline — KPI kartı için gerekli

15. Timeline

16. Tabs — workspace header sekmeleri için (UI-ADR-072)

HER BİLEŞEN İÇİN ZORUNLU:
- 11 durumun tamamı (desteklenmeyeni gerekçeleriyle belgele)
- Klavye ile tam kullanım, görünür focus
- prefers-reduced-motion desteği
- Renkten bağımsız durum göstergesi (sadece renkle anlam taşıma)
- Tüm değerler token'dan — hardcode YOK
- Storybook kaydı
- 10-...md §14 şablonuyla dokümantasyon

DOĞRULAMA:
- Storybook'ta 16 bileşen de var mı?
- Tablo 10.000 satırda akıcı mı? (FPS ölç)
- Hiçbiri token ihlali yapmıyor mu? (lint temiz mi)
- Klavye ile hepsi kullanılabiliyor mu?
- Sayılar sütunda hizalanıyor mu?
- Skeleton layout shift üretmiyor mu?

BİTİRİNCE beş soruyu cevapla.

Plan üretme. Kod üret.
```

---
---

<a name="s4"></a>
# S4 — EXECUTIVE COMPONENTS

```
docs/ui_chatgpt/05-dashboard.md §4 (KPI anatomisi) oku.
docs/ui_chatgpt/07-ai-directors.md oku.
docs/ui_chatgpt/09-data-contracts.md oku.

S4 — Executive Components sprintindeyiz.
Bunlar ODIN'i ODIN yapan bileşenler. Başka üründe yok.

EN ÖNEMLİ KURAL — ANTI-FAKE:
Her bileşen render öncesi src/types/data-envelope.ts'teki canRender()
fonksiyonunu çağırır. Veri yoksa "veri yok" durumu gösterir.
Sahte heartbeat, sahte confidence, sahte halka KESİNLİKLE YOK.
Bu kural ihlal edilirse tüm ürünün güvenilirliği çöker.

YAPILACAKLAR:

1. ExecutiveKPICard (05-...md §4) ⭐ en önemli bileşen
   Katmanlı yapı — kapalıyken KPI kartı kadar sade,
   açıkken mini-rapor kadar zengin:

   Level 1 (her zaman görünür):
     metrik adı · değer · trend (yön + %) · sparkline
   Level 2 (açılınca):
     AI yorumu · confidence · forecast · risk
   Level 3:
     recommended action · evidence sayısı · owner · lastUpdated

   Veri tipi: ExecutiveKPI (09-...md §1)

2. DecisionCard (05-...md §3.2)
   Priority · Title · Executive Summary · Financial Impact · Risk
   Confidence · Evidence Count · Recommendation
   [Approve] [Open Analysis]

   KRİTİK: Approve butonu KARTIN ÜZERİNDE. CEO karar vermek için
   başka ekrana gitmek zorunda değil.

3. DirectorCard (07-...md §12)
   STATUS · Current Goal · Confidence · Tasks · Evidence
   Memory · Prediction · Heartbeat

   ANTI-FAKE: lastBeat, beatIntervalMs*3'ten eskiyse kart "offline"
   durumuna düşer ve heartbeat animasyonu DURUR.

4. AIBrief — 5 adımlı format (06-...md §1.3)
   📊 Numbers → 🔍 Analysis → 🧠 Interpretation
   → 🎯 Recommendation → 📑 Evidence

5. AIRecommendationCard (07-...md §7, §8)
   7 alanlı explainability zorunlu:
   whyGenerated · evidence · confidence · responsibleDirector
   relatedKnowledge · lastValidated · potentialRisks · alternatives

   KURAL: alternatives.length >= 2 değilse bileşen RENDER ETMEZ.
   Tek seçenek sunan AI önerisi karar desteği değil, dayatmadır.

6. EvidenceChain (09-...md §5)
   supportsOrContradicts alanını görsel olarak ayırt et.

7. ConfidenceBadge
   Skor yoksa GÖSTERME. canShowConfidence() kullan.

8. TrustSignal — her veri bileşeninde zorunlu
   source + lastUpdated + freshness göstergesi

9. AlertStack
   requiresAction:false olan öğe LİSTEYE GİRMEZ.

10. OpportunityCard

11. CouncilView + ConsensusIndicator (07-...md §4-6)
    Consensus · Disagreement · Evidence Quality · Financial Risk
    · Execution Complexity

12. MinorityOpinionBanner (07-...md §6)
    ASLA katlanıp gizlenmez, her zaman karar kartında görünür —
    ama görsel olarak bastırılmış (nötr ton, amber değil).

13. AIPulse — 3 kanallı (UI-ADR-071)
    src/lib/telemetry/registry.ts'ten activePulseChannels() çağır.
    SADECE available:true olanları çiz: processing, memory_knowledge,
    prediction. Diğer 4 kanalı ÇİZME.

14. TelemetryBar

15. HeartbeatIndicator

TÜM AI BİLEŞENLERİ:
- accent.ai mor glow alır (UI-ADR-069 hibrit kuralı)
- .odin-ai-region sınıfını kullan
- Kullanıcı bir bilginin AI üretimi mi ham veri mi olduğunu
  bir bakışta anlamalı

DOĞRULAMA:
- Storybook'ta 15 executive bileşen var mı?
- Boş veri durumunda hiçbiri sahte içerik üretmiyor mu?
- KPI kartı kapalıyken sade, açıkken zengin mi?
- 2'den az alternatifi olan AI önerisi render ediliyor mu? (edilmemeli)
- Confidence üretilmemişse badge görünüyor mu? (görünmemeli)
- Her veri bileşeni TrustSignal gösteriyor mu?

BİTİRİNCE beş soruyu cevapla.

Plan üretme. Kod üret.
```

---
---

<a name="s5"></a>
# S5 — EXECUTIVE BRIEFING + MISSION CONTROL

```
docs/ui_chatgpt/05-dashboard.md dosyasını tamamen oku.

S5 sprintindeyiz. İlk gerçek ekranlar. MOCK VERİ kullanacağız.

MOCK VERİ KURALI:
Mock veri src/mocks/ altında, gerçek veriden AÇIKÇA ayrılabilir olacak.
Her mock kaydın meta.source alanı "mock" olacak.
Arayüzde geliştirme modunda küçük bir "MOCK DATA" rozeti görünecek.
Böylece S8'de gerçek veriye geçerken hiçbir mock unutulmayacak.

YAPILACAKLAR:

1. Executive Briefing workspace (05-...md §3):

   Hero Section:
     Good Morning (saate göre) · Executive Summary · Today's Mission
     Current Focus · System Status · AI Readiness
     → Ekranın TEK Hero Element'i (Attention Economy: en fazla 1)

   Critical Decisions:
     DecisionCard listesi, öncelik sırasında

   Critical Risks:
     Risk skoruna göre otomatik sıralı

   Opportunities:
     Risklerle EŞİT görsel ağırlıkta.
     Sadece risk gösteren sistem korku üretir; ODIN denge kurar.

   Executive KPIs:
     Revenue · Net Profit · Cash Flow · Amazon · Inventory
     · AI Confidence · Knowledge Health · Memory Health
     · Decision Confidence

   Director Activity:
     Executive · Amazon · Finance · Trading · Knowledge · Reasoning
     (UI-ADR-074 ile dondurulmuş liste — başkasını ekleme)

2. Mission Control workspace (05-...md §5):
   Primary Focus: Mission Board
   Mission Cards · Operational Status · Current Objectives
   · Active Projects · Upcoming Deadlines · Director Coordination
   · Resource Allocation · Automation Queue · Executive Alerts

3. Executive Intelligence Feed — sağ panel (05-...md §6):
   10 kategori var ama aynı anda EN FAZLA 5-6 öğe görünür.
   Yeni öğe yumuşak giriş animasyonuyla belirir.
   ASLA bildirim sesi veya dikkat çeken animasyon YOK.

4. Executive Timeline (03-...md §16)

5. Açılış deneyimi (05-...md §2) — 0-3-10-30 saniye:
   0-3 sn:   Sistem durumları sırayla canlanır (popup DEĞİL,
             sessiz durum animasyonları)
   3-10 sn:  Executive Briefing oluşur
   10-30 sn: AI özet metni görünür

   Skeleton gerçek yerleşimi temsil eder, layout shift YOK.

6. Loading / Empty / Error halleri — her bölüm için

DOĞRULAMA (05-...md §8):
- Açılıştan brifinge geçen süre 10 saniyenin altında mı? (ÖLÇ)
- Attention Economy'ye uyuyor mu? (1 hero, en fazla 3 primary kart)
- Her KPI kartı katmanlı ve kapalıyken sade mi?
- Her karar kartından doğrudan onay verilebiliyor mu?
- Risk ve fırsat eşit görsel ağırlıkta mı?
- Hiçbir AI göstergesi sahte veri ile beslenmiyor mu?
- Skeleton layout shift üretmiyor mu?
- Bir CEO 30 saniyede durumu anlayıp bir kararı onaylayabilir mi?

BİTİRİNCE beş soruyu cevapla.
Ekranın nasıl göründüğünü detaylı anlat.

Plan üretme. Kod üret.
```

---
---

<a name="s6"></a>
# S6 — AMAZON DIRECTOR (referans modül)

```
docs/ui_chatgpt/06-workspaces.md §1'i tamamen oku.

S6 sprintindeyiz. Bu modül diğer 7'nin ŞABLONU olacak.
Burada doğrulanan tasarım dili aynen kopyalanacak.
Bu yüzden özellikle dikkatli ol.

Hâlâ MOCK VERİ.

YAPILACAKLAR:

1. Yerleşim (06-...md §1.1):
   Header → Executive KPI Strip → 3 kolon grid:
   SKU Health    | Sales & Profit Analytics | AI Insights
   Inventory     | PPC Performance          | BuyBox
   Orders        | Opportunity Feed         | Alerts

2. KPI Strip:
   Net Sales · Net Profit · ACOS · TACOS · ROAS
   · Active SKUs · Inventory Value · BuyBox Rate
   Her biri trend + önceki dönem karşılaştırması + risk durumu ile

   ⚠️ NET PROFIT UYARISI:
   Net kâr hesaplanamıyorsa GÖSTERME. Yerine "Gross Profit
   (ücretler hariç)" göster ve neyin hariç olduğunu açıkça yaz.
   Yanlış bir kâr rakamı tüm ODIN'in güvenilirliğini bitirir.

3. Üç katmanlı okuma (06-...md §1.3):
   Layer 1 — Executive Glance (10-15 sn):
     Amazon Health Score · Revenue · Net Profit · Orders · ACOS
     · TACOS · Buy Box · Inventory Health · Top Risk
     · Top Opportunity · Mission Progress
     GRAFİK KARMAŞASI YOK. Sadece en kritik bilgiler.

   Layer 2 — Executive Intelligence (30-60 sn):
     5 adımlı sabit format (AIBrief bileşeni)

   Layer 3 — Deep Analysis (talep üzerine):
     Timeline · Trend · Forecast · Compare · Decision History
     · AI Reasoning · Related Missions/Decisions/Documents/Directors

4. Ana modüller (06-...md §1.4):
   SKU Health · Sales & Profit · Inventory Intelligence
   · Orders · Alerts

   Alerts kuralı: SADECE aksiyon gerektiren olaylar.
   requiresAction:false olan öğe listeye girmez.

5. PPC Intelligence Center — 4 katman (06-...md §1.5):
   Katman 1 — Executive PPC Overview:
     PPC Health · Spend · Sales · ACOS · ROAS · Profit After Ads
     (Profit After Ads ayırt edici metrik — reklam değil KÂR metriği)

   Katman 2 — AI Campaign Intelligence:
     Her kampanya için durum: healthy / acos_rising /
     budget_exhausting / scalable / underperforming

   Katman 3 — Opportunity Center:
     Sadece sorunları değil KAZANÇ FIRSATLARINI da göster

   Katman 4 — Executive Simulator:
     "PPC bütçesini %15 artırırsak ne olur?" → senaryo tablosu
     ZORUNLU: assumptions[] alanı gösterilecek.
     Varsayımları gösterilmeyen simülasyon, açıklanmamış AI çıktısıdır.

     NOT: Gerçek simülasyon motoru yok. Şimdilik mock.
     UI'ı yaz ama "SİMÜLASYON — MOCK" etiketi koy.

6. Opportunity Feed (06-...md §1.6)

7. Sağ Context Panel — SKU seçilince (06-...md §1.7):
   SKU Summary → Financial Metrics → Advertising → Inventory
   → History → AI Recommendation → Actions
   Kullanıcı ekran değiştirmeden tüm detayları görür.

DOĞRULAMA (06-...md §1.8):
- Mission Control tasarım dili birebir korunuyor mu?
- Aynı component kütüphanesi kullanılıyor mu?
- Aynı grid sistemi mi?
- Sağ panel davranışı S2'deki ile aynı mı?
- AI önerileri kanıtlarla destekleniyor mu?
- SKU seçilince ekran değiştirmeden tüm detay görünüyor mu?
- Net kâr hesaplanamıyorsa gösterilmiyor mu?
- Simülasyon "mock" olarak etiketlenmiş mi?

BİTİRİNCE beş soruyu cevapla.
Bu modül şablon olacağı için: diğer workspace'lere kopyalanabilir
hangi parçaları soyutladın, onu da anlat.

Plan üretme. Kod üret.
```

---
---

<a name="s7"></a>
# S7 — STATE & DATA LAYER

```
docs/ui_chatgpt/09-data-contracts.md dosyasını tamamen oku.

S7 sprintindeyiz. Veri katmanı. Hâlâ mock veri ile çalışıyoruz
ama gerçek veriye geçişe hazır altyapıyı kuruyoruz.

YAPILACAKLAR:

1. React Query kurulumu:
   - Cache stratejisi (modüle göre stale time)
   - Retry politikası
   - Background refetch kuralları
     (Executive Timing: KPI güncellemesi dikkat dağıtmayacak şekilde)

2. API Client:
   - Tüm yanıtlar DataEnvelope<T> zarfında
   - meta olmadan gelen veri REDDEDİLİR
   - src/types/data-envelope.ts'teki tipleri kullan

3. Global Store (Zustand):
   - navigation state
   - universe state (aktif evren)
   - UI state (sidebar, context panel, tema)
   - Hiçbir bileşen kendi global state'ini tutmaz

4. 09-data-contracts.md'deki TÜM tipleri TypeScript'e çevir:
   ExecutiveKPI · Decision · AIRecommendation · DirectorHeartbeat
   · EvidenceRef · Alert · Opportunity · AmazonSnapshot
   · PPCOverview · CampaignIntelligence · SimulationResult
   · AIPulse · SystemHealth · TelemetryStream
   · Money · Alternative · DirectorOpinion · DecisionScore

   Zod ile runtime validation ekle. Sözleşmeyi ihlal eden veri
   arayüze ULAŞMAZ.

5. Freshness hesabı:
   computeFreshness() kullan. Modüle göre eşik:
   trading 30sn/5dk · amazon 15dk/1sa · finance 1sa/24sa

6. Error handling:
   10-...md §11 Error Pattern'e uygun.
   Ne oldu → Neden oldu → Etkisi → Çözüm → [Retry]
   Kullanıcı asla sadece "Error" görmez.

7. Loading state yönetimi:
   Skeleton entegrasyonu, layout shift yok

8. Offline durumu:
   Bağlantı kesilince stale veri gösterilir ama AÇIKÇA işaretlenir

9. Real-time katmanı:
   WebSocket veya SSE. Şimdilik altyapı — bağlantı S8'de.

10. Mock → gerçek geçiş anahtarı:
    Tek bir yerden mock/gerçek modu değiştirilebilmeli.
    Mock modda "MOCK DATA" rozeti görünmeli.

DOĞRULAMA:
- Her veri çağrısı meta (source + lastUpdated) taşıyor mu?
- meta olmayan veri reddediliyor mu?
- Zod validation sözleşme ihlalini yakalıyor mu?
- Hata durumunda kullanıcı 5 adımlı açıklama görüyor mu?
- Stale veri görsel olarak işaretleniyor mu?
- Tek anahtarla mock/gerçek geçişi yapılabiliyor mu?

BİTİRİNCE beş soruyu cevapla.

Plan üretme. Kod üret.
```

---
---

<a name="s8"></a>
# S8 — AMAZON CANLI VERİ 🎯

```
docs/ui_chatgpt/13-backend-recommendations.md §4'ü oku.

S8 sprintindeyiz. BU SPRINT BİTİNCE ODIN'İ KULLANMAYA BAŞLIYORUM.
Mock veri kalkacak, gerçek Amazon verisi gelecek.

ÖNEMLİ BAĞLAM:
ODIN backend'i ayrı repoda (Zalvagrant/ODIN), Python stdlib-only.
Zaten çalışan bir localhost sunucusu var: odin/cockpit.py
Endpoint'ler: GET /api/state, /api/events, /api/tasks,
POST /api/command
Sunucu 127.0.0.1'e bağlı — DIŞARI AÇMA, güvenlik kararı.

odin/spapi.py içinde SpApiAdapter zaten var.

YAPILACAKLAR:

1. ODIN'in /api/state endpoint'ine bağlan.
   Dönen veriyi DataEnvelope zarfına sar.
   Zod ile doğrula.

2. Mevcut endpoint'in verdiği veriyi 09-data-contracts.md'deki
   tiplerle eşle. EKSİK OLANLARI RAPORLA — kendin uydurma.

3. Eksik veri için ODIN tarafında ne gerektiğini listele:
   - Hangi yeni endpoint gerekli?
   - Hangi mevcut endpoint genişletilmeli?
   Bunu docs/ui_chatgpt/backend-istekleri.md dosyasına yaz.

   ⚠️ ODIN reposuna KENDİN DOKUNMA. Orada ADR-0050 governance
   süreci var (R-006 request registry). Sadece listele, ben
   halledeceğim.

4. COGS giriş ekranı:
   Amazon ürün maliyetini vermiyor. Kullanıcı girecek.
   - SKU başına maliyet girişi
   - Toplu import (CSV)
   - Tarih bazlı maliyet geçmişi (maliyet değişirse)
   Configuration Workspace altında.

5. Net kâr hesap motoru:
   Net Kâr = Satış − Amazon ücretleri − Reklam harcaması
             − İade maliyeti − COGS − Nakliye/gümrük

   KRİTİK KURAL: Kalemlerden BİRİ bile eksikse net kâr GÖSTERİLMEZ.
   Yerine "Gross Profit (ücretler hariç)" gösterilir ve neyin
   hariç olduğu açıkça yazılır.

6. Ads API durumu:
   ODIN'de Ads API modülü GÖRÜNMÜYOR (sadece spapi.py var).
   Kontrol et. Yoksa PPC Intelligence gerçek veri alamaz —
   o bölümü "veri kaynağı bağlı değil" durumunda göster,
   mock ile doldurma.

7. Authentication:
   Localhost olduğu için basit tutabilirsin ama session yönetimi olsun.

8. Universe katmanı:
   universe_id backend'de var mı kontrol et. Yoksa şimdilik tek
   evren (Lillu) ile çalış, switcher'ı disabled göster.

9. TÜM MOCK VERİYİ KALDIR.
   Mock kalan yer varsa listele.

DOĞRULAMA:
- Amazon Director gerçek veriyle çalışıyor mu?
- Net kâr doğru mu, VEYA gösterilmiyor mu? (uydurulmuyor mu)
- Executive Briefing gerçek KPI gösteriyor mu?
- Hiçbir yerde mock veri kalmadı mı?
- Veri kaynağı olmayan bölümler açıkça "bağlı değil" diyor mu?
- Bir hafta boyunca hata almadan açılıyor mu? (ilk gün testi yeter)
- Her veri TrustSignal (kaynak + zaman) gösteriyor mu?

BİTİRİNCE beş soruyu cevapla.
AYRICA: backend-istekleri.md dosyasını oluştur ve içeriğini özetle.

Plan üretme. Kod üret.
```

---
---

<a name="s9"></a>
# S9 — AI GATEWAY

```
docs/ui_chatgpt/13-backend-recommendations.md §1'i oku.
docs/ui_chatgpt/07-ai-directors.md §14'ü oku.

S9 sprintindeyiz. AI canlıya çıkıyor.

BAĞLAM: ODIN'de IModelProvider interface'i zaten var ve usage/cost
döndürüyor. odin/providers.py mevcut. Yeniden icat etme.

YAPILACAKLAR:

1. AI Gateway / Model Router (frontend tarafı):
   Her AI isteği bu kapıdan geçer:
   - Bu iş gerçekten AI gerektiriyor mu? (hayırsa deterministik çöz)
   - İş tipi: küçük / orta / büyük
   - Önbellekte var mı?
   - Uygun modeli çağır
   - Logla: model, tokenIn, tokenOut, latency, cost, cacheHit

2. İş tipi kademelendirmesi:
   Küçük: hatırlatma, sınıflandırma, etiketleme → küçük/yerel model
   Orta:  e-posta, rapor özeti, tek modül analizi → orta model
   Büyük: tüm hesap analizi, strateji, Council Debate → büyük model

3. Telemetri kanallarını AÇ:
   src/lib/telemetry/registry.ts içinde
   ai_queue ve ai_cost kanallarını available: true yap.
   Başka hiçbir yere dokunma — registry deseni bunun için var.

4. AI Pulse "processing" halkasını canlıya bağla.

5. AI Brief üretimi:
   Executive Briefing ve Amazon Director için.
   5 adımlı format zorunlu.

6. AIRecommendation üretimi:
   7 alanlı explainability zorunlu.
   alternatives.length >= 2 ZORUNLU — backend bu kuralı ihlal
   eden öneri üretemez.

7. Confidence skoru:
   ⚠️ EN KRİTİK NOKTA.
   ODIN'de IConfidenceEngine var. Gerçekten hesaplıyor mu kontrol et.
   Meşru kaynaklar: kanıt sayısı/kalitesi, geçmiş tahmin doğruluğu,
   Director'lar arası consensus.
   Sabit veya rastgele sayı KESİNLİKLE YASAK.
   Üretilemiyorsa GÖSTERME.

8. Evidence toplama ve gösterme:
   ODIN'de ADR-0081 Mandatory Claim Provenance var. Ona bağlan.

9. AI Assisted Input (10-...md §8.10):
   Suggest · Rewrite · Summarize · Expand · Translate
   Tüm AI destekli alanlarda AYNI davranış.

10. System Director → AI Runtime sekmesi (UI-ADR-077):
    Processing queue · aktif model · Model Router istatistikleri
    · token/maliyet dökümü · kaynak kullanımı · 3 kanallı AI Pulse

DOĞRULAMA:
- AI Runtime sekmesinde token/maliyet görünüyor mu?
- Her AI önerisi 7 alanı da taşıyor mu?
- 2'den az alternatifli öneri üretiliyor mu? (üretilmemeli)
- Confidence gerçek kaynaktan mı geliyor? (kanıtla)
- Confidence üretilemeyen yerde badge gizleniyor mu?
- Model router gerçekten farklı modellere yönlendiriyor mu?
- Cache çalışıyor mu?

BİTİRİNCE beş soruyu cevapla.
AYRICA: bir günlük kullanımda tahmini token maliyetini hesapla.

Plan üretme. Kod üret.
```

---
---

<a name="s10"></a>
# S10 — FINANCE + TRADING

```
docs/ui_chatgpt/06-workspaces.md §9'u oku.
docs/ui_chatgpt/07-ai-directors.md §10'u oku (AI CFO ekibi).

S10 sprintindeyiz.

⚠️ ÖNEMLİ: Bu iki workspace HENÜZ TANIMLI DEĞİL.
Kod yazmadan ÖNCE tanımlamalısın.

AŞAMA 1 — TANIMLAMA (kod değil, doküman):

Finance ve Trading workspace'lerini Amazon Director seviyesinde tanımla.
Her biri için:
- Primary Focus Area (tek cümle)
- Workspace tipi (6 tipten hangisi)
- KPI Strip içeriği
- 2-4 Supporting Panel
- Context Panel içeriği
- Density modu
- Veri sözleşmeleri

Bunları docs/ui_chatgpt/06-workspaces.md'ye ekle.
BANA GÖSTER, onay al, sonra kod yaz.

Bilinen veriler:
- Finance: Primary Focus = Cash Overview.
  AI CFO ekibi tanımlı (8 rol: Cash Flow, Treasury, Debt, Revenue,
  Cost, Forecast, Investment Analyst + Executive CFO)
- Trading: Universe olarak var. XAU/USD, XAU/TRY, USD/TRY, EUR/TRY,
  Prop firm hesapları, Risk, günlük performans.
  Monitoring Workspace tipi, Compact density.

AŞAMA 2 — KOD (onaydan sonra):

1. Finance Workspace
2. Trading Workspace
3. Cross Universe Intelligence — ilk kural:
   Trading kârı → Finance nakit akışı güncelleme önerisi
   (07-...md ve 01-...md §13)

DOĞRULAMA:
- Tanımlar Amazon Director seviyesinde detaylı mı?
- Her ikisi de aynı tasarım dilini kullanıyor mu?
- Cross Universe kuralı çalışıyor mu?
- Veri kaynağı olmayan bölümler açıkça işaretli mi?

BİTİRİNCE beş soruyu cevapla.

Önce tanım, sonra kod. Tanımı onaylatmadan kod yazma.
```

---
---

<a name="s11"></a>
# S11 — DECISION + KNOWLEDGE + SYSTEM

```
docs/ui_chatgpt/06-workspaces.md §2, §3, §4, §5, §8'i oku.
docs/ui_chatgpt/07-ai-directors.md §4-6, §9'u oku.

S11 sprintindeyiz. Kalan büyük modüller.

BAĞLAM — ODIN'de zaten var, yeniden icat etme:
- IDecisionEngine, IDecisionLog (replay var, silme YOK — ADR-0005)
- IConsensusEngine (consensus/disagreement/minority scores)
- IConfidenceEngine, IRiskAnalyzer
- IKnowledgeGraph (ADR-0045 LIVE)
- ADR-0085 Explainability Envelope
- ADR-0086 Human Sign-off Gate

YAPILACAKLAR:

1. Decision Center Workspace (06-...md §2):
   Akış: Decision List → Summary → Evidence Panel → Financial Impact
   → Director Opinions → Council Votes → Risk Analysis
   → Scenario Comparison → Recommendation → Approval Panel

   Karar yaşam döngüsü (10 aşama):
   AI Insight → Proposal → Evidence Collection → Risk Analysis
   → Executive Review → Approval → Execution → Monitoring
   → Outcome Analysis → Lessons Learned → Knowledge Memory

   Executive Decision DNA — 12 alan
   Decision Timeline
   Decision Relationships (grafik)
   Executive Decision Score (7 gösterge)

   KURAL: AI gerekçesi ASLA gizlenmez.

2. Executive Council (07-...md §4-6):
   Normal görünüm: sade öneri kartı
   "Open Executive Council" → tüm AI tartışması açılır
   Council Debate · Consensus Score · Minority Opinion

   Bağımsız workspace DEĞİL — Decision Center içinde açılır.

3. Knowledge Workspace (06-...md §3):
   Semantic Search · Knowledge Graph · Memory Graph
   · Evidence Explorer · Citation Viewer · Relationship Explorer
   · Knowledge Timeline · Document Viewer · Contradictions
   · Related Decisions · Source Quality · Confidence · Freshness

   KURAL: Her arama sonuçların NEDEN çıktığını açıklamalı.

4. Memory Workspace (06-...md §4):
   Working · Executive · Knowledge · Decision · Long-Term
   · Archived Memory · Memory Health · Capacity · Retrieval
   · Learning Queue · Reflection Queue

5. System Director (06-...md §8):
   Sekmeler: Health · Performance · Security · AI Runtime
   · Storage · Network · Backups · Version

   AI Runtime sekmesi S9'da yapıldı, entegre et.

6. ODIN HQ (UI-ADR-073):
   Tüm evrenlerin özeti + Overall Executive Score
   Menüde Mission Control'ün üstünde

7. Projects + Automation workspace'leri:
   Minimum uygulanabilir seviye. Aşırı yatırım yapma.

8. Settings / Configuration Workspace:
   COGS girişi (S8'den) · tema · adaptive UI toggle (kapalı)
   · veri kaynağı durumları

DOĞRULAMA:
- Decision Center'da AI gerekçesi görünüyor mu?
- Minority Opinion gizlenmiyor mu?
- Council sade görünümden açılabiliyor mu?
- Knowledge araması "neden bu sonuç" açıklıyor mu?
- Contradictions özelliği çalışıyor mu?
- Silinen bir karar var mı? (OLMAMALI — ADR-0005)

BİTİRİNCE beş soruyu cevapla.

Plan üretme. Kod üret.
```

---
---

<a name="s12"></a>
# S12 — TABLET + MOBILE

```
docs/ui_chatgpt/02-design-principles.md §12'yi oku.

S12 sprintindeyiz. Çoklu cihaz.

KALİTE HEDEFİ: "Çalışır durumda."
Kullanılabilir, bozuk görünmez. Piksel cilası v1.1'de.
Aşırı mükemmelleştirme YAPMA.

YAPILACAKLAR:

1. TABLET (8 kolon grid):
   - Master grid 12 → 8 kolona düşer
   - Aynı bileşenler, aynı tasarım dili
   - Sidebar varsayılan daraltılmış (ikon modu)
   - Context Panel varsayılan Closed
   - Tüm workspace'lerde test et

2. MOBILE — COMPANION MOD:
   Masaüstü deneyimiyle EŞİTLENMEYECEK.
   Sadece üç iş:
   a) Executive Briefing oku
   b) Alerts gör
   c) Decision onayla

   Diğer workspace'ler mobilde "Bu ekran masaüstünde kullanılır"
   mesajı gösterir. Bu bir eksiklik değil, bilinçli karar.

3. Mobil navigasyon:
   Sidebar → alt bar veya drawer
   3 ana giriş: Briefing · Alerts · Decisions

4. Touch etkileşim:
   - Dokunma hedefleri en az 44x44px
   - Hover'a bağımlı hiçbir bilgi olmayacak
   - Swipe jestleri: Context Panel açma/kapama

5. Responsive test:
   1920 · 2560 · 3440 · 3840 (birincil)
   1600 · 1440 · 1366 (geri düşüş)
   Tablet · Mobil

DOĞRULAMA:
- Tablet'te tüm workspace'ler kullanılabilir mi?
- Mobilde 3 ana ekran çalışıyor mu?
- Mobilde desteklenmeyen ekranlar açık mesaj veriyor mu?
- Hover'a bağımlı gizli bilgi kaldı mı? (kalmamalı)
- Dokunma hedefleri yeterince büyük mü?
- Hiçbir çözünürlükte layout bozulmuyor mu?

BİTİRİNCE beş soruyu cevapla.

Plan üretme. Kod üret.
```

---
---

<a name="s13"></a>
# S13 — PRODUCTION HARDENING 🚀

```
docs/ui_chatgpt/02-design-principles.md §13, §14, §15, §16'yı oku.
docs/ui_chatgpt/12-motion-system.md §12'yi oku.

S13 — SON SPRINT. v1.0'a hazırlık.

YAPILACAKLAR:

1. PERFORMANS:
   - 60 FPS doğrula (ölç, tahmin etme)
   - Tüm uzun listeler sanallaştırılmış mı kontrol et
   - Pahalı bileşenler memoize edilmiş mi
   - Layout shift ölç (CLS)
   - Bundle boyutu analizi
   - Lighthouse skoru

2. ACCESSIBILITY:
   - axe-core otomatik test kur ve çalıştır
   - Tüm WCAG hatalarını düzelt
   - Klavye ile TÜM uygulamada gezinebiliyor mu
   - Screen reader testi
   - Kontrast oranları
   - Renkten bağımsız durum göstergeleri

3. KLAVYE HARİTASI (04-...md §10):
   Eksik kısayolları tamamla:
   - Workspace kısayolları (G sonra A → Amazon gibi)
   - Context Panel aç/kapa
   - Decision onaylama
   - Kısayol yardım ekranı (? tuşu)

4. REDUCED MOTION (12-...md §9):
   Tam denetim. Hareket kalkar ama BİLGİ KALKMAZ.
   Heartbeat animasyonu duruyorsa yerine metin durumu gösterilmeli.

5. MOTION DENETİMİ (12-...md §12 — 9 madde):
   - Her animasyon 4 amaçtan birine hizmet ediyor mu?
   - Hiçbir geçiş 400ms'i aşmıyor mu?
   - Yalnızca transform/opacity animate ediliyor mu?
   - App Shell geçişte animasyon almıyor mu?
   - Ambient hareketlerin hepsi gerçek veriye bağlı mı?
   - Aynı anda 3'ten fazla bağımsız animasyon var mı?

6. TOKEN COMPLIANCE:
   Tüm kod tabanını tara. Hardcoded renk/ölçü var mı?
   Lint temiz olmalı.

7. GLOBAL DESIGN AUDIT (02-...md §15):
   - Token kullanımı
   - Tipografi tutarlılığı
   - Spacing tutarlılığı
   - Etkileşim tutarlılığı
   - Renk semantiği (kırmızı sadece kriz mi?)
   - Bileşen tekrarı
   - Ölü UI
   - Kullanılmayan varyantlar

8. ANTI-FAKE FİNAL DENETİMİ:
   Tüm kod tabanında ara: sahte veri, sabit confidence,
   karşılığı olmayan gösterge, mock kalıntısı.
   BULDUKLARINI LİSTELE.

9. KALİTE KAPILARI:
   - TypeScript hatası: 0
   - ESLint hatası: 0
   - Build başarılı
   - Test kapsamı raporu

10. GÜVENLİK:
    - Sunucu hâlâ sadece 127.0.0.1'de mi?
    - Secret sızıntısı var mı?
    - XSS/injection riskleri

11. EKRAN KABUL SORULARI (02-...md §16):
    Her ekran için tek tek cevapla:
    - Kurumsal yazılım gibi görünüyor mu?
    - Sakin hissettiriyor mu?
    - Yöneticinin iş yükünü azaltıyor mu?
    - Her görselleştirme anlam taşıyor mu?
    - Bir CEO durumu 30 saniyede anlayabilir mi?
    - Yüzlerce modüle ölçeklenebilir mi?

12. v1.0 etiketi:
    Tüm kapılar geçilince git tag

DOĞRULAMA — v1.0 Definition of Done:
- [ ] Tüm modüller çalışıyor
- [ ] API'ler bağlı
- [ ] Testler geçiyor
- [ ] TypeScript hatası: 0
- [ ] ESLint hatası: 0
- [ ] Build başarılı
- [ ] Responsive doğrulandı
- [ ] Accessibility doğrulandı
- [ ] Token compliance: hardcode yok
- [ ] Sahte veri: sıfır
- [ ] docs/ui_chatgpt/ güncel

BİTİRİNCE beş soruyu cevapla.
AYRICA: v1.0 release notu yaz.

Plan üretme. Kod üret.
```

---
---

# ⚠️ HER SPRINTTE GEÇERLİ KURALLAR

Bunları Claude Code CLAUDE.md'den okuyor ama hatırlatman gerekebilir:

**Claude Code plan üretmeye başlarsa:**
> "Plan istemiyorum. Kodu yaz."

**Sahte veri üretirse:**
> "CLAUDE.md kural 2. Veri yoksa 'veri yok' göster, uydurma."

**Hardcoded renk yazarsa:**
> "Token kullan. docs/ui_chatgpt/11-design-tokens.md."

**Yeni bileşen icat ederse:**
> "10-component-library.md §10'daki envantere bak. Yoksa önce
> dokümana ekle, sonra yaz."

**ODIN reposuna dokunmaya kalkarsa:**
> "Oraya dokunma. İhtiyacı backend-istekleri.md'ye yaz."

**Sprint bitmeden diğerine geçmeye kalkarsa:**
> "Beş soruyu cevapla önce."

---

# 📌 SPRINT SONU RİTÜELİ

Her sprint sonunda Claude Code'un cevaplaması gereken beş soru:

```
1. Çalışıyor mu?
2. Responsive mi?
3. Hata var mı?
4. Mimariye uygun mu?
5. Merge edilmeye hazır mı?
```

**Beşi de "evet" olmadan sonraki sprinte geçme.**

Bu tek kural, projenin bitip bitmemesini belirleyecek.
