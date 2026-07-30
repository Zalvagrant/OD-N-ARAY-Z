# 10c — Screens (S5 · S6)

**Durum:** ✅ Üretildi — S5 · Executive Briefing + Mission Control
· S6 · Amazon Director (§7)
**Kaynak:** `05-dashboard.md` (tamamı), `06-workspaces.md` §1,
`03-information-architecture.md` §3–§5
**Kod:** `src/components/screens/*`, `src/components/layout/{section,workspace-header}.tsx`,
`src/mocks/*`, `src/types/screens.ts`, `src/lib/store/ui.ts` (`SelectedEntity`)

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
| `Goal.progressPct` (kur riski hedefi) | kısmi ve sürekli, ölçülmüyor — nötr 50 de "ölçülmedi"dir (ADR-0132) | `NoData` |
| KPI `trend` · `sparkline` · `aiInsight` · `forecast` · `risk` | ODIN retained time series tutmuyor (FR-0043, UI-ADR-106) | `NoData` |
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

**Primary Focus Area: Goal Board** (Mission → Goal, ODIN ADR-0132 ·
UI-ADR-107). Ekranda ondan ağır ikinci bir alan yoktur (03-...md §5).

```
WorkspaceHeader (arama: hedef/seviye/başlık)
Operational Status         ← registry + heartbeat ölçümü, tahmin yok
Goal Board                 ← PRIMARY: kolonlar ODIN'in GERÇEK `level` alanından
Upcoming Deadlines | Executive Alerts
  └─ Deadlines GEREKÇELİ BOŞ: Goal yayınında termin alanı yok, uydurulmaz
Director Coordination
Active Projects | Resource Allocation | Automation Queue   ← sözleşme yok (UI-ADR-096)
```

`GoalBoard` ilerlemeyi `Meter` ile çizer; `progressPct === null` ise çubuk
çizilmez — `goals.alignment()`'ın nötr 50'si "ölçülmedi"dir, adaptör null'a
çevirir, tahta asla %50 çizmez (ADR-0132 tuzağı). Eski kanban `status`
kolonları (Yürüyen · Engelli · Planlı · Tamamlanan) İCATTI ve kaldırıldı;
termin/sorumlu/engel alanları da kaynaksızdı, düştü.

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
Documents) **çizilmedi**: sözleşmeleri yok, soru 13-...md §16.4'te.

### 7.4 Bilerek boş dört yer

| Yer | Neden |
|---|---|
| Net Profit KPI'ı **yok** | COGS yok → hesaplanamaz. Yerine Gross Profit + hariç tutulanlar (UI-ADR-116). 09b §8 doğruladı: `amazon_director.py` hesaplayamayınca `"Data Required"` yazıyor |
| Profit After Ads | aynı sebep; kâr metriğidir |
| Sales & Profit Analytics | 09-...md'de **etiketli zaman serisi yok**; `sparkline` yön gösterir, tarihli seri değildir |
| Orders akışı | `AmazonSnapshot.orders` bir SAYIDIR; akış ve anomali ondan türetilemez |

Ayrıca `SkuHealth.grossMarginPerUnit` her SKU'da `null`, `buyBoxRate`
raporlanmayan SKU'da `null`, `healthScore` üretilmeyen SKU'da `null` —
mock'ta bile doldurulmadı (UI-ADR-101 sıkılaştırması).

### 7.5 Görsel incelemede yakalananlar

1920 · 1440 · 768 px'te bakıldı; ayrıca yedi genişlikte (768→1920) taşma
taraması yapıldı. Testlerin yakalamadığı **üç hata** çıktı, üçü de kök
nedende düzeltildi:

| Bulgu | Kök neden | Düzeltme |
|---|---|---|
| 768'de yatay kayma (13 px). **Aynı hata S5'in briefing ekranında da vardı** — S5 yalnızca 1920 ve 1440'ta bakılmıştı | KPI kolonu `md`de ikiye bölünüyordu; kart içi 172 px'e düşüyor, `text-3xl` para değeri (`₺2.640.000,00` ≈ 185 px) sığmıyordu. Sayı bölünemez | Kolon eşikleri `lg` / `2xl`e taşındı (her iki ekranda); kart içinde değer bloğuna `min-w-0` |
| "Gross Profit (ücretler hariç)" başlığı kırpılıyordu — 1280'de 71 px, 1920'de 11 px. Kartın dürüstlüğünü taşıyan parantez kayboluyordu | `CardHeader` başlığı `truncate` idi | `truncate` → `break-words`. Kısa başlıklarda davranış değişmez |
| ACOS %14,2 → %18,1 **yükselirken sparkline YEŞİL** | `Sparkline` varsayılanı `tone="auto"`, yükselişi olumlu sayar. Kartın kendi kuralı ("trend renklendirilmez") ihlal ediliyordu | UI-ADR-102 → kart `tone="neutral"` verir |

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
| `Stat` | `ui/stat.tsx` | Etiket · değer · not üçlüsü olan her yerde |
| `percentFactor` / `toPercentUnit` | `lib/format/percent.ts` | Yüzde taşıyan HER modül; ölçek bildirilmemişse `NoData` |
| Kâr kuralı | `PROFIT_NEEDS_COGS` + UI-ADR-116 | Finance/Trading'de de kâr metriği aynı kapıdan geçer |
| Sözleşmesi olmayan bölüm deseni | `noContract()` (ekran içi yardımcı) | Başlık + neden + sorunun düşüldüğü yer |
| Bağlam paneli sağlayıcısı | `SelectedEntity {workspaceId, kind, id}` + app-shell'de `kind` eşleşmesi | Yeni workspace kendi `kind`'ını tanımlar; panel KABUĞU değişmez. **Kopya değil kimlik** saklanır |
| Simülatör kuralı | UI-ADR-117 | Motoru olmayan her "ne olur?" özelliği |
| Görsel doğrulama betiği | taşma + kırpılma + üst üste binme taraması | Her ekran için yeniden çalıştırılır |

### 7.7 S5.5 ile hizalama — S6 sonrası düzeltmeler

S6, `09-data-contracts.md` üzerine kuruldu. Paralel yürüyen S5.5
(UI-ADR-098) o dosyanın **kanonik olmadığını** kanıtladı: ODIN çekirdeği
okundu, uydurulmuş ve kayıp alanlar `09b-verified-contracts.md`'ye yazıldı.
S6'nın etkilenen yerleri kapanışta hizalandı:

| 09b bulgusu | S6'da ne yapıldı |
|---|---|
| §8 `amazon_director.py` net kârı hesaplayamayınca `"Data Required"` yazıyor | UI-ADR-116 **doğrulandı** — kural bir arayüz tercihi değil, backend'in zaten uyguladığı davranış. ADR'ye kaynak eklendi |
| §2 confidence bantları kanonik: ≥80 · ≥60 · ≥40 · ≥20 (`odin/trust.py`) | `confidence-badge.tsx` 80/50'den kanonik beş banda geçti; bant adı `sr-only`da yazılıyor. S6'nın her güven rozeti bundan besleniyor |
| S5.5'in `SelectedEntity {workspaceId, kind, id}` deseni | S6'nın `store/amazon.ts`'i **elendi**. Panel artık SKU'nun kopyasını değil kimliğini tutuyor; liste yenilenince bayat kayıt kalmıyor, kimlik bulunamazsa detay uydurulmuyor |
| S5.5'in `ui/stat.tsx` primitive'i | S6'nın `executive/metric.tsx`'i **elendi**. İki oturum aynı bileşeni iki adla üretmişti; envanterde tek kayıt kaldı |

**S6 kapsamı dışında bırakılanlar** (09b §9'un 1. maddesi, ayrı iş):
`Decision`'ın `flip_conditions` · `assumptions` · `confidence_breakdown`
kayıpları · `alternatives`'ın kararın alanı olması (UI-ADR-091'in dayanağı)
· `DirectorHeartbeat`'in gerçek sağlık metrikleri · consensus metninin
düzeltilmesi. Bunlar S4 bileşenlerini yeniden yazmayı gerektirir ve
Amazon Director'ın kapsamında değildir.

### 7.8 Kapanış incelemesi — iki hata daha

S6, iki oturumun işi birleştikten sonra bir kez daha 1920 · 1440 · 768'de
gözden geçirildi. Testlerin (32 birim + 139 story) yakalamadığı **iki hata**
çıktı; ikisi de kök nedende düzeltildi.

| Bulgu | Kök neden | Düzeltme |
|---|---|---|
| PPC kartındaki dört sayı birbirini yalanlıyordu: `$2.420 / $18.300` ile ACOS %18,1 ve ROAS 5,4 bir arada duramaz. TACOS ise harcamayla **160 kat** uyumsuzdu. Üstelik ekranın tamamı ₺ iken bu kart $ idi | Değerler `06-...md` §1.5'teki örnek tablodan birebir kopyalanmıştı; **dokümanın kendi örneği tutarsız** | UI-ADR-103. Mock tek para birimine (₺) çekildi ve türetilebilir alanlar bileşenlerinden yazıldı. `mocks/amazon.test.ts` bu ilişkileri **kalıcı olarak** koruyor — ilk koşumda gözden kaçan bir tutarsızlığı (şeritte ROAS 5,4 / kartta 5,5) hemen yakaladı |
| PPC kartında SPEND ile SALES **üst üste biniyordu**: 1920'de bitişik, **1440'ta 45 px iç içe** | `grid-cols-3` → Tailwind `minmax(0,1fr)` üretir; sütun içeriğinin altına inebilir ve para değeri sarmadığı için taşar. Kart zaten ekranın 1/3'ünde | Kartta en fazla **iki** kolon + değerler `xl` → `lg`. Her genişlikte pay pozitif (en dar durum 1440'ta 18 px) |

**Ölçüm dersi — 1440 listeye eklendi.** İkinci hata 1920'de "bitişik" görünüp
768'de hiç görünmüyordu; en kötü hâli **aradaki** genişlikteydi. En dar ve en
geniş ekrana bakmak yetmiyor.

**§7.5'teki ortam notu artık geçerli değil:** bu koşumda `next dev` sorunsuz
hydrate oldu (mock veri geldi, `MockBadge` göründü, konsol hatası 0). Görsel
doğrulama dev sunucusunda yapılabiliyor. Betikte dikkat edilecek tek şey
bekleme koşuludur: `networkidle` HMR yüzünden hiç gerçekleşmez ve `Section`
yükleme durumunda başlığını zaten bastığı için **başlık beklemek de yetmez** —
yalnızca veri geldiğinde var olan bir düğüm beklenmeli (DataTable'ın satır
sayacı). Erken ölçüm 768'de sayfayı 11.478 yerine 4.700 px sanıyordu.

### 7.9 Sözleşme revizyonu — `SkuHealth` (UI-ADR-104)

Sahibin talimatıyla `SkuHealth` teklifi gavadolar'a danışıldı; dört maddede
de "yetersiz, S8'den önce revize edin" cevabı geldi ve uygulandı. Ekrana
yansıyan iki değişiklik var:

**Sağ panelde skorun gerekçesi.** Health Score artık yalnız bir sayı değil;
altında **"Skoru ne belirledi"** listesi var ve katkılar 100'den skora
götürüyor (−28 · −22 · −12 → 38). CEO toplayıp skoru doğrulayabiliyor.
Skor hesaplanamamışsa başlık **"Skor neden hesaplanmadı"** olur ve eksik
kaynaklar yazılır — bir şeyin neden üretilemediği de bir açıklamadır.

**Dönem artık etikette değil veride.** "Ciro (30 gün)" gibi etiketler
pencereyi adlarında taşıyordu; pencere değiştiği gün etiket yalan söylerdi.
Bölüm başlığının altında **"Dönem: 30/06 – 29/07"** yazıyor ve doğrudan
`sales.period` / `advertising.period`'dan geliyor. Gün sayısı hesaplanmıyor,
pencerenin kendisi yazılıyor.

Ayrıca tabloda **iki etiket düzeldi**: SKU-4102 skoru 55 iken "İzlemede",
SKU-1188 skoru 64 iken "Riskli" görünüyordu — daha kötü skorlu SKU daha iyi
etiketliydi. Eşik tablosu (`statusBasis`) bunu kapattı.

---

### 7.10 FR-0046 hizalaması (UI-ADR-106 · UI-ADR-107)

Meclis denetimi (16-audit) S6'yı FR-0046'ya kapılamıştı; sahip onaylı
meclis sentezi sonrası ekran v1 sözleşmelere hizalandı:

- **KPI Strip:** değerler `{status, value, reason}` zarfında; FR-0043
  katmanları (trend · sparkline · yorum · forecast · risk) mock'tan da
  çıkarıldı — kartlar NoData basar, `amazon.test.ts` geri sızmayı kapılar.
- **Fırsat kartı:** "Gelir etkisi" SÖKÜLDÜ (`estimatedImpact` v1'de yok);
  kart artık gerekçe + zorunlu düz-metin öneri + kanıt anahtarları.
- **PPC Katman 3:** Opportunity'de kategori alanı kalmadığı için reklam/genel
  ayrımı yapılamıyor — tüm fırsatlar Feed'de, K3 gerekçeli boş (soru
  13-...md §17).
- **SKU paneli "ilgili uyarılar":** Alert'te varlık referansı yok →
  eşleşme yapılamıyor, gerekçeli boş (soru 13-...md §17).
- **Glance:** "Mission Progress" → "Goal Progress" (`goalProgressPct`,
  kaynak goals.py; mock değeri Goal Board'un g-ppc hedefiyle tutarlı).

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
- [x] Testler: 40 birim + 143 story testi yeşil (45/45 story dosyası).
      Kapanışta eklenenler: `mocks/amazon.test.ts` (mock iç tutarlılık kapısı,
      UI-ADR-103) ve SKU bağlam panelinin dört story'si
- [x] Yedi genişlikte (768 · 1024 · 1280 · 1366 · 1440 · 1536 · 1920) yatay
      taşma = 0, üst üste binme = 0, kırpılan görünür metin = 0 —
      üç ekranda birden (Amazon · Briefing · Mission Control)
- [x] Görsel incelemede **beş** hata bulundu ve kök nedende düzeltildi
      (§7.5 üç + §7.8 iki); biri S5'ten kalan gizli bir hataydı, biri de
      yalnızca 1440'ta görünüyordu
- [x] Mock veri iç tutarlı: ACOS · ROAS · TACOS bileşenlerinden çıkıyor,
      ekranda tek para birimi (USD, sahip kararı) var, KPI şeridi ile Glance
      ve AI brifingi aynı sayıları söylüyor, uyarıların işaret ettiği SKU'lar
      gerçekten listede — hepsi birim testiyle korunuyor
- [x] Türetilmiş skor gerekçeli (ADR-0085): katkılar 100'den skora götürüyor
      ve `status` eşik tablosuyla tutarlı (UI-ADR-104)
- [ ] **Gerçek veri bağlı değil** — S8. `SkuHealth` sözleşmesi 🟡 TEKLİF
      olmayı sürdürüyor ama revize edildi (UI-ADR-104); açık kalan sorular
      13-...md §16.2'de — en önemlisi `buyBoxRate`'in kaynağı
