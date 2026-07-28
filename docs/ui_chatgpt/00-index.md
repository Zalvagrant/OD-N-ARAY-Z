# 00 — Index & Sözlük

---

## 1. Gerçek Durum Tablosu

Kaynak sohbette ilerleme birden fazla kez "✅ tamamlandı" olarak raporlandı.
Sohbetin sonunda bu iddia **kendisi tarafından düzeltildi** (dosya_7):

> "Önceki sprintlerde 'tamamlandı' dediğimiz kısımlar tasarım ve fonksiyonel
> tanımların tamamlanmasıydı. Bunlar çalışan kod değildi."

Bu düzeltme bu klasörün temel ölçüsüdür. Aşağıdaki tablo iki sütun kullanır:
**Tanım** (spesifikasyon var mı) ve **Kod** (çalışan yazılım var mı).

| Katman | Tanım | Kod | Not |
|---|---|---|---|
| Product Vision | ✅ | — | Doküman katmanı |
| Design Principles | ✅ | — | Doküman katmanı |
| Information Architecture | ✅ | ⬜ | |
| Navigation System | ✅ | ⬜ | Hibrit menü donduruldu (UI-ADR-070) |
| Açık kararlar | ✅ | — | **13/13 kapandı** (UI-ADR-069…083) |
| Design Tokens | ✅ | ⬜ | Token isimleri var, değerler kısmen |
| Motion System | ✅ | ⬜ | Token isimleri + önerilen değerler |
| Component Library | 🟡 | ⬜ | ~30 bileşen ismi var, anatomi yok |
| Executive Components | 🟡 | ⬜ | KPI/Decision/Director kart anatomisi tanımlı |
| Pattern Library | ✅ | ⬜ | 6 davranış pattern'i |
| Workspace Templates | ✅ | ⬜ | 6 workspace tipi |
| Mission Control | 🟡 | ⬜ | Yapı var, high-fidelity yok |
| Amazon Director | ✅ | ⬜ | En detaylı tanımlı modül |
| System Director | ✅ | ⬜ | Detaylı tanımlı |
| Finance / Knowledge / Projects / Automation | ⬜ | ⬜ | Tanımlama sırası belli (UI-ADR-079) |
| Data Contracts | ⬜ | ⬜ | Kaynakta hiç yok — bu klasörde teklif edildi |
| Prototype | ⬜ | ⬜ | |
| Developer Handoff | ⬜ | ⬜ | |

**Özet:** Elde güçlü bir tasarım *felsefesi* ve *iskeleti* var. Elde **hiç çalışan
arayüz kodu yok.** Bir sonraki gerçek adım kod, doküman değil.

---

## 2. Numaralandırma sistemlerinin birleştirilmesi

Kaynak sohbette aynı işi tarif eden 5 ayrı numaralandırma vardı. Bunlar
karışıklık üretiyordu. Tek sisteme indirgendi:

| Kaynaktaki eski isim | Bu klasördeki karşılığı |
|---|---|
| Phase 2 / Phase 3 / Phase 6 | Doküman katmanı (bu klasör) |
| DS-01 … DS-08 | `10-component-library.md` + `02-design-principles.md` |
| UI-01 … UI-03 | `11-design-tokens.md` + `06-workspaces.md` |
| P1 … P8 | Tasarım katmanı — tamamlandı |
| P9 | Workspace Architecture → `03` + `06` |
| P10 / M1 … M6 | **Tek geçerli üretim planı** → `15-execution-plan.md` (S0–S13) |
| P11 / P12 | AI + Release → `15-execution-plan.md` FAZ E / FAZ H |
| EPIC 01 / Sprint 1 | M1 ile aynı şey — birleştirildi |

**Kural:** Bundan sonra yalnızca **S0–S13** (`15-execution-plan.md`)
kullanılacak. M1–M6 dahil diğer tüm numaralar tarihi kayıttır, iş takibinde
kullanılmaz.

---

## 3. ODIN Signature Language (Ürün Sözlüğü)

Bu terimler markadır. Arayüzde, kodda, dokümanda ve konuşmada aynı şekilde
kullanılır. Eş anlamlı kullanım yasaktır — "dashboard" kelimesi ODIN'de yoktur.

| Terim | Anlamı | Kullanılmayacak eş anlamlı |
|---|---|---|
| **Executive Briefing** | Günün karar özeti | Dashboard, Ana sayfa |
| **Mission Control** | Ana çalışma alanı, canlı operasyon | Homepage |
| **Workspace** | Bir çalışma bağlamı | Sayfa, Screen, Page |
| **War Room** | Kritik olay yönetimi | Incident page |
| **Decision Center** | Karar hazırlama ve onay | Approvals |
| **Knowledge Constellation** | Bilgi grafiği görünümü | Graph view |
| **Evidence Chain** | Bir önerinin tüm kanıt zinciri | Sources |
| **Director** | Alan uzmanı AI ajanı | Bot, Agent, Modül |
| **Director Consensus** | Ajanların ortak görüşü | Vote result |
| **Executive Council** | Director'ların tartışma ortamı | Meeting |
| **AI Pulse** | Yapay zekâ durum telemetrisi | Status, Health |
| **Strategic Horizon** | Kısa/orta/uzun vadeli öngörü | Forecast page |
| **Executive Replay** | Geçmiş kararların yeniden incelenmesi | History |
| **Executive Universe** | Organizasyon/hesap evreni | Tenant, Workspace switcher |
| **Context Panel** | Sağ taraftaki bağlam paneli | Detail drawer, Inspector |

⚠️ **DOĞRULANMADI:** Bu terimlerin mevcut ODIN kodundaki değişken/route
isimleriyle çakışıp çakışmadığı kontrol edilmedi. M1'in ilk işi bu eşlemeyi
çıkarmaktır.

---

## 4. ODIN Çalışma Modeli (tek şema)

Sohbette birçok akış şeması vardı. Hepsi aslında aynı döngüyü tarif ediyor.
Tek şemaya indirgendi:

```
Data → Information → Knowledge → Insight → Decision
                                              ↓
Memory ← Learning ← Measurement ← Execution ←─┘
   ↓
Better Decision  (döngü baştan başlar)
```

Bu döngü ODIN'in **resmi çalışma modelidir.** Her ekran bu döngünün bir
noktasına hizmet etmelidir. Hiçbir ekrana bu döngüde yeri olmayan bir bileşen
eklenmez — `02-design-principles.md` §Zero Dead Space kuralı buradan gelir.

---

## 5. Dosya haritası

```
docs/ui_chatgpt/
├── _BURADAN_BASLA.md              ⭐ SEN buradan başla (3 adım)
├── kod/                           Hazır kod dosyaları (S1 token katmanı)
├── README.md                      Bu klasörün kullanım kılavuzu
├── 00-index.md                    ← buradasın
├── 01-product-vision.md           ODIN nedir, ne değildir
├── 02-design-principles.md        Tasarım anayasası + yasaklar
├── 03-information-architecture.md Ekran iskeleti, grid, workspace tipleri
├── 04-navigation-system.md        Menü, context, command palette
├── 05-dashboard.md                Executive Briefing + Mission Control
├── 06-workspaces.md               8 Director workspace spesifikasyonu
├── 07-ai-directors.md             AI orkestrasyon, council, hafıza
├── 08-decision-log.md             ADR kayıtları (kararlar + gerekçeler)
├── 09-data-contracts.md           Backend'den beklenen veri sözleşmeleri
├── 10-component-library.md        Bileşen standardı ve envanteri
├── 11-design-tokens.md            Token mimarisi ve palet
├── 12-motion-system.md            Hareket dili
├── 13-backend-recommendations.md  Backend'e öneriler (AI Gateway vb.)
├── 14-open-items.md               ✅ 13 kararın kaydı (hepsi kapandı)
├── 15-execution-plan.md           Sprint sprint bitirme planı
├── PROMPTLAR.md                   ⭐ 13 sprintin hazır promptu
└── handover.md                    Roller, devir, backlog
```
