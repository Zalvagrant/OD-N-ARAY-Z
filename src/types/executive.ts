/**
 * ODIN Executive Data Contracts
 * Kaynak: docs/ui_chatgpt/09-data-contracts.md §1–§13
 *
 * Bu dosya sözleşmenin BİREBİR TypeScript karşılığıdır. Yeni alan icat
 * edilmez; sözleşmede olmayan bir ihtiyaç doğarsa
 * `13-backend-recommendations.md`'ye not düşülür (CLAUDE.md §7).
 *
 * TEK SAPMA (gerekçeli, 13-...md §12'ye işlendi):
 *   Decision.recommendation — 05-dashboard.md §3.2 karar kartında
 *   "Recommendation" satırı istiyor, 09-...md §2 sözleşmesinde bu alan yok.
 *   Opsiyonel bırakıldı: gelirse gösterilir, gelmezse satır hiç çizilmez.
 *   Uydurma yapılmaz.
 *
 * YÜZDE ÖLÇEĞİ — UI-ADR-093: varsayım YOK. `unit: "percent"` ise `scale`
 * alanı ZORUNLUDUR. Gelmezse değer gösterilmez (NoData). 18.1 mi 0.181 mi
 * sorusunu tahmin etmek 100 kat yanlış gösterim riskidir.
 * İstisna: `trend.changePercent` — 05-dashboard.md §4 anatomisi bu alanı
 * `12 → "▲ %12"` örneğiyle açıkça 0–100 olarak dondurmuştur.
 */

import type {
  OdinAlternative,
  OdinConfidenceBreakdown,
  OdinDecisionStatus,
  OdinDecisionTier,
  OdinRecClass,
  OdinVerdict,
} from "./odin";

export type {
  OdinAlternative,
  OdinConfidenceBreakdown,
  OdinDecisionTier,
  OdinVerdict,
} from "./odin";

export interface Money {
  amount: number;
  currency: string;
}

export interface EvidenceRef {
  id: string;
  type: "document" | "metric" | "decision" | "external" | "conversation";
  title: string;
  excerpt?: string;
  sourceUrl?: string;
  /** 0–100 */
  sourceQuality: number;
  /** ISO 8601 */
  freshness: string;
  supportsOrContradicts: "supports" | "contradicts" | "neutral";
}

/* --------------------------------------------------------------------------
   §3 AIRecommendation — 7 alanlı explainability sözleşmesi
   -------------------------------------------------------------------------- */

export interface AIRecommendation {
  id: string;
  /** ODIN `recommendation.text` */
  recommendation: string;
  /** 0–100 — bantları ODIN belirler (types/odin.ts), UI eşik icat etmez. */
  confidence: number;
  /** ODIN `confidence_breakdown` — 8 kanonik bileşen. Kara kutu sayı yok. */
  confidenceBreakdown: OdinConfidenceBreakdown;
  /** ODIN `evidence_snapshot` karşılığı (UI zenginleştirilmiş biçimi). */
  evidence: EvidenceRef[];
  /** ODIN `risks` */
  potentialRisks: string[];
  /** ODIN `assumptions` — öneri neye dayanıyor. */
  assumptions: string[];
  /** ODIN `flip_conditions` — "bu öneriyi ne değiştirir?" En kritik
      açıklanabilirlik alanı; UI-ADR-098'e kadar HİÇ gösterilmiyordu. */
  flipConditions: string[];
  /** ODIN `consensus_score` (0–100). */
  consensusScore: number;
  /** ODIN `disagreement_score` = 100 − consensus (consensus.py TÜRETİR;
      UI ayrı ölçüm sanmaz — UI-ADR-100). */
  disagreementScore: number;
  /** ODIN `minority_opinions` — "üye: seçenek — gerekçe" düz metinleri. */
  minorityOpinions: string[];

  /** Verdict gerekçe kuralının anahtarı (executive.classify, ADR-0131):
      A bilgilendirme · B/C'de gerekçe ≥8 karakter zorunlu. */
  recClass?: OdinRecClass;

  /* ------------------------------------------------------------------
     ODIN karar şemasında OLMAYAN alanlar — hepsi opsiyonel ve adapter
     tablosunda `not_exposed` işaretli (09b §9). Kaynakları oluşursa
     dolar; UI bunları ASLA zorunlu saymaz, yoksa satır çizilmez.
     `alternatives` BURADAN KALDIRILDI: ODIN'de kararın alanıdır
     (UI-ADR-091 ♻️ revizyonu → UI-ADR-100).
     ------------------------------------------------------------------ */
  numbers?: Record<string, number | string>;
  causeAnalysis?: string;
  impactAnalysis?: string;
  expectedFinancialResult?: { amount?: number; percent?: number; currency?: string };
  whyGenerated?: string;
  responsibleDirector?: string;
  relatedKnowledge?: string[];
  /** ISO 8601 */
  lastValidated?: string;
}

/* --------------------------------------------------------------------------
   ExecutiveKPI — FR-0046 v1 kanonik sözleşme (UI-ADR-106)
   Meclis sentezi (gavadolar + sistemciler), sahip onayı 2026-07-30.
   ODIN kayıt defteri (R-006 FR-0046) kapanışı bekleniyor — 13-...md §17.
   -------------------------------------------------------------------------- */

/** Yüzde değerinin hangi aralıkta geldiği. Tahmin edilmez, bildirilir. */
export type PercentScale = "0-1" | "0-100";

/** ADR-0143 §2 sınır zarfının durumu (FR-0044'ten genelleşti). */
/**
 * ODIN'in kayıt-başına bildirdiği pencere. Şekli kaynağa göre değişir ve
 * arayüz onu NORMALLEŞTİRMEZ: bir kayan pencereyi sabit tarihe çevirmek,
 * kaydın söylemediği bir şeyi söylemek olurdu.
 */
export interface MetricReportPeriod {
  /** `rolling_window` · `as_of` · (Ads raporunda hiç yok) */
  basis?: string | null;
  windowDays?: number | null;
  start?: string | null;
  end?: string | null;
  at?: string | null;
}

export type MetricStatus = "available" | "data_required" | "unavailable";

/**
 * ExecutiveKPI — ODIN **ADR-0143 §2** ile mühürlenen sınır zarfı, BİREBİR.
 *
 * Zarf DÜZDÜR: `status`/`value`/`reason`, `unit`/`currency`/`scale`/`asOf`
 * ile aynı seviyededir — iç içe bir `value` nesnesi ADR'de YOKTUR.
 *
 * "KPI motoru yok" (ADR-0143 §2): kaynaklar var olanlardır
 * (company_health_score · amazon_director · ai_spend). Literal
 * `"Data Required"` sayısal alanı ASLA geçmez (ADR-0135) — o durum
 * `status` + `reason` ile taşınır.
 *
 * **Sparkline · forecast · insight katmanları bu sözleşmenin PARÇASI
 * DEĞİLDİR** (ADR-0143 §2, son cümle): gerçek kaynakları oluşana kadar
 * beklerler. Bu yüzden tipte de yokturlar — opsiyonel bırakmak "bir gün
 * dolar" izlenimi veren sahte bir kapasitedir (UI-ADR-104 dersi).
 */
export interface ExecutiveKPI {
  /** ODIN metrik kimliği — ör. `"net_profit"`. */
  id: string;
  label: string;
  status: MetricStatus;
  /** `status === "available"` ise sayı; değilse `null`. */
  value: number | null;
  unit: "currency" | "percent" | "count" | "score";
  /** `unit === "currency"` ise ZORUNLU — ISO kodu (Amazon: USD, UI-ADR-103). */
  currency?: string;
  /** `unit === "percent"` ise ZORUNLU. Yoksa değer render edilmez (UI-ADR-093). */
  scale?: PercentScale;
  /** `status !== "available"` ise ZORUNLU — neden ölçülemediği de bilgidir. */
  reason?: string | null;
  /**
   * ISO 8601 — metriğin veri anı. **NULL OLABİLİR** (UI-ADR-158).
   *
   * ODIN bu alanı provenance'tan doldurur ve kayıt henüz promote
   * edilmemişse `None` yayınlar — yani "bu metriğin veri anı YOK" demek
   * ODIN'in kasıtlı bir ifadesidir, bozukluk değil. Zorunlu tutmak, o
   * ifadeyi reddedip TÜM listeyi karartıyordu.
   *
   * Böyle bir kayıt zaten `status !== "available"` gelir ve `reason`u
   * neden ölçülemediğini söyler; damgasız bir SAYI göstermiyoruz.
   */
  asOf: string | null;
  /**
   * Metriğin ÖLÇÜM PENCERESİ — ODIN ADR-0138/0147 (UI-ADR-140).
   *
   * `asOf` "ne kadar eski" sorusunu cevaplar; bu alan "hangi aralık"
   * sorusunu. İkisi ayrı bilgidir: "38 adet satıldı" ile "hangi 38 gün"
   * aynı şey değil, ve bugün ekranda ÜÇ farklı pencere yan yana duruyor
   * (7 günlük kayan · anlık · 2026-07-01→30).
   *
   * Kaynak dönemini beyan etmemişse `null` — arayüz pencere UYDURMAZ.
   */
  reportPeriod?: MetricReportPeriod | null;
  /**
   * Eşiği olan metrik/alarm bunu TAŞIR; olmayan ATLAR (null yazmaz).
   * `unapproved_default` geldiğinde arayüz GÖSTERMEK zorundadır:
   * aksi hâlde ekran, kararlaştırılmamış bir sınırı yetkili bir
   * hüküm gibi sunar (UI-ADR-126).
   */
  thresholdProvenance?: ThresholdProvenance;
}

/* --------------------------------------------------------------------------
   §2 Decision
   -------------------------------------------------------------------------- */

export type DecisionStatus = OdinDecisionStatus;

export interface DecisionEvent {
  id: string;
  at: string;
  title: string;
  description?: string;
}

/**
 * ODIN `DecisionRecord`un UI görünümü (09b §1). Alan adları camelCase'e
 * çevrilir, ANLAM değiştirilmez. Eski 19 alanlık UI tipi UYDURMAYDI
 * (UI-ADR-098): priority/financialImpact/riskLevel/expectedROI/
 * directorOpinions/timeline/score ODIN'de yok ve kaldırıldı.
 */
export interface Decision {
  id: string;
  /** ODIN `question` — kart başlığı budur. */
  question: string;
  /** YYYY-MM-DD */
  date: string;
  /** D1 geri alınabilir · D2 geri alması maliyetli · D3 stratejik. */
  tier: OdinDecisionTier;
  status: OdinDecisionStatus;
  domain?: string;

  /** KARARIN alanı, en az 2 (şema minItems) — önerinin değil. */
  alternatives: OdinAlternative[];
  recommendation: AIRecommendation;

  /** Verdict verildiyse. Yalnızca insan kapatır (decided_by const). */
  humanDecision?: {
    outcome: OdinVerdict;
    humanReasoning?: string;
    /** `deferred` için zorunlu gelecek tarih (ADR-0131). */
    revisitAt?: string;
  };

  expectedOutcome?: string;
  monitoringCheckpoints?: string[];
  lessonsLearned?: string[];
  relatedDecisions?: string[];
}

/* --------------------------------------------------------------------------
   §4 DirectorHeartbeat
   -------------------------------------------------------------------------- */

/** ODIN verdict sözlüğü — health.py yalnız bu üçünü yazar. */
export type AgentVerdict = "unknown" | "healthy" | "unhealthy";

/**
 * ODIN `AgentHealthMonitor.snapshot()` girdisinin UI görünümü (09b §5,
 * UI-ADR-111). Eski `DirectorHeartbeat` 8 UYDURULMUŞ alan taşıyordu
 * (status/currentGoal/currentTask/confidence/taskCount/evidenceCount/
 * recommendationCount/memoryHealth/predictionStatus/beatIntervalMs) ve
 * ODIN'in ürettiği GERÇEK metrikleri (gecikme, başarı oranı, maliyet)
 * hiç göstermiyordu — kayıp alan, uydurmadan tehlikelidir.
 *
 * CANLILIK KURALI UI'DA TÜRETİLMEZ: eski "beatIntervalMs × 3" eşiği UI
 * icadıydı ve kaldırıldı. UI yalnız ODIN'in verdiği `verdict`i gösterir;
 * `last_heartbeat` bir zaman damgası olarak sunulur (yaşı yazılır,
 * yorumlanmaz).
 */
export interface AgentHealth {
  agentId: string;
  /** Görünen ad — UI eşlemesi (agent registry'den). */
  name: string;
  verdict: AgentVerdict;
  consecutiveFailures: number;
  /** ISO 8601 | null */
  lastSuccess: string | null;
  lastFailure: string | null;
  metrics: {
    latencyMsAvg: number | null;
    latencyMsP95: number | null;
    /** 0–1 */
    successRate: number | null;
    errorRate: number | null;
    tokensUsed: number;
    costUsd: number | null;
    queueLength: number;
    availability: number | null;
    /** ISO 8601 | null — yaş yazılır, canlılık YORUMLANMAZ. */
    lastHeartbeat: string | null;
  };
  checkedAt: string | null;
}

/* --------------------------------------------------------------------------
   Alert · Opportunity — FR-0046 v1 kanonik sözleşmeler (UI-ADR-106)
   ODIN'in parçalı üreticileri (improvement_detectors · finance/quality ·
   amazon_director · innovation) için ortak AD; yeni motor değil.
   -------------------------------------------------------------------------- */

/** ADR-0143 §1 kanonik sözlük — UI eşleme icat etmez. */
/**
 * Bir seviyeyi doğuran EŞİĞİN kaynağı — ODIN ADR-0146.
 *
 * Meclis stok eşiğini gerçek veriden türetmeyi REDDETTİ: bir haftalık
 * 18 SKU bir dağılım özetidir, politika değil. Bunun yerine mevcut band
 * OTORİTE İDDİASINI bıraktı ve sonucu bu alanla işaretliyor —
 * seviyeler kullanılabilir kalır, ama bir iş kararıymış gibi
 * davranmayı bırakır.
 */
export type ThresholdProvenance = "unapproved_default" | "owner_policy";

export type AlertSeverity = "critical" | "risk" | "warning" | "info";

/**
 * Alert — ODIN **ADR-0143 §1** ile mühürlenen kanonik zarf, BİREBİR.
 * "Adlandırıldı, icat edilmedi": üreticiler zaten vardı
 * (improvement_detectors · finance/quality · legal_monitor ·
 * amazon_director), ADR-0141'in ortak katmanı da bir alert evaluator
 * tanımlıyor. Bu tip o zarfın TypeScript karşılığıdır; zarfta olmayan alan
 * (eski `description` · `responsibleDirector`) UI icadıydı ve DÜŞTÜ.
 */
export interface Alert {
  /** `"AL-..."` */
  id: string;
  severity: AlertSeverity;
  title: string;
  /** Üreten modül — ör. `"amazon"`. */
  module: string;
  /**
   * `false` olan öğe alert listesine ASLA girmez. ADR-0143 §1 bunu
   * üretici tarafı sözleşmesi de yaptı: kural artık iki tarafta da var.
   */
  requiresAction: boolean;
  /** Kanıt anahtarları — ör. `["KO-..."]`. */
  evidence: string[];
  /** ISO 8601. */
  createdAt: string;
  suggestedAction?: string;
  /**
   * Eşiği olan metrik/alarm bunu TAŞIR; olmayan ATLAR (null yazmaz).
   * `unapproved_default` geldiğinde arayüz GÖSTERMEK zorundadır:
   * aksi hâlde ekran, kararlaştırılmamış bir sınırı yetkili bir
   * hüküm gibi sunar (UI-ADR-126).
   */
  thresholdProvenance?: ThresholdProvenance;
}

/*
 * Opportunity — **ADR-0143 §3: AYRI KAYIT OLARAK REDDEDİLDİ (v1).**
 *
 * Bir fırsat, önerinin POZİTİF SINIFIDIR; improvement/innovation boruları
 * bu kaydı zaten üretiyor. "Aynı kayda ikinci bir ad" verilmez → arayüzdeki
 * Opportunity bölümü, mevcut ÖNERİ KAYITLARI (`AIRecommendation`) üzerinde
 * bir GÖRÜNÜMDÜR. Bu yüzden burada `Opportunity` diye bir tip YOKTUR;
 * icat edilmiş tip ADR gereği silindi.
 *
 * Açık soru (13-...md §17): pozitif sınıfı hangi KAYITLI alan işaretler?
 * Filtre alanı bildirilene kadar görünüm, öneri kayıtlarını olduğu gibi
 * listeler ve neyi filtrelemediğini ekranda söyler — uydurma bir sınıf
 * çıkarımı yapılmaz.
 */

/* --------------------------------------------------------------------------
   §10 AIPulse · §12 Telemetry
   -------------------------------------------------------------------------- */

export interface ChannelState {
  active: boolean;
  /** 0–100 → halka hızını belirler */
  load: number;
  lastActivity: string;
  available: boolean;
}

/** Kanal id → durum. Registry'de available:true olmayan kanal ÇİZİLMEZ. */
export type PulseChannelStates = Record<string, ChannelState>;

/** Kanal id → gösterilecek değer. Değeri olmayan kanal "veri yok" gösterir. */
export type TelemetryValues = Record<string, number | string | null | undefined>;

/* --------------------------------------------------------------------------
   06-workspaces.md §1.3 — 5 adımlı Executive Intelligence formatı
   -------------------------------------------------------------------------- */

export interface ExecutiveBrief {
  /** 📊 Numbers */
  numbers: Record<string, number | string>;
  /** 🔍 Analysis — neden oldu? */
  analysis: string;
  /** 🧠 Interpretation — ne anlama geliyor? */
  interpretation: string;
  /** 🎯 Recommendation */
  recommendation: AIRecommendation;
  /** 📑 Evidence */
  evidence: EvidenceRef[];
}

/* --------------------------------------------------------------------------
   §8 AmazonSnapshot — 06-workspaces.md §1.3 Layer 1 "Executive Glance"
   -------------------------------------------------------------------------- */

/**
 * SAPMA — UI-ADR-116 (gavadolar danışıldı, terra · luna aynı yönde).
 *
 * Sözleşme `netProfit: Money` diyor, yani ZORUNLU. Gerçekte:
 *   Net kâr = satış − Amazon ücretleri − reklam − iade − COGS − nakliye
 * COGS Amazon'da YOKTUR, kullanıcı girer ve şu an girilmemiştir. Zorunlu bir
 * alan, hesaplanamayan bir değeri ifade edemez; tek çıkış uydurmaktır ve
 * yanlış bir kâr rakamı tüm ODIN'in güvenilirliğini bitirir (13-...md §4).
 *
 * Üç değişiklik, üçü de 13-...md §16.1'e soru olarak düşüldü:
 *   netProfit    → `Money | null`
 *   grossProfit  → opsiyonel; net kâr yokken gösterilebilen TEK kâr
 *   profitBasis  → neyin hariç tutulduğu; gösterilmesi ZORUNLUDUR
 */
export interface AmazonSnapshot {
  /**
   * UI-ADR-093 — yüzde ölçeği BİLDİRİLİR, tahmin edilmez. Sözleşme §8 bunu
   * yazmıyor; zarf başına tek alan olarak eklendi (SAPMA, 13-...md §16.1).
   * `acos` · `tacos` · `buyBoxRate` · `inventoryHealth` bu ölçektedir.
   * TypeScript zorunlu kıldığı için backend atlayamaz.
   */
  percentScale: PercentScale;

  /* Layer 1 — Executive Glance */
  healthScore: number;
  revenue: Money;
  /** null → hesaplanamıyor. Arayüz bu durumda net kâr YAZMAZ. */
  netProfit: Money | null;
  /** Net kâr yokken gösterilen ikame. Tek başına asla "kâr" diye anılmaz. */
  grossProfit?: Money;
  /** Hariç tutulan kalemler — grossProfit gösteriliyorsa yazılması zorunlu. */
  profitBasis?: { excluded: string[] };
  orders: number;
  acos: number;
  tacos: number;
  buyBoxRate: number;
  inventoryHealth: number;
  activeSKUs: number;
  inventoryValue: Money;
  topRisk: Alert | null;
  /**
   * Fırsat AYRI KAYIT DEĞİL (ADR-0143 §3): öneri kaydının kendisidir.
   * Bu yüzden tip `AIRecommendation`tır, uydurma bir `Opportunity` değil.
   */
  topOpportunity: AIRecommendation | null;
  /*
   * `missionProgress`/`goalProgressPct` KALDIRILDI — ADR-0143 §4: ilerleme
   * yüzdesi kavramının ölçülmüş bir kaynağı yok ve bu ADR onu YARATMIYOR.
   * Ölçüsü olmayan bir yüzdeyi çizmek, anti-fake kuralının tam ihlalidir.
   */

  /* Layer 2 — Executive Intelligence (5 adımlı format, ExecutiveBrief ile aynı) */
  intelligence: ExecutiveBrief;
}

/* --------------------------------------------------------------------------
   §9 PPCData — 06-workspaces.md §1.5 PPC Intelligence Center
   -------------------------------------------------------------------------- */

export interface PPCOverview {
  /** UI-ADR-093 — `acos` bu ölçektedir. SAPMA, AmazonSnapshot ile aynı gerekçe. */
  percentScale: PercentScale;
  health: number;
  spend: Money;
  sales: Money;
  acos: number;
  roas: number;
  /**
   * ⭐ Ayırt edici metrik — reklam değil KÂR metriği.
   * SAPMA (UI-ADR-116): sözleşmede `Money` zorunlu. Kâr olduğu için net kâr
   * ile aynı kaderi paylaşır: COGS yoksa hesaplanamaz → `null` gelir ve
   * ekranda gerekçesiyle boş görünür.
   */
  profitAfterAds: Money | null;
}

export type CampaignStatus =
  | "healthy"
  | "acos_rising"
  | "budget_exhausting"
  | "scalable"
  | "underperforming";

export interface CampaignIntelligence {
  campaignId: string;
  name: string;
  status: CampaignStatus;
  aiSummary: string;
  suggestedActions: AIRecommendation[];
}

export interface SimulationRequest {
  /** "ppc_budget" */
  parameter: string;
  changePercent: number;
}

export interface SimulationResult {
  scenarios: Array<{ metric: string; expectedChange: string }>;
  confidence: number;
  /** ⚠️ ZORUNLU — varsayımları gösterilmeyen simülasyon açıklanmamış AI çıktısıdır. */
  assumptions: string[];
}

/**
 * İki sözleşme tipinin eşlemesi — yeni ALAN yoktur.
 * Simülatör hazır vakaları listeler; istemci hiçbir sayı HESAPLAMAZ
 * (UI-ADR-117).
 */
export interface SimulationCase {
  request: SimulationRequest;
  result: SimulationResult;
}

/* --------------------------------------------------------------------------
   §4b RuntimeDirector — ODIN ADR-0148 (UI-ADR-127)
   -------------------------------------------------------------------------- */

/**
 * ODIN'in İKİ ayrı canlılık yüzeyi var, çünkü iki tür işçisi var:
 *
 *   `AgentHealth`     — GÖREV-ajanları (`AgentHealthMonitor`). Kuyruktan
 *                       görev yürütürler. Bugün BOŞ: sistemde hiç `task.*`
 *                       olayı yok, kuyruk hiç kullanılmadı.
 *   `RuntimeDirector` — ZAMANLANMIŞ işler (`JOBS` + `runtime/metrics.json`),
 *                       heartbeat üstünde koşan 18 iş, her işin KENDİ beyan
 *                       ettiği `agent` alanına göre gruplanmış. Canlı.
 *
 * İkisi BİRLEŞTİRİLMEZ ve biri diğerine ADAPTE EDİLMEZ (meclis 2/2).
 * `directors`ı `AgentHealth` şekline sokmak, `failuresTotal`ı
 * `consecutiveFailures` alanına yazmak demekti — ODIN ardışık seri
 * ÖLÇMÜYOR ve bu, arayüzün fark edemeyeceği bir yalan olurdu.
 */

/**
 * Dört değer, üç değil. `stale` KORUNUR: gecikmiş bir kalp atışı ile
 * hata veren bir iş aynı şey değildir ve sahibin bu farkı görmesi gerekir.
 * `AgentHealth.verdict`in üç değerine sıkıştırmak bilgi kaybıdır.
 */
export type DirectorStatus = "healthy" | "stale" | "failed" | "unknown";

export interface RuntimeDirectorJob {
  id: string;
  status: DirectorStatus;
  /** ISO 8601 | null */
  lastBeat: string | null;
  cadence?: string | null;
  lastError?: string | null;
}

export interface RuntimeDirector {
  /** İşin KENDİ beyan ettiği agent adı — arayüz isim icat etmez. */
  id: string;
  /** Hükmü ODIN verir; arayüz eşik tutmaz (ADR-0148). */
  status: DirectorStatus;
  /** ISO 8601 | null — yaşı yazılır, yorumlanmaz. */
  lastBeat: string | null;
  /**
   * YAPILANDIRILMIŞ beklenen aralık, ölçülmüş değil: "bu her N'de bir
   * ateşlenmeli" der, "N'de bir ateşlendi" demez. Cadence bilinmiyorsa
   * `null` — tahmin edilmez.
   */
  beatIntervalMs: number | null;
  /**
   * KÜMÜLATİF. `consecutiveFailures` DEĞİL — ODIN seri ölçmüyor ve o adı
   * kullanmak uydurma olurdu.
   */
  failuresTotal: number;
  lastError: string | null;
  jobs: RuntimeDirectorJob[];
}

/* --------------------------------------------------------------------------
   Opportunity — ODIN ADR-0154 (UI-ADR-141)
   -------------------------------------------------------------------------- */

/**
 * ADR-0143 §3 Opportunity'yi KAYIT olarak reddetmişti ve arayüz de haklı
 * olarak tip yazmamıştı: karşılığı olmayan tipe şema yazmak onu zamanla
 * gerçek gösterir (UI-ADR-113).
 *
 * ODIN ADR-0154 ile durum DEĞİŞTİ — ikinci bir kayıt türü yaratılmadı,
 * mevcut iyileştirme kayıtları üzerinde bir GÖRÜNÜM yayınlandı. Yani tip
 * artık gerçek bir üreticinin şeklidir, arayüzün varsayımı değil.
 *
 * Filtreleme de ODIN'de: yalnız `detected` kayıtlar ve yalnız uygulanabilir
 * bir adımı olanlar geliyor. Arayüz filtre uygulamaz.
 */
export interface Opportunity {
  id: string;
  /** Üreten dedektör — ör. `"telemetry"`, `"knowledge_metrics"`. */
  source: string;
  title: string;
  summary: string;
  /** Zorunlu: aksiyon öneremeyen kayıt zaten Opportunity değildir. */
  suggestedAction: string;
  /** ISO 8601 — tespit anı. */
  asOf: string;
  /** `anahtar=değer` — sayı korunur, "backlog" değil "backlog=257". */
  evidence: string[];
  category?: string | null;
  /** ODIN'in deterministik önceliği (ADR-0114); arayüz sıralama icat etmez. */
  priorityLevel?: string | null;
}
