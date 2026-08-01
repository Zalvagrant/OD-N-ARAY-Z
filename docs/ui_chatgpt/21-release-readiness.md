# Release Readiness Audit — ODIN Arayüzü

> **Tarih:** 1–2 Ağustos 2026 · **Dal:** `feature/s13-frontend-architecture` (+61 commit, itilmedi)
> **Kaynak:** UI-ADR-183…192 · beş ek denetim · Release Close-Out
> **Kural:** Bu belgedeki her sayı ölçülmüştür. Ölçülmemiş olan **UNKNOWN**
> yazar; tahmin yazılmaz (CLAUDE.md kural 2).

---

## HÜKÜM: ÜRETİME HAZIR ✅

**Dört blocker'ın dördü de kapandı.**

| # | durum | kapanış |
|---|---|---|
| **B1** Human Sign-off | ✅ **KAPANDI** | UI-ADR-192 — `POST /api/command` bağlandı |
| **B2** Eksi işareti | ✅ KAPANDI | UI-ADR-191 |
| **B3** `global-error.tsx` | ✅ KAPANDI | UI-ADR-191 |
| **B4** Yetkilendirme | ✅ **N/A** | koddan doğrulandı — §1 B4 |

Sabit kural değişmedi ve bugün **açık blocker yok**; hüküm bu yüzden döndü:

> **Açık bir release blocker varken sonuç "hazır değil"dir. Hiçbir yüzde
> bunu geçersiz kılamaz.**

---

## 1 · Release blocker'lar

### B1 — İnsanın onayı tarayıcıdan hiç çıkmıyordu ✅ KAPANDI (UI-ADR-192)

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

Arayüz o gün **salt-okunurdu**. Ekranda karar verilebilir GÖRÜNÜYORDU — üç
buton çizili, form açılıyor, gerekçe isteniyordu — ama hiçbir şey ODIN'e
ulaşmıyordu. Bu, "sahte veri yasağı"nın eylem tarafındaki karşılığıdır.

*(Yukarıdaki ölçümler bulgunun ilk hâlidir ve kayıt olarak korunmuştur;
kapanış aşağıda.)*

#### ⚠️ "Göndermesi gerekiyordu" kanıtı — sahibin itirazı üzerine eklendi

Raporun ilk hâli yalnız *"göndermiyor"*u kanıtlamıştı. Sahip haklı olarak
ayrımı sordu:

- **Senaryo A** — UI hazır, backend henüz yazılmadı → bu bir **eksik
  özelliktir**, mimari kusur değil.
- **Senaryo B** — backend hazır, UI göndermiyor → **kritik bug**.

ODIN çekirdeği okundu. **Senaryo B doğrulandı.**

`odin/cockpit.py`, `ALLOWED_COMMANDS` içinde — kendi yorumuyla:

> *"ADR-0142 (ER-0025): **the UI submits owner verdicts through THIS
> whitelist** — no separate `/api/verdict` endpoint (council ruling, 3/3).
> `ceo verdict` itself enforces ADR-0131 (class-B/C reason, deferred date)
> and refuses loudly; the refusal text travels back verbatim in the command
> result **so the UI can show WHY**."*

Üç bağımsız kanıt:

| kanıt | yer | ne diyor |
|---|---|---|
| CLI fiili **var** | `odin/__main__.py:98` | `python -m odin ceo verdict <rec_id> <approved\|rejected\|deferred> [neden]` |
| Beyaz listeye **UI için eklendi** | `odin/cockpit.py` `ALLOWED_COMMANDS` | `"ceo"` — gerekçe yorumda yazılı |
| İstek **kapatıldı** | `docs/registries/request-registry.md` ER-0025 | *"implemented v1 (ADR-0142) … refusal text travels verbatim, **UI tells a whitelist rejection from a refused verdict** … `tests/test_cockpit.py` pins a dateless deferral coming back REFUSED, **7 green**"* |

Yani backend tarafı, **arayüzün çağıracağı sözleşmesiyle tasarlandı,
uygulandı, test edildi ve "tamamlandı" diye kapatıldı.** Arayüz o çağrıyı
hiç yapmadı ve kodundaki not hâlâ *"S7'de bağlanacak"* diyor — **S7 çoktan
geçti** (`main` bugün S1…S17 + S13).

Bu bir bekleyen özellik değil, **kopmuş bir el sıkışmadır**: iki taraf da
kendi tarafını bitmiş sayıyor, arada kimsenin sahiplenmediği bir boşluk
var. ER-0025'in "implemented" damgası bugün **yanıltıcıdır** — komut
çalışıyor ama onu çağıran yok.

#### ✅ Kapanış — UI-ADR-192

Arayüz ODIN'in sözleşmesine **uyduruldu**; backend'de tek satır değişmedi.

| eklenen | ne yapar |
|---|---|
| `lib/data/command.ts` | `POST /api/command`; üç yanıt biçimini **`exit` anahtarının varlığından** ayırır |
| `lib/data/use-verdict.ts` | `useMutation` · `verdictArgv` · `retry: false` · optimistic YOK |
| `components/executive/verdict-status.tsx` | altı sonucu ayrı gösterir; ODIN'in red metni **değiştirilmeden** |

| dosya | ne yapar |
|---|---|
| `lib/data/command.test.ts` | 17 sözleşme testi (ayrıştırma · istek biçimi · taşıma hataları) |
| `lib/data/verdict-mutation.test.ts` | 8 politika testi (loading · retry · iptal · refused≠hata) |
| `components/executive/verdict-status.stories.tsx` | 7 durum testi |
| `components/executive/decision-card.stories.tsx` | +7 gönderim durumu, gerçek bileşimiyle |

Ölçülen davranışlar — **39 test** (25 unit + 14 story):

- ✅ `useMutation` · **loading** (`isPending` gerçekten dönüyor) · success
- ✅ **refused verdict** — `exit != 0`, metin aynen, "yeniden dene" **sunulmaz**
- ✅ **refused bir HATA DEĞİL** — `isError: false`, veri `refused`; gönderim
  başarılı, KARAR reddedildi (ikisi farklı şey)
- ✅ **whitelist rejection** — `exit` yok, "bu bir arayüz hatası" denir
- ✅ **timeout** — "kaydedilip kaydedilmediği **belirsiz**, tekrar gönderme"
- ✅ **retry** — otomatik YOK (`mutationFn` bir kez çağrılıyor), elle ikinci
  gönderim çalışıyor
- ✅ **iptal** — sinyal gerçekten bağlı; iptal edilmiş sinyalde abort hatası
  `OdinError`e çevrilmiyor (terk edilmiş gönderim sessizce ölür)
- ✅ network · server (400/413) · contract hataları ayrı ayrı
- ✅ `--revisit` atlanmıyor (ADR-0131 tarihsiz ertelemeyi reddeder)
- ✅ boş gerekçe **eklenmiyor** (boş string "verilmiş gerekçe" sayılırdı)

**İptal politikası — kullanıcıya "İptal" düğmesi SUNULMAZ.** Ayrım zaman
aşımıyla aynı mantıkta: istemcinin iptali, sunucunun kaydı yazmasını geri
almaz. Bir "İptal" düğmesi tutulamayacak bir vaat verirdi. İptal yalnız
**unmount**'ta çalışır — kullanıcı ekranı terk etti, sonucu gösterecek
yüzey kalmadı (UI-ADR-121'in aynı kuralı).

**Optimistic update REDDEDİLDİ — gerekçeli.** İyimser güncelleme
"kaydedildi" der, sonra geri alır; burada geri alınacak şey sahibin
KARARIDIR. ODIN reddedebilir ve o red bir hata değil **geçerli bir
cevaptır**. Bir an "onaylandı" görünüp kaybolması, reponun 2 numaralı
kuralının (sahte gösterge) tam ihlalidir.

**`retry: false` — gerekçeli.** `ceo verdict` idempotent olduğunu beyan
etmiyor. Ağ hatasında istek sunucuya ulaşmış ve kayıt yazılmış olabilir;
sessizce tekrar denemek aynı kararı iki kez kaydedebilir ve karar defteri
**silinmeyen** bir defterdir (ODIN ADR-0005). Tekrar denemeyi insan seçer.

⚠️ **Neredeyse denetimin kendi uyardığı hatayı işliyordum:**
`invalidateQueries({ queryKey: ["odin"] })` yazmıştım — gerçek anahtar
`[DATA_MODE, universeId, "odin", …]`, yani `"odin"` bir önek değil ÜÇÜNCÜ
parça. Sessizce hiçbir şey tazelenmez, ekran bayat kalır, hata görünmezdi.
Anahtarsız çağrıya çevrildi.

#### ✅ RUNTIME DOĞRULAMASI — çalışan ODIN sunucusuna gerçek `POST`

Önceki turda bu raporun kendi uyarısı şuydu: *"sözleşmenin iki ucu da test
edildi ama **uçtan uca birlikte hiç koşmadılar**."* O boşluk kapandı.

`127.0.0.1:8765` üzerinde çalışan gerçek ODIN sunucusuna `POST
/api/command` atıldı (2 Ağu 2026). **İki yanıt biçimi de canlı teyit
edildi:**

```
A) {"argv":["ceoo","verdict","x","approved"]}
   → {"ok": false, "error": "'ceoo' is not an ODIN command. Allowed: …"}
     exit anahtarı VAR MI: False          ← beyaz liste reddi ✅

B) {"argv":["ceo","verdict","rec-DOES-NOT-EXIST","deferred"]}
   → {"ok": false, "exit": 1,
      "output": "\nREDDEDİLDİ: 'deferred' bir tarih ister (--revisit
                 YYYY-MM-DD): tarihsiz erteleme sessiz bir hayirdir,
                 kimse geri donmez\n"}
     exit VAR: True · exit = 1 · REDDED içeriyor: True   ← reddedilmiş verdict ✅
```

Bu tam olarak `command.ts: ayirtEt()`in ayırdığı iki durumdur ve ayrım
**canlı** doğrulanmıştır — kaynaktan çıkarım değil.

Canlı ölçüm bir düzeltme de getirdi: story fixture'ımdaki red metni
**yaklaşıktı**. Gerçek metin iki cümle ve ikincisi kuralın NEDENİNİ
söylüyor (*"tarihsiz erteleme sessiz bir hayirdir, kimse geri donmez"*).
`decision-card.stories.tsx` gerçek metinle güncellendi; baştaki `\n` de
gerçektir ve `VerdictStatus` onu `.trim()` ile temizliyor.

⚠️ **BAŞARI YOLU CANLI KOŞTURULMADI — bilerek.** Gerçek bir onay
göndermek, silinmeyen deftere (ODIN ADR-0005) **kalıcı bir kayıt** düşürür
ve bu sahibin verisidir. Yukarıdaki iki yol **hiçbir şey yazmaz**
(beyaz liste reddi hiç spawn etmez; reddedilmiş verdict `lifecycle.verdict`
yazmadan `ValueError` atar). Başarı yolunun ayrıştırması `exit === 0`
koşuluna dayanıyor ve **B'de aynı `exit` alanının okunduğu kanıtlandı** —
kalan risk yalnızca "sunucu 0 döndürür mü" sorusudur ve onu backend'in
kendi 7 yeşil testi kapsıyor.

**Sahip isterse tek komutla canlı onay denemesi yapılabilir** — ama bu bir
veri yazma işlemidir ve ayrı onay ister.

### B2 — Eksi işareti düşüyordu ✅ KAPANDI (UI-ADR-191)

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

**Düzeltildi** (sahip onayladı): `p > 0 ? "+" : p < 0 ? "−" : ""`.
`−` U+2212 — `mocks/amazon.ts` senaryo metinleri zaten bunu kullanıyor.
Dikkat çekici: fonksiyonun **kendi JSDoc'u zaten `"-%10"` yazıyordu** —
sözleşme beyan edilmiş, kod tutmuyordu. Sözleşme testi kondu
(`simulation-panel.stories.tsx`): artı işaret ALIR, eksi işaret ALIR.

### B3 — Kök layout patlarsa boş beyaz sayfa ✅ KAPANDI (UI-ADR-191)

```
src/app/(shell)/error.tsx     VAR   → ekran hataları yakalanıyor, kabuk ayakta kalıyor
src/app/global-error.tsx      YOK   → kök layout hatasında yakalayıcı YOK
```

`(shell)/error.tsx` route segment sınırı olduğu için `layout.tsx`'in
KENDİSİ patlarsa devreye giremez. Sonuç: kullanıcı boş beyaz sayfa görür —
`10-component-library.md` §11'in (*"Kullanıcı hiçbir zaman sadece 'Error'
görmez"*) ihlali.

**Düzeltildi** (sahip onayladı): `src/app/global-error.tsx` eklendi.
Kendi `<html>`/`<body>`sini kurar (kök layout'un YERİNE geçer), `reset()`
ile yerinde onarma ve brifinge dönüş yolu sunar, hata kimliğini ancak Next
ürettiyse basar.

⚠️ **İki kez kapı tarafından düzeltildim:** (1) "kök çöktüyse `globals.css`
yüklenmemiş olabilir" diye inline stil yazdım — token kapısı dokuz satırda
durdurdu ve haklıydı: stil yoksa sayfa stilsiz ama OKUNUR kalır.
(2) `bg-surface-base` yazdım — **öyle bir token yok**; repoda tek geçtiği
yer benim satırımdı ve Tailwind onu sessizce yok sayardı. Kabuğun kullandığı
`bg-bg` ile değiştirildi.

⚠️ Bu dosyanın **story'si yok**, yani a11y kapısından geçmiyor: kök çökme
durumu Storybook'ta üretilemiyor. Bilerek kayda geçirildi.

### B4 — Yetkilendirme katmanı yok ✅ N/A — KODDAN DOĞRULANDI

Tarandı: sistemde **kimlik, oturum, token, rol veya tenant kavramı hiç
yok** (bütün `role=` eşleşmeleri ARIA rolü). `queryKey`de kimlik boyutu
yok.

- **Tek kullanıcılı localhost aracı ise** → N/A. Sahip bunu **yazılı**
  beyan etmeli.
- **Birden çok kullanıcı ya da korumalı veri olacaksa** → **BLOCKER**.

**Dağıtım modeli varsayılmadı — koddan ve dokümandan ölçüldü.** Dört
bağımsız kanıt:

| kanıt | yer | ne diyor |
|---|---|---|
| Bağlama **sabit** | `odin/cockpit.py:719` | *"Bind 127.0.0.1 **ONLY** — the cockpit is the owner's local surface"* — yapılandırılabilir değil |
| Modül beyanı | `odin/cockpit.py:3` | *"A localhost-only HTTP server … bound **strictly** to 127.0.0.1"* |
| Konsolun kimliği | `odin/cockpit.py:9` | *"the console **IS the owner's CLI**"* |
| Arayüz kuralı | `ODIN-UI-arch/CLAUDE.md:166` | *"Sunucu **bilinçli olarak** sadece localhost'ta. Dışarı açma — ayrı güvenlik incelemesi gerektirir, **kapsam dışı**."* |

Yani **tek kullanıcı · localhost · owner-only** — bir eksiklik değil, her
iki repoda da açıkça belgelenmiş bir **tasarım kararı**. Kimliği olmayan
bir sistemde yetkilendirme katmanı aramak, olmayan bir sınırı korumaktır.

**Hüküm: B4 = N/A.**

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
| 1 | `POST /api/command` + `useMutation` + hata ayrımı | orta | **B1** ✅ UI-ADR-192 |
| 2 | `caseLabel` eksi işareti | tek satır | **B2** ✅ UI-ADR-191 |
| 3 | `app/global-error.tsx` | küçük | **B3** ✅ UI-ADR-191 |
| 4 | Dağıtım modeli | ölçüm | **B4** ✅ N/A |

**Dördü de kapandı.** Matris yeniden koşuldu → §9.

---

## Bu raporun kendi sınırları

- Yetkilendirme artık **N/A** (koddan doğrulandı) — ama yalnız localhost
  dağıtımı için; sunucu dışarı açılırsa bu hüküm düşer.
- Paket bütçesi, LCP/CLS ve gzip boyutu **ölçülmedi**.
- Async yarış koşulu (B önce, A sonra) **koşturulmadı** — desenler temiz ama
  iddia sınanmadı (UI-ADR-190).
- Kusur geçmişi ve cyclomatic complexity risk endeksine **girmedi**.
- Runtime ölçümü **tek makinede, tek ekranda, boşta** yapıldı; etkileşim
  altında ve düşük güçlü cihazda ölçülmedi.

---

## 9 · Release Recommendation

> Aşağıdaki her satır bu belgedeki bir ölçüme dayanır. Puan verilmeyen
> yerde **neden verilmediği** yazılıdır (CLAUDE.md kural 2).

### Architecture — GÜÇLÜ

| ölçüm | değer |
|---|---|
| Modül · import döngüsü | 205 · **1** (yalnız tip düzeyinde, çalışma zamanında yok) |
| Katman ihlali (`components → features`) | **0** |
| `components → lib/data` | 1 (`mock-badge` → `mode`; sahte-veri kuralının **uygulaması**) |
| Yalnız UI sorumluluğu taşıyan dosya | **51/88** |
| 3+ sorumluluk | 6 — altısı da rolüyle savunulabilir |
| Gerçekten ölü export | **0** |
| Manuel cache işlemi | **0** → anahtar-uyuşmazlığı bug *sınıfı* oluşamaz |

Veri borusu tek kapıdan geçiyor (`useOdinQuery`), yazma tek kapıdan
(`runCommand`). Sözleşme doğrulaması zod ile çalışma zamanında.

### Maintainability — İYİ, puan verilmedi

Kod satırı sınıflaması **72 sağlıklı / 10 gözden geçir / 5 refactor adayı /
1 büyük**. Tek "büyük" dosya bir ekran orkestratörü ve UI-ADR-188'de
ölçülüp bölünmemesine karar verildi.

⚠️ **Sayısal maintainability puanı VERİLMEDİ.** Meclis 2/2: ağırlıkları bir
yönetim tercihidir, nesnel ölçüm değildir. Tek sayı vermek ölçülmemişi
ölçülmüş göstermek olurdu.

### Performance — ÖLÇÜLDÜ, SORUN YOK

Üretim derlemesi, briefing ekranı, boşta 10 sn (472 örnek):

| ölçüm | değer |
|---|---|
| uzun görev | **0** |
| ana iş parçacığı sapması | medyan **1.0 ms** · p95 2.4 · p99 9.4 · maks 17.9 |
| periyodik tepe | **yok** (10 ms üstü 4 tepe, aralıkları 250/6994/841 ms) |

59 aboneli 1 Hz saat gürültü tabanının altında. Dev'deki saniyelik 64–115
ms tamamen StrictMode artefaktı çıktı.

⚠️ Paket bütçesi tanımlı değil (1626 KB sıkıştırılmamış); gzip/brotli ve
LCP/CLS **ölçülmedi** → bu üç kalem **UNKNOWN**.

### Accessibility — TAM

**240/240 story gerçek axe raporu taşıyor · ihlal 0.** Bu bir ayar değil
koşum kanıtıdır: `.artifacts/storybook-vitest.json` içindeki
`meta.reports`'tan okunur, yani kapının açık olduğu değil **koştuğu**
ölçülür.

⚠️ `app/global-error.tsx`'in story'si yok — kök çökme Storybook'ta
üretilemiyor. Tek kapsam dışı yüzey.

### Testing — GÜÇLÜ

| kapı | durum |
|---|---|
| `tsc` | 0 hata |
| `eslint` | 0 hata · 0 uyarı (`--max-warnings 0`, `noInlineConfig`) |
| unit | **20 dosya / 346 test** |
| storybook | **59 dosya / 240 test** |
| atlanan · düşen | **0 · 0** |

Dördü de fail-closed ve alt sınırlı: bir test sessizce kaybolursa kapı
düşer. ER-0025 entegrasyonu için **+39 test** eklendi (25 unit + 14 story).

**Entegrasyon dikişi CANLI doğrulandı** (§1 B1): çalışan ODIN sunucusuna
gerçek `POST /api/command` atıldı, iki yanıt biçimi de teyit edildi. Bu,
"iki taraf da kendi testinde haklıydı ama birlikte hiç koşmadılar"
sınıfını kapatır.

⚠️ **Tam kullanıcı akışı E2E'si hâlâ yok** — tarayıcıda "kartı aç →
gerekçe yaz → gönder → sonucu gör" zinciri uçtan uca koşturulmadı.
Sözleşme dikişi kanıtlı, akış değil. Sonraki sprint.

### Critical Blockers — **0**

Dördü de kapandı: B1 (UI-ADR-192) · B2 · B3 (UI-ADR-191) · B4 (N/A,
koddan doğrulandı).

### Major Issues — 2

| # | konu | neden major |
|---|---|---|
| M1 | **13 tam bileşeni hiçbir ekran kullanmıyor** | hikâyeli, testli, a11y kanıtlı — ve kullanıcı hiçbirini görmüyor. Kod kusuru değil **ürün** bulgusu (CLAUDE.md kural 6). Silmek özellik kaldırmaktır → sahibin kararı |
| M2 | **E2E akış testi yok** | router + store + React Query + retry zincirini birlikte doğrulayan test yok; bileşen sözleşmeleri korunuyor ama entegrasyon değil |

### Minor Issues — 4

| # | konu |
|---|---|
| m1 | `transport.ts` ulaşılamaz (tek import edeni bir test) |
| m2 | Tip düzeyinde 1 import döngüsü — bugün zararsız, `goals.ts` değer import'una geçerse **gerçek** olur |
| m3 | `loading.tsx` / `<Suspense>` hiç yok — veri istemcide çekildiği için etkisi sınırlı |
| m4 | Async yarış koşulu (B önce, A sonra) **koşturulmadı**; desenler temiz ama iddia sınanmadı |

### Production Readiness — kontrol matrisi

| alan | ağırlık | durum |
|---|---:|---|
| Veri okuma + zarf doğrulama + anti-fake | 15 | **PASS** |
| Yazma yolu / sign-off | 10 | **PASS** ✅ *(önce FAIL)* |
| Görüntü doğruluğu | 5 | **PASS** ✅ *(önce FAIL)* |
| Yetkilendirme | 20 | **N/A** — kimlik katmanı yok, tasarım kararı |
| Hata kurtarma | 15 | **PASS** ✅ *(önce 12/15 — `global-error` eklendi)* |
| Test ve kalite kapıları | 15 | **KISMİ 14/15** — entegrasyon dikişi canlı doğrulandı; tam akış E2E'si yok |
| Üretim performansı | 10 | **KISMİ 7/10** — paket bütçesi ve LCP/CLS ölçülmedi |
| Operasyon / izlenebilirlik | 10 | **FAIL 2/10** — hata raporlama yok, log yok |

```
Uygulanabilir ağırlık (N/A hariç)  = 80
Kazanılan                          = 15 + 10 + 5 + 15 + 14 + 7 + 2 = 68

Kontrol tamamlanma oranı = 68 / 80 = %85      (ilk ölçüm %61 → %84 → %85)
```

> **%85, "üretime %85 hazır" DEMEK DEĞİLDİR.** Tanımlı kontrollerin
> %85'inin kanıtla geçtiği anlamına gelir. Karar yüzdeden değil, **açık
> blocker olup olmamasından** gelir.

---

## Release Decision: **READY** ✅

### Teknik gerekçe

**1. Açık kritik blocker yok.** Dördü de kanıtla kapandı. En ağırı olan
B1 için kapanış kanıtı ODIN'in kendi sözleşmesinden alındı: arayüz artık
`ceo verdict`i `POST /api/command` üzerinden gönderiyor, backend'de tek
satır değişmedi, ve **kopmuş el sıkışma** tamamlandı.

**2. Doğruluk yapıya bağlı, disipline değil.** Manuel cache işlemi 0,
bayat-veri taşıyıcısı 0, bellek sızıntısı 0, sözleşme doğrulaması çalışma
zamanında zod ile. Bu sıfırlar bir bug *sınıfının* oluşmasını imkânsız
kılıyor — gözden kaçmasını zorlaştırmıyor, **imkânsız kılıyor**.

**3. Kapılar fail-closed ve alt sınırlı.** Bir testin sessizce kaybolması,
bir a11y ihlalinin sızması ya da bir lint uyarısının birikmesi mümkün
değil; dördü de düşer. `noInlineConfig` ile hiçbir kural satır içi
susturulamıyor.

**4. Performans iddiası ölçüldü, tahmin değil.** Üretimde boşta 0 uzun
görev. Ve bu ölçüm bir önceki ADR'nin **kendi iddiasını düzeltti** — bu
raporun sayılarına güvenilmesinin sebebi de budur.

**4b. Entegrasyon dikişi canlı doğrulandı.** Önceki turda bu raporun kendi
uyarısı *"iki uç birlikte hiç koşmadı"* idi; çalışan ODIN sunucusuna gerçek
`POST` atıldı ve iki yanıt biçimi de teyit edildi. Doğrulama bir düzeltme de
getirdi: story fixture'ındaki red metni yaklaşıktı, gerçeğiyle değiştirildi.

**5. Kalan iki major kalem release'i engellemez.** M1 bir ürün kapsamı
kararıdır (kullanılmayan bileşenler kullanıcıya görünmez). M2 gerçek bir
boşluktur ama mevcut kapılar (338 + 233 test, a11y 233/233) bileşen
sözleşmelerini koruyor; E2E yokluğu bilinen ve kayıtlı bir risktir.

### READY hükmünün kapsamı — açıkça sınırlı

Bu hüküm **tek kullanıcılı, localhost, owner-only** dağıtım için
geçerlidir. Bu bir varsayım değil, `cockpit.py`nin sabit `127.0.0.1`
bağlaması ve her iki repodaki açık beyanla **ölçülmüş** bir olgudur.

⚠️ **Sunucu dışarı açıldığı gün bu hüküm DÜŞER:** kimlik katmanı
eklendiğinde `queryKey` bir kimlik boyutu kazanmak **zorundadır**, yoksa
bir kullanıcının verisi diğerinin ekranında görünür. B4 kapanmadı —
**uygulanamaz** durumda; şartlar değişirse yeniden açılır.

### Release öncesi kalan tek adım — sahibin onayına bağlı

Sözleşmenin **yazmayan iki yolu** canlı doğrulandı (beyaz liste reddi ve
reddedilmiş verdict). **Başarı yolu bilerek koşturulmadı**: gerçek bir onay
göndermek, silinmeyen deftere (ODIN ADR-0005) kalıcı bir kayıt düşürür ve
bu sahibin verisidir.

Başarı yolunun ayrıştırması `exit === 0` koşuluna dayanıyor ve **aynı `exit`
alanının canlı okunduğu kanıtlandı**; kalan risk yalnızca "sunucu 0 döndürür
mü" sorusudur ve onu backend'in kendi 7 yeşil testi kapsıyor.

**Sahip isterse tek komutla canlı onay denemesi yapılabilir.** Bu bir veri
yazma işlemidir ve ayrı onay ister.
