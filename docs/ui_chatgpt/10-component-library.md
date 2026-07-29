# 10 — Component Library

**Durum:** 🟡 Standart DONDURULDU / bileşen anatomileri eksik
**Kaynak:** dosya_5 (DS-03A–D), dosya_6 (Component Library listesi), dosya_2 (Component Reuse Policy)

---

## 1. Bağımlılık Zinciri

Bu zincirin yönü **asla** ters çevrilemez. Ters bağımlılık, tasarım sisteminin
en yaygın ölüm sebebidir.

```
Tokens
  ↓
Foundation
  ↓
Primitives
  ↓
Executive Components
  ↓
Patterns
  ↓
Templates
  ↓
Workspace
```

Bir Primitive, bir Executive Component'i import edemez. Bir Token, hiçbir şeyi
import etmez.

---

## 2. Component Reuse Policy

Herhangi bir arayüz yazmadan önce sorulacak sorular:

```
Bu bileşen zaten var mı?
  ├── Evet          → yeniden kullan
  ├── Biraz farklı  → genişlet (variant ekle)
  └── Hayır         → yeni bileşen öner, önce bu dosyaya ekle
```

**Yasaklar:**
- ❌ Bileşen fork'lama
- ❌ UI mantığı kopyalama
- ❌ Presentational bileşen içine iş mantığı koyma

---

## 3. Component Lifecycle

Her bileşenin bir yaşam döngüsü etiketi vardır:

```
Draft → Internal Review → Approved → Production → Stable → Deprecated
```

Kod tarafında ayrıca sürüm etiketi taşır: `Stable` / `Experimental` /
`Deprecated`. Bu, ileride v2 geçişlerini kolaylaştırır.

---

## 4. Variant Standardı

Bütün bileşenler **aynı** varyant sistemini kullanır. Bileşene özel varyant
isimlendirmesi yapılmaz.

```
Primary · Secondary · Tertiary · Ghost · Danger · Success · Warning · Info
```

---

## 5. Size Scale

```
XS · SM · MD · LG · XL
```

`small`, `medium`, `large`, `big`, `huge` gibi serbest isimlendirme
kullanılmaz.

---

## 6. State Matrix (zorunlu)

Her bileşen bu 11 durumu desteklemek **zorundadır.** Desteklemediği bir durum
varsa gerekçesi dokümante edilir.

| Durum | Açıklama |
|---|---|
| Default | Normal |
| Hover | Fare üzerinde |
| Pressed | Basılı |
| Focus | Klavye odağı (görünür halka zorunlu) |
| Disabled | Devre dışı |
| Loading | Yükleniyor |
| Empty | Veri yok |
| Error | Hata |
| Success | Başarılı |
| Offline | Bağlantı yok |
| Read Only | Salt okunur |

**En çok atlanan üçü:** Empty, Offline, Read Only. Bunlar tasarımda çizilmezse
kodda uydurulur ve tutarsızlık oluşur.

---

## 7. Interaction Rules

Her bileşen için ayrı ayrı tanımlanır:

- Hover davranışı
- Keyboard davranışı
- Focus davranışı
- Animation
- Touch davranışı

---

## 8. Form Language (DS-03D-1)

ODIN'de form elemanları tek tek tanımlanmaz. Önce bir **form dili** kurulur.

### 8.1 Input yaşam döngüsü

Tüm giriş bileşenleri bu döngüyü paylaşır:

```
Idle → Focused → Typing → Validating → Valid | Invalid → Saved
```

### 8.2 Field Anatomy (dondurulmuş)

Her alan aynı anatomiyi kullanır:

```
Label
  ↓
Description
  ↓
Field
  ↓
Helper Text
  ↓
Validation
  ↓
Action
```

### 8.3 Validation Contract — üç seviye

| Seviye | Örnek | Ne zaman çalışır |
|---|---|---|
| **Local** | Zorunlu alan boş | Anında, istemci tarafında |
| **Business** | Amazon SKU zaten mevcut | Debounce sonrası, iş kuralı |
| **Remote** | Sunucu doğrulaması | Kaydetme anında |

Bu ayrım veri akışını sadeleştirir ve gereksiz sunucu çağrısını engeller.

### 8.4 Input Variants

```
Default · Read Only · Disabled · Inline · Search · Filter
```

### 8.5 Search ≠ Input ⭐

**Search bir Input değildir.** Kendi davranışına sahiptir:

- Sonuç sayısı
- Debounce
- Geçmiş
- Kısayollar
- Command Palette entegrasyonu

Bu nedenle **ayrı bir primitive'dir.** Bu ayrım, Command Palette ve global
aramanın temiz kurulabilmesi için yapılmıştır.

### 8.6 Filter ≠ Input

```
Filter → query oluşturur
Input  → veri girer
```

Bu iki davranış aynı değildir. Filter da ayrı bir primitive'dir.

### 8.7 Selection Family

Ortak seçim mantığını paylaşan aile:

`Checkbox` · `Radio` · `Toggle` · `Segmented Control`

### 8.8 Input Density

Her form elemanı üç yoğunlukta çalışır:

`Comfortable` · `Compact` · `Dense`

Dense özellikle tablo içi düzenleme için gereklidir.

### 8.9 Keyboard First

ODIN bir Executive System olduğu için fare ikinci plandadır. Bütün Input
ailesi şunlarla eksiksiz kullanılabilir:

`Tab` · `Shift+Tab` · `Esc` · `Enter` · `Arrow Keys`

### 8.10 AI Assisted Input (ODIN'e özel)

Bazı alanlar AI destekli olur: görev açıklaması, not, strateji, brief.

Desteklenen eylemler — **hepsinde aynı:**

`Suggest` · `Rewrite` · `Summarize` · `Expand` · `Translate`

Bu davranış tüm AI destekli alanlarda birebir aynıdır. Farklı alanlarda
farklı AI menüsü olmaz.

### 8.11 Autosave Contract

Kaydet butonu yerine autosave. Durumlar:

`Saving` · `Saved` · `Retry` · `Conflict`

### 8.12 Error Recovery

Kullanıcı hiçbir zaman veri kaybetmez:

- Taslak koruma
- Otomatik geri yükleme
- Yeniden dene
- Çakışma çözümü

---

## 9. Data Display System (DS-03D-2)

**Gerekçe (kaynaktan):** ODIN bir yönetim sistemidir. Kullanıcıların zamanının
%90'ı veri **görüntülemekle**, %10'u veri **girmekle** geçer. Bu nedenle Data
Display bileşenleri normal bir SaaS uygulamasından çok daha kritiktir.

Kapsam: Executive Cards · KPI Tiles · Tables · Timelines · Activity Feed
· Analytics · Metrics · Charts

⬜ **TANIMSIZ** — ancak üretim sırası belli (UI-ADR-081):

**M2'nin ilk iki işi:** 1) Typography System, 2) Table.

Gerekçe: veri yoğun bir Executive sistemde en çok kullanılan iki şey bunlar.
Diğerleri §14'teki şablonla sırayla tanımlanır.

**Zorunlu teknik kural:** sayılar için `tabular-nums`. Sütunda hizalanmayan
sayı, okunmayan tablo demektir.

---

## 10. Bileşen Envanteri

Kaynakta isimleri geçen bileşenler. **~80–100 production bileşen** hedefi
konmuştu.

### Layout & Navigation
`AppShell` · `TopHeader` · `LeftSidebar` · `RightContextPanel` · `StatusBar`
· `WorkspaceContainer` · `WorkspaceHeader` · `Section` · `CommandPalette`
· `Tabs` · `Tree` · `Breadcrumb / ContextChain`

`Section` S5'te eklendi (`10c-screens.md` §1): bir workspace bölümünün
çerçevesi ve dört durumu. Veri bileşeni değildir, dizilim bileşenidir.

### Primitives
`Button` · `Input` · `Search` · `Filter` · `Checkbox` · `Radio` · `Toggle`
· `SegmentedControl` · `Select` · `Textarea` · `DatePicker` · `Badge`
· `Tooltip` · `Modal` · `Drawer` · `Progress` · `Skeleton` · `Avatar` · `Icon`

### Data Display
`Card` · `MetricCard` · `Table` · `VirtualTable` · `Timeline` · `Chart`
· `Sparkline` · `MetricRing` · `StatGrid` · `Heatmap` · `ActivityFeed`
· `Widget`

### Executive Components ⭐ (ODIN'e özel)
`ExecutiveKPICard` · `DecisionCard` · `DecisionQueue` · `DirectorCard`
· `AIBrief` · `AIPanel` · `AIRecommendationCard` · `EvidenceChain`
· `CouncilView` · `ConsensusIndicator` · `MinorityOpinionBanner`
· `KnowledgeGraph` · `MemoryGraph` · `AICoreVisualization`
· `TelemetryBar` · `HeartbeatIndicator` · `ConfidenceBadge`
· `TrustSignal` · `AlertStack` · `OpportunityCard` · `SimulatorPanel`
· `MissionBoard` · `SystemReadiness`

`MissionBoard` ve `SystemReadiness` S5'te eklendi (`10c-screens.md`).
`DecisionQueue` ve `ActivityFeed` de S5'te üretildi — ikisi de bu listede
zaten adı geçen kalemlerdir.

### Feedback
`Notification` · `Alert` · `EmptyState` · `ErrorState` · `LoadingState`

---

## 11. Standart Pattern'ler (davranış katmanı)

Bunlar bileşen değil, **kompozisyon kurallarıdır.**

### Empty Pattern

Boş ekran olmaz. Boş durumda gösterilir:

```
Açıklama → Öneri → Örnek → Sonraki adım
```

### Error Pattern

Her hata ekranı aynı yapıdadır:

```
Ne oldu → Neden oldu → Etkisi → Çözüm → [Retry]
```

Kullanıcı hiçbir zaman sadece "Error" görmez.

### Loading Pattern

Skeleton yalnızca kutu değildir — **gerçek yerleşimi temsil eder.**
Böylece layout shift oluşmaz.

### Workspace Transition

Workspace değiştiğinde animasyon "sayfa değiştirme" değil, **"bağlam
değişimi"** hissi verir.

---

## 12. Teknoloji Hedefi

| Katman | Teknoloji |
|---|---|
| Framework | React + Next.js |
| Dil | TypeScript |
| Stil | Tailwind CSS |
| Bileşen tabanı | shadcn/ui |
| Animasyon | Framer Motion |
| İkon | Lucide |
| Tablo | TanStack Table |
| Veri | React Query |
| State | Zustand |

UI mümkün olduğunca framework-agnostic kalır, ancak bunlar birincil hedeftir.

---

## 13. Dosya Yapısı

```
src/
 ├── app/
 ├── components/
 │    ├── executive/     ExecutiveKPICard, DecisionCard, AIBrief...
 │    ├── ai/            AICoreVisualization, CouncilView, AIPanel...
 │    ├── director/      DirectorCard, HeartbeatIndicator...
 │    ├── knowledge/     KnowledgeGraph, EvidenceChain...
 │    ├── finance/
 │    ├── amazon/
 │    ├── analytics/
 │    ├── charts/
 │    ├── layout/        AppShell, TopHeader, LeftSidebar...
 │    └── common/        Button, Input, Card...
 ├── features/
 ├── hooks/
 ├── lib/
 ├── styles/
 ├── tokens/
 ├── animations/
 ├── icons/
 └── types/
```

**Kural:** Presentational bileşenlerin içine iş mantığı konmaz. İş mantığı
`features/` ve `hooks/` içinde yaşar.

---

## 14. Bileşen Dokümantasyon Şablonu

Her yeni bileşen bu şablonla dokümante edilir:

```markdown
## <ComponentName>

**Lifecycle:** Draft | Approved | Production | Stable | Deprecated
**Katman:** Primitive | Executive | Pattern
**Bağımlılıklar:** (yalnızca alt katmanlar)

### Amaç
Tek cümlede: bu bileşen hangi kullanıcı hedefine hizmet ediyor?

### Anatomi
(görsel yapı — hangi parçalardan oluşuyor)

### Props / API
| Prop | Tip | Varsayılan | Açıklama |

### Variants
Primary | Secondary | ... (kullanılanlar)

### Sizes
XS | SM | MD | LG | XL (desteklenenler)

### States
11 durumun hangileri destekleniyor, desteklenmeyenlerin gerekçesi

### Density
Comfortable | Compact | Dense

### Interaction
Hover · Keyboard · Focus · Animation · Touch

### Tokens
Kullandığı component token'ları

### Accessibility
ARIA rolü, klavye haritası, focus davranışı

### Veri sözleşmesi
`09-data-contracts.md` içindeki hangi tipi tüketiyor?

### Do / Don't
```

---

## 15. Kalite Kapıları

Bir bileşen üretime girmeden önce:

- [ ] Bağımlılık zincirini ihlal etmiyor
- [ ] Tüm değerler token'dan geliyor, hardcode yok
- [ ] 11 durumun tamamı ele alınmış
- [ ] Variant ve size standart isimleri kullanıyor
- [ ] Klavye ile tam kullanılabiliyor, focus görünür
- [ ] `prefers-reduced-motion` destekliyor
- [ ] Renkten bağımsız durum göstergesi var
- [ ] Uzun listeler sanallaştırılmış
- [ ] Pahalı hesaplar memoize edilmiş
- [ ] Veri sözleşmesi tanımlı, `meta` alanını kullanıyor
- [ ] Dokümantasyon şablonu doldurulmuş

---

## 16. Backlog — üretim altyapısı

Bunlar tasarım sisteminin kendisi değil, kalite sürecidir. Ayrı backlog
maddeleri olarak tutulur:

| Madde | Amaç |
|---|---|
| **Component Versioning** | Stable / Deprecated / Experimental etiketleri — v2 geçişini kolaylaştırır |
| **Visual Regression Pipeline** | Storybook + Chromatic/Percy ile otomatik görsel karşılaştırma |
| **Design Token Automation** | Figma → kod token senkronizasyonu |
