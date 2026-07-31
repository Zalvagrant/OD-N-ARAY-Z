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
| — | `main` (S14) dala merge edildi | **UI-ADR-129 çakışması** çözüldü: main'inki dondurulmuş, bizimki 135'e taşındı |


**Test tabanı:** başlangıç 54 dosya/292 test → şimdi **65 dosya/402 test**
(+1 dosya/+5 test main'in S14'ünden, +1 dosya/+4 test UI-ADR-136'dan,
+4 test UI-ADR-137'den, +1 test UI-ADR-138'den, +1 dosya/+25 test UI-ADR-139'dan, +1 dosya/+10 test UI-ADR-140'tan, +6 test UI-ADR-141'den, +5 dosya/+42 test UI-ADR-142'den),
hepsi yeşil. Lint 0 hata, `tsc` 0.

⚠️ **Numara haritası değişti:** S13'ün kararları artık **130…142**.
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

### 2.6 · ~~Tüketicisi olmayan modüller~~ ✅ SAHİP KARAR VERDİ

**UI-ADR-140: envanter olarak KALIRLAR, silinmiyorlar.** Dokuzunun
dokuzu da `10-component-library.md` §10 envanterinde adı geçen
kalemlerdir ve dokuzunun da hikâyesi vardır.

Kapı: `src/components/inventory.test.ts` — **çağıranı yoksa hikâyesi
olacak**, ve liste dokuz kalemden büyürse test düşer. Yeni bir bileşeni
çağıranı olmadan eklemek isteyen önce hikâyesini yazar.

### 2.7 · ~~Storybook boşlukları~~ ✅ KAPANDI

**UI-ADR-142.** Yedisinin de story'si var ve hepsi `play` taşıyor.
Ayrıca envanterdeki (UI-ADR-140) yedi bileşene de davranış testi yazıldı —
gavadolar kapıdaki açığı buldu: "hikâyesi var" yetmez, yalnız render eden
story hiçbir şey kanıtlamaz. Kapıya ikinci kol eklendi.

### 2.4 · ~~Kalan erişilebilirlik~~ ✅ KAPANDI

**UI-ADR-141.** Beşi de düzeltildi ve her biri `play` testiyle kilitlendi:
ızgara `<table>`'a taşındı + `<caption>` adı · `iconOnly` → `aria-label`
DERLEMEDE zorunlu (enjekte ihlalle denendi) · modal `aria-labelledby` +
`aria-describedby` · filter Escape kökte + odak geri veriliyor · search
tam ARIA combobox (120 ms zamanlayıcı kalktı).

---

## 3. TUZAKLAR — bunları tekrar keşfetme

1. ~~**Tam test paketinden önce dev sunucusunu KAPAT.**~~ **♻️ KÖK NEDEN
   BULUNDU — UI-ADR-141'de düzeltildi.** Dev sunucusuyla ilgisi yoktu.
   Sebep: 45 story dosyasının soğuk Vite dönüşümü varsayılan 30 sn'lik
   `browser.connectTimeout`u aşıyordu. ⚠️ Ayar **KÖK** `test.browser`a
   yazılmalı — proje içine yazılırsa Vitest onu SESSİZCE YOK SAYAR
   (`project.vitest.config.browser.connectTimeout ?? 6e4`); UI-ADR-141
   önce oraya yazdı ve düzeltme hiç etkili olmadı, UI-ADR-142'de
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
npx vitest run --project=unit        # 15 dosya / 215 test
npx vitest run --project=storybook   # 50 dosya / 187 test  (TEK komut)
#                            TOPLAM: 65 dosya / 402 test
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
