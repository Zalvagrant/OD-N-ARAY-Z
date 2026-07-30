# 09b — Doğrulanmış Sözleşmeler (ODIN çekirdeğinden okunarak)

**Durum:** ✅ DOĞRULANDI — 29 Temmuz 2026, S5 sonrası
**Yöntem:** `C:\Users\PackardBell\Desktop\ODIN` deposu **okunarak**. Aşağıdaki
her satırın kaynağı bir dosya ve satır aralığıdır; hiçbiri tahmin değildir.
**Karar:** UI-ADR-098 — kanonik kaynak ODIN'dir, arayüz ona uyarlanır.

> `09-data-contracts.md` bu dosyanın **öncülüdür ve artık kanonik değildir.**
> O dosya kendi başlığında "🟡 ÖNERİ — kaynakta hiç yoktu, arayüz
> bileşenlerinden geriye türetildi, DOĞRULANMADI" diyordu. Doğrulama
> yapıldı ve **ciddi uyuşmazlıklar** çıktı. Yeni kod bu dosyaya bakar.

---

## 0. Neden bu dosya var

Arayüzün veri modeli, ekrandan geriye doğru türetilmişti. ODIN'in kendi
şemaları ve motorları okununca üç tür fark çıktı:

| Tür | Anlamı | Ne yapılır |
|---|---|---|
| **Uydurulmuş alan** | Arayüzde var, ODIN'de karşılığı yok | Arayüzden kaldırılır ya da ürün ihtiyacıysa governance talebi açılır |
| **Kayıp alan** | ODIN üretiyor, arayüz göstermiyor | Arayüze eklenir — açıklanabilirlik kaybı |
| **Yer değiştirmiş alan** | İkisinde de var ama farklı nesnede | Arayüz ODIN'in yerine hizalanır |

**Kayıp alan en tehlikelisidir:** ODIN bir bilgiyi üretip arayüz onu
göstermiyorsa, CEO o bilgiyi hiç görmemiş olur. Uydurulmuş alan en azından
`NoData` gösterir; kayıp alan sessizdir.

---

## 1. DecisionRecord — kanonik (ODIN `schemas/decision-record.schema.json`)

```
required: id · date · question · tier · alternatives · recommendation
          · human_decision · status
tier:        "D1" | "D2" | "D3"
alternatives: array, minItems 2          ← KARARIN alanı
status:      "open" | "monitoring" | "closed"
human_decision: required [outcome, decided_by]     (decided_by const: human-owner)
opsiyonel: domain · reason · expected_outcome · monitoring_checkpoints
          · actual_outcome · lessons_learned · linked_experiments
          · linked_standards · related_decisions · related_goals
          · checkpoint_evaluations
```

### recommendation nesnesi (aynı şema, iç içe)

```
required: text · confidence · confidence_breakdown · evidence_snapshot
          · risks · assumptions · consensus_score · disagreement_score
          · minority_opinions · flip_conditions
```

Üretici: `odin/decision.py::build_recommendation` — eksik alan varsa
**öneri hiç üretilmez** (`IncompleteRecommendation`). Yani arayüzün
"eksikse gösterme" kuralının backend'de zaten bir karşılığı vardır.

### Arayüzle fark tablosu

| Arayüz `Decision` alanı | ODIN karşılığı | Tür |
|---|---|---|
| `id` `title`→`question` `status` | var (`status` 9 değil **3** durum) | hizala |
| `priority: 1..5` | **yok** — ODIN `tier: D1/D2/D3` | yer değiştirmiş |
| `alternatives` (öneride, min 2) | **kararda**, minItems 2 | yer değiştirmiş |
| `aiConfidence` | `recommendation.confidence` | hizala |
| `consensus` / `disagreement` | var — ama `disagreement = 100 - consensus` | hizala |
| `minorityOpinion` (tekil) | `minority_opinions` (**liste**) | hizala |
| `evidence` | `recommendation.evidence_snapshot` | hizala |
| — | **`flip_conditions`** | 🔴 KAYIP |
| — | **`assumptions`** | 🔴 KAYIP |
| — | **`confidence_breakdown`** (8 bileşen) | 🔴 KAYIP |
| — | `monitoring_checkpoints` · `checkpoint_evaluations` · `lessons_learned` | 🔴 KAYIP |
| `type` `executiveSummary` `strategicImpact` `financialImpact` `riskLevel` `evidenceQuality` `reversibility` `executionComplexity` `expectedROI` `actualROI` `directorOpinions` `timeline` `score` | **yok** | uydurulmuş |

🔴 **`flip_conditions` en kritik kayıptır.** "Bu öneriyi ne değiştirir?"
sorusunun cevabıdır ve ODIN onu zorunlu tutar. Arayüz göstermiyor.

---

## 2. Confidence — kanonik (`odin/trust.py`)

**Sekiz ağırlıklı bileşen** (`CONFIDENCE_COMPONENTS`, satır 29-38):

| Bileşen | Ağırlık | Yön |
|---|---|---|
| `knowledge_coverage` | 20 | + |
| `evidence_strength` | 20 | + |
| `expert_agreement` | 15 | + |
| `model_agreement` | 10 | + |
| `historical_success` | 15 | + |
| `risk_level` | 10 | − (yüksek risk → düşük güven) |
| `missing_information` | 5 | − |
| `decision_complexity` | 5 | − |

**Kanonik bantlar** (`CONFIDENCE_LEVELS`, satır 50-52):

```
≥80 very-high · ≥60 high · ≥40 moderate · ≥20 low · ≥0 very-low
```

🔴 **Arayüz `80 / 50` eşiği kullanıyor** (`confidence-badge.tsx`,
`CONFIDENCE_HIGH` / `CONFIDENCE_LOW`). 50 eşiğinin ODIN'de karşılığı yok;
uydurulmuş bir bant. `13-...md` §13.3'teki soru **cevaplandı**: eşikler
kalibrasyon sorusu değil, ODIN'de zaten kanonik tanımlı.

🔴 `confidence_breakdown` gösterilmiyor — güven skorunun **neden** o
değerde olduğu arayüzde görünmüyor. Bu, "Explainable AI" kuralının
doğrudan ihlalidir.

---

## 3. Consensus (`odin/consensus.py::aggregate`, satır 17-60)

```
consensus_score    = top_share * 100
disagreement_score = (1 - top_share) * 100      ← TÜRETİLMİŞ
minority_opinions  = liste [{member, option, rationale}]
```

Arayüz (10b §11) "Consensus + Disagreement = 100 VARSAYILMAZ, ikisi ayrı
ölçümdür" diyor. **ODIN'de ikisi ayrı ölçüm değildir**; biri diğerinden
türetilir. Arayüzün temkinli davranışı zarar vermiyor ama iddiası yanlış —
metin düzeltilmeli, ölçüm tek sayıdır.

---

## 4. Onay akışı — hedef VAR

| Katman | ODIN karşılığı |
|---|---|
| Bekleyen onay kuyruğu | `odin/execution.py::ApprovalQueue` — `submit(action, tier)` · `approve(pending_id, approved_by)` · `list_pending()` |
| Onayın kalıcı kaydı | `odin/decision.py::record_decision(..., outcome, decided_by="human-owner", human_reasoning="")` |
| Şema kilidi | `human_decision.decided_by` **const: human-owner** — ODIN kendi kendine karar kapatamaz |
| Cockpit'te görünürlük | `/api/state` → `pending_approvals[{id, tier, action_type, submitted_at}]` |

`13-...md` §14.5'teki soru **cevaplandı**: onayın gideceği yer bellidir.
Açık kalan tek nokta `human_reasoning`'in zorunlu olup olmayacağı —
şema onu zorunlu tutmuyor ama alan var. **Bu bir ürün/politika kararıdır**
(bkz. §15.1).

---

## 5. Heartbeat — kanonik (`odin/orchestration/health.py`)

`AgentHealthMonitor.snapshot()` her ajan için şunu döner:

```
agent_id · verdict · consecutive_failures · last_success · last_failure
· failure_categories · checked_at
· metrics { latency_ms_avg, latency_ms_p95, success_rate, error_rate,
            tokens_used, cost_usd, queue_length, availability,
            last_heartbeat }
```

Arayüzün `DirectorHeartbeat`'i ile fark:

| Arayüz | ODIN | Tür |
|---|---|---|
| `lastBeat` | `metrics.last_heartbeat` | hizala |
| `queueLength` | `metrics.queue_length` | hizala |
| `status` (8 değer) | `verdict` | hizala |
| `beatIntervalMs` | **yok** | uydurulmuş — "3 aralık" kuralının dayanağı arayüzde |
| `currentGoal` `currentTask` `confidence` `taskCount` `evidenceCount` `recommendationCount` `memoryHealth` `predictionStatus` | **yok** | uydurulmuş |
| — | `latency_ms_avg/p95` · `success_rate` · `error_rate` · `cost_usd` · `availability` · `failure_categories` | 🔴 KAYIP |

🔴 ODIN gerçek sağlık metrikleri üretiyor (gecikme, başarı oranı, maliyet);
arayüz onları göstermeyip yerine olmayan alanlar çiziyor.

---

## 6. Company Health Score (`odin/briefing.py::company_health_score`)

**CHS v1: yalnızca GERÇEK verisi olan bileşen formüle girer.** Verisi
olmayan bileşen `None` döner ve "veri yok" yazar — arayüzün anti-fake
kuralının backend'deki tam karşılığı.

Bileşenler: Stok sağlığı · **AI hazırlığı** · Workspace erişimi · Staging.

🟢 **`AI hazırlığı` = anahtarlı sağlayıcı / toplam sağlayıcı × 100.**
`13-...md` §14.1'deki "AI Readiness'in karşılığı var mı?" sorusu
**cevaplandı: VAR.** Hero'daki `aiReadiness` artık `null` bırakılmak
zorunda değil; CHS bileşeninden beslenir.

Aynı şekilde Hero'nun `systemHealthScore` alanı `publishable_score(chs)`
ile eşlenir (yayınlanabilirlik kuralı: yeterli bileşen yoksa skor `None`).

---

## 7. Event Bus (`odin/events.py`)

```
{ seq, ts (ISO, UTC), event (nokta ayrımlı ad), actor, payload }
```

`/api/events?since=<seq>` son 200 kaydı döner. Executive Timeline'ın
gerçek kaynağı budur; `TimelineItem`'a eşlemesi düz bir dönüşümdür
(`event` → başlık, `actor` → aktör, `ts` → zaman).

`DashboardProjection` ayrıca `activity_by_domain` ve `ai_spend`
{`total_usd`, `unknown_cost_calls`, `input_tokens`, `output_tokens`}
üretir → `TelemetryBar`'ın `ai_cost` kanalının gerçek kaynağı.

---

## 8. `/api/state` — bugün gerçekten dönen şey

```
generated_at · pending_approvals[] · staged_pending[] · decisions[]
· activity_by_domain · event_count · timeline[] · ai_spend{} · legal{}
· providers[{name, key_present}] · workspaces[]
```

Arayüzün beklediği **`AmazonSnapshot` · `ExecutiveKPI` · `Alert` ·
`Opportunity` burada YOK.** Amazon tarafında veriyi üreten
`odin/amazon_director.py` var ama cockpit state'ine bağlı değil.

🟢 Kayda değer: `amazon_director.py` net kâr için
`realized_net_profit_usd` hesaplıyor, hesaplayamıyorsa alanı
**`"Data Required"`** yazıyor. Yani S6'nın "net kâr hesaplanamıyorsa
gösterme" kuralının backend'de zaten karşılığı var.

---

## 9. Sonuç — üç işin sırası

1. **Arayüz ODIN'e hizalanır** (mühendislik): `types/executive.ts`,
   `confidence-badge.tsx` eşikleri, `alternatives` kuralının yeri,
   consensus metni, kayıp alanların eklenmesi.
2. **Gerçekten ürün ihtiyacı olan yeni kavramlar** (KPI seti, Alert,
   Opportunity, Mission) sahibin kararıyla ODIN governance'ına
   (ADR-0050 / R-006) talep olarak girer — arayüz onları icat etmez.
3. **Ancak ondan sonra** S6 şablon modülü yazılır.

Gerekçe UI-ADR-098'de.

---

## 10. Adapter eşleme tablosu (S5.5 — uygulanan durum)

`UI alanı → ODIN kaynağı`. `not_exposed` = ODIN üretir ama karar kaydında
saklamaz ya da hiç üretmez; UI o alanı ZORUNLU saymaz, yoksa satır çizmez.

| UI | ODIN | Durum |
|---|---|---|
| `Decision.question/date/tier/status` | kök alanlar | ✅ birebir |
| `Decision.alternatives[]` | `alternatives[]` (option/assessment/risk) | ✅ birebir, minItems 2 |
| `Decision.humanDecision` | `human_decision` (+`revisit_at` lifecycle'dan) | ✅ |
| `AIRecommendation.recommendation` | `recommendation.text` | ✅ |
| `confidence` / `confidenceBreakdown` | `confidence` / `confidence_breakdown` | ✅ 8 bileşen görünür |
| `evidence[]` | `evidence_snapshot[]` | ✅ (UI biçimi zengin; adapter S7'de daraltır) |
| `potentialRisks` / `assumptions` / `flipConditions` | `risks` / `assumptions` / `flip_conditions` | ✅ — flip kartta her zaman görünür |
| `consensusScore` / `disagreementScore` / `minorityOpinions` | consensus alanları | ✅ türetim notuyla |
| `recClass` | `executive.classify()` A/B/C | ✅ gerekçe kuralının anahtarı |
| `numbers · causeAnalysis · impactAnalysis · expectedFinancialResult · whyGenerated · responsibleDirector · relatedKnowledge · lastValidated` | — | `not_exposed`; opsiyonel, varsa çizilir |
| `AgentHealth.*` | `AgentHealthMonitor.snapshot()` | ✅ S5.5-b (UI-ADR-111) — birebir; canlılık eşiği UI'da türetilmez, verdict gösterilir |
| `ExecutiveKPI · Alert · Opportunity · Mission` | — | ⛔ FR-0046 kararına kapılı |
