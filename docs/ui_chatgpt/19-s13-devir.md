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
| **140** | **SAHİP KARARI:** 9 tüketicisiz modül envanter olarak kalır | `inventory.test.ts` kapısı: çağıranı yoksa hikâyesi olacak — enjekte ihlalle denendi |
| **141** | Erişilebilirlik: 5 açık kapandı + tuzak #1'in KÖK NEDENİ | ızgara adı · iconOnly derleme kapısı · modal labelledby · Escape kökte · search combobox; `connectTimeout` ile testler tek koşuda |
| **142** | Story bir DAVRANIŞ kanıtlar; §2.7 kapandı | 7 yeni story + envanterdeki 7 bileşene `play`; kapıya ikinci kol; 141'in kök-neden iddiası düzeltildi |
| **143** | Ekranlar `features/<alan>/screen.tsx`e taşındı | `components/screens/` KALKTI; kapı dosya adına bağlandı, 4 ihlalle denendi (biri ilk denemede kaçtı) |
| **144** | Bölme ÖLÇÜTÜ (4 koşul); yalnız `VerdictForm` geçti | 6 dosya ölçüldü 1'i bölündü (419→307); ADR-0085 açıklanabilirlik kapısı ilk kez test altına alındı |
| **145** | §2.3'ün kalanı ölçüldü; iki iddia ÇÜRÜDÜ | `GuardedCard` yazılmadı (varyasyon matrisi) · `Caption` 48 değil 9'muş · tek gerçek elle-yazım düzeltildi |
| **146** | Yazılımcılar denetimi | Sahte-veri kaçağı kapısı (`value={x ?? 0}`) + modal odak tuzağı testi; 2 bulgu ölçülüp elendi, 1'i açık bırakıldı |
| **147** | **SAHİP KARARI:** `Metric` → `Stat` | `truncate` yerleşim güvencesi olarak prop oldu (varsayılan kapalı); elle yazılmış kopya sıfırlandı |
| — | `main` (S14) dala merge edildi | **UI-ADR-129 çakışması** çözüldü: main'inki dondurulmuş, bizimki 135'e taşındı |


**Test tabanı:** başlangıç 54 dosya/292 test → şimdi **66 dosya/413 test**
(+1 dosya/+5 test main'in S14'ünden, +1 dosya/+4 test UI-ADR-136'dan,
+4 test UI-ADR-137'den, +1 test UI-ADR-138'den, +1 dosya/+25 test UI-ADR-139'dan, +1 dosya/+10 test UI-ADR-148'tan, +6 test UI-ADR-149'den, +5 dosya/+42 test UI-ADR-150'den, +1 dosya/+9 test UI-ADR-144'ten),
hepsi yeşil. Lint 0 hata, `tsc` 0.

⚠️ **Numara haritası değişti:** S13'ün kararları artık **130…139 + 142…149**
(140 ve 141 `main`'e gitti: S15 ölçüm penceresi, S16 fırsat görünümü).
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

### 2.2 · ~~Ekranları `features/` altına taşı~~ ✅ KAPANDI

**UI-ADR-143.** `components/screens/` kalktı; altı ekran
`features/{briefing,mission-control,goals,intelligence-feed,
amazon/director,amazon/sku}/screen.tsx`e indi.
`components/{ui,executive,layout}` paylaşılan katman olarak kaldı.

Kapı artık DOSYA ADINA bağlı (`**/screen`), klasöre değil — `features/`
altında ekran olmayan çok şey var. Dört ihlalle denendi; **aşağı göreli
import (`./director/screen`) ilk denemede KAÇTI**, desen tamamlandı.

### 2.3 · ~~Bileşen seviyesi tekrar~~ ✅ KAPANDI

**UI-ADR-136 · 137 · 138 · 142 · 145.** Dört iddianın ikisi ölçülünce
ÇÜRÜDÜ ve kasıtlı olarak YAPILMADI:

- ~~`DataGuard>Card>…>TrustSignal` 9 dosyada aynı~~ → **değil.** 6'sı
  View-çıkarma, 9'u satır içi; `CardHeader` propları üç ayrı şekilde.
  Ortak sarmalayıcı `title?/description?/actions?/footer?/trust?`
  isterdi — merkezileştirme değil prop taşımacılığı.
- ~~`text-xs text-content-tertiary` 48 kez~~ → 48'in yalnız **9'u**
  birebir `Caption`. O 9'u çevrildi; kalan 37 farklı etiket/bağlam,
  toplu değiştirme yapılmadı.
- Export edilmemiş birlikler → **tek** gerçek elle-yazım vardı
  (`director-card` `NumFormat`), düzeltildi. Diğerlerini export etmek
  kullanılmayan API yüzeyi üretirdi.
- `kpi()` / `envelope()` ikizleri → UI-ADR-137'de silindi.
- Yüzde gösterimi 10 çağrı yeri → UI-ADR-138'de tek `Pct`.
- `ChartProps` export edildi (UI-ADR-150).

✅ **SAHİP KARAR VERDİ (UI-ADR-147):** `Stat` kanonik. `Metric` ve
`runtime-director-card`in iki elle yazılmış hücresi `Stat`a bağlandı;
`truncate` bir yerleşim güvencesi olarak prop oldu (varsayılan KAPALI —
mevcut çağıranların görünümü değişmesin diye).

### 2.5 · ~~Test edilmeyen "test edilebilir" yardımcılar~~ ✅ KAPANDI

**UI-ADR-139.** Sekizi de (devir "yedi" diyordu; `monitoredDecisions`
ayrı sayılmalıydı) `components/executive/helpers.test.ts` altında,
25 iddia. Tarayıcı gerekmez.

Test yazılırken `decision-queue.tsx` başlığının **kodla çeliştiği**
ortaya çıktı: silinmiş `priority`/`financialImpact` sıralamasını
anlatıyordu (UI-ADR-100). Düzeltildi.

### 2.8 · ⚠️ AÇIK — ekran seviyesi durum matrisi (UI-ADR-146)

**Yazılımcılar meclisinin bulduğu tek kapanmamış açık.** Bileşen testleri
parçaları kanıtlıyor ama `veri durumu → ekran` zincirini kimse
kanıtlamıyor. Dört ekranın `loading`/`empty`/`error` story'si VAR ama
hiçbiri bir şey İDDİA ETMİYOR — yalnız render ediyorlar.

Yazıldı ve GERİ ALINDI: `demo` prop'u `useOdinFixture`in asenkron
yüklemesine bağlı; `play` çalıştığında zarf henüz `null` olabiliyor ve
tahta "Karar verisi yok" ile "İzlenen karar yok" arasında zamanlamaya
göre değişiyor. Kararsız bir test, testsizlikten kötüdür.

**Doğru çözüm:** ekran seviyesinde deterministik zarf enjeksiyonu —
`play` öncesi fixture'ı çözülmüş hâle getirecek bir yol. Kilitlenecek
ayrım: **"yükleniyor" ile "ölçüldü ve sıfır" ile "ölçülmedi" ÜÇ AYRI
ŞEYDİR** ve üçü de birbirine benzeyen bir ekran üretebilir.

### 2.6 · ~~Tüketicisi olmayan modüller~~ ✅ SAHİP KARAR VERDİ

**UI-ADR-148: envanter olarak KALIRLAR, silinmiyorlar.** Dokuzunun
dokuzu da `10-component-library.md` §10 envanterinde adı geçen
kalemlerdir ve dokuzunun da hikâyesi vardır.

Kapı: `src/components/inventory.test.ts` — **çağıranı yoksa hikâyesi
olacak**, ve liste dokuz kalemden büyürse test düşer. Yeni bir bileşeni
çağıranı olmadan eklemek isteyen önce hikâyesini yazar.

### 2.7 · ~~Storybook boşlukları~~ ✅ KAPANDI

**UI-ADR-150.** Yedisinin de story'si var ve hepsi `play` taşıyor.
Ayrıca envanterdeki (UI-ADR-148) yedi bileşene de davranış testi yazıldı —
gavadolar kapıdaki açığı buldu: "hikâyesi var" yetmez, yalnız render eden
story hiçbir şey kanıtlamaz. Kapıya ikinci kol eklendi.

### 2.4 · ~~Kalan erişilebilirlik~~ ✅ KAPANDI

**UI-ADR-149.** Beşi de düzeltildi ve her biri `play` testiyle kilitlendi:
ızgara `<table>`'a taşındı + `<caption>` adı · `iconOnly` → `aria-label`
DERLEMEDE zorunlu (enjekte ihlalle denendi) · modal `aria-labelledby` +
`aria-describedby` · filter Escape kökte + odak geri veriliyor · search
tam ARIA combobox (120 ms zamanlayıcı kalktı).

---

## 3. TUZAKLAR — bunları tekrar keşfetme

1. ~~**Tam test paketinden önce dev sunucusunu KAPAT.**~~ **♻️ KÖK NEDEN
   BULUNDU — UI-ADR-149'de düzeltildi.** Dev sunucusuyla ilgisi yoktu.
   Sebep: 45 story dosyasının soğuk Vite dönüşümü varsayılan 30 sn'lik
   `browser.connectTimeout`u aşıyordu. ⚠️ Ayar **KÖK** `test.browser`a
   yazılmalı — proje içine yazılırsa Vitest onu SESSİZCE YOK SAYAR
   (`project.vitest.config.browser.connectTimeout ?? 6e4`); UI-ADR-149
   önce oraya yazdı ve düzeltme hiç etkili olmadı, UI-ADR-150'de
   düzeltildi. Şimdi storybook projesi **tek komutta 50/50** geçiyor,
   parçalamaya (`--shard`) gerek yok.
   ⚠️ **AMA iki projeyi AYNI ANDA çalıştırma:** `unit` (node) ile
   `storybook` (tarayıcı) birlikte koşarsa node işçileri CPU'yu tutuyor ve
   bağlantı yine düşüyor (ölçüldü, 62 sn'de patladı). `--project=unit` ve
   `--project=storybook` AYRI çalıştırılır.

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
npx vitest run --project=unit        # 15 dosya / 220 test
npx vitest run --project=storybook   # 51 dosya / 193 test  (TEK komut)
#                            TOPLAM: 66 dosya / 413 test
# ⚠️ `npx vitest run` (ikisi birden) KULLANMA — tuzak #1'e bak.

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

---

## 6. HAZIRLIK TARAMASI — 31 Tem 2026, kapanış öncesi

> Bu bölüm §1–§5'i **yeniden ölçtü**. Aşağıdaki dört satır, yukarıdaki
> metinle çelişiyorsa doğru olan burasıdır.

### 6.1 Dalın gerçek konumu (ölçüldü)

| | Ölçüm |
|---|---|
| `main` | `7903e95` — **S15 ve S16 da indi**, §0'daki `9e7904a` bayat |
| Dal ↔ main | main'de olmayan **18**, dalda olmayan **4** commit |
| Push durumu | origin'de, ama **2 commit push edilmemiş** (`origin/...` 2 geride) |
| Çalışma ağacı | temiz |
| `tsc --noEmit` | **0 hata** |
| `vitest --project=unit` | **15 dosya / 215 test yeşil** |
| `--project=storybook` | ⬜ bu taramada koşulmadı |

⚠️ `CLAUDE.md`'nin sprint panosu S13 için **"lokal, push/merge YOK"** diyor —
**yanlış**, dal push edilmiş. Panonun düzeltilmesi gerekiyor.

### 6.2 ÜÇ ADR numarası çakışıyor (§1'deki 129 çakışması tekrarladı)

| Numara | S13 dalında | `main` / `s17` tarafında |
|---|---|---|
| **140** | Tüketicisiz dokuz bileşen envanterdir | **S15** — her metrik ölçüm penceresini söyler (`main`'de) |
| **141** | Erişilebilirlik kapıya bağlandı | **S16** — fırsat bir görünüm (`main`'de) |
| **142** | Story bir DAVRANIŞ kanıtlar | **S17** — Storybook kapısı fail-closed (dalda, merge YOK) |

`main`'dekiler dondurulmuş sayılır (yayında). **S13'ünkiler taşınır.**
S17 de merge edilmemiş; 142 için sıra kararı sahibindir.

### 6.3 Merge önizlemesi: 3 dosyada çakışma

`git merge-tree main feature/s13-frontend-architecture` →
`CLAUDE.md` · `08-decision-log.md` · `src/components/screens/executive-briefing.tsx`

⚠️ **Üçüncüsü metin çakışması değil, REGRESYON riskidir.**
`main`'de (S16 / UI-ADR-149) fırsat yuvası **canlı**:
`useOdinOpportunities()` + ODIN ADR-0154 görünümü. S13 dalı aynı yuvayı
`useOdinFixture("briefing.opportunities")` yapıyor ve `AIRecommendationView`
ile basıyor — oysa `main`'in oradaki yorumu bu bileşeni **açıkça
reddediyor** ("yedi zorunlu açıklanabilirlik alanı ister, boş geçmek
uydurmak olurdu"). Naif merge **canlı veriyi mock'a geri döndürür** ve
repo kuralı #2'yi ihlal eder.

**Çözüm şekli:** iskelet (`screenState` · `useOdinFixture` · `emptied`)
S13'ten; **fırsat bloğunun tamamı `main`'den.** `screenState`'in
`useOdinOpportunities`'in kendi `error`/`empty` kanalını taşıması gerekir.

### 6.4 §4 tablosunun iki satırı bayat

- ~~`chart.tsx` sahip kararı bekliyor~~ → **UI-ADR-148 karar verdi:**
  dokuzu da envanter olarak kalır. Satır kapatılmalı.
- ~~"7 yardımcı hiç test edilmiyor"~~ → **UI-ADR-139 kapattı** (8 yardımcı,
  25 iddia).
