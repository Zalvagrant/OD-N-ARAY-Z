# 08 — Decision Log (ADR)

Bu dosya, kaynak sohbette alınan kararların kalıcı kaydıdır. Amaç: ileride
biri "bu neden böyle yapılmış?" diye sorduğunda cevabın dokümanda olması.

**Format:** Her kayıtta karar, gerekçe, reddedilen alternatifler, arayüz ve
backend etkisi, riskler yer alır.

---

## ⚠️ Numaralandırma hakkında önemli not

Kaynak sohbette kararlar `KARAR-001` … `KARAR-045+` şeklinde numaralandırılmış.
Ancak elimizdeki 7 dosyada bu numaraların **yalnızca bir kısmı** görünüyor:

**Görünen:** 001, 002, 010, 015, 021, 022, 030, 039, 044, 045
**Eksik:** 003–009, 011–014, 016–020, 023–029, 031–038, 040–043 — yaklaşık **32 karar**

Bu, sohbet kaydının eksik olduğu anlamına gelir. Eksik kararların içeriği
bilinmiyor. Aşağıdaki kayıtlar bu 7 dosyadan **çıkarılabilenlerdir.**

🔴 **Aksiyon:** Kaynak sohbetin tamamına erişim varsa eksik kararlar
çıkarılmalı. Yoksa, kod yazılırken karşılaşılan her boşluk yeni bir ADR
olarak buraya eklenmelidir.

---

## UI-ADR-001 — Tasarım, ODIN'e hizmet eder

**Durum:** ✅ Dondurulmuş

**Karar:** Önce ODIN'in Executive Intelligence mimarisi analiz edilir, sonra
ona uygun görsel dil oluşturulur. Referans bir UI alınıp mevcut sisteme
"giydirilmez."

**Gerekçe:** Çoğu tasarım çalışması referans UI'ı alıp sisteme giydirir; bu,
ürünün kendi mantığını bozar.

**Etki:** Tüm tasarım süreci mimariden başlar, Figma'dan değil.

---

## UI-ADR-002 — Navigation modeli: Workspace Navigation

**Durum:** 🔴 Sonradan sessizce değiştirildi — çözüm bekliyor

**Karar (ilk):** Sol menü 6–7 ana kategoriye bölünür (Executive / Intelligence
/ Business / Strategy / Operations / Analytics / System). Adaptive davranır;
yalnızca aktif modülün alt menüsü açılır.

**Reddedilen alternatifler:**

| Model | Puan | Red gerekçesi |
|---|---|---|
| Director Navigation | ⭐⭐⭐☆☆ | "Kullanıcı 'Amazon raporunu nereden açacağım?' diye düşünür. İnsanlar Director yerine iş alanı düşünür." |
| Apple Finder modeli | ⭐⭐⭐⭐☆ | Enterprise tarafta zayıf kalıyor |
| Windows Explorer modeli | ⭐☆☆☆☆ | 100 menü, 1000 alt menü — istenmiyor |

**Sonradan ne oldu:** dosya_7'de menü, reddedilen Director Navigation modeline
dönüştürülüp "donduruldu." Gerekçe verilmedi, red gerekçesi çürütülmedi.

**Risk:** Trading modülü yeni listede yok. 30 modüle ölçeklenmiyor.

**Çözüm önerisi:** Hibrit model — `04-navigation-system.md` §3.
**Karar bekliyor:** `14-open-items.md` #2

---

## UI-ADR-010 — AI Orchestration Layer

**Durum:** ✅ Dondurulmuş

**Karar:** ODIN tek AI değil, bir AI orkestrasıdır. Executive AI master
orchestrator'dır; Amazon / Finance / Trading / Knowledge / Reasoning AI'ları
paralel çalıştırır ve tek cevap üretir. Kullanıcı yalnızca ODIN ile konuşur.

**Gerekçe:** Tek modelle cevap vermekten çok daha güçlü. Uzmanlık ayrımı,
çelişki tespiti ve kanıt kalitesi sağlar.

**Eklenen katman:** Executive Coordination Engine — çelişkileri tespit eder,
eksik veri isteyip tekrar sorar, güven skorlarını karşılaştırır.

**Arayüz etkisi:** Kullanıcı asla "hangi AI ile konuşuyorum?" sorusuyla
karşılaşmaz. Director'lar yalnızca Council açıldığında görünür.

**Backend etkisi:** Orkestratör servisi + paralel çağrı yönetimi + sentez
katmanı gerekir.

---

## UI-ADR-015 — Executive Council = Explainable AI Council

**Durum:** ✅ Dondurulmuş

**Karar:** Normal kullanımda CEO sade bir öneri kartı görür. İsterse
"Open Executive Council" ile tüm AI tartışması açılır. Council Debate,
Consensus Score, Disagreement ve Minority Opinion gösterilir.

**Gerekçe:** "Çoğu AI sistemi sana cevabı gösteriyor. ODIN'in sana düşünce
sürecini göstermesini istiyorum. Ama sadece istediğinde."

**Minority Opinion gerekçesi:** Bazen azınlık görüşü doğru çıkar. Büyük
stratejik kararlarda bu görünürlük çok değerlidir.

**Arayüz etkisi:** İki seviyeli karar kartı — kapalı (sade) ve açık (konsey).

---

## UI-ADR-021 — Multi-Organization / Executive Universe

**Durum:** ✅ Dondurulmuş / ⚠️ Uygulama yeri belirsiz

**Karar:** ODIN hiçbir zaman tek şirkete bağlı olmaz. Organizasyon değil,
**evren (Universe)** değiştirilir: Lillu · Personal · Trading · Holding.

**Ek kararlar:**
- **Cross Universe Intelligence** — evrenler birbiriyle konuşur
- **ODIN HQ** — tüm evrenlerin tek ekranda özeti + Overall Executive Score
- **Executive Identity** — giriş yapan kişi için kimlik kartı (rol,
  organizasyon sayısı, aktif görev, bekleyen karar, AI confidence)

**Gerekçe:** "Bu karar ileride bizi yüzlerce saatlik geliştirme maliyetinden
kurtaracak." Multi-tenancy sonradan eklenmesi en pahalı özelliklerden biridir.

**Backend etkisi:** Tüm veri modelinin bir `universe_id` boyutu taşıması
gerekir. ⚠️ Mevcut ODIN'de bu var mı — DOĞRULANMADI.

**Açık konu:** Universe switcher dondurulmuş App Shell'de yok.
Bkz. `14-open-items.md` #4.

---

## UI-ADR-022 — Üç katmanlı hafıza

**Durum:** ✅ Dondurulmuş

**Karar:** Short-Term / Working / Long-Term Executive Memory. Long-Term
hafıza **otomatik büyümez**; AI her bilgiyi geçici/kalıcı/stratejik/arşivlik
olarak sınıflandırır ve yalnızca değerli olanı taşır.

**Gerekçe:** "Bu karar, yıllar sonra bile ODIN'in hızlı, güvenilir ve
gerçekten öğrenen bir sistem olarak kalmasını sağlayacak."

**Arayüz etkisi:** Memory Workspace, hafıza katmanlarını ve sağlığını
görselleştirir.

**Backend etkisi:** Hafıza sınıflandırma servisi + kademeli saklama.

---

## UI-ADR-030 — Amazon Executive Snapshot (3 katman)

**Durum:** ✅ Dondurulmuş

**Karar:** Amazon'un günlük yönetici raporu üç katmanda okunur:
Layer 1 Executive Glance (10–15 sn) → Layer 2 Executive Intelligence
(30–60 sn) → Layer 3 Deep Analysis (talep üzerine).

**Layer 2'nin sabit formatı:** Numbers → Analysis → Interpretation
→ Recommendation → Evidence

**Etki:** Bu beş adımlı format tüm ODIN modüllerine yayıldı.

---

## UI-ADR-031 — PPC Intelligence Center (4 katman)

**Durum:** ✅ Dondurulmuş

**Karar:** Executive PPC Overview → AI Campaign Intelligence
→ Opportunity Center → Executive Simulator

**Gerekçe:** "Bugün herkes sana ACOS, ROAS, CPC, CTR gösteriyor. Ama CEO
bunlara bakarak karar vermez."

**Ayırt edici:** Opportunity Center sadece sorunları değil kazanç
fırsatlarını da gösterir. Executive Simulator "ne olur?" sorusuna sayısal
cevap verir.

**Risk:** Simülatör bir tahmin modeli gerektirir; backend'de karşılığı yok.

---

## UI-ADR-039 — AI CFO ekibi

**Durum:** ✅ Dondurulmuş

**Karar:** Finance tek AI değil, 8 rollü bir ekiptir (Cash Flow, Treasury,
Debt, Revenue, Cost, Forecast, Investment Analyst + Executive CFO).

**Ortak sistemler:** AI Debate · Financial Memory · Executive Financial
Scorecard · Explainable AI · Confidence Score · Evidence Engine

**En önemli çıktısı:** Standart finansal öneri formatı — bu format sonradan
**tüm ODIN modüllerinin ortak karar formatı** oldu (bkz. `07-ai-directors.md` §7).

---

## UI-ADR-044 — Executive Decision Center

**Durum:** ✅ Dondurulmuş

**Karar:** Sistemdeki tüm kararların merkezi. Karar yaşam döngüsü
AI Insight → … → Knowledge Memory olarak sabitlendi.

**Alt kararlar:**
- **Executive Decision DNA** — her kararın 12 alanlı kimliği
- **Decision Timeline** — her kararın zaman çizgisi
- **Decision Relationships** — kararlar arası etki grafiği
- **Executive Decision Score** — tamamlanan kararın 7 kalemli puanı

**Gerekçe:** Her karar; alınan bir aksiyon değil, ölçülen ve kurumsal
hafızaya eklenen bir bilgi haline gelir. AI zamanla hangi önerilerinin daha
başarılı olduğunu öğrenir.

---

## UI-ADR-050 — Screen = Workspace

**Durum:** ✅ Dondurulmuş
*(Kaynakta numarasız; bu klasörde numaralandırıldı)*

**Karar:** ODIN'de "sayfa" yoktur. Kullanıcı bir çalışma bağlamına girer.

**Gerekçe:** "Bu isim değişikliği kozmetik değil. Tasarım felsefesini
değiştiriyor. ODIN artık dashboard değil, gerçek bir çalışma ortamı."

**Etki:** Navigasyon, geçiş animasyonu ve state yönetimi bu karara göre kurulur.

---

## UI-ADR-051 — Pattern'ler ekran değil, kullanıcı hedefidir

**Durum:** ✅ Dondurulmuş

**Karar:** Pattern Library "Dashboard Pattern / Finance Pattern" gibi ekran
isimlerinden değil, tekrarlanan kullanıcı davranışlarından türetilir.

**Altı pattern:**

| Pattern | Akış |
|---|---|
| Situation Awareness | Executive Brief → KPI Cluster → Alert Stack → Recent Activity |
| Investigation | Summary → Timeline → Evidence → Dependencies → Raw Data |
| Decision Making | Context → Analysis → Recommendation → Alternatives → Impact → Approve |
| Execution | Mission → Progress → Issues → Completion |
| Monitoring | Live Status → Metrics → Trend → Deviation → Alerts |
| Learning | Decision History → Lessons → Knowledge → Suggestions |

**Kompozisyon yönü değiştirildi:**

```
ESKİ:  Component → Pattern → Template → Screen
YENİ:  User Goal → Pattern → Components → Template → Workspace
```

**Gerekçe:** Tasarım kullanıcı hedefinden başlar. Amazon, Finans, CRM veya
başka bir modül aynı kullanıcı akışını kullanırken tamamen tutarlı kalır.

---

## UI-ADR-052 — Altı Workspace Tipi

**Durum:** ✅ Dondurulmuş

**Karar:** Tüm ekranlar 6 tipe indirgenir: Executive / Operational /
Analytical / Knowledge / Configuration / Monitoring. Yeni ekranlar bu
altıdan birine uymak zorundadır.

**Gerekçe:** Ölçeklenebilirlik denetimi — CRM, Supply Chain, Legal, AI
Research gibi yeni workspace'ler eklendiğinde sistem bozulmuyor.

---

## UI-ADR-053 — Search ve Filter, Input ailesinden ayrıldı

**Durum:** ✅ Dondurulmuş

**Karar:** Search bir Input değildir; ayrı bir primitive'dir. Filter da ayrı
bir primitive'dir.

**Gerekçe:**
- Search'ün kendi davranışı var: sonuç sayısı, debounce, geçmiş, kısayollar,
  Command Palette entegrasyonu
- Filter **query oluşturur**, Input **veri girer** — aynı davranış değil

**Etki:** Command Palette ve global arama çok daha temiz kurulabiliyor.

---

## UI-ADR-054 — Autosave, Kaydet butonunun yerini alır

**Durum:** ✅ Dondurulmuş

**Karar:** Mümkün olan her yerde Kaydet butonu yerine Autosave kullanılır.
Durumlar: Saving / Saved / Retry / Conflict.

**Ek kural — Error Recovery:** Kullanıcı hiçbir zaman veri kaybetmez.
Taslak koruma, otomatik geri yükleme, yeniden dene, çakışma çözümü.

**Gerekçe:** Yönetim sistemlerinde daha akıcı deneyim; özellikle uzun metin
girişlerinde kritik.

---

## UI-ADR-055 — Responsive: Executive First

**Durum:** 🔴 Sonradan çelişkiye düştü

**Karar:** ODIN'in birincil hedefi masaüstüdür. Mobil destek olacak ancak
masaüstü deneyimiyle birebir eşitlenmeye çalışılmayacak.

**Sonradan ne oldu:** Claude Design görev listesinde her ekran için
Desktop + Tablet + Mobile tasarımı istendi.

**Bkz.** `14-open-items.md` #6

---

## UI-ADR-056 — Motion yalnızca 4 amaç için

**Durum:** ✅ Dondurulmuş

**Karar:** Animasyon yalnızca Context Change, Focus, Feedback ve State
Transition için kullanılır. Dekoratif animasyon kullanılmaz.

---

## UI-ADR-057 — Command Palette globaldir

**Durum:** ✅ Dondurulmuş

**Karar:** Command Palette hiçbir workspace'e özel değildir. Her workspace
aynı komut sistemini kullanır. Kısayol: `Ctrl/Cmd + K`.

---

## UI-ADR-060 — Master Prompt yaklaşımı terk edildi

**Durum:** ✅ Dondurulmuş — **yön değişikliği**

**Eski hedef:** Claude'a devasa bir JSON/Master Prompt vermek. Üç Master
Prompt hazırlandı (01 Design Bible, 02 Screen Architecture, 03 Production
Quality).

**Yeni karar:** Tasarımın kaynağı prompt değil, **standart** olacak.
Standartlar bir repository'de yaşar; Claude, Cursor, v0 veya gelecekte
çıkacak herhangi bir AI aracı yalnızca bu standardı **uygulayan** bir araçtır.

**Gerekçe:** "Claude'a her seferinde 30-50 bin satırlık prompt vermek yerine"
dosya bazlı standart çok daha sürdürülebilir; yeni ekranlar eklendiğinde
aynı kaliteyi korur.

**Etki:** Bu klasörün var olma sebebi bu karardır.

---

## UI-ADR-061 — Dokümantasyon = SSOT

**Durum:** ✅ Dondurulmuş

**Karar:** `/docs` klasörü ürünün beynidir. ChatGPT bu klasörü günceller,
Claude Design sadece bu klasöre göre tasarlar, Claude Code sadece bu klasöre
göre kod yazar.

**Gerekçe:** Üç araç aynı kaynağa bakar ve proje dağılmaz.

**Etki:** Kod hiçbir zaman doğrudan ana dala gitmez; önce mimari ve kalite
açısından gözden geçirilir.

---

## UI-ADR-062 — AI Gateway / Model Router

**Durum:** ✅ Dondurulmuş

**Karar:** Her AI isteği bir router katmanından geçer. Router: bu iş AI
gerektiriyor mu, gerekiyorsa hangi model, yerel model yeterli mi, büyük
modele gerçekten ihtiyaç var mı sorularını cevaplar.

**Gerekçe:** Gereksiz büyük model çağrıları engellenir; hem maliyet hem hız
kazanılır; tek sağlayıcıya bağımlılık ortadan kalkar.

**Mimari sonuç:** AI, sistemin merkezi değil, ihtiyaç duyulduğunda devreye
giren bir servistir.

---

## UI-ADR-063 — İlerleme ölçütü değişti

**Durum:** ✅ Dondurulmuş — **en önemli düzeltme**

**Karar:** İlerleme artık doküman sayısı, tasarım sayısı veya plan sayısı ile
ölçülmez. Ölçütler: yazılan kod, geçen testler, çalışan ekranlar, tamamlanan
entegrasyonlar.

**Gerekçe (kaynaktan):** "Önceki sprintlerde 'tamamlandı' dediğimiz kısımlar
tasarım ve fonksiyonel tanımların tamamlanmasıydı. Bunlar çalışan kod
değildi."

**Ek özeleştiri (kaynaktan):** "Şimdiye kadar en büyük hata, 'bir sonraki işi
bitirelim' diyerek ilerlemek oldu. Bu yöntem büyük projelerde işi bitirmez;
sadece kapsamı büyütür."

**Etki:** Bu ADR, `handover.md`'nin temelidir.

---

## Yeni ADR nasıl eklenir

```markdown
## ADR-XXX — Başlık

**Durum:** ✅ Dondurulmuş / 🟡 Öneri / ❌ Reddedildi / ♻️ Değiştirildi (ADR-YYY yerine)

**Karar:** Ne kararlaştırıldı?
**Gerekçe:** Neden?
**Reddedilen alternatifler:** Ne düşünüldü ve neden reddedildi?
**Arayüz etkisi:** UI'da ne değişir?
**Backend etkisi:** Servis/veri modelinde ne değişir?
**Riskler:** Ne ters gidebilir?
**Genişletme noktaları:** İleride nasıl büyür?
```

**Kural:** Bir kararı değiştirmek için eski ADR silinmez. Yeni ADR yazılır ve
eskisi `♻️ Değiştirildi` olarak işaretlenir. UI-ADR-002'nin başına gelen sessiz
değişim, bu kuralın neden gerekli olduğunun kanıtıdır.

---
---

# BÖLÜM 2 — CEO Kararları (28 Temmuz 2026)

`14-open-items.md`'deki 13 maddeye verilen cevapların ADR karşılıkları.
Bu kararlar Bölüm 1'deki çelişkileri kapatır.

---

## UI-ADR-069 — Görsel dil: Hibrit

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #1

**Karar:** Çerçeve (header, sidebar, status bar) ve içerik alanı sakin,
Palantir/Linear dilinde. AI bölgeleri (AI Brief, Council, öneri kartları,
AI Pulse) belirgin mor glow alır. Cam yalnızca overlay katmanında (modal,
drawer, command palette).

**Reddedilenler:**
- Sakin/Executive saf model — AI'ı görsel olarak ayrıştırmıyordu
- JARVIS ağırlıklı model — Personality Matrix'teki "Gösterişli 1/10" ile
  çelişiyor, performans bütçesini zorluyor

**Ek karar:** İkincil aksan turuncu kalır; `warning` için **amber** ayrılır.
İkisi yan yana açıkça ayırt edilebilir olmalıdır, aksi halde uyarı sistemi
çalışmaz.

**Etki:** `11-design-tokens.md` §5.

---

## UI-ADR-070 — Navigation: Hibrit menü

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #2 | **Değiştirir:** UI-ADR-002

**Karar:** Kategori başlıkları tıklanamaz etikettir; altlarında düz maddeler.
Kullanıcı için düz liste gibi davranır, ama yeni modülün nereye gireceği
bellidir.

**Neden ikisi de değil:** Karar A (kategorili açılır menü) 9 modülde
gereksiz derinlik; Karar B (düz liste) Trading'e yer bırakmıyor ve 30 modülde
taşıyor.

**Etki:** Routing yapısının tek kaynağıdır. `04-navigation-system.md` §3.

---

## UI-ADR-071 — Telemetri: gerçek olanla başla

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #7

**Karar:** 13 status bar kanalı → **6 gerçek kanal**. 7 AI Pulse halkası →
**3 gerçek halka**.

**Gerekçe:** `Reasoning`, `Planning`, `Reflection` gerçek altsistem değil,
kavramsal isimlerdir. Ölçülebilir kaynakları yoktur. Animasyonla göstermek,
olmayan bir şeye nabız takmaktır ve "Fake Dashboard" yasağını ihlal eder.

**v1.0 status bar:** `last_sync` · `api_traffic` · `background_jobs`
· `error_count` · `ai_queue` · `ai_cost`

**v1.0 AI Pulse:** `Processing` · `Memory & Knowledge` · `Prediction`

**Önemli:** Son iki status bar kanalı ve Processing halkası, AI Gateway
kurulunca **kendiliğinden gelir.** Ayrı iş değildir.

**Genişletme:** Karşılığı oluşan kanal eklenir. Karşılığı olmayan çizilmez.

---

## UI-ADR-072 — Alt menü + üst sekme, ikisi birden

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #3

**Karar:** Sidebar'da adaptive alt menü **ve** workspace header'ında sekmeler,
senkron çalışır. Sidebar "sistemde neredeyim", sekme "modülde neredeyim"
sorusunu cevaplar.

---

## UI-ADR-073 — Universe: HQ + header switcher

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #4

**Karar:** İkisi birden. Header sol üstte hızlı geçiş switcher'ı; ayrıca
**ODIN HQ** adında ayrı bir Executive Workspace (tüm evrenlerin sağlık skoru
+ Overall Executive Score), menüde Mission Control'ün üstünde.

**Backend ön koşulu:** `universe_id` boyutu. Mevcut modelde yoksa **M1'den
önce** eklenmelidir — retrofit ~10 kat pahalıdır.

---

## UI-ADR-074 — Director listesi dondu

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #5

**Karar:** AI Director (zekâ) ile Workspace (ekran) ayrıldı.

**AI Directors (6 aktif):** Executive · Amazon · Finance · Trading
· Knowledge · Reasoning
**İleride:** Security · Legal

**Ek kurallar:**
- "Mission Control Director" yoktur — Mission Control bir workspace'tir
- Projects ve Automation'ın kendi AI'ı yoktur; Executive AI yönetir
- Director eklemek yeni ADR gerektirir

---

## UI-ADR-075 — Responsive: tam kapsam, sıralı üretim

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #6 | **Değiştirir:** UI-ADR-055

**Karar:** Her ekran Desktop + Tablet + Mobile, Dark + Light olarak
üretilecek.

**Zorunlu sıra:** Desktop/Dark → Desktop/Light → Tablet → Mobile.
Bir varyant bitmeden diğerine geçilmez.

**Gerekçe:** Desktop/Dark referanstır. Değişirse diğer 5 varyantın hepsi
yeniden yapılır.

⚠️ **Risk kaydı:** Bu karar tasarım işini ~6 katına çıkarır (9 ekran ×
3 cihaz × 2 tema + state'ler). UI-ADR-055'teki "Executive First — mobil
eşitlenmeye çalışılmayacak" ilkesiyle gerilim taşır. Kapsam baskısı
oluşursa ilk kesilecek yer Mobile ve Tablet'tir; Desktop/Dark asla
kesilmez.

---

## UI-ADR-076 — Header sadeleştirildi

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #10

**Karar:**
- Görünür 4 ikon: `Alerts` · `Tasks` · `AI Status` · `Profile`
- "More" menüsünde: Notifications · Messages · System Health
- **Kaldırıldı:** `Weather`, `Time` — karar üretmiyorlar, OS'ta zaten varlar
- 7 ayrı AI durum göstergesi → tek birleşik **AI Pulse** göstergesi

**Gerekçe:** Header'daki 16 eleman, Cognitive Load Budget'ı (5–7 odak) ihlal
ediyordu.

---

## UI-ADR-077 — AI her yerde, ayrı ekran yok

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #8

**Karar:** AI ayrı bir yere gidilerek kullanılmaz. Executive Brief, Insight,
Decision, Forecast ve Knowledge içinde doğal olarak yaşar.

**Bağımsız "AI Core Workspace" kaldırıldı.** Menüde böyle bir madde yoktur.

**AI telemetrisi nerede:** System Director içinde **"AI Runtime"** sekmesi.
Processing queue, aktif model, Model Router istatistikleri, token/maliyet,
3 kanallı AI Pulse.

**Günlük kullanım:** Header'daki AI Pulse göstergesi yeterlidir.

---

## UI-ADR-078 — Executive Director silindi

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #12 (kısmen)

**Karar:** "Executive Director" workspace'i kaldırıldı. Executive Briefing
ile aynı şeydi; iki isim tek ekran için karışıklık üretiyordu.

---

## UI-ADR-079 — Tanımsız workspace'lerin sırası

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #12

**Sıra:** Finance → Trading → Projects → Automation
**v1.0 dışı:** Strategy Workspace (v2 backlog)

Her biri Amazon Director seviyesinde tanımlanmadan M3'te kod yazılmaz.

---

## UI-ADR-080 — Voice v1.0 dışı, backlog'a alındı

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #11

**Karar:** Voice Workspace v1.0 kapsamı dışındadır. Ses altyapısı (STT/TTS)
mevcut ODIN'de yoktur ve bağımsız bir çalışmadır.

**v1.0'da:** Header'da `Voice Status` göstergesi `disabled` durumunda durur.

**Backlog:** v1.1 hedefi. `handover.md` §12.

---

## UI-ADR-081 — Bileşen üretim sırası

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #13

**Karar:** M2'nin ilk iki işi: **1) Typography System, 2) Table.**

**Gerekçe:** Veri yoğun bir Executive sistemde en çok kullanılan iki şey
bunlar. Diğer bileşenler `10-component-library.md` §14 şablonuyla sırayla.

**Zorunlu teknik kural:** Sayılar için `tabular-nums`. Sütunda hizalanmayan
sayı, okunmayan tablo demektir.

---

## UI-ADR-082 — Adaptive UI v1.0'da KAPALI

**Durum:** ✅ Dondurulmuş | **Kapatır:** Open Item #9

**Karar:** Adaptive UI (Executive Memory kişiselleştirmesi) v1.0'da
**kapalıdır.** Gerekçe: sistem yeni; iki hafta
boyunca yetersiz veriden öğrenip yanlış tahmin yapar. Alışkanlıklar gerçek
kullanımla birikince açılır.

**Gerekçe:** Sistem yeniyken iki hafta boyunca yetersiz veriden öğrenip
yanlış tahmin yapar. Kullanıcı kontrolü kaybetmiş hisseder — bu tam olarak
ODIN'in hissettirmemesi gereken duygudur.

**v1.1'de açılırken uygulanacak üç kural:**
1. Menü öğesi asla kaybolmaz — yalnızca sıralama ve varsayılan açılış değişir
2. Adaptasyon görünür olur ("Sabahları Finance ile başlıyorsun, onu açtım")
3. Ayarlarda tek toggle ile kapatılabilir

**Kod tarafı hazırlığı (v1.0'da yapılır):** Kullanım olayları
(workspace açılışı, saat, süre) baştan **kaydedilir** — feature flag kapalı
olsa bile. Böylece v1.1'de açıldığında geçmiş veri hazır olur ve sistem
sıfırdan öğrenmeye başlamaz.

---

## UI-ADR-083 — Telemetri: genişlemeye hazır mimari

**Durum:** ✅ Dondurulmuş | **Genişletir:** UI-ADR-071

**Karar:** v1.0'da 6 kanal gösterilir, ancak mimari **20 kanalın tamamını
baştan tanımlar.** Yeni kanal eklemek kod değişikliği gerektirmez.

**Uygulama — kanal kayıt defteri (registry) deseni:**

```ts
// telemetry/registry.ts — tek kaynak
export const TELEMETRY_CHANNELS = [
  { id: "last_sync",       label: "Son senkron",  source: "sync",     available: true  },
  { id: "api_traffic",     label: "API",          source: "gateway",  available: true  },
  { id: "background_jobs", label: "İşler",        source: "jobs",     available: true  },
  { id: "error_count",     label: "Hata",         source: "logs",     available: true  },
  { id: "ai_queue",        label: "AI kuyruk",    source: "aiGateway",available: false },
  { id: "ai_cost",         label: "AI maliyet",   source: "aiGateway",available: false },
  // aşağıdakiler tanımlı ama kapalı — karşılığı oluşunca available: true yeter
  { id: "event_queue",     label: "Event Queue",  source: "eventBus", available: false },
  { id: "memory_indexing", label: "Memory Index", source: "memory",   available: false },
  { id: "knowledge_sync",  label: "Knowledge",    source: "knowledge",available: false },
  { id: "workflow_engine", label: "Workflow",     source: "workflow", available: false },
  { id: "scheduler",       label: "Scheduler",    source: "jobs",     available: false },
  { id: "agent_bus",       label: "Agent Bus",    source: "orchestr", available: false },
  { id: "voice_queue",     label: "Voice",        source: "voice",    available: false },
];
```

**Aynı desen AI Pulse için de geçerlidir:** 7 kanalın hepsi tanımlıdır,
3'ü `available: true`.

**Kural:** UI bu listeyi okur ve yalnızca `available: true` olanları çizer.
Yeni bir servis canlıya çıktığında yapılacak tek iş: `available` bayrağını
çevirmek. Bileşene, layout'a veya sözleşmeye dokunulmaz.

**Gerekçe:** "Gelişmiş olsun ama sonradan işimiz kolay olsun." Bu desen,
sahte telemetri göstermeden genişlemeye izin verir.

---

## UI-ADR-084 — İkincil aksan: cyan

**Durum:** ✅ Dondurulmuş | **Değiştirir:** UI-ADR-069 (kısmen)
**Tarih:** 28 Temmuz 2026 — S0 audit sonrası

**Karar:** İkincil aksan **turuncu değil, cyan `#00D4FF`**. Turuncu palette
hiç kullanılmaz.

**Gerekçe:**

1. **Mevcut arayüzle hizalanma.** `odin/assets/cockpit.html` zaten
   `--secondary: #00D4FF` kullanıyor. Cyan seçmek, eski ve yeni arayüzü
   aynı aileden gösterir; palet uyumu ~%95'e çıkar.
2. **Uyarı çakışması tamamen kalkar.** Turuncu ile amber (`warning`) aynı
   aileden. Turuncu tamamen kaldırılınca "her turuncu öğe uyarı gibi
   okunuyor" riski yok olur.

**Etki:** `kod/tokens.css`, `kod/tailwind.config.ts`, `11-design-tokens.md`
güncellendi. `--odin-orange-*` primitive'leri kaldırıldı.

---

## UI-ADR-085 — ADR numaralandırma: UI- öneki

**Durum:** ✅ Dondurulmuş
**Tarih:** 28 Temmuz 2026 — S0 audit sonrası

**Sorun:** ODIN reposunun kendi ADR serisi var: **ADR-0001 … ADR-0086**
(71 adet, `docs/adr/`). Bu klasörde üretilen kararlar da ADR-001…083 idi.
Doğrudan çakışma: `ADR-069` hem "ODIN Phase 10 dokümantasyon modeli" hem
"görsel dil hibrit" olamaz.

**Karar:** Bu klasördeki tüm kararlar **`UI-ADR-###`** önekiyle numaralanır.

**Kural:**

| Önek | Kapsam | Nerede yaşar |
|---|---|---|
| `ADR-0###` | ODIN çekirdek mimarisi | `ODIN/docs/adr/` |
| `UI-ADR-###` | Arayüz kararları | `OD-N-ARAY-Z/docs/ui_chatgpt/08-decision-log.md` |

Bir UI kararı ODIN çekirdeğini etkiliyorsa (ör. yeni API endpoint'i),
o iş ayrıca ODIN'in R-006 request registry sürecinden geçer ve gerekirse
kendi `ADR-0###` kaydını alır (ADR-0050).

**Reddedilen alternatif:** ODIN serisine ADR-0087'den devam etmek.
Reddedilme gerekçesi: arayüz kararları ayrı bir repoda yaşıyor ve ayrı bir
yaşam döngüsüne sahip. Tek seride toplamak, iki repo arasında numara
senkronizasyonu gerektirirdi.

---

## UI-ADR-086 — Bileşen durum modeli: ortak `state` prop'u yok

**Durum:** ✅ Dondurulmuş
**Tarih:** 28 Temmuz 2026 — S3 Core Components
**Danışılan:** gavadolar (terra · luna) — iki görüş de aynı yönde

**Sorun:** `10-component-library.md` §6 her bileşenin 11 durumu (Default,
Hover, Pressed, Focus, Disabled, Loading, Empty, Error, Success, Offline,
Read Only) desteklemesini zorunlu kılıyor. Bunu doğrudan okumak, her bileşene
`state: 'loading' | 'error' | …` biçiminde ortak bir prop koymaya götürür.

**Karar:** Ortak `state` prop'u **kullanılmaz.** 11 durum bir **API
zorunluluğu değil, durum/test matrisidir.** Kaynaklar:

| Durum | Kaynak |
|---|---|
| Default · Hover · Pressed · Focus | CSS pseudo-class |
| Disabled | native `disabled` |
| Read Only | native `readOnly` / `aria-readonly` |
| Loading | `loading` prop + `aria-busy="true"` |
| Error | `aria-invalid="true"` + `aria-describedby` |
| Success | `Field status="valid"` ya da `variant="success"` |
| Offline | `offline` prop — yalnızca eylem bileşenlerinde |
| Empty | verinin yokluğu — prop değil |

Bir bileşen için anlamsız olan durum **sahte bir görsel duruma
dönüştürülmez**; `10a-core-components.md`'de `N/A` + gerekçe olarak
belgelenir.

**Gerekçe:**
1. Tek `state` prop'u geçersiz kombinasyon üretir: `loading` + `disabled`
   aynı anda gerçek bir durumdur, union tip bunu ifade edemez.
2. Native semantiği bozar. `disabled` bir attribute'tur; onu bir string'in
   içine gömmek ekran okuyucudan bilgi saklar.
3. Hover/Pressed/Focus prop OLMAMALIDIR — bunlar kullanıcının o anki
   etkileşimidir, bileşenin bildirdiği bir değer değil.

**Reddedilen alternatif:** Ortak bir `useComponentState` hook'u + `data-state`
attribute'u. Reddedilme gerekçesi: 16 primitive için ortak bir durum makinesi
kurmak, hiçbirinin ihtiyaç duymadığı bir soyutlama katmanı ekler; native HTML
zaten bu işi yapıyor.

**Etki:** Tüm `src/components/ui/*`. `data-state` iç kullanım için kalabilir,
public API olmaz.

---

## UI-ADR-087 — Grafik: kütüphane yerine SVG primitive

**Durum:** ✅ Dondurulmuş
**Tarih:** 28 Temmuz 2026 — S3 Core Components
**Danışılan:** gavadolar (terra · luna) — iki görüş de aynı yönde

**Sorun:** S3 "Chart temel seti (Recharts veya benzeri)" diyor. Recharts
eklemek mi, elle SVG yazmak mı?

**Karar:** **Grafik kütüphanesi eklenmez.** `Line` · `Area` · `Bar` elle
yazılmış SVG olarak üretilir. Ölçekleme mantığı `src/lib/chart/scale.ts`
içinde **saf fonksiyonlardır** ve birim testleri vardır.

**Gerekçe:**
1. Kapsam "executive glance": KPI trendi, ciro çizgisi, kampanya barları.
   Recharts'ın getirdiği API yüzeyi ve bundle bu iş için orantısız.
2. Token uyumu tam kontrol altında kalır — tüm renkler
   `stroke-chart-*` / `fill-chart-*` sınıflarından gelir, ESLint kuralı
   ihlal edilemez.
3. Animasyon politikası doğrudan uygulanır: varsayılan **hareket yok**
   (12-...md §1 — grafiğin "büyümesi" dekoratiftir).
4. Anti-fake doğrudan uygulanır: eksik nokta interpolasyonla doldurulmaz,
   veri yoksa `EmptyState` çıkar. Kütüphaneler varsayılan olarak boşluğu
   kapatır — bu bizim en temel kuralımızı ihlal ederdi.

**Reddedilen alternatif:** Recharts. **Yeniden değerlendirme koşulu:** zoom,
brush, çoklu seri senkronizasyonu ya da karmaşık eksen ihtiyacı backlog'a
girerse bu karar yeniden açılır.

**Etki:** `src/components/ui/chart.tsx`, `src/components/ui/sparkline.tsx`,
`src/lib/chart/scale.ts` (+ `scale.test.ts`). Yeni npm bağımlılığı YOK.

---

## UI-ADR-088 — Anti-fake zorlaması: `DataGuard` sarmalayıcısı

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S4 Executive Components
**Danışılan:** gavadolar (terra · luna) — iki görüş de aynı yönde

**Sorun:** `canRender()` her bileşenin gövdesine tek tek yazılırsa bir gün
unutulur ve unutulduğunda hiçbir şey bağırmaz. Hook (`useEnvelope`), HOC ya da
sarmalayıcı?

**Karar:** **Sarmalayıcı.** Veri taşıyan her Executive bileşeninin tek public
çıkışı `DataGuard` ile sarılıdır; içerideki `*View` bileşeni `env` değil,
doğrulanmış `data` alır.

**Gerekçe:** Hook da HOC da çağrılmayı unutulabilir — ikisi de yalnızca
ergonomidir, garanti değildir. `DataGuard`'da zarfı atlamak **tip seviyesinde**
mümkün değildir: `*View`'ın `env` diye bir prop'u yoktur. Ayrıca guard tek bir
saf bileşen olarak test edilir; 15 bileşenin her birinde ayrı ayrı test edilmez.

**Reddedilen alternatif:** `useEnvelope` hook'u.
**Etki:** `src/components/executive/data-guard.tsx` + 15 bileşenin tamamı.

---

## UI-ADR-089 — Canlılık için tek merkezi saat

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S4
**Danışılan:** gavadolar (terra · luna) — iki görüş de aynı yönde

**Sorun:** DirectorCard "lastBeat > beatIntervalMs*3 ise offline" der. Bu her
kartta `setInterval` ile mi hesaplanır? Ekranda 20 kart olabilir. Ayrıca
`Date.now()` render içinde çağrılırsa sunucu ile istemci farklı değer üretir.

**Karar:** Tek bir modül düzeyinde tick yayını (`useNow()`,
`useSyncExternalStore`). Abone varken tek timer çalışır, son abone gidince
timer durur. **`getServerSnapshot` daima `null` döner.**

**Gerekçe:**
1. 20 kart = 20 timer, 20 ayrı drift ve gereksiz render demektir.
2. `now === null` iken canlılık **"bilinmiyor"** durumundadır — sunucuda ve
   ilk hydration render'ında ne "canlı" ne "offline" yazılır. Hydration
   mismatch kapanır ve aynı hamlede sahte durum üretimi de engellenir.
3. Zaman mantığı (`liveness`, `relativeTime`) saf fonksiyondur ve tarayıcısız
   birim testi vardır.

**Reddedilen alternatif:** kart başına `setInterval`.
**Etki:** `src/lib/clock/tick.ts` (+ `tick.test.ts`), DirectorCard,
HeartbeatIndicator, TrustSignal, AlertStack, EvidenceChain, TelemetryBar.

---

## UI-ADR-090 — Heartbeat: atım başına tek nabız, geçmiş çubuğu yok

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S4

**Sorun:** `07-ai-directors.md` §12 Director kartında `Heartbeat █████████`
biçiminde bir nabız çubuğu gösteriyor. Ayrıca `02-design-principles.md` §11
"hiçbir sinyal sonsuz döngüde değildir" diyor — sürekli dönen bir nabız
animasyonu bu kuralla çelişiyor.

**Karar:** İki değişiklik.
1. **9 çubuk çizilmez.** 9 çubuk son 9 atımın geçmişini ima eder;
   `DirectorHeartbeat` sözleşmesi yalnızca `lastBeat` verir. Olmayan bir
   geçmişi çizmek sahte telemetridir.
2. **Nabız sonsuz döngü değildir.** `key={lastBeat}` ile her gerçek atımda
   bir kez atar. Yeni atım gelmezse hiçbir şey kıpırdamaz.

**Gerekçe:** Canlılık hissi animasyondan değil veriden gelmelidir. Bu kurgu
"animasyonu durdur" kuralını ayrıca uygulamayı gereksiz kılar — atım
gelmediğinde animasyon zaten yoktur. Üçüncü bir durum eklendi: `lastBeat`
yoksa **"bilinmiyor"**; bilmemek ile ölmüş olmak farklı şeylerdir.

**Etki:** `heartbeat-indicator.tsx`, `director-card.tsx`.
**Not:** `07-ai-directors.md` §12'deki ASCII çizim güncellenmelidir.

---

## UI-ADR-091 — Alternatifi 2'den az öneri: sessiz `null` + bastırma gerçeği

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S4
**Danışılan:** gavadolar — **terra ve luna burada ayrıştı**, karar sentezdir

**Sorun:** `alternatives.length < 2` olan bir AI önerisi gösterilmez. Peki
kullanıcı bu bilgiyi hiç görmemeli mi? terra: sessizce `null` dön, UI kendi
başına olay uydurmasın. luna: CEO bilgiyi kaçırmasın, bir yerde görünsün.

**Karar:** İkisi de.
- `AIRecommendationCard` **`null` döner.** Yerine "gösterilemiyor" kutusu
  basılmaz — o kutu boş bir AI kartı üretip kuralı deler.
- Bastırma gerçeğini **çağıran katman** yazar. `canRenderRecommendation()` ve
  `missingExplainabilityFields()` dışa açıktır; `AIBrief` 🎯 adımında eksik
  alanların adını yazar, `OpportunityCard` ve `ExecutiveKPICard` kendi
  bağlamında bir satır düşer.
- **Sahte `Alert` nesnesi üretilmez.** AlertStack yalnızca backend'den gelen
  gerçek uyarıları listeler.

**Gerekçe:** Bastırmayı bilen katman, bastırmanın olduğu yerdir. Uydurma
yapılmadan görünürlük sağlanır. Aynı kural 7 explainability alanının
tamamı için geçerlidir (09-...md §3).

**Etki:** `ai-recommendation-card.tsx`, `ai-brief.tsx`, `opportunity-card.tsx`,
`executive-kpi-card.tsx`.

---

## UI-ADR-092 — Bayat veride onay kilidi

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S4
**Danışılan:** gavadolar (luna)

**Sorun:** `freshness: "stale"` bir DecisionCard'da CEO yine de `Onayla`
diyebilir. Bayat veriyle verilen onay geri alınamaz.

**Karar:** `meta.freshness === "stale"` iken `Onayla` butonu `disabled`,
sebebi butonun üstünde açık metinle yazılı. Sessizce disabled edilmez.
`Analizi aç` açık kalır — okumak her zaman serbesttir.

**Gerekçe:** Bayat veriyle verilen onay, sahte veriyle verilen onaydan
farksızdır. Anti-fake kuralı yalnızca gösterimi değil, **eylemi** de kapsar.

**Etki:** `decision-card.tsx`.

---

## UI-ADR-093 — Yüzde ölçeği bildirilir, tahmin edilmez

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S4 kapanışı
**Danışılan:** gavadolar (terra · luna) — iki görüş de aynı yönde, ikisi de
"varsayımı kaldırın" dedi

**Sorum:** `ExecutiveKPI.unit: "percent"` için sözleşmede ölçek yazmıyor.
ACOS 18.1 mi gelir, 0.181 mi? S4'te 0–100 varsayıp arayüzde 100'e bölmüştüm.

**Karar:** Varsayım **kaldırıldı.** `unit === "percent"` ise
`scale: "0-1" | "0-100"` alanı **zorunludur**. Gelmezse değer render edilmez,
`NoData` çıkar ve sebebi yazılır.

**Gerekçe:** Yanlış tahmin %18,1 yerine %1810 yazar. Bu, eksik veriden daha
tehlikelidir: **makul görünür.** Anti-fake kuralı "veri yoksa gösterme" der;
"ölçeği bilinmeyen veri" de bu kapsamdadır — sayı vardır ama anlamı yoktur.
Otomatik düzeltme (100 kat böl/çarp) de yapılmaz; arayüz veriyi tamir etmez.

**İstisna:** `trend.changePercent`. `05-dashboard.md` §4 anatomisi bu alanı
`12 → "▲ %12"` örneğiyle açıkça 0–100 olarak dondurmuştur; orada tahmin yok,
dondurulmuş bir sözleşme var.

**Etki:** `types/executive.ts`, `executive-kpi-card.tsx`,
`13-backend-recommendations.md` §13.2. Backend `scale` alanını üretene kadar
yüzde KPI'ları boş görünür — bu bilinçli ve doğru davranıştır.

---

## UI-ADR-094 — Mock veri zarfta ayrı bir kaynaktır

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S5 Executive Briefing + Mission Control

**Sorun:** S5 ekranları mock veriyle besleniyor; gerçek veri S8'de gelecek.
Mock'u nasıl işaretleriz ki S8'de hiçbiri sessizce kalmasın?

**Karar:** Üç katmanlı işaretleme.
1. `DataSource` union'ına `"mock"` eklendi (`types/data-envelope.ts`). Mock
   üreten tek kapı `mocks/envelope.ts`'tir ve `meta.source` alanını her
   zaman `"mock"` yazar — başka değer yazmak tip seviyesinde mümkün ama
   kural olarak yasaktır.
2. `TrustSignal` bu kaynağı **saklamaz**: kartın altında
   "Mock veri (S8'de gerçek kaynakla değişecek)" yazar.
3. Dev derlemesinde ekranda `MockBadge` görünür; üretim derlemesinde
   bileşen `null` döner.

**Gerekçe:** Mock veri "geçici" olduğu için değil, **fark edilebilir**
olduğu için zararsızdır. Tek arama (`source: "mock"`) tüm mock'ları bulur;
S8'de unutulan bir mock, sahte veriye dönüşür ve anti-fake kuralını
sessizce deler. Rozet nötr tondadır (amber değil): bir uyarı değil, bir
etikettir — her ekranı alarma çevirmemek için (UI-ADR-091 ile aynı gerekçe).

**Ek kural — mock'ta da anti-fake:** karşılığı olmayan alan mock'ta da
doldurulmaz. `Knowledge Health` / `Memory Health` KPI'ları ölçüm kaynağı
olmadığı için (registry'de `knowledge_sync` / `memory_indexing`
`available: false`) değersiz gelir ve ekranda `NoData` çıkar.

**Etki:** `types/data-envelope.ts`, `trust-signal.tsx`, `src/mocks/*`.

---

## UI-ADR-095 — Açılış durum şeridi registry'den beslenir

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S5

**Sorun:** `05-dashboard.md` §2 açılışın ilk 0–3 saniyesinde altı durumun
"sırayla canlanmasını" istiyor: AI Core aktif · Voice Core Online ·
Knowledge Connected · Memory Synced · Background Jobs Running · Data
Sources Connected. ODIN'de bu altı servisin **dördü yok.**

**Karar:** Şerit çizilir ama içeriği telemetry registry'den gelir
(`SystemReadiness`). Kapalı kanal "Online" yazmaz, **"bağlı değil"** yazar.

**Gerekçe:** Altı yeşil tik göstermek en kolay şeydir ve tam olarak
"Fake Dashboard" yasağının ihlalidir. Registry, hangi altsistemin gerçekten
var olduğunun tek kaynağıdır (UI-ADR-083); şerit onu okur. Yeni bir servis
canlıya çıkınca tek iş yine `available: true` — şeride dokunulmaz.

**Süre:** 6 satır × 0,12 sn = 0,72 sn. Popup yok, ses yok; satırlar sessizce
belirir. 3 saniyelik bütçenin içindedir.

**Etki:** `system-readiness.tsx`, `lib/telemetry/registry.ts` (okunur).

---

## UI-ADR-096 — Sözleşmesi olmayan bölüm boş bırakılır, uydurulmaz

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S5

**Sorun:** `05-dashboard.md` §5 Mission Control için dokuz bölüm sayıyor.
`09-data-contracts.md` bunlardan yalnızca dördünü karşılıyor. Kalan üçü
(Active Projects · Resource Allocation · Automation Queue) için veri
sözleşmesi **yok.** Ekranı tamamlamak için sözleşme uydurmalı mıyız?

**Karar:** Hayır. Üç bölüm de çizilir ama **gerekçesi yazılı boş durum**
gösterir: "sözleşmesi tanımlı değil, uydurulmuş bir liste göstermek yerine
boş bırakıldı" + sorunun düşüldüğü yer (13-...md §14.2).

Ekranın karşılığı olan parçaları için sözleşme **teklif** olarak yazıldı
(`types/screens.ts`: `ExecutiveHero`, `Mission`, `IntelligenceItem`) —
09-...md'nin kendisi gibi, ekrandan geriye türetilmiş ve 🟡 işaretli.
Bu bir veri modeli değişikliği değildir; CLAUDE.md §7 gereği karar sahibe
bırakılmıştır.

**Gerekçe:** Boş bir bölüm, uydurulmuş bir bölümden dürüsttür ve
**eksikliği görünür kılar** — uydurma ise eksikliği gizler. Aynı ilke Hero'daki
`AI Readiness` alanında da uygulandı: sözleşmede karşılığı olmadığı için
`null` gelir ve ekranda `NoData` çıkar.

**Etki:** `mission-control.tsx`, `types/screens.ts`,
`13-backend-recommendations.md` §14.

---

## UI-ADR-097 — S3 borcu: FPS ve long task kapı değildir, invariant kapıdır

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S5
**Danışılan:** gavadolar (terra · luna) — iki tur, iki görüş de aynı yönde

**Sorun:** S3'te FPS ölçülememişti (otomasyon sekmesinde `requestAnimationFrame`
kısıtlı). Yerine "10.000 satırda kaydırma altında 50 ms üzeri long task = 0"
kriteri önerilmişti.

**Ölçüm:** Kriter denendi ve **taşınabilir olmadığı kanıtlandı.**

| Koşum | Tekerlek senaryosu, >50 ms long task |
|---|---|
| Kontrol grubu (kaydırma yok) | 0 |
| Aynı kod, koşum 1 | 5 |
| Aynı kod + `table-layout: fixed` (teorik İYİLEŞTİRME) | 18 |
| `Intl.NumberFormat` önbelleği eklendiğinde | 20 → 19 |

Performansı iyileştirmesi beklenen bir değişiklik ölçümü 3,6 kat
**kötüleştirdi.** Sinyal koda değil, o andaki makine yüküne tepki veriyor.

**Karar:** İki parça.
1. **Long task ve FPS kapı DEĞİLDİR.** Kırmızı ama güvenilmez bir test,
   testsizlikten kötüdür: insanlara kırmızıyı yok saymayı öğretir.
2. Yerine sanallaştırmanın **dört makineden bağımsız invariant'ı** kapıdır:
   DOM satır sayısı pencere + overscan sınırını aşmaz · adım başına DOM
   değişimi sınırlıdır (tüm liste yeniden kurulmaz) · `scrollHeight` kaymaz
   (tolerans: bir satır) · kaydırma sonrası **doğru veri aralığı** görünür.

Sabit "≤30 satır" eşiği de kullanılmadı: sınır viewport yüksekliğine
bağlıdır (60vh + 32 px satır + `overscan: 12` → yapısal alt sınır ~39).
Eşik ekrandan **hesaplanır**.

**Reddedilen alternatifler:** eşiği ölçüme göre yükseltmek (ölçüme göre
bütçe ayarlamak olurdu); kontrol grubuna göre göreli eşik (aynı gürültü).

**Ek karar — `Intl.NumberFormat` önbelleği geri alındı.** 20 → 19 gürültü
bandındadır; "teorik olarak doğru" olması kanıt gereksinimini karşılamaz.
Profil ile anlamlı maliyet gösterilirse yeniden eklenir.

**Etki:** `table.stories.tsx` (`SanallastirmaAltindaKaydirma`),
`10a-core-components.md` §17 son madde.

---

## UI-ADR-098 — Kanonik kaynak ODIN'dir; arayüz ona uyarlanır

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S5 sonrası, S6 öncesi
**Danışılan:** gavadolar (terra · luna) — iki görüş de aynı yönde, ikisi de
"S6'dan ÖNCE düzeltin" dedi

**Sorun:** `09-data-contracts.md` kendi başlığında "kaynakta hiç yoktu,
arayüz bileşenlerinden geriye türetildi, DOĞRULANMADI" diyordu. S6 öncesi
ODIN çekirdeği okundu ve doğrulama yapıldı. Sonuç: ciddi uyuşmazlık.

Üç tür fark bulundu ve `09b-verified-contracts.md`'ye kaynak gösterilerek
yazıldı:
- **Uydurulmuş alan** — arayüzde var, ODIN'de yok (`priority`,
  `expectedROI`, `reversibility`, `directorOpinions`, `beatIntervalMs`,
  `currentGoal`, `memoryHealth` …).
- **Kayıp alan** — ODIN üretiyor, arayüz göstermiyor (`flip_conditions`,
  `assumptions`, `confidence_breakdown`, gecikme/başarı/maliyet metrikleri,
  `monitoring_checkpoints`).
- **Yer değiştirmiş alan** — `alternatives` ODIN'de **kararın** alanı
  (minItems 2), arayüzde **önerinin** alanı ve "2'den az ise render etme"
  sert kuralının dayanağı (UI-ADR-091).

**Karar:** Kanonik kaynak **ODIN'dir.** Arayüz ona uyarlanır; backend
doğrulanmamış bir UI modelini karşılamak için büyütülmez. Gerçekten ürün
ihtiyacı olan yeni kavramlar (KPI seti, Alert, Opportunity, Mission)
sahibin kararıyla ODIN governance'ına (ADR-0050 / R-006) **talep** olarak
girer — arayüz onları icat etmez.

**Zamanlama:** Düzeltme **S6'dan ÖNCE.** S6 diğer yedi workspace'in
şablonudur; yanlış sözleşmeyle üretilen bir şablon hatayı sekize çoğaltır.
Mock katmanının adapter sınırı olması tek başına güvence değildir — yanlış
varsayımlar bileşen API'lerine, görünürlük kurallarına ve ekran
hiyerarşisine gömülüdür.

**En kritik bulgu:** `flip_conditions`. "Bu öneriyi ne değiştirir?"
sorusunun cevabıdır, ODIN onu **zorunlu** tutar, arayüz hiç göstermez.
Kayıp alan uydurulmuş alandan tehlikelidir: uydurulmuş alan hiç değilse
`NoData` gösterir, kayıp alan sessizdir.

**Doğrudan uygulanan (mühendislik, sahibe sorulmadı):**
- Confidence eşikleri ODIN'in kanonik bantlarına hizalanır
  (80/60/40/20 → very-high/high/moderate/low/very-low). Arayüzdeki 50
  eşiğinin ODIN'de karşılığı yoktur, uydurulmuştur.
- `confidence_breakdown` (8 bileşen) gösterilir.
- `alternatives` karar seviyesinde gösterilir; UI-ADR-091'in "öneride
  alternatives<2 ise null dön" kuralı **düzeltilir** — o alan önerinin
  değildir.
- Consensus metni düzeltilir: ODIN'de `disagreement = 100 - consensus`,
  ikisi ayrı ölçüm değildir.
- `aiReadiness` artık `null` değildir: `company_health_score`'un
  "AI hazırlığı" bileşeni gerçek karşılığıdır.

**Sahibe bırakılan:** onay UX'i ve gerekçe politikası, yeni ürün
kavramlarının istenip istenmediği. `13-backend-recommendations.md` §15.

**Etki:** `09-data-contracts.md` (kanonik değil işaretlendi),
`09b-verified-contracts.md` (yeni), `types/executive.ts`,
`confidence-badge.tsx`, `ai-recommendation-card.tsx`, `council-view.tsx`,
`director-card.tsx`, `10b`, `10c`, sprint sırası (S5.5 eklendi).

---

## UI-ADR-099 — Kabuk onarımı, durum hafızası ve saf getSnapshot (S5.5)

**Durum:** ✅ Dondurulmuş
**Tarih:** 30 Temmuz 2026 — S5.5 Sözleşme Hizalama
**Kaynak:** 16-audit-s1-s5.md (üç gerçek eksik + bir kesin kod hatası)

**Dört düzeltme:**

1. **Belge scroll invariant'ı (P0).** `html, body { height:100%;
   overflow:hidden }`. Kabuktaki `h-screen overflow-hidden` yetmiyordu;
   Space/Home/End belgeyi kaydırıp header'ı ekrandan çıkarabiliyordu.
   Ölçüm: onarım sonrası tekerlek/End/Space üçü de `scrollY 0`.
   Not: programatik `scrollTo` overflow:hidden'da bile çalışır — bu
   tehdit değildir ve test KULLANICI eylemini ölçer.
2. **Scroll restore.** Yazılmıştı ama ÇALIŞMIYORDU: kayıt
   `useLayoutEffect` cleanup'ındaydı; o an yeni içerik commit edilmiş ve
   tarayıcı scrollTop'u kısa içeriğe clamp'lemiş oluyordu — her geçiş 0
   kaydediyordu. Kayıt artık scroll OLAYINDA (rAF-throttle); geri
   yükleme, mock içerik effect tick'inde geldiği için hedefe ulaşana dek
   en fazla 10 frame dener.
3. **Kart açıklığı hafızası.** Bileşen-yerel `useState`,
   `key={pathname}` unmount'unda kayboluyordu. `useDisclosureMemory`
   (navigation store, workspace-kimlikli `expandedIds`) — BELLEK-İÇİ,
   diske yazılmaz: dünkü açık kart bugünün verisinde anlamsızdır.
4. **`useMockData` saf değildi.** `getSnapshot` içinde cache doldurmak
   React 19 concurrent modda tearing üretebilir (yazılımcılar: "kesin
   hata"). Store modül seviyesine (üreticiye WeakMap ile bağlı) taşındı;
   üretim effect'te, `getSnapshot` yalnızca okur.

**Ayrıca:** ConfidenceBadge ODIN'in kanonik 5 bandına geçti
(80/60/40/20 → çok yüksek/yüksek/orta/düşük/çok düşük); uydurma 50
eşiği silindi. `ConfidenceBreakdown` iç bileşeni eklendi — 8 kanonik
bileşen, ağırlıklar ve negatif yön işaretiyle.

**Etki:** `globals.css`, `workspace.tsx`, `lib/store/navigation.ts`,
`mocks/use-mock.ts`, `confidence-badge.tsx`, `confidence-breakdown.tsx`,
KPI/karar/öneri kartları.

---

## UI-ADR-100 — Karar modeli ODIN DecisionRecord'a hizalandı; üç verdict

**Durum:** ✅ Dondurulmuş
**Tarih:** 30 Temmuz 2026 — S5.5
**Değiştirir:** ♻️ UI-ADR-091 (alternatif kuralının YERİ)

**Tip hizalaması (09b §1):** `Decision` artık ODIN kaydının görünümüdür:
`question · date · tier(D1/D2/D3) · status(open/monitoring/closed) ·
alternatives(option/assessment/risk, min 2) · recommendation ·
humanDecision`. UYDURULMUŞ 13 alan silindi (priority, financialImpact,
riskLevel, aiConfidence, expectedROI, directorOpinions, timeline, score…).
`AIRecommendation` ODIN'in 10 zorunlu alanını taşır; KAYIP üç alan
eklendi ve görünür: `flip_conditions` (kartta HER ZAMAN görünür blok),
`assumptions`, `confidence_breakdown`.

**♻️ UI-ADR-091 revizyonu:** "alternatives<2 ise öneri render edilmez"
kuralı önerinin DEĞİL kararın alanına aitti (şema minItems 2). Kural
şimdi doğru yerde: alternatifler DecisionCard'da çizilir;
`canRenderRecommendation` ODIN'in 10 zorunlusunu arar — eksikse öneri
yine sessiz `null`, bastırmayı çağıran yazar (o kısım değişmedi).

**Üç verdict (meclis kararı, sahip onaylı):** Onayla · Reddet · Ertele —
ODIN sözlüğü. Gerekçe kuralı ODIN ADR-0131'in A/B/C kuralıdır: B/C'de
her verdict ≥8 karakter gerekçe ister (onay dahil); `deferred` gelecek
tarih ister. UI kural İCAT ETMEZ, `ceo verdict`i yüzeye taşır; kalıcı
kayıt S7'de `/api/command` üzerinden (ER-0025). Bayat-veri kilidi
(UI-ADR-092) üç eyleme genişledi.

**Consensus düzeltmesi:** ODIN'de `disagreement = 100 − consensus`
(consensus.py, türetilmiş). 10b §11'in "ikisi ayrı ölçümdür" metni
yanlıştı; CouncilView artık skorları öneriden okur ve türetimi açıkça
yazar. Director pozisyon satırları kayıtta saklanmadığı için (not_exposed)
çizilmez; azınlık görüşleri ODIN'in verdiği düz metin listesidir.

**Drift muhafızı:** `contracts/odin/` altında şema snapshot'ı (ODIN commit
0d76dae) + ODIN'in KENDİ doğrulayıcısından geçirilmiş kanonik örnek +
`src/types/odin-contract.test.ts` (9 test). FR-0039 kanalı yayına girince
snapshot pinlenmiş artefakta döner.

**Kapsam dışı (bilinçli):** DirectorHeartbeat→AgentHealth hizalaması ve
ExecutiveKPI/Alert/Opportunity/Mission tipleri — FR-0046 kararını bekler;
S6 o karara kapılıdır.

**Etki:** `types/odin.ts` (yeni), `types/executive.ts`,
`decision-card.tsx` (verdict formu), `council-view.tsx`,
`minority-opinion-banner.tsx`, `decision-queue.tsx` (tier sıralaması),
`ai-recommendation-card.tsx`, mocks, fixtures, 8 story dosyası.

---

## UI-ADR-111 — DirectorCard AgentHealth kaydına hizalandı; canlılık eşiği UI'da türetilmez

**Durum:** ✅ Dondurulmuş
**Tarih:** 30 Temmuz 2026 — S5.5-b
**Danışılan:** gavadolar (terra · luna) — "ŞİMDİ-BEN", iki görüş de aynı
yönde; "eşik icat edilmemeli" ikisinin de açık şartı
**Değiştirir:** ♻️ UI-ADR-089/090'ın Director bağlamındaki kullanımı

**Sorun:** `DirectorHeartbeat` tipi 8 UYDURULMUŞ alan taşıyordu
(status/currentGoal/currentTask/confidence/taskCount/evidenceCount/
recommendationCount/memoryHealth/predictionStatus/beatIntervalMs) ve
ODIN'in GERÇEK ürettiği metrikleri hiç göstermiyordu. 09b §5'e ilk yazımda
"FR-0046 ile birlikte" notu düşülmüştü — YANLIŞTI: `AgentHealthMonitor`
ODIN'de mevcuttur, FR-0046'ya bağlı değildir. Kendi notum düzeltildi.

**Karar:**
1. Tip `AgentHealth` oldu — `AgentHealthMonitor.snapshot()` ile birebir:
   verdict (unknown/healthy/unhealthy — health.py yalnız bu üçünü yazar) ·
   consecutive_failures · last_success/failure · metrics{latency avg/p95,
   success_rate, error_rate, tokens_used, cost_usd, queue_length,
   availability, last_heartbeat} · checked_at.
2. **Canlılık kuralı UI'da TÜRETİLMEZ.** Eski "beatIntervalMs × 3
   aşıldıysa offline" eşiği UI icadıydı; kaldırıldı. Durum ODIN'in
   verdict'idir; `last_heartbeat` yaş olarak YAZILIR, yorumlanmaz.
   `liveness()` fonksiyonu ve testleri silindi.
3. `HeartbeatIndicator` bileşeni kaldırıldı: sözleşmesi (beatIntervalMs)
   kaynaksız kaldı. "Atım başına tek nabız" ilkesi (UI-ADR-090) bir gün
   gerçek bir atım akışı sözleşmesi doğarsa geri gelir — ilke geçerli,
   uygulanacak verisi yok.
4. Mission Control "Operational Status" sayacı verdict sayar
   (healthy/unhealthy/unknown) — eşik değil kayıt.

**Etki:** `types/executive.ts` (AgentHealth), `director-card.tsx` (yeniden;
gecikme/başarı/hata/maliyet artık görünür), `heartbeat-indicator.*`
(silindi), `lib/clock/tick.ts` (liveness silindi), `mission-control.tsx`,
mock + fixtures + story'ler.

## UI-ADR-116 — Hesaplanamayan kâr gösterilmez; yerine Gross Profit + hariç tutulanlar

> ♻️ *Eski numara UI-ADR-099.* S5.5 paralel oturumu aynı numarayı `main`'e
> yayınladı; çakışma 116/117'ye taşınarak çözüldü (aşağıdaki not).

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S6 Amazon Director
**Danışılan:** gavadolar (terra · luna) — ikisi de "Net Profit sayısal KPI
olarak çizilmesin" dedi; **ayrıldıkları nokta** ikame kartın yanına ayrı bir
"hesaplanamıyor" satırının konup konmayacağıydı (terra: gereksiz gürültü,
luna: açıkça yazılsın). Karar sentezdir: ikame kart TEK, gerekçe TEK yerde
(Executive Glance) ve şeridin altında tek satır atıf.

**Sorun:** `09-data-contracts.md` §8 `netProfit: Money` diyor — zorunlu alan.
Gerçekte net kâr = satış − Amazon ücretleri − reklam − iade − COGS − nakliye.
**COGS Amazon'da yoktur**, kullanıcı girer ve girilmemiştir. Zorunlu bir alan
"hesaplanamadı"yı ifade edemez; tek çıkış uydurmaktır.

**Karar:** Üç parça.

1. **Net kâr hesaplanamıyorsa hiç çizilmez.** KPI şeridinde "Net Profit" adlı
   bir kart YOKTUR. Boş bir Net Profit kartı da basılmaz — kalıcı olarak boş
   bir gösterge bilgi kirliliğidir (UI-ADR-096'daki `AI Readiness` dersi).
2. **Yerine `Gross Profit (ücretler hariç)`** ve **neyin hariç tutulduğu
   listelenir.** Liste süs değildir: `profitBasis.excluded` doldurulmadan
   gross profit gösterilmez.
3. **Aynı kural her kâr metriğine uygulanır.** `PPCOverview.profitAfterAds`
   ve `SkuHealth.grossMarginPerUnit` de kâr metriğidir; ikisi de `null` gelir
   ve gerekçesiyle boş görünür. Kural metriğe göre değil, **kavrama** göre
   çalışır — yoksa bir sonraki kâr alanında yeniden tartışılır.

**Sözleşme sapması (13-...md §15.1'e soru olarak düşüldü):**
`netProfit: Money | null` · opsiyonel `grossProfit` · opsiyonel
`profitBasis.excluded` · `PPCOverview.profitAfterAds: Money | null`.
Ayrıca `AmazonSnapshot` ve `PPCOverview` için zorunlu `percentScale`
(UI-ADR-093'ün §8/§9'da karşılığı yoktu).

**Gerekçe:** Yanlış bir kâr rakamı, eksik bir kâr rakamından tehlikelidir —
**makul görünür ve sorgulanmaz.** 13-...md §4 zaten bunu emrediyordu; bu ADR
onu arayüz davranışına çeviriyor ve diğer yedi workspace'e kopyalanacak
şablonu belirliyor.

**🟢 BACKEND'DE KARŞILIĞI VAR — sonradan doğrulandı.** UI-ADR-098 (S5.5) ODIN
deposunu okudu ve `09b-verified-contracts.md` §8'e şunu yazdı:
`odin/amazon_director.py` net kâr için `realized_net_profit_usd` hesaplıyor,
**hesaplayamıyorsa alana `"Data Required"` yazıyor.** Yani bu karar bir
arayüz tercihi değil, backend'in zaten uyguladığı davranışın arayüzdeki
karşılığıdır. `netProfit: null` ↔ `"Data Required"` eşlemesi S8'de
doğrudan kurulur.

**Reddedilen alternatif:** "Net Profit" kartını çizip değerini `NoData`
yapmak. Kalıcı boş kart, gürültü üretir ve CEO her gün aynı boşluğa bakar.

**Etki:** `types/executive.ts`, `mocks/amazon.ts`,
`screens/amazon-director.tsx`, `executive/ppc-overview.tsx`,
`screens/amazon-sku-panel.tsx`.

---

## UI-ADR-117 — Simülatör hesap yapmaz; senaryolar veriden gelir

> ♻️ *Eski numara UI-ADR-100.*

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S6
**Danışılan:** gavadolar (terra · luna) — iki görüş de aynı yönde, ikisi de
kaydırıcılı istemci hesabını açıkça reddetti.

**Sorun:** `06-workspaces.md` §1.5 K4 "PPC bütçesini %15 artırırsak ne olur?"
istiyor. ODIN'de tahmin/simülasyon motoru **yok** (13-...md §6). Kaydırıcı
koyup elastikiyet katsayısıyla istemcide hesaplasak — formülü göstersek bile —
olur mu?

**Karar:** Hayır. Üç kural.

1. **İstemci hiçbir sayı hesaplamaz.** Senaryolar zarftan gelir; kullanıcı
   yalnızca hazır vakalar arasında seçim yapar.
2. **`assumptions[]` boşsa sonuç HİÇ gösterilmez** ve elenen senaryo sayısı
   yazılır. Varsayımları görünmeyen simülasyon, açıklanmamış bir AI
   çıktısıdır (09-...md §9).
3. **Kaynak gerçek bir motor değilse etiket görünür:** `meta.source === "mock"`
   iken başlıkta `SİMÜLASYON — MOCK`. Hiç senaryo yoksa panel gerekçeli boş
   durum gösterir, kendi senaryosunu üretmez.

**Gerekçe (terra'nın cümlesi):** elastikiyet katsayısının veri/model kaynağı
yoksa bu "hesap makinesi" değil, **sahte tahmindir**; formülü göstermek onu
meşrulaştırmaz. İleride kaynağı sözleşmeli, açıkça "deterministik
hesaplayıcı" adıyla ayrı bir özellik olabilir — "AI Simulator" olamaz.

**Etki:** `executive/simulation-panel.tsx`, `types/executive.ts`
(`SimulationCase`), `mocks/amazon.ts`.

---

## UI-ADR-101 — Sözleşmesi olmayan bölüm: ne zaman teklif, ne zaman boş

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S6
**Danışılan:** gavadolar — **ikisi de bu kararın tersini önerdi.** Karar
gerekçesiyle birlikte aşağıda; çelişki bilinçlidir.

**Sorun:** S5'te iki farklı şey yapıldı: `Mission` için 🟡 TEKLİF sözleşme
yazılıp mock ile beslendi, `Project`/`ResourceAllocation`/`AutomationQueue`
için gerekçeli boş durum bırakıldı (UI-ADR-096). Ayrım kriteri yazılmamıştı.
S6'da aynı soru SKU için çıktı: `09-data-contracts.md`'de SKU sözleşmesi
**yok**, ama ekranın merkezinde SKU Health tablosu ve SKU bağlam paneli var.

**gavadolar'ın görüşü:** ikisi de **(a) boş bırak** dedi. terra'nın kriteri:
"teklif ancak her alanın kaynak karşılığı varsa". luna'nın kriteri: "bölüm
merkezîyse ve kullanıcı operasyonel gerçeklik sanacaksa boş bırak".

**Karar: SKU için TEKLİF yazıldı (b).** Kriter şudur:

| Koşul | Sonuç |
|---|---|
| Alanların **kaynağı** biliniyor (SP-API / Ads API / hesaplanabilir) | 🟡 TEKLİF + mock |
| Alanların kaynağı da yok, bölüm başka bir workspace'in görünümü | gerekçeli boş durum |

SKU alanları — stok, satış hızı, dönüşüm, ACOS, BuyBox — **SP-API ve Ads
API'de kaynağı olan** ölçümlerdir; eksik olan sözleşme yazımıdır, ölçüm
değil. `Project`/`ResourceAllocation`'da ise ölçümün kendisi yoktur.

**luna'nın "merkezî bölüm" kriteri REDDEDİLDİ:** aynı kriter S5'te Mission
Board'u da yasaklardı — o Mission Control'ün Primary Focus Area'sıydı, sahip
onayladı ve yayına girdi. Merkezîlik bir dürüstlük ölçüsü değildir; **kaynağın
varlığı** ölçüdür. Merkezî bölümü boş bırakmak, referans modülü boş bir ekrana
çevirir ve S6'nın amacı olan "diğer yedi workspace'in şablonu"nu üretemez.

**Yerine alınan sıkılaştırma (gavadolar'ın haklı olduğu yer):** teklif
sözleşmedeki her alan mock'ta doldurulmaz — kaynağı olmayan alan mock'ta da
`null` kalır. `SkuHealth.grossMarginPerUnit` (COGS ister) her SKU'da `null`,
`buyBoxRate` kaynağı doğrulanmamış SKU'da `null`, `healthScore` üretilmemişse
`null`. Bölüm başlığı sözleşmenin **teklif** olduğunu söyler.

**Etki:** `types/screens.ts` (`SkuHealth`), `mocks/amazon.ts`,
`screens/amazon-director.tsx`, `screens/amazon-sku-panel.tsx`,
`13-backend-recommendations.md` §15.2.

---

## UI-ADR-102 — Kutbu bilinmeyen metrik renklendirilmez

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S6 görsel incelemesi

**Sorun:** `ExecutiveKPICard` dosyasında "Trend RENKLENDİRİLMEZ — yukarı her
metrik için iyi değildir (ACOS yükselmesi kötüdür)" yazıyor. Ama kartın
içindeki `Sparkline` varsayılan `tone="auto"` ile çalışıyor ve **yükselişi
yeşil** boyuyor. Ekranda ACOS %14,2 → %18,1 yükselirken çizgi yeşildi: kart
kendi kuralının tam tersini söylüyordu. Hiçbir test bunu yakalamadı; yalnızca
768 px'te ekrana bakınca görüldü.

**Karar:** `ExecutiveKPI` sözleşmesinde metriğin **kutbu** (yukarı iyi mi?)
yoktur; dolayısıyla doğru renk **bilinemez**. Bilinmeyen bir şeyi renkle iddia
etmektense hiç iddia etmemek doğrudur → `ExecutiveKPICard` sparkline'ı
`tone="neutral"` ile çizer. Yön zaten glyph (▲ ▼ ■) ve `sr-only` kelimeyle
veriliyor; renk bilgi eklemiyordu, **yanlış bilgi ekliyordu.**

`Sparkline`'ın `auto` kipi kaldırılmadı: kutbu gerçekten bilinen bir çağıran
onu kullanabilir. Karar, varsayımın nerede yapıldığıyla ilgilidir.

**Aynı ailedeki iki görsel düzeltme (ADR gerektirmedi, 10c §7.5'te kayıtlı):**
kart başlığı artık kırpılmıyor (sarıyor) ve KPI kolonu belirli bir genişliğin
altına inmiyor.

**Etki:** `executive/executive-kpi-card.tsx`. Executive Briefing de aynı
kartı kullandığı için oradaki KPI'lar da düzeldi.

---

## UI-ADR-103 — Mock veri iç tutarlılığı: sayılar birbirini doğrulamak zorundadır

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S6 kapanış görsel incelemesi
**Danışılan:** gavadolar (terra · luna) — "ihlal mi?" sorusunda ikisi de aynı
yönde; **çapa seçiminde ayrıştılar**, karar sentezdir

**Sorun:** PPC Performance kartı dört sayıyı YAN YANA gösteriyor:

```
Spend  $2.420    Sales  $18.300    ACOS  %18,1    ROAS  5,4
```

Bu dördü birbirini yalanlıyordu: `2.420 / 18.300 = %13,2` ve oran `7,6`.
Beşinci bir çelişki daha vardı: TACOS %9,4 iddiası, ekrandaki harcamayla
`2.420 / 4.182.000 = %0,058` — **160 kat** uyumsuz. Üstelik ekranın tamamı ₺
iken yalnızca bu kart $ idi.

Değerler `06-workspaces.md` §1.5'teki örnek tablodan birebir kopyalanmıştı;
**dokümanın kendi örneği tutarsız.**

**Karar:** Mock veri, gerçek veri kadar **iç tutarlı** olmak zorundadır.
Anti-fake kuralı "veri uydurma" ile bitmez; **birbirini yalanlayan sayılar
da sahtedir.** Üç uygulama:

1. **Tek para birimi.** Ekranda TEK birim vardır. Farklı birimdeki
   harcama ciroyla oranlanamaz; TACOS böyle bir ekranda anlamsızdır.
   **Hangi birim olduğu sahibin kararıdır — bkz. aşağıdaki ♻️ notu.**
2. **Türetilebilir alanlar birbirinden türetilerek yazılır.** PPC kartı
   artık `3.187 / 17.608` taşıyor: ACOS %18,1 ✓, ROAS 5,5 ✓,
   TACOS `3.187 / 99.600` = %3,2 ✓ ve bu değer snapshot ile aynı.
   Her SKU'nun kendi ACOS'u da harcama/satışından birebir çıkıyor.
3. **Doküman örneği düzeltilmez, işaretlenir.** §1.5'teki tablo bir
   ÖRNEKTİR, sözleşme değil; oraya not düşüldü.

**Çapa neden ACOS/TACOS değil, harcama/satış oldu — terra ile luna burada
ayrıştı.** terra ACOS %18,1'i sabit tutup satışı türetmek istedi (ACOS
ekranda dört yerde geçiyor); luna harcama/satışı sabit tutup ACOS'u %13,2'ye
çekmek istedi. İkisi de **TACOS'u kontrol etmemişti.** TACOS hesaba katılınca
terra'nın çapası %52 reklam-atıflı ciro üretiyordu — matematiksel olarak
tutarlı ama iş olarak abartılı. Seçilen üçüncü yol her iki sınavı da geçiyor:
ACOS %18,1 korunur (dört yerdeki metin bozulmaz), harcama gerçekçi kalır
($3.187 / $99.600) ve tek değişen görünen değer TACOS'tur — o da zaten
**hiçbir zaman doğrulanabilir değildi.**

**Gerekçe:** Kullanıcının bir gösterge tablosuna güveni, sayıların birbirini
doğrulamasından gelir. Bir CEO kafadan bölme yapar. İlk çelişkiyi gördüğü an
— veri mock olsun ya da olmasın — ekrandaki hiçbir sayıya bir daha güvenmez.
UI-ADR-094'ün "mock zararsızdır çünkü fark edilebilir" gerekçesi, mock'un
**kendi içinde tutarlı** olmasına bağlıdır; tutarsız mock, S8'de gerçek veri
gelince fark edilmez ve sessizce kalır.

**Arayüz yine hesap yapmaz.** Tutarlılık üretici katmanda (`src/mocks/`)
kurulur; UI dört sayıyı da olduğu gibi basar (UI-ADR-093 / UI-ADR-099 ile
aynı yön). Bu bir türetme değil, **veri kalitesi kuralıdır.**

**Etki:** `src/mocks/amazon.ts` (PPC kartı, TACOS, 14 SKU reklam alanı, CPC
kanıtı, öneri sayıları), `src/mocks/amazon.test.ts`,
`13-backend-recommendations.md` §16.6, `06-workspaces.md` §1.5 notu.

---

### ♻️ Güncellendi — para birimi USD (sahip kararı, 29 Temmuz 2026)

Kararın **ilkesi değişmedi**: ekranda tek para birimi olur ve türetilebilir
alanlar bileşenlerinden yazılır. Değişen, o birimin hangisi olduğudur.

İlk uygulamada ₺ seçilmişti (ekranın geri kalanı ₺ idi). **Sahip USD dedi:**

> "para birimi Amazon'daki gibi dolar olsun çünkü kurlar devamlı değişiyor"

**Gerekçe — ve bu gerekçe teknik olarak da doğrudur:** Amazon US
marketplace'inde satış, referral/FBA ücretleri ve reklam harcaması USD
cinsinden gerçekleşir. Bunları ₺'ye çevirmek her raporu **değişken bir kura**
bağlar: SKU'nun ACOS'u hiç değişmese bile ₺ karşılığı her gün oynar ve dünkü
ekranla bugünkü ekran karşılaştırılamaz hâle gelir. Operasyonel bir kararın
(teklif düşür, stok aç) kur hareketiyle kirlenmemesi gerekir. **Kur riski
Trading workspace'inin konusudur, Amazon operasyonunun değil.**

Tüm Amazon mock'u USD'ye çevrildi (42 tutar). Oranlar birimsiz olduğu için
ACOS · ROAS · TACOS **birebir korundu** ve bunu `amazon.test.ts` doğruladı —
dönüşüm sonrası 44 testin tamamı ilk koşumda yeşil geçti. Kapı bu yüzden
var: para birimi değişikliği gibi geniş bir dokunuş, elle kontrolle güvenli
yapılamaz.

**Sınır — iki para birimi bir arada YAŞAR, ama karşılaştırılmaz:** Executive
Briefing gibi şirket geneli ekranlar sahibin raporlama para biriminde (₺)
kalır; Amazon workspace'i marketplace para birimindedir (USD). İkisi
**toplanamaz ve oranlanamaz.** Dönüştürme backend'in işidir ve kullanılan
kur + kur tarihi zarfa girmelidir; arayüz kur çevirmez (13-...md §16.6).
Bu kural gelene kadar hiçbir ekran iki birimi tek bir hesapta birleştirmez.


---

## UI-ADR-104 — `SkuHealth` revizyonu: dönem veride, skor gerekçeli, durum eşikli

**Durum:** ✅ Dondurulmuş
**Tarih:** 29 Temmuz 2026 — S6 kapanışı, sahibin talimatıyla
**Danışılan:** gavadolar (terra · luna) — **dört maddede de aynı yönde**,
ikisi de "sözleşme yetersiz, S8'den önce revize edin" dedi

**Sorun:** `SkuHealth` bir 🟡 TEKLİFTİ (UI-ADR-101) ve dört yerde eksikti.
Sözleşme henüz ratifiye edilmediği için düzeltmenin maliyeti bugün sıfıra
yakın; S8'de gerçek veri bağlandıktan sonra yüksek olurdu.

**Karar — dört değişiklik:**

**1. Dönem alan adından veriye taşındı.**
`unitsSoldLast30d` · `revenueLast30d` · `adSpendLast30d` gibi alanlar pencereyi
ADLARINDA taşıyordu. 7/30/90 gün karşılaştırması istendiği an bu şema
üçe katlanırdı. Artık `sales: { period, … }` ve `advertising: { period, … }`.
Ek bir kural: satış ile reklam **aynı dönemi** kullanmak zorunda — farklı
pencerelerin ACOS'u ile cirosu yan yana gösterilirse karşılaştırılamaz iki
sayı üretilir (test bunu doğruluyor).

**2. Türetilmiş skorun gerekçesi zorunlu oldu — ADR-0085.**
`healthScore` bir formülün çıktısıydı ve **neden o değer olduğu hiçbir yerde
yazmıyordu.** ODIN'in Explainability Envelope kuralı tam olarak bunu yasaklar:
gerekçesiz türetilmiş skor, açıklanamayan bir AI çıktısıdır. Kullanıcı "38"
görür, ne yapacağını bilemez.

`healthScoreExplanation: ScoreFactor[]` eklendi; `code` (makine) + `message`
(insan, **backend yazar** — arayüz cümle kurmaz) + `contribution` + `direction`.

Sert kural: **katkılar 100'den skora götürmek zorunda** (100 − 28 − 22 − 12 = 38).
Toplamayan bir gerekçe gerekçe değildir; kullanıcı katkıları toplar, skoru
bulamazsa açıklamanın uydurma olduğunu düşünür — ki haklıdır.

terra'nın ek noktası alındı: **skor `null` iken de gerekçe gelebilir.**
Bir şeyin NEDEN hesaplanamadığı da bir açıklamadır (`AD_DATA_MISSING`).

**3. `status` ile `healthScore` arasındaki çelişki kapatıldı.**
İkisi ayrı alandı ve hangisinin kazandığı belirsizdi. Mock'ta zaten
çelişiyorlardı: **SKU-4102 skoru 55 iken "İzlemede", SKU-1188 skoru 64 iken
"Riskli"** — daha kötü skorlu SKU daha iyi etiketliydi.

`statusBasis: "health_score" | "rule_set"` eklendi. `health_score` ise durum
eşik tablosuyla tutarlı olmak zorundadır (test doğruluyor); `rule_set` ise
durum skordan bağımsız bir kuraldan gelir ve **ekran bunu açıkça söyler**.

Eşik tablosu **backend politikasıdır**; arayüz onu render için kullanmaz.
Mock'ta durmasının tek sebebi mock'un backend yerine geçmesidir.

**4. `grossMarginPerUnit` KALDIRILDI.**
COGS Amazon'da yok ve girilmemiş; alan kalıcı olarak `null` kalacaktı.
terra'nın ifadesiyle bu **sahte bir sözleşme kapasitesidir**: "bir gün
dolacak" izlenimi verir, dolmaz. Anti-fake kuralı burada sözleşmenin
kendisine uygulandı.

**Alan kalktı ama açıklama kaldı:** panelde "Birim kâr — COGS girilmediği
için hesaplanamıyor" satırı duruyor. Bu bir veri alanı değil, bir cevaptır;
CEO'nun birim kârı neden göremediğini bilmesi gerekir.

**Ek: `inventoryAsOf`.** Envanter anlık görüntüsünün yaşı, zarfın
`lastUpdated`'ından farklıdır — satış raporu 30 dakikalık, FBA envanteri
6 saatlik olabilir ve **tükenme kararı bu tazeliğe bağlıdır.**

**Uygulanmayan öneriler ve gerekçesi:**
- `statusPolicyVersion` / `policyVersion` (terra) — üreten backend, tüketen
  arayüz yok. Sürüm dizesi bugün hiçbir soruyu cevaplamıyor; ihtiyaç
  doğduğunda eklenir. §16.2'ye not düşüldü.
- Çok dönemli dizi (`sales: […]`, luna) — 7/90 gün karşılaştırması hiçbir
  ekranda yok. Tek dönem nesnesi şemayı bugünden generic yapar, olmayan bir
  arayüzü inşa etmeden.
- `buyBoxRate`'in sözleşmeden çıkarılması (terra/luna) — **uygulanmadı.**
  BuyBox Rate sahibin şartnamesinde zorunlu bir KPI ve ekranda kendi bölümü
  var; kaldırmak tanımlı bir özelliği silmek olurdu. Asıl istenen şey
  **kaynağın netleşmesi**; soru §16.2'de keskinleştirildi.

**Etki:** `types/screens.ts`, `mocks/amazon.ts`, `mocks/amazon.test.ts`
(+6 değişmez, toplam 50 birim testi), `screens/amazon-director.tsx`,
`screens/amazon-sku-panel.tsx` (skor gerekçesi artık ekranda).

---

## Numara çakışması — S6 ↔ S5.5 (31 Temmuz 2026)

S6 (29 Tem) ve S5.5 (30 Tem) iki paralel oturumda yazıldı; ikisi de
**UI-ADR-099 · 100**'ü aldı. ODIN ADR-0124 protokolü "ilk tahsis korur"
diyor ve ölçüme göre S6 önceydi — **ama uygulanmadı ve gerekçesi şudur:**
S5.5'in numaraları `main`'e **yayınlandı**, üstüne UI-ADR-111 kondu ve S7
(112-115) o diziyi varsayarak yazıldı. Yayınlanmış bir trunk'ı ve iki bağımlı
dalı geri almak, tek birleştirilmemiş dalı taşımaktan kat kat pahalıdır.
Protokolün AMACI en az kargaşadır; burada amaç, harfine uymayı yendi.
**S6'nınkiler 116 · 117'ye taşındı**, eski numaralar başlıklarda aranabilir.

Bu, aynı dosyadaki **üçüncü** çakışmadır (098, 099/100 iki kez). Kural
CLAUDE.md §6'da: numara almadan önce dosyanın SONUNA VE `main`'e bak.

---

## UI-ADR-106 ♻️ — FR-0046 ODIN ADR-0143 ile mühürlendi; UI ona uyduruldu

**Durum:** ✅ Dondurulmuş — *bu karar 30 Temmuz'daki ilk hâlini DEĞİŞTİRİR.*
**Tarih:** 31 Temmuz 2026
**Kaynak:** ODIN `docs/adr/adr-0143-ui-product-concepts.md`

**Ne oldu:** 30 Temmuz'da FR-0046 için bir meclis sentezi yazıp (gavadolar +
sistemciler) UI tiplerini ona göre kurmuştuk. Sahip aynı gün dördünü de
onayladı ve karar ODIN tarafında **ADR-0143** ile mühürlendi — **ve mühürlenen
metin bizim sentezimizle aynı değildi.** Kanonik olan ODIN'dir (UI-ADR-098);
dolayısıyla sentez değil, ADR-0143 uygulandı. Dört farkın tamamı:

| Konu | Bizim sentezimiz (yanlış) | ADR-0143 (kanonik, uygulandı) |
|---|---|---|
| KPI zarfı | İç içe `value: {status,value,reason}` | **DÜZ**: `status`/`value`/`reason`, `unit`/`currency`/`scale`/`as_of` ile aynı seviyede (§2) |
| KPI ek alanlar | `metricKey` · `source` icat edilmişti | Zarfta YOK → silindi |
| KPI katmanları | sparkline/forecast/insight *opsiyonel* tutulmuştu | Sözleşmenin **PARÇASI DEĞİL** → tipten de karttan da silindi (§2) |
| Alert severity | `critical\|high\|medium\|low` uydurulmuştu, opsiyoneldi | **`critical\|risk\|warning\|info`**, ZORUNLU (§1) |
| Alert alanları | `source`/`summary`/`asOf` | **`module`/`evidence[]`/`created_at`/`suggested_action`** (§1) |
| Opportunity | Ayrı tip yazılmıştı | **AYRI KAYIT DEĞİL** — öneri kayıtlarının görünümü; tip SİLİNDİ (§3) |
| Mission | `Goal`'e emekli edilmişti (goals.py) | **Goal de değil**: "izlenen kararlar + vadesi gelen ertelemeler" görünümü (§4) |

**Ders (bu satır kalıcıdır):** meclis sentezi bir ÖNERİDİR, karar değildir.
Sahibin onayı ODIN governance'ında bir ADR'ye dönüşene kadar UI o sentezi
kanonik sayamaz. 30 Temmuz'da tipleri "sahip onayladı" diye dondurmak
erkendi; doğru sıra **ADR mühürlenir → UI tipler**. UI-ADR-098'in kendisi
zaten bunu söylüyordu.

**Uygulama:** `types/executive.ts` (ExecutiveKPI düz zarf · Alert kanonik
zarf · Opportunity tipi silindi), `executive-kpi-card.tsx` (tek katman),
`alert-stack.tsx`, `opportunity-card.tsx` **silindi**, mock'lar ve
`amazon.test.ts` kapıları, 09b §10, 10b §1/§9/§10.

**Açık kalan (13-...md §17):** öneri kaydının POZİTİF SINIFINI hangi kayıtlı
alan işaretler? Bildirilene kadar fırsat görünümü filtre UYGULAMAZ ve
neyi filtrelemediğini ekranda yazar — uydurma bir sınıf çıkarımı yapılmaz.

---

## UI-ADR-107 ♻️ — Mission: Goal değil, "izlenen kararlar + vadesi gelen ertelemeler" görünümü

**Durum:** ✅ Dondurulmuş — *ilk hâlini (Goal'e emekli) DEĞİŞTİRİR.*
**Tarih:** 31 Temmuz 2026
**Kaynak:** ODIN ADR-0143 §4

30 Temmuz'da `Mission`ı ODIN ADR-0132'ye dayanarak `Goal`'e (goals.py
`progress_pct`) emekli etmiştik. **ADR-0143 §4 daha ileri gitti:** Mission bir
kavram olarak reddedildi ve yerine geçen şey Goal DEĞİL, zaten kayıtlı olan
gerçekliktir:

- `status: "monitoring"` kararlar + `monitoring_checkpoints`'leri
- `lifecycle.due_deferrals()` — **vadesi gelmiş** ertelemeler

**Uygulama:** `Goal` tipi de silindi (bir gün yaşadı), `GoalBoard` →
**`MonitoredDecisionsBoard`**; Mission Control'ün Primary Focus alanı artık
`decisionsMock` üzerinden gerçek karar kayıtlarını gösteriyor. İki saf
fonksiyon dışa açıldı ve test edilebilir: `monitoredDecisions()` ·
`dueDeferrals()` (vade = `revisitAt <= now`, tahmin değil tarih
karşılaştırması).

**`progressPercent` ÜRETİLMEDİ.** ADR §4 son cümlesi: ilerleme yüzdesi kendi
ölçülmüş kaynağını ister ve bu ADR onu yaratmaz. Amazon Glance'taki "Goal
Progress" kartı da bu yüzden kaldırıldı — ölçüsü olmayan yüzde uydurmadır.

**"Upcoming Deadlines"** bölümü gerekçeli boş duruma döndü: Mission ile
birlikte `deadline` kavramı da düştü; ertelemelerin vadesi ana tahtadadır.

---

## UI-ADR-108 ♻️ GERİ ÇEKİLDİ — belge scroll'u zaten S5.5'te kapatılmıştı

**Durum:** ⛔ Geri çekildi (uygulanmadı)
**Tarih:** 31 Temmuz 2026

30 Temmuz'da S6 dalında belge scroll'u için `fixed inset-0` +
`html/body overflow:hidden` yazıp UI-ADR-108 numarasını almıştım. Merge
sırasında görüldü ki **aynı P0, `main`'de S5.5'in UI-ADR-099'u ile zaten
kapatılmış** — üstelik daha kapsamlı: o karar scroll geri yüklemeyi (P1) ve
`getSnapshot` saflığını da düzeltiyor. İki uygulamadan biri fazlalıktır;
`main`'inki korundu, benimki geri çekildi.

Numara **yeniden kullanılmaz** (silme yasağı, CLAUDE.md §6): 108 bu kaydın
kendisidir. Ölçüm merge sonrası tekrarlandı — 3 ekran × 3 genişlikte
`html` scrollHeight === viewport.

**Karar (denetimin reçetesi birebir):** `html, body { height:100%;
overflow:hidden }` + kabuk kökü `h-screen` yerine **`fixed inset-0`** —
kabuk belge akışından çıkar, belge yüksekliğine katkı sıfırlanır ve belge
scroll'u YAPISAL olarak imkânsızlaşır; CSS'i geri açan biri bile kabuğu
kaydıramaz. Ölçüm: 3 ekran × 3 genişlik (1920/1440/768) html
scrollHeight === 900 (viewport), yatay taşma 0.

**Etki:** `globals.css`, `app-shell.tsx` (tek satır sınıf değişimi).

---

## UI-ADR-112 — Veri katmanı: React Query + derleme zamanı mod anahtarı (S7)

**Durum:** ✅ Dondurulmuş
**Tarih:** 30 Temmuz 2026
**Meclis:** gavadolar (terra · luna) + yazılımcılar (terra · DeepSeek · Gemini)

**Soru 1 — hazır kütüphane mi, kendi kancamız mı?** `10-...md` §12 React
Query'yi hedef yazıyor; buna karşılık UI-ADR-087 grafik kütüphanesini
REDDETMİŞ ve kendi SVG primitive'ini yazdırmıştı. Emsal hangisi?

**Karar: `@tanstack/react-query` (meclis 3/5 gerekçeli çoğunluk).**
UI-ADR-087 emsal DEĞİLDİR: orada dar, deterministik bir çizim işi vardı.
Burada istenen davranışlar — istek dedupe · stale-while-revalidate · iptal ·
GC · observer yaşam döngüsü · SSR uyumu — 120 satırlık bir kancada doğru
yazılmaz ve **yanlış yazıldığında sessiz bozulur**. Karşı oy (2/5) paket
boyutunu gerekçe gösterdi; ölçüm o gerekçeyi desteklemedi.
Runtime doğrulama için `zod` eklendi — meclis 5/5, itirazsız.

**Soru 2 — mock/gerçek anahtarı nerede?** **Karar: derleme zamanı env**
(`NEXT_PUBLIC_ODIN_DATA_MODE`, meclis 5/5). Çalışma zamanı bir düğme
olsaydı mock kodu her derlemede paketin içinde kalırdı; bu projenin en
pahalı hatası "gerçek sanılan mock"tur.

Meclis ayrıca "production derlemesinde mock ise throw" önerdi. **Kısmen
uygulandı:** uygulama S8'e kadar zaten %100 mock; herkesin `npm run build`
komutunu bütün sprint boyunca kırmanın karşılığı yok. Korunması gereken şey
derleme değil DAĞITILAN ÇIKTIDIR → ayrı `npm run build:release` kapısı
(`scripts/assert-release-mode.mjs`) mock modda çıkışı reddeder. Meclis bu
gerekçeyi kabul etti.

**Etki:** `package.json`, `lib/data/{mode,policy,query}.ts(x)`,
`scripts/assert-release-mode.mjs`, `app/(shell)/layout.tsx`,
`.storybook/preview.tsx`, `mocks/mock-badge.tsx` (rozet artık NODE_ENV'e
değil tek anahtara bakıyor).

---

## UI-ADR-113 — Şema yalnız KANONİK sözleşmeler için yazılır (S7)

**Durum:** ✅ Dondurulmuş
**Tarih:** 30 Temmuz 2026
**Meclis:** gavadolar + yazılımcılar — 5/5, itirazsız

**Sorun:** S7 promptu "`09-data-contracts.md`'deki TÜM tipleri TypeScript'e
çevir" diyor ve 18 tip sayıyor. Ama o dosya UI-ADR-098 ile **kanonik
olmaktan çıkarıldı**: ODIN çekirdeği okununca uydurulmuş, kayıp ve yer
değiştirmiş alanlar çıktı. Kanonik olan `09b-verified-contracts.md`.

**Karar:** şema yalnız 09b + FR-0046 v1 için yazılır — zarf/meta ·
`ExecutiveKPI` · `Alert` · `Opportunity` · `Goal`. ODIN'de karşılığı
OLMAYAN tipler (`AIPulse` · `TelemetryStream` …) için şema **yazılmadı.**
"mock-only" etiketli bir şema bile sahte yeteneği meşrulaştırır ve zamanla
gerçek sanılır — UI-ADR-104'ün `grossMarginPerUnit` dersi birebir aynıdır.

Şema ile TypeScript tipinin ayrışması derleme zamanında yakalanır
(`AssertAssignable`); ikisi elle senkronlanmaz.

**Somut kapılar:** `unit=currency` → `currencyCode` zorunlu ·
`unit=percent` → `scale` zorunlu (UI-ADR-093) · `MetricValue.status`
`available` değilse `value===null` ve `reason` ZORUNLU · "Data Required"
gibi sunum metni sayı alanına giremez (ADR-0135) · `Alert.requiresAction`
varsayılansız zorunlu · `Alert.severity` `.optional()` — **null REDDEDİLİR**
(dört üreticinin ortak severity semantiği yok; atlamak dürüst, null yazmak
sahte) · `Opportunity.suggestedAction` zorunlu · `meta.source==="ai"` ise
`confidence` zorunlu.

**Etki:** `lib/data/schemas.ts`. `types/executive.ts` ve `types/screens.ts`
DEĞİŞTİRİLMEDİ (paralel oturum orada çalışıyor).

---

## UI-ADR-114 — Real-time: taşıma soyutlaması yazıldı, SSE/WS istemcisi YAZILMADI (S7)

**Durum:** ✅ Dondurulmuş
**Tarih:** 30 Temmuz 2026
**Meclis:** gavadolar + yazılımcılar — 5/5, itirazsız

**Sorun:** S7 promptu "WebSocket veya SSE — şimdilik altyapı, bağlantı
S8'de" diyor. **Gerçek:** ODIN'in sunucusu (`odin/cockpit.py`, 430 satır
stdlib `ThreadingHTTPServer`) yalnız `GET /api/state`, `/api/events`,
`/api/tasks` ve `POST /api/command` veriyor. **Akış uç noktası YOK.**

**Karar:** olmayan uç noktaya istemci yazılmaz — derlenir, testi bile
geçer, ama hiçbir şeye bağlı değildir; bu sahte entegrasyondur ve sahte
veri kadar yasaktır. Yerine SEAM tanımlandı: `UpdateTransport.subscribe`.
Bugünkü uygulaması `pollingTransport`; ODIN akış verirse S8'de
`sseTransport` yazılır, ekranların hiçbiri değişmez.

Polling sekme arka plandayken ve çevrimdışıyken tetiklemez (meclis
bulgusu): görünmeyen ekranı yenilemek pil ve kota harcar, çevrimdışı
yenileme ise her aralıkta bir hata üretip elde kalan veriyi şüpheli
gösterir.

**Etki:** `lib/data/transport.ts`.

---

## UI-ADR-115 — Bayat veri ile YENİLENEMEYEN veri ayrı gösterilir (S7)

**Durum:** ✅ Dondurulmuş
**Tarih:** 30 Temmuz 2026
**Meclis:** yazılımcılar — ilk tasarımı **2/2 REDDETTİ**

**Reddedilen ilk tasarım:** `useOdinQuery`, elde geçerli veri varken hatayı
yutuyordu ("son bilinen doğru değer hiçbir şeyden iyidir"). Meclis bunu
kullanıcıyı sessizce yanıltan bir mimari hata saydı ve haklıydı:

> ODIN üç saattir 500 dönüyor. Kullanıcı üç saatlik veriyi "bayat"
> damgasıyla görüyor ama SİSTEMİN ÇÖKTÜĞÜNÜ bilmiyor.

Bayatlık "hafta sonu güncellenmedi" de demek olabilir. İkisi tek bir damgada
birleştirilemez, çünkü aralarındaki fark **o sayıya dayanarak karar verilip
verilmeyeceğidir.**

**Karar:** `refreshError` ayrı bir alan olarak dışarı verilir; `error`
yalnız elde HİÇ veri yokken dolar. `TrustSignal` isteğe bağlı
`refreshFailed` alır ve kaynak/yaş satırının yanına "⚠ Son yenileme
başarısız — <sebep>" yazar. Renk tek gösterge değildir, kelime de yazar.

**Aynı turda kapanan üç sessiz-bozulma:**
1. **Gelecekten gelen damga** — saati ileri kaymış üretici `lastUpdated`'ı
   geleceğe yazarsa kayıt SONSUZA KADAR "canlı" görünür, bayatlık hiç
   tetiklenmez. 5 dk kayma tolere edilir, ötesi sözleşme ihlalidir.
2. **İptal ≠ zaman aşımı** — `AbortSignal.any` ikisini tek sinyalde
   birleştiriyordu; çağıran iptal ettiğinde (route değişti) kullanıcıya
   terk ettiği ekranın hata kutusu açılıyordu. Artık ayrılıyor.
3. **Politika açıklaması ölçtüğü şeyi söylemiyordu** — yoruma
   "bayatlamadan ÖNCE tazelenir" yazılmıştı, invariant ise
   `refetchInterval <= recent eşiği` idi. Yorum düzeltildi, test invariantı
   ölçüyor.

**Etki:** `lib/data/{use-odin-query.ts,client.ts,policy.ts}`,
`components/executive/trust-signal.tsx` (+ story).

---

## UI-ADR-118 — Arayüz ODIN'in diskini okumaz; eksik veri TALEP olur (S8)

**Durum:** ✅ Dondurulmuş
**Tarih:** 30 Temmuz 2026
**Meclis:** gavadolar (terra · luna) — **2/2 oybirliği**

**Ölçüm (iddia değil):** çalışan cockpit'ten `GET /api/state` → 200, 116 KB,
30 üst düzey anahtar. `sku_stats` `null`; `agents` düz string listesi;
`risks` ADR-0143'ün `requires_action`/`module`/`evidence` alanlarını
taşımıyor; `decisions` ve `due_deferrals` boş; `decision_cards` karar kaydı
değil staging nesnesi; `health_score.score` `null` (coverage 0/6).

**Asıl bulgu — veri VAR, uç nokta SERVİS ETMİYOR.** `sales_snapshot`
SP-API'den gelmiyor: `cockpit.py::_executive_extras` `staging/`'deki elle
girilmiş `KO-jarvis-0002` kaydını okuyor, `as_of` **9 gün eski**. Oysa
`odin-data/core/` içinde BUGÜNÜN tarihiyle promote edilmiş
`KO-spapi-{orders,sku_sales,inventory}-2026-07-30` ve 94 satırlık
`KO-ads-ads_report-2026-07-30` duruyor.

**Reddedilen kolay yol:** arayüz `odin-data/core/*.json`'ı doğrudan okusun.
Ekranı bugün doldururdu. Reddedildi çünkü arayüz ODIN'in `IRenderer`
portunun adaptörüdür (ADR-0080) — ODIN'in diskini okumak şema/promote/
governance zincirini (ADR-0050 · R-006) atlayıp iki repo arasındaki sınırı
silerdi. Bir kez yapılırsa geri alınamaz: ekranlar dosya biçimine bağlanır.

**Karar:** eksikler kanıtlı bir talep listesine yazılır
(`backend-istekleri.md`, dosya/satır göstererek) ve gelene kadar ekran
"kaynak bağlı değil" der. Boş bir bölüm dürüsttür; doldurulmuş olanı değil.

---

## UI-ADR-119 — CORS ODIN'den İSTENMEDİ; vekil arayüz tarafında (S8)

**Durum:** ✅ Dondurulmuş
**Tarih:** 30 Temmuz 2026

**Sorun:** cockpit yanıt başlıkları ölçüldü — yalnız `Content-Type`,
`Content-Length`, `Cache-Control`. `Access-Control-Allow-Origin` **yok**.
Tarayıcıdaki arayüz `http://127.0.0.1:8765`'e doğrudan gidemiyor.

**Kolay yol reddedildi:** ODIN'e CORS eklettirmek. Sunucunun 127.0.0.1'e
bağlı kalması bilinçli bir güvenlik kararıdır (CLAUDE.md: "dışarı açma").
Köken kısıtını arayüzün rahatlığı için gevşetmek, o kararı arayüz adına
geçersiz kılmak olurdu.

**Karar:** istek Next'in kendi sunucusundan geçer —
`rewrites(): /odin/api/:path* → http://127.0.0.1:8765/api/:path*`.
Tarayıcı için aynı köken, ODIN için hâlâ yerel istemci. Hiçbir başlık
gevşetilmedi, ODIN'e tek satır dokunulmadı. Yol `/odin/api/*` ile
daraltıldı: `/odin/:path*` genel geçidi yarın ODIN'e eklenecek her şeyi de
otomatik açardı.

**⚠️ Vekil bir GÜVENLİK SINIRI DEĞİLDİR** (meclis uyarısı): `/odin/api/*`
tarayıcıya açıktır ve `127.0.0.1` yalnız Next sürecinin makinesini gösterir.
Bugün kabul edilebilir çünkü Next de yerelde çalışıyor; dağıtım hâlinde
vekilin önüne yetkilendirme gerekir — `backend-istekleri.md` §10'da borç.

**SSR TUZAĞI (meclis bulgusu, düzeltildi):** Node'un `fetch`'i göreli URL
çözemez; `/odin/api/state` sunucu tarafında çağrılsaydı "Failed to parse
URL" ile ÇÖKERDİ. `ODIN_BASE_URL` artık sunucuda mutlak, tarayıcıda yol
döndürüyor. Bugün hiçbir sunucu yolu bunu çağırmıyor ama tuzak açıkta
bırakılmadı.

**Etki:** `next.config.ts`, `lib/data/mode.ts`.

---

## UI-ADR-120 — Kaynak yoksa sayı da yok: `0` bir ölçüm iddiasıdır (S8)

**Durum:** ✅ Dondurulmuş
**Tarih:** 30 Temmuz 2026

**Nasıl bulundu:** gerçek moda geçilince (`NEXT_PUBLIC_ODIN_DATA_MODE=odin`)
mock kancası fail-closed olup `null` döndürdü ve Mission Control'ün
Operational Status kartı **sıfırlarla dolu bir "sağlıklı sistem" tablosu**
gösterdi. Hiçbir test yakalamadı; ekrana bakılarak görüldü.

**Kök neden:** `(directors?.data ?? []).map(...)` — zarf `null` olduğunda
boş diziye düşüyor, sayaçlar `0` çıkıyordu. **"0 sağlıksız Director" bir
ÖLÇÜMDÜR ve yanlıştır**; doğrusu "ölçülmedi". Aradaki fark, sistemin
sağlıklı mı yoksa hiç izlenmiyor mu olduğudur; sıfırlarla dolu bir tablo
"her şey yolunda" diye okunur.

**Genel kural:** boş koleksiyona düşen bir `?? []` varsayılanı, "veri
yok"u sessizce "ölçüm sıfır"a çevirir. Sayaç üreten her yerde `null` ile
boş liste AYRI ele alınır; ölçülmemiş sayaç `—` gösterir ve notu
"kaynak bağlı değil" der.

**Etki:** `components/screens/mission-control.tsx`.

---

## UI-ADR-121 — Çağıranın iptali zaman aşımını yener (S8)

**Durum:** ✅ Dondurulmuş
**Tarih:** 31 Temmuz 2026
**Meclis:** yazılımcılar (Qwen · terra · Gemini) — üçü de aynı yarışı gösterdi

**Sorun:** `httpLoad` zaman aşımını çağıranın iptalinden
`signal?.aborted && !timer.aborted` diye ayırıyordu. İkisi AYNI ANDA abort
olursa (kullanıcı route değiştirirken istek de zaman aşımına uğrarsa) koşul
`false` çıkar ve **kullanıcının kendi iptali "zaman aşımı" diye
sınıflanıp terk ettiği ekranın hata kutusunu açar.**

**İLK DÜZELTME YANLIŞTI ve yazılırken yakalandı.** Kendi
`AbortController`'ımızı kurup yalnız zamanlayıcının set ettiği bir
`timedOut` bayrağı okumayı denedim. Bayrak doğruydu ama kural hâlâ
yanlıştı: ikisi birden olduğunda yine zaman aşımı kazanıyordu. Sorun
hangi sinyalin okunduğu değil, **öncelik sırasıydı.**

**Karar (tek cümle):** çağıran iptal ettiyse — zaman aşımı da dolmuş olsa —
bu bizim raporlayacağımız bir hata DEĞİLDİR:

```ts
if (signal?.aborted) throw err;      // kullanıcının niyeti kazanır
throw classifyError(err, path);
```

Kullanıcı o ekrandan ayrılmıştır; React Query iptali zaten sessizce düşürür.
Fazladan `AbortController` ve bayrak da gitti — doğru kural daha az koddu.

**İKİNCİ TUR RAFİNESİ (meclis):** yalnız `signal.aborted` bakmak da eksikti.
Ağ kopması kullanıcının iptaliyle aynı ana denk gelirse her hata yutulur ve
**ağ hatası gizlenirdi.** Hata TİPİ de kontrol edilir:
`if (signal?.aborted && isAbortError(err)) throw err;` — iptal olmayan bir
hata her zaman sınıflandırılır.

**Kapı ölçüldü:** test önce yazıldı ve ESKİ koşulla DÜŞTÜĞÜ, düzeltmeyle
GEÇTİĞİ ayrı ayrı çalıştırılarak doğrulandı. İlk yazdığım test her iki
kodla da geçiyordu — yani kapı değildi; düşemeyen test tiyatrodur. Ağ
hatası testi de aynı yöntemle kapı olduğu kanıtlanarak eklendi.

**Etki:** `lib/data/client.ts`.

---

## UI-ADR-122 — `IS_MOCK` ölü kod elemesine uygun yazılır (S8) ⚠️ YETERSİZ

**Durum:** ✅ Dondurulmuş (etkisiz kaldı — bkz. 18-s8-worklist §4)
**Tarih:** 30 Temmuz 2026

`IS_MOCK = DATA_MODE === "mock"` daha okunaklıydı ama paketleyici için ölü
kod elemesini imkânsız kılıyordu: Next `NEXT_PUBLIC_*` değişkenlerini
derlemede düz metne çevirir, fakat değer bir doğrulama adımından geçip
başka bir sabite atanınca o bilgi kaybolur.

**Karar:** `IS_MOCK = process.env.NEXT_PUBLIC_ODIN_DATA_MODE !== "odin"` —
ifade derlemede `"odin" !== "odin"` → `false` olur.

**DÜRÜSTLÜK NOTU:** bu değişiklik tek başına YETMEDİ. Ölçüldü: mock verisi
üretim paketinde kaldı; çünkü sorun ifadede değil **import grafiğinde** —
ekranlar mock'ları doğrudan import ediyor. Kararın etkisiz kaldığını
yazmak, etkili sanmaktan iyidir.

---

## UI-ADR-123 — Mock ekrana anahtarla girer; üretim paketinde hiç bulunmaz (S8)

**Durum:** ✅ Dondurulmuş
**Tarih:** 31 Temmuz 2026
**Meclis şartı:** "sahte ekran verisi üretim paketinde HİÇ bulunmasın"

**Sorun:** ekranlar mock üreticilerini DOĞRUDAN import ediyordu
(`import { skusMock } from "@/mocks/amazon"`). Fail-closed kanca
(UI-ADR-115) onların ekrana çıkmasını engelliyordu — ama modüller import
grafiğinde kaldığı için **mock verisi gerçek-mod üretim paketine
giriyordu.** Ekranda görünmemek yetmez: paketteki veri indirilebilir.

**Yanlış teşhis önce denendi ve ölçümle çürütüldü.** UI-ADR-122 `IS_MOCK`'u
ölü kod elemesine uygun yazdı; tek başına HİÇBİR ŞEY değiştirmedi. Sorun
ifadede değil **import grafiğindeydi**: bir modül statik olarak import
edildiği sürece paketleyicinin onu elememesi doğru davranıştır.

**Karar — üç katman, her biri ölçüldü:**

1. **Anahtar.** Ekranlar üretici fonksiyon değil, `registry.ts`'teki bir
   ANAHTAR geçirir: `useMockData("amazon.skus")`. Tüm `import()` çağrıları
   tek bir modülde toplandı. Tipler `typeof import(...)` ile alınır — tip
   konumunda olduğu için derlemede tamamen silinir, tip güvenliği kaybolmaz.
2. **Yerinde koşul.** `registry.ts` `IS_MOCK`'u başka modülden almaz;
   `process.env.NEXT_PUBLIC_ODIN_DATA_MODE === "odin"` ifadesini YERİNDE
   yazar. Ölçüm: sunucu paketi temizlendi (6 eşleşme → 0), istemcide dört
   lazy chunk kaldı.
3. **Release ikizi.** Paketleyici dinamik import'ları ayrıştırma aşamasında
   toplar; sabit koşul altında olsalar bile chunk üretir. Gerçek mod
   derlemesinde `@/mocks/registry` bir stub'a çözülür
   (`turbopack.resolveAlias` → `registry.release.ts`). Ölçüm: **istemci 0 /
   sunucu 0.**

**Meclisin "paketleyici hilesi" uyarısı karşılandı:** alias dağınık statik
import'ları sürdürmek için değil, ÖNCE tek modüle toplanmış erişimin tek
dikiş yerini değiştirmek için kullanılıyor. `tsc` gerçek dosyayı görür;
imzalar ayrışırsa derleme düşer.

**Bir tuzak ölçülerek bulundu:** `use-mock.ts` kayıt defterini göreli yolla
(`./registry`) import ederken alias EŞLEŞMİYORDU ve chunk'lar çıktıda
kalıyordu. Belirteç mutlak yola çevrildi. Ölçmeseydim "çözüldü" derdim.

**Kalıcı kapı:** `scripts/assert-no-mock-in-bundle.mjs` release çıktısında
yedi mock imzasını tarar ve `build:release`'in parçasıdır. Kapının
DÜŞEBİLDİĞİ kanıtlandı: mock modda derlenen çıktıda 22 eşleşme bulup
çıkış kodu 1 verdi. Şart bir kez sağlandı; ölçülmezse geri gelir.

**Canlı doğrulama (iki mod):**
- Mock mod: bütün bölümler doluyor, MOCK DATA rozeti görünüyor.
- Gerçek mod: rozet yok, Director sayaçları `—` + "kaynak bağlı değil —
  ölçülmedi", bölümler gerekçeli boş durum basıyor, konsolda hata yok.

**İKİNCİ TUR — meclisin bulduğu üç açık kapatıldı:**

1. **Sözleşme kapısı** (`mocks/registry.contract.ts`). Kör noktaydı: alias
   yalnız paketleyicidedir, `tsc` her zaman gerçek `registry.ts`'i görür —
   yani stub imzadan sapabilir, derleme yeşil kalır ve kırılma YALNIZ
   release paketinde çıkardı. Artık release modülü gerçek modülün tipine
   atanıyor; sapma derlemeyi düşürür. Düştüğü ÖLÇÜLDÜ (imza bozulunca
   TS2322).
2. **ESLint kuralı.** `no-restricted-imports` mock modüllerinin doğrudan
   import'unu yasaklar (registry, hikâyeler ve testler muaf). Paket kapısı
   aynı hatayı yakalıyordu ama derleme SONUNDA; kural düzenleyicide
   yakalar. Ateşlediği ÖLÇÜLDÜ.
3. **Uçuştaki yükleme tekilleştirmesi.** Aynı mock'u iki bölüm kullandığında
   (decisions hem Briefing'de hem Mission Control'de) iki dinamik import
   başlıyordu. `INFLIGHT` haritası eklendi.
   **İlk uygulamam çalışmıyordu ve testi yazınca ortaya çıktı:** `fillStore`
   `async` olduğu için `return task` sözü YENİ bir sözle sarmalıyordu;
   uçuştaki sözün kimliği kayboluyor, ikinci çağıran onu tanımıyordu.
   `async` kaldırıldı. Test referans eşitliğini ölçer — tekilleştirme
   kaldırılırsa düşer.

Ayrıca her `MockKey`'in gerçekten çözüldüğü test edildi: tipe eklenip
`switch`'e eklenmeyen bir anahtar sessizce `null` döner ve ekran "veri yok"
derdi — mock modda teşhisi en zor hata budur.

**RESPONSIVE ÖLÇÜMÜ (sahibin 2. sorusu).** 375px'te ölçüp "kusur var"
diyecektim; `03-information-architecture.md` §9.4 tablet ve mobili açıkça
**"(gelecek)"** diyor, hedefler 1366–3840. Yanlış kapıya ölçüyormuşum.
Desteklenen aralıkta ölçüldü: **1366** → yatay taşma 0, KPI 4 sütun
(247px), bölümler 2/3 sütun; **1920** → yatay taşma 0, 8 bölüm, hata
kutusu yok. Mobil kenar çubuğu davranışı (224px sabit, breakpoint sınıfı
yok) S2'den gelir ve S8 ona dokunmadı — kapsam dışıdır, kusur değil.

**Etki:** `mocks/registry.ts` (yeni), `mocks/registry.release.ts` (yeni),
`mocks/registry.contract.ts` (yeni), `mocks/registry.test.ts` (yeni),
`mocks/use-mock.ts`, beş ekran, `next.config.ts`, `eslint.config.mjs`,
`scripts/assert-no-mock-in-bundle.mjs` (yeni), `package.json`.
