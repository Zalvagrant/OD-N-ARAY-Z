# Handover — Yürütme Planı

**Bu dosyanın amacı:** Bugünden ODIN v1.0'a kadar kimin ne yapacağını, hangi
sırayla yapacağını ve "bitti" kelimesinin ne anlama geldiğini tanımlamak.

---

## 1. Temel gerçek

Kaynak sohbetin kendi özeleştirisi, bu planın çıkış noktasıdır:

> "Önceki sprintlerde 'tamamlandı' dediğimiz kısımlar tasarım ve fonksiyonel
> tanımların tamamlanmasıydı. Bunlar çalışan kod değildi."

> "Şimdiye kadar en büyük hata, 'bir sonraki işi bitirelim' diyerek ilerlemek
> oldu. Bu yöntem büyük projelerde işi bitirmez; sadece kapsamı büyütür."

**Sonuç:** Elde çok güçlü bir tasarım felsefesi var. Elde **sıfır satır
çalışan arayüz kodu** var. Bundan sonraki tek geçerli ilerleme ölçütü:

| ❌ Ölçmeyeceğimiz | ✅ Ölçeceğimiz |
|---|---|
| Doküman sayısı | Yazılan kod |
| Tasarım sayısı | Geçen testler |
| Plan sayısı | Çalışan ekranlar |
| Faz sayısı | Tamamlanan entegrasyonlar |

---

## 2. Rol Dağılımı

```
                         SEN (CEO)
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  Chief Architect      Design Studio        Engineering
    (ChatGPT)         (Claude Design)      (Claude Code)
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    Architecture Review
                            │
                            ▼
                     GitHub Repository
```

**Kural:** Kod hiçbir zaman doğrudan ana dala gitmez. Önce mimari ve kalite
açısından gözden geçirilir.

### ChatGPT — Chief Architect / CTO

Artık **yeni mimari üretmez.** Görevi:
- Mevcut mimariyi korumak
- Kod incelemek
- Kalite kapısı olmak
- Yeni özellik gerektiğinde tasarlamak

### Claude Design — Design Studio

Tek görevi: **tüm ekranları üretmek.** Yalnızca bu klasördeki standartlara
göre. Yeni bileşen icat etmez.

### Claude Code — Engineering

Tek görevi: **kod.** Sırası değişmez (§5). Yalnızca bu klasöre göre yazar.

### Sen — CEO

En önemli görev. Her sprint sonunda tek bir soru:

> **"Bu sprint gerçekten bitti mi?"**

Kontrol listesi:
- Çalışıyor mu?
- Responsive mi?
- Hata var mı?
- Mimariye uygun mu?
- Merge edilmeye hazır mı?

**"Evet" olmadan sonraki sprinte geçilmez.** Bu tek kural, projenin bitip
bitmemesini belirleyecek.

---

## 3. Master Execution Plan

| Faz | Sorumlu | Amaç | Çıktı | Durum |
|---|---|---|---|---|
| 0 | ChatGPT | Master mimariyi dondur | Tek referans mimari | 🟢 Tamam |
| 1 | ChatGPT + bu klasör | Dokümanları SSOT haline getir | `/docs` eksiksiz | 🟢 **Bu klasörle tamamlandı** |
| **1.5** | **Sen** | **`14-open-items.md`'ye cevap ver** | 13 karardan 12'si | 🟢 **Tamam (28 Tem)** |
| 2 | Claude Code | Repo analizi + eksik dosya raporu | Audit raporu | 🔴 **ŞİMDİ** |
| 3 | Claude Design | Design System → gerçek UI | Ekran tasarımları | 🟡 |
| 4 | Sen | Tasarımları onayla | Revizyon listesi | 🟡 |
| 5 | Claude Code | Design → React dönüşümü | Çalışan frontend | 🟡 |
| 6 | Claude Code | Backend + API entegrasyonları | Çalışan servisler | 🟡 |
| 7 | ChatGPT | Mimari ve kod incelemesi | Review raporu | 🟡 |
| 8 | Claude Code | Test ve hata düzeltmeleri | Stabil sürüm | 🟡 |
| 9 | ChatGPT | Production Readiness Review | Yayın onayı | 🟡 |
| 10 | Sen | Canary / Beta kullanımı | Gerçek kullanım | 🟡 |
| 11 | Claude Code | Son düzeltmeler | Release Candidate | 🟡 |
| 12 | Sen | v1.0 Production | 🚀 Yayın | ⬜ |

**Önemli değişiklik:** Orijinal planda Faz 2 "Claude Design tasarım üretir"
idi. Bu klasördeki analiz sonrası **Faz 2 ile 3'ün yeri değişti.** Önce repo
analizi yapılmalı — çünkü tasarım üretmeden önce mevcut kodun ne olduğunu
bilmek gerekiyor. Aksi halde tasarım repo ile çakışır.

---

## 4. Frontend Milestone'ları (M1–M6)

**Bunlar tek geçerli iş takibi birimleridir.** Eski P/DS/UI/EPIC numaraları
tarihi kayıttır.

### M1 — Foundation UI
**Hedef:** Çalışan uygulama iskeleti.

- App Shell
- Routing
- Theme Engine + **Design Token katmanı** ⭐ ilk iş
- Sidebar
- Header
- Context Panel
- Status Bar
- Navigation Store

**Çıktı:** Uygulama açılıyor. Sayfalar arası geçiş yapılabiliyor. Tema
değişiyor.

**Çıkış kriterleri:** `04-navigation-system.md` §12'deki 9 maddelik liste.

### M2 — Design System Implementation
Tüm bileşenler gerçek kod olur: Button, Card, Table, Chart, MetricCard,
DecisionQueue, AIBrief, Modal, Drawer, Timeline...

**İlk iki iş:** Typography System, sonra Table (`14-open-items.md` #13).

**Çıktı:** Tüm ekranlar ortak bileşenleri kullanıyor.

### M3 — Workspace Screens
Gerçek ekranlar, **mock veri** ile:
Mission Control · Amazon · Finance · Knowledge · Executive · Projects
· Automation · System

**Ön koşul:** `14-open-items.md` #12 çözülmüş olmalı — tanımsız workspace'ler
tanımlanmadan bu adım yapılamaz.

### M4 — State & Data Layer
Global Store · API Client · Cache · Error Handling · Loading States
· Real-time güncellemeler

### M5 — API Integration
Amazon SP-API · Amazon Ads API · Finance · Knowledge · Authentication.
**Mock veri kaldırılır.**

**Ön koşul:** `09-data-contracts.md` mevcut API ile eşlenmiş olmalı.

### M6 — Production Hardening
Performans · Responsive · Accessibility (WCAG) · Testler · Güvenlik
· Release Candidate

---

## 5. Claude Code — değişmez sıra

```
Repository analizi
      ↓
App Shell
      ↓
Component Library
      ↓
Mission Control
      ↓
Amazon        ← referans modül, dil burada doğrulanır
      ↓
Finance
      ↓
Knowledge
      ↓
Executive
      ↓
Projects
      ↓
Automation
      ↓
System
      ↓
API
      ↓
AI
      ↓
Testing
      ↓
Release
```

**Amazon neden önce:** ODIN'in en olgun ve en fazla veri kaynağına sahip
modülü. Burada doğrulanan tasarım dili diğerlerine doğrudan aktarılabilir.

---

## 6. Claude Design — üretim sırası

```
Mission Control → Amazon → Finance → Knowledge
→ Executive → Projects → Automation → System → Settings
```

Her ekran için (`14-open-items.md` #6 kararına göre revize edilecek):

✅ **UI-ADR-075 (revize) — iki aşamalı:**

**v1.0:**

| Sıra | Varyant | Kalite hedefi |
|---|---|---|
| 1 | **Desktop / Dark** | Tam — referans, dondurulur |
| 2 | Tablet | Çalışır durumda (8 kolon grid) |
| 3 | Mobile | Çalışır durumda (companion mod) |

Her ekran için zorunlu: **Loading / Empty / Error state** ve **Developer Spec.**

**v1.1 (backlog):** Light tema · Tablet/Mobile cilalama · varyant başına
ayrı state tasarımları.

⚠️ Desktop/Dark asla kesilmez — değişirse diğerleri yeniden yapılır.

---

## 7. Her modül için yaşam döngüsü

Bu sıranın dışına çıkılmaz:

```
Architecture → UI Spec → Design → Frontend → Backend
→ Integration → Testing → QA → Merge
```

### Epic kalite kapısı

Bir modül (ör. Amazon Director) tamamlandı sayılabilmesi için:

- [ ] Mimari onaylı
- [ ] UI onaylı
- [ ] Kod tamamlandı
- [ ] Test geçti
- [ ] Responsive tamam
- [ ] Accessibility tamam
- [ ] Dokümantasyon güncel
- [ ] Merge edildi

---

## 8. Her görevin formatı

UI-ADR-063'ün pratik karşılığı. Her görev bu dört alanı taşır:

```
Girdi:    Ne kullanılacak?
Çıktı:    Ne teslim edilecek?
Kontrol:  Nasıl doğrulanacak?
Done:     Hangi şartlarda tamamlandı sayılacak?
```

Bu dört alanı doldurulamayan bir görev, görev değildir — bir dilektir.

---

## 9. Definition of Done — v1.0

Proje şu şartlar sağlanmadan bitmiş sayılmaz:

### Mimari
- [ ] Tüm ADR'ler güncel
- [ ] Dokümantasyon tamam
- [ ] `14-open-items.md` boş (hepsi karara bağlanmış)

### Tasarım
- [ ] Tüm ekranlar tasarlanmış
- [ ] Developer Spec hazır

### Kod
- [ ] Tüm modüller çalışıyor
- [ ] API'ler bağlı
- [ ] Testler geçiyor

### Kalite
- [ ] TypeScript hatası: **0**
- [ ] ESLint hatası: **0**
- [ ] Build başarılı
- [ ] Responsive doğrulandı
- [ ] Accessibility doğrulandı
- [ ] Token compliance: hardcoded değer yok

### Üretim
- [ ] Canary test edildi
- [ ] v1.0 etiketi oluşturuldu
- [ ] Production yayını tamamlandı

---

## 10. ŞİMDİ YAPILACAK ÜÇ ŞEY

Sırayla. Biri bitmeden diğerine geçme.

### ✅ 1️⃣ Açık maddeleri karara bağla — TAMAMLANDI (28 Tem)

12 madde kapandı, UI-ADR-069…UI-ADR-081 olarak kayda geçti.
Kalan tek madde: **#9 Adaptive UI** (öneri: v1.0'da kapalı).

### 2️⃣ Claude Code'a repo analizi yaptır ← **ŞİMDİ BURADASIN** (= S0)

**İki parça:** S0-A arayüz reposunda, S0-B ODIN reposunda.
Promptlar `_BURADAN_BASLA.md` §2A ve §2B'de hazır.

Bu klasörü repoya koy, sonra şunu iste:

> Bu repodaki mevcut ODIN kodunu analiz et. `docs/ui_chatgpt/09-data-contracts.md`
> dosyasındaki veri sözleşmelerini mevcut API'lerle karşılaştır. Şunları raporla:
> (1) Hangi sözleşmenin karşılığı var, (2) hangisi kısmen var, (3) hangisi hiç
> yok, (4) `universe_id` / multi-tenancy var mı, (5) Ads API bağlı mı,
> (6) fee ve COGS verisi var mı — net kâr hesaplanabiliyor mu,
> (7) confidence skoru gerçekten üretiliyor mu yoksa sabit mi,
> (8) Director heartbeat servisi var mı, (9) Decision kayıtları kalıcı
> saklanıyor mu, (10) mevcut route ve bileşen isimleri `00-index.md` §3'teki
> sözlükle çakışıyor mu, (11) `14-open-items.md` sonundaki telemetri
> kanallarından hangileri gerçekten mevcut.
> Hiçbir kod değiştirme, sadece rapor üret.

**Süre:** Bir oturum.
**Çıktı:** `docs/ui_chatgpt/audit-report.md`

### 3️⃣ S1 — Token katmanı

Detaylı görev listesi: **`15-execution-plan.md` → S1** (14 madde).

İlk kod işi tasarım değil, **token katmanıdır**
(`11-design-tokens.md` §17). Bu yapılmadan yazılan her bileşen sonradan
yeniden yazılır.

- Primitive token'ları CSS değişkeni olarak tanımla
- Semantic katmanı bağla
- Tailwind config'i üret
- Theme provider (Executive Dark)
- Lint kuralı: hardcoded renk/spacing yasak

**Bu bitince** App Shell'e geç.

---

## 11. Bir uyarı

Bu klasör 17 dosya ve binlerce satır. Kaynak sohbet ise binlerce satır daha.

**Bu iyi bir şey değil, sadece gerekli bir şey.**

Projenin şu ana kadarki en büyük riski, doküman üretmenin ilerleme gibi
hissettirmesidir. Bu klasör o riski bitirmek için var — ilerleme sınırını
çizmek için. Bundan sonra üretilen her yeni doküman, bir soruya cevap
vermiyorsa ilerleme değil, erteleme demektir.

Bir sonraki teslimat bir doküman olmamalı. **Açılan bir ekran olmalı.**

---

## 12. Backlog — v1.0 sonrası

Bunlar kapsam dışı bırakıldı. Silinmediler, ertelendiler.

| Madde | Hedef | ADR / kaynak |
|---|---|---|
| **Voice Workspace** | v1.1 | UI-ADR-080 — STT/TTS altyapısı gerekiyor |
| **Adaptive UI** (Executive Memory kişiselleştirmesi) | v1.1 | UI-ADR-082 — v1.0'da kapalı, ama kullanım olayları kaydediliyor |
| **Strategy Workspace** (OKR, What-If, War Room) | v2 | UI-ADR-079 |
| **ODIN Project Intelligence** (kendi kendini denetleyen modül) | v2 | `13-backend-recommendations.md` §11 |
| **Ek Director'lar** (Security, Legal, Marketing) | v2 | UI-ADR-074 |
| **CRM Workspace** | v2 | Kaynakta "ileride" olarak geçiyor |
| **Light tema** (tüm ekranlar) | v1.1 | UI-ADR-075 revize |
| **Tablet + Mobile cilalama** | v1.1 | UI-ADR-075 revize |
| Ek temalar (Presentation, Wallboard, High Contrast) | v1.1+ | `11-design-tokens.md` §7 |
| Telemetri kanallarının kalanı | Karşılık oluştukça | UI-ADR-071 |
| Visual Regression Pipeline (Storybook + Chromatic) | v1.1 | `10-component-library.md` §16 |
| Figma → kod token otomasyonu | v1.1 | `10-component-library.md` §16 |

**Kural:** Bu listeye bir şey eklemek serbesttir. Buradan v1.0 kapsamına bir
şey **almak** yeni bir ADR gerektirir. Bu, UI-ADR-063'teki kapsam büyütme
eleştirisinin somut önlemidir.
