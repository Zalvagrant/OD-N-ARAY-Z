# 10b — Executive Components (S4)

**Durum:** ✅ Üretildi — S4 · ♻️ **S5.5'te revize edildi** (UI-ADR-109/110/111:
sözleşmeler ODIN'e hizalandı). ♻️ işaretli bölümler S4 metnini DEĞİŞTİRİR;
gerekçeler `08-decision-log.md`'dedir.

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
| Kural ihlali (♻️ S5.5: ODIN'in 10 zorunlu öneri alanından biri eksik — ör. `flip_conditions`) | Bileşen `null` döner; bastırma gerçeğini **çağıran** yazar |

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
| `ConfidenceBreakdown` | 8 kanonik güven bileşeni (♻️ S5.5) | Kara kutu sayı yok — ağırlıklar ve negatif yön görünür (UI-ADR-109) |

**Not (S6):** etiket · değer · not üçlüsü için ayrı bir Executive yardımcısı
YAZILMADI. S5.5'te aynı üçlü `Stat` adıyla **primitive** katmana çıkarılmıştı
(`ui/stat.tsx`, Mission Control'ün Operational Status'ünden); S6'nın üç
ihtiyacı (Glance · PPC Overview · SKU paneli) onu kullanır. İki oturum aynı
bileşeni iki adla üretmişti; `Metric` elendi, `Stat` kaldı — envanterde tek
kayıt olur.

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
| 1 | metrik adı · değer (FR-0044 zarfı) · trend* · sparkline* · TrustSignal | her zaman |
| 2 | AI yorumu* · confidence* · forecast* · risk* | "Detay" |
| 3 | önerilen aksiyon* · kanıt* · sorumlu* · kaynak · veri anı | "Detay" |

\* FR-0043'e kadar KAYNAKSIZ (UI-ADR-106): opsiyoneldir, mock dahi
doldurmaz, kart yokluğu NoData ile söyler. `value` artık
`{status, value, reason}` zarfıdır — `status !== "available"` ise sayı
yerine zarfın GEREKÇESİ basılır; "Data Required" metni sayı alanına
giremez (ADR-0135). Trend gelmediyse glyph uydurulmaz ("flat" bir
ölçümdür, varsayılan değil); risk gelmediyse "Risk yok" YAZILMAZ.

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

**Sparkline `tone="neutral"` ile çizilir** (UI-ADR-102, S6). `auto` kipi
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

## 2. DecisionCard ♻️ S5.5 (UI-ADR-110)

**Dosya:** `decision-card.tsx` · **Bağımlılık:** `CouncilView`,
`MinorityOpinionBanner`, `AIRecommendationView`, verdict formu

ODIN `DecisionRecord`un kartı: Tier (D1/D2/D3) · Status
(open/monitoring/closed) · Question · Öneri özeti · Confidence (kanonik
bant etiketiyle) · Kanıt sayısı · **Alternatifler (KARARIN alanı, min 2)**
· Azınlık görüşleri · **[Onayla] [Reddet] [Ertele]**

**ÜÇ verdict kartın üzerindedir** — ODIN sözlüğü (`approved/rejected/
deferred`). Yalnız "Onayla" sunmak reddi görünmez kılar ve ODIN hiçbir şey
öğrenmez. Gerekçe kuralı ODIN ADR-0131'indir: sınıf B/C'de her verdict
**≥8 karakter gerekçe** ister (onay dahil); `deferred` **gelecek tarih**
ister. UI kural icat etmez, `ceo verdict`i yüzeye taşır (taşıma: ADR-0142).

**Verdict kilidi (UI-ADR-092 genişletildi):** `stale` veride ÜÇ eylem de
kilitli, sebep yazılı. Verilmiş kararda butonlar hiç çizilmez; insan
kararı gerekçesiyle görünür.

**Azınlık görüşleri kart gövdesindedir**, açılır bölümde değil.

## 3. DirectorCard ♻️ S5.5-b (UI-ADR-111)

**Dosya:** `director-card.tsx` · **Sözleşme:** ODIN
`AgentHealthMonitor.snapshot()` (09b §5)

VERDICT (unknown/healthy/unhealthy) · son atım yaşı · Başarı/Hata oranı ·
Gecikme avg/p95 · Kuyruk · Maliyet · ardışık hata sayısı

**Canlılık UI'da TÜRETİLMEZ.** Eski "beatIntervalMs × 3 → offline" kuralı
UI icadıydı ve kaldırıldı; durum ODIN'in verdict'idir, `last_heartbeat`
yaş olarak yazılır, yorumlanmaz. Ölçülmemiş metrik `NoData` gösterir —
`availability` hiçbir ajanda hesaplanmıyorsa mock'ta bile `null`dur.

## 4. AIBrief

**Dosya:** `ai-brief.tsx`

📊 Numbers → 🔍 Analysis → 🧠 Interpretation → 🎯 Recommendation → 📑 Evidence

**Sıra sabittir.** Önce sayı, sonra yorum: "Evidence Before Opinion"
kuralının görsel karşılığı. Yorumu üste alan bir brifing, kanıtı süse çevirir.

🎯 adımı `AIRecommendationView`'dur; öneri kuralı sağlamazsa adım boş
bırakılmaz, **eksik alanların adı** yazılır (UI-ADR-091).

---

## 5. AIRecommendationCard ♻️ S5.5 (UI-ADR-110)

**Dosya:** `ai-recommendation-card.tsx`
**Dışa açılan:** `canRenderRecommendation()`, `missingExplainabilityFields()`,
`AIRecommendationView`

**Zorunluluk listesi ODIN'in 10 alanıdır** (şema `recommendation.required`):
text · confidence · confidence_breakdown · evidence · risks · assumptions ·
flip_conditions · consensus_score · disagreement_score · minority_opinions.
Biri eksikse bileşen `null` döner; bastırmayı çağıran yazar (UI-ADR-091'in
render davranışı korunur, alan listesi değişti).

**`alternatives` ARTIK BURADA ARANMAZ** — kararın alanıdır, DecisionCard
çizer. **`flip_conditions` kartta HER ZAMAN görünür** ("Bu öneriyi ne
değiştirir" bloğu) — açılır bölüme konursa kayıp alan geri gelir.
Güven dökümü (8 bileşen) açılır bölümdedir.

`whyGenerated/responsibleDirector/lastValidated/numbers/cause/impact/
expectedFinancialResult` ODIN şemasında YOK (not_exposed, 09b §9) —
opsiyoneldir, varsa çizilir.

## 6. EvidenceChain

**Dosya:** `evidence-chain.tsx`

`supportsOrContradicts` **sıralamayla** ayrışır: çelişen kanıt en üstte.
Glyph (✓ ✕ ○) + `sr-only` etiket + kenar rengi. Çelişen kanıtı listenin
dibine gömmek, kanıtı hiç göstermemekten kötüdür.

Başlıkta "N kanıt · M çelişen" sayacı vardır. `sourceQuality` ölçülmemişse
meter yerine `NoData`.

---

## 7. ConfidenceBadge ♻️ S5.5 (UI-ADR-109)

**Dosya:** `confidence-badge.tsx`

Skor üretilmemişse **hiç görünmez** (`null`). Bantlar **ODIN'in kanonik
bantlarıdır** (trust.py): ≥80 çok yüksek · ≥60 yüksek · ≥40 orta ·
≥20 düşük · <20 çok düşük. Eski 80/50 eşiği UYDURMAYDI ve silindi.
Beş bandın beşinin de metin etiketi vardır; sayı her zaman yazılır,
renk tek başına anlam taşımaz.

Skor üretilmemişse **hiç görünmez** (`null`). "Confidence —" yazmak bile
yanlıştır: kullanıcı orada bir skor bekler.

İki kullanım: `meta` (→ `canShowConfidence`) veya `value` (alan seviyesi).
**Eşikler KANONİKTİR, UI kararı değildir** (S5.5 · UI-ADR-098 / 09b §2):
`odin/trust.py::CONFIDENCE_LEVELS` → ≥80 very-high · ≥60 high · ≥40
moderate · ≥20 low · ≥0 very-low. S4'teki 50 eşiğinin ODIN'de karşılığı
yoktu, uydurulmuştu. Beş bant üç renge iner (success · warning · danger);
bant ADI `sr-only` metinde yazılır. Sayı her zaman yazılır; renk tek başına
anlam taşımaz.

---

## 8. TrustSignal

**Dosya:** `trust-signal.tsx` — **her veri bileşeninde zorunlu.**

kaynak · tazelik (● canlı / ◐ yakın / ○ bayat) · yaş.
Yaş metni ancak istemci saati geldikten sonra yazılır; SSR'da hiç yoktur —
"az önce" uydurulmaz ve hydration mismatch oluşmaz.

---

## 9. AlertStack

**Dosya:** `alert-stack.tsx` · **Sözleşme:** FR-0046 v1 Alert (09b §10)

`requiresAction: false` olan öğe **listeye girmez** (06-...md §1.4). Kaç
öğenin elendiği altta yazılır — sessiz yutma yoktur. Sıralama:
critical → high → medium → low → **severity'siz** (uydurulmaz, rozetsiz
ve en sonda). Satır: rozet? · başlık · yaş (`asOf`) · özet? ·
"Kaynak: {source}". Renk tek başına anlam taşımaz; her seviyenin metin
etiketi vardır (01-...md §5).

---

## 10. OpportunityCard

**Dosya:** `opportunity-card.tsx` · **Sözleşme:** FR-0046 v1 Opportunity
(09b §10)

Risk ile **eşit görsel ağırlık** (05-...md §3.4). Sadece risk gösteren bir
sistem korku üretir.

v1 kart: "Fırsat" rozeti · kaynak+yaş · başlık · gerekçe (`summary`) ·
**zorunlu** önerilen aksiyon (`suggestedAction`, düz metin) · kanıt
anahtarları (`evidence`, varsa). **"Gelir etkisi" YOK** (UI-ADR-106):
`estimatedImpact` v1 sözleşmesinde yok, parasal etki kaynağı kanıtlanmadan
yazılmaz. `confidence`/`deadline`/`category` de sözleşmede yok — çizilmez.

---

## 11. CouncilView + ConsensusIndicator ♻️ S5.5 (UI-ADR-110)

**Dosya:** `council-view.tsx` · Skorlar **önerinin** alanlarıdır.

Consensus + Disagreement. ODIN'de `disagreement = 100 − consensus`
(consensus.py, TÜRETİLMİŞ) — S4 metnindeki "ikisi ayrı ölçümdür" iddiası
YANLIŞTI ve düzeltildi; gösterim türetimi açıkça yazar. Evidence Quality /
Financial Risk / Execution Complexity göstergeleri kaldırıldı: karşılıkları
yok; ölçülmesi planlanmayan gösterge çizilmez (UI-ADR-071 ilkesi).
Director pozisyon satırları karar kaydında SAKLANMAZ — uydurulmaz;
saklanmama gerçeği bileşende açıkça yazılıdır.

## 12. MinorityOpinionBanner ♻️ S5.5 (UI-ADR-110)

**Dosya:** `minority-opinion-banner.tsx`

**Gizleme prop'u YOKTUR** — teknik olarak katlanabilir değildir. Nötr ton
(amber değil), nötr `◂`. ODIN `minority_opinions` bir **düz metin
listesidir** ("üye: seçenek — gerekçe"); üye başına güven skoru kayıtta
olmadığından rozet de yoktur. Görüş yoksa kutu da yok.

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

## 15. HeartbeatIndicator ♻️ S5.5-b: KALDIRILDI (UI-ADR-111)

Sözleşmesi (`beatIntervalMs`) kaynaksız kaldı; canlılık hükmü artık
ODIN'in `verdict`idir ve DirectorCard'da rozet olarak görünür.
"Atım başına tek nabız" ilkesi (UI-ADR-090) geçerliliğini korur — gerçek
bir atım akışı sözleşmesi doğarsa bileşen o ilkeyle geri gelir.

## 17. PPCOverviewCard ⭐ (S6)

**Dosya:** `ppc-overview.tsx` · **Kaynak:** 06-...md §1.5 K1, 09-...md §9

PPC Health · Spend · Sales · ACOS · ROAS · **Profit After Ads**

**Neden ayrı bileşen, neden 6 adet `ExecutiveKPICard` değil:** `ExecutiveKPI`
sözleşmesi trend · sparkline · forecast · aiInsight · confidence ister;
`PPCOverview` bunların hiçbirini içermez. Altı KPI nesnesi üretmek, altı
uydurma trend ve altı uydurma tahmin üretmek olurdu.

**Profit After Ads bilerek boştur** (UI-ADR-116): kâr metriğidir, COGS
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

**Dosya:** `simulation-panel.tsx` · **Karar:** UI-ADR-117
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
