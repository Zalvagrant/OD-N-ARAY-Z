# S13 — Kurumsal Ön Yüz Mimarisi · DEVİR BELGESİ

> **Yeni oturum: ÖNCE BUNU OKU.** Keşfi baştan yapma — aşağıdaki her sayı
> ölçüldü, tahmin edilmedi. 31 Temmuz 2026'da yazıldı.

---

## 0. Nerede çalışıyoruz

| | |
|---|---|
| Worktree | `C:\Users\PackardBell\Desktop\ODIN\ODIN-UI-arch` |
| Dal | `feature/s13-frontend-architecture` |
| Çıkış noktası | `main` = `9e7904a` |
| Durum | **7 commit, hepsi lokal — PUSH EDİLMEDİ, merge EDİLMEDİ** |
| Sahip onayı | ⬜ **Alınmadı.** Beş soru sorulmadı. |

Sahibin isteği (özet): *"ön yüz mimarisini kurumsal seviyeye taşı;
derlenmesi yeterli değil; her turdan sonra kod tabanını yeniden oku,
tekrar/şişkinlik/sınır ihlali ara, daha iyisi varsa öncekini değiştir."*

---

## 1. Ne bitti (7 commit)

| ADR | Konu | Ölçülen sonuç |
|---|---|---|
| — | `classifyError`'da `ZodError` dalı yoktu | Her ham yük sözleşme ihlali "bilinmeyen hata" diye gösteriliyordu → artık `contract` |
| **129** | **İki paralel veri zinciri birleşti** | `screens → mocks` kenarı **8 → 0**; 15 ekran yuvası artık zod+tazelik+hata kanalından geçiyor |
| **130** | Katman sınırları ESLint'e bağlandı | `layout → screens` 0 · `mocks → components` 0; üç kapı da enjekte ihlalle **denendi ve ateşledi** |
| **131** | Ekran iskelesi tek yerde | "sözleşme yok" metninin İKİ şekli bire indi, `emptyProps` adaptörü silindi |
| **132** | `Pressable` primitive'i | İki geçersiz `<button>` iç içeliği + bir sahte affordance |
| **133** | Rota sınırları | `error.tsx` + kök `not-found.tsx`; beyaz sayfa yerine beş adımlı hata |
| **134** | `amazon-director` bölündü | **802 → 496 satır** |

**Test tabanı:** başlangıç 54 dosya/292 test → şimdi **56 dosya/305 test**,
hepsi yeşil. Lint 0, `tsc` 0.

---

## 2. SIRADAKİ İŞ — buradan devam et

Görev listesi araçta (`TaskList`) duruyor. Öncelik sırası:

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

- **20 ayrı** status→(variant|label|glyph|color) haritası.
  `ui/stat.tsx:20` ile `ui/typography.tsx:60` **birebir aynı**, iki farklı
  adla export ediliyor (`StatTone` / `TextTone`); `ui/icon.tsx:22` aynı
  küme + `info`.
- `DataGuard > Card > CardHeader > CardBody > CardFooter > TrustSignal`
  kompozisyonu **9 dosyada** kelimesi kelimesine yazılı.
- `"text-xs text-content-tertiary"` **21 kez**;
  `"text-xs uppercase tracking-wide text-content-tertiary"` 7 kez — oysa
  `ui/typography.tsx:97` `Label` **tam olarak o dizedir** ve hiçbiri onu
  kullanmıyor.
- `kpi()` fabrikası `mocks/amazon.ts:338` ve `mocks/briefing.ts:404`'te aynı.
- `envelope()` `odin-state.ts:49` ve `odin-amazon.ts:82`'de aynı.

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

1. **Tam test paketinden önce dev sunucusunu KAPAT.** Açıkken Storybook
   tarayıcı projesi kaynak bulamıyor ve `Failed to connect to the browser
   session` ile 12/56 dosyada düşüyor. **Kod hatası değil.** Kapatınca
   56/56 geçiyor.
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
| **Push / merge** | ⬜ 7 commit lokal; sahibe sorulmadan push edilmedi |
| `chart.tsx` (357 satır) | Hiç tüketicisi yok. Tasarım sistemi envanteri mi, ölü kod mu? **Sahip kararı.** Aynı durum: `modal`, `tabs`, `tooltip`, `filter`, `icon`, `avatar`, `sparkline`, `telemetry-bar`. |
| Amazon eşikleri | `backend-istekleri.md` §14'e yazıldı. ODIN `health.tone` / `buy_box_at_risk` yayınlayınca `features/amazon/presentation/thresholds.ts` **silinir**. |
| Bileşen testi yok | Repoda `src/lib` ve `src/mocks` dışında birim testi yok; "test edilebilir olsun diye" export edilmiş 7 yardımcı (`sortIntelligence`, `actionableAlerts`, `sortCampaigns`, `sortDecisions`, `dueDeferrals`, `monitoredDecisions`, `rotationSeconds`) **hiç test edilmiyor**. |

---

## 5. Doğrulama komutları

```bash
cd C:/Users/PackardBell/Desktop/ODIN/ODIN-UI-arch

npx tsc --noEmit          # 0 hata olmalı
npm run lint              # 0 hata olmalı
# ÖNCE dev sunucusunu kapat:
npx vitest run            # 56 dosya / 305 test yeşil olmalı

npx next dev -p 3111      # /briefing /amazon /mission-control /goals → 200
                          # /bilinmeyen-ekran → 404
```

Katman kenarlarını ölçmek için `scratchpad/deps.py` kullanıldı; mantığı
basit: `src/**` içindeki `@/` import'larını katmana eşleyip sayıyor.
Beklenen: `screens → mocks` **0**, `layout → screens` **0**,
`mocks → components` **0**.
