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

Bu repodaki kararlar `UI-ADR-001…085` serisindedir.
ODIN'in kendi serisi `ADR-0001…0086` — **karıştırma.**

Yeni bir mimari karar alırsan `08-decision-log.md`'ye `UI-ADR-086`'dan
devam ederek ekle. Eski kararı silme; `♻️ Değiştirildi` işaretle.

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
Biten: **S1 (Token), S2 (App Shell), S3 (Core Components),
S4 (Executive Components — 15 bileşen, `10b-executive-components.md`).**
Üretildi, sahip onayı bekliyor: **S5 — Executive Briefing + Mission Control**
(`10c-screens.md`). İlk gerçek ekranlar açıldı; veri **mock**, hepsi
`meta.source === "mock"` ile işaretli (UI-ADR-094) ve S8'de değişecek.
Biten (sahip onayı bekliyor): **S5.5 — Sözleşme Hizalama** (UI-ADR-098..100).
Karar modeli ODIN DecisionRecord'a hizalandı (tier/status/alternatifler/10
zorunlu öneri alanı), kanonik güven bantları + 8 bileşenli döküm, üç verdict
(Onayla/Reddet/Ertele + A/B/C gerekçe kuralı), kabuk scroll onarımı, durum
hafızası, contract fixture testi (`contracts/odin/`).
Sıradaki: **S6 — Amazon Director.** ✅ KAPI AÇIK: FR-0046 **ADR-0143 ile
karara bağlandı** (30 Tem 2026) — Alert + KPI kanonik zarfları o ADR'de;
Opportunity = öneri kayıtlarının görünümü, Mission Board = "izlenen
kararlar + vadesi gelen ertelemeler" görünümü. S6 bu dört karara göre
tipler/dönüştürür; UI kavram icat etmez.

### Her sprint sonunda

Sahibi (kullanıcı) şu beş soruyu sorar. Beşi de "evet" olmadan sonraki
sprinte geçilmez:

1. Çalışıyor mu?
2. Responsive mi?
3. Hata var mı?
4. Mimariye uygun mu?
5. Merge edilmeye hazır mı?

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
