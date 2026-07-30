# 16 — S1–S5 Denetimi (meclis + uçtan uca ölçüm)

**Tarih:** 30 Temmuz 2026 · **İsteyen:** sahip ("yapmak isteyip de
yapılmayan oldu mu, sistem tam çalışıyor mu?")
**Yöntem:** Playwright ile uçtan uca ölçüm (dev + production) + yazılımcılar
ve sistemciler denetimi. Her madde ölçülmüştür; tahmin yoktur.

---

## 1. Çalıştığı ÖLÇÜLEN şeyler

| Doğrulama | Sonuç |
|---|---|
| Kök yol → `/briefing` yönlendirmesi | ✅ |
| `Ctrl+K` komut paleti | ✅ |
| Sidebar daraltma tercihi kalıcı (reload sonrası) | ✅ |
| Context panel 4 durum; **pinned navigasyonda hayatta** | ✅ |
| App Shell sayfa değişiminde **remount olmuyor** (DOM işareti hayatta kaldı) | ✅ |
| KPI kartı klavyeyle açılıyor (focus + Enter) | ✅ |
| `reduced-motion`'da bilgi kaybolmuyor (6 hazırlık satırı + hero) | ✅ |
| Bilinmeyen rota → 404 | ✅ |
| Konsol hatası | 0 |
| Testler | 25 birim + 124 story (40/40 dosya), ESLint 0, tsc 0, prod build ✅ |

## 2. Yapılmak istenip YAPILMAYAN — üç gerçek eksik

Üçü de spec'te yazılı, üçü de Playwright ile doğrulandı, üçü de
**S5.5'in kapsamına alındı**:

| # | Eksik | Spec | Ölçüm | Öncelik |
|---|---|---|---|---|
| 1 | **Belge seviyesinde dikey scroll taşması** — `html` scrollHeight 6316 px (viewport 900); `window.scrollTo` gerçekten kaydırıyor. Fare tekerleği en yakın konteyneri kaydırdığı için gözle kaçmış; Space/Home/End header'ı ekrandan çıkarabilir | 03-...md §1 "scroll YALNIZCA workspace'te" | dev + prod aynı | **P0** |
| 2 | **Geri dönüşte workspace scroll'u korunmuyor** (1500 → 0). Kod tabanında scroll restoration'a dair tek satır yok — hiç yazılmamış | 04-...md §12 S2 çıkış kriteri | ✅ doğrulandı | P1 |
| 3 | **Geri dönüşte kart açıklığı korunmuyor** (açık KPI → kapalı döner). Açıklık bileşen-yerel `useState`'te; `key={pathname}` unmount'unda kayboluyor | aynı madde ("seçim durumu") | ✅ doğrulandı | P1 |

**Yazılımcıların düzeltme kararları (S5.5'te uygulanacak):**
- P0 için: `html, body { height:100%; overflow:hidden }` + kabukta
  `fixed inset-0` (belge yüksekliğine katkı sıfırlanır) + flex zincirinde
  eksik `min-h-0` denetimi.
- P1'ler için: workspace-kimlikli **bellek-içi** Zustand store
  (`byWorkspace[id] = {scrollTop, expandedIds}`) + `useLayoutEffect`
  restore kancası. **Persist edilmez** — navigasyon-oturumu durumudur;
  eski scroll'u diske yazmak yarın anlamsızdır. `Disclosure` controlled olur.

## 3. Yazılımcıların bulduğu, benim sormadığım üç kod riski

| Risk | Hüküm | S5.5 aksiyonu |
|---|---|---|
| `useMockData`: `getSnapshot` içinde `cache.current` doldurma | **Kesin hata** — render sırasında yan etki; React 19 concurrent modda tearing/tekrar hesap riski | Snapshot dışarıda üretilir, `getSnapshot` yalnızca okur |
| Mock üreticilerde `Date.now()` | Gerçek risk — SSR/story kararsızlığı | Clock parametresi (test sabit saat verir) |
| `useNow` null→değer geçişi | Sorun DEĞİL (SSR ve ilk istemci render'ı aynı: null) — yalnız layout shift'e dikkat | Değişiklik yok |

## 4. Sistemcilerin bulduğu yapısal boşluklar (kimse sormamıştı)

1. **Yaşam döngüsü:** iki sunucu (Next :3000 + ODIN cockpit) nasıl birlikte
   başlar? Tek komut yok. → S7.
2. **Cockpit erişilemezken UI davranışı:** tanımsız. Kural: açıkça
   `Unavailable/NoData`; asla mock'a düşülmez. → S5.5'te karar, S7'de kod.
3. **Yazma hatası UX'i:** verdict POST'u başarısız olursa "kaydedilmedi"
   açıkça gösterilmeli. → S7.
4. **State yenileme modeli:** `/api/state` manuel mi, polling mi, event mi?
   → S7 kararı.
5. **Gözlemlenebilirlik:** "konsol hatası sıfır" telemetri değildir;
   istek/yanıt hata kimliği gerekir. → S7.

## 5. Meclis kararları (sahip yetki devriyle onayladı)

| Konu | Karar | Kayıt |
|---|---|---|
| Onay gerekçesi | ODIN'in mevcut A/B/C kuralı (ADR-0131): B/C'de ≥8 karakter zorunlu — UI yeni kural icat etmez | 13-...md §15 |
| Ret + Ertele | Karar kartına eklenir; `deferred` gelecek tarih ister | 13-...md §15 |
| 4 ürün kavramı | UI icat etmez → **FR-0046** (ODIN R-006); S6 bu karara kapılı | ODIN R-006 |
| Amazon → cockpit | **FR-0044 zaten açıktı** (ADR-0135) — ODIN tarafı işi | ODIN R-006 |
| Verdict taşıma yolu | `POST /api/command` beyaz listesi; yeni endpoint YOK; eksik `ceo` verb'ü → **ER-0025** | ODIN R-006 |
| Drift koruması | FR-0039 fixture kanalı + sürümlü şema + UI CI kapısı | ODIN R-006 |
| S6 kapısı | **Governance kararı (FR-0046) olmadan S6'nın KPI/domain kısmı başlamaz**; kavramdan bağımsız kabuk serbest | sistemciler 3/3 |
