# 10b — Executive Components (S4)

**Durum:** ✅ Üretildi — S4 · Executive Components
**Genişletildi:** S6 — §17 PPCOverviewCard · §18 CampaignIntelligenceList
· §19 SimulationPanel (üçü de Amazon Director'ın PPC Intelligence Center'ı
için; hiçbiri mevcut bir bileşenin ikinci sürümü değildir, gerekçeleri
kendi bölümlerinde). §1'e iki S6 notu eklendi.
**Kaynak:** `10-component-library.md` §10 envanteri (Executive Components satırı)
**Kod:** `src/components/executive/*`, `src/lib/clock/tick.ts`,
`src/lib/format/percent.ts`, `src/types/executive.ts`

Bunlar ODIN'i ODIN yapan bileşenlerdir. Başka üründe yoktur. `10a`'daki
primitive'ler üzerine kurulurlar; hiçbiri primitive yeniden yazmaz.

---

## 0. Ortak kurallar (hepsi için geçerli — tekrar yazılmaz)

### 0.1 Anti-fake zinciri — UI-ADR-088

Veri taşıyan her Executive bileşeninin **tek public çıkışı** `DataGuard`
ile sarılıdır. İçerideki `*View` bileşeni `env` değil, doğrulanmış `data`
alır — zarfı atlamak tip seviyesinde mümkün değildir.

Dört ayrı yokluk durumu, dört ayrı davranış (tek `NoData`'ya indirgenmez):

| Durum | Davranış |
|---|---|
| `canRender(env) === false` | `NoData` — bileşen gövdesi hiç çizilmez |
| Alan üretilmemiş (confidence yok) | O alan çizilmez; kartın geri kalanı durur |
| `freshness === "stale"` | Veri gösterilir, **bayat** işaretlenir, onay kilitlenir |
| Kural ihlali (alternatif < 2) | Bileşen `null` döner; bastırma gerçeğini **çağıran** yazar |

### 0.2 Her bileşende sağlanan

- `TrustSignal` — kaynak · tazelik · yaş, istisnasız
- Tüm değerler token'dan; ESLint temiz (0 hata, 0 uyarı)
- Renkten bağımsız durum göstergesi (glyph + metin + `sr-only`)
- `prefers-reduced-motion` — hareket kalkar, bilgi kalmaz
- SSR güvenli: hiçbir bileşen render sırasında `Date.now()` çağırmaz
- Storybook kaydı: `Executive/<sıra> · <ad>` — her birinde bir **boş veri**
  story'si vardır

### 0.3 İç yardımcılar (envantere girmez)

| Ad | Ne yapar | Neden ayrı |
|---|---|---|
| `DataGuard` | Zarf doğrulaması | Anti-fake'in tek uygulama noktası (UI-ADR-088) |
| `Disclosure` | Katmanlı açılma | KPI / Decision / Recommendation aynı davranışı paylaşır |
| `Meter` | 0–100 segmentli skor | Sürekli çubuk dinamik `style` isterdi → token kuralı ihlali |
| `useNow()` | Paylaşılan saat | 20 kart = 20 timer olmasın (UI-ADR-089) |
| `Metric` (S6) | etiket · değer · not üçlüsü | S6'da üç yerde aynı üçlü gerekti (Glance · PPC Overview · SKU paneli); `odin-num`'ın sağa hizalamasıyla başı dertte olan tek yer burasıdır |

### 0.4 Adlandırma notu

Envanterdeki `AICoreVisualization`, kodda **`AIPulse`** adıyla üretildi —
veri sözleşmesinin adı budur (`09-data-contracts.md` §10). Aynı bileşendir,
iki ad değil.

---

## 1. ExecutiveKPICard ⭐

**Katman:** Executive · **Dosya:** `executive-kpi-card.tsx`
**Bağımlılık:** `Card` · `Sparkline` · `Num` · `Badge` · `Button` · `NoData`

**Amaç:** CEO hiçbir yere gitmeden karar verebilsin. Kapalıyken bir KPI kartı
kadar sade, açıkken bir mini-rapor kadar zengin.

| Level | İçerik | Görünürlük |
|---|---|---|
| 1 | metrik adı · değer · trend · sparkline · TrustSignal | her zaman |
| 2 | AI yorumu · confidence · forecast · risk | "Detay" |
| 3 | önerilen aksiyon · kanıt sayısı · sorumlu | "Detay" |

**Tek açma düğmesi.** Level 2 ve 3 birlikte açılır: iki ayrı düğme sadeliği
bozar ve CEO'ya ikinci bir gezinme kararı yükler.

**Trend RENKLENDİRİLMEZ.** "Yukarı" her metrik için iyi değildir (ACOS
yükselmesi kötüdür). Yön glyph (▲ ▼ ■) + `sr-only` kelime ile verilir.

**Yüzde ölçeği tahmin edilmez** (UI-ADR-093). `unit: "percent"` ise `scale`
alanı zorunludur; yoksa değer `NoData`. 18.1'i 0.181 sanmak %1810 yazmaktır
ve bu, eksik veriden tehlikelidir çünkü makul görünür.

**Yüzde bir ondalıkla yazılır** (`fractionDigits: 1`). Intl varsayılanı
yuvarlıyordu: ACOS 18.1 → "%18". Amazon tarafında o ondalık karar değiştirir;
gerçek veriyi yuvarlayarak göstermek bilgi kaybıdır.

**Sparkline `tone="neutral"` ile çizilir** (UI-ADR-101, S6). `auto` kipi
yükselişi yeşil boyuyordu; ACOS yükselirken yeşil çizgi, kartın kendi
kuralının tersini söyler. Sözleşmede metriğin kutbu yok → doğru renk
bilinemez → renk iddiası yapılmaz.

**Kolon genişliği çağıranın sorumluluğudur** (S6 görsel incelemesi). Bir KPI
kartı ~260 px'in altına indiğinde `text-3xl` bir para değeri
(`₺2.640.000,00`) kartın dışına taşar; sayı bölünemez, kırpmak da rakam
gizlemek olur. Kart kaç kolona sığdığını bilemez, bu yüzden **grid** karar
verir: ikinci kolon `md` değil `lg`de, dördüncü kolon `2xl`de açılır.
Kartın içinde ayrıca değer bloğu `min-w-0`dır — esneyebilmesi için.

**States:** Default · Focus (düğme) · Empty (`NoData`).
**N/A:** Loading/Error → çağıran katmanın işi (`LoadingState`/`ErrorState`);
kartın kendi hata görünümü içerik türünü gizlerdi.

---

## 2. DecisionCard

**Dosya:** `decision-card.tsx` · **Bağımlılık:** `CouncilView`,
`MinorityOpinionBanner`, `AIRecommendationView`

Priority · Title · Executive Summary · Financial Impact · Risk · Confidence
· Evidence Count · Recommendation · **[Onayla] [Analizi aç]**

**Onayla butonu kartın üzerindedir** (05-...md §3.2). CEO karar vermek için
başka ekrana gitmez.

**Onay kilidi:** `meta.freshness === "stale"` ise buton `disabled`, sebebi
üstünde yazılı. Bayat veriyle verilen onay, sahte veriyle verilen onaydır.
Kapanmış kararda (`approved` / `rejected` / `completed`) buton hiç çizilmez.

**Azınlık görüşü kart gövdesindedir**, açılır bölümde değil.

---

## 3. DirectorCard

**Dosya:** `director-card.tsx` · **Bağımlılık:** `HeartbeatIndicator`, `useNow`

STATUS · Current Goal · Confidence · Tasks · Queue · Evidence
· Recommendations · Memory · Prediction · Heartbeat

**Canlılık hiyerarşisi:** `lastBeat` yoksa **bilinmiyor** (offline değil);
`beatIntervalMs * 3` aşıldıysa **offline** — durum verisi "analyzing" dese
bile offline kazanır, çünkü o bilgi eskimiştir. Offline kartta AI glow
kalkar ve "son bilinen durum" uyarısı çıkar.

`idle` → boş kart değil, **"Idle — monitoring"** (07-...md §12).

---

## 4. AIBrief

**Dosya:** `ai-brief.tsx`

📊 Numbers → 🔍 Analysis → 🧠 Interpretation → 🎯 Recommendation → 📑 Evidence

**Sıra sabittir.** Önce sayı, sonra yorum: "Evidence Before Opinion"
kuralının görsel karşılığı. Yorumu üste alan bir brifing, kanıtı süse çevirir.

🎯 adımı `AIRecommendationView`'dur; öneri kuralı sağlamazsa adım boş
bırakılmaz, **eksik alanların adı** yazılır (UI-ADR-091).

---

## 5. AIRecommendationCard

**Dosya:** `ai-recommendation-card.tsx`
**Dışa açılan yardımcılar:** `canRenderRecommendation()`,
`missingExplainabilityFields()`, `AIRecommendationView`

**İki sert kural:**

1. `alternatives.length < 2` → bileşen **`null` döner** (UI-ADR-091).
2. 7 explainability alanından biri eksikse → yine render etmez.
   Eksik sayılan: öneri metni · neden üretildi · sorumlu Director ·
   son doğrulama · güven skoru · kanıt (≥1) · ilgili bilgi (dizi) ·
   potansiyel riskler (dizi) · alternatifler (≥2).

**Her zaman görünür:** öneri · confidence · neden üretildi · sorumlu ·
son doğrulama · potansiyel riskler · beklenen finansal sonuç.
**Bir tık ötede:** sayısal veriler · neden/etki analizi · alternatifler ·
ilgili bilgi · kanıt zinciri.

---

## 6. EvidenceChain

**Dosya:** `evidence-chain.tsx`

`supportsOrContradicts` **sıralamayla** ayrışır: çelişen kanıt en üstte.
Glyph (✓ ✕ ○) + `sr-only` etiket + kenar rengi. Çelişen kanıtı listenin
dibine gömmek, kanıtı hiç göstermemekten kötüdür.

Başlıkta "N kanıt · M çelişen" sayacı vardır. `sourceQuality` ölçülmemişse
meter yerine `NoData`.

---

## 7. ConfidenceBadge

**Dosya:** `confidence-badge.tsx`

Skor üretilmemişse **hiç görünmez** (`null`). "Confidence —" yazmak bile
yanlıştır: kullanıcı orada bir skor bekler.

İki kullanım: `meta` (→ `canShowConfidence`) veya `value` (alan seviyesi).
Eşikler: ≥80 success · ≥50 warning · <50 danger (07-...md §11). Sayı her
zaman yazılır; renk tek başına anlam taşımaz.

---

## 8. TrustSignal

**Dosya:** `trust-signal.tsx` — **her veri bileşeninde zorunlu.**

kaynak · tazelik (● canlı / ◐ yakın / ○ bayat) · yaş.
Yaş metni ancak istemci saati geldikten sonra yazılır; SSR'da hiç yoktur —
"az önce" uydurulmaz ve hydration mismatch oluşmaz.

---

## 9. AlertStack

**Dosya:** `alert-stack.tsx`

`requiresAction: false` olan öğe **listeye girmez** (09-...md §6). Kaç öğenin
elendiği altta yazılır — sessiz yutma yoktur. Sıralama: critical → risk →
warning → info. Renk eşlemesi `01-product-vision.md` §5'ten gelir ve
değiştirilemez; her seviyenin metin etiketi vardır.

---

## 10. OpportunityCard

**Dosya:** `opportunity-card.tsx`

Risk ile **eşit görsel ağırlık** (05-...md §3.4). Sadece risk gösteren bir
sistem korku üretir.

Öneri açıklanabilirlik şartını sağlamazsa fırsat yine gösterilir: fırsat
ölçülmüş bir gerçektir, öneri bir AI çıktısıdır.

---

## 11. CouncilView + ConsensusIndicator

**Dosya:** `council-view.tsx`

Consensus · Disagreement · Evidence Quality · Financial Risk ·
Execution Complexity. Görüş satırları pozisyona göre ayrışır (＋ － ＝).

**Consensus + Disagreement = 100 VARSAYILMAZ** — ikisi ayrı ölçümdür, biri
diğerinden türetilmez. Ölçülmemiş gösterge meter yerine "ölçülmedi" yazar.
Görüş yoksa "hemfikir" denmez; kurul toplanmamıştır.

---

## 12. MinorityOpinionBanner

**Dosya:** `minority-opinion-banner.tsx`

**Gizleme prop'u YOKTUR** — teknik olarak katlanabilir hâle getirilmemiştir.
Görsel olarak bastırılmıştır: nötr ton, amber değil. Dokümandaki `⚠` yerine
nötr `◂`. Azınlık görüşü bir uyarı değil, bir bakış açısıdır; amber ton onu
her kararda alarma çevirir ve alarm körlüğü yaratır.

---

## 13. AIPulse

**Dosya:** `ai-pulse.tsx` · **Kaynak:** UI-ADR-071 (3 halka, 7 değil)

Çizim için **iki kapı**, ikisi de geçilmeli:
1. `activePulseChannels()` — registry kanalı açmış mı?
2. Gelen `ChannelState.available` — bu oturumda veri var mı?

Dönüş hızı veriden gelir: `load` 0 → 20 sn/tur, 100 → 4 sn/tur.
`active: false` → halka durur ve soluklaşır. Sabit hızlı halka sahte
telemetridir. Ölçülebilir kanal yoksa boş çekirdek çizilmez.

---

## 14. TelemetryBar

**Dosya:** `telemetry-bar.tsx` · **Kaynak:** UI-ADR-083

Kanal listesi bileşende sabit değildir, `activeTelemetryChannels()`'ten
gelir. Yeni servis canlıya çıkınca tek iş: registry'de `available: true`.

Açık kanalın değeri gelmemişse **"0" yazılmaz**, `NoData` çıkar —
"0 hata" ile "hata sayısı bilinmiyor" farklı şeylerdir.

---

## 15. HeartbeatIndicator

**Dosya:** `heartbeat-indicator.tsx` · **Karar:** UI-ADR-090

Üç durum: canlı · offline · **bilinmiyor**. Bilmemek ile ölmüş olmak farklı
şeylerdir.

Nabız sonsuz döngü değildir: her gerçek atımda **bir kez** atar
(`key={lastBeat}`). Yeni atım gelmezse hiçbir şey kıpırdamaz — canlılık
animasyondan değil veriden gelir.

Dokümandaki `█████████` çubuk göstergesi **çizilmedi**: 9 çubuk son 9 atımın
geçmişini ima eder, sözleşme yalnızca `lastBeat` verir.

---

## 17. PPCOverviewCard ⭐ (S6)

**Dosya:** `ppc-overview.tsx` · **Kaynak:** 06-...md §1.5 K1, 09-...md §9

PPC Health · Spend · Sales · ACOS · ROAS · **Profit After Ads**

**Neden ayrı bileşen, neden 6 adet `ExecutiveKPICard` değil:** `ExecutiveKPI`
sözleşmesi trend · sparkline · forecast · aiInsight · confidence ister;
`PPCOverview` bunların hiçbirini içermez. Altı KPI nesnesi üretmek, altı
uydurma trend ve altı uydurma tahmin üretmek olurdu.

**Profit After Ads bilerek boştur** (UI-ADR-098): kâr metriğidir, COGS
olmadan hesaplanamaz. Gerekçesi hücrenin altında ve kartın dibinde yazılıdır.
`PROFIT_NEEDS_COGS` sabiti dışa açıktır — aynı gerekçe SKU panelinde de
kullanılır, iki yerde iki farklı cümle yazılmaz.

**ACOS** `percentScale` ile çizilir; ölçek gelmezse `NoData` (UI-ADR-093).
**States:** Default · Empty (`NoData`). **N/A:** etkileşim durumları.

---

## 18. CampaignIntelligenceList (S6)

**Dosya:** `campaign-intelligence.tsx` · **Kaynak:** 06-...md §1.5 K2, 09-...md §9

Beş durum: `underperforming` · `acos_rising` · `budget_exhausting` ·
`scalable` · `healthy`. Her birinin Türkçe metin etiketi ve Badge glyph'i var;
renk tek başına anlam taşımaz.

**Sıralama SORUNLUDAN sağlıklıya**, alfabetik değil. Gerekçe `EvidenceChain`
ile aynıdır: çelişen kanıt listenin dibine gömülmez. Sorunlu kampanyayı
alfabetik sıranın ortasına gömmek, onu hiç göstermemekten iyi değildir.
Kural `sortCampaigns()` içinde tek yerdedir.

**Öneriler bir tık ötededir** (`Disclosure`) — beş kampanyanın önerisi aynı
anda açık olsa ekran bir rapora döner. Açıklanabilirlik şartını sağlamayan
öneri çizilmez ve **kaç tanesinin elendiği satırın altında yazar**
(UI-ADR-091: bastırmayı bilen katman yazar).

**States:** Default · Empty (kampanya yok) · `NoData` (zarf yok).

---

## 19. SimulationPanel (S6)

**Dosya:** `simulation-panel.tsx` · **Karar:** UI-ADR-099
**Kaynak:** 06-...md §1.5 K4, 09-...md §9 `SimulationResult`

Bu bir **hesap makinesi değildir.** Backend'de tahmin motoru yok (13-...md §6),
bu yüzden:

1. Senaryolar zarftan gelir; `SegmentedControl` yalnızca hazır vakalar
   arasında seçim yapar. İstemcide hiçbir sayı hesaplanmaz.
2. `assumptions[]` **her zaman görünürdür** — açılır bölümde değil. Boşsa
   senaryo hiç gösterilmez (`canRenderSimulation()`), elenen sayısı yazılır.
3. `meta.source === "mock"` iken başlıkta **`SİMÜLASYON — MOCK`** rozeti.
4. Gösterilecek senaryo yoksa gerekçeli boş durum: "motor yok".

`expectedChange` **metindir** (sözleşme öyle diyor) ve sayıya çevrilip
yeniden biçimlenmez — olmayan bir kesinlik iddia etmemek için.

**States:** Default · Empty (senaryo yok / varsayım yok) · `NoData`.

---

## 20. Kalite kapıları — S4 durumu

- [x] Bağımlılık zinciri ihlal edilmiyor (Executive → Primitive, tek yön)
- [x] S3 primitive'i yeniden yazılmadı
- [x] Tüm değerler token'dan (ESLint 0 hata, 0 uyarı)
- [x] Klavye ile tam kullanım, görünür focus
- [x] `prefers-reduced-motion` destekleniyor
- [x] Renkten bağımsız durum göstergesi
- [x] Her veri bileşeni `TrustSignal` gösteriyor
- [x] Boş veride hiçbir bileşen sahte içerik üretmiyor (her birinde boş story)
- [x] SSR/hydration güvenli (render'da `Date.now()` yok)
- [x] Testler: 22 birim + 97 story testi yeşil (32/32 story dosyası)
- [ ] **Gerçek ekranda doğrulanmadı** — bileşenler Storybook'ta yaşıyor,
      Executive Briefing ekranına yerleştirme S5'in işi.
