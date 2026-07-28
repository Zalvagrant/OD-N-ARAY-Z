# 03 — Information Architecture

**Durum:** ✅ DONDURULDU
**Kaynak:** dosya_1 (§2 IA), dosya_2 (Global Layout), dosya_5 (DS-06), dosya_6 (Spatial System), dosya_7 (App Shell)

---

## 1. Global İskelet (App Shell)

Her ekran istisnasız aynı iskeleti kullanır. Bu iskelet sayfa değişiminde
yeniden oluşturulmaz.

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOP HEADER — Executive Command Bar                                  │
├────────────┬────────────────────────────────────┬────────────────────┤
│            │                                    │                    │
│  LEFT      │      WORKSPACE                     │  RIGHT CONTEXT     │
│  SIDEBAR   │      (Dynamic Context Area)        │  PANEL             │
│            │                                    │                    │
│  Mission   │      Tek Primary Focus Area        │  Intelligence Feed │
│  Navigation│      + Supporting Panels           │  / Seçili nesne    │
│            │                                    │                    │
├────────────┴────────────────────────────────────┴────────────────────┤
│  EXECUTIVE TIMELINE                                                  │
├──────────────────────────────────────────────────────────────────────┤
│  STATUS BAR — Live Neural Telemetry Footer                           │
└──────────────────────────────────────────────────────────────────────┘
```

React ağacı karşılığı:

```jsx
<AppShell>
  <TopHeader />
  <LeftSidebar />
  <Workspace />          {/* tek scroll bölgesi burasıdır */}
  <RightContextPanel />
  <ExecutiveTimeline />
  <StatusBar />
</AppShell>
```

**Çıkış kriterleri (M1 için):**
- Tek layout kullanılıyor.
- Sayfa değişiminde App Shell yeniden mount edilmiyor.
- Scroll yalnızca Workspace içinde; header ve sidebar sabit.

---

## 2. Workspace = Screen

**En önemli kavramsal karar:** ODIN'de "sayfa" yoktur.

| Klasik admin panel | ODIN |
|---|---|
| Amazon Screen | Amazon **Workspace** |
| Finance Screen | Finance **Workspace** |
| Settings Screen | Configuration **Workspace** |

Kullanıcı bir sayfa açmaz; bir **çalışma bağlamına girer.** Bu isim
değişikliği kozmetik değildir — navigasyonun, geçiş animasyonunun ve
state yönetiminin nasıl kurulacağını belirler (bkz. `04-navigation-system.md` §5).

---

## 3. Workspace Standard İskeleti

Her workspace aynı dikey sırayı kullanır:

```
Global Header          (App Shell'den gelir, değişmez)
        ↓
Workspace Header       (bağlam: isim, marketplace, sync, arama)
        ↓
Executive Brief        (AI özeti — bu workspace için "ne oluyor?")
        ↓
Primary Workspace      (TEK ana odak alanı)
        ↓
Supporting Panels      (2–4 adet, daha fazlası değil)
        ↓
Context Sidebar        (sağ panel, seçili nesnenin detayı)
```

Bu yapı bütün modüllerde aynıdır. Modül değişince yalnızca **içerik** değişir.

---

## 4. Workspace Header Standardı

Her workspace başlığı aynı beş bilgiyi taşır:

```
Workspace Name  →  Current Context  →  Quick Actions  →  Search  →  Last Sync
```

Örnek:

```
Amazon  ·  US Marketplace  ·  [Sync]  ·  [Search SKU]  ·  Updated 2 min ago
```

`Last Sync` alanı isteğe bağlı değildir — `02-design-principles.md` §8 Trust
Signals kuralının somut karşılığıdır.

---

## 5. Primary Workspace Rule

**Her workspace'te yalnızca BİR Primary Focus Area vardır.**

| Workspace | Primary Focus |
|---|---|
| Executive | Executive Brief |
| Mission Control | Mission Board |
| Amazon | Executive Brief + KPI Strip |
| Finance | Cash Overview |
| Knowledge | Knowledge Explorer |
| Projects | Project Board |
| Automation | Automation Queue |
| System | System Health |

Böylece ekranın amacı ilk bakışta anlaşılır. İki eşit ağırlıklı ana alan olan
bir ekran, tasarım hatasıdır.

---

## 6. Supporting Panels

Standart destek panelleri havuzu:

- KPI Cluster
- Timeline
- Alerts
- Notes
- AI Insight

Her workspace bu havuzdan **2–4 tanesini** kullanır. Hiçbir ekran hepsini aynı
anda taşımaz.

---

## 7. Context Sidebar (Sağ Panel)

Bu alanın **işlevi sabittir, içeriği değişkendir.**

İçerebilecekleri:
- İlgili kararlar
- Görevler
- Belgeler
- Son aktiviteler
- İlgili KPI'lar
- AI analizi
- Önerilen aksiyonlar

**Durum makinesi (tüm modüllerde aynı):**

```
Closed → Preview → Expanded → Pinned
```

**Kural:** Tüm Director modülleri **aynı** panel bileşenini kullanır. Modüle
özel context panel yazılmaz; yalnızca içerik sağlayıcısı değişir.

---

## 8. Altı Workspace Tipi

Bütün ekranlar altı tipe indirgenmiştir. Yeni bir ekran bu altıdan birine
uymak zorundadır; uymuyorsa ya tip yanlış seçilmiştir ya da ekran ODIN'e ait
değildir.

| Tip | Amaç | Örnek | Yoğunluk |
|---|---|---|---|
| **Executive Workspace** | Yönetim özeti | Executive Briefing, ODIN HQ | Standard |
| **Operational Workspace** | Günlük operasyon | Amazon, Finance, Mission Control | Standard |
| **Analytical Workspace** | Detay analiz | Analytics, Forecast, Reports | Compact |
| **Knowledge Workspace** | Doküman ve hafıza | Knowledge, Memory | Relaxed |
| **Configuration Workspace** | Ayarlar | Settings, Users, Integrations | Relaxed |
| **Monitoring Workspace** | Canlı izleme | System Director, Trading, Logs | Compact |

---

## 9. Spatial System — Grid Matematiği

### 9.1 Temel birim

**8 px** tek temel ölçüdür. Mikro hizalamalarda **4 px** alt birim kullanılır.

Gerekçe: web standartlarıyla, Tailwind ölçekleriyle ve Figma Auto Layout ile
doğal uyum.

### 9.2 Boşluk hiyerarşisi

```
Macro Space → Section Space → Component Space → Content Space
```

Bu dört seviye farklı bilgi katmanlarının birbirine karışmasını engeller.

### 9.3 Master Grid

- **12 kolon**
- Sabit dış güvenlik alanı (safe margin)
- Esnek kolon genişliği
- Tutarlı gutter

Kartlar bu grid'i ihlal edemez. Geliştirici sabit piksel yerleşimi yazmaz;
grid token'larını kullanır.

### 9.4 Responsive Grid

| Cihaz | Kolon |
|---|---|
| Büyük Monitör | 12 |
| Laptop | 12 |
| Tablet (gelecek) | 8 |
| Mobil Companion (gelecek) | 4 |

**Birincil hedef çözünürlükler:** 1920, 2560, 3440 (ultrawide), 3840
**Geri düşüş:** 1600, 1440, 1366

İçerik gereksiz yere gerilmez; okunabilir satır uzunluğu korunur; hiyerarşi
tüm desteklenen çözünürlüklerde bozulmaz.

### 9.5 Widget Grid Engine

Widget'lar serbest boyutlandırılmaz. Yalnızca tanımlı boyutlar üretilir:

| Boyut | Kullanım |
|---|---|
| XS | Tek metrik |
| S | KPI kartı |
| M | Grafik / Liste |
| L | Karma analiz |
| XL | Ana çalışma alanı |

### 9.6 Safe Area

Her ekranın dört güvenli bölgesi vardır (üst, alt, sol, sağ). Hiçbir içerik bu
sınırları ihlal etmez.

---

## 10. Okuma Ritmi

### Dikey ritim (her modülde aynı)

```
Header → Executive Summary → Primary Widgets → Secondary Analysis → Supporting Information
```

### Yatay ritim (sol → sağ)

```
Durum → Öncelik → Analiz → Aksiyon
```

Bu sıralama CEO'nun ilk bakışta doğru bilgiyi görmesini sağlar. Aksiyon her
zaman sağdadır; kullanıcı okuyarak aksiyona ulaşır.

### Scan Path

```
1. Executive Summary
2. KPI Grid
3. Main Workspace
4. Supporting Widgets
```

---

## 11. Hizalama Kuralları

ODIN'de yalnızca üç hizalama kullanılır:

- **Sol hizalı** metin
- **Sağ hizalı** sayılar
- **Merkez hizalı** durum göstergeleri (yalnızca gerektiğinde)

Rastgele ortalama kullanılmaz. Sayıların sağa hizalanması, tablo ve KPI
karşılaştırmasında okunabilirlik için zorunludur.

---

## 12. Density Modes

Üç yoğunluk seviyesi vardır ve seçim **ekranın amacına göre** yapılır,
kullanıcı isteğine göre değil.

| Mod | Kullanıldığı yer |
|---|---|
| **Compact** | Log, Monitoring, Trading |
| **Standard** | Mission, Amazon, Finance |
| **Relaxed** | Knowledge, Learning, Projects |

Not: Tablo içi düzenleme için form bileşenleri ayrıca üç yoğunlukta çalışır
(Comfortable / Compact / Dense) — bkz. `10-component-library.md` §Form Language.

---

## 13. Workspace Lifecycle

Her workspace aynı yaşam döngüsünü izler:

```
Loading → Ready → Working → Updating → Completed
```

Bu davranış bütün ekranlarda aynıdır ve `10-component-library.md`'deki
State Matrix ile uyumludur.

---

## 14. Cross-Workspace Consistency

Workspace değişse bile şunlar **asla** değişmez:

- Header
- Navigation
- Grid
- Motion
- Kısayollar
- Context Panel davranışı

Yalnızca içerik değişir. Bu, öğrenme maliyetini bir kez ödemek anlamına gelir.

---

## 15. Executive Universe Katmanı

Multi-organization yapısı bilgi mimarisinin en üst katmanıdır:

```
ODIN HQ  (tüm evrenlerin özeti, Overall Executive Score)
    │
    ├── Lillu Universe       → workspace seti A
    ├── Personal Universe    → workspace seti B
    ├── Trading Universe     → workspace seti C
    └── Holding Universe     → gelecek
```

Universe değişimi bir **bağlam değişimidir**, bir sayfa geçişi değildir.
Universe değiştiğinde workspace listesi, veri kaynakları ve Director seti
değişir; iskelet değişmez.

✅ **DONDURULDU (UI-ADR-073) — ikisi birden:**

| Yer | İşlev |
|---|---|
| **Header sol üst** | Hızlı geçiş switcher'ı. Aktif evrenin adı + dropdown |
| **ODIN HQ** | Ayrı bir Executive Workspace. Tüm evrenlerin sağlık skoru + Overall Executive Score. Menüde Mission Control'ün üstünde |

Header'daki switcher günlük kullanım içindir; HQ, evrenler arası genel bakış
ve karşılaştırma içindir.

⚠️ **Backend ön koşulu:** Bu katman `universe_id` olmadan çalışmaz. Mevcut
ODIN veri modelinde bu boyut yoksa **M1'den önce eklenmelidir** — sonradan
retrofit etmek yaklaşık 10 kat pahalıdır. Bkz. `13-backend-recommendations.md` §2.

---

## 16. Executive Timeline ve Status Bar

### Executive Timeline (workspace altında, yatay şerit)

Son yönetici olayları:
- Decision Approved
- AI Learned
- Risk Increased
- Evidence Added
- Knowledge Updated
- Automation Completed

### Status Bar (en alt, Live Neural Telemetry)

Sistem nabzı katmanı — burada `Zero Dead Space` kuralı geçerlidir:

- Neural Data Stream
- Background Jobs
- API Trafiği
- Event Queue
- Workflow Engine
- Scheduler
- Memory Indexing
- Knowledge Sync
- AI Queue
- Voice Queue
- Agent Bus
- Event Bus
- Telemetry

✅ **KARAR (UI-ADR-071) — 13 kanal yerine 6 gerçek kanalla başlanır.**

Yukarıdaki liste bir hedeftir, bir gereksinim değil. v1.0'da gösterilecek
kanallar:

| Kanal | Kaynak | Durum |
|---|---|---|
| Son senkronizasyon | Mevcut sync servisi | ✅ Var |
| API trafiği | Gateway sayaçları | ✅ Var |
| Arka plan işleri | Job runner | ✅ Var |
| Hata sayısı | Log servisi | ✅ Var |
| AI kuyruğu | AI Gateway | 🔜 Gateway ile gelir |
| AI maliyet / token | AI Gateway | 🔜 Gateway ile gelir |

Kalan kanallar (Neural Data Stream, Event Bus, Agent Bus, Voice Queue,
Workflow Engine, Memory Indexing, Knowledge Sync) karşılıkları oluştukça
eklenir. **Karşılığı olmayan kanal çizilmez.**
