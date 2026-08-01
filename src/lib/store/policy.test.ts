/**
 * Store POLİTİKASI — UI-ADR-184.
 *
 * KURAL (gavadolar 2/2, bu repodaki React Query kuralının store karşılığı):
 *
 *   Zustand'ın abonelik, selector eşitliği veya güncelleme mekanizmasını
 *   YENİDEN TEST ETMEYİZ. ODIN store'larının durum geçişlerini,
 *   değişmezlerini ve kalıcılık sözleşmesini test ederiz.
 *
 * Bu ayrım boş değil: aşağıdaki testlerin hiçbiri `set` çağrıldığında
 * abonelerin uyandığını ölçmüyor — hepsi "ne yazıldığı"nı ölçüyor. `set`in
 * çalıştığı Zustand'ın sorumluluğu; NE yazılacağı bizim.
 *
 * ⚠️ `universe.ts` ÖNCE ATLANDI, SONRA GERİ ALINDI (UI-ADR-187). İlk turda
 * "26 satır, düz set delegasyonu, politikası yok" diye atlamıştım; yazılımcılar
 * meclisi 2/2 bunun savunulamaz olduğunu söyledi ve haklıydılar. Politikası
 * setter'ında değil, önbellek anahtarında — aşağıdaki üçüncü `describe`e bak.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `localStorage` VEKİLİ — import'lardan ÖNCE kurulmak ZORUNDA.
 *
 * ⚠️ Bu bir konfor değil, ölçülmüş bir zorunluluk. `unit` projesi node
 * ortamında koşuyor ve orada `window` yok. Zustand'ın `persist`i bu durumda
 * SESSİZCE KENDİNİ KAPATIYOR — `middleware.js`:
 *
 *     let storage = options.storage;
 *     if (!storage) { return config((...args) => { console.warn(...); set(...args) }, get, api) }
 *
 * Yani `api.persist` hiç iliştirilmiyor: `useUiStore.persist` `undefined`
 * oluyor ve `partialize`a ulaşmanın yolu kalmıyor. İlk denememde tam olarak
 * bu oldu — üç test `Cannot read properties of undefined (reading
 * 'getOptions')` ile düştü. Bu bir KOD kusuru değil, ORTAM kusuruydu; ayrımı
 * yapmadan "persist bozuk" demek yanlış olurdu.
 *
 * `vi.hoisted` import'ların üstüne çıkar; store modülü ilk yüklendiğinde
 * `window.localStorage` yerinde olur ve middleware normal kolundan geçer.
 * Gerçek bir depo taklit edilmiyor — yalnız middleware'in kurulması için
 * asgari yüzey; testler diske yazılanı değil, `partialize`ın NE SEÇTİĞİNİ
 * ölçüyor.
 */
vi.hoisted(() => {
  const bellek = new Map<string, string>();
  Reflect.set(globalThis, "window", {
    localStorage: {
      getItem: (k: string) => bellek.get(k) ?? null,
      setItem: (k: string, v: string) => void bellek.set(k, v),
      removeItem: (k: string) => void bellek.delete(k),
    },
  });
});

import { useNavigationStore } from "./navigation";
import { useUiStore, type ContextPanelState } from "./ui";

/* Store'lar modül tekilidir: testler arası veri alanları sıfırlanır.
   Eylemler korunur (replace DEĞİL, merge). */
beforeEach(() => {
  useNavigationStore.setState({
    activeWorkspaceId: null,
    expandedId: null,
    memory: {},
  });
  useUiStore.setState({
    sidebarCollapsed: false,
    contextPanel: "closed",
    commandPaletteOpen: false,
    selectedEntity: null,
  });
});

describe("navigation · alt menü politikası", () => {
  it("BAŞKA modüle geçince önceki alt menü kapanır, yenisi açılır", () => {
    const s = useNavigationStore.getState();
    s.setActiveWorkspace("amazon");
    expect(useNavigationStore.getState().expandedId).toBe("amazon");

    useNavigationStore.getState().setActiveWorkspace("finance");
    expect(useNavigationStore.getState().expandedId).toBe("finance");
  });

  it("AYNI modülde gezinirken kullanıcının ELLE kapattığı açılmaz", () => {
    /* Bu koşulun tamamı `setActiveWorkspace`teki tek üçlü operatörde:
         expandedId: id === s.activeWorkspaceId ? s.expandedId : id
       Üçlü düşerse (`expandedId: id` yazılırsa) hata GÖRÜNMEZ olur:
       menü çalışmaya devam eder, yalnız kullanıcının kapattığı alt menü
       aynı modül içindeki her tıklamada kendi kendine geri açılır. */
    useNavigationStore.getState().setActiveWorkspace("amazon");
    useNavigationStore.getState().toggleExpanded("amazon"); // kullanıcı kapattı
    expect(useNavigationStore.getState().expandedId).toBeNull();

    useNavigationStore.getState().setActiveWorkspace("amazon"); // aynı modül
    expect(useNavigationStore.getState().expandedId).toBeNull();
  });

  it("AYNI ANDA EN FAZLA BİR alt menü açık kalır", () => {
    /* `navigation.ts`in kendi beyanı (satır: "aynı anda EN FAZLA BİR tane").
       Beyan edilmiş bir değişmez, ölçülmemiş bir değişmezdir. */
    useNavigationStore.getState().toggleExpanded("amazon");
    useNavigationStore.getState().toggleExpanded("finance");
    expect(useNavigationStore.getState().expandedId).toBe("finance");
  });

  it("aynı id ikinci kez toggle edilince kapanır", () => {
    useNavigationStore.getState().toggleExpanded("amazon");
    useNavigationStore.getState().toggleExpanded("amazon");
    expect(useNavigationStore.getState().expandedId).toBeNull();
  });
});

describe("navigation · bağlam hafızası", () => {
  it("satır seçimi, açık bırakılmış kartları DÜŞÜRMEZ (UI-ADR-162)", () => {
    /* BU BİR REGRESYON TESTİDİR — hata gerçekten yaşandı ve düzeltildi.
       `rememberSelection` alanları elle taşıyordu ve `expandedIds`i
       taşımayı unutuyordu; bir satır seçildiğinde o workspace'te açık
       bırakılmış kartlar sessizce kapanıyordu. Düzeltme yayma (`...entry`)
       ile yapıldı, ama yayma bir sonraki elle-taşımada yine bozulabilir. */
    const nav = useNavigationStore.getState();
    nav.toggleExpandedItem("/amazon", "kart-1");
    nav.rememberScroll("/amazon", 250);
    nav.rememberSelection("/amazon", "SKU-9");

    const m = useNavigationStore.getState().memory["/amazon"];
    expect(m.expandedIds).toEqual(["kart-1"]);
    expect(m.scrollTop).toBe(250);
    expect(m.selectionId).toBe("SKU-9");
  });

  it("hiç scroll yazılmamış workspace'te seçim scrollTop'u 0 yapar, undefined değil", () => {
    useNavigationStore.getState().rememberSelection("/finance", "F-1");
    expect(useNavigationStore.getState().memory["/finance"].scrollTop).toBe(0);
  });

  it("kart açma/kapama aynı id'de tersine döner ve diğerlerini bozmaz", () => {
    const nav = useNavigationStore.getState();
    nav.toggleExpandedItem("/amazon", "kart-1");
    nav.toggleExpandedItem("/amazon", "kart-2");
    nav.toggleExpandedItem("/amazon", "kart-1");
    expect(useNavigationStore.getState().memory["/amazon"].expandedIds).toEqual([
      "kart-2",
    ]);
  });

  it("hafıza workspace başına ayrıdır — biri diğerine sızmaz", () => {
    const nav = useNavigationStore.getState();
    nav.toggleExpandedItem("/amazon", "kart-1");
    nav.toggleExpandedItem("/finance", "kart-1");
    nav.rememberScroll("/amazon", 100);

    /* `/finance` kendi girdisiyle başlar (`toggleExpandedItem` yeni girdiye
       `{ scrollTop: 0 }` verir) ve `/amazon`a yazılan 100 oraya SIZMAZ.
       — İlk yazdığımda buraya `toBeUndefined()` koymuştum ve test düştü:
       yanlış olan kod değil, benim varsayımımdı. */
    const mem = useNavigationStore.getState().memory;
    expect(mem["/finance"].scrollTop).toBe(0);
    expect(mem["/amazon"].scrollTop).toBe(100);
  });
});

describe("ui · bağlam paneli durum makinesi", () => {
  /* 04-navigation-system.md §11: "Pinned" workspace değişse bile açık kalır.
     Diğer üç durum navigasyonda sıfırlanır. */
  const SIFIRLANANLAR: ContextPanelState[] = ["closed", "preview", "expanded"];

  it.each(SIFIRLANANLAR)("%s durumu navigasyonda kapanır", (durum) => {
    useUiStore.setState({ contextPanel: durum });
    useUiStore.getState().resetContextPanelOnNavigate();
    expect(useUiStore.getState().contextPanel).toBe("closed");
  });

  it("pinned panel navigasyonda AÇIK kalır", () => {
    useUiStore.setState({ contextPanel: "pinned" });
    useUiStore.getState().resetContextPanelOnNavigate();
    expect(useUiStore.getState().contextPanel).toBe("pinned");
  });

  it("seçili nesne panel pinned OLSA BİLE temizlenir", () => {
    /* Seçim workspace'e aittir. Bu düşerse pinned panel, artık ekranda
       olmayan bir workspace'in nesnesini göstermeye devam eder — sayı
       doğru görünür ama başka bir bağlama aittir; sahte veriden ayırt
       edilemez (repo kuralı 2). */
    useUiStore.setState({
      contextPanel: "pinned",
      selectedEntity: { workspaceId: "amazon", kind: "sku", id: "SKU-1" },
    });
    useUiStore.getState().resetContextPanelOnNavigate();
    expect(useUiStore.getState().selectedEntity).toBeNull();
    expect(useUiStore.getState().contextPanel).toBe("pinned");
  });
});

describe("universe · önbellek anahtarının parçası", () => {
  /**
   * ⚠️ BU ATLAMA SAVUNULAMAZDI — yazılımcılar meclisi 2/2, UI-ADR-187.
   *
   * Yukarıda `universe`ü "düz set delegasyonu, politikası yok" diye
   * atlamıştım. Yanlıştı: `universe.ts` kendi başlığında **neden var
   * olduğunu** yazıyor — "ÖNBELLEK ANAHTARININ parçasıdır: evren değişince
   * Lillu'nun KPI'ı başka bir evrenin ekranında görünmemelidir."
   *
   * Yani politika `setUniverse`te değil, `use-odin-query.ts:72`de:
   *
   *     queryKey: [DATA_MODE, universeId, ...key]
   *
   * `universeId` o diziden düşerse iki evren AYNI önbellek girdisini
   * paylaşır ve A evreninin sayıları B evreninin ekranında görünür.
   * Sayılar makul durur, kaynağı yanlıştır — reponun 2 numaralı kuralının
   * en sinsi hâli; hiçbir tip ve hiçbir a11y kapısı bunu göremez.
   *
   * ⚠️ NEDEN KAYNAK TARAMASI: `useOdinQuery` bir hook ve `unit` projesi
   * node ortamında koşuyor (jsdom kurulu değil) — render edilemiyor.
   * Anahtar üreticisini test için dışa çıkarmak ÜRETİM KODUNU teste göre
   * değiştirmek olurdu ve bu repo o yolu UI-ADR-182'de açıkça reddetti.
   * Kaynaktan türeyen kapı burada yerleşik bir desendir
   * (`mocks/registry.test.ts` anahtar listesini `switch` etiketlerinden
   * türetiyor). Zayıf yanı açık: satır yeniden YAZILIRSA regex kaçırabilir
   * — o yüzden anahtarın TAMAMI okunuyor, yalnız `universeId` kelimesi
   * aranmıyor.
   */
  it("queryKey evren kimliğini TAŞIR — iki evren aynı önbelleği paylaşamaz", () => {
    const src = readFileSync(
      join(process.cwd(), "src/lib/data/use-odin-query.ts"),
      "utf8"
    );
    const m = src.match(/queryKey:\s*\[([^\]]*)\]/);
    expect(m, "queryKey dizisi bulunamadı — satır yeniden yazılmış olabilir").
      not.toBeNull();

    const parcalar = m![1].split(",").map((s) => s.trim());
    expect(parcalar).toContain("universeId");
    /* Mod da anahtarın parçası: gerçek ve mock veri aynı girdide
       buluşursa hangisinin hangisi olduğu görünmez (UI-ADR-115). */
    expect(parcalar).toContain("DATA_MODE");
  });

  it("evren kimliği store'dan gelir, prop'tan değil", () => {
    /* `universe.ts`in kendi gerekçesi: "Bileşenler bunu prop olarak
       taşımaz — taşınan bir değer bir yerde taşınmayı unutulur."
       Prop'a dönerse anahtar bir ekranda eksik kalır ve SADECE o ekran
       sızdırır; en zor bulunan hata biçimi. */
    const src = readFileSync(
      join(process.cwd(), "src/lib/data/use-odin-query.ts"),
      "utf8"
    );
    expect(src).toContain("useUniverseStore");
  });
});

describe("ui · diske NE yazıldığı", () => {
  it("yalnız sidebar tercihi ve panel durumu kalıcıdır", () => {
    /* Zustand'ın `persist`ini değil, BİZİM `partialize`ımızı çağırıyoruz:
       hangi alanın diske gittiği bir ürün kararıdır (UI-ADR-098).
       Yeni bir alan eklendiğinde `partialize` güncellenmezse alan sessizce
       kalıcı OLMAZ; bu test kalıcılık listesini görünür kılar. */
    const partialize = useUiStore.persist.getOptions().partialize;
    expect(partialize, "partialize tanımlı değil").toBeDefined();

    const yazilan = partialize!({
      ...useUiStore.getState(),
      sidebarCollapsed: true,
      contextPanel: "pinned",
      commandPaletteOpen: true,
      selectedEntity: { workspaceId: "amazon", kind: "sku", id: "SKU-1" },
    });

    expect(Object.keys(yazilan).sort()).toEqual([
      "contextPanel",
      "sidebarCollapsed",
    ]);
  });

  it("komut paleti ve seçili nesne diske ASLA yazılmaz", () => {
    /* İkisi de anlık durumdur. Diske yazılan bir seçim, kaynağı değişmiş
       olabilecek bir id'yi ertesi gün diriltir ve panel var olmayan bir
       nesnenin detayını arar. */
    const yazilan = useUiStore.persist.getOptions().partialize!({
      ...useUiStore.getState(),
      commandPaletteOpen: true,
      selectedEntity: { workspaceId: "amazon", kind: "sku", id: "SKU-1" },
    }) as Record<string, unknown>;

    expect(yazilan).not.toHaveProperty("commandPaletteOpen");
    expect(yazilan).not.toHaveProperty("selectedEntity");
  });
});
