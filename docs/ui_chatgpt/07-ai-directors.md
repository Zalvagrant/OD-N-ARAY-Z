# 07 — AI Orchestration & Director Ecosystem

**Durum:** ✅ DONDURULDU (mimari + Director listesi — UI-ADR-074)
**Kaynak:** dosya_1 (§6, §8, V. AI Body Language), dosya_2 (Screen 06–08), dosya_3 (KARAR-010, 015, 022, 039), dosya_7 (AI Gateway)

---

## 1. Temel Mimari — ODIN bir AI Orkestrasıdır

**En önemli AI kararı:**

> ODIN tek bir AI değildir. ODIN bir AI orkestrasıdır.
> Ama kullanıcı yalnızca **ODIN** ile konuşur.

Uzman AI'lar tek başına çalışan chatbot'lar değildir. Görünmeyen bir uzman
ekiptir. Kullanıcı hiçbir zaman "Amazon AI ile konuşuyorum" hissine kapılmaz.

```
                        CEO
                         │
                  Executive AI
              (Master Orchestrator)
    ──────────────────────────────────────
      Amazon AI · Finance AI · Trading AI
      Knowledge AI · Reasoning AI
      (ileride: Security, Legal, Marketing)
    ──────────────────────────────────────
      Memory Core · Knowledge Core
      Decision Engine · Reflection Engine
      Reliability Engine
    ──────────────────────────────────────
              Executive Response
```

### Örnek akış

Kullanıcı sorar: *"Bu ay reklam bütçesini artırmalı mıyım?"*

ODIN paralel çalıştırır:

| Uzman | Katkısı |
|---|---|
| Amazon AI | PPC, ACOS, TACOS, kampanya performansı |
| Finance AI | Nakit akışı ve ödeme planı |
| Trading AI | Döviz ve altın etkisi (ithalat maliyeti) |
| Knowledge AI | Geçmişte benzer kararlar ve sonuçları |
| Reasoning AI | Tüm verileri sentezleyip risk analizi |

Sonra Executive AI hepsini **tek rapora** dönüştürür.

---

## 2. Director listesi — ✅ DONDURULDU (UI-ADR-074)

Kaynak sohbette Director seti **üç farklı şekilde** tanımlandı:

| Kaynak | Liste |
|---|---|
| dosya_2 (Screen 01) | Amazon, Finance, Knowledge, Security, Innovation, Operations, Memory, Legal, CEO Agent — **9** |
| dosya_3 (KARAR-010) | Executive AI + Amazon, Finance, Trading, Knowledge, Reasoning — **5+1** |
| dosya_7 (P5 freeze) | Mission Control, Amazon, Finance, Knowledge, Executive, Projects, Automation, System — **8** |

Üç liste birbirini tutmuyor. Ayrıca iki farklı kavram karışmış durumda:

- **AI Director** = bir uzman zekâ (Reasoning AI gibi — ekranı olmayabilir)
- **Workspace** = bir çalışma alanı (Automation gibi — AI'ı olmayabilir)

Bu ikisi aynı listede toplanınca "Mission Control Director" gibi anlamsız
kalemler ortaya çıkmış.

### Önerilen ayrım

**AI Directors** (zekâ katmanı — her birinin bir uzmanlığı ve bir sesi var):

| Director | Uzmanlık | Durum |
|---|---|---|
| Executive AI | Orkestratör, sentez | ✅ |
| Amazon AI | Satış, PPC, stok, listeleme | ✅ |
| Finance AI | Nakit, kâr, tahmin, muhasebe | ✅ |
| Trading AI | Döviz, altın, prop hesaplar, risk | ✅ |
| Knowledge AI | Bilgi, kanıt, geçmiş kararlar | ✅ |
| Reasoning AI | Sentez, çelişki tespiti, risk | ✅ |
| Security AI | Güvenlik, erişim, audit | 🟡 ileride |
| Legal AI | Hukuk, uyum | 🟡 ileride |

**Workspaces** (arayüz katmanı — bir AI Director'a bağlı olabilir veya olmayabilir):

Mission Control · Executive Briefing · Decision Center · Amazon · Finance
· Trading · Knowledge · Memory · Projects · Automation · System · Settings

### Dondurulan kurallar

- **"Mission Control Director" yoktur.** Mission Control bir workspace'tir,
  bir Director değil.
- **Projects ve Automation'ın kendi AI'ı yoktur.** Executive AI yönetir.
- **Executive Director ayrı bir ekran değildir** — Executive Briefing ile
  aynı şeydir, biri silinmiştir (UI-ADR-078).
- Bir Director eklemek için `08-decision-log.md`'ye yeni ADR gerekir.

---

## 3. Executive Coordination Engine

Bu katman uzman AI'ların cevaplarını sadece birleştirmez. Ayrıca:

- Çelişkileri tespit eder
- Eksik veri varsa ilgili AI'dan **tekrar ister**
- Güven skorlarını karşılaştırır
- Kararın finansal, operasyonel ve stratejik etkilerini tek tabloda toplar
- CEO'ya tek ve net öneri sunar

Yani AI'lar birbirleriyle de konuşur. Bu, tek modelle cevap vermekten
belirgin şekilde güçlü bir yapıdır.

---

## 4. Executive Council = Explainable AI Council

**Karar:** Normal kullanımda CEO sade bir kart görür:

```
AI Recommendation
Increase Amazon PPC Budget

Confidence          96%
Financial Impact    +₺82.000

[ Approve ]  [ Reject ]  [ Discuss ]
```

Ama CEO isterse **"Open Executive Council"** der ve arka plandaki tüm AI
toplantısı açılır:

```
Amazon Director      PPC artırılmalı.              Confidence 94%
Finance Director     Nakit akışı uygun. Risk düşük.
Trading Director     USD yukarı gidiyor. 72 saat içinde maliyet artabilir.
Knowledge Director   Geçmişte benzer 14 karar. 13 başarılı.
Risk Director        Operasyonel risk yok.
─────────────────────────────────────────────────────────
Executive AI         Consensus: Increase PPC by 7%.
```

**Tasarım ilkesi:** Çoğu AI sistemi sana cevabı gösterir. ODIN sana **düşünce
sürecini** gösterir — ama sadece istediğinde. Bu "sadece istediğinde" kısmı
kritiktir; sürekli açık olsaydı bilgi bombardımanı olurdu.

---

## 5. Council Debate

AI'lar sadece fikir vermez, gerçekten **tartışır:**

```
Amazon Director      PPC artır.
Finance Director     Katılmıyorum. Nakit akışı önümüzdeki hafta sıkışacak.
Amazon Director      Ama satış kaybı daha büyük.
Knowledge Director   Geçmişte Finance haklı çıktı.
Trading Director     USD yükseliyor.
─────────────────────────────────────────────────────────
Executive AI         Tartışmayı değerlendirdim.
                     Yeni önerim: %5 artır. 7 gün sonra tekrar değerlendir.
```

Bu, ODIN'in en ayırt edici özelliklerinden biridir. Tek bir modelin
"emin" cevabı yerine, çatışan uzmanlıkların sentezini üretir.

---

## 6. Consensus, Disagreement ve Minority Opinion

Bir kararın yanında yalnızca Confidence olmaz. Şunlar da olur:

| Gösterge | Örnek |
|---|---|
| Consensus | 91% |
| Disagreement | 9% |
| Evidence Quality | 97% |
| Financial Risk | Low |
| Execution Complexity | Medium |

CEO artık sadece "doğru mu?" değil, **"AI'lar bu konuda ne kadar hemfikir?"**
sorusunu da görür.

### Minority Opinion

5 AI aynı fikirde, 1 AI karşı ise ODIN bunu **gizlemez:**

```
⚠ Minority Opinion
Trading Director — USD riski nedeniyle 48 saat beklenmesini öneriyor.
```

Gerekçe: bazen azınlık görüşü doğru çıkar. Özellikle büyük stratejik
kararlarda bu görünürlük çok değerlidir.

**Tasarım kuralı:** Minority Opinion asla katlanıp gizlenmez, her zaman
karar kartında görünür — ama görsel olarak bastırılmış (turuncu değil,
nötr ton) şekilde.

---

## 7. Standart AI Çıktı Formatı

Bu format ODIN'in **tüm modüllerinde ortaktır.** Her AI önerisi bu yapıyı
kullanır:

```
📊 Sayısal Veriler        Ham metrikler
🔍 Neden Analizi          Bu neden oldu?
📈 Etki Analizi           Ne anlama geliyor?
🔄 En Az 2 Alternatif     Başka ne yapılabilir?
💰 Beklenen Finansal Sonuç (₺ / %)
🎯 AI Güven Skoru
📚 Kullanılan Kanıtlar
```

**"En az 2 alternatif" kuralı zorunludur.** Tek seçenek sunan bir AI önerisi
karar desteği değil, dayatmadır.

---

## 8. AI Explainability Contract

Her AI önerisi arayüzde şunları **göstermek zorundadır:**

| Alan | Neden zorunlu |
|---|---|
| Neden üretildi | Kara kutu güven öldürür |
| Destekleyici kanıt | Evidence Before Opinion kuralı |
| Güven skoru | Confidence Everywhere kuralı |
| Sorumlu Director | Hesap verebilirlik |
| İlgili bilgi | Bağlam |
| Son doğrulama zamanı | Trust Signals kuralı |
| Potansiyel riskler | Dengeli sunum |
| Alternatif seçenekler | Karar özgürlüğü |

> Arayüz kullanıcıdan **hiçbir zaman** açıklanmamış bir AI çıktısına
> güvenmesini istemez.

Bu, veri sözleşmesi seviyesinde zorunlu kılınmıştır:
`09-data-contracts.md` §AIRecommendation.

---

## 9. Hafıza Mimarisi — Üç Katman

**Karar (KARAR-022):**

### Short-Term Memory
Bugünkü konuşmalar · açık görevler · devam eden analizler

### Working Memory
Son haftalar · aktif projeler · bekleyen kararlar · güncel stratejiler

### Long-Term Executive Memory ⭐
Burada sadece veri saklanmaz. Şunlar saklanır:

- Başarılı kararlar
- Başarısız kararlar
- Nedenleri
- Öğrenilen dersler
- Şirket politikaları
- Amazon stratejileri
- Trading stratejileri
- Finans alışkanlıkları
- SOP'ler
- AI'ın zaman içinde geliştirdiği kurallar

**En kritik kural:** Bu hafıza **otomatik büyümez.**

AI her bilgiyi değerlendirir:
- Geçici bilgi mi?
- Kalıcı bilgi mi?
- Stratejik bilgi mi?
- Arşivlik bilgi mi?

Yalnızca gerçekten değerli olanlar Long-Term Executive Memory'ye taşınır.

Bu karar, yıllar sonra bile ODIN'in hızlı ve güvenilir kalmasını sağlar.
Sınırsız büyüyen bir hafıza, kullanılamayan bir hafızadır.

---

## 10. AI CFO — Finance uzman ekibi

**Karar (KARAR-039):** Finance tarafı tek bir AI değil, bir ekiptir.

| Rol |
|---|
| Cash Flow Analyst |
| Treasury Analyst |
| Debt Analyst |
| Revenue Analyst |
| Cost Analyst |
| Forecast Analyst |
| Investment Analyst |
| Executive CFO |

Ortak sistemler: AI Debate · Financial Memory · Executive Financial Scorecard
· Explainable AI · Confidence Score · Evidence Engine

⚠️ **Not:** Bu model, Amazon tarafında da benzer bir alt-ekip yapısına işaret
ediyor (PPC Analyst, Inventory Analyst vb.). Kaynakta Amazon için böyle bir
liste yok. Bkz. `14-open-items.md` #13.

---

## 11. AI Body Language

İnsanlar karşı tarafın beden dilini okur. AI'ın da olmalı. Bu, `12-motion-system.md`
ile birlikte uygulanır.

| AI durumu | Görsel karşılık |
|---|---|
| Thinking | Core yavaş döner |
| Learning | Knowledge Ring aktifleşir |
| Searching | Graph pulse |
| Reasoning | Particle orbit |
| Memory Recall | Memory Ring parlar |
| Confidence High | Yeşil halo |
| Confidence Low | Amber glow |
| Conflict | Kırmızı halka |
| Voice | Wave |
| Silence | Calm glow |

**Sonuç:** AI konuşmadan da anlaşılır. Kullanıcı sistemin ne yaptığını
metin okumadan bilir.

**Sınır:** Bu sinyallerin hiçbiri sonsuz döngüde değildir ve hiçbiri
dikkat çalmaz (`02-design-principles.md` §11).

---

## 12. Director Card Anatomisi

Her Director küçük bir AI ajanı gibi tasarlanır. Karta bakınca ajanın
**canlı** olduğu hissedilmelidir.

```
Amazon Director
─────────────────────────
STATUS         Analyzing
Current Goal   Optimize ACOS
Confidence     97%
Tasks          24
Evidence       182
Memory         Healthy
Prediction     Running
Heartbeat      █████████
```

**Kural:** Director'lar hiçbir zaman "inactive" görünmez. Boştaysa
"Idle — monitoring" gösterilir, boş kart gösterilmez.

⚠️ Bu, sahte canlılık üretme riski taşır. `09-data-contracts.md`
§DirectorHeartbeat'te tanımlı gerçek veri yoksa kart "veri yok" durumuna
düşer — sahte heartbeat animasyonu yapmaz.

---

## 13. Director Workspace İçeriği

Her Director kendi workspace'ini alır:

Identity · Mission · Capabilities · Restrictions · Current Goal
· Current Tasks · Heartbeat · Knowledge · Memory · Evidence
· Current Recommendations · Decision Participation · Activity Timeline
· Learning History · Prediction Queue · Performance Metrics

**Restrictions alanı önemlidir:** her Director'ın ne yapamayacağı da
görünürdür. Bu, güvenlik ve yönetişim açısından kritiktir.

---

## 14. AI Gateway (Model Router) — Maliyet Mimarisi

Bu, sohbetin en pratik teknik kararıdır ve doğrudan işletme maliyetini
etkiler.

### Temel ayrım

| Katman | Token tüketimi |
|---|---|
| React arayüzü, Next.js, veritabanı | **0** |
| Dashboard açmak, sipariş görüntülemek | **0** |
| Amazon API senkronizasyonu | **0** |
| Grafikler, raporlar | **0** |
| AI'a soru sormak, analiz istemek | **Token harcar** |

ODIN çalışırken sürekli token yemez. Yalnızca AI **düşündüğünde** harcar.

### AI Router mantığı

```
Dashboard çalışıyor
       ↓
Kullanıcı bir AI eylemi tetikliyor
       ↓
AI Router değerlendiriyor:
   • Bu iş gerçekten AI gerektiriyor mu?
   • Gerekiyorsa hangi model en uygun?
   • Yerel model yeterli mi?
   • Büyük modele gerçekten ihtiyaç var mı?
       ↓
Uygun model çalışıyor
       ↓
Cevap üretiliyor → sistem uyku moduna dönüyor
```

### Model kademelendirmesi

| İş tipi | Örnek | Model |
|---|---|---|
| Küçük | Hatırlatma, dosya sınıflandırma, etiketleme | Küçük / yerel model |
| Orta | E-posta yazma, rapor özetleme | Orta model |
| Büyük | Tüm Amazon hesabını analiz et, strateji üret, finans tahmini | Büyük model |

### Hibrit sağlayıcı yapısı

ODIN tek modele bağlı kalmaz:

- **Yerel model** → basit işler
- **OpenAI** → karmaşık analizler
- **Claude** → kod üretimi ve büyük dokümanlar
- Gerektiğinde diğer sağlayıcılar

**Mimari sonuç:** AI, sistemin **merkezi değil**, ihtiyaç duyulduğunda devreye
giren bir servistir. Bu hem maliyeti düşürür hem de tek sağlayıcıya
bağımlılığı ortadan kaldırır.

Detay: `13-backend-recommendations.md` §1.

---

## 15. AI Interaction Pattern

**Karar:** AI ayrı bir ekran değildir. AI şunların içinde doğal olarak yer alır:

- Executive Brief
- Insight
- Decision
- Forecast
- Knowledge

Bu karar, yapay zekânın arayüzün bir **parçası** olmasını sağlar — üzerine
eklenmiş bir sohbet kutusu değil.

✅ **DONDURULDU (UI-ADR-077):** AI her yerde çalışır, ayrı bir yere gidilmez.
Bağımsız "AI Core Workspace" **kaldırılmıştır.** AI telemetrisi System
Director içinde bir sekme olarak yaşar (`06-workspaces.md` §8).

---

## 16. AI Assisted Input

Bazı alanlar AI destekli olacak: görev açıklaması, not, strateji, brief.

Desteklenen eylemler (hepsinde aynı):

`Suggest` · `Rewrite` · `Summarize` · `Expand` · `Translate`

Bu davranış **tüm AI destekli alanlarda aynıdır.** Detay:
`10-component-library.md` §Form Language.
