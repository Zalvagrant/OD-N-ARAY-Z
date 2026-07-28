# 10a — Core Components (S3)

**Durum:** ✅ Üretildi — S3 · Core Components
**Kaynak:** `10-component-library.md` §14 dokümantasyon şablonu
**Kod:** `src/components/ui/*`, `src/lib/chart/scale.ts`

Bu dosya `10-component-library.md`'nin **envanterini değiştirmez**, onu
doldurur. Tüm bileşenler §10'daki listede zaten adı geçenlerdir.

---

## 0. Ortak kurallar (hepsi için geçerli — tekrar yazılmaz)

### 0.1 Durum modeli — UI-ADR-086

§6'daki 11 durum bir **API zorunluluğu değil, durum matrisidir.** Ortak bir
`state` prop'u YOKTUR. Kaynaklar:

| Durum | Kaynak |
|---|---|
| Default · Hover · Pressed · Focus | CSS pseudo-class (`:hover`, `:active`, `:focus-visible`) |
| Disabled | native `disabled` |
| Read Only | native `readOnly` / `aria-readonly` |
| Loading | `loading` prop + `aria-busy="true"` |
| Error | `aria-invalid="true"` + `aria-describedby` |
| Success | `Field status="valid"` / `variant="success"` |
| Offline | `offline` prop (yalnızca eylem bileşenlerinde) |
| Empty | verinin yokluğu — prop değil |

Gerekçe: tek `state` prop'u geçersiz kombinasyon üretir (`loading` + `disabled`),
native semantiği bozar ve hover/focus gibi prop OLMAMASI gereken şeyleri
prop'a çevirir. Anlamsız durumlar (Avatar için ReadOnly, Tooltip için Success)
sahte görsel duruma dönüştürülmez; aşağıda **N/A + gerekçe** olarak işaretlenir.

### 0.2 Her bileşende sağlanan

- Tüm değerler token'dan — hardcode renk/ölçü yok (ESLint zorlar)
- Klavye ile tam kullanım, `:focus-visible` halkası (tokens.css §FOCUS)
- `prefers-reduced-motion` — hareket kalkar, **bilgi kalkmaz**
- Renkten bağımsız durum göstergesi (glyph / ikon / şekil / `sr-only` metin)
- Anti-fake: veri yoksa "veri yok" (`NoData` / `EmptyState`), asla 0 ya da
  placeholder
- Storybook kaydı: `Core/<sıra> · <ad>`

### 0.3 Bağımlılık zinciri (§1)

Bu dosyadaki bileşenlerin tamamı **Primitive** katmandadır; hiçbiri bir
Executive Component'i import etmez. `Field → typography`, `Table →
empty/error/skeleton` gibi bağımlılıklar yalnızca aşağı doğrudur.

---

## 1. Typography

**Lifecycle:** Production · **Katman:** Primitive · **Bağımlılık:** tokens, `NoData`
**Dosya:** `typography.tsx`

**Amaç:** Metin ve sayıların ölçeğini tek yerden vermek; özellikle sayıların
sütunda hizalanmasını garanti etmek.

**Anatomi:** `Heading` · `Text` · `Label` · `Caption` · `Num` · `Mono`

| Prop (Num) | Tip | Varsayılan | Açıklama |
|---|---|---|---|
| `value` | `number \| null \| undefined` | — | null → `NoData` |
| `format` | `plain \| currency \| percent \| compact` | `plain` | |
| `size` | `sm…4xl` | `base` | |
| `tone` | `default \| secondary \| tertiary \| ai \| danger \| warning \| success` | `default` | |

**Sizes:** Heading 1–4 · Text sm/base/md · Num sm…4xl
**States:** yalnızca Default. Diğer 10 → **N/A**: tipografi etkileşimli değildir,
tek istisna `Num`'ın "Empty" hâlidir (`NoData`).
**Responsive:** hero ölçekleri ≤1439px ve ≤767px'te küçülür (`globals.css`).
Taban 14px her genişlikte sabit — tablo metni her çözünürlükte doğru okunur.
**Do:** SKU/ID için `Mono`. **Don't:** sayı için düz `<span>` — hizalama bozulur.

---

## 2. DataTable (VirtualTable)

**Lifecycle:** Production · **Katman:** Primitive
**Bağımlılık:** TanStack Table + Virtual, `EmptyState`, `ErrorState`, `Skeleton`
**Dosya:** `table.tsx`

**Amaç:** On binlerce satırlık operasyonel veriyi akıcı, okunabilir ve klavyeyle
gezilebilir biçimde göstermek.

| Prop | Tip | Varsayılan | Açıklama |
|---|---|---|---|
| `data` / `columns` | `T[]` / `ColumnDef<T>[]` | — | |
| `density` | `comfortable \| compact \| dense` | `compact` | 48 / 40 / 32 px |
| `globalFilter` | `string` | `""` | Search primitive besler |
| `onSelect` | `(row \| null) => void` | — | Context Panel'i besler |
| `meta.numeric` | `boolean` | otomatik | sağa hiza + tabular-nums |

**States:** Default · Hover · Focus (satır imleci) · Loading (skeleton) ·
Empty (`EmptyState`) · Error (`ErrorState`) · Offline (çağıran `error` ile
verir). **N/A:** Success (tablo bir işlem sonucu değil), Pressed (satır basılı
hâli anlam taşımaz), ReadOnly (tablo zaten salt görüntü).
**Interaction:** ↑ ↓ imleç · Enter seç · Esc bırak · Home/End uçlar · başlıkta
Enter/Space sıralar.
**Accessibility:** `role="grid"`, `aria-rowcount`, `aria-sort`, `aria-selected`.
**Doğrulanan:** 10.000 satırda DOM'da 14 satır; `scrollHeight` 320.035 px;
sticky başlık 2000 px kaydırmada yerinde kaldı.

---

## 3. Button

**Lifecycle:** Production · **Katman:** Primitive · **Dosya:** `button.tsx`

**Variants:** Primary · Secondary · Tertiary · Ghost · Danger · Success ·
Warning · Info
**Sizes:** XS (24) · SM (32) · MD (40) · LG (48) · XL (64) px

**States:** Default · Hover · Pressed · Focus · Disabled · Loading (`aria-busy`
+ spinner + `sr-only` metin) · Offline (`WifiOff` + sebep `title`'da).
**N/A:** Empty (içeriksiz buton render edilmez), Error/Success (kalıcı anlam
`variant` ile taşınır; geçici geri bildirim Autosave göstergesinin işi),
ReadOnly (karşılığı `disabled`).
**Do:** `iconOnly` kullanırken `aria-label` ver. **Don't:** yükleniyorken de
tıklanabilir bırakma — `loading` butonu kilitler.

---

## 4. Card

**Lifecycle:** Production · **Katman:** Primitive · **Dosya:** `card.tsx`

**Anatomi:** `Card > CardHeader / CardBody / CardFooter`
**Tones:** default · elevated · **ai** (`odin-ai-region`, UI-ADR-069 mor glow)
**Density:** comfortable · compact · dense

**States:** Default; Hover/Pressed/Focus yalnızca `interactive`.
**N/A:** Loading/Empty/Error — kartın **içeriği** temsil eder; tek bir "kart
hatası" görünümü içerik türünü gizlerdi. ReadOnly — kart zaten salt görüntü.

---

## 5. Input & Field

**Lifecycle:** Production · **Katman:** Primitive · **Dosya:** `field.tsx`, `input.tsx`

**Field Anatomy (§8.2, dondurulmuş):**
Label → Description → Field → Helper Text → Validation → Action

**Yaşam döngüsü (§8.1) = `status` prop'u:**
`idle → validating → valid | invalid | saved`
`focused` ve `typing` prop DEĞİLDİR (biri CSS, diğeri kullanıcı girdisi).

**Input variants:** default · inline (tablo içi). Read Only ve Disabled
**variant değil**, native attribute'tur.
**Density:** comfortable (40) · compact (32) · dense (24) px.
**Aile:** `Input` · `Textarea` · `Select`.

**States:** 11'in tamamı; Empty = boş değer + placeholder.
**Accessibility:** `aria-describedby` zinciri (description + helper + mesaj),
`aria-invalid`, `aria-busy`; doğrulama satırı ikon + metin (renk tek başına
anlam taşımaz).
**Not:** Doğrulama seviyeleri (Local/Business/Remote — §8.3) Field'ın işi
değildir; çağıran katman karar verir, Field yalnızca sonucu gösterir.

---

## 6. Search

**Lifecycle:** Production · **Katman:** Primitive · **Dosya:** `search.tsx`

**Neden ayrı primitive (§8.5):** sonuç sayısı · debounce · geçmiş · kısayol ·
Command Palette entegrasyonu. Bunlar bir Input'un davranışı değildir.

| Prop | Tip | Varsayılan |
|---|---|---|
| `debounceMs` | `number` | 250 |
| `resultCount` | `number \| null` | `null` → **sayı gösterilmez** |
| `historyKey` | `string?` | localStorage'da son 5 sorgu |
| `shortcutHint` | `string?` | yalnızca ipucu |

**States:** Default · Focus · Loading (`searching`) · Empty (boş sorgu) ·
Disabled · Offline (çağıran `disabled` + sebep ile).
**N/A:** Error/Success — "hatalı sorgu" diye bir şey yoktur; sonuç ya vardır ya
yoktur. ReadOnly — salt okunur arama anlamsız.
**Anti-fake:** `resultCount=null` iken sayı çizilmez — "0 sonuç" ile "henüz
aranmadı" farklı şeylerdir.

---

## 7. Filter

**Lifecycle:** Production · **Katman:** Primitive · **Dosya:** `filter.tsx`

**Neden ayrı primitive (§8.6):** Filter **query üretir**, Input **veri girer.**
Değeri kaydedilmez, doğrulanmaz, "geçersiz" olamaz.

**API:** `FilterBar({ filters, query, onChange })`, `FilterQuery = Record<string, string[]>`
**States:** Default · Hover · Focus · Pressed (açılır menü) · Empty (seçenek
listesi boşsa filtre **hiç render edilmez**).
**N/A:** Loading/Error/Success/ReadOnly — filtre veri çağrısı yapmaz.

---

## 8. Selection Family

**Lifecycle:** Production · **Katman:** Primitive · **Dosya:** `selection.tsx`

`Checkbox` (indeterminate destekli) · `RadioGroup` · `Toggle` (`role="switch"`)
· `SegmentedControl` (`role="radiogroup"`, ← → ile gezinir)

**Ortak mantık:** native input/ARIA semantiği + aynı odak halkası + aynı
disabled/readOnly davranışı. Ortak bir "selection state machine" soyutlaması
YAZILMADI (UI-ADR-086) — dördünün de doğal HTML karşılığı var.
**Renkten bağımsızlık:** tik işareti · dolu nokta · kaydırılmış tutamak.
**States:** Default · Hover · Pressed · Focus · Disabled · ReadOnly ·
Empty (seçilmemiş) · Success/Error → sarmalayan `Field`'ın işi.
**N/A:** Loading/Offline — seçim yerel bir işlemdir.

---

## 9. Modal & Drawer

**Lifecycle:** Production · **Katman:** Primitive · **Dosya:** `modal.tsx`

**Cam:** yalnızca overlay katmanında — `odin-glass-modal` + `odin-overlay-scrim`
(UI-ADR-069).
**Davranış:** Esc kapatır · odak panelde hapsolur (Tab döngüsü) · kapanınca
odak açan öğeye döner · arka plan kaydırması kilitlenir.
**Motion:** giriş = Context Change (`motion.normal`), `useReducedMotion` ile
tamamen kapanır. Çıkış animasyonu YOK — kapanışta beklemek gecikme hissi verir.
**Sizes:** Modal sm/md/lg · Drawer sm/md/lg
**States:** Default · Focus. **N/A:** diğer 9 — bunlar modalın **içeriğinin**
durumudur, kabuğun değil.

---

## 10. Badge · Tooltip · Avatar · Icon

**Dosyalar:** `badge.tsx` · `tooltip.tsx` · `avatar.tsx` · `icon.tsx`

**Badge** — 8 standart variant, her birinin **glyph'i** var (● ○ ▲ ✓ i).
Sizes XS/SM/MD. **N/A:** tüm etkileşim durumları — Badge tıklanmaz;
tıklanabilir etiket gerekiyorsa `Button variant="tertiary" size="xs"`.

**Tooltip** — kütüphanesiz; hover + `focus-within`. İçerik `aria-describedby`
ile tetikleyiciye bağlanır (klavye odağında da okunur). **Kural:** tooltip'te
yalnızca yardımcı bilgi bulunur — dokunmatik cihazda hover yoktur.

**Avatar** — görsel yoksa baş harfler, isim de yoksa nötr ikon. **Rastgele
avatar üretilmez.** `status` noktası yalnızca gerçek durum verilince çizilir,
yanında `sr-only` metin.

**Icon** — Lucide sarmalayıcısı; boyut (xs…xl) ve ton tek yerden. `label`
verilmeyen ikon dekoratiftir (`aria-hidden`); anlam taşıyan ikon `label` almak
zorundadır.

---

## 11. Skeleton

**Lifecycle:** Production · **Katman:** Primitive · **Dosya:** `skeleton.tsx`

`Skeleton` · `SkeletonText` · `SkeletonRegion` (`role="status"` + `aria-busy`)

**Kural:** skeleton gri kutu değil, **gerçek yerleşimin** temsilidir; yerine
geçtiği bileşenle aynı yükseklik sınıflarını kullanır.
**Shimmer:** `odin-shimmer`, `transform` ile (layout tetiklemez).
`prefers-reduced-motion` altında durur, sabit gri kalır — bilgi kaybolmaz.
**States:** tanım gereği yalnızca Loading; diğer 10 → N/A.
**Doğrulanan:** yükleme → içerik geçişinde kart yüksekliği 139 px → 139 px,
**shift = 0 px**.

---

## 12. EmptyState · ErrorState · LoadingState

**Dosyalar:** `empty-state.tsx` (S2) · `error-state.tsx` · `loading-state.tsx`

**Empty Pattern:** Açıklama → Öneri → Örnek → Sonraki adım
**Error Pattern:** Ne oldu → Neden oldu → Etkisi → Çözüm → [Retry]
`what`, `why`, `impact`, `fix` alanları **zorunludur**; bilinmeyen alan
uydurulmaz, çağıran "Sebep henüz belirlenemedi" yazar. Teknik detay
`<details>` içinde, varsayılan kapalı.
**LoadingState layouts:** text · card · list · kpi — hepsi gerçek yerleşimi
temsil eder.

---

## 13. Chart (Line · Area · Bar)

**Lifecycle:** Production · **Katman:** Primitive
**Dosya:** `chart.tsx`, saf mantık `src/lib/chart/scale.ts` (+ birim testleri)
**Karar:** UI-ADR-087 — grafik kütüphanesi eklenmedi.

| Prop | Tip | Not |
|---|---|---|
| `data` | `{ label, value: number \| null }[]` | null = ölçülemedi |
| `format` | `NumFormat` | eksen ve okuma satırı |
| `includeZero` | `boolean` | Bar'da varsayılan açık |

**Anti-fake:** veri yoksa `EmptyState`; eksik nokta **interpolasyonla
doldurulmaz**, çizgi kesilir (doğrulandı: `M0 132 L99.5 66 M298.5 88 L398 0`).
**Motion:** yok. Grafik bir durum göstergesidir; çizginin "büyümesi" dekoratif
olurdu (12-...md §1).
**Interaction:** fare ile crosshair; ← → ile klavyeden nokta gezinme, okunan
değer `aria-live` ile duyurulur; Esc bırakır.
**States:** Default · Focus · Loading · Empty · Error · Offline (çağıran
`error` ile). **N/A:** Pressed/Disabled/ReadOnly/Success — grafik bir kontrol
değildir.

---

## 14. Sparkline

**Lifecycle:** Production · **Katman:** Primitive · **Dosya:** `sparkline.tsx`

**Amaç:** KPI kartında (Level 1) tek soruyu cevaplamak: "yön ne?"
Eksen, ızgara, etiket yoktur. Değer okumak isteyen kartı açar.
**Anti-fake:** iki noktadan az veri varsa çizgi çizilmez → `NoData`.
**Renk körü:** yön `aria-label` içinde kelimeyle de verilir
("yükseliyor" / "düşüyor" / "yatay").
**States:** Default · Empty. **N/A:** tüm etkileşim durumları — tıklanmaz,
odak almaz; etkileşim gerekiyorsa `LineChart`.

---

## 15. Timeline

**Lifecycle:** Production · **Katman:** Primitive · **Dosya:** `timeline.tsx`

Executive / Decision / Knowledge timeline'ları **aynı bileşeni** kullanır;
yalnızca besleyen veri değişir.
**Anti-fake:** zaman damgası yoksa "az önce" uydurulmaz → `NoData`.
Sıralama çağıran katmanın sorumluluğudur.
**Renkten bağımsızlık:** her tonun glyph'i var (○ ◆ ✓ ▲ i).
**States:** Default · Loading · Empty; `onSelect` verilirse Hover/Focus/Pressed
(satır butona döner). **N/A:** Error/Success/Offline/ReadOnly.

---

## 16. Tabs

**Lifecycle:** Production · **Katman:** Primitive · **Dosya:** `tabs.tsx`
**Karar bağlamı:** UI-ADR-072 (workspace header sekmeleri)

**Kontrollü bileşendir** — aktif sekme dışarıdan gelir. Gerekçe: sekme çoğu
zaman route'un parçasıdır ve navigation store tek kaynaktır.
**Interaction:** ← → sekme değiştirir, Home/End uçlara gider (WAI-ARIA tabs);
`tabIndex` roving.
**Renkten bağımsızlık:** aktif sekme alt çizgi + kalın metin.
`count` yalnızca gerçekten biliniyorsa gösterilir.
**States:** Default · Hover · Focus · Disabled.
**N/A:** Empty (boş sekme çubuğu render edilmez), Loading/Error/Success/
Offline/ReadOnly — sekmenin **içeriği** kendi durumunu gösterir.

---

## 17. Kalite kapıları (§15) — S3 durumu

- [x] Bağımlılık zinciri ihlal edilmiyor
- [x] Tüm değerler token'dan (ESLint temiz — 0 hata, 0 uyarı)
- [x] 11 durum ele alındı; desteklenmeyenler gerekçeli
- [x] Standart variant/size isimleri
- [x] Klavye ile tam kullanım, görünür focus
- [x] `prefers-reduced-motion` destekleniyor
- [x] Renkten bağımsız durum göstergesi
- [x] Uzun listeler sanallaştırılmış (DataTable)
- [x] Veri sözleşmesi: `NoData` / `EmptyState` ile anti-fake
- [x] Dokümantasyon şablonu dolduruldu (bu dosya)
- [ ] **FPS ölçülmedi** — otomatik tarayıcı sekmesi arka planda çalıştığı için
      `requestAnimationFrame` kısıtlanıyor. Sanallaştırma yapısal olarak
      doğrulandı (10.000 satırda 14 DOM satırı). Gerçek FPS'i sahip
      Storybook'ta kaydırarak doğrulamalı.
