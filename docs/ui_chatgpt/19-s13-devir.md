# S13 — Kurumsal Ön Yüz Mimarisi · DEVİR BELGESİ

> **Yeni oturum: ÖNCE BUNU OKU.** Keşfi baştan yapma — aşağıdaki her sayı
> ölçüldü, tahmin edilmedi. 31 Temmuz 2026'da yazıldı.

---

## 0. Nerede çalışıyoruz

| | |
|---|---|
| Worktree | `C:\Users\PackardBell\Desktop\ODIN\ODIN-UI-arch` |
| Dal | `feature/s13-frontend-architecture` |
| Çıkış noktası | `main` = `9e7904a`; **`main` (S14) 31 Tem'de dala merge edildi** |
| Durum | **origin'e PUSH EDİLDİ** (dalın kendisi; `main`'e merge YOK) |
| Sahip onayı | ⬜ **Alınmadı.** Beş soru sorulmadı. |

Sahibin isteği (özet): *"ön yüz mimarisini kurumsal seviyeye taşı;
derlenmesi yeterli değil; her turdan sonra kod tabanını yeniden oku,
tekrar/şişkinlik/sınır ihlali ara, daha iyisi varsa öncekini değiştir."*

---

## 1. Ne bitti

| ADR | Konu | Ölçülen sonuç |
|---|---|---|
| — | `classifyError`'da `ZodError` dalı yoktu | Her ham yük sözleşme ihlali "bilinmeyen hata" diye gösteriliyordu → artık `contract` |
| **135** | **İki paralel veri zinciri birleşti** (eski lokal 129) | `screens → mocks` kenarı **8 → 0**; 15 ekran yuvası artık zod+tazelik+hata kanalından geçiyor |
| **130** | Katman sınırları ESLint'e bağlandı | `layout → screens` 0 · `mocks → components` 0; üç kapı da enjekte ihlalle **denendi ve ateşledi** |
| **131** | Ekran iskelesi tek yerde | "sözleşme yok" metninin İKİ şekli bire indi, `emptyProps` adaptörü silindi |
| **132** | `Pressable` primitive'i | İki geçersiz `<button>` iç içeliği + bir sahte affordance |
| **133** | Rota sınırları | `error.tsx` + kök `not-found.tsx`; beyaz sayfa yerine beş adımlı hata |
| **134** | `amazon-director` bölündü | **802 → 496 satır** |
| **136** | Etiket-değer + metin tonu tek yerde | Yerel `Stat` kopyası ve 4 elle yazılmış `<dt>/<dd>` silindi; `StatTone`/`TextTone` → tek `Tone` |
| **137** | Zarf/kayıt fabrikaları birer kez | `kpi()` ve `envelope()` ikizleri silindi; varsayılanlar ilk kez test altında |
| **138** | Yüzde gösterimi tek bileşende (`Pct`) | 10 çağrı yeri → 0; `format="percent" fractionDigits={1}` artık tek yerde |
| **139** | 8 saf fonksiyon nihayet test altında | 25 iddia; `decision-queue.tsx` başlığının kodla çeliştiği ortaya çıktı |
| — | `main` (S14) dala merge edildi | **UI-ADR-129 çakışması** çözüldü: main'inki dondurulmuş, bizimki 135'e taşındı |


**Test tabanı:** başlangıç 54 dosya/292 test → şimdi **59 dosya/344 test**
(+1 dosya/+5 test main'in S14'ünden, +1 dosya/+4 test UI-ADR-136'dan,
+4 test UI-ADR-137'den, +1 test UI-ADR-138'den, +1 dosya/+25 test UI-ADR-139'dan),
hepsi yeşil. Lint 0 hata, `tsc` 0.

⚠️ **Numara haritası değişti:** S13'ün kararları artık **130…139**.
Eski lokal `UI-ADR-129` = bugünkü **135**. `main`'in `UI-ADR-129`'u
S14'ün runtime alarmlarıdır, başka bir karardır.

---

## 2. SIRADAKİ İŞ — buradan devam et

> ⚠️ Önceki oturumun görev listesi (`TaskList`) **oturuma özeldi ve
> kayboldu**. Aşağısı onun yerine geçer — kanıtlar buraya taşındı, başka
> yere bakma.

Öncelik sırası:

### 2.1 · Kalan büyük bileşenler (task #11)

Ölçüm (31 Tem, story/test hariç):

```
496  components/screens/amazon-director.tsx     ← kalan üç kolon bloğu
419  components/executive/decision-card.tsx     ← içinde DÖRT status→stil haritası
384  components/screens/amazon-sku-panel.tsx    ← Group primitive + yedi bölüm
371  components/ui/table.tsx
368  components/screens/executive-briefing.tsx  ← HeroView
357  components/ui/chart.tsx                    ← ⚠ HİÇ TÜKETİCİSİ YOK
344  components/screens/mission-control.tsx     ← OperationalStatus
297  components/executive/ai-recommendation-card.tsx
```

**Kural (gavadolar, UI-ADR-134'te uygulandı):** dikişe göre böl, satır
sayısına göre DEĞİL. *"Sırf dosya küçülsün diye 20 küçük bileşen"* yapma.
Ekranın DÜZENİ olan bloklar yerinde kalabilir.

### 2.2 · Ekranları `features/` altına taşı (task #9)

Meclis şekli (terra, küçük diff): `features/{briefing,mission-control,
amazon/{director,sku},goals,intelligence-feed}/`.
`components/{ui,executive,layout}` **paylaşılan katman olarak kalır.**

Zaten yerinde: `features/amazon/{presentation,selectors,director}`,
`features/executive/presentation`, `features/shell`.

⚠️ **Klasörü ancak GERÇEK kod dolduruyorsa aç.** Boş 10 alt klasör
şablonu meclisin iki üyesi tarafından da reddedildi — reponun kendi
"sahte yapı yasak" kuralını ihlal eder.

Taşıma bitince ESLint kapısını sıkılaştır: `components/screens/**`
kaybolacağı için "ekranı yalnız `app/` import eder" kuralı
`features/*/screen`e kayar.

### 2.3 · Bileşen seviyesi tekrar (task #10)

- ✅ **KAPANDI (UI-ADR-136):** `ui/stat.tsx:20` ≡ `ui/typography.tsx:60`
  birleşti, tek `Tone`. `ui/icon.tsx:22` ve `ui/timeline.tsx:29`
  **BİRLEŞTİRİLMEDİ ve birleştirilmemeli** — aynı anahtar adları, farklı
  token uzayı (`text-icon*` / `bg-*`). "20 harita" sayısı yüzeysel biçim
  benzerliğine dayanıyordu; kaynaktan doğrulanınca birebir aynı olan
  yalnız İKİSİYDİ.
- `DataGuard > Card > CardHeader > CardBody > CardFooter > TrustSignal`
  kompozisyonu **9 dosyada** kelimesi kelimesine yazılı.
- `"text-xs text-content-tertiary"` **21 kez**;
  `"text-xs uppercase tracking-wide text-content-tertiary"` 7 kez — oysa
  `ui/typography.tsx:97` `Label` **tam olarak o dizedir** ve hiçbiri onu
  kullanmıyor.
- ✅ **KAPANDI (UI-ADR-137):** `kpi()` → `mocks/envelope.ts` `mockKpi`;
  `envelope()` → `types/data-envelope.ts` `internalEnvelope`.
- `toISOString().slice(0,10)` üç ayrı yerde — **KASITLI OLARAK BIRAKILDI**
  (UI-ADR-137): merkezileşmesi gereken bir KARAR değil, bir JS deyimi.
  İki katman arasında yeni bağımlılık kurmaya değmez.
- **Etiket-değer gösterimi — KISMEN KAPANDI (UI-ADR-136).**
  Silinenler: `mission-control.tsx` yerel `Stat`, `executive-briefing.tsx`
  dört elle yazılmış `<dt>/<dd>`. **KALAN:** `director-card.tsx:34` yerel
  `Metric` (`truncate` + büyük harf YOK — `Stat`tan görsel olarak farklı,
  körlemesine birleştirme), `runtime-director-card.tsx:83`,
  `decision-card.tsx:249`, `council-view.tsx:39`,
  `ai-recommendation-card.tsx:117`.
  ⚠️ Birleştirmeden önce `Stat`a `truncate`/`plain-label` seçeneği mi
  gerekiyor, yoksa iki ayrı bileşen mi doğru — **önce karar, sonra kod.**
- ✅ **KAPANDI (UI-ADR-138):** `Pct` bileşeni. Gerçek sayı **9 değil 10**'du
  (`sku-columns.tsx:114` listede yoktu).
- **Export edilmemiş sihirli-dize birlikleri** (çağıran elle yeniden
  yazıyor): `avatar.tsx:45,47` · `badge.tsx:47` size · `stat.tsx:50` ·
  `typography.tsx:212` · `timeline.tsx:36` · `tooltip.tsx:36` ·
  `modal.tsx:169,185`. `chart.tsx:47` `ChartProps` **export edilmemiş**
  olmasına rağmen üç bileşen onu alıyor. `director-card.tsx:42`
  `NumFormat`'ı elle yeniden tanımlıyor (oysa `typography.tsx:153`'te
  export edilmiş).

### 2.5 · ~~Test edilmeyen "test edilebilir" yardımcılar~~ ✅ KAPANDI

**UI-ADR-139.** Sekizi de (devir "yedi" diyordu; `monitoredDecisions`
ayrı sayılmalıydı) `components/executive/helpers.test.ts` altında,
25 iddia. Tarayıcı gerekmez.

Test yazılırken `decision-queue.tsx` başlığının **kodla çeliştiği**
ortaya çıktı: silinmiş `priority`/`financialImpact` sıralamasını
anlatıyordu (UI-ADR-100). Düzeltildi.

### 2.6 · Tüketicisi olmayan modüller — **önce sahibe sor**

Hiçbir yerden import edilmiyor (hikâyeler hariç):
`ui/chart.tsx` (357) · `ui/modal.tsx` (195, tek focus-trap uygulaması) ·
`ui/tabs.tsx` · `ui/tooltip.tsx` · `ui/filter.tsx` · `ui/icon.tsx` ·
`ui/avatar.tsx` · `ui/sparkline.tsx` · `executive/telemetry-bar.tsx`.

Bunlar **tasarım sistemi envanteri mi, ölü kod mu** — karar sahibindir,
kendiliğinden silme. `10-component-library.md` §10 envanteri kanonik
kaynaktır, önce oraya bak.

### 2.7 · Storybook boşlukları

Hiç hikâyesi olmayanlar: `ui/no-data.tsx` · ~~`ui/stat.tsx`~~ ✅ kapandı
(`ui/stat.stories.tsx`, UI-ADR-136 — reponun `components/ui` altındaki
ilk davranış testi) · `executive/confidence-breakdown.tsx` ·
`executive/data-guard.tsx` · `executive/disclosure.tsx` ·
`executive/meter.tsx` · `executive/monitored-decisions-board.tsx`
(179 satır, `/mission-control`'ün ANA odak alanı) ·
`executive/threshold-note.tsx`.

### 2.4 · Kalan erişilebilirlik (task #8 içinde açık bırakıldı)

- `table.tsx`: `<caption>` yok; `aria-label` sarmalayıcı `div[role=grid]`
  üzerinde, içteki gerçek `<table>` **adsız**.
- `button.tsx:78` "`aria-label` ZORUNLU" diyor ama **hiçbir şey zorlamıyor**.
- `modal.tsx:129` `aria-label` görünür `<h2>`yi tekrarlıyor —
  `aria-labelledby` olmalı; `description` `aria-describedby`ye bağlı değil.
- `filter.tsx`: Escape yalnız tetikleyicide bağlı; odak listeye girince
  klavyeyle kapatılamıyor.
- `search.tsx`: geçmiş listesi `role="listbox"` değil, ok tuşu yok,
  **120 ms blur zamanlayıcısıyla** kapanıyor (klavye için yarışlı).

---

## 3. TUZAKLAR — bunları tekrar keşfetme

1. ~~**Tam test paketinden önce dev sunucusunu KAPAT.**~~ **♻️ YANLIŞ
   TEŞHİS — UI-ADR-136'da ölçüldü ve düzeltildi.** Sebep dev sunucusu
   değil: Playwright tarayıcı oturumu, aynı anda toplanan dosya sayısı
   arttıkça bağlantı zaman aşımına uğruyor. Dev sunucusu açıkken
   `--shard=1/3` ve `2/3` sorunsuz geçti; `3/3` bir kez düştü ve
   **hiçbir şey değiştirmeden tekrar çalıştırılınca geçti**.
   **Doğru işlem:** `npx vitest run --project=unit`, sonra
   `npx vitest run --project=storybook --shard=i/3` (i=1,2,3); düşen
   parçayı tekrarla. Dev sunucusunu kapatma — başkasının worktree'sine
   ait olabilir (ölçümde port 3000 `ODIN-UI-s8`'e aitti).
2. **`not-found.tsx` route-group içinde ÇALIŞMIYOR.** `(shell)/` ve
   `(shell)/[[...slug]]/` altına kondu, ikisi de yok sayıldı (temiz
   önbellekle doğrulandı). Yalnız kök `app/not-found.tsx` devreye giriyor.
   Bedeli: 404'te kabuk yok. **Tekrar deneme.**
3. **`error.tsx` `curl` ile test edilemez.** Dev SSR ilk istekte kendi
   sayfasını basar; sınır istemcide devreye girer — tarayıcıyla doğrula.
4. **Tarayıcı konsol tamponu gezinmeler arası TEMİZLENMİYOR.** Eski HMR
   hataları güncel sanılıyor. Temiz okuma için YENİ SEKME aç.
5. **ESLint `no-restricted-imports` deseninde tek `*` `/` geçmez.**
   `@/components/*` `@/components/ui/badge`'i YAKALAMAZ. `**` kullan.
   (Bu hata yazıldı, enjekte ihlalle yakalandı, düzeltildi.)
6. **Python ile Windows konsoluna Türkçe yazdırma** — `cp1254` patlıyor.
   Dosyaya yaz ve `Read` ile oku, ya da `grep` kullan.

---

## 4. BİTMEMİŞ / KARAR BEKLEYEN

| Konu | Durum |
|---|---|
| **Sahip onayı** | ⬜ Beş soru sorulmadı, S13 kapanmadı |
| **Push / merge** | Dal origin'de; **`main`'e merge YOK** — sahip onayı bekliyor |
| `chart.tsx` (357 satır) | Hiç tüketicisi yok. Tasarım sistemi envanteri mi, ölü kod mu? **Sahip kararı.** Aynı durum: `modal`, `tabs`, `tooltip`, `filter`, `icon`, `avatar`, `sparkline`, `telemetry-bar`. |
| Amazon eşikleri | `backend-istekleri.md` §14'e yazıldı. ODIN `health.tone` / `buy_box_at_risk` yayınlayınca `features/amazon/presentation/thresholds.ts` **silinir**. |
| Bileşen testi yok | Repoda `src/lib` ve `src/mocks` dışında birim testi yok; "test edilebilir olsun diye" export edilmiş 7 yardımcı (`sortIntelligence`, `actionableAlerts`, `sortCampaigns`, `sortDecisions`, `dueDeferrals`, `monitoredDecisions`, `rotationSeconds`) **hiç test edilmiyor**. |

---

## 5. Doğrulama komutları

```bash
cd C:/Users/PackardBell/Desktop/ODIN/ODIN-UI-arch

npx tsc --noEmit          # 0 hata olmalı
npm run lint              # 0 hata olmalı

# Tam paketi TEK SEFERDE çalıştırma — tarayıcı bağlantısı zaman aşımına
# uğruyor (tuzak #1, düzeltilmiş hâli). DİZİN bazında parçala; `--shard`
# de işe yarar ama dizin bölmesi ölçümde daha kararlı çıktı:
npx vitest run --project=unit                                   # 14 / 196
npx vitest run --project=storybook src/components/ui            # 18 /  57
npx vitest run --project=storybook src/components/executive       src/components/layout src/features src/app                # 22 /  73
npx vitest run --project=storybook src/styles src/components/screens  # 5 / 17
#                                                        TOPLAM: 59 / 344

# ÜRETİM DERLEMESİ + EKRAN DOĞRULAMASI (31 Tem'de yapıldı)
npx next build            # 7 sayfa, 0 hata
npx next start -p 3111    # 3000 BAŞKA worktree'de olabilir
# /briefing /mission-control /amazon /goals → 200 · /bilinmeyen → 404
#
# ⚠️ curl YETMEZ: SSR iskelet basıyor, gerçek içerik hidrasyondan sonra
# geliyor (tuzak #3'ün aynısı). TARAYICI şart. Ölçülen:
#   /mission-control → Stat: "Sağlıklı Director = 6 [odin-num text-lg
#     text-success]", "Bilinmiyor = 2 [... text-content-tertiary]"
#     → paylaşılan Stat + birleşmiş TONE ekranda, CANLI ODIN verisiyle
#   /amazon → 10 farklı yüzde, hepsi tek ondalıkla (%8,1 · %71,5 · %122,8…)
#     → Pct ekranda, canlı veriyle
#   konsol: 0 hata
#
# ⚠️ /briefing'in HeroView'i üretim (odin) modunda ÇİZİLMEZ: fixture
# fail-closed. Oradaki dört Stat yalnız Storybook ekran story'sinde
# görünür — bu S8'den beri böyle, UI-ADR-136'nın getirdiği bir şey değil.
```

Katman kenarlarını ölçmek için `scratchpad/deps.py` kullanıldı; mantığı
basit: `src/**` içindeki `@/` import'larını katmana eşleyip sayıyor.
Beklenen: `screens → mocks` **0**, `layout → screens` **0**,
`mocks → components` **0**.
