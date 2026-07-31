/**
 * Mock kayıt defteri — S8 (UI-ADR-123).
 *
 * NEDEN VAR: ekranlar mock üreticilerini DOĞRUDAN import ediyordu. Fail-closed
 * kanca onların ekrana çıkmasını engelliyordu ama modüller import grafiğinde
 * kaldığı için **mock verisi gerçek-mod üretim paketine giriyordu** (ölçüldü:
 * istemci paketinde 2-4 dosya). Meclisin teslim şartı "sahte ekran verisi
 * üretim paketinde HİÇ bulunmasın" idi.
 *
 * Sorun ifadede değil İMPORT GRAFİĞİNDEYDİ: bir modül statik olarak import
 * edildiği sürece paketleyicinin onu elememesi DOĞRU davranıştır. Çözüm
 * grafiği kesmek — ekranlar artık bir ANAHTAR geçirir, gerçek `import()`
 * yalnız burada ve yalnız `IS_MOCK` dalının içinde yaşar.
 *
 * `IS_MOCK` derlemede düz `false`'a indiği için (UI-ADR-122) aşağıdaki erken
 * dönüş `if (true) return null` olur ve `switch` ulaşılamaz hâle gelir;
 * dinamik import'lar onunla birlikte elenir.
 *
 * TİPLER `typeof import(...)` ile alınır — TİP KONUMUNDA, yani derlemede
 * tamamen silinir ve çalışma zamanına hiçbir şey eklemez. Böylece anahtar
 * bazlı erişim tip güvenliğini kaybetmez.
 */

/*
 * `IS_MOCK`'u başka modülden ALMIYORUZ ve bu bilinçli: paketleyici, ölü
 * kod elemesini modüller arası sabit yayılımıyla değil, YERİNDE gördüğü
 * bir ifadeyle yapar. Next `NEXT_PUBLIC_*` değişkenlerini derlemede düz
 * metne çevirdiği için aşağıdaki koşul gerçek modda `"odin" === "odin"`
 * olur ve altındaki `switch` — dinamik import'larıyla birlikte —
 * ulaşılamaz hâle gelir.
 *
 * Anlamı `IS_MOCK` ile AYNI olmak zorunda; ikisi ayrışırsa mock modu
 * sessizce yanlış tarafa düşer. `mode.ts` tek doğrulama noktası olmaya
 * devam ediyor (geçersiz değer orada patlar); buradaki yalnız o kararın
 * derleme zamanı ikizidir.
 */
const REAL_MODE = process.env.NEXT_PUBLIC_ODIN_DATA_MODE === "odin";

type AmazonMocks = typeof import("./amazon");
type BriefingMocks = typeof import("./briefing");
type FeedMocks = typeof import("./feed");

/** Anahtar → o anahtarın döndürdüğü zarf tipi. */
export interface MockMap {
  "amazon.snapshot": ReturnType<AmazonMocks["snapshotMock"]>;
  "amazon.kpis": ReturnType<AmazonMocks["amazonKpisMock"]>;
  "amazon.skus": ReturnType<AmazonMocks["skusMock"]>;
  "amazon.ppc": ReturnType<AmazonMocks["ppcOverviewMock"]>;
  "amazon.campaigns": ReturnType<AmazonMocks["campaignsMock"]>;
  "amazon.simulations": ReturnType<AmazonMocks["simulationsMock"]>;
  "amazon.alerts": ReturnType<AmazonMocks["amazonAlertsMock"]>;
  "amazon.opportunities": ReturnType<AmazonMocks["amazonOpportunitiesMock"]>;
  "briefing.brief": ReturnType<BriefingMocks["briefMock"]>;
  "briefing.decisions": ReturnType<BriefingMocks["decisionsMock"]>;
  "briefing.directors": ReturnType<BriefingMocks["directorsMock"]>;
  "briefing.hero": ReturnType<BriefingMocks["heroMock"]>;
  "briefing.kpis": ReturnType<BriefingMocks["kpisMock"]>;
  "briefing.opportunities": ReturnType<BriefingMocks["opportunitiesMock"]>;
  "briefing.pulse": ReturnType<BriefingMocks["pulseMock"]>;
  "briefing.risks": ReturnType<BriefingMocks["risksMock"]>;
  "briefing.timeline": ReturnType<BriefingMocks["timelineMock"]>;
  "feed.items": ReturnType<FeedMocks["feedMock"]>;
}

export type MockKey = keyof MockMap;

/**
 * Anahtarın karşılığını üretir. Gerçek modda **daima `null`** — ve bu
 * yalnız bir çalışma zamanı kontrolü değil, paketleyici için de bir
 * kapıdır: buradan sonrası ölü koddur.
 */
export async function loadMock<K extends MockKey>(key: K): Promise<MockMap[K] | null> {
  if (REAL_MODE) return null;

  switch (key) {
    case "amazon.snapshot":
      return (await import("./amazon")).snapshotMock() as MockMap[K];
    case "amazon.kpis":
      return (await import("./amazon")).amazonKpisMock() as MockMap[K];
    case "amazon.skus":
      return (await import("./amazon")).skusMock() as MockMap[K];
    case "amazon.ppc":
      return (await import("./amazon")).ppcOverviewMock() as MockMap[K];
    case "amazon.campaigns":
      return (await import("./amazon")).campaignsMock() as MockMap[K];
    case "amazon.simulations":
      return (await import("./amazon")).simulationsMock() as MockMap[K];
    case "amazon.alerts":
      return (await import("./amazon")).amazonAlertsMock() as MockMap[K];
    case "amazon.opportunities":
      return (await import("./amazon")).amazonOpportunitiesMock() as MockMap[K];
    case "briefing.brief":
      return (await import("./briefing")).briefMock() as MockMap[K];
    case "briefing.decisions":
      return (await import("./briefing")).decisionsMock() as MockMap[K];
    case "briefing.directors":
      return (await import("./briefing")).directorsMock() as MockMap[K];
    case "briefing.hero":
      return (await import("./briefing")).heroMock() as MockMap[K];
    case "briefing.kpis":
      return (await import("./briefing")).kpisMock() as MockMap[K];
    case "briefing.opportunities":
      return (await import("./briefing")).opportunitiesMock() as MockMap[K];
    case "briefing.pulse":
      return (await import("./briefing")).pulseMock() as MockMap[K];
    case "briefing.risks":
      return (await import("./briefing")).risksMock() as MockMap[K];
    case "briefing.timeline":
      return (await import("./briefing")).timelineMock() as MockMap[K];
    case "feed.items":
      return (await import("./feed")).feedMock() as MockMap[K];
  }

  /* Anahtar kümesi tipten geliyor; buraya düşmek derleme hatasıdır. */
  return null;
}
