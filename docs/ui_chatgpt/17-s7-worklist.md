# 17 — S7 İş Listesi (State & Data Layer)

**Tarih:** 30 Temmuz 2026
**Dal:** `feature/s7-decision-center` · worktree `Desktop\ODIN\ODIN-UI-s7`
**Kaynaklar:** `PROMPTLAR.md` §S7 · `15-execution-plan.md` D7.1–D7.8 ·
`09b-verified-contracts.md` (kanonik) · `10-component-library.md` §11

> **S7 = veri KATMANI, ekran değil.** Sprint sonunda hâlâ mock veri görünür;
> değişen şey, mock'un artık gerçek veriyle aynı borulardan geçmesidir.
> S8'de tek anahtar çevrilir.

---

## 0. Sprint öncesi tespit — dalın durumu

| Olgu | Kaynak |
|---|---|
| `feature/s7-decision-center` = S6 ucu (`7de3e2a`) + 1 commit (`2ddefb9`, UI-ADR-105) | `git log` |
| `main` bu dalda OLMAYAN 4 commit taşıyor (`225cc11`, `35fefbc`, `e230a47`, `0dda620`) | `git log s7..main` |
| `main`'deki `35fefbc` ("karar modeli ODIN DecisionRecord'a hizalandı") ile `2ddefb9` **aynı işi** yapıyor — iki ayrı uygulama | commit mesajları + `git diff main..s7 -- src/types/executive.ts` = 536 satır fark |
| Ana worktree'de **paralel bir oturum canlı çalışıyor** (bugün `0dda620` commit'ledi, üstünde 9 dosyalık taze WIP var) | `git status` |

**Sonuç:** `main` hareketli hedeftir. S7 kodu, çakışma yüzeyi en dar olacak
şekilde **yeni dosyalarda** yaşamalı; `types/executive.ts` gibi çekişmeli
dosyalara S7 dokunmamalı.

---

## 1. İş kalemleri

| # | İş | Kabul ölçütü |
|---|---|---|
| **D7.1** | Sorgu/önbellek katmanı — modüle göre stale time, retry politikası, arka plan yenileme (Executive Timing: KPI güncellemesi dikkat dağıtmaz) | Aynı anahtara iki abone → tek istek; stale-while-revalidate; retry yalnız geçici hatada |
| **D7.2** | API Client — her yanıt `DataEnvelope<T>`; `meta` yoksa **REDDEDİLİR** | `meta`sız yanıt bileşene ULAŞMAZ, hata nesnesine döner |
| **D7.3** | Global store (Zustand) — navigation · universe · ui | Hiçbir bileşen kendi global state'ini tutmaz |
| **D7.4** | Runtime doğrulama — kanonik tipler şemaya bağlanır | Sözleşme ihlali arayüze ulaşmaz, 5 adımlı hata olur |
| **D7.5** | Error handling — `10-...` §11: Ne oldu → Neden → Etki → Çözüm → [Retry] | Kullanıcı asla yalnız "Error" görmez; her hata sınıfı 5 alanı doldurur |
| **D7.6** | Loading — skeleton entegrasyonu, layout shift yok | Gerçek yerleşimi temsil eden iskelet |
| **D7.7** | Freshness — `computeFreshness()` modüle göre (trading 30sn/5dk · amazon 15dk/1sa · finance 1sa/24sa) | Zarfın `freshness` alanı İSTEMCİDE yeniden hesaplanır (sunucunun damgası yaşlanır) |
| **D7.8** | Offline — bağlantı kesilince stale veri gösterilir ama AÇIKÇA işaretlenir | `navigator.onLine` + son başarılı zarf; rozet zorunlu |
| **D7.9** | Real-time katmanı — altyapı; bağlantı S8'de | Taşıma-bağımsız arayüz; **bugün ODIN'de SSE/WS endpoint'i YOK** (`odin/cockpit.py` 430 satır, yalnız `GET /api/state,/api/events,/api/tasks` + `POST /api/command`) |
| **D7.10** | Mock → gerçek anahtarı — tek yerden | Tek bayrak; mock modda "MOCK DATA" rozeti; `meta.source === "mock"` aramasıyla hepsi bulunur |

### Doğrulama (sprint kapanış kapısı)

- [ ] Her veri çağrısı `meta` (source + lastUpdated) taşıyor
- [ ] `meta` olmayan veri reddediliyor
- [ ] Runtime doğrulama sözleşme ihlalini yakalıyor
- [ ] Hata durumunda 5 adımlı açıklama görünüyor
- [ ] Stale veri görsel olarak işaretli
- [ ] Tek anahtarla mock/gerçek geçişi

---

## 2. Altı karar — MECLİS CEVAPLADI, KAPANDI

| # | Soru | Karar | Oy |
|---|---|---|---|
| **S7-Q1** | Dal tabanı: `main`'e şimdi mi rebase? | **HAYIR — S7 bitince.** `main` canlı bir oturumun altında (bugün iki commit + taze WIP); hareketli hedefe 536 satırlık çakışma çözmek işi iki kez yaptırır. Bunun yerine S7 kodu ÇEKİŞMESİZ dosyalarda tutuldu | 1/2 (terra "şimdi" dedi; hareketli hedef gerekçesiyle luna'nın yolu seçildi) |
| **S7-Q2** | React Query mi, kendi kancamız mı? | **React Query** — UI-ADR-112 | 3/5 |
| **S7-Q3** | Zod mu, elle doğrulayıcı mı? | **Zod** + kendi hata eşleyicimiz (ham mesaj kullanıcıya çıkmaz) | 5/5 |
| **S7-Q4** | Hangi tipler? | **Yalnız 09b + FR-0046 v1.** ODIN karşılığı olmayan tipe şema yazılmaz, "mock-only" bile — UI-ADR-113 | 5/5 |
| **S7-Q5** | Real-time? | **Taşıma soyutlaması + polling.** SSE/WS istemcisi yazılmadı — UI-ADR-114 | 5/5 |
| **S7-Q6** | Mock/gerçek anahtarı? | **Derleme zamanı env** + ayrı `build:release` kapısı — UI-ADR-112 | 5/5 |

### Meclisin ikinci turda REDDETTİĞİ tasarım

`useOdinQuery` ilk hâlinde, elde veri varken hatayı yutuyordu. Yazılımcılar
**2/2 reddetti** ve haklıydı — düzeltme UI-ADR-115. Aynı turda üç sessiz
bozulma daha kapandı: gelecekten gelen zaman damgası · iptal ile zaman
aşımının karışması · politika yorumunun ölçtüğü invariant'ı yanlış anlatması.

### Meclis listesine EKLETTİĞİ kalemler (hepsi yapıldı)

`D7.11` önbellek anahtarı izolasyonu (mod + evren) · `D7.12` hata
sınıflandırması ve sınıfa göre retry · `D7.13` iptal/race · `D7.14` zaman
aşımı · `D7.15` SSR sınırı · `D7.16` sözleşme fixture testleri.
Ayrıca `D7.3`'ün ifadesi düzeltildi: bileşenler yerel (`useState`) durum
tutabilir; Zustand'a yalnız PAYLAŞILAN durum çıkar.

---

## 2b. Teslim edilen dosyalar

```
src/lib/data/mode.ts            tek anahtar (derleme zamanı) + ODIN kök adresi
src/lib/data/errors.ts          OdinError · 5 adımlı metin · sınıfa göre retry
src/lib/data/schemas.ts         zod — yalnız kanonik sözleşmeler
src/lib/data/client.ts          parseEnvelope (zarf · şema · kaynak · tazelik) + httpLoad
src/lib/data/policy.ts          modüle göre staleTime/gcTime/refetchInterval
src/lib/data/query.tsx          QueryClient + provider (retry politikası burada)
src/lib/data/use-odin-query.ts  ekranların TEK kancası
src/lib/data/transport.ts       UpdateTransport seam + pollingTransport
src/lib/store/universe.ts       aktif evren (önbellek anahtarının parçası)
scripts/assert-release-mode.mjs release derlemesi kapısı
src/lib/data/data-layer.test.ts 38 test
```

Değiştirilenler: `(shell)/layout.tsx` (provider) · `.storybook/preview.tsx`
(provider) · `mocks/mock-badge.tsx` (tek anahtar) · `trust-signal.tsx`
(+`refreshFailed`) · `vitest.config.ts` (`@/` alias — unit projesi bilmiyordu)
· `screens/amazon-director.tsx` (üç bölüm yeni boruya taşındı).

## 2c. Doğrulama — ölçülen

| Kapı | Sonuç |
|---|---|
| Birim testleri | **91/91** (38'i S7) |
| Storybook tarayıcı testleri | **145/145**, 45 dosya |
| `tsc --noEmit` · eslint | temiz |
| Yatay taşma (1280 · 1440 · 768) | **0** |
| Sözleşme ihlali → ekran | Mock bilerek bozuldu; KPI bölümü 5 adımlı hata + "Yeniden dene" gösterdi, **sahte sayı üretmedi**, ekranın kalanı ayakta kaldı. Mock geri alındı |
| `build:release` mock modda | reddediyor (çıkış 1) |

Görsel inceleme iki hata çıkardı, ikisini de test yakalamamıştı:
şerit `TrustSignal`'ı her kartın satırını **dokuzuncu kez tekrarlıyordu**
(artık yalnız arıza varken çıkıyor) · hata metni "amazon yanıtı" diyordu,
hangi bölümün reddedildiği belli değildi (`where` artık anahtarın tamamı).

**Sessiz boş bölüm hatası:** ilk bağlamada sözleşme ihlali `Section`'a hiç
iletilmiyordu — bölüm boş kalıyor, kullanıcı verinin REDDEDİLDİĞİNİ hiç
öğrenmiyordu. Doğrulama katmanının bütün değeri reddin görünmesindedir;
`sectionError()` ile bağlandı.

## 3. S7 KAPSAMI DIŞI (bilerek)

- Gerçek ODIN endpoint'ine bağlanmak → **S8** (D8.1). `httpLoad()` yazıldı
  ve testlendi ama henüz hiçbir ekran çağırmıyor.
- COGS ekranı, net kâr motoru → **S8**
- Decision Center ekranı → **S11** (dal adı yanıltıcıdır)
- `types/executive.ts` yeniden yazımı → paralel oturumun S5.5 işi

## 2d. Meclis kapanış turu — koşullu onay ve karşılığı

gavadolar (terra + luna) S7'yi **kapanabilir** buldu, tek ortak koşulla:
"taşınmamış beş bölüm mock veri göstermeye devam ederse kapanışı
onaylamıyorum" (luna). Endişe S7'de değil S8'de gerçekti — anahtar
çevrildiğinde üç bölüm gerçek, beş bölüm mock gösterir ve aynı ekranda
hangisinin hangisi olduğu görünmezdi.

**Yapısal olarak kapatıldı:** `useMockData` artık FAIL-CLOSED — gerçek
modda veri VERMEZ (`data: null`, `loading: false`). Taşınmamış bölümler
S8'de mock göstermeye devam edemez; "veri yok" gerekçesini basarlar.
Mock'un dağıtıma çıkması ayrıca `build:release` kapısıyla engelli.

terra'nın S8 kabul kriterleri kayda geçti (aşağıda 3 ve 4).

### S8'e devredilen açık borçlar

1. **Beş bölüm hâlâ eski mock kancasında** — `AmazonSnapshot` ·
   `PPCOverview` · `CampaignIntelligence` · `SimulationCase` · `SkuHealth`.
   Sebep UI-ADR-113: doğrulanmış sözleşmeleri yok. Sözleşmeleri kapanınca
   (13-...md §16.2/§16.4, FR-0044) üçer satırla yeni boruya taşınırlar.
   Artık sessiz bir borç DEĞİL: gerçek moda geçildiği an bu bölümler
   kendiliğinden "veri yok" durumuna düşer ve eksiklik görünür olur.
2. **Briefing ve Mission Control taşınmadı** — o dosyalarda paralel oturumun
   commit'lenmemiş S5.5 işi var; aynı anda iki taraftan yazmak
   [[odin-worktree-per-branch]] dersini tekrarlardı.
3. **`ODIN_BASE_URL` gerçek modda zorunlu env olmalı** (meclis bulgusu):
   bugün `127.0.0.1`'e düşüyor; tarayıcıda bu KULLANICININ makinesidir.
4. **Yanıtın istenen evrene ait olduğu doğrulanamıyor** — `meta`'da
   `universeId` alanı yok. Anahtar izolasyonu istemci tarafını korur, yanlış
   evren döndüren bir sunucuyu yakalamaz. ODIN tarafına sorulacak.
5. **Dal `main`'e rebase edilecek** — `2ddefb9` (UI-ADR-105) ile main'in
   `35fefbc`'si aynı işi iki kez yapıyor; sıralamadan önce paralel oturum
   kendi WIP'ini commit etmeli.
