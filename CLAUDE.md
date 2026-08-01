# CLAUDE.md — ODIN Arayüz Reposu

> Bu dosyayı her oturumda okuyorsun. Buradaki kurallar bağlayıcıdır.

---

## Bu repo nedir

ODIN'in yeni arayüzü. `Zalvagrant/OD-N-ARAY-Z`.

ODIN'in kendisi ayrı bir repodadır (`Zalvagrant/ODIN`) — Python 3.13
stdlib-only bir **Decision Intelligence Standard**. Bu repo onun
**görüntüleme katmanıdır**, parçası değildir.

**İki repo arasındaki sınır:**

| Repo | Ne var | Bu projede rolü |
|---|---|---|
| `ODIN` | Backend, iş mantığı, Amazon SP-API, karar motoru, 71 ADR | **Okunur.** İş mantığına dokunulmaz |
| `OD-N-ARAY-Z` (burası) | Yeni React arayüzü | Tüm UI kodu burada yazılır |

---

## Tek kaynak: `docs/ui_chatgpt/`

Bu klasör arayüzün tam spesifikasyonudur. **Bir şey yazmadan önce oku.**

| Dosya | Ne zaman oku |
|---|---|
| `00-index.md` | Başlangıçta bir kez — sözlük ve durum |
| `02-design-principles.md` | Her tasarım kararında |
| `03-information-architecture.md` | Layout/grid yazarken |
| `04-navigation-system.md` | Menü, routing, command palette |
| `05-dashboard.md` | Briefing / Mission Control ekranları |
| `06-workspaces.md` | Her workspace ekranı |
| `07-ai-directors.md` | AI ile ilgili her şey |
| `08-decision-log.md` | "Bu neden böyle?" sorusunun cevabı |
| `09-data-contracts.md` | ⚠️ ARTIK KANONİK DEĞİL — tarihsel kayıt |
| `09b-verified-contracts.md` | **Veri çekerken, tip yazarken.** ODIN okunarak doğrulanmış sözleşmeler (UI-ADR-098) |
| `10-component-library.md` | Her bileşende |
| `10a-core-components.md` | S3 primitive'lerinin API'si ve durum matrisi |
| `10b-executive-components.md` | S4 executive bileşenlerinin API'si ve anti-fake kuralları |
| `10c-screens.md` | S5 ekran katmanı — Section, WorkspaceHeader, ekran dizilimleri |
| `11-design-tokens.md` | Renk/boşluk/gölge yazarken |
| `12-motion-system.md` | Animasyon yazarken |
| `15-execution-plan.md` | Sprint sırası — hangi işi ne zaman |

`kod/` klasöründe Sprint 1'in hazır kodu var — sıfırdan yazma, entegre et.

---

## Bağlayıcı kurallar

### 1. İş mantığı değiştirilmez

Bu proje **yalnızca görsel dili ve kullanıcı deneyimini** dönüştürür.
Yeni iş mantığı icat etme. Mevcut yeteneği kaldırma. İş akışı sadeleştirme.

### 2. Sahte veri yasak — en önemli kural

Ekranda dönen bir AI halkası varsa, **gerçekten bir şey dönüyor olmalı.**

- Sahte heartbeat animasyonu yok
- Uydurma confidence skoru yok
- Karşılığı olmayan telemetri kanalı **çizilmez**
- Veri yoksa "veri yok" durumu gösterilir, placeholder değil

`kod/data-envelope.ts` içindeki `canRender()` bu kuralın uygulamasıdır.
Her veri bileşeni render öncesi onu çağırır.

Gerekçe: kullanıcı bir kez sahte bir gösterge fark ederse, hiçbir göstergeye
bir daha güvenmez. Ürünün tamamı çöker.

### 3. Token dışında değer yazılmaz

```tsx
<div className="bg-[#111827]" />   // ❌ ESLint hata verir
<div className="bg-surface" />     // ✅
```

Renk, boşluk, gölge, animasyon süresi — hepsi token'dan gelir.
`kod/eslint-token-rule.md` bu kuralı zorlar.

### 4. Animasyon yalnızca 4 amaç için

Context Change · Focus · Feedback · State Transition.
Dekoratif animasyon yok. Hiçbir geçiş 400ms'i aşmaz.
Süreler `kod/motion.ts`'ten import edilir, inline yazılmaz.

### 5. Bileşen tekrarı yasak

Yeni bir bileşen yazmadan önce `10-component-library.md` §10'daki envantere
bak. Varsa kullan, benziyorsa genişlet, yoksa **önce dokümana ekle**, sonra yaz.

### 6. ADR öneki: `UI-ADR-###`

Bu repodaki kararlar `UI-ADR-001…179` serisindedir — **boşluk yok.**
S13 merge edildiğinde `main`'in S15 için açtığı 130–139 aralığı doldu.
ODIN'in kendi serisi `ADR-0001…` — **karıştırma.**

Yeni bir mimari karar alırsan `08-decision-log.md`'ye **`UI-ADR-180`'den**
devam ederek ekle. Eski kararı silme; `♻️ Değiştirildi` işaretle.

⚠️ **Numarayı almadan önce dosyanın SONUNA VE `main`'e bak.** Bu dosyada
YEDİ kez numara çakıştı (098; 099/100 iki kez; 116/117 — bir oturum
099/100'ü 116/117'ye taşırken başka bir oturum 116/117'yi S8 için almıştı)
çünkü paralel oturumlar aynı anda numara alıyor; BEŞİNCİSİ 129 idi
(S13 dalı lokal 129'u aldı, main aynı gün S14 için 129'u DONDURDU —
lokal olan 135'e taşındı). Karar günlüğü bu repoda geri alınması en zor dosyadır.

**ALTINCI ve YEDİNCİ çakışma (31 Tem 2026):** S13 dalı açıkken `main`
S15 ve S16'yı aldı ve **140 ile 141'i** dondurdu; S13'ünkiler
**148/149**'a taşındı. Aynı gün S13 merge edildi ve `main`'in S15 için
açtığı 130–139 boşluğu doldu.

**SEKİZİNCİ çakışma:** S17 ile S13 aynı gün indi, ikisi de UI-ADR-142
yazmıştı. **S17 ÖNCE indi (`67e0bfc`)**, S13 sonra — S17'nin 142'si kaldı,
S13'ünki **150**'ye taşındı.

Kural üç cümlede: **numarayı `main`'den al, dalından değil** ·
merge edilmiş ve yayında olan kazanır, lokal olan taşınır ·
**dal açıkken `main` yeniden hareket edebilir — merge öncesi TEKRAR bak.**

### 7. Karar ODIN çekirdeğini etkiliyorsa

Yeni bir API endpoint'i veya veri modeli değişikliği gerekiyorsa: **kendin
yapma.** `13-backend-recommendations.md`'ye not düş ve sor. ODIN'in kendi
governance süreci var (ADR-0050, R-006 request registry).

---

## Teknoloji

| Katman | Seçim |
|---|---|
| Framework | React + Next.js |
| Dil | TypeScript |
| Stil | Tailwind CSS (token tabanlı) |
| Bileşen | shadcn/ui |
| Animasyon | Framer Motion |
| İkon | Lucide |
| Tablo | TanStack Table |
| Veri | React Query |
| State | Zustand |

**Mimari konum:** Bu arayüz, ODIN'in `IRenderer` portunun (ADR-0080) bir
adaptörüdür. ODIN çekirdeği buna bağımlı değildir — yarın React atılsa ODIN
çalışmaya devam eder. Bu, ODIN'in "vendor lock-in yasak" anayasasıyla
uyumun tek yoludur.

---

## Backend bağlantısı

ODIN'de çalışan localhost sunucusu (`odin/cockpit.py`, 127.0.0.1'e bağlı):

```
GET  /api/state     → dashboard projeksiyon verisi
GET  /api/events    → olay akışı
GET  /api/tasks     → görevler
POST /api/command   → beyaz listeli `python -m odin ...` komutu
```

Yeni arayüz buraya bağlanır. **Yeni backend yazma.**

⚠️ Sunucu bilinçli olarak sadece localhost'ta. Dışarı açma — ayrı güvenlik
incelemesi gerektirir, kapsam dışı.

---

## ODIN'de zaten var olanlar

Bunları yeniden icat etme, mevcut interface'lere bağla:

| İhtiyaç | ODIN'deki karşılığı |
|---|---|
| Council + consensus + minority opinion | `IConsensusEngine` |
| Karar + kanıt + güven + risk + alternatif | `IDecisionEngine.ask()` |
| Confidence skoru | `IConfidenceEngine.assess()` |
| Risk analizi | `IRiskAnalyzer` |
| Karar kaydı + replay (silme yok) | `IDecisionLog` |
| Explainability zorunluluğu | ADR-0085 Explainability Envelope |
| Kanıt zorunluluğu | ADR-0081 Mandatory Claim Provenance |
| İnsan onayı | ADR-0086 Human Sign-off Gate |
| Model router / maliyet | `IModelProvider` (usage/cost döner) |
| Event bus | `IEventBus` (ADR-0021) |
| Knowledge graph | `IKnowledgeGraph` (ADR-0045) |
| Amazon SP-API | `odin/spapi.py` → `SpApiAdapter` |

---

## Çalışma şekli

### Sprint sırası

`15-execution-plan.md` — S0…S13.

⚠️ **Bu bölüm 1 Ağu 2026'da yeniden ölçülüp hizalandı** (öncesi: 31 Tem).
Bir gün önce "hizalandı" denmiş olmasına rağmen dört satır yine yanlıştı:
S8 ve S10 "dalda" diyordu (ikisi de `main`'deydi), S11 ve S12 panoda hiç
yoktu, S9'un erteleme gerekçesi ölçümle çürümüştü. Bu panoyu elle tutmak
sekiz ADR numarası çakışmasının kök nedeni.

🔧 **Bu pano ELLE TUTULMAYACAK — S18'de Git'ten türetilecek** (C-1,
`docs/ui_chatgpt/20-s18-worklist.md` §B2). O iş bitene kadar: **sprint
bitirince BURAYI da güncelle**, ve numarayı `main`'den al.

**`main` = S1…S17 + S13** (1 Ağu 2026, `1aa1a65`). Dört sprint dalının da
`origin/main`'de olmayan commit'i **0** (ölçüldü: s8-v2 · s10 · s11 · s12).
ADR-0143 hizalıdır (Alert/KPI
kanonik zarfları · Opportunity ayrı kayıt DEĞİL · Mission reddedildi,
tahta "izlenen kararlar + vadesi gelen ertelemeler" görünümü).

| Sprint | Durum |
|---|---|
| S1 Token · S2 App Shell · S3 Core · S4 Executive | ✅ `main`'de |
| S5 Briefing + Mission Control · S5.5 Sözleşme Hizalama | ✅ `main`'de |
| S6 Amazon Director | ✅ `main`'de (ADR-0143'e hizalandı) |
| S7 State & Data Layer | ✅ `main`'de (UI-ADR-112…115) |
| S8 Amazon Canlı Bağlantı | ✅ `main`'de (UI-ADR-118…124) — `/goals` ile **ilk canlı ODIN verisi ekranda** |
| S10 Amazon canlı KPI + Alert | ✅ `main`'de (UI-ADR-126) — ODIN ADR-0147'nin `GET /api/amazon` yayınına bağlı; Amazon Director şeridi ve alarmları **gerçek veri** |
| S11 Director sağlığı | ✅ `main`'de (UI-ADR-127) |
| S12 SKU olguları | ✅ `main`'de (UI-ADR-128) |
| S9 AI Gateway | ⬜ başlanmadı — **erteleme gerekçesi 1 Ağu'da kısmen çürüdü.** Eski gerekçe "0 model çağrısı"ydı; ölçüm artık **3 `provider.call`** ve token'lar yayınlanıyor (155/25). AMA **3/3 çağrıda `cost_known:false`** ve router modülü hâlâ yok → maliyet paneli bugün de kural 2 ihlali olur. Meclis 2/2: S18 değil, sonraki sprint |
| S14 Runtime alarmları · S15 Ölçüm penceresi · S16 Fırsat görünümü | ✅ `main`'de (UI-ADR-129 · 140 · 141) |
| S17 Storybook kapısı | ✅ `main`'de (UI-ADR-142) — `npm run test:ci` fail-closed |
| **S13 Kurumsal Ön Yüz Mimarisi** | ✅ **`main`'de** — UI-ADR-130…139 + 143…153. Sahip onayladı. Kapılar: katman sınırları · envanter · sahte veri kaçağı · erişilebilirlik · ekran durum matrisi |

✅ **S13 kapandı ve `main`'e indi.** Geçmişi ve tuzakları
`docs/ui_chatgpt/19-s13-devir.md`'de.

⚠️ **TESTİ NASIL KOŞACAKSIN:** `npm run test:ci` — **typecheck + lint +
unit + storybook**, dördü de fail-closed (S17 + UI-ADR-154 kapıları
kapısı). Çıplak `npx vitest run` KULLANMA — `unit` ile `storybook` aynı
anda koşarsa node işçileri CPU'yu tutuyor, tarayıcı bağlantısı düşüyor ve
özet satırı yine "passed" yazıyor. Eski devir belgelerindeki *"dev
sunucusunu kapat"* teşhisi YANLIŞTI; gerçek sebep `connectTimeout` idi
(UI-ADR-142, soğuk önbellekle 300 sn ölçüldü — düşürmeden önce
`rm -rf node_modules/.vite` ile SOĞUK ölç).

**S8 ne teslim etti:** veri borusu + kapılar + canlı vekil + **`/goals`
ekranı**. Sahip Goal kapsam kararını verdi (gavadolar 2/2 → ayrı ekran,
UI-ADR-124) ve `Hedefler` arayüzdeki **ilk canlı ODIN verisini**
gösteriyor — 3 acil hedef ölçülen ilerlemeleriyle, 5 çeyreklik hedef
"İlerleme ölçülmüyor" ile.

**Kalan sözleşmeler ODIN'de yayınlanmıyor** (KPI §2, Alert §1, karar
kayıtları, `AgentHealth.verdict`, `sku_stats`, PPC) — kanıtlı 12 maddelik
liste `backend-istekleri.md`'de. Her yeni uç nokta yayınlandıkça bir
bölüm üçer satırla canlıya geçer.

✅ **Dev hidrasyon kusuru ÇÖZÜLDÜ (UI-ADR-125).** `127.0.0.1` ile açılan
dev sunucusunda HMR bloklandığı için hidrasyon hiç tamamlanmıyordu;
`allowedDevOrigins: ["127.0.0.1"]` eklendi.

### Her sprint sonunda

Sahibi (kullanıcı) şu beş soruyu sorar. Beşi de "evet" olmadan sonraki
sprinte geçilmez:

1. Çalışıyor mu?
2. Responsive mi?
3. Hata var mı?
4. Mimariye uygun mu?
5. Merge edilmeye hazır mı?

**6. (S8'de eklendi) Bu sprintin adını karşılayan çıktının KAÇ GERÇEK EKRAN
TÜKETİCİSİ var?**

Sıfırsa sprint "altyapı işi"dir, adının vaat ettiği teslimat DEĞİLDİR — ve
öyle etiketlenir. S8'de bu tam olarak yaşandı: "Amazon Canlı Veri" sprinti
boruyu, kapıları ve canlı vekil doğrulamasını teslim etti ama `httpLoad`
ile `useOdinQuery`'nin **hiçbir ekran çağıranı yoktu**; ekranda tek bir
canlı ODIN değeri görünmüyordu. Testlerin geçmesi bunu gizlemişti.

Meclis kuralı (gavadolar 2/2): **"test geçti" ile "sprint adı karşılandı"
AYRI kararlardır.** Teknik merge onayı ürün kapanış onayı değildir; ikisi
ayrı ayrı verilir. Bir veri borusu için kabul, en az bir gerçek değerin
gerçek uç noktadan gelip EKRANDA render edilmesidir.

### Emin değilsen

**Dur ve sor.** Tahmin etme. Dokümanda cevabı yoksa, cevabı uydurmak yerine
eksikliği bildir.

Bir çelişki görürsen `08-decision-log.md`'ye bak — muhtemelen orada bir ADR
var. Yoksa sor.

---

## Sahiple iletişim

Türkçe konuş. Dokümanlar da Türkçe (ODIN'in ADR-0002 İngilizce kuralı bu
repoya işlemez — ayrı repo, ayrı kural).

Plan üretme. Sahip zaten çok plan gördü. **Çalışan kod üret.**

Bir sprint sonunda teslim edilen şey bir doküman değil, **açılan bir ekran**
olmalı.
