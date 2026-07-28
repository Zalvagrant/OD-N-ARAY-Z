# S0 Repo Audit — Sonuç Raporu

**Tarih:** 28 Temmuz 2026
**İncelenen:** `Zalvagrant/ODIN` + `Zalvagrant/OD-N-ARAY-Z`
**Yöntem:** İki repo da indirilip dosya seviyesinde incelendi.

---

# ÖZET — Sorunun cevabı

**Dokümanlar `OD-N-ARAY-Z` reposuna gidecek.** Doğru tahmin etmişiz.

Ama incelemede **plan değişikliği gerektiren 5 bulgu** çıktı. En önemlisi:
ODIN, ChatGPT sohbetinin varsaydığı şey değil. Çok daha olgun ve çok daha
katı kurallı bir sistem.

---

# 1. ARAYÜZ REPOSU — Tamamen boş

```
OD-N-ARAY-Z/
└── README.md    (13 byte: "# OD-N-ARAY-Z")
```

Başka hiçbir şey yok. Kod yok, package.json yok, hiçbir şey yok.

**Sonuç:** Temiz başlangıç. Bu iyi haber — hiçbir şeyle çakışmayacak,
hiçbir mevcut kodu bozmayacağız.

---

# 2. ODIN REPOSU — Beklenenden çok farklı

| | Beklenen | Gerçek |
|---|---|---|
| Ne olduğu | Amazon veri çeken bir program | **Yönetişim standardı** + onu uygulayan sistem |
| Dosya sayısı | — | 444 dosya (313 markdown, 70 Python) |
| Sürüm | — | v0.41.0, Phase 8 — Implementation, Alpha |
| Dil | — | **Python ≥3.13, stdlib-only** (ADR-0015) |
| Frontend | Bilinmiyor | **Tek dosya:** `cockpit.html` (29 KB, vanilla CSS+JS) |
| Build sistemi | — | **Yok.** package.json yok, npm yok |
| ADR sayısı | — | **71 adet** (ADR-0001 … ADR-0086) |

**ODIN'in kendi tanımı:**

> "ODIN is a **standard before it is software**. Every technology used to
> implement it must be replaceable. **Vendor lock-in is forbidden.**"

Bu cümle, arayüz planımızın en kritik kısmını doğrudan etkiliyor.

---

# 3. 🔴 BEŞ ÇAKIŞMA

## 3.1 ADR numaraları çakışıyor

| | Aralık |
|---|---|
| ODIN'in mevcut ADR'leri | **ADR-0001 … ADR-0086** (71 adet) |
| Benim ürettiklerim | **ADR-001 … ADR-083** |

Doğrudan çakışma. `ADR-069` hem "ODIN Phase 10 dokümantasyon modeli" hem
"görsel dil hibrit" demek olamaz.

**Çözüm:** Benim ADR'lerimi `UI-ADR-001…083` olarak yeniden numaralandıracağım.
Veya ODIN'in serisine ADR-0087'den devam ederiz. **Senin kararın gerekli.**

## 3.2 "Vendor lock-in yasak" vs React stack

ODIN'in anayasası: her teknoloji değiştirilebilir olmalı, çekirdek stdlib-only.

Benim planım: React + Next.js + Tailwind + shadcn/ui + Framer Motion +
Zustand + React Query + TanStack Table. **8 sert bağımlılık.**

Bu gerçek bir gerilim. Ama ODIN bunu zaten düşünmüş:

> **ADR-0080 — Pluggable Renderer:** `IRenderer` hexagonal bir çıkış portudur.
> Somut renderer'lar (Markdown, HTML, PDF, Voice) değiştirilebilir
> adaptörlerdir; hiçbiri ayrıcalıklı değildir.

**Yani çözüm mevcut:** Yeni React arayüzü bir **IRenderer adaptörü** olarak
konumlanır. Çekirdek ona bağımlı olmaz; yarın React'i atsan ODIN çalışmaya
devam eder. Bu, ODIN'in anayasasıyla uyumlu tek yaklaşım.

**Ama bu bir mimari karar ve ADR gerektiriyor.**

## 3.3 Dokümanlar Türkçe, olması gereken İngilizce

> **ADR-0002:** Docs in English; conversation with the owner in Turkish.

Benim ürettiğim 19 dosyanın hepsi Türkçe. ODIN'in kuralına aykırı.

**Seçenekler:**
- **A)** Dokümanları İngilizce'ye çevir (ODIN kuralına uyar, ama sen okurken zorlanırsın)
- **B)** Arayüz reposu ayrı bir repo — ODIN'in ADR-0002'si oraya işlemez, Türkçe kalsın
- **C)** İkili: İngilizce spec + Türkçe özet

**Önerim: B.** Ayrı repo, ayrı kural. Sen okuyacaksın, sen karar vereceksin.

## 3.4 Yeni iş için bir süreç var — ben o süreci atladım

> **ADR-0050:** Foundation is CLOSED (OAB-0001) — never edit frozen scope
> directly; new work enters as a **typed request row in R-006**
> (docs/registries/request-registry.md) under an epic.

Yani ODIN'e yeni iş eklemenin resmi bir yolu var: request registry'ye satır
eklemek. Ben doğrudan doküman yazdım, bu süreci kullanmadım.

**Etki:** Sadece backend tarafını etkiliyor (`13-backend-recommendations.md`
maddeleri). Arayüz reposu bu kurala tabi değil.

## 3.5 Commit kuralı var

> **ADR-0048:** Bir commit = bir mimari karar; mesaj `ADR-NNNN` referansı
> içerir; git hook'lar zorluyor.

ODIN reposuna commit atarken bu formata uymak zorundasın. Arayüz reposunda
serbestsin.

---

# 4. ✅ BÜYÜK İYİ HABER — Backend zaten uyumlu

ChatGPT sohbetinde tasarlanan şeylerin **çoğu ODIN'de zaten var.**
Uydurmamışız, örtüşmüş.

| ChatGPT tasarımı | ODIN'deki karşılığı | Durum |
|---|---|---|
| Executive Council + Consensus + **Minority Opinion** | `IConsensusEngine` → "opinions + consensus/disagreement/**minority** scores" | ✅ Zaten var |
| AI önerisi: kanıt + güven + risk + alternatif | `IDecisionEngine.ask()` → "MUST include evidence, confidence, risks, assumptions" | ✅ Zaten var |
| Confidence skoru | `IConfidenceEngine.assess()` → 0–100 + faktörler | ✅ Zaten var |
| Risk analizi | `IRiskAnalyzer` → impact, reversibility, likelihood, exposure | ✅ Zaten var |
| Decision DNA (reversibility, impact…) | `IRiskAnalyzer` alanlarıyla birebir örtüşüyor | ✅ |
| Decision kalıcı saklama + replay | `IDecisionLog.record()` / `.replay()` — **silme yok** (ADR-0005) | ✅ Zaten var |
| Explainability zorunluluğu | **ADR-0085 — Explainability Envelope** | ✅ Zaten var |
| Kanıt zorunluluğu | **ADR-0081 — Mandatory Claim Provenance** | ✅ Zaten var |
| İnsan onayı zorunlu | **ADR-0086 — Human Sign-off Gate** | ✅ Zaten var |
| AI Gateway / model router | `IModelProvider` + `providers.py` — usage/cost dönüyor | ✅ Zaten var |
| Event Bus / telemetri | `IEventBus` (ADR-0021) + `ITelemetrySink` | ✅ Zaten var |
| Knowledge Graph | `IKnowledgeGraph` (ADR-0045 LIVE) | ✅ Zaten var |
| Orchestration | `odin/orchestration/` — queue, router, scheduler, health, recovery, planner | ✅ LIVE |
| Amazon SP-API | `odin/spapi.py` — `SpApiAdapter` | ✅ Var |

**Sonuç:** `09-data-contracts.md`'de sıfırdan uydurduğum sözleşmelerin
büyük kısmının ODIN'de gerçek karşılığı var. Onları uydurmak yerine
**mevcut interface'lere bağlamamız gerekiyor.** Bu, işi kolaylaştırıyor.

---

# 5. Arayüz nereye bağlanacak — hazır bir API var

`odin/cockpit.py`: localhost'a bağlı (127.0.0.1) stdlib HTTP sunucusu.

Mevcut endpoint'ler:

```
GET  /api/state     → DashboardProjection.build() — okuma
GET  /api/events    → olay akışı
GET  /api/tasks     → görevler
POST /api/command   → beyaz listeli `python -m odin ...` komutu
```

**Bu, yeni arayüzün bağlanacağı yer.** Yeni bir backend yazmaya gerek yok;
mevcut API genişletilecek.

⚠️ **Güvenlik notu:** Sunucu bilinçli olarak yalnızca 127.0.0.1'e bağlı.
Yeni arayüz de localhost'ta çalışacak. Dışarı açmak ayrı bir güvenlik
incelemesi gerektirir — plana dahil değil.

---

# 6. Mevcut cockpit.html paleti

```css
--bg:      #0B0F17     (bizim planımız: #070B14)
--panel:   rgba(21,27,40,.72)
--line:    rgba(108,99,255,.18)
--primary: #6C63FF     (mor — bizim planla uyumlu ✅)
--secondary:#00D4FF    (cyan — bizim planda turuncu ✗)
--warning: #FFB020     (amber — bizim kararla uyumlu ✅)
--danger:  #FF4D4F
--success: #3DDC84
```

Zaten glassmorphism, koyu tema ve mor aksan kullanıyor. Bizim paletle
**%80 uyumlu.** İki fark:

1. İkincil aksan: mevcut **cyan**, bizim plan **turuncu**
2. Arka plan: `#0B0F17` vs `#070B14` (çok yakın)

**Öneri:** Mevcut cyan'ı ikincil aksan olarak koru — hem uyum sağlar hem
turuncu/amber karışıklığı sorununu tamamen ortadan kaldırır.

---

# 7. Cevaplanamayan sorular

Bunlar için koda daha derin bakmak veya sana sormak gerekiyor:

| Soru | Durum |
|---|---|
| `universe_id` / multi-tenancy var mı? | **BİLİNMİYOR** — schemas/ incelenmeli |
| Amazon **Ads API** bağlı mı? | Sadece `spapi.py` var, Ads modülü **görünmüyor** |
| COGS verisi var mı? | **BİLİNMİYOR** |
| Net kâr hesaplanıyor mu? | `analysis.py` var ama içerik incelenmedi |
| Confidence gerçek mi sabit mi? | `IConfidenceEngine` tanımlı, uygulaması incelenmedi |
| Director heartbeat var mı? | 11 "live agent" var deniyor, heartbeat formatı bilinmiyor |

---

# 8. PLAN DEĞİŞİKLİKLERİ

| # | Değişiklik | Neden |
|---|---|---|
| 1 | ADR'leri `UI-ADR-###` olarak yeniden numaralandır | Çakışma |
| 2 | Yeni arayüzü **IRenderer adaptörü** olarak konumla | ADR-0080 uyumu |
| 3 | `09-data-contracts.md`'yi mevcut interface'lere yeniden eşle | Çoğu zaten var |
| 4 | Backend işlerini R-006 request registry üzerinden aç | ADR-0050 |
| 5 | İkincil aksanı cyan yap (turuncu yerine) | Mevcut palet + amber çakışması |
| 6 | S8'i sadeleştir — SP-API zaten var, Ads eklenecek | Mevcut durum |
| 7 | Yeni arayüz `/api/state` üzerinden bağlanacak | Hazır API |

**Değişmeyen:** Sprint sırası (S0→S13), token katmanı kodu, tasarım
prensipleri, workspace yapısı. Bunlar geçerli.
