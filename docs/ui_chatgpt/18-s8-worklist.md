# S8 — Amazon Canlı Veri · çalışma kaydı

**Dal:** `feature/s8-amazon-live-v2` · **Taban:** `11dd4c9` (= `origin/main`)
**Tarih:** 30–31 Temmuz 2026 · **Kararlar:** UI-ADR-118…123

---

## 0. DURUM — sprint adı KARŞILANDI (31 Tem, gün sonu)

Bu bölüm gün içinde iki kez yazıldı. İlk hâli şuydu ve o an DOĞRUYDU:

> "Sprintin adı 'Amazon Canlı Veri'. Ekranda tek bir canlı ODIN değeri
> yok. Ölçüm: `httpLoad` ve `useOdinQuery` için çağıran YOK."

**Artık değil.** Sahip Goal kapsam kararını verdi (meclise havale etti,
gavadolar 2/2 (c) dedi) ve `Hedefler` ekranı bağlandı: **`/goals`
arayüzdeki İLK canlı ODIN verisini gösteriyor** — üretim derlemesinde,
gerçek modda, tarayıcıda doğrulandı.

Ekranda görülen (gerçek cockpit yükü, mock DEĞİL):
- 3 acil hedef, ölçülen ilerlemeleriyle: **%25** · %0 · %0
- 5 çeyreklik hedef: **"İlerleme ölçülmüyor"** — `null` hiçbir yerde
  `0`'a düşmedi (ADR-0143 §4)
- Mock rozeti YOK · konsol hatasız · "Son senkron: az önce"

**Geri kalan sözleşmeler hâlâ yayınlanmıyor** (KPI §2 zarfı, Alert §1
zarfı, karar kayıtları, `AgentHealth.verdict`, `sku_stats`, PPC) —
kanıtlı liste `backend-istekleri.md`'de, 12 madde. Yani S8 canlı veriyi
AÇTI; ODIN her yeni uç noktayı yayınladıkça bir bölüm daha üçer satırla
canlıya geçer.

⚠️ **AYRI BORÇ — dev modda hidrasyon durdu.** Ekranı önce
doğrulayamadım: dev sunucusunda istemci hidrasyonu TÜM uygulamada
çalışmıyordu (mock modda da, Mission Control'de de; "Daralt" düğmesi
tepkisiz, hiçbir chunk düşmüyor, konsolda hata yok). "Ortamsal" deyip
bırakmak yerine üretim derlemesinde denendi ve **orada sorunsuz
hidrasyon oldu**. Teşhis: sorun dev/Turbopack'e özgü. Üretimi
etkilemiyor ama geliştirme deneyimini bozuyor — ayrı bir iş olarak
kayıtlı.

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

---

## 7. MECLİSİN KAPANIŞ HÜKMÜ (gavadolar 2/2, oybirliği)

Koydukları teknik şartların hepsi kapatıldı ve kabul edildi. Hüküm ikiye
ayrılıyor ve bu ayrım **kayda geçmek zorunda**:

| Karar | Hüküm |
|---|---|
| **Teknik merge** | ✅ **EVET** — sözleşme kapısı, mock yasağı, tekilleştirme, iptal/ağ ayrımı, canlı vekil, daraltılmış rota, iki mod doğrulaması yeterli |
| **S8 ürün kapanışı** | ❌ **HAYIR** — ekranda canlı ODIN değeri yok |

> "S8 mühendislik altyapısı tamamlandı; S8'in 'Amazon Canlı Veri' kullanıcı
> sonucu, yayınlanmış sözleşme ve Goal bağlama kararı olmadığı için teslim
> edilemedi." — terra

**Sahibe sunuş dili de karara bağlandı.** "İstersen bağlarım" DEMEK
YASAK — gerçeği gizler. Doğrusu, seçenekleri simetrik ve sonuçlarıyla
sunmak: Goal bağlanırsa canlı değer görünür ve S8 kapanabilir; bağlanmazsa
S8 teknik olarak eksik kalır ya da yeniden kapsamlanır. Bu baskı değil,
ölçülmüş kritik-yol bilgisidir (luna + terra aynı fikirde).

## 8. ÖRÜNTÜ TEŞHİSİ — çalışma tarzımdaki zayıflık

Bu sprintte dört hatamı da ölçerken yakaladım, incelerken değil. Meclise
"bu bir örüntü mü" diye sordum; ikisi de **evet** dedi ve aynı teşhisi
koydu:

> **Yerel doğrulama güçlü, uçtan uca KABUL doğrulaması geç geliyor.**
> Uygulama önce kuruluyor; değişmezler, negatif durumlar ve izlenebilir
> kabul kriterleri sonra sınanıyor.

En büyük örneği bu sprintin kendisi: "canlı veri" için
`uç nokta → kanca → seçici → bileşen render` zincirinin uçtan uca
erişilebilirliği **baştan bir kabul kriteri yapılsaydı**, sprint adının
karşılanmadığı ilk gün görülürdü — son gün değil.

**Kalıcı kapı (uygulandı):** `CLAUDE.md`'nin sprint sonu sorularına
**6. soru** eklendi — "bu sprintin adını karşılayan çıktının kaç GERÇEK
EKRAN TÜKETİCİSİ var?" Sıfırsa sprint altyapı işidir ve öyle etiketlenir.
**"Test geçti" ile "sprint adı karşılandı" ayrı kararlardır.**

Bugünkü cevap: **0.**
