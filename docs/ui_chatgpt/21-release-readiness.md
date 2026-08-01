# Release Readiness Audit — ODIN Arayüzü

> **Tarih:** 1 Ağustos 2026 · **Dal:** `feature/s13-frontend-architecture` (+57 commit, itilmedi)
> **Kaynak:** UI-ADR-183…190 + bu turda yapılan beş ek denetim
> **Kural:** Bu belgedeki her sayı ölçülmüştür. Ölçülmemiş olan **UNKNOWN**
> yazar; tahmin yazılmaz (CLAUDE.md kural 2).

---

## HÜKÜM: ÜRETİME HAZIR DEĞİL

**Dört açık release blocker var.** Meclis (gavadolar 2/2) aynı hükümde.

Sabit kural, yüzdeden önce gelir:

> **Açık bir release blocker varken sonuç "hazır değil"dir. Hiçbir yüzde
> bunu geçersiz kılamaz.**

---

## 1 · Release blocker'lar

### B1 — İnsanın onayı tarayıcıdan hiç çıkmıyor 🔴

Bu, bir Karar Zekâsı sisteminde olabilecek en ağır kusur.

```
useMutation      0        POST/PUT/PATCH/DELETE   0
mutationKey      0        tek fetch               GET (client.ts:150)
optimistic       0        rollback                0
```

`features/briefing/screen.tsx:266`:

```ts
const onVerdict = (d, v) => setVerdicts((m) => ({ ...m, [d.id]: v }));
```

Onayla / Reddet / Ertele **oturum içinde kalıyor**, sekme kapanınca yok
oluyor. Kodda zaten yazılı: *"S7'de POST /api/command'a bağlanacak
(ER-0025)"*. ODIN'in **ADR-0086 Human Sign-off Gate**'i tam olarak bunun
kalıcı ve denetlenebilir olmasını şart koşuyor.

Arayüz bugün **salt-okunur**. Ekranda karar verilebilir GÖRÜNÜYOR — üç
buton çizili, form açılıyor, gerekçe isteniyor — ama hiçbir şey ODIN'e
ulaşmıyor. Bu, "sahte veri yasağı"nın eylem tarafındaki karşılığıdır.

**Düzeltme:** `POST /api/command` bağlantısı + `useMutation` + hata/rollback
sözleşmesi. Backend ucu ODIN'de mevcut (CLAUDE.md "Backend bağlantısı").

### B2 — Eksi işareti düşüyor: kesinti, artış gibi görünüyor 🔴

`components/executive/simulation-panel.tsx:39`:

```ts
return `${p > 0 ? "+" : ""}%${Math.abs(p)}`;
```

| changePercent | ekranda |
|---|---|
| +15 | `+%15` |
| **−10** | **`%10`** |

Node ile koşturularak doğrulandı. Bir simülasyon panelinde %10'luk bütçe
**kesintisi** senaryosu, artış senaryosundan ayırt edilemiyor — ve mock'ta
gerçekten −10'luk bir senaryo var. Kullanıcı yanlış senaryonun sayılarını
okuyup karar verebilir.

**Düzeltme:** `p > 0 ? "+" : p < 0 ? "-" : ""` (tek satır).
**Durum:** sahibin kararını bekliyor (UI-ADR-189) — düzeltme görüntüyü
değiştirdiği için görevin yasağı kapsamındaydı.

### B3 — Kök layout patlarsa boş beyaz sayfa 🔴

```
src/app/(shell)/error.tsx     VAR   → ekran hataları yakalanıyor, kabuk ayakta kalıyor
src/app/global-error.tsx      YOK   → kök layout hatasında yakalayıcı YOK
```

`(shell)/error.tsx` route segment sınırı olduğu için `layout.tsx`'in
KENDİSİ patlarsa devreye giremez. Sonuç: kullanıcı boş beyaz sayfa görür —
`10-component-library.md` §11'in (*"Kullanıcı hiçbir zaman sadece 'Error'
görmez"*) ihlali.

**Düzeltme:** `src/app/global-error.tsx` (küçük, tek dosya).

### B4 — Yetkilendirme katmanı yok ⚠️ ŞARTA BAĞLI

Tarandı: sistemde **kimlik, oturum, token, rol veya tenant kavramı hiç
yok** (bütün `role=` eşleşmeleri ARIA rolü). `queryKey`de kimlik boyutu
yok.

- **Tek kullanıcılı localhost aracı ise** → N/A. Sahip bunu **yazılı**
  beyan etmeli.
- **Birden çok kullanıcı ya da korumalı veri olacaksa** → **BLOCKER**.

Meclis bölündü: terra "korumalı veriyse blocker", luna "blocker". Karar
dağıtım modeline bağlı ve **sahibindir**.

⚠️ Bu bir muafiyet değil **bağımlılıktır**: kimlik eklendiği gün
`queryKey` bir kimlik boyutu kazanmak ZORUNDA, yoksa bir kullanıcının
verisi diğerinin ekranında görünür.

---

## 2 · Sonraki sprint'e bırakılabilirler

| # | borç | kanıt | neden blocker değil |
|---|---|---|---|
| D1 | 13 tam bileşeni hiçbir ekran kullanmıyor | `Tabs`·`TabPanel`·`Tooltip`·`Drawer`·`Avatar`·`TelemetryBar`·`AreaChart`·`BarChart`·`FilterBar`·`RadioGroup`·`Toggle`·`Textarea`·`Select` — ekran tüketicisi 0 | çalışma zamanı riski yok; bakım borcu |
| D2 | `transport.ts` ulaşılamaz | tek import edeni bir test; `app/` altında hiç geçmiyor; dinamik import yok | ölü/yarım mimari, davranışa etkisiz |
| D3 | `loading.tsx` ve `<Suspense>` hiç yok | tarandı, 0 | veri istemcide çekiliyor, `Section` kendi iskeletini basıyor |
| D4 | Tip düzeyinde 1 import döngüsü | `mocks/registry → mocks/goals → lib/data/odin-state → mocks/registry`; bir kenar `import type` (silinir), biri `await import()` (ertelenmiş) | çalışma zamanı döngüsü değil — ama `goals.ts` değer import'una geçerse GERÇEK olur |
| D5 | E2E akış testi yok | 0 | mevcut kapılar güçlü; gerçek test ortamı gerektirir |
| D6 | `amazon/director/screen.tsx` 422 kod satırı | UI-ADR-188'de ölçüldü, bölünmemesine karar verildi | eşik ekrana körlemesine uygulanmaz |
| D7 | `useOdinQuery` yalnız kaynak taramasıyla test ediliyor | `policy.test.ts` | hook render edilemiyor (node ortamı, jsdom yok) |

---

## 3 · Temiz çıkanlar — pozitif kanıt

Bunlar "bakılmadı" değil, **bakıldı ve sorun bulunmadı**:

| alan | ölçüm |
|---|---|
| **Query key** | 13 literal · hepsi primitive dizi · **object 0** · çakışma **0** · prefix ilişkisi **0** |
| **Cache manipülasyonu** | `invalidateQueries`/`setQueryData`/`removeQueries`/`getQueryData` = **0** → anahtar-uyuşmazlığı bug sınıfı **oluşamaz** |
| **Bayat veri taşınması** | `placeholderData`/`keepPreviousData`/`initialData` = **0** |
| **Bellek sızıntısı** | 6 dosyada `addEventListener`↔`removeEventListener` olay adları **birebir eşleşiyor** · `ResizeObserver`↔`disconnect` 1↔1 · `rAF`↔`cancel` 2↔2 · `tick.ts` **refcount'lu** (son abone gidince timer duruyor) · `useSyncExternalStore` |
| **Retry politikası** | `error.retryable && failureCount < 3`; sözleşme hatası ve 4xx (408/429 hariç) **yeniden denenmez** |
| **İptal** | `AbortSignal.any([signal, timeout])`; iptal `signal.reason` **kimliğiyle** ayırt ediliyor, ada göre değil |
| **Route temizliği** | router olayına DEĞİL türetilmiş `workspace?.id`'ye bağlı → `push`/`replace`/geri-ileri/URL fark etmiyor |
| **Hata önceliği** | `screenState` **gerçek hata taşımıyor**; gerçek hatalar bölüm bazında `sectionError()` ile |
| **Kapılar** | `tsc` 0 · `lint` 0/0 (`--max-warnings 0`) · unit **18/321** · storybook **58/226** · atlanan 0 · düşen 0 |
| **Erişilebilirlik** | **226/226** story gerçek axe raporu taşıyor · ihlal **0** (ayardan değil, koşum çıktısından) |
| **Mimari sınırlar** | 205 modül · katman ihlali (components→features) **0** |

---

## 4 · Runtime performansı — ÖLÇÜLDÜ

Statik analiz yeterli değildi; tarayıcıda gerçek ölçüm yapıldı.

### Dev modu (`next dev`, StrictMode açık) — briefing, boşta

| ölçüm | değer |
|---|---|
| uzun görev sayısı / 10 sn | **10** |
| ardışık aralık | 995·1013·989·1008·994·1001·995·999·999 ms → **ortalama 999** |
| vuruş başına süre | **64–115 ms** |
| DOM mutasyonu | 1 |

Kaynak: 14 bileşen `useNow()` çağırıyor, ekranda **33 zaman damgası**,
repoda **hiç `React.memo` yok**, React Compiler kapalı.

### Üretim (`next start`, minified, StrictMode yok) — aynı ekran, boşta

| ölçüm | değer |
|---|---|
| uzun görev sayısı / 10 sn | **0** |
| ana iş parçacığı sapması (472 örnek) | medyan **1.0 ms** · p95 **2.4** · p99 **9.4** · en büyük **17.9** |
| 10 ms üstü tepe | 4 — aralıkları 250/6994/841 ms → **periyodik DEĞİL** |
| DOM mutasyonu | 2 |
| zaman damgası | **59** |

**Hüküm: 1 Hz tick üretimde gürültü tabanının altında.** Dev'deki saniyelik
80 ms neredeyse tamamen StrictMode çift-render artefaktı.

### ⚠️ Bu ölçüm kendi iddiamı düzeltiyor

UI-ADR-183'te *"kökteki `useNow()` tüm ağacı saniyede bir render ediyordu"*
dedim ve **ölçmemiştim**. Mekanizma doğruydu; **etki iddiası abartılıydı**.
Üretimde 59 aboneyle bile ölçülebilir bir maliyet yok. Değişiklik yine de
doğru (render yarıçapı küçüldü), ama gerekçesi ölçüme değil akıl yürütmeye
dayanıyordu.

### Paket boyutu

```
.next/static/chunks   1626 KB  (26 dosya, sıkıştırılmamış)
en büyük chunk         390 KB
```

⚠️ **Bütçe tanımlı değil** ve gzip/brotli sonrası boyut ölçülmedi →
`UNKNOWN`. Bütçesiz bir sayı hüküm veremez.

---

## 5 · Production Readiness — kontrol matrisi

Meclis 2/2 uydurma yüzde vermeyi reddetti. Aşağıdaki yüzde bir **başarı
olasılığı değil**, önceden tanımlı kontrollerin **kanıtlı tamamlanma
oranıdır**. Ağırlıklar **sahibin onayına tabidir**.

| alan | ağırlık | durum | kanıt |
|---|---:|---|---|
| Veri okuma yolu + zarf doğrulama + anti-fake | 15 | **PASS** | zod şemaları, `parseEnvelope`, 321 unit testi |
| **Yazma yolu / sign-off** | 10 | **FAIL** | B1 — POST yok |
| Görüntü doğruluğu | 5 | **FAIL** | B2 — eksi işareti düşüyor |
| **Yetkilendirme** | 20 | **UNKNOWN** | B4 — dağıtım modeli beyan edilmedi |
| Hata kurtarma | 15 | **KISMİ (12/15)** | bölüm hataları ✓, retry ✓, offline ✓, iptal ✓ · `global-error.tsx` ✗ |
| Test ve kalite kapıları | 15 | **KISMİ (13/15)** | dört kapı fail-closed ✓, a11y 226/226 ✓ · E2E ✗ |
| Üretim performansı | 10 | **KISMİ (7/10)** | boşta ölçüldü ✓ · paket bütçesi ve LCP/CLS ✗ |
| Operasyon / izlenebilirlik | 10 | **FAIL (2/10)** | hata raporlama yok, log yok, kullanım olayı özelliği KAPALI |

```
Uygulanabilir ağırlık (UNKNOWN hariç)  = 80
Kazanılan                              = 15 + 0 + 0 + 12 + 13 + 7 + 2 = 49

Kontrol tamamlanma oranı = 49 / 80 = %61
```

> **%61, "üretime %61 hazır" DEMEK DEĞİLDİR.** Tanımlı kontrollerin
> %61'inin kanıtla geçtiği anlamına gelir. **Yetkilendirme UNKNOWN olduğu
> ve dört blocker açık olduğu için release kararı: HAYIR.**

---

## 6 · Technical debt / Maintainability puanı

**Meclis 2/2: bu puanlar nesnel ölçüm DEĞİLDİR.** Ağırlıkları ve eşikleri
bir yönetim tercihidir. Tek bir sayı vermek, ölçülmemişi ölçülmüş gibi
göstermek olur — reponun 2 numaralı kuralının ihlali.

Bunun yerine **puansız ama kanıtlı borç envanteri** (yukarıda §1 ve §2) ve
ham bakım göstergeleri:

| gösterge | değer |
|---|---|
| Bileşen dosyası | 88 |
| Kod satırı sınıflaması | 72 sağlıklı / 10 gözden geçir / 5 refactor adayı / 1 büyük |
| Yalnız UI sorumluluğu taşıyan dosya | **51/88** |
| 3+ sorumluluk | 6 (altısı da rolüyle savunulabilir) |
| Import döngüsü | 1 (tip düzeyinde) |
| Katman ihlali | 0 |
| Gerçekten ölü export | **0** |
| Test dosyası / test | 18 / 321 (unit) + 58 / 226 (storybook) |
| a11y ihlali | 0 |

---

## 7 · En yüksek risk taşıyan 10 dosya

Meclisin verdiği ağırlıklarla hesaplanan **önceliklendirme endeksi** —
mutlak bir gerçek değil. Formül:

```
Risk = 0.30·kritiklik + 0.20·fan-in + 0.15·churn(90g)
     + 0.15·test açığı + 0.20·boyut          (repo içinde normalize)
```

| # | dosya | skor | kritik | fan-in | churn | test | satır |
|---|---|---:|---:|---:|---:|---|---:|
| 1 | `lib/data/schemas.ts` | 55.3 | 50 | 9 | 15 | **var** ¹ | 222 |
| 2 | `lib/data/client.ts` | 54.2 | 100 | 5 | 5 | **var** ¹ | 72 |
| 3 | `lib/data/errors.ts` | 53.6 | 100 | 6 | 2 | **var** ¹ | 139 |
| 4 | `mocks/briefing.ts` | 51.5 | 0 | 13 | 12 | dolaylı ² | 654 |
| 5 | `components/executive/decision-card.tsx` | 50.4 | 100 | 3 | 11 | var | 282 |
| 6 | `types/executive.ts` | 49.9 | 0 | **34** | 14 | yok ³ | 221 |
| 7 | `components/executive/stories.fixtures.ts` | 49.9 | 50 | 19 | 5 | — | 237 |
| 8 | `lib/data/use-odin-query.ts` | 49.7 | 100 | 4 | 1 | **zayıf** ⁴ | 70 |
| 9 | `app/(shell)/layout.tsx` | 48.4 | 100 | 0 | 3 | yok | 14 |
| 10 | `features/briefing/screen.tsx` | 47.0 | 100 | 2 | 6 | var | 351 |

¹ Endeksin ilk koşumu bunları "test yok" saymıştı — `testli()` yalnız aynı
adlı dosyaya bakıyordu. Düzeltildi: `data-layer.test.ts` üçünü de kapsıyor,
`schemas.ts`i beş test dosyası kapsıyor. **Ölçüm hatası rapora yazıldı.**
² `mocks/registry.test.ts` yükleyerek dolaylı kapsıyor.
³ Tip dosyası — `tsc` ile derleme zamanında denetleniyor; ayrıca
`odin-contract.test.ts` var. Fan-in **34** ile repodaki en bağımlı dosya.
⁴ Yalnız kaynak taramasıyla (`policy.test.ts`) — hook render edilemiyor.

**Endeksin dürüst zayıflığı:** "kritiklik" elle verilmiş bir rubriktir,
ölçüm değil. "Kusur/regresyon geçmişi" ve "cyclomatic complexity"
ölçülmedi → bu iki sinyal endekste **yok**.

---

## 8 · Release kararı için gereken minimum

| sıra | iş | efor | blocker |
|---|---|---|---|
| 1 | `POST /api/command` + `useMutation` + hata/rollback | orta | **B1** |
| 2 | `caseLabel` eksi işareti | **tek satır** | **B2** |
| 3 | `app/global-error.tsx` | küçük | **B3** |
| 4 | Dağıtım modeli beyanı (tek kullanıcı mı, çok kullanıcı mı) | karar | **B4** |

Dördü kapandığında matris yeniden koşulmalı; **B4 "çok kullanıcı" çıkarsa
yetkilendirme ayrı bir sprint'tir.**

---

## Bu raporun kendi sınırları

- Yetkilendirme **UNKNOWN** — dağıtım modeli beyan edilmeden ölçülemez.
- Paket bütçesi, LCP/CLS ve gzip boyutu **ölçülmedi**.
- Async yarış koşulu (B önce, A sonra) **koşturulmadı** — desenler temiz ama
  iddia sınanmadı (UI-ADR-190).
- Kusur geçmişi ve cyclomatic complexity risk endeksine **girmedi**.
- Runtime ölçümü **tek makinede, tek ekranda, boşta** yapıldı; etkileşim
  altında ve düşük güçlü cihazda ölçülmedi.
