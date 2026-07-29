# 10c — Screens (S5 · S6)

**Durum:** ✅ Üretildi — S5 · Executive Briefing + Mission Control
· S6 · Amazon Director (§7)
**Kaynak:** `05-dashboard.md` (tamamı), `06-workspaces.md` §1,
`03-information-architecture.md` §3–§5
**Kod:** `src/components/screens/*`, `src/components/layout/{section,workspace-header}.tsx`,
`src/mocks/*`, `src/types/screens.ts`, `src/lib/store/amazon.ts`

`10a` primitive'leri, `10b` executive bileşenleri tarif eder. Bu dosya
**ekran katmanını** tarif eder: bileşenlerin nasıl dizildiğini ve zarfın
nasıl beslendiğini. Burada yeni bir veri bileşeni YOKTUR — S5'te yazılan
her şey ya bir dizilim ya bir besleyicidir.

---

## 0. Ortak kurallar

### 0.1 Ekran bileşen yazmaz, bileşen DİZER

15 executive + 16 primitive bileşen hazırdı; S5'te hiçbiri yeniden
yazılmadı. Ekranda eksik çıkan davranış, bileşenin kendi dosyasında
düzeltildi (bkz. §5 "Görsel incelemede yakalananlar").

### 0.2 Veri: hepsi mock, hepsi işaretli — UI-ADR-094

`src/mocks/` altındaki üreticiler `mockEnvelope()` ile zarf kurar;
`meta.source` istisnasız `"mock"`tur. `TrustSignal` bunu saklamaz,
dev derlemesinde ayrıca `MockBadge` görünür.

**Mock'ta da anti-fake geçerlidir.** Ölçüm kaynağı olmayan alan mock'ta da
doldurulmaz:

| Alan | Neden boş | Ekranda |
|---|---|---|
| `Knowledge Health` · `Memory Health` KPI | registry'de kanal `available: false` | `NoData` |
| `AI Readiness` | sözleşmede karşılığı yok (13-...md §14.1) | `NoData` |
| `Mission.progressPercent` (kur riski görevi) | kısmi ve sürekli, ölçülmüyor | `NoData` |
| Active Projects · Resource Allocation · Automation Queue | sözleşme yok (UI-ADR-096) | gerekçeli boş durum |

### 0.3 Sunucuda veri YOK, bu bilinçlidir

`useMockData()` sunucu anlık görüntüsünde `null` döner (`useSyncExternalStore`).
Sebep: mock kayıtların zaman damgası `Date.now()` ile üretilir; sunucuda
üretilirse hydration mismatch olur. Sonuç: sunucu HTML'i **gerçekten**
yükleme durumunu basar — skeleton sahte bir gecikmeyle gösterilmez.
Yapay `setTimeout` gecikmesi EKLENMEDİ: sahte veri kadar sahte davranış da
yasaktır.

---

## 1. Section

**Katman:** Layout · **Dosya:** `layout/section.tsx`

Bir workspace bölümünün çerçevesi: başlık · açıklama · hızlı eylem ve
**dört durum** (yükleniyor · hata · boş · dolu).

| Prop | Tip | Not |
|---|---|---|
| `title` / `description` / `actions` | — | başlık satırı |
| `loading` + `loadingLayout` + `loadingCount` | `boolean` + `LoadingLayout` | skeleton GERÇEK yerleşimi temsil eder; hangi yerleşim geleceğini çağıran bilir |
| `error` + `onRetry` | `SectionError` | `ErrorState` deseni: ne oldu → neden → etkisi → çözüm |
| `empty` + `emptyTitle/Description/Suggestion` | — | `EmptyState` |

**Neden var:** iki ekran birlikte 15+ bölüm taşıyor ve dördü de aynı.
Çerçeve tek yerde durmazsa "veri gelmeyen bölüm boş durum gösterir" kuralı
15 yerde tek tek yazılır ve bir gün biri unutulur — `DataGuard`'ın
Executive bileşenler için yaptığını bu bölümler için yapar (UI-ADR-088
ile aynı gerekçe).

---

## 2. WorkspaceHeader

**Katman:** Layout · **Dosya:** `layout/workspace-header.tsx`
**Kaynak:** `03-information-architecture.md` §4

Beş bilgi, her workspace'te aynı sırada:
`Workspace Name → Current Context → Quick Actions → Search → Last Sync`

**`Last Sync` isteğe bağlı değildir** (§4) — Trust Signals kuralının somut
karşılığı. Zaman damgası yoksa "az önce" uydurulmaz, `NoData` çıkar.

**`search` yalnızca gerçekten arama yapılan ekranda verilir.** Mission
Control'de görev tahtasını filtreler; Executive Briefing'de yoktur.
Hiçbir şeyi filtrelemeyen dekoratif bir arama kutusu sahte bir yetenektir.

---

## 3. Executive Briefing

**Dosya:** `screens/executive-briefing.tsx` · **Rota:** `/briefing` (açılış)

Dikey sıra `05-...md` §2'de dondurulmuştur ve **kararlar her zaman en
üsttedir**:

```
WorkspaceHeader
SystemReadiness            ← 0–3 sn, registry'den (UI-ADR-095)
Hero                       ← ekranın TEK hero element'i
Kritik kararlar            ← DecisionQueue, en fazla 3 primary kart
Kritik riskler | Fırsatlar ← aynı grid, EŞİT genişlik
Executive KPI'lar          ← 9 kart, 3 kolon
AI brifingi                ← AIBrief (📊→🔍→🧠→🎯→📑)
Director aktivitesi        ← 6 Director (UI-ADR-074 dondurulmuş liste)
Executive Timeline | AI Core
```

**Hero içeriği:** saate göre selamlama (istemci saati gelmeden YAZILMAZ) ·
Executive Summary · Today's Mission · Current Focus · System Status ·
AI Readiness (`NoData`).

**Attention Economy:** 1 hero + en fazla 3 karar kartı. Kuyrukta daha çok
karar varsa **saklanmaz**, sayısı yazılır ve Decision Center'a yönlendirilir.

**Onay:** `Onayla` kartın üzerindedir. Mock aşamasında onay yalnızca o
oturumda işaretlenir ve altında bunun **hiçbir yere yazılmadığı** yazar
(13-...md §14.5).

---

## 4. Mission Control

**Dosya:** `screens/mission-control.tsx` · **Rota:** `/mission-control`

**Primary Focus Area: Mission Board.** Ekranda ondan ağır ikinci bir alan
yoktur (03-...md §5).

```
WorkspaceHeader (arama: görev/hedef/Director)
Operational Status         ← registry + heartbeat ölçümü, tahmin yok
Mission Board              ← PRIMARY: 4 sütun (Yürüyen · Engelli · Planlı · Tamamlanan)
Upcoming Deadlines | Executive Alerts
Director Coordination
Active Projects | Resource Allocation | Automation Queue   ← sözleşme yok (UI-ADR-096)
```

`MissionBoard` ilerlemeyi `Meter` ile çizer; `progressPercent === null` ise
çubuk çizilmez. Termin **kalan süreyle** yazılır (`remainingTime`), yaşla
değil — bkz. §5.

---

## 5. Görsel incelemede yakalananlar

Testlerin yakalamadığı, yalnızca ekrana bakınca görülen dört hata.
Hepsi kök nedende düzeltildi:

| Bulgu | Kök neden | Düzeltme |
|---|---|---|
| Karar kartında tutar etiketinden kopup sağ kenara kaçıyordu | `.odin-num` sayıları sağa hizalar (03-...md §11); esnek sütunda `Num` hücre genişliğine yayılıyordu. S4 story'lerinde kart dar olduğu için görünmüyordu | `decision-card.tsx` → `items-start` |
| Operational Status sayıları etiketinden kopuktu | `odin-num` blok elemana verilmişti | sayı satır içi `span`'e alındı |
| Termin ve son tarih "birazdan" yazıyordu (46 gün sonrası dahil) | `relativeTime` bir YAŞ fonksiyonudur, gelecek tarihte "birazdan" der | `remainingTime()` eklendi (`lib/clock/tick.ts` + birim testleri); `mission-board.tsx` ve `opportunity-card.tsx` |
| Risk kartının üstünde boş şerit | `AlertStack title=""` → boş `CardHeader` | başlık filtre kuralını söyleyecek şekilde dolduruldu |

`remainingTime` ayrı bir fonksiyondur, `relativeTime` genişletilmedi:
termin ile yaş **farklı sorulardır** ve tek fonksiyona sıkıştırılırsa
çağıranın hangisini istediği belirsizleşir. Tamamlanmış görevde soru
tersine döner (ne zaman bitti?) ve orada yine `relativeTime` kullanılır.

---

## 7. Amazon Director (S6) ⭐ REFERANS MODÜL

**Dosya:** `screens/amazon-director.tsx` · **Rota:** `/amazon`
**Bağlam paneli:** `screens/amazon-sku-panel.tsx`
**Kaynak:** `06-workspaces.md` §1

Temel soru: *"Bugün Amazon işinde hangi kararları vermeliyim?"* — bu bir
raporlama ekranı değildir. Burada doğrulanan tasarım dili diğer yedi
workspace'e kopyalanacaktır; §7.6 neyin soyutlandığını sayar.

### 7.1 Dikey sıra

```
WorkspaceHeader (arama: SKU / ASIN / başlık)
Executive Glance           ← PRIMARY, Layer 1: 10–15 sn, GRAFİK YOK
Executive KPI Strip        ← PRIMARY, 8 kart + net kâr atıf satırı
Üç bağımsız kolon          ← §1.1 tablosu
PPC Intelligence Center    ← tam genişlik, K2 · K3 · K4
```

**Primary Focus Area TEK'tir** (03-...md §5): Glance + şerit. Alttaki dokuz
bölüm destekleyicidir.

### 7.2 Üç kolon — neden grid değil, bağımsız akış

`06-...md` §1.1 dokuz hücreli bir tablo çiziyor. Tek bir CSS grid'de satır
yüksekliği **en uzun karta** göre belirlenir: AI Insights (Layer 2 brifingi)
yanındaki iki bölümün altında ~400 px boşluk bırakıyordu (1920'de ölçüldü).

Kolonlar bağımsız dikey akışlara çevrildi. §1.1'in kolonları zaten anlamlı
gruplardır ve sıra korunur:

| Kolon | Bölümler | Ortak yönü |
|---|---|---|
| 1 | SKU Health · Inventory Intelligence · Orders | operasyon |
| 2 | Sales & Profit · PPC Performance · Opportunity Feed | para |
| 3 | AI Insights · BuyBox · Alerts | sinyal |

Dar ekranda tek kolona inerken bu sıra korunur.

### 7.3 Üç katmanlı okuma (§1.3)

| Katman | Nerede |
|---|---|
| 1 · Executive Glance | En üstteki `ai` tonlu kart: Health · Revenue · Gross Profit · Orders · ACOS · TACOS · BuyBox · Inventory Health · Top Risk · Top Opportunity · Mission Progress. Grafik yok. |
| 2 · Executive Intelligence | `AIBrief` (📊→🔍→🧠→🎯→📑), kolon 3'ün başında |
| 3 · Deep Analysis | SKU seçilir → sağ bağlam paneli (§1.7). Ekran değişmez. |

Layer 3'ün SKU-üstü kalemleri (Compare · Decision History · Related
Documents) **çizilmedi**: sözleşmeleri yok, soru 13-...md §15.4'te.

### 7.4 Bilerek boş dört yer

| Yer | Neden |
|---|---|
| Net Profit KPI'ı **yok** | COGS yok → hesaplanamaz. Yerine Gross Profit + hariç tutulanlar (UI-ADR-098) |
| Profit After Ads | aynı sebep; kâr metriğidir |
| Sales & Profit Analytics | 09-...md'de **etiketli zaman serisi yok**; `sparkline` yön gösterir, tarihli seri değildir |
| Orders akışı | `AmazonSnapshot.orders` bir SAYIDIR; akış ve anomali ondan türetilemez |

Ayrıca `SkuHealth.grossMarginPerUnit` her SKU'da `null`, `buyBoxRate`
raporlanmayan SKU'da `null`, `healthScore` üretilmeyen SKU'da `null` —
mock'ta bile doldurulmadı (UI-ADR-100 sıkılaştırması).

### 7.5 Görsel incelemede yakalananlar

1920 · 1440 · 768 px'te bakıldı; ayrıca yedi genişlikte (768→1920) taşma
taraması yapıldı. Testlerin yakalamadığı **üç hata** çıktı, üçü de kök
nedende düzeltildi:

| Bulgu | Kök neden | Düzeltme |
|---|---|---|
| 768'de yatay kayma (13 px). **Aynı hata S5'in briefing ekranında da vardı** — S5 yalnızca 1920 ve 1440'ta bakılmıştı | KPI kolonu `md`de ikiye bölünüyordu; kart içi 172 px'e düşüyor, `text-3xl` para değeri (`₺2.640.000,00` ≈ 185 px) sığmıyordu. Sayı bölünemez | Kolon eşikleri `lg` / `2xl`e taşındı (her iki ekranda); kart içinde değer bloğuna `min-w-0` |
| "Gross Profit (ücretler hariç)" başlığı kırpılıyordu — 1280'de 71 px, 1920'de 11 px. Kartın dürüstlüğünü taşıyan parantez kayboluyordu | `CardHeader` başlığı `truncate` idi | `truncate` → `break-words`. Kısa başlıklarda davranış değişmez |
| ACOS %14,2 → %18,1 **yükselirken sparkline YEŞİL** | `Sparkline` varsayılanı `tone="auto"`, yükselişi olumlu sayar. Kartın kendi kuralı ("trend renklendirilmez") ihlal ediliyordu | UI-ADR-101 → kart `tone="neutral"` verir |

Ek olarak mock hijyeni: `remainingTime` aşağı yuvarladığı için tam 9 gün
sonrası "8 gün kaldı" yazıyor ve yanındaki `daysOfSupply: 9` ile
çelişiyordu → mock'ta yarım gün pay bırakıldı (`inDays()`). Fonksiyonun
davranışı değiştirilmedi: termin için aşağı yuvarlamak doğrudur, erken uyarır.

**Ölçüm ortamı notu:** bu makinede `next dev`'in HMR websocket'i el
sıkışamıyor ve istemci hiç hydrate olmuyor; ekran framer-motion'ın SSR
başlangıç stilinde (`opacity: 0`) donuyor. Kod hatası değil — üretim
derlemesinde (`next start`) `opacity: 1`. Görsel doğrulama bu yüzden üretim
sunucusunda yapıldı. Yan etkisi: `MockBadge` üretimde `null` döndüğü için
rozet o koşumda görünmez (UI-ADR-094 gereği doğru davranış); rozetin varlığı
dev DOM'unda ayrıca doğrulandı.

### 7.6 Diğer workspace'lere kopyalanabilir olanlar

| Parça | Nerede | Nasıl kopyalanır |
|---|---|---|
| Ekran iskeleti | `WorkspaceHeader` → PRIMARY (Glance + şerit) → bağımsız kolonlar → tam genişlik derinlik bölümü | Bölüm adları değişir, iskelet değişmez |
| `Metric` | `executive/metric.tsx` | Etiket · değer · not üçlüsü olan her yerde |
| `percentFactor` / `toPercentUnit` | `lib/format/percent.ts` | Yüzde taşıyan HER modül; ölçek bildirilmemişse `NoData` |
| Kâr kuralı | `PROFIT_NEEDS_COGS` + UI-ADR-098 | Finance/Trading'de de kâr metriği aynı kapıdan geçer |
| Sözleşmesi olmayan bölüm deseni | `noContract()` (ekran içi yardımcı) | Başlık + neden + sorunun düşüldüğü yer |
| Bağlam paneli sağlayıcısı | `app-shell.tsx` içindeki seçim + `lib/store/amazon.ts` deseni | Yeni workspace kendi store'unu açar, panel KABUĞU değişmez |
| Simülatör kuralı | UI-ADR-099 | Motoru olmayan her "ne olur?" özelliği |
| Görsel doğrulama betiği | taşma + kırpılma + üst üste binme taraması | Her ekran için yeniden çalıştırılır |

---

## 8. Kalite kapıları — S5 durumu

- [x] Bileşen tekrarı yok — 31 bileşenin hiçbiri yeniden yazılmadı
- [x] Tüm değerler token'dan (ESLint 0 hata, 0 uyarı)
- [x] Her bölümün yükleniyor / boş / hata hâli var (Storybook'ta story'si de)
- [x] Skeleton gerçek yerleşimi temsil ediyor, layout shift yok
- [x] Mock veri `meta.source === "mock"` + dev'de rozet (UI-ADR-094)
- [x] Ölçüm kaynağı olmayan alan boş — mock'ta bile uydurma yok
- [x] Açılıştan brifinge geçen süre ölçüldü: **0,95 sn** (sıcak dev),
      karar kartı 2,3 sn; Mission Control 0,64 sn — hedef 10 sn
- [x] Ekran görüntüsüyle doğrulandı (1920 ve 1440 genişlik)
- [x] Testler: 25 birim + 124 story testi yeşil (40/40 story dosyası)
- [ ] **Gerçek veri bağlı değil** — S8'in işi. Mock'ların tamamı
      `meta.source === "mock"` ile bulunabilir.

---

## 9. Kalite kapıları — S6 durumu

- [x] Bileşen tekrarı yok — 31 mevcut bileşenin hiçbiri yeniden yazılmadı;
      3 yeni Executive bileşeni eklendi ve 10b'ye işlendi
- [x] S5 tasarım dili birebir: aynı `Section`, aynı `WorkspaceHeader`,
      aynı boş/hata desenleri, aynı `DataGuard` zinciri
- [x] Tüm değerler token'dan (ESLint 0 hata, 0 uyarı)
- [x] Her bölümün yükleniyor / boş / hata story'si var
- [x] Mock veri `meta.source === "mock"` + dev'de rozet
- [x] Ölçüm kaynağı olmayan alan boş — mock'ta bile uydurma yok
- [x] Sağ panel davranışı S2'deki ile aynı; kabuk DEĞİŞTİRİLMEDİ, yalnızca
      S5'te açılan `children` slot'u dolduruldu
- [x] Testler: 32 birim + 139 story testi yeşil (44/44 story dosyası)
- [x] Yedi genişlikte (768 · 1024 · 1280 · 1366 · 1440 · 1536 · 1920) yatay
      taşma = 0, üst üste binme = 0, kırpılan görünür metin = 0 —
      üç ekranda birden (Amazon · Briefing · Mission Control)
- [x] Görsel incelemede üç hata bulundu ve kök nedende düzeltildi (§7.5);
      biri S5'ten kalan gizli bir hataydı
- [ ] **Gerçek veri bağlı değil** — S8. `SkuHealth` sözleşmesi 🟡 TEKLİF,
      sahip onayı bekliyor (13-...md §15.2)
