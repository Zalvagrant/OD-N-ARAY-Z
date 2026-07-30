# 10c — Screens (S5)

**Durum:** ✅ Üretildi — S5 · Executive Briefing + Mission Control
**Kaynak:** `05-dashboard.md` (tamamı), `03-information-architecture.md` §3–§5
**Kod:** `src/components/screens/*`, `src/components/layout/{section,workspace-header}.tsx`,
`src/mocks/*`, `src/types/screens.ts`

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

**Verdict (♻️ S5.5):** Onayla · Reddet · Ertele kartın üzerindedir
(UI-ADR-110; B/C'de gerekçe ≥8, deferred gelecek tarih). Mock aşamasında
yalnızca oturum içi işaretlenir ve **hiçbir yere yazılmadığı** ekranda
yazar; kalıcı kayıt S7'de `ceo verdict` üzerinden (ADR-0142).

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

## 6. Kalite kapıları — S5 durumu

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
