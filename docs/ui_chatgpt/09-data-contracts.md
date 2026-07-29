# 09 — Data Contracts

**Durum:** 🔴 ARTIK KANONİK DEĞİL — bkz. `09b-verified-contracts.md`

> **29 Temmuz 2026, S5 sonrası:** aşağıdaki sözleşmeler ODIN çekirdeği
> okunarak **doğrulandı** ve ciddi uyuşmazlıklar çıktı (uydurulmuş alanlar,
> kayıp alanlar, yer değiştirmiş alanlar). Kanonik kaynak ODIN'in kendi
> şemaları ve motorlarıdır. Yeni kod `09b-verified-contracts.md`'ye bakar;
> bu dosya tarihsel kayıt olarak durur (karar: UI-ADR-098).

**Eski durum:** 🟡 ÖNERİ — kaynakta hiç yoktu, bu klasörde türetildi
**Kaynak:** Kaynak sohbette veri sözleşmesi **hiç tanımlanmadı.** Aşağıdakiler,
tanımlanan arayüz bileşenlerinden geriye doğru türetilmiştir.

---

## Neden bu dosya var?

Kaynak sohbette 100+ arayüz bileşeni tanımlandı ama hiçbirinin **hangi veriyi
nereden alacağı** yazılmadı. Bu, kodlama başlayınca ilk duracağınız yerdir.

Bir örnek: "Director kartı Heartbeat gösterecek" denmiş. Peki heartbeat nedir?
Bir sayı mı, bir zaman damgası mı, saniyede kaç atım? Backend bunu üretiyor mu?

Bu dosya o soruları önden sorar. **Tüm sözleşmeler tekliftir** ve mevcut ODIN
backend'i ile karşılaştırılması gerekir.

⚠️ **DOĞRULANMADI:** Hiçbiri mevcut ODIN API'si ile doğrulanmadı.
İlk iş bu eşlemeyi çıkarmaktır — `handover.md` §Adım 2.

---

## 0. Evrensel Zarf (Envelope)

**Kural:** Veri taşıyan **her** bileşen bu üç alanı almak zorundadır. Bu,
`02-design-principles.md` §8 Trust Signals kuralının teknik karşılığıdır.

```ts
interface DataEnvelope<T> {
  data: T;
  meta: {
    source: string;          // "sp-api" | "ads-api" | "internal" | "ai" | "manual"
    lastUpdated: string;     // ISO 8601
    freshness: "live" | "recent" | "stale";
    confidence?: number;     // 0–100, AI üretimi ise zorunlu
  };
}
```

`freshness` eşikleri modüle göre değişir ve konfigüre edilebilir olmalıdır
(ör. Trading için 30 sn, Amazon için 15 dk).

**Bir bileşen `meta` olmadan render edilmez.** Veri yoksa "veri yok" durumu
gösterilir — sahte değer veya boş kart değil.

---

## 1. ExecutiveKPI

`05-dashboard.md` §4'teki katmanlı KPI kartını besler.

```ts
interface ExecutiveKPI {
  id: string;
  label: string;                    // "Net Profit"
  value: number;
  unit: "currency" | "percent" | "count" | "score";
  currency?: string;                // "TRY" | "USD"

  // Level 1 — her zaman görünür
  trend: {
    direction: "up" | "down" | "flat";
    changePercent: number;
    comparedTo: string;             // "önceki ay"
  };
  sparkline: number[];              // son N nokta

  // Level 2 — açılınca
  aiInsight: string;                // AI'ın bir cümlelik yorumu
  confidence: number;               // 0–100
  forecast: { value: number; horizon: string; confidence: number };
  risk: "none" | "low" | "medium" | "high" | "critical";

  // Level 3
  recommendedAction?: AIRecommendation;
  evidence: EvidenceRef[];
  owner: string;                    // sorumlu Director id
}
```

---

## 2. Decision

`06-workspaces.md` §2 Decision Center'ı besler. Executive Decision DNA'nın
teknik karşılığıdır.

```ts
interface Decision {
  id: string;
  type: "finance" | "amazon" | "trading" | "strategy" | "operations";
  title: string;
  executiveSummary: string;
  priority: 1 | 2 | 3 | 4 | 5;

  status: "proposed" | "collecting_evidence" | "under_review"
        | "approved" | "rejected" | "deferred"
        | "executing" | "monitoring" | "completed";

  // DNA
  strategicImpact: "low" | "medium" | "high";
  financialImpact: { amount: number; currency: string; horizon: string };
  riskLevel: "low" | "medium" | "high" | "critical";
  aiConfidence: number;
  evidenceQuality: number;
  reversibility: "reversible" | "partially" | "irreversible";
  executionComplexity: "low" | "medium" | "high";
  expectedROI: number;
  actualROI?: number;               // tamamlandıktan sonra
  lessonsLearned?: string;

  // Council
  directorOpinions: DirectorOpinion[];
  consensus: number;                // 0–100
  disagreement: number;             // 0–100
  minorityOpinion?: DirectorOpinion;

  alternatives: Alternative[];      // en az 2 — zorunlu
  evidence: EvidenceRef[];
  relatedDecisions: string[];       // Decision Relationships grafiği için
  timeline: DecisionEvent[];
  score?: DecisionScore;            // tamamlandıktan sonra
}
```

**Kritik doğrulama kuralı:** `alternatives.length >= 2`. Bu, `07-ai-directors.md`
§7'deki "en az 2 alternatif" kuralının teknik zorunluluğudur. Backend bu
kuralı ihlal eden bir Decision üretemez.

---

## 3. AIRecommendation

Her AI önerisi bu yapıyı kullanır. `07-ai-directors.md` §8 Explainability
Contract'ın teknik karşılığıdır.

```ts
interface AIRecommendation {
  id: string;
  recommendation: string;

  // Standart 7 adımlı format
  numbers: Record<string, number | string>;
  causeAnalysis: string;            // 🔍 Neden oldu?
  impactAnalysis: string;           // 📈 Ne anlama geliyor?
  alternatives: Alternative[];      // 🔄 en az 2
  expectedFinancialResult: { amount?: number; percent?: number; currency?: string };
  confidence: number;               // 🎯 0–100
  evidence: EvidenceRef[];          // 📚

  // Explainability zorunlulukları
  whyGenerated: string;
  responsibleDirector: string;
  relatedKnowledge: string[];
  lastValidated: string;            // ISO 8601
  potentialRisks: string[];
}
```

**Kural:** Bu alanlardan herhangi biri eksikse arayüz öneriyi **göstermez.**
Yarım açıklanmış bir AI önerisi, açıklanmamış bir öneriden daha tehlikelidir.

---

## 4. DirectorHeartbeat

`07-ai-directors.md` §12 Director kartını besler.

```ts
interface DirectorHeartbeat {
  directorId: string;
  name: string;
  status: "idle" | "monitoring" | "analyzing" | "reviewing"
        | "processing" | "discovering" | "error" | "offline";

  currentGoal: string | null;
  currentTask: string | null;
  confidence: number | null;

  taskCount: number;
  queueLength: number;
  evidenceCount: number;
  recommendationCount: number;

  memoryHealth: "healthy" | "degraded" | "critical";
  predictionStatus: "running" | "idle" | "failed";

  lastBeat: string;                 // ISO 8601
  beatIntervalMs: number;           // UI nabız hızını buradan alır
}
```

**Anti-fake kuralı:** `lastBeat`, `beatIntervalMs * 3`'ten eskiyse kart
`offline` durumuna düşer ve heartbeat animasyonu **durur.** Sahte canlılık
gösterilmez.

---

## 5. EvidenceRef

Evidence Chain'in temel birimi.

```ts
interface EvidenceRef {
  id: string;
  type: "document" | "metric" | "decision" | "external" | "conversation";
  title: string;
  excerpt?: string;
  sourceUrl?: string;
  sourceQuality: number;            // 0–100
  freshness: string;                // ISO 8601
  supportsOrContradicts: "supports" | "contradicts" | "neutral";
}
```

`supportsOrContradicts` alanı, Knowledge Workspace'in "Contradictions"
özelliğini besler.

---

## 6. Alert

```ts
interface Alert {
  id: string;
  severity: "info" | "warning" | "risk" | "critical";
  title: string;
  description: string;
  module: string;
  affectedEntities: string[];       // SKU, hesap, kampanya id'leri
  suggestedMitigation?: string;
  responsibleDirector: string;
  requiresAction: boolean;
  createdAt: string;
}
```

**Kural:** `requiresAction: false` olan bir öğe **Alerts listesine girmez.**
Amazon Director'ın Alerts bölümünde yalnızca aksiyon gerektiren olaylar vardır
(`06-workspaces.md` §1.4).

**Renk eşlemesi:** `critical` → kırmızı, `risk` → turuncu, `warning` → turuncu
(daha soluk), `info` → mavi. Bu eşleme `01-product-vision.md` §5'ten gelir ve
değiştirilemez.

---

## 7. Opportunity

```ts
interface Opportunity {
  id: string;
  title: string;
  category: "product" | "pricing" | "advertising" | "bundle" | "keyword" | "other";
  revenueImpact: { amount: number; currency: string };
  confidence: number;
  deadline?: string;
  recommendedAction: AIRecommendation;
  evidence: EvidenceRef[];
}
```

---

## 8. AmazonSnapshot

```ts
interface AmazonSnapshot {
  // Layer 1 — Executive Glance
  healthScore: number;              // 0–100
  revenue: Money;
  netProfit: Money;
  orders: number;
  acos: number;
  tacos: number;
  buyBoxRate: number;
  inventoryHealth: number;
  activeSKUs: number;
  inventoryValue: Money;
  topRisk: Alert | null;
  topOpportunity: Opportunity | null;
  missionProgress: number;

  // Layer 2 — Executive Intelligence
  intelligence: {
    numbers: Record<string, number>;
    analysis: string;
    interpretation: string;
    recommendation: AIRecommendation;
    evidence: EvidenceRef[];
  };
}
```

⚠️ `netProfit` en riskli alandır: SP-API doğrudan net kâr vermez. Ücretler,
reklam harcaması, iade, depolama ve COGS birleştirilerek hesaplanmalıdır.
COGS verisi Amazon'da yoktur — kullanıcı tarafından girilmelidir.
Bkz. `13-backend-recommendations.md` §4.

---

## 9. PPCData

```ts
interface PPCOverview {
  health: number;
  spend: Money;
  sales: Money;
  acos: number;
  roas: number;
  profitAfterAds: Money;            // ⭐ ayırt edici metrik
}

interface CampaignIntelligence {
  campaignId: string;
  name: string;
  status: "healthy" | "acos_rising" | "budget_exhausting" | "scalable" | "underperforming";
  aiSummary: string;
  suggestedActions: AIRecommendation[];
}

interface SimulationRequest {
  parameter: string;                // "ppc_budget"
  changePercent: number;            // +15
}

interface SimulationResult {
  scenarios: Array<{ metric: string; expectedChange: string }>;
  confidence: number;
  assumptions: string[];            // ⚠️ zorunlu — model neye dayandı?
}
```

⚠️ `SimulationResult.assumptions` zorunludur. Varsayımları gösterilmeyen bir
simülasyon, açıklanmamış bir AI çıktısıdır ve Explainability sözleşmesini
ihlal eder.

---

## 10. AIPulse (AI Core telemetrisi)

`05-dashboard.md` §7'deki AI Core görselleştirmesini besler.

```ts
interface AIPulse {
  channels: {
    reasoning:  ChannelState;
    planning:   ChannelState;
    learning:   ChannelState;
    knowledge:  ChannelState;
    memory:     ChannelState;
    prediction: ChannelState;
    reflection: ChannelState;
  };
  overallConfidence: number;
  activeModel: string;
  reasoningDepth: number;
  resourceUsage: { cpu: number; memory: number };
}

interface ChannelState {
  active: boolean;
  load: number;                     // 0–100 → halka hızını belirler
  lastActivity: string;
  available: boolean;               // false ise halka HİÇ gösterilmez
}
```

**Kritik:** `available: false` olan kanal arayüzde çizilmez.

✅ **v1.0 kapsamı (UI-ADR-071):** Yalnızca 3 kanal gerçektir ve gösterilir —
`processing`, `memoryKnowledge`, `prediction`. Diğer dördü (`reasoning`,
`planning`, `learning`, `reflection`) ölçülebilir bir kaynağa sahip
olmadıkları için `available: false` döner.

---

## 11. SystemHealth

`06-workspaces.md` §8'i besler.

```ts
interface SystemHealth {
  score: number;                    // 0–100
  uptime: number;                   // saniye
  cpu: number; memory: number; storage: number;
  activeServices: number;
  criticalAlerts: number;
  version: string;
  lastRestart: string;
  avgResponseTimeMs: number;

  services: ServiceStatus[];
  backup: {
    lastSuccessful: string;
    sizeBytes: number;
    verified: boolean;
    recoveryPoints: number;
  };
}

interface ServiceStatus {
  name: string;                     // "API Gateway" | "AI Orchestrator" | ...
  status: "operational" | "degraded" | "down";
  lastCheck: string;
  avgResponseTimeMs: number;
  lastError: string | null;
}
```

---

## 12. Telemetry (Status Bar)

`03-information-architecture.md` §16'daki alt telemetri barını besler.

```ts
interface TelemetryStream {
  channels: Array<{
    id: string;                     // "background_jobs" | "api_traffic" | ...
    label: string;
    available: boolean;             // ⭐ false ise gösterilmez
    value: number | string;
    rate?: number;
  }>;
}
```

✅ **v1.0 kapsamı (UI-ADR-071) — 6 kanal:**

`last_sync` · `api_traffic` · `background_jobs` · `error_count`
· `ai_queue` · `ai_cost`

İlk dördü mevcut altyapıdan gelir. Son ikisi AI Gateway kurulunca
kendiliğinden gelir — ayrı iş değildir.

Karşılığı olmayan kanal `available: false` döner ve **gösterilmez.**

---

## 13. Ortak tipler

```ts
interface Money { amount: number; currency: string; }

interface Alternative {
  title: string;
  description: string;
  expectedOutcome: string;
  risk: "low" | "medium" | "high";
}

interface DirectorOpinion {
  directorId: string;
  position: "support" | "oppose" | "neutral";
  argument: string;
  confidence: number;
  evidence: EvidenceRef[];
}

interface DecisionScore {
  outcomeSuccess: number;
  onTime: boolean;
  expectedROI: number;
  actualROI: number;
  riskManagement: number;
  evidenceQuality: number;
  aiPredictionAccuracy: number;     // ⭐ AI kendi kalibrasyonunu ölçer
}
```

---

## 14. Backend'e sorulacaklar (kontrol listesi)

Kod yazmadan önce mevcut ODIN backend'ine bu sorular sorulmalıdır:

- [ ] `universe_id` / multi-tenancy veri modelinde var mı?
- [ ] Director heartbeat üreten bir servis var mı, yoksa bu yeni mi?
- [ ] AI Pulse'ın 7 kanalının kaçının gerçek telemetrisi var?
- [ ] Status Bar'ın 13 kanalının kaçının gerçek karşılığı var?
- [ ] Net kâr hesabı yapılıyor mu? COGS nereden geliyor?
- [ ] Evidence (kanıt) kalıcı olarak saklanıyor mu?
- [ ] Decision kayıtları veritabanında tutuluyor mu?
- [ ] Confidence skoru üretiliyor mu, yoksa uydurulacak mı?
- [ ] Ads API bağlı mı? (SP-API'nin bağlı olduğu biliniyor)
- [ ] Simülasyon/tahmin modeli var mı?

**"Uydurulacak mı?" sorusu ciddidir.** Confidence skoru rastgele üretilirse
tüm ürün felsefesi çöker — kullanıcı bir kez sahte bir güven skoru fark
ederse hiçbir skora bir daha güvenmez.
