# 04 — Navigation System

**Durum:** ✅ DONDURULDU — Hibrit model seçildi (§3). Karar: UI-ADR-070.
**Kaynak:** dosya_3 (SORU-002 / KARAR-002), dosya_5 (Audit-3), dosya_7 (P9.1.1 App Shell)

Bu, dokümantasyondaki **en kritik açık konudur.** Navigasyon yanlış
kurulursa geri dönüş maliyeti en yüksek olan katmandır; her ekranı etkiler.

---

## 1. Çelişkinin tanımı

Kaynak sohbette navigasyon **iki kez, birbirine uymayan şekilde** kararlaştırıldı.

### Karar A — dosya_3 (erken, gerekçeli, 4 model karşılaştırmalı)

**Workspace Navigation** modeli seçildi (⭐⭐⭐⭐⭐). Yedi kategori, alt menüler:

```
🏠 Executive        Executive Briefing · Mission Control · Decision Center
🧠 Intelligence     AI Core · Knowledge · Memory · Executive Council · Director Hub
💼 Business         Amazon · Finance · Trading · CRM (ileride)
📈 Strategy         Strategy · Innovation · Forecast · Market Intelligence
⚙️ Operations       Operations · Automation · Workflow · Scheduler
📊 Analytics        Reports · Dashboards · Audit · Insights
🔒 System           Integrations · Settings · Users · Developer
```

Aynı karar içinde **Director Navigation** modeli açıkça **reddedildi**
(⭐⭐⭐☆☆), gerekçesi:

> "Kullanıcı 'Amazon raporunu nereden açacağım?' diye düşünmeye başlar.
> İnsanlar Director yerine iş alanı düşünür."

### Karar B — dosya_7 (geç, "menü sırası artık donduruluyor")

Düz, dokuz maddelik, **Director tabanlı** liste:

```
Mission Control
Executive
Amazon
Finance
Knowledge
Projects
Automation
System
Settings
```

### Sorun

Karar B, Karar A'da gerekçeli olarak reddedilmiş olan **Director Navigation
modelidir.** Ne reddedilme gerekçesi çürütülmüş, ne de model değişimi
kayıt altına alınmıştır. Sessiz bir geri dönüştür.

---

## 2. İki kararın karşılaştırması

| Kriter | A: Workspace Nav | B: Düz Director listesi |
|---|---|---|
| İlk öğrenme kolaylığı | Orta | **Yüksek** |
| 9 modülde çalışır mı | Evet | **Evet** |
| 30 modülde çalışır mı | **Evet** | Hayır — liste taşar |
| Multi-Universe destekler mi | **Evet** (kategori yeniden kullanılır) | Zor |
| Trading modülü nereye girer | Business altına | **Yeri yok** |
| CRM / Supply Chain / Legal eklenince | Business altına | Liste 12–15'e çıkar |
| Mevcut kod ile uyum | ⚠️ bilinmiyor | ⚠️ bilinmiyor |

**Kritik gözlem:** Karar B'de **Trading yoktur.** Oysa Trading, dondurulmuş bir
Universe'dür (`01-product-vision.md` §13) ve KARAR-010'da bir uzman AI'ı
vardır. Bu, B'nin eksik bir liste olduğunun kanıtıdır — düşünülerek değil,
o anki 8 Director'a bakılarak yazılmıştır.

---

## 3. ✅ KARAR — Hibrit model (A'nın yapısı, B'nin sadeliği)

İki kararı da tatmin eden tek yapı: **düz görünen, kategorili duran menü.**

```
─────────────────────────────
  Mission Control              ← sabit, kategorisiz, her zaman en üstte
─────────────────────────────
  EXECUTIVE
    Executive Briefing
    Decision Center
─────────────────────────────
  BUSINESS
    Amazon
    Finance
    Trading
─────────────────────────────
  INTELLIGENCE
    Knowledge
    Memory
    AI Core
─────────────────────────────
  OPERATIONS
    Projects
    Automation
─────────────────────────────
  SYSTEM
    System
    Settings
─────────────────────────────
```

Kategori başlıkları **tıklanamaz etiketlerdir**, açılır menü değildir. Böylece:

- Kullanıcı için düz liste gibi davranır (B'nin avantajı korunur).
- Yeni modül eklendiğinde nereye gireceği bellidir (A'nın avantajı korunur).
- Trading yerine kavuşur.
- 30 modüle kadar liste okunabilir kalır.

✅ **DONDURULDU** — UI-ADR-070. Bu menü yapısı routing'in tek kaynağıdır.

---

## 4. Adaptive Sidebar davranışı

Menü akıllıdır: yalnızca **aktif modülün** alt menüsü genişler.

Kullanıcı Amazon workspace'indeyken:

```
BUSINESS
  ▼ Amazon
      Dashboard
      Orders
      Inventory
      PPC
      Listings
      Profit
      Forecast
      Suppliers
      Returns
    Finance
    Trading
```

Diğer modüllerin alt menüleri kapalıdır. Aynı anda 100 alt menü görünmez.

**Kurallar:**
- Aynı anda en fazla **bir** modül genişletilmiş olur.
- Modül değişince önceki otomatik kapanır.
- Kullanıcı manuel olarak da açıp kapatabilir; manuel açılan bir modül,
  başka bir modüle geçilene kadar açık kalır.

---

## 5. Navigation = Bağlam değişimi

**En önemli davranış kuralı:**

> Navigation, ekran değiştirmek için değil, **bağlam değiştirmek** için
> kullanılır.

Bağlam zinciri örneği:

```
Amazon → Campaign → SKU → Decision → Mission
```

Kullanıcı bu zincirde ilerlerken nerede olduğunu kaybetmez. Zincir, workspace
header'ında görünür ve her halkası tıklanabilir.

**Somut sonucu (kod tarafı):**
- Geçiş animasyonu "sayfa kaydı" değil, "bağlam açılışı" hissi verir.
- Bir alt bağlama girmek üst bağlamın state'ini yok etmez.
- Geri dönüş, bir önceki bağlamı **aynı scroll ve seçim durumunda** açar.

---

## 6. Sidebar davranış detayları

| Özellik | Karar |
|---|---|
| Varsayılan durum | Açık (genişletilmiş) |
| Daraltma | Destekleniyor — ikon moduna geçer |
| Daraltılmış modda | Yalnızca ikon; hover'da tooltip ile isim |
| Aktif öğe | Belirgin şekilde vurgulanır |
| Durum kalıcılığı | Kullanıcı tercihi hatırlanır |

### Director durum göstergesi

Her menü öğesinin yanında küçük bir AI durum noktası bulunur:

```
Amazon        ● Monitoring
Finance       ● Reviewing
Knowledge     ● Processing
System        ● Idle
```

Bu nokta **gerçek** Director durumunu gösterir. Karşılığı olmayan bir durum
gösterilmez (Fake Dashboard yasağı). Veri sözleşmesi: `09-data-contracts.md`
§Director Heartbeat.

---

## 7. Alt menü mü, üst sekme mi?

Kaynakta açık bırakılmış bir sorudur. Öneri:

| Durum | Çözüm |
|---|---|
| Modül dışındayken | Alt menüler sidebar'da (adaptive, §4) |
| Modül içindeyken | **Ayrıca** workspace header'ında sekmeler |

Yani ikisi de var ve senkron çalışır: sidebar "nerede olduğunu", header sekmesi
"modül içinde nerede olduğunu" gösterir. Bu, Executive Universe eklendiğinde de
bozulmayan tek yapıdır.

✅ **DONDURULDU** — UI-ADR-072. Sidebar "sistemde neredeyim", header sekmesi "modülde neredeyim" sorusunu cevaplar.

---

## 8. Top Header (Executive Command Bar)

### Sol

- ODIN Logo
- Current Mission
- Executive Mode göstergesi
- **Universe seçici** (hızlı geçiş — UI-ADR-073)

### Orta

- **Neural Search** — global semantik arama
- AI durum göstergeleri: Reasoning · Learning · Memory · Knowledge · Planning · Reflection
- Voice Status

### Sağ

✅ **Görünür (4 ikon — UI-ADR-076):**

- Alerts
- Tasks
- AI Status (birleşik AI Pulse göstergesi)
- Profile

**"More" menüsünde:** Notifications · Messages · System Health

❌ **Kaldırıldı:** `Weather` ve `Time` — hiçbir karar üretmiyorlar, işletim
sisteminde zaten varlar.

**Kural:** Header her zaman canlıdır ve tüm ekranlarda ortaktır. Sağ bölümde
4'ten fazla görünür ikon olamaz — `02-design-principles.md` §4 Cognitive Load
Budget gereği.

**Orta bölüm sadeleştirmesi:** 7 ayrı AI durum göstergesi yerine tek bir
birleşik **AI Pulse** göstergesi. Detay hover veya tıklama ile açılır.

---

## 9. Command Palette

**Karar (dondurulmuş):** Command Palette hiçbir workspace'e özel değildir.
**Globaldir.** Her workspace aynı komut sistemini kullanır.

| Özellik | Karar |
|---|---|
| Kısayol | `Ctrl + K` / `Cmd + K` |
| Kapsam | Global — her ekrandan erişilir |
| İçerik | Navigasyon + eylem + arama + AI komutu |
| Bağlam duyarlılığı | Aktif workspace'in komutları listenin başında |

**Önemli mimari not:** Search bir Input değildir, ayrı bir primitive'dir
(bkz. `10-component-library.md` §Form Language / Search Ayrımı). Bu ayrım
tam olarak Command Palette'in temiz kurulabilmesi için yapılmıştır.

---

## 10. Klavye Kısayolları

ODIN **Keyboard First** bir sistemdir. Fare ikinci plandadır.

| Kısayol | İşlev |
|---|---|
| `Ctrl/Cmd + K` | Command Palette |
| `Tab` / `Shift+Tab` | İleri / geri gezinme |
| `Esc` | Panel kapat / geri çık |
| `Enter` | Onayla / aç |
| `Ok tuşları` | Liste ve tablo içi gezinme |

⬜ **TANIMSIZ:** Workspace kısayolları (ör. `G` sonra `A` → Amazon),
Context Panel açma/kapama, Decision onaylama kısayolları henüz tanımlanmadı.
M1 kapsamında belirlenmelidir.

---

## 11. Right Context Panel — durumlar

```
Closed → Preview → Expanded → Pinned
```

| Durum | Davranış |
|---|---|
| **Closed** | Panel yok, workspace tam genişlik |
| **Preview** | Dar şerit, seçili nesnenin özeti |
| **Expanded** | Geniş, tam detay + AI analizi + aksiyonlar |
| **Pinned** | Sabitlenmiş; workspace değişse bile açık kalır |

**Kural:** Tüm Director modülleri **aynı** panel bileşenini kullanır.

---

## 12. Kod tarafı çıkış kriterleri (M1)

Bu bölüm tamamlandı sayılmadan M2'ye geçilmez:

- [ ] Tek `AppShell` bileşeni var, sayfa değişiminde remount olmuyor
- [ ] Sidebar açık/daraltılmış modda çalışıyor, tercih kalıcı
- [ ] Aktif menü öğesi doğru vurgulanıyor
- [ ] Adaptive alt menü davranışı çalışıyor (aynı anda tek modül açık)
- [ ] Command Palette `Ctrl+K` ile global açılıyor
- [ ] Context Panel dört durumu da destekliyor
- [ ] Bağlam zinciri (breadcrumb) header'da görünüyor ve tıklanabiliyor
- [ ] Geri dönüşte önceki bağlamın scroll ve seçim durumu korunuyor
- [ ] Navigation Store tek kaynak; hiçbir bileşen kendi route state'ini tutmuyor
