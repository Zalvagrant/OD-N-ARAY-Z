# 11 — Design Tokens

**Durum:** ✅ Mimari DONDURULDU / 🟡 sayısal değerler kısmen eksik
**Kaynak:** dosya_6 (UI-01.1 Design Token Foundation), dosya_2 (Token compliance)

Bu, ODIN'in en kritik teknik tasarım katmanıdır. Figma, React, Tailwind ve
Storybook **aynı** token sistemini kullanır.

---

## 1. Dört Katman

```
Primitive Tokens      ham değerler — doğrudan kullanılmaz
        ↓
Semantic Tokens       asıl kullanılan katman
        ↓
Component Tokens      bileşene özel
        ↓
Runtime Theme         tema seçimi
```

**Altın kural:** Hiçbir bileşen doğrudan bir Primitive Token kullanmaz.
`gray-900` yazan bir bileşen hatalıdır; `background.primary` yazmalıdır.

Bu sayede tema değişikliği kod değişikliği gerektirmez.

---

## 2. Primitive Tokens

### Renk aileleri
`Gray` · `Blue` · `Purple` · `Green` · `Cyan` · `Red` · `Cyan`

Her ailenin 50–950 arası tonları olmalıdır.
⬜ **TANIMSIZ:** Ton değerleri kaynakta verilmedi.

### Radius
```
2 · 4 · 8 · 12 · 16 · 20 · 24 · 32
```

### Spacing
```
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128
```

Temel birim **8 px**, mikro hizalama **4 px** (bkz. `03-information-architecture.md` §9).

### Blur
```
xs · sm · md · lg · xl
```

### Shadow
```
xs · sm · md · lg · xl
```

---

## 3. Semantic Tokens

Bileşenlerin kullandığı asıl katman.

### Yüzey ve arka plan
```
background.primary
background.secondary
surface.default
surface.elevated
surface.floating
```

### Metin
```
text.primary
text.secondary
text.tertiary
```

### Kenarlık
```
border.default
border.focus
border.active
```

### İkon
```
icon.default
icon.active
icon.muted
```

### Durum
```
success
warning
danger
info
```

### Aksan
```
accent.ai
accent.amazon
accent.finance
```

---

## 4. Renk Semantiği (dondurulmuş)

Bu eşleme `01-product-vision.md` §5'ten gelir ve **değiştirilemez.**

| Token | Anlam | Kullanım kuralı |
|---|---|---|
| `danger` (kırmızı) | Gerçek kriz | **Yalnızca** gerçek krizlerde |
| `warning` (amber) | Bekleyen risk | |
| `accent.ai` (mor) | AI üretimi | AI'ın dokunduğu her şey |
| `info` (mavi) | Bilgi | |
| `success` (yeşil) | Onay / sağlıklı | |

**En sık ihlal edilen kural:** Kırmızının "önemli" anlamında kullanılması.
Önemli ama kriz olmayan bir şey amberdir. Kırmızı enflasyonu, gerçek krizi
görünmez yapar.

---

## 5. Somut Palet

✅ **DONDURULDU (UI-ADR-069)** — Hibrit görsel dil seçildi: çerçeve sakin,
AI bölgeleri belirgin.

| Rol | Değer |
|---|---|
| `background.primary` | `#070B14` |
| `surface.default` (panel) | `#111827` |
| `border.default` | `#1E293B` |
| Birincil aksan | Mor / magenta |
| İkincil aksan | **Cyan `#00D4FF`** (UI-ADR-084 — turuncu değil) |
| Tipografi | Inter |

### Hibrit uygulama kuralı (UI-ADR-069)

| Bölge | Görsel dil |
|---|---|
| Çerçeve — header, sidebar, status bar | **Sakin.** Koyu, düşük doygunluk, glow yok |
| İçerik — workspace gövdesi | **Sakin.** Palantir/Linear dili |
| AI bölgeleri — AI Brief, Council, öneri kartları, AI Pulse | **Belirgin mor glow** (`accent.ai`) |
| Cam (glass) | **Yalnızca overlay katmanında** — modal, drawer, command palette |

Ekranın geri kalanı sakin kalır; AI görsel olarak ayrışır. Bu, hem
`11-design-tokens.md` §13'ün "AI ayırt edilebilir olmalı" gereğini karşılar
hem de performans bütçesini korur.

### Turuncu çakışması — çözüldü (UI-ADR-084)

**Sorun:** Planlanan ikincil aksan turuncuydu; `warning` de turuncu tonundaydı.
Aynı aileden olurlarsa her turuncu öğe uyarı gibi okunur.

✅ **Karar:** Turuncu tamamen kaldırıldı. İkincil aksan **cyan `#00D4FF`**.

| Rol | Ton | Gerekçe |
|---|---|---|
| İkincil aksan (dekoratif/kategorik) | **Cyan `#00D4FF`** | Mevcut `cockpit.html` ile birebir hizalı |
| `warning` (bekleyen risk) | **Amber `#F59E0B`** | Mevcut `#FFB020` ile yakın |
| `danger` (gerçek kriz) | Kırmızı | |

**Ek fayda:** Bu seçim, ODIN'in mevcut `odin/assets/cockpit.html` paletiyle
uyumu %80'den ~%95'e çıkarır. Eski ve yeni arayüz aynı aileden görünür.

---

## 6. Component Tokens

Her bileşen kendi token setini kullanır.

### Card
```
card.background
card.border
card.shadow
card.radius
card.padding
```

### Button
```
button.primary.background
button.primary.text
button.primary.hover
button.primary.active
```

### Input
```
input.background
input.border
input.focus
input.placeholder
```

### Widget
```
widget.surface
widget.padding
widget.header
widget.content
```

---

## 7. Theme Layer

Bugün yalnızca **Executive Dark** vardır. Ancak yapı şimdiden şunları
destekleyecek şekilde kurulur:

| Tema | Durum | Amaç |
|---|---|---|
| **Executive Dark** | ✅ Birincil | Günlük kullanım |
| Executive Light | 🟡 Yapı hazır | Gündüz / sunum |
| Presentation | 🟡 Yapı hazır | Toplantı ekranı |
| Wallboard | 🟡 Yapı hazır | Duvar ekranı, uzaktan okuma |
| High Contrast | 🟡 Yapı hazır | Erişilebilirlik |

**Kural:** Tema eklemek **kod değişikliği gerektirmez.**

✅ **KARAR (UI-ADR-075):** Light tema v1.0 kapsamındadır.

**Ancak sıralama zorunludur:** Executive Dark **önce** dondurulur, Light ondan
türetilir. Dark referansı değişirse Light yeniden yapılır — bu yüzden ikisi
paralel üretilmez.

Token mimarisi 4 katmanlı olduğu için Light'ı eklemek yalnızca semantic
katmanın yeniden eşlenmesidir; bileşenlere dokunulmaz.

---

## 8. State Tokens

Her bileşen aynı durum sistemini kullanır:

```
Default · Hover · Pressed · Focused · Disabled
· Selected · Loading · Success · Warning · Danger
```

Bu, `10-component-library.md` §6 State Matrix ile eşleşir.

---

## 9. Motion Tokens

Animasyonlar da token'dır:

```
duration.fast
duration.normal
duration.slow

easing.standard
easing.enter
easing.exit

scale.hover
opacity.disabled
```

⬜ **TANIMSIZ:** Sayısal değerler kaynakta verilmedi. Öneri
`12-motion-system.md` §2'de.

---

## 10. Elevation Tokens

```
Level 0 · Level 1 · Level 2 · Level 3 · Level 4 · Overlay · Modal
```

Her seviye şunların kombinasyonundan oluşur:
`Shadow` + `Blur` + `Border` + `Glow`

**Performans kısıtı:** Yüksek elevation seviyeleri büyük blur yarıçapı
gerektirir; bu doğrudan FPS'i etkiler. Bir ekranda aynı anda 3'ten fazla
`Level 3+` yüzey bulunmamalıdır.

---

## 11. Glass Tokens

ODIN'in ayırt edici özelliklerinden biri.

```
glass.light
glass.medium
glass.heavy
glass.overlay
glass.modal
```

Her biri şu değerleri içerir:
`opacity` · `blur` · `border` · `reflection` · `ambient light`

⚠️ **Kritik sınır:** `02-design-principles.md` §10 "Cam karmaşası" yasağı
geçerlidir. Kurallar:

- Üst üste **en fazla 2** cam katman
- `glass.heavy` bir ekranda **en fazla 1** kez
- Cam yüzey arkasında hareketli içerik varsa blur düşürülür (performans)
- Cam, okunabilirliği düşürüyorsa kullanılmaz — okunabilirlik estetiği yener

---

## 12. Data / Chart Tokens

Finance ve Amazon modülleri aynı görsel dili konuşur:

```
chart.line
chart.area
chart.grid
chart.axis
chart.tooltip
chart.positive
chart.negative
chart.neutral
```

**Kural:** `chart.positive` ve `chart.negative`, `success` / `danger` ile
aynı olmak zorunda değildir — grafiklerde daha yumuşak tonlar kullanılır ki
her düşen çizgi kriz gibi görünmesin.

---

## 13. AI Tokens (ODIN'e özel)

```
ai.surface
ai.glow
ai.border
ai.accent
ai.processing
ai.streaming
```

**Amaç:** AI bileşenleri sistemin geri kalanıyla **uyumlu ama ayırt
edilebilir** olur. Kullanıcı bir bilginin AI üretimi mi yoksa ham veri mi
olduğunu bir bakışta anlar.

Bu, güven açısından kritiktir: AI yorumu ile gerçek metrik görsel olarak
karışmamalıdır.

---

## 14. Director Renkleri

Her Director'ın bir aksan rengi olur (`accent.amazon`, `accent.finance` gibi).

⬜ **TANIMSIZ:** Hangi Director'ın hangi rengi alacağı belirlenmedi.
Atanacak 6 Director: Executive · Amazon · Finance · Trading · Knowledge
· Reasoning (UI-ADR-074).

**Kısıt:** Director renkleri, durum renkleriyle çakışamaz —
kırmızı (`danger`), amber (`warning`), yeşil (`success`) ve mor (`accent.ai`)
rezervedir. Turuncu hiç kullanılmaz. Cyan ikincil aksan olduğu için Director rengi olarak da
kullanılabilir, ancak yalnızca bir Director'a verilebilir (Trading).

---

## 15. Token Kapsama Denetimi

Her görsel özellik token üzerinden yönetilir:

- [ ] Color
- [ ] Radius
- [ ] Typography
- [ ] Shadow
- [ ] Elevation
- [ ] Motion
- [ ] Spacing
- [ ] Border

**Kural:** Hardcoded bir değer bulunursa token ile değiştirilir. Bu kural
lint seviyesinde zorlanmalıdır (ör. Tailwind'de arbitrary value kullanımını
kısıtlayan bir ESLint kuralı).

---

## 16. Typography

⬜ **TANIMSIZ:** Kaynakta "Typography System v1.0 üretilecek" denmiş ama
sistem üretilmemiş. Bilinen tek şey: font ailesi **Inter** (⚠️ doğrulanmadı).

Üretilmesi gerekenler:

- Font Family (metin + monospace)
- Type Scale
- Line Heights
- **Number System** — tabular figürler zorunlu (sayılar hizalanmalı)
- Monospace Rules — SKU, ID, kod için
- Responsive Typography

**Kritik not:** Veri yoğun bir arayüzde en önemli tipografi kararı
**tabular-nums**'tır. Sayılar sütunda hizalanmıyorsa hiçbir tablo okunmaz.

✅ **UI-ADR-081:** Typography, M2'nin **ilk** işidir. Bileşen yazmadan önce
tamamlanır.

---

## 17. Uygulama sırası (M1)

Kod tarafında en önce yapılacak iş budur. Token katmanı olmadan yazılan her
bileşen sonradan yeniden yazılır.

1. Primitive token'ları CSS değişkeni olarak tanımla
2. Semantic katmanı primitive'lere bağla
3. Tailwind config'i semantic token'lardan üret
4. Theme provider'ı kur (Executive Dark)
5. Lint kuralını ekle: hardcoded renk/spacing yasak
6. Storybook'ta token showcase sayfası
