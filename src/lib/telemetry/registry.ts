/**
 * ODIN Telemetry Registry
 * Kaynak: ADR-071 + ADR-083 (docs/ui_chatgpt/08-decision-log.md)
 *
 * BU DOSYANIN AMACI:
 * "Gelişmiş olsun ama sonradan işimiz kolay olsun" kararının teknik karşılığı.
 *
 * 20 kanalın TAMAMI burada tanımlı. v1.0'da 6'sı açık.
 * Yeni bir servis canlıya çıkınca yapılacak TEK iş: available: true.
 * Bileşene, layout'a, veri sözleşmesine DOKUNULMAZ.
 *
 * ANTI-FAKE KURALI:
 * available: false olan kanal arayüzde ÇİZİLMEZ.
 * Sahte telemetri, "Fake Dashboard" yasağının ihlalidir.
 */

export type TelemetrySource =
  | "sync" | "gateway" | "jobs" | "logs" | "aiGateway"
  | "eventBus" | "memory" | "knowledge" | "workflow"
  | "orchestrator" | "voice" | "vector";

export interface TelemetryChannel {
  id: string;
  label: string;
  source: TelemetrySource;
  /** false ise UI bu kanalı hiç çizmez */
  available: boolean;
  /** Gösterim biçimi */
  format: "count" | "rate" | "duration" | "currency" | "timestamp";
  /** Hangi sürümde açılması planlanıyor */
  plannedFor?: "v1.0" | "v1.1" | "v2";
}

/* ---------------------------------------------------------------------------
   STATUS BAR — alt telemetri barı (03-information-architecture.md §16)
   ------------------------------------------------------------------------ */

export const TELEMETRY_CHANNELS: TelemetryChannel[] = [
  // ✅ v1.0 — mevcut altyapıdan gelir
  { id: "last_sync",       label: "Son senkron", source: "sync",     available: true,  format: "timestamp" },
  { id: "api_traffic",     label: "API",         source: "gateway",  available: true,  format: "rate" },
  { id: "background_jobs", label: "İşler",       source: "jobs",     available: true,  format: "count" },
  { id: "error_count",     label: "Hata",        source: "logs",     available: true,  format: "count" },

  /* S9 GELDİ, BU İKİSİ GELMEDİ — ve `available: false` kalmalarının
     sebebi artık "henüz yapılmadı" değil, ÖLÇÜLMÜŞ bir sebep (UI-ADR-141).

     ODIN ADR-0150 ile AI yönlendirmesini gerçekten kurdu (`odin/ai.py`,
     görev→sağlayıcı politikası) ama:
     - KUYRUK YOK. Çağrılar eşzamanlı yapılır, sıraya girmez; "AI kuyruk"
       sayacının okuyacağı bir sayı mevcut değil. Sıfır göstermek "kuyruk
       boş" demek olurdu — oysa doğru cevap "kuyruk diye bir şey yok".
     - MALİYET KISMİ. `ai.usage()` maliyeti YALNIZ kendi maliyetini
       bildiren çağrılar üstünden toplar ve kaç çağrının bildirdiğini
       (`cost_known_calls`) yanına yazar. Fiyat tablosu olmadan tek bir
       "AI maliyet" rakamı, bildirmeyenleri sıfır sayan bir toplam olur.

     İkisi de açılabilir; şartı ODIN tarafında (kuyruk kavramı, fiyat
     tablosu). Şartı yazmadan `available: true` yapmak, arayüzün en sık
     yaptığı hata olurdu: eksik veriyi tam gibi göstermek. */
  { id: "ai_queue", label: "AI kuyruk",  source: "aiGateway", available: false, format: "count",    plannedFor: "v1.0" },
  { id: "ai_cost",  label: "AI maliyet", source: "aiGateway", available: false, format: "currency", plannedFor: "v1.0" },

  // ⏭️ Karşılığı oluşunca açılacak
  { id: "event_queue",     label: "Event Queue",  source: "eventBus",     available: false, format: "count", plannedFor: "v1.1" },
  { id: "memory_indexing", label: "Memory Index", source: "memory",       available: false, format: "rate",  plannedFor: "v1.1" },
  { id: "knowledge_sync",  label: "Knowledge",    source: "knowledge",    available: false, format: "rate",  plannedFor: "v1.1" },
  { id: "vector_search",   label: "Vector",       source: "vector",       available: false, format: "rate",  plannedFor: "v1.1" },
  { id: "workflow_engine", label: "Workflow",     source: "workflow",     available: false, format: "count", plannedFor: "v1.1" },
  { id: "scheduler",       label: "Scheduler",    source: "jobs",         available: false, format: "count", plannedFor: "v1.1" },
  { id: "agent_bus",       label: "Agent Bus",    source: "orchestrator", available: false, format: "rate",  plannedFor: "v2" },
  { id: "voice_queue",     label: "Voice",        source: "voice",        available: false, format: "count", plannedFor: "v2" },
];

/* ---------------------------------------------------------------------------
   AI PULSE — AI Core halkaları (05-dashboard.md §7)
   ------------------------------------------------------------------------ */

export interface PulseChannel {
  id: string;
  label: string;
  available: boolean;
  plannedFor?: "v1.0" | "v1.1" | "v2";
  /** Neden kapalı — dokümantasyon amaçlı */
  note?: string;
}

export const AI_PULSE_CHANNELS: PulseChannel[] = [
  // ✅ v1.0 — gerçek, ölçülebilir
  { id: "processing",       label: "Processing",       available: true },
  { id: "memory_knowledge", label: "Memory & Knowledge", available: true },
  { id: "prediction",       label: "Prediction",       available: true },

  // ❌ Kapalı — ölçülebilir kaynağı yok
  { id: "reasoning",  label: "Reasoning",  available: false, plannedFor: "v2",
    note: "Gerçek altsistem değil, kavramsal isim. Ölçülebilir kaynağı yok." },
  { id: "planning",   label: "Planning",   available: false, plannedFor: "v2",
    note: "Aynı — planlama ayrı bir servis değil." },
  { id: "learning",   label: "Learning",   available: false, plannedFor: "v1.1",
    note: "Memory Classifier kurulunca ölçülebilir olur." },
  { id: "reflection", label: "Reflection", available: false, plannedFor: "v2",
    note: "Reflection Engine yazılınca açılır." },
];

/* ---------------------------------------------------------------------------
   YARDIMCILAR — UI bunları kullanır, listeyi doğrudan okumaz
   ------------------------------------------------------------------------ */

export function activeTelemetryChannels(): TelemetryChannel[] {
  return TELEMETRY_CHANNELS.filter((c) => c.available);
}

export function activePulseChannels(): PulseChannel[] {
  return AI_PULSE_CHANNELS.filter((c) => c.available);
}

/** Bir kanal açık mı? Bileşenler render öncesi bunu sorar. */
export function isChannelAvailable(id: string): boolean {
  return (
    TELEMETRY_CHANNELS.some((c) => c.id === id && c.available) ||
    AI_PULSE_CHANNELS.some((c) => c.id === id && c.available)
  );
}

