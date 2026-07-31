# S8 — Amazon Canlı Veri · çalışma kaydı

**Dal:** `feature/s8-amazon-live-v2` · **Taban:** `11dd4c9` (= `origin/main`)
**Tarih:** 30–31 Temmuz 2026 · **Kararlar:** UI-ADR-118…123

---

## 0. ÖNCE DÜRÜST BAŞLIK — sprint adını bugün KARŞILAMIYOR

Sprintin adı "Amazon Canlı Veri". **Bugün ekranda tek bir canlı ODIN
değeri yok ve bunu gizlemenin anlamı yok.**

Ölçüm (iddia değil): `httpLoad` ve `useOdinQuery` için `src/` altında
kendi modülleri ve yorumları dışında **çağıran yok**. Yani veri borusunun
tamamı yazıldı, testlendi, canlı cockpit'e karşı doğrulandı — ama hiçbir
ekran onu kullanmıyor.

İki sebebi var ve ikisi de kasıtlı:

1. **Tek bağlanabilir sözleşme `Goal`'dü ve bağlanmadı.** ODIN'in
   `/api/state.goals`'u gerçek veri yayınlıyor (8 hedef ölçüldü). ADR-0143
   §4 uydurma `Mission`'ı reddetti; `Goal` ise ODIN'in ayrı ve gerçek
   varlığıdır (ADR-0034). gavadolar 2/2: **ikisi aynı şey değil, ama
   Goal'ün arayüzdeki yeri ayrı bir SAHİP kapsam kararıdır.** Karar
   gelmeden bağlamak, onaylanmamış bir bölüm icat etmek olurdu.
2. **Geri kalan her sözleşme ODIN tarafında yayınlanmıyor.** KPI §2 zarfı,
   Alert §1 zarfı, karar kayıtları, `AgentHealth.verdict`, `sku_stats`,
   PPC — hiçbiri `/api/state`'te yok. Ayrıntı ve kanıt:
   `backend-istekleri.md`.

**Bu bir başarısızlık değil, bir teşhis:** S8 planlanırken "veri hazır,
bağla" varsayılıyordu. Ölçüldüğünde varsayım yanlış çıktı. Uydurulmuş bir
"canlı" ekran teslim etmek, boş bir ekran teslim etmekten kat kat kötü
olurdu — ürünün tamamının güvenilirliği ona bağlı.

**Teslim edilen gerçek değer:** boru + kapılar + kanıtlı talep listesi.
ODIN bir uç nokta yayınladığı gün bir bölüm **üç satırla** canlıya geçer.

---

## 1. Neden dal yeniden kuruldu

S8 önce `feature/s8-amazon-live` dalında, ADR-0143 **öncesi** tabanda
yazıldı. Ben çalışırken paralel bir oturum S7 dalını ODIN ADR-0143'e
hizalayıp iki merge attı (`11dd4c9`): `schemas.ts` yeniden yazıldı,
`mocks/mission-control.ts` silindi, `Goal` tipi ve `GoalBoard` kaldırıldı.

Yani S8'in merkezî teslimatı **kaldırılmış bir tipin üstündeydi**.

Meclis (gavadolar 2/2 + yazılımcılar): "rebase etme — yeni uçtan kur,
eski sözleşmeye bağlı kodu TAŞIMA." Uygulandı. Taşınmayanlar:
`goalSchema` · `adaptGoals` · `useOdinGoals` · `opportunitySchema` ·
eski Alert/KPI şemaları · `goalsMock`.

---

## 2. Teslim edilenler

| Karar | İş | Ölçüm |
|---|---|---|
| UI-ADR-118 | Arayüz ODIN'in diskini okumaz; eksik veri TALEP olur | 12 maddelik kanıtlı liste |
| UI-ADR-119 | CORS istenmedi; vekil arayüz tarafında + SSR mutlak URL | canlı cockpit'e karşı doğrulandı |
| UI-ADR-120 | Kaynak yoksa sayı da yok — `0` bir ölçüm iddiasıdır | gerçek modda `—` görüldü |
| UI-ADR-121 | Çağıranın iptali zaman aşımını yener; ağ hatası gizlenmez | iki kapı, ikisi de eski kodla düşürüldü |
| UI-ADR-122 | `IS_MOCK` DCE'ye uygun — ⚠️ tek başına YETERSİZ kaldı | ölçüldü, etkisiz |
| UI-ADR-123 | Mock ekrana anahtarla girer; üretim paketinde HİÇ yok | istemci 0 / sunucu 0 |

---

## 3. Doğrulama — ölçülen

- Birim **120/120** · Storybook **136/136** · `tsc` + `eslint` temiz
- Release derlemesi + mock kapısı geçti (`✓ 7 imza tarandı`)
- **Canlı vekil testi** (ODIN cockpit 8765 açıkken):
  `/odin/api/state` → **200, 117.608 bayt** gerçek ODIN durumu ·
  `/odin/api/tasks` → 200 · `/odin/gizli` → **404** (daraltma çalışıyor)
- **İki modda tarayıcı:** mock → bölümler dolu, rozet var;
  gerçek → rozet yok, sayaçlar `—` + "kaynak bağlı değil", konsol hatasız
- **Responsive** (spesifikasyon §9.4: hedef 1366–3840; tablet/mobil
  "gelecek"): 1366 → taşma 0, KPI 4 sütun · 1920 → taşma 0, 8 bölüm

### Kapıların kapı olduğu ayrıca ölçüldü

Bir testin geçmesi yetmez; **düşebildiği** de gösterilmeli.

- İptal testi → eski koşulla DÜŞTÜ, düzeltmeyle GEÇTİ
- Ağ hatası testi → aynı yöntemle
- Mock paket kapısı → mock modda 22 eşleşme, çıkış kodu 1
- Release sözleşme kapısı → stub imzası bozulunca TS2322
- ESLint kuralı → doğrudan import eklenince ateşledi
- Tekilleştirme testi → `INFLIGHT` devre dışı bırakılınca düştü

---

## 4. Bu sprintte yakalanan KENDİ hatalarım

1. İptal düzeltmesinin **ilk hâli de yanlıştı** — `timedOut` bayrağı
   kuralı düzeltmiyordu; sorun okunan sinyal değil ÖNCELİK sırasıydı.
2. İlk yazdığım iptal testi **eski kodla da geçiyordu** — kapı değildi.
3. `fillStore` tekilleştirmesi yazılmıştı ama **çalışmıyordu**: `async`
   olduğu için `return task` sözü yeni sözle sarmalıyor, uçuştaki sözün
   kimliği kayboluyordu.
4. `backend-istekleri.md`'yi sıfırdan yazarken S7'nin devrettiği
   **`universeId` maddesini düşürmüştüm** — worklist karşılaştırmasıyla
   bulundu, geri kondu (§12).

**Ders: her düzeltmenin testi eski kodla düşürülerek kapı olduğu
ölçülmeli.** Üçü de testi yazarken çıktı, incelemede değil.

---

## 5. Meclis körü körüne uygulanmaz

Yazılımcılar üç "uydurma" iddia etti; **ikisi kaynaktan çürüdü**:

- `source: "internal"` kanonik `DataSource` union'ında **var**
  (önerdikleri `"odin"` union'da yok).
- `module: "default"` Alert'in `module` alanı değil,
  `FRESHNESS_THRESHOLDS_MS` tazelik eşiği anahtarı.
- `freshness`'in istemcide hesaplanması: bir üye "yanlış" dedi, **aynı
  kurul S7'de "doğru" demişti** — çelişki kayıtlı, S7 kararında kalındı.

Aynı turda kurulun GERÇEK bulguları da vardı (SSR göreli URL çökmesi ·
iptal yarışı · release stub'ının `tsc` denetiminde olmaması). Kurul
değerli ama hatasız değil.

---

## 6. Açık kalanlar

**Sahip kararı bekleyen (merge blokeri değil):**
- **Goal nerede gösterilecek?** (a) gösterme (b) Mission Board içinde ayrı
  bölüm (c) ayrı Goals yüzeyi (d) yalnız özet sayı. Bugün S8'in sprint
  adını karşılamasının TEK yolu bu — diğer tüm sözleşmeler yayınlanmamış.

**ODIN'den bekleyen:** `backend-istekleri.md` 12 madde.

**Arayüz borcu:**
- `OdinSectionBoundary` kalıbı (S7'den devir) — bugün her `Section`'a hata
  elle bağlanıyor; unutulursa "sessiz boş bölüm" hatası geri döner.
- Vekilin önünde yetkilendirme yok — dağıtım hâlinde gerekir (§10).
- Alias çözümü **geçiş sınırı** olarak kayıtlı borçtur (meclis şartı).

**Meclisin merge hükmü:** koşullu — "S8 işlevsel olarak tamam; merge
entegrasyon doğrulamasına bağlı." Rebase şartı konusuz (taban zaten
`origin/main`); canlı vekil doğrulaması yapıldı.
