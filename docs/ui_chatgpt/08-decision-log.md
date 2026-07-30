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

## UI-ADR-099 — Hesaplanamayan kâr gösterilmez; yerine Gross Profit + hariç tutulanlar

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

## UI-ADR-100 — Simülatör hesap yapmaz; senaryolar veriden gelir

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

## UI-ADR-106 — FR-0046 v1: dört ürün kavramının kanonik sözleşmesi

**Durum:** ✅ Dondurulmuş (UI tarafı) · ODIN kayıt defteri kapanışı bekleniyor
**Tarih:** 30 Temmuz 2026 — meclis denetimi (16-audit) sonrası
**Danışılan:** gavadolar (terra · luna) + sistemciler (3 mimar) — kavram
kabulünde 4/4 aynı yönde; iki noktada ayrıştılar, sentez aşağıda.
**Sahip onayı:** 30 Temmuz 2026 — "gavadolarla sorup en doğru şekilde
düzeltmene izin veriyorum, onaylıyorum" (kayıt: oturum). ODIN R-006
FR-0046 satırının resmi kapanışı ODIN reposunda yapılacak; paket §17'de.

**Sorun:** 16-audit UI-ADR-098 doğrulamasına dayanarak dört ürün kavramının
(ExecutiveKPI · Alert · Opportunity · Mission) ODIN'de tanımı olmadığını
tespit etti; sistemciler oybirliğiyle "S6 varsayılan tiplerle başlamaz"
dedi ve FR-0046 açıldı. Mevcut S6 ise kapı konmadan ÖNCE, 🟡 TEKLİF
tiplerle bitirilmişti.

**Karar — kavram başına:**

| Kavram | Karar | v1 sözleşme |
|---|---|---|
| ExecutiveKPI | **KABUL** | `id · metricKey · label · value{status,value,reason} · unit · currencyCode? · scale? · asOf · source` |
| Alert | **KABUL** | `id · source · title · requiresAction · asOf · summary? · severity?` |
| Opportunity | **KABUL** | `id · source · title · summary · suggestedAction · asOf · evidence?[]` |
| Mission | **RET** | ADR-0132 zaten karara bağlamıştı: Goal'e emekli (UI-ADR-107) |

**Sentezlenen çelişkiler:**
- `Alert.severity` — terra "opsiyonel, kaynaksızsa atlanır"; luna "zorunlu,
  dolduramayan yayınlamaz". **Sentez: opsiyonel + asla null yazılmaz.**
  Dört üreticinin bugün ortak severity semantiği yok; zorunlu kılmak
  üreticiyi eşleme UYDURMAYA zorlar — luna'nın kendi "sahte ortak semantik
  üretme" ilkesi de bunu destekler. Severity'siz kayıt rozetsiz gösterilir
  ve bilinenlerden sonra sıralanır.
- `Opportunity.suggestedAction` — terra zorunlu, luna listelememişti.
  **Sentez: zorunlu.** §1.6'nın tanımı "eyleme dönük feed"; önerisi olmayan
  kayıt fırsat değildir, üreticiye özel çıktısında kalır.

**Oybirliği maddeleri:**
- `value` zarfı `{status: available|data_required|unavailable, value, reason}`
  API sınırında KALMAZ, sözleşmenin parçasıdır — "Data Required" metni
  sayı alanına giremez (ADR-0135).
- Metrik kutbu (`higherIsBetter`) v1'e GİRMEZ — UI-ADR-102 nötr renk kuralı
  kalır; kutup her metricKey için ODIN'de tanımlanmadan eklenirse kalıcı
  null üretir (UI-ADR-104 dersi).
- `estimatedImpact` v1'e GİRMEZ — ortak ve güvenilir parasal etki kaynağı
  kanıtlanmadı. Eski fırsat kartındaki "Gelir etkisi" SÖKÜLDÜ. Kaynak +
  formül + belirsizlik tanımlanırsa FR-0044 zarfıyla ayrı kararla döner.
- FR-0043 alanları (trend · sparkline · aiInsight · forecast · risk ·
  recommendedAction · evidence · owner) opsiyonel kalır ve MOCK DAHİ
  DOLDURMAZ — `amazon.test.ts` bunu kapı olarak korur.
- Kanonik kaynak ODIN'dir (FR-0039 fixture kanalı); `09b` salt yansımadır.

**Bilinçli kayıplar (alan sorusu §17'ye düşüldü):**
- Alert'te varlık referansı yok → SKU panelinin "ilgili uyarılar" eşleşmesi
  yapılamıyor; bölüm gerekçeli boş.
- Opportunity'de kategori/domain yok → PPC K3 / Feed ayrımı yapılamıyor;
  tüm fırsatlar Feed'de, K3 gerekçeli boş.

**Etki:** `types/executive.ts`, `executive-kpi-card.tsx` (+stories),
`alert-stack.tsx`, `opportunity-card.tsx` (+stories), `amazon-director.tsx`,
`amazon-sku-panel.tsx`, `mocks/amazon.ts`, `mocks/briefing.ts`,
`mocks/amazon.test.ts` (53 birim testi), `stories.fixtures.ts`, 09b §10,
13-...md §17.

---

## UI-ADR-107 — Mission, Goal'e emekli edildi (ODIN ADR-0132'nin UI uygulaması)

**Durum:** ✅ Dondurulmuş
**Tarih:** 30 Temmuz 2026

**Sorun:** UI'daki 60 referanslı `Mission` tipinin ODIN'de karşılığı yoktu;
9 alanından yalnızca 3'ü gerçek `goals.py` yayınına eşleniyordu. Kanban'ı
süren `status` (planned/active/blocked/done) tamamen icattı. ODIN ADR-0132
kararı: Mission, Goal'e emekli olur; MissionBoard hedef verisiyle beslenir;
kolonlar GERÇEK `level` alanıyla gruplanır; kaynaksız alanlar DÜŞER.

**Uygulama:**
- `Mission`/`MissionStatus` silindi → `Goal { id, level, label, target,
  progressPct }` (cockpit.py yayını birebir; `goals.py` doğrulandı:
  `{id, level, label, target, progress_pct}`).
- `MissionBoard` → `GoalBoard`: kolonlar verideki seviyelerden türer,
  görüldükleri sırayla — ODIN seviye kümesini dondurmadığı için öncelik
  sıralaması uydurulmadı. Termin/sorumlu/engel satırları kalktı.
- TUZAK (ADR-0132): `goals.alignment()` hedef tanımsızken nötr 50 döner —
  o "ölçülmedi"dir; adaptör null'a çevirir, tahta %50 çizmez. Tip yorumu ve
  mock bu kuralı taşıyor.
- Mission Control "Upcoming Deadlines" bölümü GEREKÇELİ BOŞ duruma döndü:
  Goal yayınında termin alanı yok, tarih uydurulmaz (soru §14.2).
- `AmazonSnapshot.missionProgress` → `goalProgressPct: number | null`;
  Glance kartı "Goal Progress" oldu ve değeri goalsMock'un g-ppc hedefiyle
  tutarlı (eski 62 hiçbir kaynağa bağlı değildi).

**Etki:** `types/screens.ts`, `goal-board.tsx` (+stories, git mv ile),
`mission-control.tsx`, `mocks/mission-control.ts`, `types/executive.ts`
(AmazonSnapshot), `amazon-director.tsx`, `mocks/amazon.ts`.

---

## UI-ADR-108 — Belge scroll'u yapısal olarak kapatıldı (16-audit §2 P0)

**Durum:** ✅ Dondurulmuş
**Tarih:** 30 Temmuz 2026

**Sorun:** 16-audit §2'nin P0 bulgusu — `html` scrollHeight viewport'u
aşıyordu (1920'de 4342 px ölçüldü); `Space`/`Home`/`End` header'ı ekrandan
çıkarabiliyordu. Spec (03-...md §1): scroll YALNIZCA workspace'tedir.
Denetim düzeltmeyi "S5.5'te uygulanacak" diye reçetelemişti ama hiçbir
dala commit edilmemiş — bu revizyonun ölçümünde yakalandı.

**Karar (denetimin reçetesi birebir):** `html, body { height:100%;
overflow:hidden }` + kabuk kökü `h-screen` yerine **`fixed inset-0`** —
kabuk belge akışından çıkar, belge yüksekliğine katkı sıfırlanır ve belge
scroll'u YAPISAL olarak imkânsızlaşır; CSS'i geri açan biri bile kabuğu
kaydıramaz. Ölçüm: 3 ekran × 3 genişlik (1920/1440/768) html
scrollHeight === 900 (viewport), yatay taşma 0.

**Etki:** `globals.css`, `app-shell.tsx` (tek satır sınıf değişimi).
