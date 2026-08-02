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

---

## UI-ADR-124 — `Goal` ayrı bir ekrandır; ilerleme yalnızca ölçülmüşse çizilir (S8)

**Durum:** ✅ Dondurulmuş
**Tarih:** 31 Temmuz 2026
**Sahip:** (b) ve (c) arasında kaldı, meclise havale etti
**Meclis:** gavadolar (terra · luna) — **2/2 (c) oybirliği**

**Karar:** `Goal` için **ayrı bir ekran**: `/goals`, sol menüde EXECUTIVE
altında **"Hedefler"**. Mission Control'e hedef bölümü EKLENMEZ.

**Neden Mission Control değil:** o ekranın birincil odağı izlenen kararlar +
vadesi gelen ertelemelerdir ve `03-information-architecture.md` §5
"**ondan ağır ikinci bir alan yoktur**" der. Ayrıca ÖLÇÜLDÜ: sekiz hedefin
üçü `urgent` operasyonel iş, beşi `quarterly` ürün yol haritası — ikisi
aynı bağlama ait değil.

**⚠️ ADLANDIRMA:** "Mission" kelimesi kullanılmaz. ADR-0143 §4 o kavramı
reddetti; arayüze geri getirmek kararı sessizce iptal ederdi. Varlığın
teknik adı `Goal` kalır, kullanıcı arayüzündeki karşılığı **Hedefler**.

**Bu ekran bir ilerleme panosu DEĞİLDİR.** ADR-0143 §4: "ilerleme yüzdesi
kavramı kendi ölçülmüş kaynağını ister ve burada yaratılmıyor." Ölçüldü:
3 hedefte `progress_pct` sayı (%25/%0/%0), 5 çeyreklikte `null`. Çubuklar
etrafında kurulmuş bir ekran çoğunlukla boş kutu gösterirdi. Ekran
hedeflerin **envanteri ve ufuk görünümüdür**.

**`progress_pct: null` sözleşmesi (meclis 2/2):** çubuk YOK, yüzde YOK,
**`0` YOK**. `0` "ölçüldü ve sıfır" demektir; ölçülmeyeni öyle göstermek
uydurma veridir. Yerine "İlerleme ölçülmüyor" YAZILIR — sessizce boş
bırakmak alanı gözden kaçırtırdı. (terra "etiket de yazma" dedi, luna
"yaz" dedi; anayasanın "veri yoksa 'veri yok' gösterilir, placeholder
değil" kuralı luna'yı destekliyor, o uygulandı.)

**Meclis içi ikinci fark:** terra Mission Control'e "en fazla 3 satırlık
acil hedef özeti + bağlantı" konabileceğini söyledi, luna hiç
konmamasını. **luna uygulandı** — özet büyüdüğü an fiilen (b) olur ve
terra'nın kendi uyarısına düşer.

**Bir tuzak ölçülerek bulundu:** cockpit tanımsız hedefi **boş dize**
yayınlıyor (`goal.get("target","")`), `null` değil. Boş dize için satır
hiç çizilmez — boş bir satır "hedef var ama yazılmamış" diye okunurdu.

**Kapı:** `odin-state.test.ts` — fixture çalışan cockpit'ten DOĞRUDAN
alındı (`__fixtures__/api-state-goals.json`, 8 gerçek hedef). Zincirin
tamamı ölçülür: ham ODIN → `stateSchema` → `adaptGoals` → `goalSchema`.
Ölçülen/ölçülmeyen ilerlemenin ayrı kaldığı ve `null`'ın `0`'a düşmediği
ayrıca test edilir.

**✅ TARAYICIDA DOĞRULANDI — arayüzdeki İLK canlı ODIN verisi.**

Önce doğrulayamamıştım: dev sunucusunda istemci hidrasyonu tüm uygulamada
duruyordu (mock modda da, Mission Control'de de; "Daralt" düğmesi bile
tepkisiz, chunk düşmüyor, konsol hatasız). "Ortamsal" deyip bırakmak
yerine ÜRETİM derlemesinde denendi ve **hidrasyon orada sorunsuz çalıştı.**

→ **Teşhis: hidrasyon kırılması dev/Turbopack'e özgüdür, üretimde yoktur.**
Ayrı bir borç olarak kaydedildi (`18-s8-worklist.md`); bu ekranın kusuru
değil.

Üretim derlemesinde ölçülen (gerçek mod, cockpit 8765 açık):
- `hidrasyon: true` · konsolda hata yok · **mock rozeti YOK**
- Gerçek veri imzası ekranda: "ACIL: 8 urun icin tedarikci siparisi
  **(stok krizi - momentum -%16 nedeni)**" — bu metin mock'ta YOKTUR,
  yalnız canlı cockpit yükünde vardır
- Ölçülen ilerleme çizildi: **%25** · %0 · %0
- **5 çeyreklik hedef "İlerleme ölçülmüyor"** dedi — `null` hiçbir yerde
  `0`'a düşmedi
- "Son senkron: az önce"

**Bir kusur bu ölçümle bulundu:** mock kayıtlar GERÇEK ODIN ID'lerini
taşıyordu (`GOAL-ACIL-STOK-2026-07`). Paket kapısının imzası belirsiz
kalıyordu (aynı dize hem mock'ta hem canlı veride) ve bir mock kaydın
gerçek kimlik taşıması başlı başına yanıltıcıydı. ID'ler `GOAL-MOCK-*`
oldu, kapı imzası da güncellendi.

---

## UI-ADR-125 — Dev sunucusu `127.0.0.1`'e izin verir; yoksa hidrasyon sessizce ölür (S8)

**Durum:** ✅ Dondurulmuş
**Tarih:** 31 Temmuz 2026

**Belirti:** `npm run dev` ile açılan arayüz `127.0.0.1:3000` üzerinden
tamamen ÖLÜYDÜ. Ekran sunucudan geldiği gibi donuyor, hiçbir düğme
çalışmıyor ("Daralt" tepkisiz), veri kancaları hiç ateşlenmiyor, bölümler
sonsuza kadar "yükleniyor" gösteriyordu. **Konsolda hata yok. Hiçbir chunk
düşmüyor. `__reactFiber` anahtarı hiç oluşmuyor.**

**Yanlış teşhisim kayda geçsin:** buna önce "ortamsal bozulma, benim kodum
değil" dedim ve `18-s8-worklist.md`'ye çözülemez bir borç olarak yazdım.
Üretim derlemesinde çalıştığını görünce "dev/Turbopack'e özgü" diye
daralttım — doğruydu ama YETERSİZDİ. Sebep bir gizem değildi:

```
⚠ Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr
  from "127.0.0.1".
```

**Next, çözümü sunucu logunda YAZMIŞTI. Ben logu okuyup geçmiştim.**

**Kök neden:** Next 16 dev sunucusu `/_next/webpack-hmr` gibi dev
kaynaklarına "cross-origin" istekleri güvenlik gereği engeller ve
varsayılan olarak yalnız `localhost`a izin verir. `127.0.0.1` ile
girildiğinde HMR bloklanıyor ve **istemci hidrasyonu hiç tamamlanmıyor.**
Hata mesajı sunucuda kalıyor, tarayıcıya yansımıyor — teşhisi bu yüzden
zor.

**Karar:** `next.config.ts` → `allowedDevOrigins: ["127.0.0.1"]`.

`127.0.0.1` LOOPBACK'tir — makinenin kendisidir, ağa açılma DEĞİLDİR.
Bilerek yalnız o eklendi; `192.168.1.105` (LAN adresi) EKLENMEDİ, o
gerçekten dışarı açmak olurdu. Yalnız geliştirmeyi etkiler; üretim
derlemesi zaten sorunsuzdu.

**Doğrulama (dev, gerçek mod):** `hidrasyon: true` · "yükleniyor" yok ·
canlı ODIN verisi ekranda (`momentum -%16 nedeni` imzası) · 5 çeyreklik
hedef "İlerleme ölçülmüyor" · mock rozeti yok · **"Daralt" düğmesi artık
çalışıyor** (etkileşim testi geçti).

**DERS:** "ortamsal" demeden önce sunucu logunu SONUNA KADAR oku. Bir
oturumu neredeyse çözülemez sayılan bir borçla kapatıyordum; cevap
başından beri logdaydı.

---

## UI-ADR-126 — Amazon KPI ve Alert canlıya bağlandı; onaylanmamış eşik görünür oldu (S10)

**Durum:** ✅ Dondurulmuş — ekranda ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** ODIN ADR-0147 (FR-0049) · ODIN ADR-0146 · ADR-0143 · UI-ADR-123

ODIN `GET /api/amazon` ile promote edilmiş Amazon verisini yayınlamaya
başladı (`backend-istekleri.md` #1). `src/lib/data/odin-amazon.ts` onu
ekrana bağlar.

### 1. Adaptör İNCE, çünkü sözleşme ORTAK

ODIN'in yayını ile arayüzün kanonik tipi **aynı sözleşmedir** (ADR-0143
§1–§2): zarf düz, alanlar birebir. Geriye yalnız snake_case → camelCase
kalıyor. Değer dönüştürülmez, alan türetilmez, oran hesaplanmaz.

Bu, `odin-state.ts`'in `adaptGoals`'ıyla aynı kural. `meta.source =
"internal"`: yayın ODIN'in kendi projeksiyonudur — altındaki kayıtlar
SP-API ve Ads'ten gelse de tek zarf ikisini birden etiketleyemez.

### 2. Onaylanmamış eşik GÖRÜNÜR — yeni bileşen `ThresholdNote`

ODIN ADR-0146 stok bandının sahibi tarafından **hiç onaylanmadığını**
tespit etti ve meclis eşiği gerçek veriden türetmeyi REDDETTİ (bir
haftalık 18 SKU bir dağılım özetidir, politika değil). Sonuç
`threshold_provenance: "unapproved_default"` ile işaretleniyor.

Arayüz bunu göstermeseydi ekran "Kritik" rozetini **yetkili bir hüküm**
gibi sunardı. Bu, sahte veri yasağının daha sinsi biçimidir: uydurulmuş
bir sayı değil, uydurulmuş bir **OTORİTE**. Sayı ölçülmüştür; hüküm
değildir.

`owner_policy` için hiçbir şey çizilmez — onaylanmış eşik normal
durumdur ve her karta "bu onaylı" yazmak gürültüden başka bir şey
üretmez.

### 3. Sözlük dışı severity SESSİZCE geçmez

Sahip 31 Temmuz'da ODIN'in `critical|risk|warning|info` sözlüğünü kanonik
ilan etti ve `main` zaten ona hizalıydı. Arayüz eşleme icat etmez;
sözlük dışı bir değer gelirse kayıt şemadan **geçmez** ve bölüm gerekçeli
hata basar. Rozetsiz göstermek, ODIN'in sözleşmeyi genişlettiğini
gizlerdi.

### 4. Bölümün hatası artık ekrana ULAŞIYOR

KPI ve Alert bölümlerinin `loading`/`error` proplar ı demo durumuna
bağlıydı; canlı uç nokta düşse ekran sessiz kalırdı. `sectionError()`
demo hatasını önceler ama canlı hatayı **susturmaz** — S8'in dersi
(CLAUDE.md kural 6) buydu.

**Yan düzeltme:** başlıktaki "Son senkron" yalnız `snapshot`a bakıyordu
ve ekran canlı sayılarla doluyken "—" diyordu.

### Ölçüm — gerçek modda, üretim derlemesiyle, `/amazon` ekranında

| Gösterge | Değer |
|---|---|
| Satılan adet | 38 |
| Satış değişimi | **—** (önceki pencerede satış yok; paydası yok) |
| Kritik stoktaki SKU | 3 **+ eşik uyarısı** |
| Hızı ölçülemeyen SKU | 29 |
| Gerçekleşen net kâr | $653,36 |
| Envanter kâr potansiyeli | $16.568,66 |
| Reklam harcaması · satışı · net | $676,82 · $8.399,10 · $1.802,63 |
| ACOS · ROAS | %8,1 · 12 |
| Alert | "Kritik stok" — kanıt, önerilen aksiyon **ve eşik uyarısı** |

Yayını olmayan altı bölüm gerekçeli boş durumda kaldı.

### 5. Mock kapısı güçlendirildi (UI-ADR-123'ün üstüne)

Elle tutulan 9 imza korunuyor — kanıtlanmış yakalayıcılar. Üstüne
fixture dosyalarından **otomatik çıkarım** eklendi: elle liste yeni
fixture eklendiğinde sessizce eskir ve kapı yanlış yeşil yanar.

`src/` kesişimi zorunlu bir eleme (`"Gross Profit (ücretler hariç)"` iki
tarafta da meşru) ama artık **sessiz değil**: düşen imzalar yazdırılıyor.

**Bu görünürlük hemen bir hata yakaladı:** yol ayracı normalleştirilmediği
için Windows'ta `src\mocks\...` "üretim kodu" sayılıyordu ve **166 imza**
sessizce düşüyordu. Düzeltildi.

| Ölçüm | Önce | Sonra |
|---|---|---|
| Taranan imza | 9 | **183** (9 elle + 174 otomatik) |
| Sessizce düşen | — | 1 (yazdırılıyor) |
| Mock derlemesinde | — | 364 eşleşme, kapı KIRMIZI |

---

## UI-ADR-127 — İki canlılık yüzeyi ayrı kalır; "Directors" gerçekten koşanı gösterir (S11)

**Durum:** ✅ Dondurulmuş — ekranda ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** ODIN ADR-0148 · UI-ADR-111 · `backend-istekleri.md` #6

ODIN'in **iki ayrı canlılık yüzeyi** var, çünkü iki tür işçisi var:

| Yüzey | Ne | Bugün |
|---|---|---|
| `agents` (`AgentHealthMonitor`) | Kuyruktan görev yürüten ajanlar | **BOŞ** — hiç `task.*` olayı yok, kuyruk hiç kullanılmadı |
| `directors` (`JOBS` + `metrics.json`) | Heartbeat üstünde koşan 18 zamanlanmış iş, her işin KENDİ beyan ettiği agent'a göre gruplanmış | **8 gerçek direktör** |

Arayüzün `AgentHealth` tipi (UI-ADR-111) birincisine doğru biçimde
hizalanmış — ama birincisi boş. Yani **arayüzün modellediği şey boştu,
gerçek sinyali olan şeyin arayüzde tipi yoktu.**

### Karar (meclis · gavadolar 2/2)

**1. "Directors" bölümü `directors`ı gösterir.** Sahibin sorusu "ODIN
yaşıyor mu, bozuk bir şey var mı?" — 18 iş dakikalardır koşarken boş bir
kart göstermek teknik olarak doğru, pratikte yanıltıcı olurdu.

**2. Dört durum KORUNUR** — `healthy | stale | failed | unknown`.
`stale`i `AgentHealth.verdict`in üç değerine sıkıştırmak bilgi kaybıdır:
gecikmiş bir kalp atışı ile hata veren bir iş aynı şey değildir.
Operational Status'ta da dördü **ayrı** sayılır.

**3. `AgentHealth`e ADAPTE EDİLMEZ.** Cazipti — mevcut kart kullanılırdı.
Ama `failuresTotal`ı `consecutiveFailures` alanına yazmak demekti ve
ODIN ardışık seri **ölçmüyor**; arayüzün fark edemeyeceği bir yalan
olurdu. Bu yüzden ayrı bir `RuntimeDirectorCard` yazıldı ve
`DirectorCard` kendi sözleşmesinde bırakıldı (repo kural 5: benzer diye
zorlamak yerine, gerçekten farklı olanı ayır).

**4. Hüküm ODIN'in.** Kart eşik hesaplamaz, `lastBeat`i yorumlamaz —
yaşını yazar, kararı `status`tan okur. UI-ADR-111'in kaldırdığı
"beatIntervalMs × 3" UI icadı geri gelmedi.

**5. `beatIntervalMs` beklenen ritimdir, ölçülmüş değil.** Kartta
"1 saatte bir beklenir" diye yazılıyor — "1 saatte bir çalıştı" değil.
`null` ise "Cadence bildirilmedi".

**6. Boş `agents` yüzeyi ekrana konmadı.** Kuyruk gerçekten kullanılana
kadar ayrı bir "Task Agents" bölümü açılmayacak; sahte bir kart ya da
sahte bir sağlık durumu kesinlikle yok.

### Ölçüm — gerçek modda, üretim derlemesiyle

`/mission-control`: **8 direktör kartı**, Operational Status
`6 sağlıklı · 0 hatalı · 0 gecikmiş · 2 bilinmiyor`. Her kart gerçek son
atışını, beklenen ritmini ve alt işlerinin rozetlerini gösteriyor.

**Ekranda yakalanan, testin kaçırdığı kusur:** `Badge` variant'ına göre
kendi glyph'ini basıyor; kart da glyph yazınca ekranda "✓ ● Sağlıklı"
çıkıyordu. Testler geçiyordu. `DirectorCard`ın sözleşmesine uyuldu —
yalnız label geçiliyor.

---

## UI-ADR-128 — SKU tablosu canlı; status sözlüğü ODIN'e genişledi (S12)

**Durum:** ✅ Dondurulmuş — ekranda ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** ODIN ADR-0149 · ADR-0146 · UI-ADR-104 · `backend-istekleri.md` #7

ODIN `/api/amazon`'a 48 satırlık per-SKU projeksiyon ekledi. Arayüz bağlandı.

### 1. `status` enum'u BEŞ değere genişledi

Eskiden `healthy | watch | at_risk | critical`. ODIN'in stockout motoru
`ok | warn | critical | no_movement | unknown` üretiyor ve bugün
**48 SKU'nun 29'u `unknown`** — dört değerli enum'da bunun karşılığı YOK.

Sıkıştırmak kataloğun çoğunluğunu "ölçüldü" diye etiketlemek olurdu.
`no_movement` da ayrı bir bulgudur (stok VAR, satış YOK); `ok` saymak da
`critical` saymak da ayrı birer yalan. Sahip kararı (31 Tem): ODIN'in
sözlüğü kanonik.

Ekran karşılıkları: `ok`→Sağlıklı · `warn`→İzlemede · `critical`→Kritik ·
`no_movement`→Hareketsiz · `unknown`→**Ölçülmedi** (bir sağlık durumu
değil, ölçüm boşluğu).

### 2. Skor TÜRETİLMEZ

ODIN `healthScore`, açıklaması, tükenme tarihi ve reorder adedini
kararla `null` yayınlıyor (ADR-0149). Arayüz hiçbirini hesaplamıyor.
`statusBasis: "rule_set"` ve `thresholdProvenance: "unapproved_default"`
taşınıyor — "Kritik" etiketi sahibin onaylamadığı bir eşikten geliyor ve
bunu saklamıyoruz.

### 3. Sürekli boş kolon KALDIRILDI — canlı ekranda görüldü

Tablo `SKU · Durum · Sağlık · Tükenme · BuyBox` idi. ADR-0149'dan sonra
**beş kolonun üçü her satırda "—"** oldu. Sürekli boş bir kolon veri
yokluğunu bildirmez; tabloyu okunmaz yapar ve gerçekten ölçülmüş olanı
gizler.

Yerlerine ODIN'in yayınladıkları kondu: **Kalan gün · Stok · Satılan ·
ACOS**. Skor/tükenme/BuyBox bir üretici kazandığı gün geri gelir; o güne
kadar yer işgal etmezler.

### 4. Dönemler ayrı taşınır, biri hesaplanır

`sales.period` ve `advertising.period` ayrı ayrı geliyor. Kayan pencerenin
başlangıcı `end - window_days` ile **hesaplanıyor** ve bu tahmin değil:
kayıt "30 Temmuz'da biten 7 günlük pencere" diye beyan ediyor, başlangıç o
beyanın aritmetiği. Dönem beyan edilmemişse `period: null` — uydurulmaz.

`MetricPeriod` bu yüzden nullable yapıldı.

### 5. `buyBoxRate` gelmedi ve bu bir eksiklik DEĞİL

ODIN yayınlamıyor çünkü tek kaynağı olan katalog export'u dönemini beyan
etmiyor (ADR-0149 §6). Arayüz de uydurmuyor. Kolon kaldırıldı.

### Ölçüm — gerçek modda, üretim derlemesiyle

`/amazon` SKU Health tablosu, 48 satır. Örnekler: `CapDome-Xs-10` →
Kritik · 3,5 gün · 1 stok · 2 satılan. `CloseSmokeyDome-M-20-pcs` →
Sağlıklı · 258,9 gün · 37 stok · 1 satılan · ACOS %71,5.

---

## UI-ADR-129 — Runtime alarmları Executive Alerts'e bağlandı (S14)

**Durum:** ✅ Dondurulmuş — ekranda ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** ODIN ADR-0151 · ADR-0143 · UI-ADR-127

ODIN üst üste üç kez başarısız olan zamanlanmış işleri kanonik Alert
olarak yayınlamaya başladı (`module: "runtime"`). Mission Control'ün
Executive Alerts bölümü mock'tan çıkıp buraya bağlandı.

**Adaptör yok, çeviri var.** ODIN kanonik zarfı yayınlıyor; yalnız
snake_case alan adları çevriliyor. Eşik (3), gruplama ve
`requires_action` kararı ODIN'de — arayüz hiçbirini hesaplamıyor.
`module` alanı serbest metin olduğu için ayrı bir tip gerekmedi;
`runtime` ile `amazon` aynı listede yaşayabilir ve ayırt edilebilir.

**Boş liste NORMAL ve DOĞRU hâldir.** Ekran bugün "Aksiyon gerektiren
uyarı yok" gösteriyor çünkü hiçbir iş üst üste üç kez patlamıyor. Hiç
boşalmayan bir alarm listesi, kimsenin okumadığı bir listedir.

**ODIN `null` yollarsa boş dizi GÖSTERİLMEZ.** Sağlık dosyası okunamazsa
ODIN `alerts: null` yayınlıyor ve arayüz bunu hataya çeviriyor. Boş liste
"her şey yolunda" iddiasıdır; okunamayan bir dosya o iddianın kanıtı
değildir.

### Ölçüm — gerçek modda, üretim derlemesiyle

`/mission-control` → Executive Alerts: **"Aksiyon gerektiren uyarı yok"**.
Director Coordination aynı ekranda 8 gerçek direktörü göstermeye devam
ediyor. Alarmın dolu hâli Storybook'ta (`AlertStack`) ve ODIN'in birim
testlerinde kapsanıyor.

---

## UI-ADR-130 — Katman sınırları kurala bağlandı; eşik meşrulaştırılmadı, görünür yapıldı (S13)

**Durum:** ✅ Dondurulmuş — ekranda ölçüldü
**Tarih:** 31 Temmuz 2026
**Danışılan:** gavadolar (terra · luna) — iki görüş de aynı yönde
**İlgili:** UI-ADR-111 · UI-ADR-123 · UI-ADR-126 · UI-ADR-129 ·
`backend-istekleri.md` §14

### 1. Sınırlar artık DERLEYİCİDE yaşıyor

S13'te sınır ihlalleri elle onarıldı. Onarım kalıcı DEĞİLDİR: kural
yazılmazsa bir sonraki oturum `import { skusMock } from "@/mocks/amazon"`
yazar ve hiçbir şey itiraz etmez.

`eslint.config.mjs`'e dört kapı eklendi. **Üçü de enjekte edilmiş ihlalle
denendi ve üçü de ateşledi** — ateşlemeyen bir kural, kural olmamasından
kötüdür çünkü güvence hissi verir.

İzinli yön: `app → features → components → lib → types`.

Denerken bir kural HATASI da bulundu: `@/components/*` deseni
`@/components/ui/badge`'i YAKALAMAZ — tek `*` asla `/` geçmez. Desenler
`**` yapıldı; yoksa kural yalnızca tek seviyeli yolları görürdü.

Eskimiş bir blok da kaldırıldı: mesajı silinmiş `useMockData`'yı işaret
ediyordu.

### 2. `director-status-dot.tsx` SİLİNDİ

Ölçülen sebepler, hepsi doğrulandı:

- Tek çağıranı `beat={null}` geçiyordu → bileşen **sıfır piksel** çiziyordu.
- İçindeki `isStale()` kuralı (`beatIntervalMs * 3`) UI-ADR-111'in
  **açıkça emekliye ayırdığı** UI icadıydı.
- Dayandığı `09-data-contracts.md` UI-ADR-098 ile kanonik olmaktan çıkmıştı.
- `export type DirectorStatus` tanımlıyordu — `types/executive.ts:500` de
  **aynı adla** başka bir tip tanımlıyor. İki farklı değer kümesi, tek ad.
- Kanonik karşılığı zaten canlı: `RuntimeDirector` + `runtime-director-card`.

Bu feature silmek değil; emekli bir politikayı taşıyan ölü kodu
temizlemektir.

### 3. Eşikler MEŞRULAŞTIRILMADI — tek yere alındı ve İŞARETLENDİ

Meclisin en önemli düzeltmesi: eşiği JSX'ten alıp bir `domain/` klasörüne
koymak onu **temizlemez, meşrulaştırır**. Uydurulmuş bir politika resmî
bir katman adı kazanır ve zamanla gerçek sanılır.

Bu yüzden iki gruba ayrıldı:

**Grup A — gerçekten sunum (feature katmanına taşındı):**
`SKU_STATUS` · `DIRECTION` · `SKU_SCALE` · `AMAZON_SKU_KIND` ·
`greeting()`. Bunlar kanonik kodu görsele çevirir, eşik hesaplamaz.
`SKU_SCALE` iki ekranda AYRI tanımlıydı — ölçek değişse birinin
unutulması ekranda yüz kat sapmış bir yüzde demekti.

**Grup B — ODIN'in işi, arayüzde duran borç:** `healthScore >= 80` ve
`buyBoxRate < 90`. Tek dosyada toplandılar
(`features/amazon/presentation/thresholds.ts`), `unapproved_default`
damgalandılar ve BuyBox bölümü artık ekranda `ThresholdNote` basıyor.
Talep `backend-istekleri.md` §14'e yazıldı; ODIN yayınladığı gün dosya
**silinir**.

`90` sayısı ayrıca İKİ YERDE düz metin olarak da yazılıydı ("%90'ın
altına inen SKU'lar"). Metin artık sabitten üretiliyor — sayıyı
değiştirenin metni de değiştirmesi gerektiğini hiçbir şey söylemiyordu.

### 4. İki ters bağımlılık düzeltildi

- **`layout → screens`:** kabuk sağ paneli doldurmak için iki EKRANI
  import ediyordu. Kabuk her feature'ı tanırsa hiçbir feature tek başına
  taşınamaz. Kabuk artık bir **slot** tanımlıyor (`ContextPanelSlot`),
  içeriği kompozisyon kökü veriyor (`app/(shell)/context-panel.tsx`).
  `03-information-architecture.md` §7 zaten böyle diyordu; kural doğruydu,
  uygulaması kabuğun içine sızmıştı.
- **`mocks → components/ui`:** `TimelineItem` bir bileşen dosyasında
  tanımlıydı ve mock onu oradan alıyordu — veri üreten katman, kendisini
  çizen bileşene bağımlıydı. Tip `types/screens.ts`'e taşındı.

### 5. Kohort kuralları test edilebilir oldu

`atRiskSkus` ve `losingBuyBoxSkus` JSX'in içindeydi, okunamıyordu,
dolayısıyla test de edilemiyordu. Testler iki DAVRANIŞI kilitliyor:
ölçülmemiş SKU risk sayılmaz, ve ölçülmemiş bir oran "en kötü" gibi
sıralanmaz — eski kod `?? 0` ile sıralıyordu ve ölçülmemiş bir SKU
listenin başında %0 gibi görünürdü.

### Ölçüm

Lint 0 hata · `tsc` 0 hata · 54 dosya / **295 test** yeşil (129'dan +3).
Kenarlar: `screens → mocks` 0 · `layout → screens` 0 ·
`mocks → components` 0.

Dev sunucusunda `/amazon`: BuyBox listesi en kötüden sıralı
(%62,0 · %71,3 · %78,4 · %88,0) ve altında onaylanmamış eşik uyarısı
görünüyor.

---

## UI-ADR-131 — Ekran iskelesi tek yerde; "sözleşme yok" metninin iki şekli birleşti (S13)

**Durum:** ✅ Dondurulmuş — dört ekranda ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-096 · UI-ADR-129 · UI-ADR-130

### Bulgu

Üç ekran (`executive-briefing` · `mission-control` · `amazon-director`)
beş şeyi kelimesi kelimesine tekrar yazıyordu:

| Tekrar | Kaç kopya |
|---|---|
| `DEMO_ERROR` nesnesi (`why`/`fix` ÜÇÜNDE DE AYNI) | 3 |
| `demo` → `loading`/`error`/`isEmpty` türetmesi | 3 |
| `reloadAll` yelpazesi | 3 |
| `empty<T>()` zarf boşaltıcı | 2 + 2 satır-içi |
| "sözleşme yok" metni | 2 **AYRI ŞEKİL** |

Sonuncusu tekrarın nasıl SAPMAYA döndüğünün örneğiydi: `amazon-director`
`emptyTitle/emptyDescription/emptySuggestion` üretiyordu, `mission-control`
`title/description/suggestion` üretiyor ve arada `emptyProps` diye bir
**adaptör fonksiyonu** taşıyordu. Aynı UI-ADR-096 deseninin iki şekli ve
onları birbirine bağlayan üçüncü bir parça.

Bu tekrarların çoğu UI-ADR-129'dan ÖNCE toplanamazdı: iki veri zinciri
varken ekranların durum şekilleri de farklıydı. Boru birleşince
soyutlama mümkün ve doğru hâle geldi.

### Karar

`src/features/shell/screen-state.ts` — `demoError` · `screenState` ·
`emptied` · `noContract`.

**Hiçbiri hook DEĞİL** ve bu bilinçli: saf fonksiyonlar renderer olmadan
test edilebilir. Repo bu dersi `mockGate`te bir kez öğrenmişti — kritik
dal, doğrulanması için tarayıcı gerektirmemeli.

`emptyProps` adaptörü SİLİNDİ: `noContract` artık `Section`'ın beklediği
adları doğrudan üretiyor, çevrilecek bir şey kalmadı.

### Korunan davranışlar

- `loading` hâlâ TEK bir birincil kaynağa bağlı, "herhangi biri
  yükleniyor" değil. Hepsini OR'lamak en yavaş uç noktanın tüm ekranı
  iskelette tutması demek olurdu — üç ekranda da bugünkü davranış budur.
- `emptied` zarfı boşaltır ama **meta'yı korur**: `null` "veri yok"
  demektir, boş dizi + meta "ölçüldü, sonuç boş" demektir. İkisi ayrı
  ifadelerdir.

### Ölçüm

Lint 0 · `tsc` 0 · 55 dosya / **302 test** yeşil (295'ten +7).
`amazon-director` 815 → 802 satır; `executive-briefing` 376 → 368.

Dev sunucusu temiz derlemeyle yeniden başlatıldı; dört rotanın dördü de
derleme hatasız. `/amazon` BuyBox listesi sıralı (%62,0 · %71,3 · %78,4 ·
%88,0) ve onaylanmamış eşik uyarısı altında görünüyor.
`/mission-control` üç "sözleşme yok" bölümü tek şekilden basılıyor.

---

## UI-ADR-132 — Blok içerik saran tıklama tek primitive'de; sahte affordance kaldırıldı (S13)

**Durum:** ✅ Dondurulmuş — klavye yolu Storybook etkileşim testiyle ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-131 · `02-design-principles.md` §13 · `tokens.css` §FOCUS

### Bulgu — üç yerde aynı sözleşme, üçünde de yanlış

**A. Geçersiz iç içelik (2 yer).** `alert-stack.tsx` ve `timeline.tsx`
bir `<button>`ın İÇİNE blok içerik koyuyordu (`<p>`, `<div>`).
`<button>`ın içerik modeli *phrasing content*'tir; `<div>`/`<p>` *flow
content*'tir. Ekran okuyucu düğmenin erişilebilir adını bütün alt
metinleri birleştirerek üretir ve tek nefeslik bir cümle okur.

**B. Sahte affordance (1 yer).** `Card interactive` TAM TERSİ hatayı
yapıyordu: düz bir `<div>`e `cursor-pointer` ve
`focus-visible:border-line-focus` veriyordu ama `tabIndex`, `role` ve
klavye işleyicisi YOKTU. `<div>` odaklanabilir olmadığı için
`:focus-visible` **hiçbir zaman eşleşmiyordu**; `tokens.css:359`
genel odak kuralı da `[tabindex]` aradığı için uygulanmıyordu. Fare
kullanıcısı el imleci görüyor, klavye kullanıcısı öğeye hiç
**ULAŞAMIYORDU**.

### DÜRÜSTLÜK NOTU — üç kusur da GİZİLDİ, canlı değil

Ölçüldü: `AlertStack`e ve `Timeline`a bugün hiçbir ekran `onSelect`
geçmiyor, `Card interactive`in ise **sıfır tüketicisi** var. Yani bugün
kullanıcı bu kusurların hiçbirine çarpmıyor. Düzeltmenin değeri, biri
`onSelect` yazdığı gün kusurun sessizce doğmayacak olmasıdır — ve
klavye yolu, fareyle bakan hiç kimsenin fark etmediği türden bir
özelliktir.

### Karar

`src/components/ui/pressable.tsx` — `role="button"` + `tabIndex={0}` +
Enter/Space + zorunlu `label`.

- Blok içerik serbest kalır (native `<button>` saramazdı).
- `label` ZORUNLU: verilmezse ad bütün alt metinlerden üretilir.
- Space `preventDefault` eder; yoksa tuş sayfayı kaydırır ve kullanıcı
  öğeyi seçerken ekran altına kayar.
- `Card interactive` artık yalnız hover görünümü açar; tıklama ve klavye
  yolu `Pressable` ile SARARAK verilir. Card bir düğme değildir, ona
  `tabIndex` uydurulmaz.

### `Stat.tone` birlik tipine bağlandı

`mission-control` `tone`u serbest `string` alıp doğrudan `className`e
enterpole ediyordu: **herhangi** bir sınıf (token dışı bir renk dahil)
tip denetiminden geçerdi ve ESLint'in token kuralı template içindeki
değişkeni göremezdi. `STAT_TONE` birliği izin verilen tonu derlemede
kilitler. Ekranda ölçüldü: beş sayaç birebir aynı sınıfları basıyor.

### Ölçüm

Lint 0 · `tsc` 0 · 56 dosya / **305 test** yeşil (302'den +3).

Yeni üç hikâye görsel değil **sözleşme** testidir: `Tab` ile odaklanır,
`Enter` ve `Space` ayrı ayrı tetikler, sarılan içerikte iki `<p>` bulunur
ve kök `DIV`dir — yani `<button>`ın saramayacağı içerik gerçekten
sarılıyor.

---

## UI-ADR-133 — Rota sınırları: beyaz sayfa yerine beş adımlı hata (S13)

**Durum:** ✅ Dondurulmuş — tarayıcıda ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-132 · `10-component-library.md` §11 · §12

### Bulgu

`src/app/` altında **hiçbir** `error.tsx` ya da `not-found.tsx` yoktu.

- Bir ekran render sırasında patladığında React ağacı çöküyor ve
  kullanıcı **boş beyaz sayfa** görüyordu — kabuk, menü, hatta "bir şey
  ters gitti" cümlesi bile olmadan.
- `[[...slug]]/page.tsx` bilinmeyen yol için `notFound()` çağırıyordu ama
  karşılığı yoktu: Next'in biçimlendirilmemiş dahili sayfası basılıyordu.

Bu, §11'in ("Kullanıcı hiçbir zaman sadece 'Error' görmez") sessizce
ihlal edildiği tek yerdi: bölüm bazlı hatalar `Section`/`ErrorState` ile
beş adımı dolduruyordu ama BEKLENMEYEN bir istisnanın yakalayıcısı yoktu.

### `error.tsx` — `(shell)` içinde, ve ÇALIŞIYOR

Tarayıcıda ölçüldü: geçici olarak patlayan bir rota eklendi,
`/patlat-deneme`. Sonuç: beş adımlı hata kutusu göründü, "Yeniden dene"
düğmesi geldi ve **kabuk ayakta kaldı** — sidebar ve navigasyon
çalışmaya devam etti, kullanıcı başka bir workspace'e geçebildi. Sonra
deneme rotası silindi.

`reset()` React'in kendi kancasıdır: segmenti yeniden render eder,
sayfayı yenilemekten farkı uygulama durumunun (React Query önbelleği
dahil) korunmasıdır.

⚠️ `curl` ile İLK istekte dahili hata sayfası görünür — dev SSR'ın
davranışıdır, sınırın kusuru değildir. Sınır istemcide devreye girer.

### `not-found.tsx` — KÖKTE olmak ZORUNDA (ölçüldü)

Dosya önce `app/(shell)/not-found.tsx`e, sonra doğrudan
`app/(shell)/[[...slug]]/not-found.tsx`e kondu. **İKİSİ DE ÇALIŞMADI**;
her ikisinde de Next kendi dahili sayfasını (`id="__next_error__"`)
basmaya devam etti — dev sunucusu temiz önbellekle yeniden başlatılarak
doğrulandı. Yalnız `app/not-found.tsx` devreye giriyor.

**Bedeli:** kök layout'un altında olduğu için `(shell)/layout.tsx`
uygulanmaz — 404 sayfasında sidebar ve komut paleti YOKTUR. Kabuğu orada
elle kurmak kompozisyonu ikinci bir yerde tekrarlamak olurdu; 404 için
bu takas kabul edildi ve dönüş yolu açık bir bağlantıyla verildi.

**Bir sonraki oturuma not:** route-group içine `not-found.tsx` koymayı
TEKRAR DENEME. Denendi, ölçüldü, çalışmıyor. Not dosyanın başına da
yazıldı.

### `loading.tsx` BİLEREK EKLENMEDİ

Ekranlar yüklemeyi `Section` iskeletleriyle bölüm bazında zaten
yönetiyor (UI-ADR-131 `screenState`). Rota seviyesinde ikinci bir
yükleme yüzeyi eklemek, aynı geçişte iki ayrı iskelet gösterip
titremeye yol açardı.

### Yan düzeltme — yakalayıcı sayfa primitive kullanıyor

`[[...slug]]/page.tsx` ham `<h1 className="text-xl font-semibold">` ve
ham `<p>` yazıyordu; diğer HER ekran `Heading`/`Label` kullanıyor. Ölçek
değişse bu sayfa geride kalırdı.

### Ölçüm

Lint 0 · `tsc` 0 · 56 dosya / 305 test yeşil.
`/briefing` `/amazon` `/mission-control` `/goals` → 200 ·
`/bilinmeyen-ekran` → **404** ve doğru metin + dönüş bağlantısı.

---

## UI-ADR-134 — `amazon-director` dikişlerinden ayrıldı; feature katmanı gerçek kod aldı (S13)

**Durum:** ✅ Dondurulmuş — ekranda ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-130 · UI-ADR-131 · gavadolar dikiş önerisi

### Bulgu

`amazon-director.tsx` **802 satırdı** ve tek başına on ayrı sorumluluk
taşıyordu. Hedef ölçek (`1.iş`): 50–150 ideal · 200+ bölünmeli ·
400+ **yeniden tasarlanmalı**.

### Karar — dikişlere göre, satır sayısına göre DEĞİL

Meclisin (gavadolar) işaret ettiği iki dikiş alındı:

| Çıkan | Nereye | Neden ayrı |
|---|---|---|
| `GlanceView` (196 satır) | `features/amazon/director/glance-view.tsx` | Dışarıdan veri ALMAZ; zarfı props ile alır, sorgu çalıştırmaz. Ekranın kaynağı değişse bu kart değişmez. |
| `skuColumns()` (103 satır) | `features/amazon/director/sku-columns.tsx` | Sütun tanımı bir VERİ→HÜCRE eşlemesidir, ekran düzeni değildir. Yerleşim değişince bu dosyaya dokunulmaz. |

Ekran 802 → **496 satır**; kalanı kompozisyon ve veri orkestrasyonu.

"Sırf dosya küçülsün diye 20 küçük bileşen" yapılmadı — meclisin açık
şartıydı. Üçüncü kolon bölümleri yerinde bırakıldı çünkü onlar ekranın
DÜZENİdir; ayrı dosyaya taşımak okumayı zorlaştırırdı.

### Ölçüm

Lint 0 · `tsc` 0 · 56 dosya / **305 test** yeşil.

⚠️ Test koşumu bir kez 12/56 dosyada düştü: `Failed to connect to the
browser session ... within the timeout`. **Kod hatası değildi** — dev
sunucusu aynı anda koşarken Storybook tarayıcı projesi kaynak
bulamıyor. Dev sunucusu kapatılınca 56/56 geçti. Bir sonraki oturuma
not: tam paketi çalıştırmadan önce dev sunucusunu kapat.

Tarayıcıda `/amazon`: Executive Glance kartı, AMAZON HEALTH sayacı, SKU
Health tablosu ve onaylanmamış eşik uyarısı — hepsi çiziliyor.

---

> ⚠️ **Numara çakışması — beşincisi.** Bu blok `feature/s13-frontend-architecture`
> dalında **UI-ADR-129** olarak yazılmıştı. Dal `9e7904a`'dan çıktıktan sonra
> `main` S14'ü aldı ve aynı numarayı DONDURDU. Merge edilmiş ve dondurulmuş
> olan kazanır; lokal olan taşınır. Kod yorumlarındaki üç referans da güncellendi.

## UI-ADR-135 — Tek veri borusu: fixture ayrı bir zincir değil, bir taşıyıcıdır (S13)

**Durum:** ✅ Dondurulmuş — dört ekranda ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-113 · UI-ADR-115 · UI-ADR-123 · S7 veri katmanı

### Bulgu — repoda İKİ paralel veri zinciri vardı

Sayıldı, tahmin edilmedi:

| | Zincir A | Zincir B |
|---|---|---|
| Giriş | `useOdinQuery` | `useMockData` |
| Önbellek | React Query | `use-mock.ts` içinde modül-global `Map` |
| Şema | zod | **yok** |
| Tazelik yeniden hesabı | var | **yok** |
| Evren anahtarı | var | **yok** |
| Çöp toplama | var | **yok** |
| Hata kanalı | `OdinError` | **`MockState` tipinde `error` alanı HİÇ YOKTU** |
| Ekran yuvası | 6 | **15** |

Yani ekranların çoğunluğu, S7'de kurulan bütün kapıların DIŞINDAN
besleniyordu. En ağır sonuç hata kanalıydı: o 15 bölüm için bir hata
oluşsa bile ekrana çıkacak yol yoktu — sessizce boş kalırdı.

Bu yalnız tekrar değil, **güven** sorunudur: aynı ekranda yan yana duran
iki sayıdan biri doğrulanmış borudan, diğeri doğrulanmamış borudan
geliyordu ve bakan kişi hangisinin hangisi olduğunu ayırt edemiyordu.

### Karar

Zincir B kaldırıldı. `src/lib/data/odin-fixture.ts` → `useOdinFixture(key)`
fixture'ı aynı borunun bir **taşıyıcısı** yapar. `use-mock.ts` ve
`mock-gate.test.ts` silindi.

Desen zaten vardı: `odin-state.ts` canlı direktörler için
`IS_MOCK ? loadMock(...) : httpLoad(...)` yazıyordu. Yeni bir mimari
icat edilmedi, var olan doğru desen 15 yuvaya genişletildi.

### Şema kapsamı — UI-ADR-113 KORUNDU

"Mock-only" şema yine YAZILMADI. Ayrım şöyle netleşti:

- **Telden gelen veri** → payload şeması ZORUNLU.
- **Süreç içi fixture** → payload'ı biz yazdık, `satisfies` ile derlemede
  zaten kilitli; tekrar doğrulamak kendi yazdığımızı kendimize
  kanıtlamaktır.

Her iki durumda da **zarf doğrulanır** (`meta.source` · `lastUpdated` ·
`freshness` · AI-confidence kuralı) — atlanmaz.

### Gerçek modda sorgu HİÇ koşmaz

`enabled: IS_MOCK`. Bilinçli ve davranışı birebir korur: `loadMock`
gerçek modda `null` döner; `null` `parseEnvelope`'a girseydi sözleşme
hatası fırlatırdı ve ODIN'in henüz **yayınlamadığı** bir bölüm ekranda
kırmızı bir hata gibi görünürdü. Doğru anlatım "sözleşme yok" boş
durumudur (UI-ADR-096). Kapalı sorgu
`envelope: null · error: null · loading: false` döner ve `Section`
bugünkü boş metnini aynen basar.

Yan fayda: kapalı sorgu `loadMock`'u çağırmaz — UI-ADR-123'ün üretim
paketi kapısı bozulmadan kalır.

### `MockBadge` yer değiştirdi

`src/mocks/` → `src/components/ui/`. Rozet mock ÜRETMEZ, yalnız `IS_MOCK`
okuyup etiket çizer; `src/mocks/` altında durması dört ekranın mock
katmanına import atmasına sebep oluyordu.

### Ölçülen sonuç

`screens → mocks` kenarı **8 → 0**. Fixture erişimi tek kapıya
(`lib/data/odin-fixture.ts`) indi.

Testler: 54 dosya/292 test → 53 dosya/290 test. Fark hesaplanmıştır:
emekli `mockGate` testleri (−4), React Query'nin devraldığı tekilleştirme
testi (−1), yeni gerçek-mod fail-closed testi (+1), yeni hata
sınıflandırma testleri (+2).

Fail-closed güvencesi (UI-ADR-115) kaybolmadı, **taşındı**: artık emekli
uygulamada değil, hayatta kalan yolda ölçülüyor —
`registry.test.ts` her anahtarın gerçek modda `null` döndüğünü doğrular.

### Ölçüm — mock modda, dev sunucusunda

`/briefing` dokuz bölümüyle, `/amazon` Executive Glance + KPI şeridi +
48 satırlık SKU tablosuyla, `/mission-control` Operational Status
sayaçlarıyla render edildi. Konsolda hata yok.

---

---

## UI-ADR-136 — Etiket-değer gösterimi tek bileşende; metin tonu tek sözlükte (S13)

**Durum:** ✅ Dondurulmuş — ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-131 · UI-ADR-132 · CLAUDE.md §5 (bileşen tekrarı yasak)

### Bulgu — sayıldı, tahmin edilmedi

`19-s13-devir.md` §2.3 "20 ayrı status→stil haritası" diyordu. Kaynaktan
doğrulanınca tablo şu çıktı:

| İddia | Ölçüm | Karar |
|---|---|---|
| `ui/stat.tsx:20` ≡ `ui/typography.tsx:60` | **Birebir aynı** yedi giriş, iki adla (`StatTone` / `TextTone`) | Birleştirildi |
| `ui/icon.tsx:22` "aynı küme + info" | `text-icon` / `text-icon-active` / `text-icon-muted` — **farklı token kümesi** | Birleştirilmedi |
| `ui/timeline.tsx:29` | `bg-*` nokta + glyph — **farklı şey** | Birleştirilmedi |
| `mission-control.tsx:69` yerel `Stat` | `ui/stat.tsx`in satır satır kopyası; yalnız ton adları farklı (`neutral`≡`default`, `muted`≡`tertiary`) | Silindi |
| `executive-briefing.tsx:78-119` | Dört elle yazılmış `<dt>/<dd>` çifti, `Stat` ile AYNI sınıf dizesi | `Stat`a çevrildi |
| `StatTone` dışarıdan kullanılıyor mu | **Hiçbir yerde.** `TextTone` da yalnız kendi dosyasında | İkisi `Tone` oldu |

**Benzer görünmek aynı olmak değildir.** Devir belgesindeki "20 harita"
sayısı yüzeysel biçim benzerliğine dayanıyordu; `icon` ve `timeline`
haritaları aynı ANAHTAR adlarını taşıyor ama farklı DEĞER uzaylarına
bakıyor. Onları birleştirmek, tek bir sözlüğü üç ayrı token ailesine
hizmet etmeye zorlardı — tekrarı silmek yerine yanlış bir soyutlama
üretirdi. Yalnız birebir aynı olan iki tanesi birleşti.

### Kaybolan kural — asıl bulgu bu

Elle yazılan `<dt>/<dd>` kopyaları `Stat`ın SINIF dizesini taşıyordu ama
DAVRANIŞINI taşımıyordu: `Stat`, düz sayıyı satır içi bir `span`e sarar
çünkü `.odin-num` sayıları SAĞA hizalar ve blok bir elemana verilirse sayı
etiketinden kopar (03-...md §11, S5'te görsel incelemede yakalanmıştı).
Kopyalar bu tek satırlık kuralı düşürmüştü. Tekrarın maliyeti hacim değil,
**kuralın sessizce kaybolmasıdır.**

### Kapı

`ui/stat.stories.tsx` — reponun `components/ui` altındaki ilk davranış
testi (devir §2.7'de "hiç hikâyesi yok" diye listelenmişti). Dört story,
üçü `play` ile: düz sayı satır içi sarılır · düğüm değer OLDUĞU GİBİ geçer
(`Stat` etrafına kendi span'ini sarmaz, sarsaydı `size="lg"` "veri yok"
tiresini sayı boyutunda büyütürdü) · ton sözlüğü `typography` ile ortaktır.

İlk yazımda iki iddia düştü ve **bileşen değil test yanlıştı**: `NoData`
zaten `odin-num` taşıyor (tire sayı sütununda hizalansın diye, kasıtlı).
Ayırt eden şey sınıfın varlığı değil, `Stat`ın boyut sınıfının YOKLUĞU.

### Ölçüm

`tsc` 0 · `lint` 0 hata · **58 dosya / 314 test**. Dağılım: 56/305 (S13'ün
136 öncesi hâli) + 1 dosya/5 test (main'in S14'ü, merge ile geldi) +
**1 dosya/4 test (bu ADR'nin kapısı)**.

### Tuzak #1 YANLIŞ TEŞHİS EDİLMİŞ — devir belgesi düzeltildi

Devir §3.1 "tam test paketinden önce dev sunucusunu KAPAT, yoksa Storybook
12/56'da düşer" diyordu. Ölçüm: dev sunucusu (port 3000, üstelik BAŞKA bir
worktree'nin) açıkken de `--shard=1/3` ve `2/3` sorunsuz geçti; `3/3` bir
kez düştü, **hiçbir şey değiştirmeden tekrar çalıştırılınca geçti**.

Sebep dev sunucusu değil: Playwright tarayıcı oturumu, aynı anda toplanan
dosya sayısı arttıkça bağlantı zaman aşımına uğruyor — **kararsız (flaky)
bir bağlantı**, kod hatası da değil, sunucu çakışması da değil.

**Doğru işlem:** DİZİN bazında parçala (`--shard` de işe yarar ama dizin
bölmesi ölçümde daha kararlı çıktı — `--shard=1/3` üst üste iki kez düştü,
AYNI dosyalar `src/components/ui` olarak koşunca 18/18 geçti). Dev
sunucusunu kapatmaya gerek yok — ve başkasının worktree'sine ait olabilir.

---

## UI-ADR-137 — Zarf ve kayıt fabrikaları birer kez yazılır (S13)

**Durum:** ✅ Dondurulmuş — ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-094 · UI-ADR-115 · UI-ADR-136

### Bulgu

İki fabrika, iki dosyada, **birebir aynı gövdeyle**:

| Fabrika | Kopyalar | Yeni yeri |
|---|---|---|
| `kpi(over)` | `mocks/briefing.ts:404` · `mocks/amazon.ts:338` | `mocks/envelope.ts` → `mockKpi` |
| `envelope(generatedAt, data)` | `lib/data/odin-state.ts:49` · `lib/data/odin-amazon.ts:82` | `types/data-envelope.ts` → `internalEnvelope` |

**Gerekçe yalnız BİR kopyanın başında duruyordu.** `envelope()`in neden
`source: "internal"` yazdığı ve `freshness`in neden yer tutucu olduğu
(UI-ADR-115: `parseEnvelope` onu istemcide yeniden hesaplar) `odin-state.ts`te
yazılıydı; `odin-amazon.ts`teki ikiz çıplaktı. İkiye bölünmüş bir kural,
yarısı okunmayan bir kuraldır.

Tekrarın maliyeti dört satır değil, üç varsayılanın **sessizce
ayrılabilmesidir**: `status: "available"` · `value: null` (anti-fake) ·
`asOf`. Birine dokunulup diğerine dokunulmadığı gün, iki ekran aynı
sözleşmeyi farklı yorumlar ve fark hiçbir testte görünmez.

### `mockEnvelope` ile `internalEnvelope` NEDEN AYRI KALDI

Bunlar da zarf üretir ama birleştirilmemelidir: `mockEnvelope`
`source: "mock"` damgalar ve `src/mocks/` altında yaşaması UI-ADR-094'ün
kuralıdır — tek bir `source: "mock"` araması tüm mock'ları bulabilmelidir.
Ortak bir fabrikaya çekmek o aramayı kör ederdi.

### YAPILMAYAN — `toISOString().slice(0, 10)`

Devir §2.3 bunu da tekrar olarak listeliyordu (`odin-amazon.ts:238`,
`mocks/amazon.ts:575`, `mocks/briefing.ts:36`). **Çıkarılmadı.** Üç ayrı
katmanda üç kez geçen bir JS deyimi bu; ortak bir yardımcıya çekmek iki
katman arasında yeni bir bağımlılık kurar ve karşılığında hiçbir POLİTİKA
merkezileşmez. Tekrar her zaman kusur değildir — merkezileşmesi gereken
şey bir KARARDIR, bir deyim değil.

### Kapı

`data-layer.test.ts` §8 — dört iddia. Kritik olanı: `internalEnvelope`in
`freshness`i 48 saat eski bir damgada bile `"live"` döner, ama
`parseEnvelope`ten geçince `"stale"` olur. Adaptörün damgası yer
tutucudur; tek doğru kaynak istemcideki yeniden hesaptır.

Bu iki fabrikanın varsayılanlarını **hiçbir test okumuyordu** —
kopyaların sessizce ayrılabilmesinin asıl sebebi buydu.

### Ölçüm

`tsc` 0 · `lint` 0 hata · **58 dosya / 318 test** (+4 test, bu ADR'nin kapısı).

---

## UI-ADR-138 — Yüzde gösteriminin tek yolu: `Pct` (S13)

**Durum:** ✅ Dondurulmuş — ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-093 · UI-ADR-136 · UI-ADR-137

### Bulgu

Aşağıdaki beş satır **ON yerde** kelimesi kelimesine yazılıydı (devir
belgesi "9 kez" diyordu; sayıldı, onuncusu `sku-columns.tsx:114`'te):

```tsx
<Num value={toPercentUnit(x, scale)} format="percent" fractionDigits={1} … />
```

`ppc-overview` · `amazon-director` · `amazon-sku-panel` ×3 ·
`glance-view` ×4 · `sku-columns`.

### Neden `percent.ts` yetmedi

`lib/format/percent.ts` zaten vardı ve ölçek DÖNÜŞÜMÜNÜ tekilleştirmişti —
kendi başlığında gerekçesi de yazılıydı: *"Dört kopya, bir gün üçünün
düzeltilip birinin unutulması demektir."*

Ama dönüşümden sonra gelen iki **SUNUM KARARI** — `format="percent"` ve
**bir ondalık** — on kopyada yaşamaya devam ediyordu. Yarısı
merkezileştirilmiş bir kural, tam olarak merkezileştirilmemiş demektir.
Ondalık sayısı bir gün değişirse onun onu da bulunmak zorunda; dokuzu
bulunup biri unutulduğunda ekranda %71,5 ile %71 yan yana durur ve
hangisinin doğru olduğu anlaşılmaz.

### Anti-fake KORUNDU

`Pct` ham değeri alır, dönüşümü kendi yapar. Ölçek bildirilmemişse
`toPercentUnit` `null` döner ve `Num` `NoData` basar — 0 ya da tahmin
ASLA basılmaz (UI-ADR-093). Bu davranış bileşenin içine taşındı, çağıranın
hatırlamasına bırakılmadı.

### Kapı

`typography.stories.tsx` → `Percentages`. Üç iddia: ölçek `0-100` ile
`0-1` **AYNI** çıktıyı verir (dönüşüm çağıranda değil burada) · çıktı
`%71,5`tir · ölçek yoksa `—` + erişilebilir gerekçe.

İlk yazımda ikinci iddia düştü: `/71,5\s*%/` bekliyordum, **tr-TR yüzde
işaretini BAŞA yazıyor** (`%71,5`). Yine bileşen değil test yanlıştı.
Biçimlendirme yerelden gelir, elle kurulmaz.

### Ölçüm

`tsc` 0 · `lint` 0 hata · **58 dosya / 319 test** (+1 test, bu ADR'nin kapısı).
Çağrı yeri: **10 → 0**.

---

## UI-ADR-139 — "Test edilebilir" diye export edilen sekiz fonksiyon nihayet test edildi (S13)

**Durum:** ✅ Dondurulmuş — ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-130 · UI-ADR-100 · CLAUDE.md §2

### Bulgu

Sekiz saf fonksiyon JSX'ten çıkarılıp export edilmişti, üçünün başında
kelimesi kelimesine *"kural tek yerde, test edilebilir"* yazıyordu.
Sayıldı: **hiçbirinin testi yoktu ve hiçbiri kendi dosyası dışından
import edilmiyordu** — dış referans sayısı sekizinde de **0**.

`sortIntelligence` · `actionableAlerts` · `sortCampaigns` ·
`sortDecisions` · `dueDeferrals` · `monitoredDecisions` ·
`rotationSeconds` · `canRenderSimulation`.

Test edilmeyen bir export iki dünyanın da kötüsüdür: API yüzeyini
genişletir, karşılığında hiçbir davranış kilitlemez. "Test edilebilir"
bir niyet beyanıdır, bir kapı değil.

### Kilitlenen şey biçim değil KARAR

Bu sekiz fonksiyon **ekranda görünen sıranın ve görünmeyenin tamamıdır**;
bugüne kadar yalnız gözle doğrulanabiliyordu. 25 iddia, `src/lib` dışında
yazılan ilk saf-mantık test dosyası (`components/executive/helpers.test.ts`,
tarayıcı gerekmez).

Öne çıkan üçü:

- **`dueDeferrals(x, null)` BOŞ döner.** İstemci saati yokken "vadesi
  geldi" demek doğrulanmamış bir iddiadır — anti-fake'in zaman hâli.
- **Bilinmeyen `severity`/`status` LİSTEDE KALIR, sona düşer.** ODIN
  sözlüğü genişlerse yeni bir kayıt sessizce kaybolmamalı: görünmeyen bir
  uyarı, olmayan bir uyarıdan tehlikelidir.
- **`rotationSeconds(null)` = en YAVAŞ.** Halka gerçekten dönüyor, hızı
  bir ölçüme bağlı. Ölçüm yokken hızlı dönmek "sistem yoğun çalışıyor"
  diye okunur ve sahte göstergedir.

### Testin yakaladığı iki gerçek hata

**1 — `decision-queue.tsx` başlığı KODLA ÇELİŞİYORDU.** Dosyanın tepesi
*"`priority` artan, eşitlikte finansal etki büyük olan önce"* diyordu;
oysa `priority` ve `financialImpact` UYDURMAYDI ve **UI-ADR-100 ile
silinmişti**. Kod katmana + güvene göre sıralıyordu. Başlık kaldı ve
dosyayı okuyan herkese yanlış kuralı öğretiyordu. Düzeltildi.

**2 — İlk yazımda testin kendisi yanlıştı.** `sortCampaigns`e
`"critical"` verdim; o bir `CampaignStatus` DEĞİL, yani iki kayıt da
bilinmiyordu ve sıralama haklı olarak girdi sırasını korudu. Bileşen
doğru, test yanlıştı — bu oturumda üçüncü kez.

### Ölçüm

`tsc` 0 · `lint` 0 hata · **59 dosya / 344 test** (+1 dosya / +25 test).

---

## UI-ADR-140 — Her metrik kendi ölçüm penceresini söyler (S15)

**Durum:** ✅ Dondurulmuş — ekranda ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** ODIN ADR-0138 · ADR-0147 · ADR-0149 · `backend-istekleri.md` #13

⚠️ **NUMARA NEDEN 140?** `main`'de UI-ADR-129 var (S14, benim) ve
`feature/s13-frontend-architecture` dalında **129–134** bekliyor — beşinci
numara çakışması. Aralık bırakıldı ki S13 merge olurken çarpışma
büyümesin. Bu bir tercih değil, paralel oturum gerçeğine karşı bir
önlem; kalıcı çözüm numaraların `main`'den alınması.

### Karar

ODIN her KPI'a kendi `report_period`'unu koyuyordu (ADR-0138); arayüz
yalnız `asOf`u okuyordu. Yaş sorusu cevaplanıyor, **pencere sorusu
cevaplanmıyordu**: "38 adet satıldı" ile "hangi 38 gün" ayrı bilgilerdir.

**1. Sözleşme genişledi.** `ExecutiveKPI.reportPeriod` eklendi
(opsiyonel, `null` kabul). Meclis 2/2: bu bir sözleşme işidir, yalnız
görsel değil — arayüz pencereyi türetemez.

**2. Pencere NORMALLEŞTİRİLMEZ.** Kayıt "30 Temmuz'da biten 7 günlük
pencere" diyorsa ekran da onu der. Sabit bir tarih aralığına çevirmek,
kaydın söylemediği bir kesinlik iddia etmek olurdu. (SkuHealth'teki
başlangıç hesabı AYRI bir durumdur ve orada beyanın aritmetiğidir.)

**3. HER kartta gösterilir, yalnız farklı olanlarda değil.** Meclis
burada ayrıştı: terra "hepsi aynıysa kartı kirletme, başlıkta göster",
luna "her kartta kompakt göster — dönemi karttan koparmak bağlamı da
koparır ve ekran okuyucuda metrik penceresiz kalır". luna'nınki alındı:
kart kendi kendini anlatmalı. Bugün zaten üç farklı pencere yan yana.

**4. Beyan yoksa `null` — uydurulmaz.** Alan opsiyonel: pencere
yayınlamayan bir üretici için de sözleşme geçerli kalır.

### Ölçüm — gerçek modda, üretim derlemesiyle

`/amazon` KPI şeridi: "Satılan adet 38 · **son 7 gün · 30 Tem'e kadar**",
"Kritik stoktaki SKU 3 · **anlık**", reklam metrikleri kendi
1–30 Temmuz aralığıyla.

## UI-ADR-141 — Fırsat bir GÖRÜNÜM olarak bağlandı; iki bayat yorum ölçüme dönüştü (S16)

**Durum:** ✅ Dondurulmuş — ekranda ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** ODIN ADR-0143 §3 · ADR-0154 · ADR-0150 · UI-ADR-113

⚠️ **NUMARA:** UI-ADR-140'ın bıraktığı aralık sürüyor —
`feature/s13-frontend-architecture` hâlâ 129–134'ü tutuyor.

### Karar

**1. `Opportunity` tipi ve şeması GERİ GELDİ — gerekçesi tersine döndüğü
için.** Arayüz onları bilerek yazmamıştı ve o zaman haklıydı: ADR-0143 §3
fırsatı AYRI KAYIT olarak reddetmişti, karşılığı olmayan bir kavrama şema
yazmak UI-ADR-113'ün yasağıydı. ODIN ADR-0154 ikinci bir kayıt türü
yaratmadan, mevcut iyileştirme kayıtları üzerinde bir GÖRÜNÜM yayınladı.
Yasak "karşılığı olmayana şema yazmak"tı; karşılığı olana yazmamak da
aynı ailenin hatası olurdu. Eski gerekçe silinmedi, yerine bu yazıldı.

**2. `AIRecommendationView` KULLANILMADI.** ADR-0143 §3'ün "fırsat öneri
kaydının görünümüdür" cümlesi ekranı o bileşene yönlendirmişti; ölçünce
uymadığı görüldü: o tip yedi zorunlu açıklanabilirlik alanı ister
(alternatifler, güven, doğrulama zamanı) ve iyileştirme kaydında bunların
karşılığı yoktur. Boş geçmek uydurmak olurdu. Zarf olduğu gibi basılıyor;
yeni bir `OpportunityCard` da icat edilmedi.

**3. "FİLTRE UYGULANMIYOR" uyarısı KALKTI — çünkü artık doğru değil.**
Ekranda "pozitif sınıfı işaretleyen alan ODIN'de bildirilmedi, bu yüzden
liste filtrelenmiyor" yazıyordu. Dürüst ama artık bayat: ADR-0154 kuralı
beyan etti (yalnız `detected`, yalnız uygulanabilir adımı olanlar) ve
sıralamayı da ODIN'e verdi (`prioritize()`, deterministik). Arayüz ikisini
de icat etmiyor — bu yüzden uyarıya da gerek kalmadı.

**4. Öncelik rozeti glyph'siz ve renk semantiksiz.** `showGlyph={false}`:
badge'in `○` işareti bir DURUM göstergesidir, öncelik seviyesi değil — ve
"high"/"medium" metni seviyeyi zaten söylüyor. `high → danger` eşlemesi de
yapılmadı: ODIN önceliği ETİKET olarak yayınlıyor, arayüz ona kendi
ciddiyet skalasını giydiremez. (Aynı hata S15'te RuntimeDirectorCard'da
çift glyph olarak canlı ekranda yakalanmıştı.)

**5. `ai_queue` / `ai_cost` yorumu ÖLÇÜME dayandırıldı.** Kayıtta "🔜 S9
(AI Gateway) kurulunca kendiliğinden gelir" yazıyordu. S9 geldi, bu ikisi
gelmedi — ve `available: false` kalmalarının sebebi artık "henüz
yapılmadı" değil: ODIN ADR-0150 ile AI yönlendirmesini gerçekten kurdu
(`odin/ai.py`) ama **kuyruk kavramı yok** (çağrılar sıraya girmez; sıfır
göstermek "kuyruk boş" iddiası olurdu, oysa doğru cevap "kuyruk diye bir
şey yok") ve **maliyet kısmi** (`ai.usage()` yalnız kendi maliyetini
bildiren çağrıları toplar, kaçının bildirdiğini `cost_known_calls` olarak
yanına yazar; fiyat tablosu olmadan tek bir rakam bildirmeyenleri sıfır
sayar). Şart ODIN tarafında ve yazılı.

**6. Mock anahtarı YENİDEN ADLANDIRILMADI, ŞEKLİ DEĞİŞTİ.**
`briefing.opportunities` aynı kaldı; tek tüketicisi vardı ve yerini
değiştirmedi. İkinci bir anahtar açmak, ölü anahtarı da beraberinde
bırakırdı.

### Ölçüm — gerçek modda, üretim derlemesiyle

`NEXT_PUBLIC_ODIN_DATA_MODE=odin`, `next start`, canlı cockpit (8765):
Fırsatlar bölümünde **10 gerçek kayıt**, `○` yok. İlk kart: "Job
'ads_ingest' failing repeatedly (14x) · high · Önerilen adım: Investigate
and stabilise the 'ads_ingest' job. · Kanıt: failures=14 · job=ads_ingest
· telemetry · 3 gün önce". Kanıttaki SAYI korundu — "backlog" değil
"remaining_videos=257".

**Not — cockpit yeniden başlatılmalıydı.** İlk denemede `/api/state`
`opportunities` anahtarını hiç taşımıyordu: sunucu 16:23'te başlamış,
ADR-0154 17:48'de commit edilmişti. Bu ders üçüncü kez tekrarlandı.

301 test yeşil (161 birim + 140 storybook), `build:release` temiz
(188 mock imzası tarandı).

---

## UI-ADR-142 — 140 Storybook testi bir yıldır koşmuyordu; kapı fail-closed yapıldı (S17)

**Durum:** ✅ Dondurulmuş — soğuk önbellekte ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-121 eki (kapı sessizce körleşiyordu) · ODIN ADR-0156

⚠️ **NUMARA:** `main`'den alındı. 129–134 hâlâ
`feature/s13-frontend-architecture` dalında REZERVE.

### Ölçüm — iddia değil

```
npx vitest run
  Test Files  12 passed (55)      ← 55 dosyanın 43'ü HİÇ KOŞMADI
  Tests      161 passed (161)
  Errors       1 error  "Failed to connect to the browser session"
```

Bir üstteki UI-ADR-141 dahil son beş karar kaydı **"301 test yeşil
(161 birim + 140 storybook)"** yazıyordu. 161'i doğruydu. **140'ı hiç
koşmamıştı.** `package.json`'da bunu koşturacak bir `test` script'i de
yoktu — yalnız `build:release` vardı.

### Kök neden — iki katmanlı, ikisi de ölçüldü

**1. Soğuk `node_modules/.vite` ile tarayıcı oturumu kurulamıyor.**
Chromium'un kendisi sağlam: doğrudan Playwright ile **1.3 sn**'de açılıyor
ve yerel bir HTTP sunucusuna ulaşabiliyor. Süreyi yiyen, Vite'ın ilk
`optimizeDeps` geçişi. Orkestratör sayfası vitest'in **60 sn**'lik
varsayılan `browser.connectTimeout`'undan sonra hazır oluyor; koşu
61.86 sn'de "no tests" ile bitiyor.

**2. Ayar proje bloğunda SESSİZCE yok sayılıyor.** vitest bu değeri
`project.vitest.config.browser.connectTimeout ?? 6e4` diye okuyor
(`node_modules/vitest/dist/chunks/cli-api.*.js`), yani **kök**
yapılandırmadan. İlk düzeltme `projects[1].test.browser` içine yazıldı ve
yeşil sonuç verdi — ama o yeşil **sıcak önbellekten** geliyordu, ayardan
değil. `rm -rf node_modules/.vite` ile ölçünce aynı 61.86 sn'ye çarptı.
Kök seviyeye taşındı: `test.browser.connectTimeout = 300_000`.

### Karar

`scripts/verify-storybook-tests.mjs` + `test:unit` / `test:storybook` /
`test:ci` script'leri. Kapı komutun **çıkış koduna güvenmez** — `vitest
list` aynı çöküşte exit 0 döndürdü. Rapor dosyasını önce siler, sonra
VARLIĞINI, JSON'luğunu ve içindeki sayıları denetler: 0 düşen, 0 atlanan,
0 todo, ≥ alt sınır.

**Alt sınır, sabit sayı değil — sahip kararı.** Sabit 140 her yeni
story'de kapıyı kırardı. Alt sınır yalnız DÜŞÜŞÜ yakalar.

**Meclis (gavadolar 2/2) daha güçlüsünü önerdi ve alınmadı:** keşfedilen
test KİMLİKLERİNİN tamamının koştuğunu doğrulamak — böylece sayı korunurken
içeriğin bozulması da yakalanırdı. Ölçüm engelledi: `vitest list --json`
çıktısını gürültüyle karıştırıyor, `--outputFile` bu sürümde dosya
yazmıyor, ve ayrı bir tarayıcı açılışı kapı süresini ikiye katlıyor.
Tavan `ponytail:` yorumuyla scriptte adıyla işaretlendi; yükseltme yolu
orada yazılı.

### Kapının kendisi doğrulandı — üç koşu

| Koşul | Beklenen | Ölçülen |
|---|---|---|
| `--self-check` (8 senaryo: 139 test · 0 test · düşen · skip · todo · temiz rapor + hatalı çıkış kodu) | kırmızı | ✅ hepsi |
| Soğuk önbellek + `connectTimeout: 1_000` | **kırmızı** | ✅ `KAPALI: geçen test 0 < alt sınır 140`, exit 1 |
| Soğuk önbellek + kökte `300_000` | yeşil | ✅ `AÇIK: 43 dosya / 140 test`, exit 0 |

Sıcak önbellekle yapılan ilk körleştirme denemesi yeşil kalmıştı —
tarayıcı 1 sn'de bağlandığı için. Kapıyı kör etmenin tek dürüst yolu
önbelleği de silmekti; bu, "kapıyı kasten kır" kuralının kendisinin de
ölçülmesi gerektiğini gösterdi.

### Sonuç

**301 test artık gerçekten koşuyor:** 161 birim + 140 storybook (43 dosya).
Bundan önceki her "301 yeşil" iddiası yarısı ölçülmemiş bir iddiaydı.

---

> ⚠️ **Numara çakışması — sekizinci.** Bu blok S13 dalında **UI-ADR-142**
> olarak yazılmıştı. `feature/s17-storybook-gate` aynı numarayı kullandı ve
> `main`'e ÖNCE indi (`67e0bfc`), S13 sonra (`5519bc0`). Kural: merge edilmiş
> ve yayında olan kazanır — **S17'nin 142'si kaldı, S13'ünki 150'ye taşındı.**

## UI-ADR-150 — Story bir DAVRANIŞ kanıtlar; envanter kapısı bunu ister (S13)

**Durum:** ✅ Dondurulmuş — ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-148 · UI-ADR-149 · gavadolar 2/2

### Bulgu — kendi kapımdaki açık

UI-ADR-148 "çağıranı yoksa hikâyesi olacak" kapısını kurmuştu. gavadolar
sordu: *"Ama şimdi o kapıyı doldurmak için story yazıyorsun — bu kapıyı
anlamsızlaştırmaz mı?"* Cevap **evet**: yalnız render eden bir story kapıyı
BİÇİMSEL olarak geçer, hiçbir davranış kanıtlamaz ve etiket yine tek başına
ölü kodu meşrulaştırır.

Ölçüldü: envanterdeki **dokuz bileşenin YEDİSİNİN** hikâyesinde hiç `play`
yoktu (`chart` · `tabs` · `tooltip` · `icon` · `avatar` · `sparkline` ·
`telemetry-bar`).

Kapıya ikinci kol eklendi: **hikâye en az bir `play` içerecek.** Yedisine
de gerçek sözleşme testi yazıldı — hepsi bir YOKLUK iddiası taşıyor:
rastgele avatar üretilmez · dekoratif ikon okunmaz · içeriksiz tooltip bağ
kurmaz · iki noktadan az veri çizgi çizmez · **ölçülemeyen nokta 0 olarak
çizilmez** (yol `d`sinde ikinci bir `M`) · kapalı telemetri kanalı ekranda
hiç yoktur · açık ama değersiz kanal "0" değil "—" yazar.

### §2.7 kapandı — yedi yeni story

`no-data` · `data-guard` · `threshold-note` · `meter` · `disclosure` ·
`confidence-breakdown` · `monitored-decisions-board`.

**En kritik olanı `data-guard`.** gavadolar 2/2 kuralı: *"görünmüyor"
yetmez, RENDER EDİLMEDİĞİ kanıtlanmalı* — görünmez bir çocuk yine de hesap
yapar, istek atar, patlar. Test bir `fn()` casusu kullanıyor ve `null`,
`undefined`, **meta'sız zarf** durumlarında çocuğun HİÇ ÇAĞRILMADIĞINI
gösteriyor. (Meta'sız zarf sınır durumu ayrıca anlamlı: gerçek ama
KAYNAKSIZ veri, uydurulmuş veriden daha sinsidir.)

`threshold-note`ta üçüncü bir durum ortaya çıktı ve teste girdi:
`provenance` YOKSA hiçbir iddia üretilmez — *"bilmiyorum"* ile
*"onaylanmadı"* ayrı şeylerdir; ikincisini yazmak olmayan bir yönetişim
bulgusu uydurmak olurdu.

### Dosya düzeni — gavadolar'ın TEK çelişkisi

terra "yedi ayrı dosya" (her sözleşme bağımsız), luna "dosya sınırı
bileşen sayısına değil DAVRANIŞ ve RİSK sınırına konur" dedi. Sentez:
anti-fake KAPISI olan üçü ayrı dosyada (`data-guard`, `threshold-note`,
`monitored-decisions-board`); gösterim primitive'i olan üçü tek dosyada
(`primitives.stories.tsx`) — reponun kendi emsali (`display.stories.tsx`
dört primitive'i kapsar) bunu zaten kabul etmişti. Başarısızlık çıktısı
yine ayrışıyor: her story'nin kendi adı var.

### ♻️ UI-ADR-149'in "kök neden" iddiası YANLIŞTI

141 `connectTimeout: 180_000`'i **proje** seviyesine yazmış ve tuzak #1'in
kök nedeni bulundu demişti. Ölçüldü, yanlıştı: Vitest bu değeri
`project.vitest.config.browser.connectTimeout ?? 6e4` ile **KÖK**
config'ten okuyor; proje içindekini sessizce yok sayıyor.

**Nasıl anlaşıldı:** proje seviyesine `connectTimeout: 1_000` konup
koşuldu — test 25 saniyede GEÇTİ. Ayar uygulansaydı 1 sn'de düşmeliydi.
Kaynak okundu, `?? 6e4` bulundu; gözlenen tüm düşüşlerin ~61 sn'de olması
da bunu doğruladı. Değer köke taşındı ve **deneyle** doğrulandı (kökte
1 sn ile anında düştü, 180 sn ile 50/50 geçti).

Ders, bu oturumda beşinci kez aynı: **bir düzeltmenin işe yaradığını
ölçmeden ilan etme.** Testin yeşil olması, düzeltmenin sebep olduğu
anlamına gelmez.

### Testin kendisi BEŞİNCİ kez yanlış çıktı

`chart` testi `<circle>` sayısına bakıyordu; nokta işaretçisi yalnız
klavye imleci için çiziliyor. Asıl değişmez yolun `d` niteliğindeydi.
Bileşen doğru, test yanlıştı.

### Ölçüm

`tsc` 0 · `lint` 0 hata · **65 dosya / 402 test** (unit 15/215 ·
storybook 50/187). `ChartProps` de export edildi (§2.3 kalemi).

---

## UI-ADR-143 — Ekranlar `features/<alan>/screen.tsx`e taşındı; kapı dosya adına bağlandı (S13)

**Durum:** ✅ Dondurulmuş — davranışsız taşıma, ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-130 · gavadolar 2/2

### Karar

`components/screens/` klasörü KALKTI. Altı ekranın hepsi kendi feature
alanına indi:

| Eski | Yeni |
|---|---|
| `components/screens/executive-briefing.tsx` | `features/briefing/screen.tsx` |
| `components/screens/mission-control.tsx` | `features/mission-control/screen.tsx` |
| `components/screens/goals.tsx` | `features/goals/screen.tsx` |
| `components/screens/intelligence-feed.tsx` | `features/intelligence-feed/screen.tsx` |
| `components/screens/amazon-director.tsx` | `features/amazon/director/screen.tsx` |
| `components/screens/amazon-sku-panel.tsx` | `features/amazon/sku/screen.tsx` |

`components/{ui,executive,layout}` **paylaşılan katman olarak kaldı** —
taşınan yalnızca ekranlar.

**Neden `screen.tsx`, neden `screens/` alt klasörü değil** (gavadolar 2/2):
`director` zaten Amazon'un gerçek alt alanı; ekran, `glance-view.tsx` ile
aynı alanın kompozisyon köküdür. Paralel ikinci bir sınıflandırma katmanı
(`features/amazon/screens/director.tsx`) aynı şeyi iki kez adlandırırdı.

**Neden D'den (büyük bileşenleri bölme) ÖNCE** (gavadolar 2/2): ekranlar
önce bölünüp sonra taşınsaydı, taşıma diff'i ve çakışma yüzeyi kat kat
büyürdü. Önce sahiplik sınırı, sonra bölme.

### Kapı: ayırıcı KLASÖR değil DOSYA ADI

`features/` altında ekran olmayan çok şey var (`selectors`,
`presentation`, `shell`, `director/glance-view`); `@/features/**` gibi bir
desen mimariyi kilitlerdi. Kural yalnız giriş dosyasını hedefliyor.

**Denendi — ve ilk deneme EKSİK ÇIKTI.** Dört ihlal enjekte edildi:

| İhlal | İlk desen |
|---|---|
| `@/features/briefing/screen` | ✅ yakalandı |
| `@/features/amazon/director/screen` | ✅ yakalandı |
| `../director/screen` (yukarı göreli) | ✅ yakalandı |
| `./director/screen` (**aşağı göreli**) | ❌ **KAÇTI** |

Desen tamamlandı, dördü de yakalanıyor. Bu repoda `@/components/*`
deseninin tek `*` yüzünden sessizce boş çıkması aynı hataydı: **kapı,
denenmeden kapı sayılmaz.**

Bir yan etki kapının çalıştığını ayrıca kanıtladı: `goals.tsx` için
yazılmış `react/forbid-dom-props` istisna YOLU bayatladı ve lint hemen
patladı — yol güncellendi.

### gavadolar'a verdiğim bir ölçüm YANLIŞTI

Danışırken *"`intelligence-feed`in hiçbir app/ rotası onu import etmiyor,
yalnız story'si var"* demiştim. Yanlıştı: `app/(shell)/context-panel.tsx`
onu da `amazon-sku-panel`i de import ediyor — ikisi **bağlam paneli
yuvalarıdır**, rota sayfası değil ama app-katmanı tüketicileri var.
Bu yüzden gavadolar'ın *"ekran değil, kendi klasörünü açma"* tavsiyesi
uygulanmadı: yanlış öncüle dayanıyordu ve altısı da aynı sözleşmeye girdi.

Ders yine aynı: **meclis cevabı, verilen ölçüm kadar doğrudur.**

### Ölçüm — "davranış değişmedi" iddiasının kanıtı

`tsc` 0 · `lint` 0 hata · **65 dosya / 402 test** — taşımadan ÖNCEKİ
sayının birebir aynısı. Üretim derlemesi 7 sayfa; dört rota 200,
bilinmeyen 404. Tarayıcıda `/mission-control` canlı ODIN sayaçlarını,
`/amazon` 16 yüzdeyi `Pct` ile ve `<table role="grid">` + `<caption>`
"SKU sağlık tablosu" (iç içe tablo: 0) çiziyor. Konsol hatasız.

---

## UI-ADR-144 — Bölme ölçütü: dört koşul; yalnız `VerdictForm` geçti (S13)

**Durum:** ✅ Dondurulmuş — ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-134 · UI-ADR-143 · ODIN ADR-0131 · ADR-0085 · gavadolar 2/2

### Ölçüt — bu kararın asıl çıktısı

UI-ADR-134 *"dikişe göre böl, satır sayısına göre DEĞİL"* demişti ama
"dikiş" tanımsızdı. gavadolar'ın iki üyesi bağımsız olarak neredeyse aynı
testi verdi (terra dördünü de şart koştu, luna üçte iki dedi); sıkı olan
alındı. **Bir parça ancak DÖRDÜ birden sağlanıyorsa ayrılır:**

1. Tek cümlelik BAĞIMSIZ sorumluluğu vardır.
2. Kendi giriş/çıkış sözleşmesi ve DOĞRUDAN testi yazılabilir.
3. Kendi state'i, doğrulaması, yan etkisi ya da erişilebilirlik davranışı vardır.
4. Ayrılınca ebeveyn yalnızca ORKESTRASYON yapar; prop aktarma karmaşıklığı ARTMAZ.

Biri eksikse bölme **zarardır** — yeni dosya, yeni import ve bozulan
hikâye maliyeti, taşınan satırın kazancını aşar.

### Uygulama — altı dosya ölçüldü, BİRİ bölündü

| Dosya | Satır | Karar |
|---|---|---|
| `features/amazon/director/screen.tsx` | 490 | **Bölünmedi** — ekranın DÜZENİ o dosyanın işi |
| `components/ui/table.tsx` | 385 | **Bölünmedi** — sanallaştırma + klavye + sıralama TEK davranış kümesi; ayırmak prop/olay zinciri üretir |
| `features/amazon/sku/screen.tsx` | 380 | **Bölünmedi** — `Group` ekran-içi düzen, `periodLabel` küçük saf yardımcı |
| `features/briefing/screen.tsx` | 374 | **Bölünmedi** — `HeroView` briefing'in düzen parçası |
| `components/executive/ai-recommendation-card.tsx` | 297 | **Bölünmedi** — eksik olan bölme değil TESTTİ (aşağıya bak) |
| `components/executive/decision-card.tsx` | 419 → **307** | **`VerdictForm` ayrıldı** |

**490 satırlık bir ekran neden bölünmüyor:** ekranın dizilimi o dosyanın
sorumluluğudur. Bloklara ayırmak, tek bir yerde okunan bir akışı beş
dosyaya dağıtıp aralarına prop köprüleri kurar — dosya küçülür, SİSTEM
büyür.

### `VerdictForm` dördünü de geçiyor

"Kararı GÖSTERMEK" ile "karar VERMEK" ayrı sözleşmelerdir. Form kendi
durumunu tutar, ADR-0131'in iki kuralını kendi doğrular, ve ayrıldıktan
sonra `decision-card` yalnızca orkestrasyon yapıyor.

Bölmenin asıl kazancı satır değil: kurallar artık **doğrudan test
edilebiliyor.** Öncesinde 419 satırlık bir kartın içinde yaşıyorlardı ve
yalnız elle tıklayarak doğrulanabiliyorlardı. Yeni `verdict-form.stories.tsx`
dördünü kilitliyor — gerekçe eşiği (8 karakter, ODIN'in kendi sabiti) ·
gerekçe isteğe bağlıyken boş gerekçenin `""` değil `undefined` gitmesi ·
**geçmiş tarihli ertelemenin de reddedilmesi** ("dün yeniden bakılsın"
demek ertelemeyi hiç yapmamakla aynıdır) · vazgeçmenin hiçbir kayıt
bırakmaması.

### `ai-recommendation-card`: eksik olan bölme değil TESTTİ

gavadolar 2/2 *"önce iki saf fonksiyonun testi var mı ölç; yoksa bu bölme
değil test ekleme işidir"* dedi. Ölçüldü: `missingExplainabilityFields` ve
`canRenderRecommendation` **üç dosyadan çağrılıyor** (`ai-brief`,
`campaign-intelligence`, `decision-card`) ve **hiçbir testi yoktu.**

Oysa korudukları kural reponun en sertlerinden: ODIN ADR-0085
Explainability Envelope — bir AI önerisi zorunlu ON alanından biri eksikse
arayüzde GÖSTERİLMEZ. Kapı sessizce gevşerse ekran, gerekçesi olmayan bir
öneriyi gerekçeliymiş gibi sunar.

Beş iddia yazıldı; ikisi sınır durum ve ikisi de kasıtlı asimetriyi
koruyor:
- **On alanın HER BİRİ tek başına denendi** — biri gevşerse hangisinin
  kaybolduğu ADIYLA görünür.
- **Boş azınlık görüşü GEÇERLİDİR, eksik alan değil**: `[]` "kurul
  hemfikirdi" demektir, alanın hiç olmaması "kurul toplandı mı belli
  değil" demektir.
- **SIFIR geçerli bir skordur.** `!rec.confidence` yazılsaydı 0 güven
  "eksik alan" sayılır ve ODIN'in ölçtüğü EN KÖTÜ durum ekrandan tamamen
  kaybolurdu.

### Ölçüm

`tsc` 0 · `lint` 0 hata · **66 dosya / 411 test**
(unit 15/220 · storybook 51/191). `decision-card` 419 → 307 satır.

---

## UI-ADR-145 — §2.3'ün kalanı: üç iddia ÖLÇÜLDÜ, ikisi çürüdü (S13)

**Durum:** ✅ Dondurulmuş — ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-136 · UI-ADR-137 · UI-ADR-144 · gavadolar 2/2

Devir belgesi §2.3'te dört tekrar kalemi listeliyordu. Dördü de kaynaktan
ölçüldü; **ikisi çürüdü, biri düzeltildi, biri sahibe kaldı.**

### 1 · "`DataGuard > Card > … > TrustSignal` 9 dosyada kelimesi kelimesine" → ÇÜRÜDÜ

Varyasyon matrisi çıkarıldı (gavadolar'ın istediği ölçüm):

| | |
|---|---|
| `DataGuard` kullanan | 15 dosya |
| **View-çıkarma** kalıbı (`{(x, meta) => <XView …/>}`) | 6 |
| **satır içi** kompozisyon | 9 |
| `CardHeader` propları | üç ayrı şekil: yok · `title` · `title`+`description` |
| `CardFooter`/`TrustSignal` | 11'de var, 4'ünde yok |

Ortak bir `GuardedCard` yazmak `title?` · `description?` · `actions?` ·
`footer?` · `trust?` proplarını gerektirirdi — yani `Card`ın kendisini bir
kapıyla sarmalayıp aynı esnekliği yeniden üretmek. Bu **merkezileştirme
değil prop taşımacılığıdır** ve UI-ADR-144'ün dördüncü koşulunu
(ebeveyn yalnızca orkestrasyon yapar, prop karmaşıklığı ARTMAZ) doğrudan
ihlal eder. **Yazılmadı.**

gavadolar 2/2 zaten bunu söylemişti: *"kelimesi kelimesine aynı JSX
kanıttır, ama aynı iş kavramı kanıtı değildir."*

### 2 · "`text-xs text-content-tertiary` 48 kez, `Caption` kullanılmıyor" → KISMEN

Sayıldı: 48 geçişin yalnız **9'u** birebir `<span className="text-xs
text-content-tertiary">` — yani gerçekten `Caption`. Kalan 37'si farklı
etikette (`<p>`, `<dt>`), ek sınıflarla ya da farklı bir bağlamda.

Toplu değiştirme **yapılmadı** (gavadolar 2/2: *"aynı Tailwind dizesi aynı
mimari karar değildir"*). Birebir olan 9 site `Caption`a çevrildi —
yedi dosya, 22 satır.

### 3 · "Export edilmemiş sihirli-dize birlikleri, çağıran elle yeniden yazıyor" → BİR TANE GERÇEK

İddia yedi dosyayı sayıyordu. Ölçüldü: bir birliği elle yeniden yazan
**tek bir çağıran** var — `director-card.tsx:42`, `NumFormat`ı
(`"percent" | "currency" | "plain" | "compact"`) kopyalamış. Düzeltildi;
artık `typography.tsx`ten import ediliyor.

Diğerleri (`avatar` SIZE/STATUS · `tooltip` SIDE · `modal` MODAL_SIZE ·
`stat` SIZE · `badge` SIZE) hiçbir çağıran tarafından değişkende
tutulmuyor; export etmek **kullanılmayan API yüzeyi** üretirdi.
`BadgeVariant` zaten export ve gerçekten kullanılıyor (`campaign-
intelligence` bir `Record` kuruyor) — kanıtı olan tek durum buydu.
(`ChartProps` UI-ADR-142'de export edilmişti; onun üç gerçek tüketicisi
vardı.)

### 4 · `director-card`in yerel `Metric`i → **SAHİP KARARI** bekliyor

Ölçüldü: `Metric` **tek** dosyada tanımlı; `runtime-director-card` aynı
şekli iki kez satır içi yazıyor. Yani tekrar gerçek ama küçük (2 site).

Asıl mesele mühendislik değil: `Metric` etiketi **truncate + normal harf**,
`Stat` ise **BÜYÜK HARF + geniş aralık** çiziyor. Birleştirmek ya
`director-card`in görünümünü sessizce değiştirir ya da tek çağıran için
bir görünüm prop'u ekler. Hangi etiket muamelesinin kanonik olduğu bir
**tasarım dili kararıdır** ve sahibinindir; kendiliğinden verilmedi.

UI-ADR-137'nin kuralı burada da geçerli: **merkezileşmesi gereken şey bir
KARARDIR** — ve o karar henüz verilmemiş.

### Ölçüm

`tsc` 0 · `lint` 0 hata · **66 dosya / 411 test** (değişmedi — bu tur
davranış değiştirmedi, yalnız tekrar sildi).

---

## UI-ADR-146 — Yazılımcılar denetimi: iki kapı eklendi, üç bulgu ölçülüp elendi (S13)

**Durum:** ✅ Dondurulmuş — ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-148…145 · yazılımcılar meclisi

S13 kapanmadan önce yazılımcılara nihai denetim yaptırıldı. Beş bulgu
geldi; **hepsi kaynaktan doğrulandı** (meclis-önce-doğrula kuralı) ve
sonuç ikiye ayrıldı.

### ✅ 1 · SAHTE VERİ KAÇAĞI — gerçek açık, kapı kuruldu

En güçlü bulgu. `Num` · `Pct` · `Meter` · `Stat` hepsi `null`ı NoData'ya
çevirir; bu, **"ölçülmedi" ile "sıfır"ı ayıran tek mekanizmadır.** Ama
çağıran değeri bileşene ULAŞMADAN ezerse mekanizma hiç devreye girmez:

```tsx
<Num value={metrics?.confidence ?? 0} />   // ← %0 UYDURUR
```

Bu kod tip-güvenlidir, render edilir, axe'tan geçer ve **mevcut kapıların
hiçbiri onu görmez.** Sahte veri yasağının en sessiz ihlali budur.

Ölçüldü: repoda şu an bu kalıptan **yok** — ama kapı da yoktu. ESLint
`no-restricted-syntax` ile kapatıldı; kapsam **kasıtlı olarak dar**
(yalnız `value=` prop'unun içi), çünkü sıralama epoch'u
(`new Date(x ?? 0)`) ve uzunluk kontrolü (`x?.length ?? 0`) meşrudur ve
repoda üç yerde geçer. Meclisin önerdiği geniş desen onları da vururdu.

**Denendi:** iki ihlal (`?? 0`, `|| 0`) yakalandı, üç meşru kullanım
vurulmadı.

### ✅ 2 · MODAL ODAK TUZAĞI — yazılmış ama TEST EDİLMEMİŞ

`useDialogBehavior` odağı diyaloga alıyor, Tab'ı içeride döndürüyor ve
kapanınca açana geri veriyor. Üçü de vardı; **hiçbirinin testi yoktu.**

Meclisin isabetli tespiti: **axe bunu göremez** — axe o andaki DOM'un
semantiğine bakar, klavyenin nereye gittiğine değil. Odak tuzağı
çalışmayan bir modal klavye kullanıcısını arkadaki sayfaya kaçırır;
kullanıcı hâlâ diyalogda sanır ama tıkladığı şey altındaki ekrandadır.
Görerek fark edilmez. Üç iddia yazıldı.

### ❌ 3 · React Query anahtarı eksik parametre → UYGULANMIYOR

Meclis `queryKey: ["recommendation"]` gibi parametresiz bir anahtarın
önceki varlığın verisini göstereceğini söyledi. Ölçüldü: bu repodaki
**yedi sorgunun hiçbiri parametre almıyor** (`["odin","amazon","kpis"]`
gibi sabit uç noktalar; tek parametreli olan `["fixture", key]` zaten
doğru kurulmuş). Bulgu geçerli bir kalıp uyarısıdır ama burada karşılığı
yok.

### ❌ 4 · Geniş Zustand seçimi → UYGULANMIYOR

Ölçüldü: `useNavigationStore` her çağrıda TEK alan seçiyor
(`(s) => s.expandedId` gibi). Meclisin uyardığı `useStore()` biçimi
repoda hiç yok.

### ⚠️ 5 · EKRAN SEVİYESİ DURUM MATRİSİ — açık kaldı, gerekçesiyle

Meclisin en değerli test-sınıfı bulgusu: bileşen testleri parçaları
kanıtlıyor ama `veri durumu → ekran` zincirini kimse kanıtlamıyor.
Doğrulandı: dört ekranın `loading` / `empty` / `error` story'si **var ama
hiçbiri bir şey İDDİA ETMİYOR**, yalnız render ediyorlar.

Yazıldı ve **geri alındı.** Sebep dürüstçe kayda geçiyor: `demo` prop'u
`useOdinFixture`in asenkron yüklemesine bağlı; `play` çalıştığında zarf
henüz `null` olabiliyor ve tahta "Karar verisi yok" ile "İzlenen karar
yok" arasında zamanlamaya göre değişiyor. Bu haliyle yazılan test
**kararsız** olurdu — ve kararsız bir test, testsizlikten kötüdür.

Doğru çözümü ayrı bir iştir: ekran seviyesinde deterministik zarf
enjeksiyonu (fixture'ı `play` öncesi çözülmüş hâle getirmek). `19-s13-devir.md`
§2.8'e açık madde olarak yazıldı.

### Ölçüm

`tsc` 0 · `lint` 0 hata · **66 dosya / 412 test** (+1 test).

---

## UI-ADR-147 — `Metric` `Stat`a bağlandı; `truncate` bir yerleşim güvencesidir (SAHİP KARARI)

**Durum:** ✅ Dondurulmuş — **sahip kararı**, ekranda ölçüldü
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-136 · UI-ADR-145 · CLAUDE.md §5

### Soru ve karar

UI-ADR-145 bunu açık bırakmıştı: `director-card`in yerel `Metric`i
`Stat`ın satır satır kopyasıydı ama etiket muamelesi farklıydı —
`Metric` **truncate + normal harf**, `Stat` **BÜYÜK HARF + geniş aralık**.
Hangisinin kanonik olduğu bir tasarım dili kararıydı.

**Sahip: `Stat` ile birleşsin.** `Stat`ın muamelesi kanoniktir.

### `truncate` neden prop oldu, neden varsayılan KAPALI

Birleşmede kaybedilmemesi gereken tek şey `Metric`in `min-w-0` +
`truncate` çiftiydi. **Bu bir görünüm tercihi değil, yerleşim
güvencesidir:** `min-w-0` olmadan bir grid hücresi içeriğinin altına
inemez; uzun bir etiket sütunu şişirir ve komşusunun üstüne taşar (aynı
hata S4'te görsel incelemede yakalanmıştı). İkisi birlikte çalışır —
`truncate` tek başına yetmez, çünkü kırpma hiç devreye girmez.

Varsayılan **kapalı**: `truncate` `white-space: nowrap` demektir ve iki
satıra sarabilen bir etiketi tek satıra kırpar. Açık gelseydi mevcut on
küsur `Stat` çağıranının hepsinin görünümü sessizce değişirdi. Açan,
hücrenin dar olduğunu BİLDİĞİ için açar.

### Uygulama

- `director-card`in yerel `Metric`i artık bir bileşen değil, `Num`un altı
  kez tekrarlanan biçimlendirme argümanlarını (USD · yüzde bir ondalık)
  tek yerde tutan ince bir sarmalayıcı; gövdesi `Stat`.
- `runtime-director-card`in elle yazılmış İKİ `<dt>/<dd>` çifti de `Stat`a
  bağlandı — aynı şekli tekrarlıyorlardı.
- Repoda `truncate text-xs text-content-tertiary` elle yazan **sıfır**
  yer kaldı.

### Kapı

`stat.stories.tsx` → `truncate` varsayılan kapalı · açıkken `min-w-0` ve
`truncate` İKİSİ BİRDEN · kırpılan etiketin metni DOM'da tam kalır
(ekran okuyucu tamamını okur, yalnız göz kırpılmışını görür).

### Ölçüm — görsel değişim ekranda doğrulandı

`tsc` 0 · `lint` 0 hata · **66 dosya / 413 test**. Üretim derlemesiyle
`/mission-control` tarayıcıda okundu: sekiz metrik hücresinin sekizinde de
`text-transform: uppercase` uygulanmış, `truncate` ve `min-w-0` yerinde,
"veri yok" tireleri korunmuş, konsol hatasız.

---

> ⚠️ **Numara çakışması — altıncı ve yedinci.** Bu iki blok S13 dalında
> **UI-ADR-140 ve 141** olarak yazılmıştı. Dal açıkken `main` S15 ve S16'yı
> aldı ve aynı iki numarayı DONDURDU (140 = ölçüm penceresi, 141 = fırsat
> görünümü). Merge edilmiş ve yayında olan kazanır; lokal olan taşınır —
> aynı kural 129 → 135 için de uygulanmıştı. Kod yorumlarındaki 14
> dosyalık referans da güncellendi.

## UI-ADR-148 — Tüketicisi olmayan dokuz bileşen tasarım sistemi envanteridir (SAHİP KARARI)

**Durum:** ✅ Dondurulmuş — **sahip kararı**, 31 Temmuz 2026
**İlgili:** UI-ADR-139 · CLAUDE.md §5 · `10-component-library.md` §10

### Soru

Dokuz modülün hiçbir ekran tüketicisi yoktu (hikâyeler hariç):
`ui/chart` (357 satır) · `ui/modal` (195, reponun tek focus-trap
uygulaması) · `ui/tabs` · `ui/tooltip` · `ui/filter` · `ui/icon` ·
`ui/avatar` · `ui/sparkline` · `executive/telemetry-bar`.

**Tasarım sistemi envanteri mi, ölü kod mu?** Bu bir mimari değil bir
ÜRÜN sorusudur — arayüzün hangi bileşenlere sahip olmayı taahhüt ettiği
sorusu — ve cevabı sahibindir.

### Karar

**Envanter olarak KALIRLAR. Silinmiyorlar.**

Karar `10-component-library.md` §10 ile tutarlıdır: dokuzunun dokuzu da
o envanterde adı geçen kalemlerdir (`Tabs` · `Tooltip` · `Modal` ·
`Avatar` · `Icon` · `Chart` · `Sparkline` · `Filter` · `TelemetryBar`).
Kararın temeli ölçüldü: **dokuzunun dokuzunun da hikâyesi var**, yani
Storybook'ta render ediliyor, `addon-a11y` ile taranıyor ve test
paketinde koşuyor. Görünmeyen kod değiller.

### Kararın bedeli — ve onu ödeten kapı

"Envanter" bir ETİKETTİR ve etiket tek başına ölü kodu meşrulaştırır.
Bugün doğru olan bir karar, altı ay sonra çağıranı olmayan her dosyanın
arkasına saklandığı bir gerekçeye dönüşebilir.

`src/components/inventory.test.ts` bunu engeller. Kural **kasıtlı olarak
dar**:

> **Bir bileşenin ekran tüketicisi yoksa, hikâyesi OLACAK.**
> İkisi birden yoksa test düşer.

Çağıranı OLAN bileşen için hikâye zorunlu değildir (§2.7'de hâlâ yedi
eksik var; o ayrı bir iş). Burada kilitlenen tek şey envanter kararının
bedelidir: envanter, GÖRÜLEBİLİR bileşenler içindir.

İkinci kol bir satır içi anlık görüntüdür: liste dokuz kalemden
BÜYÜRSE test düşer. Sahibin kararı bu dokuz kalem içindi, çağıranı
olmayan her yeni dosya için açık uçlu bir izin değil.

**Denendi ve ateşledi:** `ui/olu-kod-denemesi.tsx` enjekte edildi; iki
kol da düştü, mesaj *"hikâye yaz ya da dosyayı sil"* dedi. İhlal geri
alındı, 10/10 yeşil.

`stories.fixtures.ts` taramadan hariç: hikâye verisi bir bileşen
değildir, tüketicisinin yalnız hikâyeler olması onun DOĞRU hâlidir.

### Ölçüm

`tsc` 0 · `lint` 0 hata · **60 dosya / 354 test** (+1 dosya / +10 test).

---

## UI-ADR-149 — Erişilebilirlik sözleşmesi yorumdan çıkıp KAPIYA bağlandı (S13)

**Durum:** ✅ Dondurulmuş — beşi de testle kilitlendi
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-132 · UI-ADR-148 · gavadolar 2/2

Beş açık ölçülmüştü. Ortak yanları: **hiçbiri fareyle fark edilmez** ve
üçü zaten bir yorumla "korunuyordu".

### 1 · `table.tsx` — ızgara ilişkisi KOPUKTU

`role="grid"` KAYDIRMA KABINDAYDI ve içinde gerçek bir `<table>` (örtük
`role=table`) duruyordu. Satırlardaki `aria-rowindex` / `aria-selected`
ızgaraya değil, **ızgaranın içindeki ayrı bir tabloya** aitti: ekran
okuyucu "ızgara" diyor ama satır numarasını bulamıyordu. Gerçek tablonun
hiçbir adı da yoktu.

Izgara `<table>`'a taşındı (`role="grid"` + `aria-rowcount` + `tabIndex`);
kaydırma kabı yalnızca kaydırıyor. Ad `<caption class="sr-only">`tan
geliyor — `aria-label` ile ikisini birden yazmak adı çiftlerdi.

### 2 · `button.tsx` — "ZORUNLU" diyen yorum hiçbir şeyi zorlamıyordu

`iconOnly` artık ayrık birlik tipiyle `aria-label` (ya da
`aria-labelledby`) İSTİYOR. Adsız bir ikon butonu ekran okuyucuda yalnız
"buton" diye okunur ve ne yaptığı asla anlaşılmaz.

**Denendi ve ateşledi:** `<Button iconOnly icon={…} />` enjekte edildi,
`tsc` reddetti. Yorumla korunan bir kural, korunmayan bir kuraldır.

### 3 · `modal.tsx` — ad ÇİFTLENMİŞ, açıklama BAĞLANMAMIŞ

`aria-label={title}` görünür `<h2>`yi tekrarlıyordu: iki metin ayrı ayrı
yaşıyordu, biri değişse diğeri kalırdı. `aria-labelledby` ikisini tek
kaynağa bağladı. `description` ise hiçbir şeye bağlı değildi — yani
**yalnız gören kullanıcı için vardı**; `aria-describedby` ile bağlandı,
açıklama yoksa öznitelik hiç yazılmıyor (var olmayan bir id'ye işaret
etmek, hiç işaret etmemekten kötüdür).

### 4 · `filter.tsx` — Escape odak listeye girince ölü tuş

`onKeyDown` yalnız tetikleyicideydi. Odak Checkbox'lara geçtiği an klavye
kullanıcısı açtığı paneli KAPATAMIYORDU. Escape köke taşındı ve kapanınca
**odak tetikleyiciye geri veriliyor** — aksi halde odak silinen düğümde
kalır, sonraki Tab belgenin başına atlar. (Bunun için `Button` React 19
`ref` prop'unu tipinde beyan etmek zorunda kaldı.)

### 5 · `search.tsx` — 120 ms'lik blur zamanlayıcısı bir YARIŞTI

Üç kusur birdeydi: liste `role="listbox"` değildi, ok tuşu yoktu, ve
kapanma **saate** bağlıydı — odağın nereye gittiğine değil. Yavaş bir
makinede tıklama zamanlayıcıdan sonra gelir ve seçim kaybolur.

ARIA combobox kalıbına geçildi: `role="combobox"` + `aria-expanded` +
`aria-controls` + `aria-activedescendant`, öğeler `role="option"`,
ArrowUp/Down/Home/End sarmalı, ve **iki adımlı Escape** (önce liste,
sonra metin — tek adımda ikisi, sadece listeyi kapatmak isteyenin
yazdığını da silerdi). Zamanlayıcı kaldırıldı; kapanma kökün
`onBlur`unda `relatedTarget` ile ÖLÇÜLÜYOR.

Odak kutuda kalır, imleç `aria-activedescendant` ile taşınır: odağı
listeye taşımak yazmaya devam etmeyi imkânsız kılardı.

### Tuzak #1'in KÖK NEDENİ bulundu — testler artık tek koşuda

Devir belgesi *"tam test paketinden önce dev sunucusunu kapat"* diyordu.
Yanlış teşhis: düşüşün olduğu koşuda dev sunucusu BAŞKA bir worktree'ye
aitti ve sunucu açıkken geçen koşular da vardı.

**Gerçek sebep:** 45 story dosyasının soğuk Vite dönüşümü varsayılan
30 sn'lik `browser.connectTimeout`u aşıyor; Vitest tarayıcı oturumunu ölü
sayıyor. `connectTimeout: 180_000` yazıldı ve storybook projesi **tek
komutta 45/45** geçti (iki kez üst üste, 2s22 ve 3s19).

İkinci koşul ölçüldü: `unit` ile `storybook` AYNI ANDA koşarsa node
işçileri CPU'yu tutuyor ve bağlantı yine düşüyor (birleşik koşu 62 sn'de
patladı). İki proje **ayrı** çalıştırılır. Parçalama (`--shard`) artık
gereksiz.

### Ölçüm

`tsc` 0 · `lint` 0 hata · **60 dosya / 360 test** (+6 test).

---

---

## UI-ADR-151 — Ekran seviyesi durum matrisi: üç durum artık bir şey İDDİA EDİYOR (S13)

**Durum:** ✅ Dondurulmuş — kapı enjekte ihlalle denendi
**Tarih:** 31 Temmuz 2026
**İlgili:** UI-ADR-131 · UI-ADR-146 · UI-ADR-150

### Bulgu — testler vardı, iddia yoktu

Üç ekranın (`briefing` · `mission-control` · `amazon/director`) her birinde
`Yukleniyor` · `Bos` · `Hata` story'leri ZATEN vardı. **Hiçbiri bir şey
iddia etmiyordu** — yalnız render ediyorlardı. Yazılımcılar meclisinin
işaret ettiği eksik test sınıfı buydu: bileşen testleri PARÇALARI
kanıtlıyor, `veri durumu → ekran` zincirini kimse kanıtlamıyordu.

Test SAYISI değişmedi (193 → 193). Değişen şey, o 9 testin artık bir şey
söylüyor olması.

### Kilitlenen ayrım

    "yükleniyor"  ≠  "ölçüldü, sonuç boş"  ≠  "ÖLÇÜLMEDİ"

Üçü de birbirine benzeyen bir ekran üretebilir ve üçü de farklı bir şey
söyler. Ortadaki bir CEVAPTIR; sonuncusu cevapsızlıktır. En keskin
iddia `mission-control`de:

> `demo="empty"` hâlinde Director sayacı **`"0"` değil `"—"`** gösterir,
> notu da "kaynak bağlı değil — ölçülmedi" olur.

"0 sağlıksız Director" bir ÖLÇÜMDÜR ve o an elimizde ölçüm yoktur.
Aradaki fark, sistemin sağlıklı mı yoksa hiç izlenmiyor mu olduğudur —
sıfırlarla dolu bir tablo "her şey yolunda" diye okunur. (Bu hata S8'de
gerçekten yaşandı ve hiçbir test yakalamamıştı; artık yakalar.)

Her ekranda ayrıca: yükleniyor/hata hâlinde **SAYI ÇİZİLMEZ**, boş hâl
**HATA DEĞİLDİR** (`role="alert"` çıkmaz). `amazon/director`de bu bir
görsel incelik değil: hata metni "bütçe kararı verilmemeli" diyor, yani
durum ayrımı bir PARA kararının önündeki son uyarıdır.

### Neden ilk denemede kararsızdı (UI-ADR-146'da geri alınmıştı)

İki ayrı hata, ikisi de testte — ekranda değil:

1. **Eşzamanlı sorgu.** `getByText` kullanılmıştı; `useOdinFixture`
   asenkron çözülüyor ve `play` çalıştığında zarf henüz `null` olabiliyor.
   Çözüm fixture'ı değiştirmek değil, `findBy*` ile BEKLEMEK.
2. **Yetersiz bekleme payı.** `findBy*`in varsayılan 1 sn'si tek koşuda
   yetiyor, 51 dosyalık tam pakette yetmiyordu. Bu ekranlarda `loading`
   bayrağı fixture'a bağlı olduğu için hata/boş durum ancak fixture
   çözüldükten SONRA çiziliyor. Pay 15 sn'ye çıkarıldı ve GEREKÇESİ
   yazıldı.

Ayrıca `getByRole("status", { name })` çalışmıyor: `status` "name from
content" rolü DEĞİLDİR, içindeki `sr-only` etiket ona ad vermez. Doğru
çapa rolün varlığı + etiketin metnidir.

**Kural olarak:** YOKLUK iddiası her zaman bir VARLIK iddiasından SONRA
gelir. Aksi halde ekran daha çizilmeden "yok" diye geçer ve test yeşil
yalan söyler.

### Kapı

`src/features/state-matrix.test.ts` — `demo?: DemoState` alan her ekranın
üç durum story'si OLACAK ve **üçü de bir `play` taşıyacak.** Kapı kendi
körleşmesini de kontrol ediyor: ekran listesi boşalırsa düşer.

**Denendi ve ateşledi:** bir `play` silindi, kapı *"durum story'lerinde 2
adet play var, en az 3 olmalı"* diyerek düştü. İhlal geri alındı.

### Kapanış denetimi — kapının KENDİSİ açık çıktı

Meclis araçları oturum ortasında düştüğü için denetim kendim yapıldı:
kapılarıma saldırdım ve üçü de kendi yeni işimde olan üç kusur çıktı.

1. **Bu kapı AÇIKTI.** İlk hâli dosyadaki `play:` SAYISINI sayıyordu. Bir
   durum story'sinin `play`ini silip ALAKASIZ bir story'ye sahte bir
   `play` eklemek sayıyı koruyordu ve **kapı geçiyordu** — denendi,
   geçti. Sayı saymak, doğru yerde olup olmadığını sormaz. Artık her
   `export const` bloğu ayrı inceleniyor: `demo` hangi bloktaysa `play`
   de O BLOKTA olmak zorunda. Aynı ihlal tekrar denendi, bu kez düştü.
2. **S17'nin `FLOOR`u 140'ta kalmıştı**, ölçüm 193'tü — kapı açık
   görünürken **53 test sessizce kaybolabilirdi.** 190'a yükseltildi.
3. **S17'nin self-check'i `FLOOR` sabitine bağlıydı** ve sınır
   yükseltilince mantık senaryoları çöktü, oysa mantıkta bir şey
   bozulmamıştı. Bağ koparıldı: self-check kendi sınırını AÇIKÇA veriyor
   (mantığı sınar, kalibrasyonu değil) ve ayrıca yürürlükteki `FLOOR`un
   gerçekten koruduğunu da sınıyor. Kalibrasyon değişince kırılan bir
   test, kalibrasyonu değiştirmemek için bahane olur.

### Ölçüm

`tsc` 0 · `lint` 0 hata · **67 dosya / 421 test**; S17'nin fail-closed
kapısı AÇIK (51 dosya / 193 test, **alt sınır 190**, atlanan 0, düşen 0).

⬜ **Bağımsız denetim ALINAMADI:** meclis MCP araçları bu oturumda düştü
(oturuma bağlıdırlar, yeniden başlatmak geri getirmiyor). Yeni oturumun
ilk işi `ask_yazilimcilar` ile son hâli denetletmektir.

---

## UI-ADR-152 — Bağımsız denetim: beş kapının dördü kırıldı, biri hiç koşmuyordu (S13 kapanış)

**Durum:** ✅ Dondurulmuş — her düzeltme enjekte ihlalle denendi
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-130 · 142 · 146 · 149 · 151

Meclis MCP araçları oturum ortasında düştüğü için (oturuma bağlıdırlar)
denetim bağımsız bir ajana yaptırıldı: **9 bulgu, 2 kritik.** Hepsi
kaynaktan doğrulandı; hiçbiri elenmedi. Sonuç sert: **S13'ün kapılarının
çoğu ya hiç koşmuyordu ya da kırılabiliyordu.**

### KRİTİK 1 — ESLint hiçbir otomatik komutta koşmuyordu

`package.json`'da `lint` script'i vardı ama **hiçbir şey onu çağırmıyordu:**
`test:ci` = unit + storybook · `build:release` = release + build + bundle
taraması · `.github/` yok · `core.hooksPath` boş. Next 16'da
`next/dist/lint` **artık mevcut değil** (ölçüldü) — `next build` de lint
koşturmuyor.

Yani UI-ADR-130'un katman sınırları ve UI-ADR-146'nın sahte-veri kaçağı
kuralı **DEKORATİFTİ**: yalnız bir insan elle `npm run lint` yazarsa
ateşliyorlardı. `test:ci`ye eklendi; `<Num value={x ?? 0} />` enjekte
edildi, kapı ateşledi.

**Ders:** kural yazmak, kuralın koşması demek değil. "Mimari derleyicide
yaşar" diyen bir repoda derleyicinin çağrıldığı yeri de göstermek gerekir.

### KRİTİK 2 — `Button` kapısı BAYRAĞA bağlıydı, bayrağı yazmamak yetiyordu

UI-ADR-149 `iconOnly` için `aria-label`ı derlemede zorunlu kılmıştı. Ama
`<Button icon={<X/>} />` — `children` yok, `iconOnly` yok — **geçiyordu**
ve adsız bir buton çiziyordu. Kapı, kapıyı tetikleyecek bayrağı yazmayı
hatırlamaya bağlıydı; bu yorumdan yalnız bir adım ötesidir.

Birleşim `children`a taşındı: metin varsa ad içerikten gelir, metin yoksa
`aria-label`/`aria-labelledby` İSTENİR. `iconOnly` artık yalnız yerleşim
bayrağı. Üç durum denendi: delik kapandı, iki meşru kullanım geçti.

### Sahte veri — `council-view`

*"Azınlık görüşü kaydedilmemiş — uzlaşma tam."* İlk yarısı dürüst, ikinci
yarısı **YOKLUKTAN çıkarılmış bir ölçüm**. Bileşenin kendi başlığı
Director pozisyonlarının ODIN şemasında SAKLANMADIĞINI (`not_exposed`)
yazıyor — boş liste bu kaynağın VARSAYILAN hâli, mutabakat kanıtı değil.
"Kimse itiraz kaydetmedi" ile "herkes aynı fikirde" ayrı şeylerdir;
ikincisi uydurulmuş bir sayı değil, **uydurulmuş bir SONUÇTUR.** Kesildi
ve story ile kilitlendi.

### İki YEŞİL YALAN — UI-ADR-151'in kendi testlerinde

1. **`amazon/director` `Bos` çapası iskelette çözülüyordu.**
   `findByRole("heading", {name:/Executive Glance/})` — o başlık YALNIZ
   iskelet/hata dallarında var (`<Section title=…>`); yükleme bitince
   yerini `NoData` alıyor ve `GlanceView`ün kendi başlığı bir `<span>`.
   Yani "yükleme bitti" çapası ilk poll'de İSKELETTE çözülüyor, ardından
   gelen yokluk iddiası iskelet üstünde koşuyordu — boş durum gerçekten
   bir `alert` üretse bile test geçerdi. Çapa `NoData`ya taşındı.
2. **`briefing` `heroSkoru` hiç pozitif doğrulanmamıştı.** Yalnız
   `toBeNull()` ile kullanılıyordu: etiket metni ya da `Stat`ın dt/dd
   yapısı değişse helper sonsuza kadar `null` döner ve iki iddia KALICI
   YEŞİL olurdu. Dolu story'ye pozitif kontrol eklendi.

### `state-matrix` kapısının iki kaçış yolu daha

Bir blok birden fazla `demo` taşıyabiliyordu (tek `play` üç durumu
"karşılar" görünürdü) ve `play: async () => {}` biçimsel olarak
geçiyordu. İkisi de kapatıldı, ikisi de enjekte ihlalle denendi.

⚠️ **Ve kapının kendisinde GÖRÜNMEZ BİR BAYT vardı.** Boş-`play` kontrolü
`/expect\s*\(/` olarak yazılmıştı ve `` dosyaya **backspace baytı
(0x08)** olarak girmişti; regex hiçbir zaman eşleşmedi ve kapı üç dosyayı
da HAKSIZ yere kırmızı gösterdi. Düz `includes("expect(")` ile
değiştirildi — aranan şey bir alt dize, regex hiçbir şey kazandırmıyordu.

Bu, oturumda **testin kendisi yanlış çıktığı yedinci** vakadır.

### `FLOOR` gerçekten korumuyordu

S17'nin alt sınırı 140'ta kalmıştı, ölçüm 193'tü: kapı AÇIK görünürken
**53 test sessizce kaybolabilirdi.** 190'a çıkarıldı. Ayrıca S17'nin
self-check'i `FLOOR` sabitine bağlıydı ve sınır yükseltilince mantık
senaryoları çöktü — oysa mantıkta bir şey bozulmamıştı. Bağ koparıldı:
self-check kendi sınırını açıkça verir (mantığı sınar, kalibrasyonu
değil) ve ayrıca yürürlükteki `FLOOR`un koruduğunu da sınar. *Kalibrasyon
değişince kırılan bir test, kalibrasyonu değiştirmemek için bahane olur.*

### Kabul edilen ama YAPILMAYAN iki bulgu

- **`features/*/screen.tsx` muafiyeti.** Kapı `demo?: DemoState` beyanına
  kilitli; `amazon/sku`, `goals`, `intelligence-feed` bu prop'u almadığı
  için matristen muaf. Denetçi haklı, ama muafiyeti daraltmak o üç ekrana
  demo durumu EKLEMEYİ gerektirir — yeni iş, kapanış düzeltmesi değil.
  Devir belgesine yazıldı.
- **`inventory` kapısının dosya seviyesi `play` kontrolü.** Çok bileşenli
  bir story dosyasındaki alakasız bir `play` yeni bir yetimi kapatabilir.
  Bugün fiilen ihlal YOK (ölçüldü); blok bazlı kontrole geçirmek aynı
  desenle mümkün, devir belgesine yazıldı.

### Ölçüm

`tsc` 0 · `lint` 0 hata · **67 dosya / 421 test** · `npm run test:ci`
artık **lint + unit + storybook** koşuyor; Storybook kapısı AÇIK
(51 dosya / 193 test, alt sınır 190).

---

## UI-ADR-153 — Muafiyetler kaldırıldı: kapılar artık boşluk bırakmıyor (S13 kapanış)

**Durum:** ✅ Dondurulmuş — üçü de enjekte ihlalle denendi
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-148 · 151 · 152

UI-ADR-152'nin bağımsız denetimi üç bulguyu "kabul edildi ama yapılmadı"
diye devretmişti. Gerekçe *"yeni iş, kapanış düzeltmesi değil"*ti ve
**zayıftı**: üçü de doğrudan yapılabilir işlerdi. Üçü de kapatıldı.

### 1 · Ekran kapısının MUAFİYETİ kaldırıldı

Kapı `demo?: DemoState` beyanına kilitliydi; o prop'u ALMAYAN üç ekran
(`amazon/sku`, `goals`, `intelligence-feed`) matristen sessizce muaftı.
Muafiyet gerçek bir boşluktu:

- `amazon/sku`ın **dört durum story'si vardı, hiçbiri bir şey iddia
  etmiyordu**;
- `goals` ile `intelligence-feed`in **hiç hikâyesi yoktu** — `/goals`
  arayüzdeki İLK canlı ODIN verisini gösteren ekran olduğu hâlde.

Ekranın durumları `demo` prop'undan gelmek ZORUNDA değil:
`AmazonSkuPanel` hiç prop almaz, durumları store ve sorgudan gelir. Bu
yüzden kural durum ADLARINA değil şuna bağlandı: **her ekranın hikâyesi
olacak ve HER story bir şey iddia edecek.** `demo` alan ekranlar için üç
durumluk matris AYRICA isteniyor.

Kapı açılınca **altı ihlal** döküldü: iki eksik hikâye ve dört iddiasız
story. Hepsi yazıldı.

**Ve kapı bir GERÇEK HATA buldu:** `amazon/sku`ın `OlcumsuzSku` story'si
`SKU-3050` seçiyordu — o kimlik fixture'da **hiç yok**. Story sessizce
"kayıt bulunamadı" dalını çiziyor, yani adının vaat ettiği "ölçümsüz SKU"
durumunu hiç göstermiyordu. `SKU-3310`e (fixture'ın en çok null'lu kaydı)
çevrildi. *İddiasız bir story, yanlış şeyi çizdiğini bile söyleyemez.*

### 2 · `inventory` kapısı BLOK bazlı oldu

`play` DOSYA seviyesinde aranıyordu. Çok bileşenli bir hikâye dosyasında
(`display.stories.tsx` beş bileşen kapsıyor) BAŞKA bir bileşenin `play`i
yeni bir yetimi kapatıyordu — yeni bileşen hakkında sıfır iddiayla
"davranış kanıtlandı" testi geçiyordu. Artık `play`, o bileşeni RENDER
EDEN `export const` bloğunun içinde aranıyor.

**Denendi:** iddiası `Badge` bloğunda olan bir yetim enjekte edildi; eski
kapı geçirirdi, yeni kapı düştü.

### 3 · `unit` projesi de kapı altına alındı

Fail-closed kapı yalnız `storybook`u koruyordu. `state-matrix.test.ts`i
`.spec.ts` diye yeniden adlandırmak kapıyı SESSİZCE buharlaştırıyordu:
`include` onu görmez, geriye 15 dosya kaldığı için "no test files" hatası
da çıkmaz ve `test:ci` YEŞİL kalırdı.

`verify-storybook-tests.mjs` → `verify-tests.mjs`; proje adı ve alt sınır
argümandan geliyor. `test:unit` = `unit 230` · `test:storybook` =
`storybook 190`. **Denendi:** dosya yeniden adlandırıldı, kapı
*"geçen test 224 < alt sınır 230"* diyerek düştü.

### Bu turda testin kendisi DÖRT kez daha yanlış çıktı

`SKU-3050` yok · `getByText(/mock/i)` çoklu eşleşme · `listitem` yükleme
bitmeden arandı · `goals`ta üç iskelet açıkken ölçüm yapıldı. Dördü de
"yokluk iddiası VARLIKTAN sonra gelir" kuralının ihlaliydi.

### Ölçüm

`tsc` 0 · `lint` 0 hata · `npm run test:ci`:
**unit 16 dosya / 234 test** (alt sınır 230) ·
**storybook 53 dosya / 195 test** (alt sınır 190) · atlanan 0, düşen 0.

---

## UI-ADR-154 - Ikinci denetim: kapilar kosuyordu ama ustlerinden atlanabiliyordu (S13 kapanis)

**Durum:** DONDURULDU - her duzeltme enjekte ihlalle denendi
**Tarih:** 1 Agustos 2026
**Ilgili:** UI-ADR-146 - 148 - 151 - 152 - 153

Bagimsiz denetimin IKINCI turu: **12 bulgu, 2 kritik.** Birincisi aciydi -
UI-ADR-152'de "derleyiciye verdim" dedigim kapi, **derleyici kosulmadigi
icin** aslinda kosmuyordu.

### KRITIK 1 - `test:ci` `tsc` KOSMUYORDU

`Button`in erisilebilirlik kapisi bir TIP kapisidir. Ama `test:ci` =
`lint + unit + storybook`; ESLint tip hatasi raporlamaz, vitest/esbuild
tipleri **kontrol etmeden siler**. `tsc` yalniz `build` icindeydi.

Olculdu: adsiz `<Button icon={...} />` icin `tsc` hata verdi, `eslint`
**cikis 0**. Yani kapi vardi, `test:ci` yesilken ihlal commit edilirdi.
`typecheck` script'i eklendi ve `test:ci`nin BASINA kondu.

**Ders (152'nin dersinin devami):** "kapi yazdim" -> "kapi koruyor" ->
**"kapi KOSUYOR"**. Ucu ayri iddiadir ve ucu de ayri ayri dogrulanir.

### KRITIK 2 - tek satirlik `eslint-disable` HER SEYI susturuyordu

Bir dosyanin basina yazilan tek bir satir token kuralini, **sahte veri
kuralini (146)** ve **katman sinirlarini (130)** ayni anda kapatiyordu;
`npx eslint` sifir bulguyla cikis 0 veriyordu. Bu reponun butun mimari
kapilari ESLint'te yasiyor - tek satirla kapatilabilir birakmak, kapi
olmadiklarini soylemektir.

`noInlineConfig: true` + `reportUnusedDisableDirectives: "error"` +
`--max-warnings 0`. Dort gerekceli istisna (`avatar` img, `search`
exhaustive-deps, `table` unused-vars ve incompatible-library) silinmedi,
`eslint.config.mjs`e DOSYA BAZINDA tasindi: ayni muafiyet, ama merkezi ve
gorulerek. Ayrica `--max-warnings 0` gizli **9 uyariyi** ortaya cikardi.

### Kapilardan atlama yollari - hepsi kapatildi

| Kacis | Duzeltme |
|---|---|
| `<Button>{gizli && <span/>}</Button>` -> false olunca ADSIZ buton | calisma zamani dev uyarisi (tip `ReactNode`u daraltamaz) |
| story dosyasi `export default meta` bicimine cevrilir -> 0 blok -> dongu donmez -> yesil | blok sayisi 0 ise kirmizi |
| `play` govdesinde yalniz YORUM icinde `expect(` | yorumlar dusurulup araniyor |
| `expect(true).toBe(true)` | sabit-degerli iddialar dusurulup GERCEK iddia araniyor |
| Commit A'da 15 onemsiz test ekle, commit B'de kapi dosyasini sil -> toplam korunur -> yesil | kapi dosyalari **adlariyla** araniyor (`ZORUNLU`) |
| `value={x === null ? 0 : x}` - `??` yasaklaninca yazilacak bicim | ternary ve mantiksal-veya da yasaklandi |

Ucu de enjekte ihlalle denendi: `state-matrix.test.ts` yeniden
adlandirildi -> *"KAPI DOSYASI KOSMADI"*; satir ici disable yazildi ->
3 hata yakalandi; ternary + mantiksal-veya -> 2 hata.

### Iki zayif iddia guclendirildi

`goals`ta `expect(govde.length).toBeGreaterThan(0)` bir satir yukaridaki
`findByRole` gectiyse KOSULSUZ dogruydu - silindi. `intelligence-feed`de
`findAllByRole` ILK ogede cozuluyordu, yani `maxVisible` siniri sanildigi
kadar kilitli degildi - liste durgunlasana kadar beklenip yeniden
sayiliyor.

### SAHIP KARARI BEKLIYOR - erisilebilirlik taramasi baglayici degil

`.storybook/preview.tsx`te `a11y.test: "todo"` - axe ihlalleri
**gosteriliyor ama CI'i dusurmuyor.** `error`e cevrildi ve OLCULDU:

> **107 story dusuyor, 609 ihlal.**
> `color-contrast` **582** (%96), `definition-list` 12, `dlitem` 10,
> `landmark-unique` 2, `label` 2, `aria-valid-attr-value` 1

582'nin neredeyse tamami **TEK TOKEN**: `#64748b`
(`text-content-tertiary`). Bes zemine karsi olculen en kotu oran
**3.73:1**; WCAG AA kucuk metin icin 4.5:1 istiyor.

Yani bu "yuzlerce hata" degil, **bir tasarim dili karari**: tek token
acilirsa ihlallerin ~%96'si kapanir. Olculmus adaylar (en kotu zemine
gore): `#7c8899` -> 4.93, `#8593a5` -> 5.67, `#94a3b8` -> 6.92.

Token degistirmek arayuzun TAMAMININ gorunumunu etkiler; sessizce
yapilmaz. Karar verilip sifirlanana kadar `todo`da kaliyor ve **sayi
kodda yazili** - bir sonraki oturum tahmin etmeyecek.

Ayrica `inventory.test.ts`in basligindaki *"addon-a11y ile taranir"*
ifadesi CI'da dogru DEGILDI (taraniyor ama baglayici degil) - yanlis
guven vermemek icin duzeltildi.

### Olcum

`npm run test:ci` = **typecheck + lint + unit + storybook**:
`tsc` 0, `lint` 0 hata **0 uyari**,
**unit 16 dosya / 234 test** (alt sinir 230, kapi dosyalari adla araniyor),
**storybook 53 dosya / 195 test** (alt sinir 190), atlanan 0, dusen 0.

---

## UI-ADR-154 - Ikinci denetim: kapilar kosuyordu ama ustlerinden atlanabiliyordu (S13 kapanis)

**Durum:** DONDURULDU - her duzeltme enjekte ihlalle denendi
**Tarih:** 1 Agustos 2026
**Ilgili:** UI-ADR-146 - 148 - 151 - 152 - 153

Bagimsiz denetimin IKINCI turu: **12 bulgu, 2 kritik.** Birincisi aciydi -
UI-ADR-152'de "derleyiciye verdim" dedigim kapi, **derleyici kosulmadigi
icin** aslinda kosmuyordu.

### KRITIK 1 - `test:ci` `tsc` KOSMUYORDU

`Button`in erisilebilirlik kapisi bir TIP kapisidir. Ama `test:ci` =
`lint + unit + storybook`; ESLint tip hatasi raporlamaz, vitest/esbuild
tipleri **kontrol etmeden siler**. `tsc` yalniz `build` icindeydi.

Olculdu: adsiz `<Button icon={...} />` icin `tsc` hata verdi, `eslint`
**cikis 0**. Yani kapi vardi, `test:ci` yesilken ihlal commit edilirdi.
`typecheck` script'i eklendi ve `test:ci`nin BASINA kondu.

**Ders (152'nin dersinin devami):** "kapi yazdim" -> "kapi koruyor" ->
**"kapi KOSUYOR"**. Ucu ayri iddiadir ve ucu de ayri ayri dogrulanir.

### KRITIK 2 - tek satirlik `eslint-disable` HER SEYI susturuyordu

Bir dosyanin basina yazilan tek bir satir token kuralini, **sahte veri
kuralini (146)** ve **katman sinirlarini (130)** ayni anda kapatiyordu;
`npx eslint` sifir bulguyla cikis 0 veriyordu. Bu reponun butun mimari
kapilari ESLint'te yasiyor - tek satirla kapatilabilir birakmak, kapi
olmadiklarini soylemektir.

`noInlineConfig: true` + `reportUnusedDisableDirectives: "error"` +
`--max-warnings 0`. Dort gerekceli istisna (`avatar` img, `search`
exhaustive-deps, `table` unused-vars ve incompatible-library) silinmedi,
`eslint.config.mjs`e DOSYA BAZINDA tasindi: ayni muafiyet, ama merkezi ve
gorulerek. Ayrica `--max-warnings 0` gizli **9 uyariyi** ortaya cikardi.

### Kapilardan atlama yollari - hepsi kapatildi

| Kacis | Duzeltme |
|---|---|
| `<Button>{gizli && <span/>}</Button>` -> false olunca ADSIZ buton | calisma zamani dev uyarisi (tip `ReactNode`u daraltamaz) |
| story dosyasi `export default meta` bicimine cevrilir -> 0 blok -> dongu donmez -> yesil | blok sayisi 0 ise kirmizi |
| `play` govdesinde yalniz YORUM icinde `expect(` | yorumlar dusurulup araniyor |
| `expect(true).toBe(true)` | sabit-degerli iddialar dusurulup GERCEK iddia araniyor |
| Commit A'da 15 onemsiz test ekle, commit B'de kapi dosyasini sil -> toplam korunur -> yesil | kapi dosyalari **adlariyla** araniyor (`ZORUNLU`) |
| `value={x === null ? 0 : x}` - `??` yasaklaninca yazilacak bicim | ternary ve mantiksal-veya da yasaklandi |

Ucu de enjekte ihlalle denendi: `state-matrix.test.ts` yeniden
adlandirildi -> *"KAPI DOSYASI KOSMADI"*; satir ici disable yazildi ->
3 hata yakalandi; ternary + mantiksal-veya -> 2 hata.

### Iki zayif iddia guclendirildi

`goals`ta `expect(govde.length).toBeGreaterThan(0)` bir satir yukaridaki
`findByRole` gectiyse KOSULSUZ dogruydu - silindi. `intelligence-feed`de
`findAllByRole` ILK ogede cozuluyordu, yani `maxVisible` siniri sanildigi
kadar kilitli degildi - liste durgunlasana kadar beklenip yeniden
sayiliyor.

### SAHIP KARARI BEKLIYOR - erisilebilirlik taramasi baglayici degil

`.storybook/preview.tsx`te `a11y.test: "todo"` - axe ihlalleri
**gosteriliyor ama CI'i dusurmuyor.** `error`e cevrildi ve OLCULDU:

> **107 story dusuyor, 609 ihlal.**
> `color-contrast` **582** (%96), `definition-list` 12, `dlitem` 10,
> `landmark-unique` 2, `label` 2, `aria-valid-attr-value` 1

582'nin neredeyse tamami **TEK TOKEN**: `#64748b`
(`text-content-tertiary`). Bes zemine karsi olculen en kotu oran
**3.73:1**; WCAG AA kucuk metin icin 4.5:1 istiyor.

Yani bu "yuzlerce hata" degil, **bir tasarim dili karari**: tek token
acilirsa ihlallerin ~%96'si kapanir. Olculmus adaylar (en kotu zemine
gore): `#7c8899` -> 4.93, `#8593a5` -> 5.67, `#94a3b8` -> 6.92.

Token degistirmek arayuzun TAMAMININ gorunumunu etkiler; sessizce
yapilmaz. Karar verilip sifirlanana kadar `todo`da kaliyor ve **sayi
kodda yazili** - bir sonraki oturum tahmin etmeyecek.

Ayrica `inventory.test.ts`in basligindaki *"addon-a11y ile taranir"*
ifadesi CI'da dogru DEGILDI (taraniyor ama baglayici degil) - yanlis
guven vermemek icin duzeltildi.

### Olcum

`npm run test:ci` = **typecheck + lint + unit + storybook**:
`tsc` 0, `lint` 0 hata **0 uyari**,
**unit 16 dosya / 234 test** (alt sinir 230, kapi dosyalari adla araniyor),
**storybook 53 dosya / 195 test** (alt sinir 190), atlanan 0, dusen 0.

---

## UI-ADR-155 - Ucuncu denetim: kapilar degil KODUN KENDISI (S13 kapanis)

**Durum:** DONDURULDU
**Tarih:** 1 Agustos 2026
**Ilgili:** UI-ADR-093 - 120 - 152 - 154 - ODIN ADR-0085

Ilk iki tur KAPILARI denetledi. Ucuncu tur, meclisin `yazilimcilar` grubunun
bakacagi seye bakti: **kodun kendisi.** Iki ajan paralel calisti (veri
katmani / bilesen katmani, kapsam catismasi prompt'ta yasaklandi):
**6 kritik, 21 orta, 14 dusuk.**

Asagidakiler bu turda KAPATILANLAR. Kalanlar §"acik kalanlar"da.

### 1 - Satis degisimi ekranda 100 KAT yanlis cikiyordu

ODIN `amazon_director.py:541` yuzdeyi `* 100` ile uretiyor (0-100) ama
`amazon_api.py:134` onu **`scale="0-1"` diye BEYAN ediyor**. Arayuz beyana
guveniyor, `Intl` `style:"percent"` bir kez daha 100 ile carpiyor.

**Somut:** satis %12,5 dustuyse KPI kartinda **"-%1.250,0"** yaziyordu.
Ayni listedeki `acos` gercekten 0-1 orani ve dogru beyan edilmis - yani iki
yuzde ayni etiketle geliyor, biri dogru biri degil.

UI-ADR-093 *"olcegi tahmin etme, bildirilsin"* diyordu ama **yanlis
BILDIRILEN** olcege karsi bir sey soylemiyordu. `executiveKpiSchema`ya
refine eklendi: `scale="0-1"` beyaniyla gelen degerin mutlak degeri 1,5'i
asamaz. Celiskide sayi basmak yerine SOZLESME HATASI verilir - yanlis bir
yuzde, eksik bir yuzdeden tehlikelidir cunku makul gorunur.

Kok neden ODIN'de; kural 7 geregi dokunulmadi, `backend-istekleri.md`ye
madde yazildi. Kapi o duzelene kadar yanlis sayiyi ekranda tutmaz.

### 2 - Amazon Director olculmemis veriyi "risk yok" diye iddia ediyordu

`skus.envelope?.data ?? []` - zarf `null` oldugunda (kaynak bagli degil,
`/api/amazon` hata verdi, ilk yukleme suruyor) liste bos diziye dusuyor ve
bolumler sunlari yaziyordu:

> "Stok riski yok - Hicbir SKU riskli ya da kritik durumda degil."
> "BuyBox kaybi yok - Orani raporlanan SKU'larin hepsi %90 uzerinde."

Ucu de birer OLCUMDUR ve hicbiri olculmemistir. `mission-control`de
**UI-ADR-120 ile bulunup duzeltilen hatanin AYNISI**; bu ekranda
uygulanmamisti. `null` = olculmedi, `[]` = olculdu ve bos ayrimi getirildi;
bos durumlar yalniz gercekten olculduyse gosteriliyor. Story ile kilitlendi.

### 3 - `SystemReadiness` "hazir" diyordu ama bu bir DERLEME SABITI

`isChannelAvailable` yalniz registry'deki statik `available:` alanini okur;
hicbir calisma zamani durumuna bakmaz. ODIN tamamen kapaliyken de ekran
ayni uc satiri yesil **"hazir"** gosteriyordu. Bilesenin kendi basligi
*"ODIN'de o tikler olcume dayanir"* diyordu - dayanmiyordu.

Bu uydurulmus bir sayi degil, **uydurulmus bir CANLILIK**. Kanal listesi bir
YETENEK BEYANIDIR; etiket de artik onu soyluyor: **"tanimli" /
"tanimli degil"**. Canlilik gercekten olculmek istenirse kaynagi bir saglik
yayinidir - *etiketi degistirmek bedava, uydurmak pahalidir.*

### 4 - Aciklanabilirlik kapisi yalniz BIR dala uygulaniyordu

`decision-card.tsx`te `recOk = canRenderRecommendation(rec)` hesaplaniyor
ama yalnizca acilir bolumde kullaniliyordu. Govde kosulsuz olarak oneri
metnini, guven skorunu ve kanit sayisini basiyordu: kart ustte skoru
gosterip altta *"aciklanabilirlik sartini saglamiyor"* diyordu.

ADR-0085 kanitsiz bir guven skorunun gosterilmemesini ister; yarisi
bastirilmis bir kart o sarti saglamaz. Ayrica `evidence` tasimada duserse
`rec.evidence.length` **TypeError atip karti cokertiyordu** - dosyanin
kendi 20. satiri tam o durumu yakalamak icin yazilmisti.

Kapi govdeye tasindi. Alternatifler kapinin DISINDA kaldi: onlar kararin
kendi kaydidir, onerinin aciklanabilirligine bagli degil.

### 5 - `AIPulse` olculmemis yuku "0" basiyordu

`Math.round(state.load)` - `load` null iken **"yuk 0"**, undefined iken
**"yuk NaN"**. Ayni dosyadaki `rotationSeconds` `load`u
`number | null | undefined` kabul edip `Number.isFinite` ile koruyor, yani
null BEKLENEN bir deger; metin onu korumuyordu. Halka dogru sekilde en
yavas donerken yazinin "yuk 0" demesi, olculmemisi olculmus gosterir.

### 6 - `<dl>` icinde `<p>`: HTML gecersizdi

`Stat`in `note`u `<p>` olarak basiliyordu; `<dl>` dogrudan yalniz
`<dt>`/`<dd>` gruplari (ve `<div>`/`<script>`/`<template>`) icerebilir.
axe `definition-list` ile **12 story dusuyordu**. Not ikinci bir `<dd>`
oldu - bir `<dt>`nin birden cok `<dd>`si gecerlidir ve anlamca dogrusudur:
not, ayni terimin ikinci aciklamasidir. Ayrica `stat.stories.tsx`
`Stat`i `<dl>` disinda render ediyordu (`dlitem`, 10 ihlal) - dekorator
eklendi, ama YALNIZ `args` tabanli story'lere: kendi `<dl>`sini kuranlara
da eklemek IC ICE `<dl>` uretti ve ayni kurali ters yonden ihlal etti.

Kontrast disi a11y ihlalleri **27 -> 12**. Kalanlarin tamami tek token
kararina bagli degil; bkz UI-ADR-154 §a11y.

### ACIK KALANLAR - kayda gecti, yapilmadi

Ucuncu tur 41 bulgu uretti; yukaridaki 6'si kapatildi. Kalanlar
`19-s13-devir.md` §7'de listeli. One cikanlar:

- **Arama sayaci filtrelenmemis toplami duyuruyor** (2 ekran): 48 SKU'da
  "zzz" aratinca tablo "SKU yok" derken kutu "48 sonuc" der.
- **Escape `document` capture katmaninda yutuluyor**: ic ice diyalogda
  ikisi birden kapanir; `table`/`search`/`filter` Escape'leri modal
  icinde hic calismaz.
- **`command-palette` `aria-modal` diyor ama modal degil**: odak tuzagi
  ve kaydirma kilidi yok.
- **Sozluk aramalarinda tutarsiz savunma** (4 yer): ODIN sozluge yeni bir
  deger eklerse TypeError ile beyaz ekran.
- **`NoData` gerekcesi ekran okuyucuya ULASMIYOR**: `aria-label` generic
  rolde yok sayilir, `title` yalniz fareyle gorunur.
- **`verdict-form` fail-open**: `recClass` tasimada duserse gerekce
  ZORUNLU olmaktan cikar, ADR-0131'in B/C kurali sessizce kalkar.

Uc tekrar eden kok desen (ajanin kendi tespiti): kapi hesaplanip yalniz
bir dala uygulanmasi - sozluk aramalarinda tutarsiz `??` savunmasi -
Escape/odak sozlesmesinin capture katmaninda sessizce yutulmasi.

### Olcum

`npm run test:ci` = typecheck + lint + unit + storybook:
`tsc` 0, `lint` 0 hata 0 uyari,
**unit 16 dosya / 238 test** (alt sinir 230),
**storybook 53 dosya / 196 test** (alt sinir 190), atlanan 0, dusen 0.

---

## UI-ADR-156 - Ucuncu denetimin acik bulgulari kapatildi (S13 kapanis)

**Durum:** DONDURULDU
**Tarih:** 1 Agustos 2026
**Ilgili:** UI-ADR-131 - 155 - ODIN ADR-0131

UI-ADR-155 alti kritigi kapatip 35 bulguyu devretmisti. Bu tur, o listenin
**en agir yedisini** kapatti. Hepsi kaynaktan dogrulandi.

### 1 - Arama sayaci FILTRELENMEMIS toplami duyuruyordu (2 ekran)

`resultCount={query ? rows.length : null}` - ama o `rows` HAM listeydi;
filtreleme `DataTable`in icinde TanStack'te, `MonitoredDecisionsBoard`da
ise bilesenin kendinde yapiliyor.

**Somut:** 48 SKU'da eslesmeyen bir sorgu yazinca tablo "SKU yok" derken
kutu **"48 sonuc"** diyordu - ve bu sayi `aria-live` ile ekran okuyucuya da
okunuyordu. `search.tsx`in kendi sozlesmesi *"sayi UYDURULMAZ"* der.

Filtreyi ekranda TEKRARLAMAK yerine sayi filtreyi uygulayan katmandan
bildiriliyor (`onFilteredCount`): iki uygulama bir gun ayrisir, tek kaynak
ayrisamaz. Story ile kilitlendi.

**Yan bulgu:** ilk cozum geri cagriyi bir REF'te tutuyordu; ESLint
`react-hooks/refs` ile reddetti (render sirasinda ref yazmak, ebeveynde
render-ici setState olur). Dogrusu bagimliliga koymak ve **caginanin
kararli bir fonksiyon gecmesini sozlesme yapmak** - `useState` setter'i
zaten kararlidir. UI-ADR-154'un satir ici `eslint-disable` yasagi burada
ise yaradi: bastirilan uyari, cozulmemis sorundur.

### 2 - Korumasiz sozluk aramasi -> BEYAZ EKRAN (4 yer)

`CATEGORY[item.category].cls` - `TONE[item.tone].dot` - `TIER[tier]` -
`OUTCOME[outcome].label`. ODIN sozluge yeni bir deger ekledigi anda
(ve ekliyor: ADR-0148 dort runtime durumu, ADR-0151 `module:"runtime"`)
`undefined.x` ile TypeError atip ekranin TAMAMINI beyaz birakiyordu.
Ayni dosyalarda `??` savunmasi baska satirlarda ZATEN VARDI - tutarsizlikti,
tercih degil.

Bilinmeyen kategori icin notr bir geri dusus eklendi: **kategori ADI
gosterilir, uydurulmus bir siniflandirma DEGIL.** Notr glyph ve notr renk -
bir ciddiyet yargisi uretilmez, cunku kaynagi yok.

### 3 - `NoData` gerekcesi ekran okuyucuya HIC ULASMIYORDU

`<span title aria-label>` - `aria-label`, adsiz bir `<span>`in "generic"
rolunde ARIA'ya gore GECERSIZDIR ve yok sayilir; `title` ise yalniz FARE
ustunde cikar. Yani klavye ve ekran okuyucu kullanicisi her yerde sadece
**"—"** duyuyordu. Bu bilesen tum repoda gerekce tasiyicisidir ve "neden
veri yok" sorusunun tek cevabidir.

Duzeltme tek kelime: **`role="note"`**. `note` adlandirmayi DESTEKLEYEN bir
roldur; ayni `aria-label` artik gecerli ve duyuluyor.

**Ayrica bir iddia kacirilmisti:** varsayilan metin *"Veri kaynagi henuz
bagli degil"* idi - oysa veri olculup de yok olabilir. Sebebi bilmeden
soylemek, uydurmanin kucuk halidir. Varsayilan artik yalnizca "Veri yok".

### 4 - `verdict-form` FAIL-OPEN idi

`recClass !== undefined && ODIN_REASON_REQUIRED_CLASSES.includes(recClass)`
- sinif tasimada DUSERSE gerekce zorunlu OLMAKTAN CIKIYORDU. Yani
ADR-0131'in B/C kurali bir alanin kaybolmasiyla sessizce kalkiyor ve karar
tek tikla kaydediliyordu.

**Bir yonetisim kurali, kendisini tetikleyen verinin yoklugunda GEVSEMEZ.**
Sinif bilinmiyorsa gerekce ISTENIR: fazladan bir cumle yazmak, kaydi
gerekcesiz birakmaktan ucuzdur.

**Ve story bu acigi DOGRU davranis diye kilitliyordu:** `gerekceIstege`
fixture'i `recClass: undefined` kullaniyordu, yani "sinif yok" ile "gerekce
istege bagli"yi ayni sayiyordu. Fixture gercek bir sinifa ("A") cevrildi ve
sinif-bilinmiyor hali icin AYRI bir fail-closed testi yazildi.

### Olcum

`npm run test:ci` = typecheck + lint + unit + storybook:
`tsc` 0, `lint` 0 hata 0 uyari,
**unit 16 dosya / 238 test**, **storybook 53 dosya / 198 test**,
atlanan 0, dusen 0.

### Kalan acik bulgular

`19-s13-devir.md` §7 guncellendi. Kapatilmayanlarin en agirlari: Escape'in
`document` capture katmaninda yutulmasi (ic ice diyalog), `command-palette`
`aria-modal` diyor ama modal degil, tek provenance boslugunun tum Amazon
KPI'larini karartmasi (fail-total parse), tazelik damgasinin onbellekte
donmasi.

---

## UI-ADR-157 - Escape sozlesmesi: en ICTEKI kapanir (S13 kapanis)

**Durum:** DONDURULDU - test enjekte ihlalle degil, GERCEK hatayla dogrulandi
**Tarih:** 1 Agustos 2026
**Ilgili:** UI-ADR-149 - 156

### Bulgu

`useDialogBehavior` dinleyicisini `document` uzerine CAPTURE fazinda
ekliyordu. Iki ayri kusur ureiyordu:

1. **Ic ice diyalogda Escape IKISINI BIRDEN kapatiyordu.** Her diyalog
   dinleyicisini AYNI dugume ekliyor; `stopPropagation()` ayni dugumdeki
   diger dinleyiciyi DURDURMAZ (onun icin `stopImmediatePropagation`
   gerekir). Drawer icinden onay Modal'i acip Escape'e basmak ikisini
   birden kapatiyordu - kullanici farkinda olmadan bir baglami kaybediyor.

2. **Icerideki Escape'ler HIC calismiyordu.** Capture fazi hedeften ONCE
   kostugu icin `table`in secim birakmasi, `search`in listesini kapatmasi
   ve `filter`in panelini kapatmasi modal icinde hic devreye giremiyordu:
   modal once kapaniyordu.

### Cozum - iki parca

**(a) Kabarma fazi.** Escape artik `document`te KABARMA fazinda dinleniyor;
icerideki bilesen once gorur ve isterse `stopPropagation` ile sahiplenir.
Tab tuzagi capture'da kaldi (odak tasinmadan once yakalanmali).

**(b) Derinlik.** Yalniz EN ICTEKI diyalog Escape'e cevap verir.

### Ilk cozum YANLISTI ve testi yakaladi

Once bir dizi (`dialogStack`) kullanildi ve *"son eklenen en ustedir"*
varsayildi. **React cocuk effect'lerini EBEVEYNDEN ONCE kosturur**: icteki
modal once, distaki drawer sonra ekleniyordu - dizinin sonundaki DISTAKI
oluyordu ve Escape onu kapatip icindekini de goturuyordu. Test bunu
yakaladi (beklenen 1 diyalog, kalan 0).

Dogrusu mount/effect sirasi degil **gercek ic icelik derinligi**: her
diyalog cocuklarina bir context ile `depth + 1` verir; en icteki, derinligi
en buyuk olandir. Bu, effect sirasindan da portal DOM sirasindan da
bagimsizdir.

*Sira bir varsayimdir; derinlik bir olgudur.*

### Yan duzeltme - govde kaydirma kilidi

Kilit yalniz SON diyalog kapaninca serbest kaliyor. Once her diyalog
kapanista kilidi aciyordu: ic modal kapaninca distaki hala aciktı ama sayfa
diyalogun arkasinda kaydirilabilir hale geliyordu.

### Testin ogrettigi bir sey daha

`getByRole("dialog", { name: "Dis panel" })` icteki modal acikken
BULAMIYOR - ve bu DOGRUDUR: acik bir `aria-modal` diyalog, disindaki her
seyi erisilebilirlik agacindan gizler. Iddia DOM'dan kuruldu; rol sorgusu
ancak icteki kapandiktan sonra anlamli.

### Olcum

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyari,
**unit 16 dosya / 238 test**, **storybook 53 dosya / 199 test**,
atlanan 0, dusen 0.

---

## UI-ADR-158 - Fail-total, donmus damga ve gecersiz tarih (S13 kapanis)

**Durum:** DONDURULDU
**Tarih:** 1 Agustos 2026
**Ilgili:** UI-ADR-115 - 137 - 155 - 157

Ucuncu denetimin acik listesinden **uc agir bulgu** daha kapatildi.

### 1 - Gecersiz tarih EKRANIN TAMAMINI goturuyordu

`Intl.DateTimeFormat.format(new Date(x))` gecersiz bir tarihte **RangeError
FIRLATIR** - sessizce bos donmez. Bu render sirasinda olur ve bolumu degil
ekranin tamamini `error.tsx` sinirina kadar goturur.

Girdi guvenli DEGIL: `report_period` alanlari (`start`/`end`/`at`) semada
yalniz `z.string()`; `isoDate` dogrulayicisi onlara uygulanmamis
(`asOf`/`createdAt`a uygulanmis). ODIN bu alanlari provenance'tan aynen
tasiyor ve icerik serbest bir sozluk - `"2026-W30"` bugun de gelebilir.

**Uc dosya ayni yardimciyi ayri ayri yazmisti** (`executive-kpi-card`,
`amazon/sku/screen`, `timeline`) ve **yalniz `timeline` gecerliligi kontrol
ediyordu.** Uc kopya, birinin korunup ikisinin korunmamasi demekti.
`lib/format/date.ts` acildi: `formatDate` gecersizde `null` doner (bos dize
DEGIL - cagiran "tarih yok" ile "tarih bos"u ayirabilsin).

Cagiranlar da duzeltildi: pencere okunamiyorsa `sku` panelinde satir HIC
cizilmiyor (bos bir "Donem:" etiketi, damganin bozuk oldugunu degil verinin
olmadigini dusundururdu); KPI kartinda ise pencere gun sayisiyla yine
soyleniyor - sayi olculmustur, yalniz damgasi bozuktur.

### 2 - Tek bir alan boslugu TUM Amazon ekranini karartiyordu (fail-total)

`as_of: z.string()` zorunluydu. Ama `amazon_api.py:108` bu alani
`(prov or {}).get("collection_date")` ile dolduruyor ve kayit henuz promote
edilmemisse **`None`** doner. Yani "bu metrigin veri ani YOK" ODIN'in
KASITLI ifadesi - bozukluk degil; ayni KPI'in `reason`u zaten "siparis
kaydi yayinlanmadi" diyor.

Bedeli tek alanla sinirli DEGILDI: yuk TEK PARCA parse edildigi icin bir
kaydin `as_of`u null oldugunda **tum KPI listesi VE ayni yukten beslenen
ALARM listesi** birden krariyordu. Kullanici olculmus alti KPI yerine
"Veri dogrulanamadi" goruyordu.

`asOf` kanonik tipte de semada da nullable yapildi. **Gevseme yalniz
OLCULMEMIS kayitlar icindir:** deger varsa `status: "available"` olur ve o
zaman kaydin bir veri ani vardir - damgasiz bir SAYI hala gecmez, test
bunu ayrica kilitliyor.

### 3 - Tazelik damgasi onbellekte DONUYORDU

`computeFreshness` yalniz `queryFn` icinde, fetch aninda bir kez kosuyor ve
sonuc zarfla birlikte React Query onbelleginde donuyordu. `TrustSignal`
`meta.freshness`i okuyor ama YASI `useNow` ile canli tazeliyordu.

`default` modulde `staleTime` 5 dk, `refetchInterval` 60 dk. Yani 50.
dakikada ekranda **AYNI SATIRDA** su yaziyordu:

> ● canli · ODIN cekirdegi · 50 dk once

**Celisen iki isaret, hic isaret olmamasindan kotudur** - kullanici
hangisine inanacagini bilemez ve `TrustSignal`in TEK isi o guveni kurmaktir.
`computeFreshness` artik `now` parametresi aliyor (UI-ADR-089: render'da
`Date.now()` yok) ve `TrustSignal` tazeligi yeniden hesapliyor. Saat henuz
gelmemisse (`now === null`) zarftaki deger korunur - tahmin yok.

### Olcum

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyari,
**unit 16 dosya / 243 test**, **storybook 53 dosya / 200 test**,
atlanan 0, dusen 0.

---

## UI-ADR-159 - `aria-modal` bir BEYANDIR; davranisi kurmayan beyan yalan soyler (S13 kapanis)

**Durum:** DONDURULDU
**Tarih:** 1 Agustos 2026
**Ilgili:** UI-ADR-149 - 157 - 148 - CLAUDE.md §5

`command-palette` `role="dialog" aria-modal="true"` yaziyordu ama **modal
DEGILDI.** Bagimsiz denetim bes kusur buldu; hepsi yalniz klavyeyle
gorulebilir turden - fareyle bakan hicbirini fark etmez.

| Kusur | Sonucu |
|---|---|
| Odak tuzagi YOK | Son sonuctan sonra Tab, odagi perdenin ARKASINDAKI uygulamaya kacirıyordu; kullanici hala palette saniyor |
| Govde kaydirma kilidi YOK | Palet acikken arka sayfa kayiyordu |
| Escape yalniz `<input>`ta | Odak bir sonuca gectigi an olu tus |
| `listRef` tanimli ama HIC OKUNMUYOR | Imlec `max-h-96` penceresinden cikip gorunmez oluyordu (30 komutta olculebilir); klavye kullanicisi secili olani goremeden Enter'a basiyordu |
| `<li>` icine sarilmis `<button role="option">` | Option'lar listbox'in DOGRUDAN cocugu degildi; `aria-activedescendant` da yoktu, imlecin nerede oldugu duyurulmuyordu |

### `aria-modal` yazmak, modal olmak degildir

Bir ARIA ozniteligi ekran okuyucuya bir SOZ verir: "bu diyalog acikken
disari cikamazsin". Davranis kurulmazsa o soz tutulmaz ve kullanici
diyalogda oldugunu sanarak arkadaki ekranla etkilesir. Bu, sahte veri
yasaginin (CLAUDE.md §2) erisilebilirlikteki karsiligidir: **karsiligi
olmayan bir beyan cizilmez.**

### Cozum - YENIDEN YAZMADAN

Odak tuzagi, kaydirma kilidi ve odak geri verme `modal.tsx`te ZATEN
yazilıydi. Ikinci kez yazmak, ikisinin bir gun ayrismasi demekti
(CLAUDE.md §5). `useDialogBehavior` disari acildi ve palet onu kullaniyor
- Escape'in derinlik kurali (UI-ADR-157) da boylece bedava geldi.

Liste yapisi `ui/search.tsx`in combobox kalibina hizalandi: `role="combobox"`
+ `aria-expanded` + `aria-controls` + `aria-activedescendant`, ogeler
dogrudan `role="option"`. `listRef` nihayet kullaniliyor:
`scrollIntoView({ block: "nearest" })`.

### Envanter DOKUZDAN SEKIZE indi

`ui/modal` artik yetim degil - paletin gercek bir tuketicisi var.
`inventory.test.ts` bunu yakaladi (anlik goruntü uyusmadi) ve bu
**dogrudur**: kapinin kucuLMEYI de fark etmesi gerekir. Envanterden cikan
bir bilesen, artik gercekten kullanilan bilesendir.

### Kapi

`command-palette.stories.tsx` - paletin ilk hikayesi. Arkada odaklanabilir
bir hedef var: odak tuzagi kirilirsa Tab oraya kacar ve test yakalar.
Dort iddia: imlec duyurulur ve ok tusuyla degisir - secenekler listbox'in
dogrudan cocugudur ve isaret edilen id GERCEKTEN vardir - odak sonuc
sayisindan fazla Tab'da bile disari cikmaz - Escape her odak durumunda
calisir.

### Olcum

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyari,
**unit 16 dosya / 241 test**, **storybook 54 dosya / 201 test**,
atlanan 0, dusen 0.

---

## UI-ADR-160 - Odak kaybolmaz, kontrol klavyeye kapanmaz (S13 kapanis)

**Durum:** DONDURULDU
**Tarih:** 1 Agustos 2026
**Ilgili:** UI-ADR-149 - 159

Ucuncu denetimin klavye/odak bulgularindan ucu kapatildi. Ucu de gorunur
bir kusur URETMIYOR - yalnizca klavyeyle fark edilir.

### 1 - `SegmentedControl` klavyeye TAMAMEN kapanabiliyordu

`tabIndex={active ? 0 : -1}` idi. `value` hicbir secenekle eslesmezse
(orn. URL'den gelen `"7g"`, secenekler `["24s","30g"]`) **TUM butonlar -1**
oluyor ve kontrole Tab'la ULASILAMIYORDU.

Gorunur oldugu halde kullanilamayan bir kontrol, olmayan bir kontroldur.
Artik hicbiri eslesmezse ILK buton odaklanabilir kalir.

### 2 - Ok tusu secimi degistiriyor ama ODAGI TASIMIYORDU

`move()` yalniz `onChange` cagiriyordu; odak eski butonda kaliyor ve o
buton `tabIndex={-1}`e dusuyordu. WAI-ARIA radyo grubu kalibi odagin
secimle birlikte tasinmasini ister - tasinmazsa **ekran okuyucu secim
degisimini DUYURMAZ** ve kullanici klavyeyle sikisir. (`ui/tabs.tsx` bunu
zaten dogru yapiyordu; iki kardes ayrismisti.)

### 3 - Baglam paneli kapaninca odak `<body>`ye dusuyordu

Kapat butonuna basinca tum `<aside>` sokuluyor ve odak hicbir yere
verilmiyordu: sonraki Tab **belgenin basina** atlar ve klavye kullanicisi
bulundugu yeri kaybeder.

`ui/filter.tsx` tam bu hatayi adiyla anip duzeltmisti (UI-ADR-149);
burada duzeltilmemisti - kural yazilmis ama her yere uygulanmamisti. Panel
kapaninca odak yerine gecen ray butonuna, acilinca panelin kapat butonuna
veriliyor: her iki yonde de odak GORUNUR bir hedefte kalir.

### Kapi

`selection.stories.tsx` - iki story: eslesmeyen degerde bile tam bir buton
odaklanabilir kalir; ok tusu hem `aria-checked`i hem ODAGI tasir.

### Olcum

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyari,
**unit 16 dosya / 241 test**, **storybook 54 dosya / 203 test**,
atlanan 0, dusen 0.

---

## UI-ADR-161 - Kaynagi olmayan yargi uretilmez (S13 kapanis)

**Durum:** DONDURULDU
**Tarih:** 1 Agustos 2026
**Ilgili:** UI-ADR-139 - 156 - 160

Alti bulgu daha. Ortak yanlari: hicbiri hata vermiyor, hepsi **kaynagi
olmayan bir SEY SOYLUYOR.**

### 1 - Filtre sonucu bos ≠ veri yok (`ui/table.tsx`)

48 satirlik bir tabloda eslesmeyen bir sorgu yazinca ekran *"Kayit yok —
Bu tabloda gosterilecek veri bulunmuyor"* diyordu. **Veri VAR; eslesen
yok.** Ikisini ayni gostermek kullaniciya kaynagin bos oldugunu
dusundurur ve aramayi temizlemeyi akla getirmez. Artik ayri metin, ve
tablodaki gercek kayit sayisi da yaziliyor.

### 2 - Hayalet secim (`ui/table.tsx`)

Secili satir filtreyle listeden ciktiginda `selected` duruyordu: alt bar
hala "1 satir secili" diyor ve `onSelect(null)` hic cagrilmadigi icin
**sag baglam paneli listede olmayan bir kaydi** gostermeye devam
ediyordu. Ekranda gorunmeyen bir kaydin detayina bakmak, hangi kaydi
inceledigini SANMAKLA arasindaki farki siler.

### 3 - Enter siralama basligini olduruyordu (`ui/table.tsx`)

`<table onKeyDown>` Enter'da `preventDefault` yapiyor ve bu BALONCUKLANAN
olaylara da uygulaniyordu: siralama basligi bir `<button>` ve Enter'in
varsayilan "tikla" davranisi iptal ediliyordu. Dosyanin 17. satiri
*"Enter/Space ile siralar"* diyor - **Enter calismiyordu**; Space
calistigi icin gozden kacmis. Ayni sebeple hucre icindeki her buton da
Enter'a sagirdi. `if (e.target !== e.currentTarget) return;`

### 4 - Bilinmeyen ciddiyet "Bilgi" diye gomuluyordu (`alert-stack`)

`?? SEVERITY.info` idi: ODIN sozluge yeni bir deger eklerse (orn.
`"urgent"`) uyari mavi **"Bilgi"** rozetiyle ve listenin **EN ALTINDA**
gorunuyordu. Ikisi de kaynagi olmayan bir YARGIDIR: ne "bu bilgi
amaclidir" ne "bu en onemsizidir" olculmustur.

Sinifi bilinmeyen bir uyarinin tehlikeli OLMADIGINI da bilmiyoruz;
listenin dibine gommek onu hic gostermemekle ayni seydir. Artik notr
etiketle (`siniflandirilmamis`) ve **EN USTTE**.

UI-ADR-139'un testi eski davranisi kilitliyordu ve degisikligi YAKALADI -
kapinin isini yapmasi budur; test gerekcesiyle guncellendi.

### 5 - Para birimi uyduruluyordu (`ui/typography.tsx`)

`options.currency = currency ?? "TRY"`. Bildirilmemis bir para birimi
sessizce **liraya** donuyordu. Dolar bir tutari lira gostermek eksik
veriden cok daha tehlikelidir: sayi makul gorunur ve kimse sorgulamaz.
Bugunku cagiranlarin hepsi `Money.currency` geciyor - ama varsayilan bir
tuzakti ve `Num`un kendi anti-fake sozu (satir 10) bunun tersini vaat
ediyordu. Bildirilmemisse **birimsiz** yazilir.

### 6 - Tiklanabilir satirin adi KIMLIKTI (`ui/timeline.tsx`)

`label={actor ? \`${actor}: ${id}\` : id}` - ekran okuyucuda
**"evt-4821, buton"** diye okunuyordu; kullanici neye tikladigini
bilmiyordu. (`alert-stack.tsx` ayni isi baslikla yapiyor.) `title` tipce
`ReactNode` oldugu icin dize oldugunda kullaniliyor, degilse "Olay {id}"
- ciplak kimlik hicbir sey soylemez.

### Olcum

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyari,
**unit 16 dosya / 241 test**, **storybook 54 dosya / 203 test**,
atlanan 0, dusen 0.

---

## UI-ADR-162 - Sessiz bozulmalar: NaN, cift kimlik, duyurulmayan bolge (S13 kapanis)

**Durum:** DONDURULDU
**Tarih:** 1 Agustos 2026
**Ilgili:** UI-ADR-115 - 161 - CLAUDE.md §2

Alti bulgu daha. Hicbiri hata vermiyor; hepsi **sessizce yanlis calisiyor.**

### 1 - `NaN` / `Infinity` kapilardan GECIYORDU

Ikisi de tipce `number`dir ve `v !== null` kontrolunden gecerler.
Sonuc: `chart`ta okuma satiri **"NaN"** basiyor, `sparkline`da yol
**`d="M NaN,NaN"`** oluyordu. Olculemeyen bir deger `null`dir.

Normalizasyon **turetmenin kaynagina** kondu (`chart`ta `values` memo'su):
alan ve noktalar da ondan hesaplandigi icin asagidaki her mantik tek bir
"yok" kavramiyla calisiyor. *Ilk denemede sonradan temizlendi ve GEC
KALDI* - noktalar zaten ham diziden hesaplanmisti.

### 2 - `Tabs` kimlikleri GLOBALDI

`id={\`tab-${item.id}\`}` - ayni sayfada iki `Tabs` varsa (iki panelde de
"health" sekmesi) DOM'da CIFT kimlik olusur ve `aria-labelledby` YANLIS
ogeye baglanir: ekran okuyucu kullanicisi baska bir sekmenin adini duyar.
Kapsam `useId` ile uretilip context'le `TabPanel`e tasiniyor - ikisi AYNI
kapsami paylasmak zorunda, yoksa bag kopar.

### 3 - Canli bolge iceriğiyle BIRLIKTE mount ediliyordu

`{resultCount !== null && <span aria-live="polite">}`. Bir `aria-live`
bolgesi DOM'a iceriğiyle ayni anda girerse **cogu ekran okuyucu onu
DUYURMAZ** - bolgeyi izlemeye ancak var olduktan sonra baslar. Yani arama
sonucu sessizce beliriyordu ve yalniz GOREN kullanici ogreniyordu.
Kap kosulsuz, icerik kosullu. (`ui/chart.tsx:161` ayni isi zaten dogru
yapiyordu.)

### 4 - Bilinen sebep "bilinmeyen hata" diye gosteriliyordu

`odin-state.ts`te iki yerde duz `throw new Error(...)`. `classifyError`
bunu `unknown` dalina dusuruyor ve kullaniciya *"Beklenmeyen bir hata
olustu — kaynagi UYDURULMADI"* yaziliyordu. Oysa sebep tam olarak
biliniyor: ODIN `alerts: null` / `opportunities: null` yayinladi. Ayni
dosyanin `:122` satiri bunu ZATEN `contractError` ile dogru yapiyor; iki
cagri yeri atlanmis.

### 5 - Secim hafizasi acik kartlari SILIYORDU

`rememberSelection` yalniz `scrollTop`u elle tasiyip `entry`yi yaymiyordu:
`expandedIds` DUSUYOR ve bir satir secildiginde o workspace'te acik
birakilmis kartlar sessizce kapaniyordu. Hemen ustteki `rememberScroll`
bunu zaten dogru yazmis - iki kardes ayrismisti. **Alan eklendikce elle
tasima unutulur; yayma unutulmaz.**

### Olcum

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyari,
**unit 16 dosya / 241 test**, **storybook 54 dosya / 203 test**,
atlanan 0, dusen 0.

---

## UI-ADR-163 - Bastirilan sayi soylenir; kilit anin degil ISLEMIN kilididir (S13 kapanis)

**Durum:** DONDURULDU - ucuncu denetimin acik listesi BITTI
**Tarih:** 1 Agustos 2026
**Ilgili:** UI-ADR-155 - 157 - 158 - 162

Son yedi bulgu.

### 1 - Olculemeyen SKU'lar sessizce risk degerlendirmesinden cikiyordu

`atRiskSkus` yalniz `critical`/`warn` doner; `unknown` durumdaki SKU'lar
(hizi olculmemis olanlar) listeye BILEREK alinmaz - **ve bu dogrudur**,
onlar hakkinda bir risk yargisi YOKTUR. Ama ekran bos kohortu *"Hicbir SKU
riskli ya da kritik durumda degil"* diye yaziyordu.

48 SKU'nun 29'u olculmemisken bu cumle bir OLCUM iddiasidir. Dogrusu:
"degerlendirilen 19'un hicbiri riskli degil — 29 SKU olculemedi".
**Bastirilan sayiyi SOYLEMEK, bastirmayi mesru kilan tek seydir**
(`alert-stack` ayni kalibi zaten kullaniyor).

### 2 - `adaptSkus` olculmus satirlari sessizce dusuruyordu

Filtre `s.asin && s.title && s.status` idi ama yorum yalniz KIMLIK
gerekcesini anlatiyordu. ODIN satirlari `set(econ) | set(items) |
set(ad_rows)` birlesiminden uretiyor ve `status` yalniz ENVANTER kaydi
olan SKU'larda dolu. Yani **envanterde olmayan ama reklam harcamasi ve
satisi OLCULMUS bir SKU tablodan tamamen kayboluyordu.**

Kimligi bilinmeyeni gizlemek baska, olculmus reklam harcamasini gizlemek
baskadir. `status` filtreden cikarildi; ODIN'in sozlugunde zaten `unknown`
var.

### 3 - `toPeriod` sinir durumlari

Gecersiz `end` -> `toISOString()` **RangeError** (ve `classifyError` bunu
"unknown" diye siniflar, oysa sozlesme hatasidir). `window_days: 0` ->
`from = end + 1 gun`, yani **tersine donmus pencere**. Ikisinde de `null`:
pencere YAZILMAZ. *Uydurulmus bir aralik, yazilmamis bir araliktan
tehlikelidir.*

### 4 - Bayat-veri kilidi ANIN kilidiydi, ISLEMIN degil

`stale` yalniz uc butonu `disabled` yapiyordu. Form KURULDUKTAN sonra veri
bayatlarsa (poll gelir, kullanici gerekce yazarken) gonderim
engellenmiyordu: taze veriyle "Onayla"ya basip **bayat veriye dayanan bir
karar kaydedilebiliyordu.**

### 5 - `modal` odagi her render'da geri atiyordu

`useEffect(..., [open, onClose])` - cagiran satir ici ok fonksiyonu
verirse (`onClose={() => setOpen(false)}`, en yaygin bicim) HER ebeveyn
render'inda effect sokulup yeniden kuruluyor, odak once tetikleyiciye
sonra panelin ilk ogesine (Kapat butonu) siciyordu. Modal icinde bir form
varsa her tus vurusunda odak Kapat'a kaciyordu.

`onClose` ref'e alindi ve ref **effect icinde** yaziliyor - render'da
yazmak `react-hooks/refs` ihlalidir (UI-ADR-157'de ogrenildi).

### 6 - Bos bolum bayragi DIZIDEN degil ekran degiskeninden geliyordu

`empty={isEmpty}` yalniz demo bayragina bakiyordu. Zarf `data: []` ile
geldiginde bayrak false kaliyor, `map` hicbir sey basmiyor ve ekranda
**basligi olan ama ne icerigi ne bos durumu olan** bir bolum kaliyordu.
Sessiz bir bolum, cevap degildir.

### Olcum - uretim derlemesi ve tarayici

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyari,
**unit 16 dosya / 241 test**, **storybook 54 dosya / 204 test**.
Uretim derlemesi 7 sayfa; dort rota 200. Tarayicida `/amazon`: konsol
hatasiz, `NaN` yok, izgara ciziliyor, yuzdeler tek ondalikla, tazelik
etiketi yasla TUTARLI ("canli · 2 dk once").

---

## UI-ADR-164 - Duzeltmelerin denetimi: iki KRITIK regresyon kendi islerimde (S13 kapanis)

**Durum:** DONDURULDU
**Tarih:** 1 Agustos 2026
**Ilgili:** UI-ADR-155…163

Ucuncu denetimin 41 bulgusu kapatilmisti ama **duzeltmeleri kimse
denetlememisti.** Dorduncu tur onlari denetledi: **2 kritik, 3 orta,
3 dusuk — sekizi de benim son nokuz ADR'imde.**

Bu turun tek cumlelik dersi: *bir hatayi duzeltmek, yeni bir hata
yapmamak demek degildir.*

### KRITIK 1 - SKU duzeltmem tabloyu TAMAMEN karartiyordu

UI-ADR-163 `status`u filtreden cikardi ki envanterde olmayan ama reklam
harcamasi OLCULMUS SKU kaybolmasin. Ama satir `status: s.status!` ile
geciliyordu — **`!` yalniz TIPI susturur, degeri degistirmez.** Ham
`status` nullable; cikti `skuHealthSchema` ile dogrulaniyor ve orada
nullable DEGIL.

Sonuc: `status: null` gelen tek bir satir TUM diziyi reddettiriyor ve
**48 SKU birden kariyordu.** Yani "bir satiri gizleme" hatasi, "tum
tabloyu karartma" hatasina donusmustu — UI-ADR-158'in fail-total olarak
kapattigi seyin ta kendisi, ters yonden.

**Ve yorumum yalan soyluyordu:** *"durumu bilinmeyen satir `unknown`
etiketiyle listede kalir"* diye yazmisim; kod o eslemeyi YAPMIYORDU.
Karsiligi olmayan bir iddia — bu repoda sahte veriyle ayni sinifta.
`status: s.status ?? "unknown"`.

### KRITIK 2 - "en icteki kapanir" AYNI DERINLIKTE calismiyordu

UI-ADR-157 kimligi ic icelik DERINLIGI yapmisti (mount sirasina dayanan
ilk cozumden iyiydi) ama **ayni derinlikteki iki diyalog ayirt
edilemiyordu.** Teorik degil: UI-ADR-159 `command-palette`i bu hook'a
bagladi ve palet `app-shell`de ekran icerigin KARDESI olarak mount
ediliyor -> derinligi 1; ekran seviyesindeki her `Modal`/`Drawer` da 1.

Onay modali acikken Ctrl+K ile palet acilip Escape'e basilinca **ikisi
birden kapaniyordu** — 157'nin duzelttigini iddia ettigi davranis.
Ayrica govde kaydirma kilidi `Set<number>` oldugu icin siziyordu:
ikincinin `add(1)`i no-op, ilkinin kapanisindaki `delete(1)` kumeyi
bosaltip kilidi digeri hala acikken serbest birakiyordu.

Artik her diyalog **benzersiz bir token** alir; siralama derinlige,
esitlikte ekleme sirasina gore. Kilit de yigin gercekten bosalinca ve
**ILK kaydedilen** degerle geri yazilir.

### ORTA 3 - `Tabs` kapsami PANELE HIC ULASMIYORDU

UI-ADR-162 kimlik cakismasini bir context ile cozmeye calisti. Ama `Tabs`
`children` ALMIYOR: Provider yalnizca kendi `<div role="tablist">`ini
sariyordu ve `TabPanel` yapisal olarak onun React cocugu OLAMAZ ->
`scope` her zaman `""`.

Sonuc: sekme tarafi kapsamli, panel tarafi kapsamsiz — `aria-controls` ve
`aria-labelledby` **her iki yonde de var olmayan kimlige** isaret
ediyordu. Duzeltmeden ONCE iliski KURULUYORDU; net bir gerileme.
Context kaldirildi, acik `scope` prop'u kondu: **calismayan sihirden acik
prop iyidir.**

### ORTA 4 - "damgasiz sayi gecmez" bir DILEKTI, kural degil

UI-ADR-158 `asOf`u nullable yapti ve tipin yorumuna *"boyle bir kayit
zaten `status !== available` gelir"* yazdi. Sema'da bunu zorlayan hicbir
sey yoktu: `{status:"available", value:42, asOf:null}` GECIYORDU. Adi bu
garantiyi veren test ise `asOf` DOLU bir kaydi parse edip
`.not.toBeNull()` diyordu — iddiayi hic sinamiyordu. Artik `refine`.

### ORTA 5 - Palet odak tuzagi testi KORMUZI OLAMIYORDU

`expect(activeElement).not.toBe(arkadaki)` idi. Panelin tek odaklanabilir
ogesi `<input>`; tuzak kaldirilsa odak `<body>`ye duserdi ve iddia YINE
gecerdi. UI-ADR-159'un bas iddiasi korumasizdi. Dogru iddia olumsuz degil
**OLUMLU**: odak panelin ICINDE kalmali.

### DUSUK 6-8

- **`shown ?? 0`**: zarf yokken tahta "Karar verisi yok" derken arama
  kutusu `aria-live` ile **"0 sonuc"** okutuyordu — UI-ADR-155'in
  (olculmedi ≠ bos) dogrudan ihlali. Tip `number | null` oldu.
- **Bayat kilit formu SOKUYORDU** ve yazilan gerekceyi atiyordu. Butonlar
  zaten `disabled={stale}` oldugu icin o dal her zaman "kullanici gerekce
  yazarken poll geldi" demekti. **Bir kilit, korumak istedigi emegi yok
  etmemeli.** Form kalir, yalniz GONDERIM kilitlenir (`blocked` prop'u).
- **`telemetry-bar` birimsiz tutar basiyordu**: `Num` artik lira
  uydurmuyor (161) ama birimsiz bir sayi "para mi adet mi" sorusunu
  cevaplamiyor. Kanal para birimi bildirmedigi surece gosterge gerekceli
  bos kaliyor.

### Denetimin TEMIZ buldugu yerler

`Math.max` bos kume sorunu yok · `table`ta sonsuz dongu yok (iki cagiran
da kararli, React ayni degerde bail-out ediyor) · `btnRefs` bayat dugum
tutmuyor · `no_movement` dogru siniflandirilmis · `periodLabel` null'lari
her iki cagiranda da eleniyor · NaN normalizasyonu, `navigation` yayma,
`verdict-form` fail-closed, odak devri ve canli tazelik iddialariyla
ortusuyor.

### Olcum

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyari,
**unit 16 dosya / 241 test**, **storybook 54 dosya / 206 test**,
atlanan 0, dusen 0.

---

## UI-ADR-165 — Erişilebilirlik kapısı KAPANDI: 609 ihlalden 0'a

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-142 · 153 · 154 · 164

S13'ün açık bıraktığı son madde. `addon-a11y` `test: "todo"` idi: ihlalleri
GÖSTERİYOR ama hiçbir testi düşürmüyordu. `error`e çevrildiğinde ölçüm
**107 story / 609 ihlal**di. Artık **0** ve kapı kapalı.

### Yol: 609 → 27 → 6 → 1 → 0

**Adım 1 — tek token, ihlallerin %96'sı.** `--odin-text-tertiary`
(`gray-500`, `#64748B`) karanlık temanın BEŞ zemininin hiçbirine karşı
AA'yı geçmiyordu (3.16 – 4.14). Aydınlık tema DEĞİŞTİRİLMEDİ: orada zaten
geçiyor (4.55 – 4.76) ve geçen bir şeyi değiştirmek gereksiz bir görünüm
değişikliğidir.

⚠️ **Sahibe verdiğim ilk aday listesi YANLIŞTI.** `#7c8899 → 4.93` demişim;
o ölçüm yalnız üç zemin görüyordu. `surface-elevated` (#16202F) ve
`surface-floating` (#1B2739) katılınca aynı ton **4.18'e düşüyor ve
KALIYOR.** Bir kontrast iddiası, ölçüldüğü zemin kümesi kadar doğrudur.
Geçen asgari ton `#8593A5` (`gray-450`); `gray-400`ü kullanmak yeterdi ama
o `text-secondary` — ikisini eşitlemek üçüncül/ikincil hiyerarşisini SİLERDİ.

**Adım 2 — danger kırmızısı kendi uyarısını okunmaz yapıyordu.**
`--odin-danger` = `red-500` (#EF4444): tonlu rozet zemininde 3.68, DÜZ
zeminde bile 4.00. `red-400` zaten palette vardı — yeni ton uydurulmadı.
Yazı olarak en kötü 5.00'e, `bg-danger` üstünde koyu yazı yönünde
5.23'ten 7.12'ye çıkar. **Uyarının kendisi bir erişilebilirlik kusuruysa,
uyaramaz.**

**Adım 3 — story'nin yarattığı bağlam, bileşenin kusuru değildir.** Dört
ihlal bileşen GERÇEKTE HİÇ BULUNMADIĞI bir bağlamdan geliyordu ve
düzeltme story'de yapıldı: `Stat` `<dl>` içine iki kat sarılmıştı
(`dl > div > div > dt` — HTML tek kata izin verir) · `Tabs` panelsiz
render ediliyordu (seçili sekmenin `aria-controls`u var olmayan kimliğe
işaret ediyordu) · iki çıplak `Input` `Field`sız, yani adsızdı.

Bir ihlal ise **gerçek bir kusurdu**: `MinorityOpinionBanner` sayfa
seviyesi bir `<aside aria-label="Azınlık görüşü">` basıyordu ama karar
kartının İÇİNDE yaşıyor ve `DecisionQueue` üç kart birden basıyor — aynı
adı taşıyan üç `complementary` landmark. Bir kart içi not, sayfanın
gezinme iskeletine ait değildir; `<div>` oldu.

**Adım 4 — üç ihlal bir TASARIM kusuru değil, bir YARIŞTI.** axe
`afterEach`te koşuyor; giriş animasyonu o an hâlâ opaklığı taşıyorsa axe
YARIM KAREYİ ölçüyor ve "kontrast 1.06" diyor. Ekranda o renk hiç durmaz.
Ve yarış olduğu ÖLÇÜLDÜ: aynı kod iki koşuda **3 ve 6** test düşürdü —
yani bu testler yalnız yanlış değil, KARARSIZDI.

Önce `reducedMotion: 'reduce'` denendi ve **yetmedi**: bileşenler o kipte
hareketi kaldırıyor ama çapraz geçişi koruyor — ve bu DOĞRUDUR
(`disclosure.tsx:10`: "hareket kalkar, bilgi kalmaz değil"). Düzeltilmesi
gereken üretim değil, ölçüm anıydı: test koşucusunda
`MotionGlobalConfig.skipAnimations`. Storybook arayüzünde hiçbir şey
değişmez.

**Adım 5 — devre dışı olduğunu söylemeyen bir kontrol.** Son ihlal
`Toggle`ın solgun etiketiydi. WCAG 1.4.3 etkin olmayan bileşenleri
kontrast şartından muaf tutar ve axe da aynı muafiyeti uygular — ama
axe'in muafiyet sorgusu `input, select, textarea` arıyor (kaynaktan
okundu: `color-contrast-matches`), `Toggle`ın denetimi ise
`<button role="switch">`. Yani muafiyet uygulanmıyordu.

Kuralı kapatmak yerine EKSİK OLAN SÖYLENDİ: etikete `aria-disabled`.
Çünkü asıl kusur kontrast değildi — ekran okuyucu o metni etkin bir
seçenek gibi okuyordu. **Solgun görünmek yalnız GÖREN kullanıcıya bilgi
verir.** (`Checkbox`/`Radio` bunu istemiyor: onların denetimi gerçek bir
`<input disabled>`. `SegmentedControl` de sağlam — her butonu `disabled`,
klavye yolu da kapalı; ölçüldü, dokunulmadı.)

### Kapı sökülemez

`test: "error"` → `"todo"` tek kelimelik bir düzenlemedir ve **206 testin
hepsini yeşil bırakarak erişilebilirlik kapsamının tamamını kapatır.** Ne
alt sınır ne kimlik kontrolü bunu görür: ikisi de SAYIYA bakar, sayı hiç
değişmez. Bu, UI-ADR-154'ün kapattığı "commit A'da test ekle, commit B'de
kapıyı sil" oyununun aynısıdır — bir ayar satırıyla.

`verify-tests.mjs` artık `storybook` projesinde `preview.tsx`i okuyup
`test: "error"` arıyor. Bilinçli geri çevirme hâlâ mümkün; ama artık o
satırı da düzenlemeyi, yani kapıyı sökmeye NİYET etmeyi gerektiriyor.
(Kilit sınandı: `todo` ve `off` ikisi de kırmızı.)

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 16 dosya / 241 test**, **storybook 54 dosya / 206 test**,
atlanan 0, düşen 0, **a11y ihlali 0** (`test: "error"`).

---

## UI-ADR-166 — "Kapı sökülemez" ölçülmemiş bir iddiaydı

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-154 · 164 · 165

UI-ADR-165 erişilebilirlik kapısını kapattı ve **hiç denetlenmedi.**
UI-ADR-164'ün dersi tam olarak buydu — *bir hatayı düzeltmek, yeni bir
hata yapmamak demek değildir* — ve yine doğrulandı: iki bağımsız
adversaryal denetim **2 kritik + 6 orta + 9 düşük** buldu, hepsi 165'in
kendi içinde.

Kurul (`ask_yazilimcilar`) bu oturumda dört kez denendi; MCP araçları
oturuma hiç kayıtlı değil ([[council-session-bound]]). Denetim bağımsız
ajanlara yaptırıldı. **Kaç kaynaktan karar verildiği yazılmalıdır: iki.**

### KRİTİK 1 — kapı ÜÇ yoldan sökülebiliyordu, kilit hiçbirini görmüyordu

165 şunu yazdı: *"Bilinçli bir geri çevirme mümkündür — ama bu satırı da
düzenlemeyi, yani kapıyı sökmeye NİYET etmeyi gerektirir."* **Yanlıştı.**
Kilit yalnız `preview.tsx`te `test: "error"` metnini arıyordu:

1. **`main.ts`ten `"@storybook/addon-a11y"` satırını sil** → axe hiç
   yüklenmez, tarama sıfır. Test SAYISI değişmez (axe ayrı test
   üretmiyor), `preview.tsx` el değmeden durur → **kilit yeşil.**
   Kapıyı taşıyan dosya, ayarı taşıyan dosya değildi.
2. **Bir story'ye `parameters: { a11y: { test: "todo" } }` yaz.**
   Storybook `project → meta → story` sırasıyla birleştirir; story SON
   yazandır. Kilit `.stories.tsx` dosyalarını hiç açmıyordu.
3. **`a11y` bloğuna `disable: true` ya da `manual: true` ekle** —
   `test: "error"` satırı yerinde kalır, tarama yine susar.

Ve **dördüncüsü koda hiç dokunmadan:** `VITEST_STORYBOOK=1`. İhlal yalnız
`import.meta.env.VITEST_STORYBOOK === "false"` iken fırlatılıyor; kabukta
ya da CI runner'ında bu değişken doluysa ihlaller rapora yazılır ama
hiçbir test düşmez ve **depoda hiçbir iz kalmaz.**

Üçü de kaynaktan doğrulandı (`@storybook/addon-a11y`,
`@storybook/builder-vite`, `storybook/dist/preview/runtime.js`).

**KİLİDİN EN BÜYÜK KUSURU: kendi testi yoktu.** `--self-check` bloğu
`process.exit(0)` ile çıkıyordu ve kilit ondan SONRA geliyordu — yani
kilit hiç sınanmıyordu. Commit mesajı "kilit sınandı" diyordu; elle, bir
kez, kayıt bırakmadan. Bu dosyanın kendi felsefesi *"kapı, denenmeden
kapı sayılmaz"*.

Kilit artık `evaluate()` gibi **saf bir fonksiyon** (`a11ySorunlari`),
dört vektörü de kapsıyor, yorumları saymıyor (bir yorum içindeki
`test: "error"` kapıyı açık gösteriyordu) ve **dokuz self-check
senaryosu** var — üçü "biçim değişikliğinde YANLIŞ KIRMIZI verme"yi
sınıyor, çünkü eski regex sondaki virgülü zorunlu tutuyordu ve tek satıra
sıkıştırılmış doğru bir yapılandırmayı yanlış bir teşhisle düşürüyordu.

### KRİTİK 2 — `danger` ile `chart-negative` aynı renk oldu

165 `--odin-danger`ı `red-400`e taşıdı. `--odin-chart-negative` zaten
`red-400`dü. Aynı dosyada, **41 satır yukarıda** şu yazıyor:
*"chart.positive/negative, success/danger'dan daha YUMUŞAK. Her düşen
çizgi kriz gibi görünmesin."* O cümle sessizce öldü.

Kırılma asimetrikti — yeşil taraf duruyordu:

| çift | ΔL* önce | ΔL* sonra |
|---|---|---|
| `danger` ↔ `chart-negative` | 9.2 | **0.0** |
| `success` ↔ `chart-positive` | 9.0 | 9.0 |

`sparkline` düşen bir çizgiyi `chart-negative` ile çizerken yanındaki
rozet `text-danger` basıyor; eskiden iki farklı kırmızıydı, artık aynı
piksel. `red-300` eklendi (`success`↔`chart-positive` deseninin
simetriği), ΔL* 12.1.

### Kendi gerekçelerimin dürüstlüğü — üç düzeltme

- **Hiyerarşi iddiası fazla söylüyordu.** `gray-400`ü "ikincile
  yaklaştırır" diye reddettim; seçtiğim ton bunu **zaten yaptı**:
  secondary↔tertiary ΔL* 18.1 → **6.1**, yani beşte bir. Erişilebilirlik
  kazanıldı, hiyerarşi zayıfladı. Yorum artık bunu yazıyor. Rampayı
  yeniden türetmek `secondary`yi de değiştirmek demek ve **o token
  WCAG'ı zaten geçiyor** — yani artık bir kusur değil, bir görünüm
  tercihi ve SAHİBİN kararı.
- **`aria-disabled` "eksik olanı söylemek" değil, muafiyet açmaktı.**
  Mekanik olarak axe `isDisabled()` ataya çıkıp Toggle'ın TÜM alt
  ağacını color-contrast'tan muaf tutuyor; devre dışılık ekran okuyucuya
  butonun kendi `disabled`ıyla zaten ulaşıyordu. Muafiyet meşru
  (WCAG 1.4.3), ama muafiyet olduğu yazılmalı.
- **Zemin sayısı yanlıştı: "ALTI" değil BEŞ.** Tezi *"bir iddia
  ölçüldüğü zemin kümesi kadar doğrudur"* olan bir kararda, token
  dosyasının kendisinde zemin SAYISININ yanlış olması kozmetik değildir.

### `<aside>` düzeltmem fazla almıştı

Landmark'ı kaldırmak doğruydu (üç kart → aynı adlı üç `complementary`).
Ama düz `<div>`e indirince blokta ne rol, ne ad, ne başlık kaldı;
yorumum "aşağıdaki BAŞLIK" diyordu, aşağıdaki bir `<p>`. **Bir fazlalığı
düzeltirken bir eksiklik yarattım.** `role="group"` doğru katman:
adlandırmayı destekler, landmark değildir. (Düz `<div>`e `aria-label`
koymak kapıyı DÜŞÜRÜRDÜ — `aria-prohibited-attr`.)

### Diğerleri

`Toggle` butonundan `aria-label` kaldırıldı: saran `<label>` zaten
adlandırıyor, yanında görünür `<span>` de duruyor — üç kaynak aynı metni
veriyordu · `danger-bg` tonu `red-500` tabanlı kalmıştı, `red-400`e
taşındı (danger'ın tek kaynak tonu) · `stat.stories` sarmalayıcıyı artık
`dt`den YUKARI buluyor (`dl > div` bugün doğru elemanı buluyor ama arada
bir sarmalayıcı belirirse sessizce yanlışını ölçerdi) · `tabs.stories`
kendi dosyasının `scope` kuralını çiğniyordu.

### Düzeltilmeyen iki bulgu — gerekçesiyle

- **Aydınlık tema `-bg` token'ları eksik** ve karanlık `rgba`ları miras
  alıyor; beyaz üstünde `Badge variant="danger"` 4.23 ile AA'yı geçmiyor.
  **Bilerek düzeltilmedi:** tema `enabled: false` ve blok kendi başlığında
  "taslak" diyor. Kapalı bir temaya ölçülmemiş değer uydurmak düzeltmek
  değil tahmindir. `tokens.css`e ölçümlü uyarı kondu; temayı açan kişi
  önce onu okuyacak.
- **Tonlu zeminler (`danger-bg` vb.) üstünde üçüncül metnin payı 0.02–0.28.**
  Bugün fiilen render edilen hiçbir kombinasyon 4.5'in altında değil
  (doğrulandı) — ama `ErrorState`i bir popover'a taşımak sessizce
  kırmızıya döndürür. Kapı bunu ancak o kombinasyon GERÇEKTEN
  render edildiğinde görür; erken tahminle token değiştirmek yerine
  ölçüm kayda geçirildi.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 16 dosya / 241 test**, **storybook 54 dosya / 206 test**,
atlanan 0, düşen 0, **a11y ihlali 0**.
`verify-tests.mjs --self-check`: **11 + 9 senaryo** yeşil.
Kapı ayrıca enjekte ihlalle sınandı: token eski hâline döndürülünce tek
story dosyasında **5/5 test kırmızı**.

---

## UI-ADR-167 — Yasak liste yerine İZİN listesi; ve iyimser motorla ölçmek ölçmemektir

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-165 · 166

166 kilidi yeniden yazdı ve *"kapı sökülemez"* iddiasını **ikinci kez**
ölçmeden yazdı. Üçüncü bağımsız denetim **altı sökme yolu daha** ölçtü;
beşi tek satırlık, biri koda hiç dokunmuyor.

### Kök hata: yasak kelime listesi sonsuza kadar eksik kalır

165 `todo`yu yasakladı. 166 `disable`/`manual`/`enabled: false` ekledi.
Denetim `context: { exclude: ["#storybook-root"] }` ile geçti; onu
yasaklasan `options: { runOnly: [...] }` kalıyor; onu da yasaklasan
`config: { checks: [{ id: "color-contrast", evaluate: () => true }] }`.
**Üçü de `test: "error"` satırını yerinde bırakıp kapsamı sıfırlıyor.**

Kural artık **izin listesi**: bir `a11y` bloğunun tek meşru içeriği
`test: "error"`tür; fazladan HER anahtar kırmızıdır. Ne yaptığını bilmeye
gerek kalmaz — bilinmeyen bir gelecek anahtarı da düşer.

### Kapatılan diğer yollar

- **Yem blok.** `String.match` global değildi; dosyanın başına sağlam
  görünen bir `a11y` bloğu koymak gerçek bloğu denetimden tamamen
  kaçırıyordu. Artık tüm bloklar parantez sayılarak çıkarılıyor.
- **`main.ts` kontrolü "dosyada geçiyor mu" diyordu.**
  `const KALDIRILDI = ["@storybook/addon-a11y"]` yazıp `addons`tan
  çıkarmak kilidi yeşil bırakıyordu. Artık `addons` DİZİSİNİN içinde.
- **`STORYBOOK_COMPONENT_PATHS`.** 166 `VITEST_STORYBOOK`i sabitledi ve
  *"kapı kendi ortamını sabitler"* dedi; aynı işi yapan İKİNCİSİ açıktı —
  `globals.ghostStories`i doldurup axe'i hiç çağırtmıyor, **koda tek
  karakter dokunmadan.** Tez doğruydu, uygulaması eksikti.
- **Uzantı kümesi.** Yürüyüş `.stories.tsx` arıyordu, `main.ts` beşini
  indeksliyor. Bugün 54 dosyanın 54'ü `.tsx` — delik açık değildi, ama bir
  `kapali.stories.ts` eklemek onu sessizce açardı.

### Yanlış kırmızılar — 166 kendi teşhisini tekrar etmişti

166 *"eski regex biçim değişikliğinde yalan söylüyordu"* dedi ve yenisi de
söylüyordu: gerçek `preview.tsx`te a11y bloğunun hemen altında
`backgrounds: { disable: true }` var; blok tek satıra sıkışınca regex onu
yutuyor ve **"a11y bloğunda `disable`"** diye yanlış yeri gösteriyordu.
Kapanışta virgül yoksa "blok bulunamadı" diyordu. Tek tırnak
reddediliyordu. Kapıyı SIKILAŞTIRAN bir story bile kırmızıydı.

**Ve self-check bu sınıfı YAPISAL OLARAK göremezdi**, çünkü dokuz
senaryonun hiçbiri gerçek dosyaları okumuyordu. O satır eklendi ve
**hemen bir kaçak yakaladı**: gerçek `main.ts` anahtarı tırnaklı yazıyor
(`"addons":`), kilidin regex'i tırnaksız arıyordu — yani yeni kilit,
yürürlükteki DOĞRU yapılandırmayı düşürüyordu.

Senaryolar 9 → 17. `manual` ve `enabled: false` **hiç sınanmamıştı**
(oysa doküman ikisini de sökme yolu diye sayıyordu); dördü artık
"doğru yapılandırmayı yanlışlıkla düşürme"yi sınıyor.

### Ve bir GERİLEME: 166 anahtarı adsız bıraktı

166 `Toggle`ın `<button role="switch">`inden `aria-label`ı "çiftleme"
diye kaldırdı. Gerekçe `<button>`ın labelable olmasıydı — doğru ama
yetersiz: **erişilebilir ad hesabı MOTORA BAĞLI.** axe-core `button` için
yalnız `subtreeText` uygular (`labelText` listesinde yok) ve butonun alt
ağacında tek bir `aria-hidden` span var → **axe'in hesapladığı ad boş.**

Ve kapı bunu göremezdi: `aria-toggle-field-name`
`matches: 'no-naming-method-matches'` olduğu için `<button>`da hiç
koşmuyor, `button-name` ise `implicit-label` kontrolüyle geçiyor.
**Sıfır ihlal raporlandı, anahtar adsızdı.**

**İlk yazdığım koruma da işe yaramadı** ve bunu deneyerek gördüm:
`getByRole("switch", { name })` `dom-accessibility-api`yi kullanır, o
saran etiketi OKUR — `aria-label` kaldırılmış hâlde test YEŞİL kaldı.
*İyimser motorla ölçmek, ölçmemektir.* İddia niteliğin kendisine
bakacak şekilde yeniden yazıldı ve kırmızı olduğu kanıtlandı.

### Düzeltilmeyen — gerekçesiyle

- **Import indirection ve hesaplanmış anahtar.** Parametreyi başka bir
  dosyadan alan bir story statik metin denetiminden kaçar. Kapatılmadı:
  bu kilidin amacı **niyet göstermeden** yapılan sökmeleri durdurmak;
  import indirection niyettir. Sınır dosyaya yazıldı.
- **166'nın "tonlu zeminlerde bugün hiçbiri 4.5 altında değil" iddiası
  YANLIŞTI.** `text-content-tertiary`, `danger-bg` üstünde
  `surface-floating` zemininde **4.21**. Bugün `ErrorState` popover'a
  girmiyor, yani latent — ama iddia olduğu gibi yanlıştı.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 16 dosya / 241 test**, **storybook 54 dosya / 206 test**,
atlanan 0, düşen 0, **a11y ihlali 0**.
`--self-check`: **11 + 17 senaryo.**
Enjekte ihlal denemeleri: token geri alınınca **5/5 kırmızı** ·
`aria-label` kaldırılınca **1 kırmızı**.

---

## UI-ADR-168 — Kanarya: metin denetimi çalışma zamanını ölçmez

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-165 · 166 · 167

Metin kilidi **üç kez** yazıldı ve **üç kez** kırıldı: 4, sonra 6, sonra 6
ölçülmüş sökme yolu. Dördüncü denetimin teşhisi tek cümleydi ve doğruydu:

> **Nokta yamalar bu altı yolu kapatır ve yedincisini davet eder. Üç
> sürümdür aynı kök hata: metin denetimi çalışma zamanını ölçmüyor.**

### Son turun altı yolu — dördü kilit dosyasına hiç dokunmuyordu

1. **Satır yorumunun içine blok-yorum açma imi.** TypeScript onu satır
   yorumu sayar; kilidin yorum sökücüsü blok yorumu sanıp aradaki
   `disable: true`yu siler ve geriye tertemiz `test: "error"` kalır.
   Ölçüldü: kilit **geçti**, axe hiç çağrılmadı.
2. **`a11y: ({ test: "todo" })`** — bir çift parantez. Regex `a11y:`
   sonrası birebir `{` istiyordu; eşleşme yok → blok yok → story'lerde
   `zorunlu=false` olduğu için **hiç denetlenmiyor.**
3. **`main.ts` → `previewAnnotations`.** Parametreler DERİN birleşiyor;
   `disable: true` başka bir dosyadan gelip yapışıyor. Kilidin okuduğu
   iki dosyada hiçbir `a11y` bloğu görünmüyor.
4. **`main.ts` → `viteFinal` → `test.env.VITEST_STORYBOOK: "true"`.**
   Kapının çocuk-süreç ortamı pini vite yapılandırmasına yetişmiyor;
   ihlaller raporlanır ama hiçbir test düşmez.
5. **`afterEach`te DOM'u boşaltmak.** Addon'un `afterEach`i EN SON
   koşuyor (`.reverse()`); ondan önce çalışan bir `afterEach` gövdeyi
   temizlerse axe boş sayfayı tarar.
6. **17 senaryonun hepsi yeşilken kilidi zayıflatmak** — üç düzenleme,
   hiçbiri senaryolarla kapsanmıyordu.

### Çözüm: sonucu ölç, metni değil

`src/a11y-kanarya.stories.tsx` — bileşen sınamayan tek story. Story'nin
**gerçekten çözülmüş** yapılandırmasına bakıyor:

- `parameters.a11y.test === "error"`
- `parameters.a11y`de `test` DIŞINDA anahtar YOK — çalışma zamanı izin
  listesi; yarın icat edilecek bir daraltma anahtarı da düşer
- `globals.a11y.manual !== true` ve `globals.ghostStories === undefined`
- `import.meta.env.VITEST_STORYBOOK === "false"`

Nereden geldiği önemsiz: preview, meta, story, bir annotation dosyası,
bir vite config'i — **birleşmiş hâli buradan görünür.** 1, 2, 3, 4 ve 6
bu tek story ile kapanıyor.

**Kanıt:** yorum numarasıyla `disable: true` enjekte edildi →
**metin kilidi GEÇTİ, kanarya DÜŞTÜ.**

Kanarya `ZORUNLU.storybook`a eklendi: silinirse toplam yalnız 1 düşer,
alt sınır (190) görmez — ama kimlik kontrolü görür.

### Metin kilidi silinmedi — ikisi birlikte

Kanaryanın göremediği iki şey var ve dürüstçe yazılıyor:
**`main.ts`ten addon'un tamamen çıkarılması** (o zaman `test` yine
"error" görünür, çünkü onu preview yazıyor) ve **`afterEach`te DOM'u
boşaltan bir düzenleme.** Birincisini metin kilidi yakalar; ikincisi
**AÇIK KALIYOR** ve burada kayıtlı.

Metin kilidinin kendi üç kusuru da düzeltildi: yorum sökme SIRASI
(satır yorumları artık önce), parantezli nesne, ve `--self-check`e üç
yeni senaryo (17 → 20).

### Düzeltilmedi — gerekçesiyle

- **Modül import edilirse kapıyı koşturuyor.** Bir `DOGRUDAN` koruması
  denendi ve **yarım kaldı**: yalnız a11y bloğunu atlıyor, aşağıdaki
  `execFileSync`i atlamıyordu. **Yarım bir koruma olmayandan kötüdür** —
  atladığını sanırsın. Geri alındı; temiz çözüm saf kısmı ayrı bir
  modüle almaktır ve dosyada yazılı. Bugün için sınama yolu
  `--self-check`.
- **`aria-disabled` üretim kodunda bir axe muafiyeti** (`selection.tsx`).
  Dosyanın kendi yorumu bunu zaten itiraf ediyor (UI-ADR-166). Meşru
  (WCAG 1.4.3) ama izin listesi felsefesinin JSX'te tutmadığı bir yer.

### Ve bir küçük ironi

Bu dosyanın kendi JSDoc'una örnek diye yazdığım blok-yorum kapanış imi,
yorumu erken kapattı ve Storybook dosyayı indeksleyemedi. **İmler metnin
içinde de imdir** — kilidin üç sürümdür kandığı şeyin ta kendisi.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 16 dosya / 241 test**, **storybook 55 dosya / 207 test**,
atlanan 0, düşen 0, **a11y ihlali 0**.
`--self-check`: **11 + 20 senaryo.**

---

## UI-ADR-169 — Doğru soru "koşacak mı" değil, "KOŞTU MU"

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-165 · 166 · 167 · 168

Beş tur bağımsız denetim, dört kilit sürümü. Beşincisi kanaryayı da
kırdı — dört yoldan. Ama asıl değeri bulduğu deliklerde değil, **teşhisi
bir adım öteye taşımasındaydı:**

> Kapı hep YAPILANDIRMAYA bakıyordu — önce metne, sonra (kanaryayla)
> çözülmüş parametreye. İkisi de *"acaba koşacak mı"* sorusunu
> cevaplıyor. Doğru soru: **KOŞTU MU?**

### Cevap zaten rapordaydı ve kimse bakmamıştı

`addon-vitest` her story'nin `meta.reports`una axe'in **gerçek sonucunu**
yazıyor — motor adı ve sürümüyle:

```
{ type: "a11y", status: "passed",
  result: { testEngine: { name: "axe-core", version: "4.12.1" } } }
```

Ölçüldü: 207 assertion'ın **207'sinde** var. Kapı artık bunu doğruluyor.
Dört satır.

**Bu tek kontrol beş turda bulunan sökme yollarının neredeyse tamamını
kapatır — çünkü hiçbirini AYRI AYRI tanımıyor:**

- addon `main.ts`ten çıkarılırsa rapor hiç yazılmaz
- `disable` · `manual` · `ghostStories` · `context.exclude` ·
  `options.runOnly` → `shouldRun` düşer, `addReport` hiç çağrılmaz
- `todo` kipi `status: "warning"` yazar, `passed` değil
- parantezli · hesaplanmış · atamalı · prototipten miras yazımlar —
  metin hiç okunmuyor, konu dışı
- **UI-ADR-168'in "AÇIK KALIYOR" diye kaydettiği delik** de kapandı

**Kanıt:** `preview.tsx`e `afterEach: (ctx) => { ctx.parameters.a11y =
{ test: "off" } }` enjekte edildi — metin kilidi görmez (`a11y =`, iki
nokta yok), kanarya görmez (kendi `play`i `afterEach`ten önce biter).
Kapı: **"207 story a11y taramasının koştuğunu KANITLAMIYOR."**

### Beşinci turun kırdığı dört şey

1. **Prototip zinciri.** `combineParameters` yalnız DÜZ nesneleri derin
   birleştirir; `Object.create({ disable: true })` bütün olarak devralınır
   ve prototipini korur. Kanarya `Object.keys` ile **kendi** anahtarlarına
   bakıyordu, addon ise `?.disable` ile **zincire**.
2. **`tags: ["!test"]`.** Dosya raporda kalır ama `assertionResults` boş
   olur; `ZORUNLU` ADA baktığı için yeşil kalıyordu — kanarya komple
   silinebiliyordu.
3. **`afterEach` sırası.** Kullanıcı `preview.tsx`inin `afterEach`i
   addon'unkinden ÖNCE koşuyor (`.reverse()`), yani parametre ezilebiliyor.
4. **`vitest.config.ts` hiçbir kilidin kapsamında değildi.**
   `resolve.alias` ile `axe-core` sahte bir modüle bağlanırsa tarama
   "koşar", rapor yazılır, `passed` der ve **hiçbir şey ölçmez.**

1, 2 ve 3 çalışma zamanı kanıtıyla kapandı. 4 metinle kapatıldı — çünkü
çalışma zamanı kanıtı onu göremez, sahte axe de "passed" der.

### Yorum sökme oyunu bitirildi

Sıra iki kez oyuna geldi (blok-yorum-önce → "satır yorumu içindeki blok
açma imi"ne kandı; satır-önce → "blok yorumu içindeki `//`"ye kandı) ve
üçüncüde **kendi ayağıma sıktı**: yorumları hiç sökmeyince kanarya
dosyasının kendi belgesindeki ÖRNEK gerçek yapılandırma sanıldı ve kapı
düştü.

Çözüm sırayı değiştirmek değil, **yorumları silmek yerine aynı uzunlukta
boşlukla doldurmak.** Konumlar korunduğu için blokları boşaltılmış
metinden bulup **ham metinle karşılaştırarak** "bu bloğun içinde yorum var
mıydı" sorusunu da cevaplayabiliyoruz. Ve blok içinde yorum artık YASAK —
o bloğun tek meşru içeriği `test: "error"`, gerekçe dışarı yazılır
(`preview.tsx` buna göre düzenlendi).

### Katmanlar ve her birinin işi

| Katman | Ne yapar | Neyi göremez |
|---|---|---|
| Çalışma zamanı kanıtı | Her story kendi taramasının koştuğunu kanıtlar | axe'in kendisinin sahtelenmesi |
| Metin kilidi | Hızlı, okunur teşhis; `addons` ve `vitest.config` alias | Çalışma zamanında olan hiçbir şey |
| Kanarya story | Çözülmüş yapılandırmayı tek yerde gösterir | Kendisi dışındaki story'ler |

Üçü de duruyor. **Hiçbiri tek başına yeterli değil ve öyle olduğu
iddia edilmiyor.**

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 16 dosya / 241 test**, **storybook 55 dosya / 207 test**,
atlanan 0, düşen 0, **a11y ihlali 0**, **a11y kanıtı 207/207**.
`--self-check`: **11 + 30 senaryo.**

---

## UI-ADR-170 — "passed" ile "bir şey ölçüldü" aynı şey değil

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-169

Altıncı bağımsız denetim. UI-ADR-169 doğru soruyu sormuştu (*"koştu mu"*)
ama **yanlış sinyale** bakıyordu.

### KRİTİK — "passed" yalnızca "ihlal bulunmadı" demektir

`addon-a11y` şunu yazıyor: `status: hasViolations ? getMode() : "passed"`.
Yani **hiçbir şey taramamak da "passed"tir.** Denetim playwright + axe
4.12.1 ile ölçtü:

| girdi | sonuç |
|---|---|
| varsayılan | 2 ihlal → failed ✔ |
| `context: { include: "head" }` | **0 kural → PASSED** |
| `options: { runOnly: ["cat.parsing"] }` | **PASSED** |
| DOM boşaltılmış | **PASSED** |

Sömürü, `preview.tsx`e tek satır: `afterEach`te `parameters.a11y.context`i
daraltmak. Metin kilidi görmez (`a11y` ardından iki nokta yok), kanarya
görmez (`play` `afterEach`ten önce biter), **ve 169'un kanıtı 207/207
yeşil kalır.**

169 *"afterEach'te parametre ezme artık yakalanıyor"* diyordu: bu yalnız
**devre dışı bırakan** ezme için doğruydu (`disable`/`off` → `shouldRun`
düşer → rapor hiç yazılmaz). **Daraltan** ezme için yanlıştı.

**Düzeltme:** kanıt artık HACMİ de doğruluyor —
`passes.length + violations.length >= 1`. Sıfır kural değerlendirilmesi
kırmızıdır. Bu depodaki gerçek dağılım **2 – 35** (ölçüldü); eşik bilerek
1'de, çünkü asıl saldırı sıfırdır ve yanlış kırmızı payı geniş olmalı.

Aynı satır **sahte axe modülünü** de yakalar: boş sonuç döndürüp
"passed" der ve motor adını bile doğru yazar — ama hacmi sıfırdır.

### Kendi ölçümüm çürüktü ve denetim haklı olarak yakaladı

Denetim, ağaçtaki `.artifacts/storybook-vitest.json`da **sıfır a11y
raporu** buldu ve 169'un *"a11y kanıtı 207/207"* iddiasının ölçülmediğini
söyledi. Sebep başkaydı — **benim sökme denemem**: `afterEach` enjekte
edip koştum, `preview.tsx`i geri aldım ama **paketi yeniden koşturmadım**
ve artefaktı öyle bıraktım. İddia doğruydu (yeniden ölçüldü: 15 MB
artefakt, 207/207) ama **kanıtı kirli bıraktım**, ki bu da bir kusurdur:
bir sonraki okuyucu ağaçtaki artefakta bakar.

**Kural:** enjeksiyon testinden sonra paketi TEMİZ hâliyle bir kez daha
koştur; artefakt son geçerli ölçümü göstermeli.

### Diğer kapatılanlar

- **`alias` yasak listesi de yetersizdi.** Denetim **on biçimden yedisinin
  kaçtığını** ölçtü — Vite'ın standart DİZİ biçimi
  (`[{ find, replacement }]`), 400 karakterden uzak dolgu, addon'un
  KENDİSİNİ alias'lamak, hesaplanmış anahtar, `plugins[].resolveId`.
  Yine izin listesine çevrildi: `vitest.config.ts` ve `main.ts`te `alias`
  ya da `resolveId` GEÇMESİ tek başına kırmızı, tek istisna bugünkü meşru
  `'@' → src`. Ve kontrol artık `main.ts`e de uygulanıyor (`viteFinal`
  oradan geliyordu).
- **Dizge yutma.** Yorum boşaltıcı dizge literallerini bilmiyor: iki
  dizgenin arasına yorum imleri koyup gerçek `a11y` bloğunu GÖRÜNMEZ
  yapmak mümkündü. Ayrıştırıcıya dizge farkındalığı eklemek yerine
  **yutma girişiminin izi** aranıyor: ham metinde `a11y:` bir nesne
  başlatıyor ama boşaltılmışta hiç blok yoksa, orada bir şey kayboldu.
- **`toplam ≠ geçen`.** `numPendingTests` `result?.state`e bakıyor;
  `result` hiç oluşmamış bir test ne oraya ne `numTodoTests`e giriyor.
  17 story sessizce kaybolup alt sınırın (190) üstünde kalabilirdi ve
  hiçbir sayaç görmezdi — kapının kurulma sebebinin ta kendisi.

### Ve GÖRÜNMEZ BACKSPACE BAYTI, ikinci kez

`alias` kontrolü yazıldı, self-check kırmızı verdi, kod gözle doğru
görünüyordu. `cat -A` ile bakınca regex şuydu:
`/^Halias^H|^HresolveId^H/` — `\b` dosyaya **0x08 baytı** olarak girmişti
ve regex hiç eşleşmiyordu. Bu repoda `state-matrix` kapısında AYNI hata
olmuştu (UI-ADR-152).

**Ders:** bir regex "gözle doğru ama hiç eşleşmiyorsa" ilk bakılacak yer
görünmez bayttır — `cat -A`. Ve bu, kilidin kendi self-check'i olduğu için
yakalandı; olmasaydı sessizce ölü bir kural olarak kalırdı.

### Yanlış kırmızılar da düzeltildi

`a11y: 92` gibi meşru bir veri anahtarı yutma imzasını tetikliyordu; imza
`a11y:` sonrası bir nesne/parantez başlangıcı arayacak şekilde daraltıldı.
Ve kanarya dosyasının kendi belgesindeki ÖRNEK yine kapıyı düşürdü —
**üçüncü kez aynı ders: imler metnin içinde de imdir.** Örnek desensiz
yeniden yazıldı.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 16 dosya / 241 test**, **storybook 55 dosya / 207 test**,
atlanan 0, düşen 0, **a11y kanıtı 207/207**, `numTotal` 207 = geçen 207,
ölçülen kural **en düşük 2 / en yüksek 35**.
`--self-check`: **11 + 39 senaryo.**

---

## UI-ADR-171 — Her kural bir ÖRNEKLE değil, SINIFLA doğrulanır

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-169 · 170

Yedinci bağımsız denetim, altı yol daha. Teşhisi tek cümleydi ve yedi
turun ortak kusurunu adlandırıyor:

> **Her kural bir örnekle doğrulanıyor, sınıfla değil.**

- İzin listesi `'@'` GİRİŞİNİ doğruluyordu, "TEK giriş" olduğunu değil →
  `alias: { '@': …, 'axe-core': './sahte.ts' }` yeşil geçiyordu
  (`[^}]*` kardeş anahtarı yutuyordu). `[^:{}]*` oldu.
- Yutma imzası "blok YOK" hâlini doğruluyordu, "bir blok EKSİK" hâlini
  değil → dosyaya sağlam görünen tek bir yem blok koymak imzayı
  tamamen susturuyordu.
- Kapsam eşiği 1'di ve `runOnly: ["image-alt"]` **birebir 1** üretiyor.

### Ayrıştırıcı: regex → karakter taraması

Yutmanın kökü, yorum boşaltıcının dizgeleri bilmemesiydi. İmza eklemek
yerine **sınıf ortadan kaldırıldı**: boşaltıcı artık karakter tarıyor ve
dizge/şablon içindeki yorum imini yorum saymıyor. **Yutma OLUŞAMIYOR**,
imza satırı silindi — ve yorum içindeki ÖRNEKLERİ gerçek sanıp meşru
dosyaları düşürme kusuru da (kanaryanın belgesi iki kez kurban olmuştu)
aynı düzenlemeyle kapandı. Ayrıca `)//`, `]//`, `}//` sonrası yorumlar
artık doğru boşaltılıyor.

*Bir sınıfı ortadan kaldırmak, o sınıfı tespit etmeye çalışmaktan iyidir.*

### Asıl sinyal hacim değil, KAÇ KURAL

Ölçüldü (207 rapor): hacim (`passes + violations`) **2–35**, yani
içeriğe bağlı ve saldırgan onu seçebiliyor. Kural TOPLAMI
(`+ incomplete + inapplicable`) ise **87–88** — içerikten neredeyse
bağımsız. `runOnly`/`config.rules`/sahte axe bunu 0–1'e düşürür.
Eşik 80.

Bedava ikinci sinyal: **axe kullanılan seçenekleri rapora yazıyor.**
Temiz koşuda `toolOptions` yalnız `{ reporter }`; daraltma kendi izini
bırakıyor.

Üçüncüsü: **toplam taranan düğüm**, `context` daraltmasının tek görünür
izi. Ölçüldü 12.425 (207 story, ortalama 60); eşik story başına 20.
Mutlak değil ORANTILI — ilk hâli sabit 9000'di ve kapının kendi
self-check'i onu anında çürüttü (tek story'lik fixture 9000 düğüm
üretemez). Tek tek story'lere sınır KOYULAMAZ: gerçek minimum 2 düğüm ve
o meşru.

**Kanıt:** `afterEach` ile `runOnly: ["image-alt"]` daraltması enjekte
edildi — UI-ADR-170 bunu göremiyordu, kapı şimdi **207 story için
kırmızı**.

### Alt sınır 190 → 205

Ölçüm 207, sınır 190 → **17 story sessizce silinebiliyordu** ve hiçbir
kontrol görmüyordu. Sentetik raporla doğrulandı: 190 geçenli koşu yeşil,
189 kırmızı.

### Düzeltilen bir YANLIŞ İDDİA

169 ve 170 *"`todo` kipi `warning` yazar"* diyordu. Kaynak:
`status: hasViolations ? getMode() : "passed"` — **ihlal yoksa kip ne
olursa olsun "passed".** Yani bugün temiz olan bir story'yi `todo`ya
çevirmek raporda hiçbir iz bırakmaz; çalışma zamanı kanıtı `todo`yu
ancak zaten ihlal varken yakalar — oysa korunmak istenen şey YARINKİ
regresyondur. `todo`ya karşı tek savunma metin kilidi ve kanaryadır.
Yorum düzeltildi.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 16 dosya / 241 test**, **storybook 55 dosya / 207 test**
(alt sınır 205), atlanan 0, düşen 0, a11y kanıtı 207/207.
`--self-check`: **11 + 48 senaryo.**

---

## UI-ADR-172 — Kapı KAPANDI: kurul durma kriterini verdi, son açık kapatıldı

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-165…171

**Kurul bu oturumda İLK KEZ erişilebilir oldu** (yedi turluk denetim
bağımsız ajanlara yaptırılmak zorunda kalınmıştı, [[council-session-bound]]).
`ask_gavadolar` **2/2** cevap verdi ve üç sorunun üçünde de aynı yöne
işaret etti.

### Kurulun verdiği DURMA KRİTERİ

Yedi tur boyunca her tur yeni bir sökme yolu buldu ve soru şuydu: *bu
sonsuz bir döngü mü?* Kurul "açık uçlu sekizinci tura devam etme" dedi
ama **önce şartlı**: bilinen gerçek fail-open kapatılmalı. Kriter
(terra + luna, birleştirilmiş):

1. Çalışma zamanı kapısı fail-closed ve rapor **sahte "passed"
   üretemiyor**.
2. Keşfedilen her kaçış yolu için **regresyon testi** var.
3. Kalan yollar yalnızca kaynak değişikliği/**niyet** gerektiriyor ve
   koşum kanıtı onları görünür kılıyor.
4. Kalan riskler, kapsam ve kabul eden sahip **ADR'de yazılı**.
5. Bundan sonrası "sürekli denetim" değil, **yeni tehdit modeli** olur —
   yeni tur ancak tetikleyici bir değişiklikte yapılır.

Ve önemli bir sınıflandırma: *"Statik analiz hesaplanmış anahtar ve
dolaylı importta kaçınılmaz olarak eksik kalır; onu **güvenlik sınırı
değil savunma katmanı** kabul edin."*

### Kapatılan son açık: `todo` bir "bilinen sınır" değil, FAIL-OPEN'dı

UI-ADR-170'te bunu "niyet gerektiren bilinen sınır" diye kaydetmiştim.
Kurul buna katılmadı ve haklıydı:

> `todo` açığı gerçek bir fail-open: ihlal/çalışmama "passed" gibi
> görünüyorsa kapının kanıtı güvenilir değildir.

Sebep: addon `status: hasViolations ? getMode() : "passed"` yazıyor —
**bugün temiz olan bir story'yi `todo`ya çevirmek raporda hiçbir iz
bırakmıyor.** Koşum kanıtı (kaç kural, kaç düğüm) bunu göremez çünkü
`todo` kipinde tarama TAM koşar, yalnız fırlatmaz. Korunmak istenen şey
ise tam olarak YARINKİ regresyondur.

### Çözüm: kural metinden çalışma zamanına, tek story'den HEPSİNE

`src/lib/a11y-gate.ts` — saf fonksiyon. `preview.tsx`in `beforeEach`i
onu çağırıyor. Storybook **proje seviyesi `beforeEach`i bileşen/story
seviyesinden ÖNCE** koşar (`runtime.js` → `applyBeforeEach`), yani bir
story bunu kendi `beforeEach`iyle ATLAYAMAZ.

Ve okunan şey KAYNAK değil **BİRLEŞMİŞ SONUÇ** olduğu için, statik metin
denetiminin göremediği iki sınıf da kapandı:
**hesaplanmış anahtar** (`{ [K]: … }`) ve **başka dosyadan yayılım**.

**Kanıt (kurulun şart koştuğu türden):** `goals` story'sine
`const GIZLI = "a11" + "y"` ile `todo` enjekte edildi. Ölçüldü —
metin kilidinin regex'i o dosyada `a11y:` **bulamıyor** (kaçtı), ama
çalışma zamanı kapısı **4/4 test kırmızı** verdi:

> `A11Y KAPISI SÖKÜLMÜŞ (UI-ADR-172): a11y.test = "todo" — "todo"
> raporlar ama DÜŞÜRMEZ`

⚠️ İlk enjeksiyon denemem HATALIYDI: `meta`ya ikinci bir `parameters`
anahtarı koydum ve JS'te sonraki kazandığı için kendi enjeksiyonumu
eziyordum — test yeşil geçti ve bir an "kapı çalışmıyor" sandım.
**Bu oturumun deseni bir kez daha: testim koddan daha sık yanlış çıktı.**

Mantık TEK YERDE: kanarya story'si de artık aynı fonksiyonu çağırıyor
(kopyalamak iki kaynak yaratırdı). Fonksiyonun kendi birim testi
`a11y-gate.test.ts` — **17 senaryo, tarayıcısız.** Prototipe saklanan
`disable` dahil (bir denetim turu tam olarak onu kullanmıştı).

### Ekran durum matrisi — ölçüt prop simetrisi DEĞİL

Kurul: *"her ekrana zorunlu `demo` prop eklemeyin; her çizilen,
kullanıcıya görünür durum dalını deterministik olarak uyandırın."*

`goals` bu ölçütü karşılıyordu: **hata dalı KODDA VARDI ve hiç
uyandırılmıyordu** — çizilen ama hiç görülmemiş bir yol, olmayan yoldan
farksızdır. Demo prop'u + üç durum story'si eklendi. En keskin iddia:
`empty` hâlinde ÜÇ bölüm de "bu seviyede hedef yok" der (hiçbiri sessizce
kaybolmaz), `error` hâlinde ÜÇÜ de sebebi yazar ve boş cevap AYNI ANDA
gösterilmez.

`intelligence-feed` ve `amazon/sku` için ölçüt aynı: önce kod dalları
çıkarılacak, tetiklenmeyen görünür dal varsa story eklenecek — **sırf
matris simetrisi için değil.** Bu iş açık.

### Alt sınırlar ölçüme çekildi

`unit` 230 → **255** (ölçüm 259), `storybook` 205 → **208** (ölçüm 210).
230'luk sınır 29 testin sessizce kaybolmasına izin veriyordu — kapıyı
storybook için düzeltirken `unit` atlanmıştı.

### KALAN AÇIKLAR — sahibin kabulüne sunuluyor

Kurulun 4. maddesi gereği açıkça yazılıyor:

1. **`main.ts`ten addon'un tamamen çıkarılması.** Metin kilidi yakalar
   (`addons` dizisi kontrolü); çalışma zamanı kapısı yakalamaz.
2. **`afterEach`te DOM'u boşaltmak.** Koşum kanıtının düğüm eşiği
   (story başına 20) yakalar.
3. **`stories` glob'unun `src` dışına çıkarılması.** Kilit görmez;
   alt sınır (208) kısmen korur.
4. **axe'in kendisinin sahte bir modülle değiştirilmesi.** Metin kilidi
   `alias`/`resolveId` izin listesiyle yakalar; ayrıca kural sayısı
   eşiği (80) sahte boş sonucu düşürür.

Üçü de **kaynak değişikliği ve niyet** gerektiriyor ve hiçbiri sessiz
değil. Kurulun kriterine göre bu, durma noktasıdır.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 17 dosya / 259 test** (alt sınır 255),
**storybook 55 dosya / 210 test** (alt sınır 208),
atlanan 0, düşen 0, a11y ihlali 0, a11y kanıtı 210/210.
`--self-check`: 11 + 48 senaryo. `a11y-gate.test.ts`: 17 senaryo.

---

## UI-ADR-173 — Doğrulamak yetmez: kapıdan SONRA da ezilebiliyordu

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-172

`ask_yazilimcilar` **3/4 üye** cevap verdi (Qwen zaman aşımı). İki gerçek
kusur buldular; ikisi de doğrulandı ve kapatıldı. **Ama iki öneri de
kaynaktan ÇÜRÜDÜ — kaç cevap üzerinden karar verildiği ve hangilerinin
elendiği yazılıyor.**

### KUSUR 1 — kapı "atlanamaz"dı ama madalyonun diğer yüzü açıktı

UI-ADR-172 şunu söylüyordu: proje seviyesi `beforeEach` ÖNCE koşar, yani
bir story kapıyı atlayamaz. Doğru. Ama **aynı döngü** şunu da yapıyor
(`runtime.js` → `applyBeforeEach`, tek dizi: project → component →
story): story seviyesi `beforeEach` **SONRA** koşar ve **AYNI `context`
nesnesini** alır. Yani:

```ts
beforeEach({ parameters }) {
  parameters.a11y = { test: "error", context: "#kucuk-parca" };
}
```

Kapı yeşil geçer, axe daraltılmış koşar. **Doğrulamak yetmiyor;
kanonik değeri SABİTLEMEK gerekiyor.**

`a11yParametreleriniKilitle()` — `defineProperty` ile
`writable: false, configurable: false` + `Object.freeze`. Modüller strict
olduğu için sessizce yutulmaz, **TypeError atar**.

**Kanıt:** `goals` story'sine tam bu saldırı enjekte edildi. Ölçüldü:

> `TypeError: Cannot assign to read only property 'a11y' of object`
> — saldıran story DÜŞTÜ, diğer 4'ü geçti.

### KUSUR 2 — prototip kontrolüm YİNE bir yasak listeydi

172'de prototip zincirini `["disable","manual","context","options",
"config"].filter(k => k in a11y)` ile tarıyordum. Bu **beş bilinen adı**
arıyor — yani bu oturumun beş turdur tekrarlanan hatası, bir kez daha:
**bilinmeyen bir anahtar kaçardı.**

Doğrusu anahtar adı tanımak değil, **BİÇİMİN TAMAMINI** istemek:

- prototip `Object.prototype` ya da `null` (miras yok)
- **tek** own anahtar (`Reflect.ownKeys` — `Object.keys` Symbol görmez)
- değer bir veri özelliği, **getter değil**

Üç satır, ve hiçbirini adıyla tanımıyor. Kapattıkları:
`Object.create({ yarinIcatEdilecekAyar: 1 })` ·
`{ get test() { return "error" } }` · `{ [Symbol("gizli")]: 1 }`.
Dördü de birim testinde.

### ÇÜRÜTÜLEN İKİ ÖNERİ

Kurul yanılabilir; ikisi kaynaktan sınandı:

1. *"`parameters` birleşimi `beforeEach` çağrılmadan önce tamamlanmaz,
   manuel birleştir"* — **YANLIŞ.** UI-ADR-172'nin enjeksiyon testi
   bunun tersini kanıtlamıştı: `meta` seviyesinde hesaplanmış anahtarla
   konan `todo` `beforeEach`te GÖRÜNDÜ ve 4/4 test düştü.
2. *"`Object.keys(a11y).filter(k => k !== "test" && !a11y.hasOwnProperty(k))`
   prototip zincirini yakalar"* — **YANLIŞ ve ölçüldü.** `Object.keys`
   zaten yalnız own anahtarları döndürür, yani bu filtre **her zaman boş
   dizi** verir. Çalıştırıldı, doğrulandı.

Ayrıca *"atomik bileşenlerde 80 kural eşiği yanlış kırmızı üretir"*
iddiası bu depo için ölçümle çürük: **207 story'nin tamamında 87–88**,
ikon/rozet story'leri dahil. Kural sayısı DOM boyutundan bağımsız çünkü
axe her kuralı `inapplicable` olarak da raporluyor.

### Alınmayan öneri, gerekçesiyle

- **"Metin kilidini AST'ye çevir."** Haklı bir yön (karakter tarayıcı
  artık güvenlik-kritik kod) ama Katman 2 ve 3 aynı sınıfı zaten
  çalışma zamanında kapatıyor; metin kilidi artık **hızlı teşhis**
  katmanı. AST bir sonraki tetikleyici değişiklikte.
- **"Üç katmanı ikiye indir."** Öneriyle gelen basitleştirme
  (`content.includes('a11y: { test: "error" }')`) tam olarak DÖRT kez
  kırılmış naif metin kontrolüydü. Alınmadı.

### Kurulun kabul ettiği son sınır

> Repo yazabilen kötü niyetli biri `verify-tests.mjs`i, CI komutunu ya da
> JSON raporunu da değiştirebilir. Bu yapı **"yanlışlıkla veya kolay
> bypass ile a11y ölçümünü kapatmayı"** engeller; **kriptografik güven
> sınırı değildir.**

Bu, UI-ADR-172'nin durma kriterinin 3. maddesiyle aynı yere çıkıyor ve
kayda geçiyor. Gerçek sınır **branch protection**tır, kod değil.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 17 dosya / 267 test** (alt sınır 255),
**storybook 55 dosya / 210 test** (alt sınır 208),
atlanan 0, düşen 0, a11y ihlali 0, a11y kanıtı 210/210.
`a11y-gate.test.ts`: **25 senaryo.** Saldırı testi tarayıcıda ayrıca
koşturuldu (enjekte → kırmızı → geri alındı → yeşil).

---

## UI-ADR-174 — Kapı BEYAN EDİLENİ ister, üçünü birden değil

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-151 · 153 · 172

Kurul (`ask_gavadolar` **2/2**) ekran durum kapsamının son parçası için
ölçüt verdi: *"çizilen ve kullanıcıya görünür her durum dalını uyandır;
matris simetrisi için prop ekleme."* Üç maddede de hemfikirdiler.

### Ölçüm önce, karar sonra

- **`amazon/sku` BİTMİŞ.** Dört story'si var (Seçili · Ölçümsüz ·
  KayıtYok · SeçimYok) ve kapı zaten her story'nin anlamlı bir `expect`
  taşımasını zorluyor. Ekran hiç prop almıyor; durumları store+query'den
  geliyor. **Dokunulmadı** — devir belgesindeki "dört story vardı, hiçbiri
  iddia etmiyordu" tespiti UI-ADR-153'te zaten kapanmış.
- **`intelligence-feed` 35 satır ve YALNIZCA İKİ dal çiziyor:**
  `loading` ve veri. Hata/boş dalı orada **hiç yok** — `ActivityFeed`e
  devredilmiş ve onun kendi story dosyası var.

### İkilem ve çözümü

`loading`i uyandırmanın tek yolu `demo` prop'uydu; ama kapı `demo?:
DemoState` gören her ekrandan ÜÇ durumu istiyordu. Bu ekranda empty/error
DALI YOK — o iki story'yi yazmak **olmayan bir davranışı test ediyormuş
gibi görünen** iddialar üretirdi. Bu, kural 2'nin (karşılığı olmayan
gösterge çizilmez) test tarafındaki hâli.

Kurul (c) şıkkını seçti: **kapı, ekranın gerçekten çizdiği dalları
istesin.** Statik olarak ölçülebilir kılmanın yolu, ekranın hangi
durumları zorlayabildiğini **TİPİYLE beyan etmesi**:

```ts
demo?: DemoState    // üçü de istenir  (briefing · mission-control · amazon-director · goals)
demo?: "loading"    // yalnız o istenir (intelligence-feed)
```

Kural artık insan yargısına değil **ekranın kendi imzasına** bağlı ve
beyanı daraltmak, "bu dalı çizmiyorum" demenin makinece okunabilir hâli.

**Kanıt:** loading story'sinin `demo` zorlaması geçici kaldırıldı — kapı
*"loading durumunun story'si yok"* diyerek kırmızı verdi.

### `LoadingState` — envanter kapısının sustuğu yer

Bileşenin hiç story'si yoktu; envanter kapısı yalnız **tüketicisi
olmayan** bileşenlerden ister ve bunun tüketicisi var. Kurul: *"ortak ve
kullanıcıya görünür bir durum primitifi olarak bağımsız görsel kanıtı
eksik."* İki story yazıldı: iskeletin **çağırandan gelen adla**
duyurulması (aynı sayfada iki bölge yüklenirken ikisinin de "Yükleniyor"
demesi hangisinin beklediğini söylemez) ve `count`un **gerçekten yerleşimi
belirlemesi** (tutmazsa içerik gelince layout kayar ve spinner yerine
skeleton kullanmanın gerekçesi düşer).

### Ayrıştırıcı dördüncü kez kendi belgesine kandı

Beyan okuyucusunun ilk hâli çapasızdı ve `intelligence-feed`in JSDoc'unda
geçen *"diğer ekranlar `demo?: DemoState` alır"* cümlesini GERÇEK BEYAN
sanıp üç story istedi. **Bu oturumda dördüncü kez aynı sınıf.** Bu kez
yorumu yeniden yazmadım — ayrıştırıcıyı satır başına çapaladım
(`/^\s*demo\?:/m`); JSDoc satırları `*` ile başlar ve artık eşleşemez.
*İmler metnin içinde de imdir; çözüm ayrıştırıcıyı düzeltmektir.*

### ⚠️ PUSH EDİLMEDİ — paralel oturum

Bu commit **yalnız yereldir.** Ölçüldü: bu worktree'de İKİNCİ bir oturum
çalışıyor — HEAD benim atmadığım `83c84ac`'ye taşınmış (brifing zaman
çizelgesi) ve `briefing/screen.tsx` ile `director-card.stories.tsx`te
onların yarım işi duruyor. **O commit push'lanmamış**; push etseydim
onların işini onlar karar vermeden yayınlamış olurdum.

Bu yüzden: `git add -A` KULLANILMADI (yalnız kendi dosyalarım), tam paket
koşulmadı (onların yarım işi kırmızı verip benim hatam sanılabilirdi),
push yapılmadı. Kendi dosyalarım ayrı ayrı sınandı: state-matrix 12/12,
iki story dosyası 4/4.

**Kök neden [[odin-worktree-per-branch]]:** her dal kendi worktree'sini
alır. Bu iş sırasında düzenlemelerim iki kez sessizce silindi.

### Ölçüm

`vitest --project unit src/features/state-matrix.test.ts`: **12/12**.
`vitest --project storybook` (loading-state + intelligence-feed): **4/4**.
Kapı enjekte ihlalle sınandı: `demo` zorlaması kalkınca kırmızı.
Tam `test:ci` paralel oturum çekilince koşturulacak.

---

## UI-ADR-175 — Yazılımcılar denetimi: sayı hatam, kırılgan ayrıştırıcı, kırılgan iddia

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-173 · 174

`ask_yazilimcilar` **2/4** cevap verdi (Qwen zaman aşımı, DeepSeek 529).
Üç gerçek kusur buldular; üçü de kapandı. **Bir önerileri ise deneyle
çürüdü** — bu oturumda üçüncü kez.

### 1 — KENDİ SAYIM HATAM (en utandırıcısı)

Kapanış kaydına *"50 ayrık dosya (43'ü üretim, 3'ü ekran)"* yazmıştım.
terra: **"43 + 3 aritmetik olarak 46 eder."** Haklı — ifade okuyanı
yanlış toplama götürüyordu. Yeniden sayıldı:

| tür | adet |
|---|---|
| ekran | 3 |
| diğer üretim bileşeni | 40 |
| story | 7 |
| **toplam** | **50** |

Üretim dosyası **43'tür ve üçü ekrandır** (43 + 3 değil). Sayılar
doğruydu, **cümle yanlıştı** — ve bu repoda yanlış cümle yanlış sayı
kadar zararlıdır. Ayrıca kurulun terim uyarısı kayda geçti: *"etkilenen
dosya" ile "tüketici" aynı şey değildir* — ikisi artık ayrı satırda.

### 2 — Beyan ayrıştırıcısı üç geçerli TS yazımında yanılıyordu

UI-ADR-174'ün `beyanEdilenDurumlar`'ı kırılgandı. Ölçüldü ve düzeltildi:

| yazım | eski | yeni |
|---|---|---|
| `demo?: 'loading'` (tek tırnak) | **kaçıyordu** | ✅ |
| çok satırlı union | **kaçıyordu** (`[^;
]` satırda kesiyor) | ✅ |
| `demo?: DemoStateish` | **YANLIŞ POZİTİF** (üç story isterdi) | ✅ |
| `demo?: DemoState \| undefined` | ✅ | ✅ |

`[^;}]` (çok satır) · `DemoState` (çapa) · `['"]` (iki tırnak).
Altı vakanın altısı doğrulandı.

**Alınmayan öneri:** kurul AST (`ts.createSourceFile`) ya da açık bir
`export const supportedDemoStates` sözleşmesi önerdi. İkisi de daha
sağlam ve haklılar — ama regex'in bugün ölçülen üç kaçağı kapandı ve
AST'ye geçiş bu kapının kapsamını aşan bir yeniden yazımdır. **Sınır
yazıldı:** `demo?: Props["demo"]` ve tip takma adları hâlâ kaçar.

### 3 — CSS sınıfına bağlı iddia

`count`un yerleşimi belirlediğini `.border-line-subtle` sınıfını sayarak
kanıtlıyordum. terra: *"görsel bir refactor, davranış hiç değişmeden
testi düşürür."* Kanca açık hâle geldi (`data-slot="loading-state-line"`)
ve bir iddia eklendi: satırlar **dekoratif** (`aria-hidden`) — ekran
okuyucuya altı boş kutu okutmak, "yükleniyor" demekten kötüdür.

### 4 — ÇÜRÜTÜLEN ÖNERİ: `toHaveAccessibleName`

Kurul *"`getByText(label)` erişilebilir adı kanıtlamaz, `toHaveAccessibleName`
kullan"* dedi. **Denendi ve kırmızı verdi:** `role="status"` bir "name
from content" rolü değildir ve `SkeletonRegion` `aria-label` basmıyor —
ad **boş**.

Ve bu, bileşen için DOĞRU olan: bir canlı bölgeye ekran okuyucu ad
vermez, **içeriğini duyurur**. Aranan şey bu yüzden duyurulan metnin
kendisidir. `aria-label` eklemek bölgeye ad verirdi ama **gerçek bir
ekran okuyucuyla çift duyuru yapıp yapmayacağını burada ölçemem** —
ölçemediğim bir iyileştirmeyi paylaşılan bir primitife uygulamıyorum.
Kural 2'nin aynısı: kanıtsız iddia yazılmaz.

### Ölçüm

`tsc` 0 · `lint` 0 hata 0 uyarı ·
`state-matrix` **12/12** · `loading-state` + `intelligence-feed`
story'leri **4/4** · ayrıştırıcı altı vakada doğrulandı.

---

## UI-ADR-176 — Kuralı yazmak, uygulamak değildir: alt sınırlar ölçüme çekildi

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-171

UI-ADR-171'de şunu yazmıştım:

> *"Sınır ölçümün HEMEN altında durmalı; 17'lik pay 'dalgalanma' değil,
> **kayıp payıdır**."*

Ve sonra kendi kuralımı uygulamayı bıraktım. Ölçüldü:

| proje | ölçüm | sınır | PAY |
|---|---|---|---|
| unit | 270 | 255 | **15** |
| storybook | 213 | 208 | 5 |

`unit`teki **15 testlik pay**, eleştirdiğim 17'nin neredeyse aynısı —
yani `a11y-gate.test.ts`in 25 senaryosunun yarısından çoğu sessizce
silinebilir ve kapı yeşil kalırdı.

**Kök hata bir kere-yap alışkanlığı:** sınırı bir sprintte ölçüme çektim
ve sonraki üç ADR'de 8 test eklendiğinde geri dönüp güncellemedim. Bir
"düşüş dedektörü" ancak ölçüme yapışık kaldığı sürece dedektördür;
geride kalan sınır, koruduğunu sandığın bir boşluktur.

`unit` **255 → 267**, `storybook` **208 → 211**. Pay artık 3 ve 2:
gerçek bir refactor sırasında tek bir testin kalkmasına yer bırakır,
kayba bırakmaz.

**Kalıcı kural (dosyaya yazıldı):** *sınır her test eklemesinde
güncellenir; bunu bir kez yapıp bırakmak, kuralı yazıp uygulamamaktır.*

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 17 dosya / 270 test** (alt sınır **267**),
**storybook 56 dosya / 213 test** (alt sınır **211**),
atlanan 0, düşen 0, a11y ihlali 0, a11y kanıtı 213/213.

---

## UI-ADR-177 — Ayrıştırıcı AST'ye geçti: sınıf yamandı değil, KALDIRILDI

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-174 · 175

Kurul (`ask_yazilimcilar`) **iki kez** AST önerdi; ben iki kez "bu
kapının kapsamını aşan yeniden yazım" diye erteledim. Yanılmışım —
ve gerekçem de yanlıştı: **`typescript` zaten bir `devDependency`**,
yani AST yeni bir bağımlılık değil **kullanılmayan bir yetenekti.**

### Regex üç kez yamandı ve her yama bir ÖRNEĞİ kapattı

| tur | kaçak | yama |
|---|---|---|
| UI-ADR-174 | JSDoc'taki örnek gerçek beyan sanıldı | `^\s*` çapası |
| UI-ADR-175 | tek tırnak · çok satırlı union | `['"]` · `[^;}]` |
| UI-ADR-175 | `DemoStateish` yanlış pozitifi | `DemoState` |

Üçü de **örnek** düzeltmesiydi. Sınıf duruyordu ve kalan kaçaklar
gerçekti: dizge içindeki `demo?:`, tip takma adları, başka bir
`interface`teki `demo` alanı.

Bu oturumun kendi dersi bunu zaten söylüyordu (UI-ADR-171 · 169):
**bir sınıfı ortadan kaldırmak, o sınıfı tespit etmeye çalışmaktan
iyidir.** Ayrıştırıcıda uygulamamışım.

### AST: `PropertySignature` düğümü

Artık "bir yerde `demo?:` yazan satır" değil **gerçek bir prop
bildirimi** aranıyor. Yorum, dizge ve `@example` blokları AST'ye hiç
girmez — ayrıştırıcının bu oturumda **dört kez** kandığı sınıf
yapısal olarak kapandı. Tip referansı da AST'de **tam eşleşir**,
substring kazası olmaz.

**Dokuz vaka ölçüldü, dokuzu doğru:**

| girdi | sonuç |
|---|---|
| `demo?: DemoState` | üçü |
| `demo?: "loading"` · `demo?: 'loading'` | biri |
| `demo?: DemoState \| undefined` | üçü |
| çok satırlı union | ikisi |
| `demo?: DemoStateish` | **boş** (yanlış pozitif yok) |
| **JSDoc'ta `demo?: DemoState` örneği** | **kanmıyor** |
| **dizgede `demo?: DemoState`** | **kanmıyor** |
| `demo?: Props["demo"]` | boş — sınır, aşağıda |

### Bilinen sınır — dürüstçe

`demo?: Props["demo"]` gibi **dolaylı** tipler hâlâ çözülmez: burada
tip ÇÖZÜMLEMESİ değil sözdizimi okunuyor. Ama davranış artık
**güvenli yönde**: sessizce üç durum istemek yerine BOŞ dönüyor, yani
ekran matristen düşüyor — ve tüm ekranlar birden düşerse "kapı boşa
çalışmıyor" testi (`demoScreens.length > 0`) bunu görür.

Tam çözüm `ts.TypeChecker` ister ve o, tek dosya yerine tüm programı
kurmayı gerektirir; kapı süresini ölçülebilir biçimde uzatır. O gün
geldiğinde yükseltme yolu budur.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 17 dosya / 270 test** (alt sınır 267),
**storybook 56 dosya / 213 test** (alt sınır 211),
atlanan 0, düşen 0, a11y ihlali 0, a11y kanıtı 213/213.
Ayrıştırıcı ayrıca **dokuz vakada** tek tek doğrulandı.

---

## UI-ADR-178 — AST'nin üç kusuru: sessiz muafiyet, yanlış prop, gölgeleme

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-176 · 177

`ask_yazilimcilar` **2/4** cevap verdi (Qwen zaman aşımı, DeepSeek 529).
UI-ADR-177'nin AST ayrıştırıcısında **üç kusur** buldular; üçü de
kapatıldı ve **dokuzu kalıcı teste bağlandı**.

### KUSUR 1 — "çözülemedi" sessizce boş dönüyordu

177'de `demo?: Props["demo"]` gibi dolaylı tiplerin boş dönmesini
**"güvenli yön"** diye yazmıştım. İki üye de aynı şeyi söyledi:
**hayır, bu SESSİZ MUAFİYET.** Ekran matristen düşüyor, hiçbir story
istenmiyor ve kimse fark etmiyor — bu oturumda kapattığım her sessiz
muafiyetin aynısı, bu kez kendi elimle konmuş.

Kural artık üç dallı ve net:

| durum | sonuç |
|---|---|
| `demo` yok | ekran bu matrise tabi değil |
| `demo` var, tip çözülüyor | beyan edilen durumlar istenir |
| `demo` var, tip çözülmüyor | **KIRMIZI** — tipi basitleştir ya da kapıyı güncelle |

### KUSUR 2 — İLK `demo` prop'unu alıyordu

Dosyada bir YARDIMCI bileşenin props tipi önce gelirse yanlış tipe
bağlanıyordu. Artık yalnız **export edilen fonksiyonun ilk
parametresine** bakılıyor.

### KUSUR 3 — yerel `type DemoState = "loading"` gölgelemesi

Ada bakıyordum. Biri aynı dosyada daha DAR bir alias tanımlarsa kapı üç
story ister, ekran tek durum çizerdi. Yerel alias artık önce çözülüyor.

### VE KENDİ TESTİM BİR KUSUR DAHA GÖSTERDİ

`Props["demo"]` testini yazınca ayrıştırıcı **kırmızı vermedi** —
`P`'nin gövdesinden literalleri toplayıp **kazara doğru** cevabı
üretmişti. `P`'de ikinci bir alan olsaydı onunkini de toplar ve
**sessizce yanlış** cevap verirdi.

> **Kazara doğru bir ayrıştırıcı, yanlış bir ayrıştırıcıdır.**

`IndexedAccessTypeNode` artık açıkça reddediliyor. Bunu kurul değil,
**kuralın kendi testi** buldu — bu oturumun en pahalı dersinin
(*kuralın kendi testi kuralın kendisinden önemlidir*) bir kez daha
karşılığı.

### Dokuz kalıcı test

Ayrıştırıcı bu kapıda **dört kez** yanıldı ve üçünü yalnız bağımsız
denetim gördü. Artık her kaçak kendi testinde kilitli: `DemoState` ·
tek durum (iki tırnak biçimi) · çok satırlı union · `demo` yok ·
**yorumdaki örnek** · **yardımcı bileşen önce** · **çözülemeyen tip** ·
**yerel gölgeleme**.

### Ve UI-ADR-176'nın kuralı ilk sınavını verdi

Dokuz test eklenince ölçüm 270 → **279** oldu ve pay 12'ye çıktı — yani
176'da kapattığım kaçağın aynısı, bir tur sonra. Kural hemen uygulandı:
`unit` **267 → 276**. *Bir kere-yap alışkanlığı* tam olarak böyle
başlıyordu.

### Alınmayan öneri — gerekçesiyle

Kurul `ts.TypeChecker` + tsconfig'den tam `Program` kurmayı önerdi ve
teknik olarak haklılar: gerçek tip çözümlemesi imported alias'ı da
çözerdi. **Alınmadı** çünkü tüm programı kurmak kapı süresini ölçülebilir
biçimde uzatır ve bugünkü üç kusur sözdizimiyle kapandı. **Yükseltme
yolu yazılı**; ölçmeden geçilmeyecek.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 17 dosya / 279 test** (alt sınır **276**),
**storybook 56 dosya / 213 test** (alt sınır 211),
atlanan 0, düşen 0, a11y ihlali 0, a11y kanıtı 213/213.
Ayrıştırıcının kendi testi: **9 senaryo**, dördü enjekte kaçak.

---

## UI-ADR-179 — Kısıtlı dilbilgisi: "her şeyi anla" yerine "dar olanı tanı"

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-174 · 177 · 178

`ask_yazilimcilar` **4/4** cevap verdi (bu oturumda ilk kez tam kurul).
Teşhis tek cümleydi ve ayrıştırıcının dört turdur neden yanıldığını
açıklıyor:

> Ayrıştırıcı **her şeyi anlamaya çalışıyor** ve anlamadığında sessizce
> bir şey uyduruyordu. Doğrusu tersi: **DAR bir dilbilgisi tanı, geri
> kalan her şeye KIRMIZI de.**

### ⭐ EN AĞIR BULGU — `DemoState` yedeği KANITSIZ İDDİAYDI

Kodda şu vardı: *"referans `DemoState` adını taşıyorsa üç durum varsay."*
terra bunu işaretledi:

> *"Yerel olarak çözülemeyen veya import edilen `DemoState` için üç
> durumu **kanıtsız iddia eder**. Repo kuralına göre bunu kaldırın."*

Haklı. Bu, CLAUDE.md §2'nin (karşılığı olmayan gösterge çizilmez) test
tarafındaki ihlaliydi — ve **kapının kendisi işliyordu.** Yedek
kaldırıldı; import artık **gerçekten okunuyor** (tek hop, dosya
açılıyor, alias orada çözülüyor). Bulunamazsa **kırmızı**.

### Kısıtlı dilbilgisi

Tanınan (hepsi bu): dize literali · `A | B` · `(A)` · `A | undefined` ·
YEREL alias (özyinelemeli) · TEK HOP import edilen alias.
**Geri kalan her şey kırmızı.**

### Kapatılan dokuz kaçak — hepsi kalıcı testte

| # | kaçak | eski davranış |
|---|---|---|
| 1 | yorumdaki örnek | gerçek beyan sanılırdı |
| 2 | yardımcı bileşenin props'u | ilk bulunan alınırdı |
| 3 | `Props["demo"]` | kazara doğru / sessiz |
| 4 | **alias arkasına saklanan** dolaylı erişim | **kaçıyordu** |
| 5 | yerel `DemoState` gölgelemesi | üç durum sanılırdı |
| 6 | **arrow bileşen** (`export const X = () =>`) | **sessizce matristen düşerdi** |
| 7 | export edilen çağrılabilir yok | sessizce "yok" |
| 8 | **iç içe `demo`** (`{ x: { demo } }`) | **üst seviye sanılırdı** |
| 9 | nesne tipi (`{ state: "loading" }`) | literal kazınırdı |

Ayrıca: bilinmeyen durum adı artık **adıyla** söyleniyor · döngüsel alias
(`type A = B; type B = A`) sonsuza dönmüyor · generic kırmızı · **iki
export'ta birden `demo` belirsizdir** ve "ilkini al" sessiz bir tahmindi.

### Ayrıştırıcı kendi modülüne taşındı

`src/features/demo-beyani.ts` — kapı dosyasının içinde 150 satırlık bir
çözücü barındırmak, testin ne sınadığını gizliyordu. Artık ayrı dosya,
ayrı testler (**19 senaryo**), tek sorumluluk.

### Alınmayan öneri, gerekçesiyle

Kurul yine `ts.TypeChecker` + tsconfig'den tam `Program` önerdi. Alınmadı:
tüm programı kurmak kapı süresini ölçülebilir biçimde uzatır ve **tek hop
import çözümü bu repodaki gerçek kullanımın tamamını** kapatıyor (altı
ekranın altısı `@/features/shell/screen-state`ten alıyor). Çok hoplu
zincir bugün yok; olduğu gün kırmızı verir ve **sessiz kalmaz** — fark
budur.

### Ve UI-ADR-176'nın kuralı ikinci sınavını verdi

Ölçüm 279 → **290**. Sınır **276 → 287**.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 17 dosya / 290 test** (alt sınır **287**),
**storybook 56 dosya / 213 test** (alt sınır 211),
atlanan 0, düşen 0, a11y ihlali 0, a11y kanıtı 213/213.
Ayrıştırıcının kendi testi: **19 senaryo**, dokuzu enjekte kaçak.

---

## UI-ADR-180 — Dosya sınırını geçen çözücü bağlamı da taşımalı

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-179

Doğrulama turu: `ask_yazilimcilar` **3/4** (Qwen zaman aşımı). Üç bulgu;
üçü de gerçek, üçü de kapandı. **Bir bulguları ise deneyle çürüdü** —
bu oturumda dördüncü kez.

### 1 — BAĞLAM SIZINTISI (üç üye de aynı şeyi söyledi)

`importtanAlias` başka dosyadan bir `TypeNode` getiriyordu ama özyineleme
**ÇAĞIRAN dosyanın** alias haritasıyla devam ediyordu. Yani import edilen
tipin gövdesindeki bir referans **yanlış dosyada** aranırdı: ya sessizce
"çözülemedi" ya da — daha kötüsü — aynı adı taşıyan **başka bir tip**.

Bugün gizliydi çünkü `DemoState` düz bir literal union ve içinde başka
referans yok. **Gizli olması yok olması değildir.** Artık `Baglam`
(`dosya` + `dosyaYolu` + `yerel`) dosya sınırıyla birlikte taşınıyor.

### 2 — DÖNGÜ ANAHTARI ADA GÖREYDİ, İKİ YANLIŞ ÜRETİYORDU

- İki farklı dosyadaki aynı adlı alias "döngüsel" sanılıyordu.
- Küme hiç temizlenmediği için **aynı alias'ı bir union'ın İKİ kolunda
  kullanmak** da döngü sayılıyordu (`demo?: A | A`).

İkincisi bir **yanlış pozitif** ve testi yazıldı. Anahtar artık
`dosyaYolu:pos` ve küme yalnız **aktif zinciri** tutuyor (`finally` ile
geri alınıyor).

### 3 — TAKMA ADLI IMPORT

`import { type DemoState as D }` — yerel ad `D`, uzak ad `DemoState`.
Yerel adı uzakta arıyordum; hedef dosyada `D` diye bir alias olmadığı
için sessizce "çözülemedi" derdi. `propertyName ?? name`.

### ÇÜRÜTÜLEN BULGU — `import type { X }`

İki üye *"`import type { X }` yakalanmıyor, `ImportClause.isTypeOnly`
üzerinden ayrı ele alınmalı"* dedi. **Ölçüldü ve yanlış:** o biçim de
bir `ImportDeclaration` ve `namedBindings`i `NamedImports`; mevcut kod
zaten yakalıyordu. Testi yazıldı ve yeşil.

Buna karşılık `export type { X } from "..."` (yeniden dışa aktarım)
gerçekten yakalanmıyor — ama `ExportDeclaration` olduğu için çözücü
**kırmızı** veriyor, sessiz kalmıyor. Fark budur.

### Ayrıca

Nitelikli ad (`NS.Durum`) artık **adıyla** reddediliyor: `getText()` ile
düz metne çevirip aramak, `A.B`yi `yerel` haritasında arayıp
"çözülemedi" demek demekti — doğru sonuç, yanlış gerekçe.

### Dört yeni test

`A | A` döngü değildir · takma adlı import · `import type { }` ·
nitelikli ad. Ayrıştırıcının kendi testi **19 → 23 senaryo**.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 17 dosya / 294 test** (alt sınır **291**),
**storybook 56 dosya / 213 test** (alt sınır 211),
atlanan 0, düşen 0, a11y ihlali 0, a11y kanıtı 213/213.

---

## UI-ADR-181 — Yakınsama: kurul çelişti, ölçüm ayırdı, kapı KAPANDI

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-177 · 178 · 179 · 180

Beşinci doğrulama turu. **Kurul kendi içinde çelişti** ve karar ölçümle
verildi — bu ADR'nin asıl kaydı budur.

| üye | hüküm |
|---|---|
| terra | *"Kalan somut sessiz-muafiyet ya da yanlış-pozitif görmüyorum. **Kapatılabilir.**"* |
| Gemini | *"**GERÇEK KUSUR**: `importtanAlias` ilk import'ta bulamayınca döngüyü kırıyor; ikinci bildirimdeki tip çözülemez. Yakınsama tamamlanmadı."* |
| Qwen | *"İki sessiz muafiyet kaldı: `export type * from` ve `export { type X } from`."* |

### Ölçüm ikisini de çürüttü

**Gemini'nin iddiası — YANLIŞ.** Kod `if (!oge) continue;` ile o import
bildiriminde ad yoksa **zaten sonraki bildirime geçiyor**; erken dönüş
yalnız ad BULUNDUKTAN ve hedef dosya okunduktan sonra, alias orada yoksa
gerçekleşiyor — ki bir ad iki modülden import edilemeyeceği için doğru.
Test yazıldı: ad İKİNCİ import bildirimindeyken de bulunuyor. **Yeşil.**

Bu, bu oturumda **beşinci** çürütülen kurul iddiası. (Öncekiler:
`parameters` birleşimi · `Object.keys` + `hasOwnProperty` ·
`toHaveAccessibleName` · `import type { X }` yakalanmıyor.)

**Qwen'in iddiası — çerçeve yanlış.** O iki biçim gerçekten
çözülemiyor, ama çözücü onlara **KIRMIZI** veriyor. Bir sessiz muafiyet
sessizdir; kırmızı veren bir yol muafiyet değildir. Qwen kendi cevabında
bunu zaten yazmış (*"bu yol hâlâ kırmızı üretir"*) ve yine de "sessiz
muafiyet" diye adlandırmış. Test yazıldı: çözülemeyen uzak alias
**kırmızı**. Yeşil.

### Yakınsama kanıtı

Aynı ayrıştırıcı üzerinde **beş tur** denetim yapıldı ve bulguların
ciddiyeti tur tur düştü:

| tur | bulgu |
|---|---|
| 177 | AST'ye geçiş — sınıf değişimi |
| 178 | üç gerçek kusur |
| 179 | dokuz kaçak (biri kanıtsız iddia) |
| 180 | iki latent + bir yanlış-pozitif |
| **181** | **sıfır gerçek kusur; iki iddia ölçümle çürüdü** |

UI-ADR-172'de kurulun verdiği **durma kriteri** karşılanıyor:
çalışma zamanı kapısı sahte "passed" üretemiyor · keşfedilen her kaçağın
regresyon testi var (**25 senaryo**) · kalan yollar kaynak değişikliği ve
niyet gerektiriyor · sınırlar ve kalan riskler ADR'de yazılı.

**Karar: bu ayrıştırıcı üzerinde yeni bir adversaryal tur AÇILMIYOR.**
Bundan sonrası "sürekli denetim" değil, yeni bir tetikleyici değişiklik
olur — kurulun kendi ifadesiyle.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 17 dosya / 296 test** (alt sınır **293**),
**storybook 56 dosya / 213 test** (alt sınır 211),
atlanan 0, düşen 0, a11y ihlali 0, a11y kanıtı 213/213.
Ayrıştırıcının kendi testi: **25 senaryo.**

---

## UI-ADR-182 — Mercek diğer kapılara: elle tutulan liste ÇÜRÜMÜŞTÜ

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-154 · 176 · 181

Ekran durum kapısı yakınsadıktan sonra (UI-ADR-181) bu oturumda
geliştirilen merceği **diğer kapılara** uyguladım — daha önce hiç
yapılmamıştı. Üç kapı tarandı, **birinde gerçek bir kusur çıktı.**

### Tarama sonucu

| kapı | körlük riski | hüküm |
|---|---|---|
| `inventory.test.ts` | `orphans` boşalırsa? | **KORUNUYOR** — anlık görüntü uyuşmazlık verir |
| `odin-contract.test.ts` | dinamik liste yok | konu dışı |
| `registry.test.ts` | elle tutulan `KEYS` | ⚠️ **ÇÜRÜMÜŞ** |

`inventory` için acele bir hüküm vermedim: 7 atlama noktası var ve
körlük testi yok görünüyordu, ama `toMatchInlineSnapshot` liste boşalsa
uyuşmazlık verir. **Bulgu yok.**

### GERÇEK KUSUR — `registry.test.ts`

`KEYS` elle yazılmış bir dizi ve **sürüklenmişti.** Ölçüldü:

- `registry.ts` `loadMock` → **20** anahtar çözüyor
- test → **19**'unu sınıyordu
- eksik olan: **`briefing.directors.runtime`**

Yani o mock anahtarı `null` dönse kapı fark etmezdi ve ekran sessizce
"veri yok" derdi — dosyanın kendi başlığının *"tam olarak engellemek için
var olduğu"* hata. (Anahtarı sınadım: **çözülüyor.** Bozuk değildi, ama
**hiç test edilmiyordu** — kusur budur.)

Bu, oturumun tekrar eden dersinin üçüncü örneği: **elle tutulan bir liste
çürür.** Alt sınırlar (176) ve envanter anlık görüntüsü aynı sınıftandı;
farkı, bu listenin çürüdüğünü kimsenin ölçmemiş olmasıydı.

### Düzeltme: liste kaynaktan türetiliyor

`KEYS` artık `loadMock`'un `switch` etiketlerinden okunuyor — yeni bir
`case` eklendiği an test onu kapsar, insan disiplinine gerek kalmaz.
Ayrıca bir körlük testi kondu: türetilen liste boşalırsa `it.each([])`
hiç test üretmez ve dosya sessizce yeşil kalırdı (UI-ADR-154'ün sınıfı).

### Neden production'a dokunulmadı

`registry.ts`ten bir `MOCK_KEYS` dizisi export etmek daha temiz olurdu
ama üretim kodunu test için değiştirmek gerekirdi. Kaynaktan türetme
aynı garantiyi üretim yüzeyine dokunmadan veriyor; `case` etiketi zaten
tek gerçek kaynak.

### Ölçüm

`npm run test:ci`: `tsc` 0, `lint` 0 hata 0 uyarı,
**unit 17 dosya / 298 test** (alt sınır **295**),
**storybook 56 dosya / 213 test** (alt sınır 211),
atlanan 0, düşen 0, a11y ihlali 0, a11y kanıtı 213/213.

---

## UI-ADR-183 — Mimari denetim: tekrar, performans, ölü kod

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-136 · 138 · 176

Sahibin 12 boyutlu "Architecture Final Audit" görevinin ilk turu. Yasak
açıktı: **hiçbir özellik kaldırılmayacak, hiçbir ekranın davranışı ve
hiçbir UI tasarımı değişmeyecek.** Yalnız mimari kalite.

### Tekrar

`Pct` UI-ADR-138'de "beş satır altı yerde yazılıydı" diye çıkarılmıştı;
para için aynı iş yapılmamıştı ve tekrar **daha büyüktü** — ölçüldü,
**on yer** `value={x?.amount ?? null} format="currency" currency={x?.currency}`
üçlüsünü kelimesi kelimesine yazıyordu. Bedel hacim değil: her çağıran
`Money` zarfını ELLE söküyordu. Zarf bir gün `amount` yerine `minor`
(kuruş) taşırsa dokuzu bulunup biri unutulduğunda ekranda 100 kat sapmış
bir tutar durur. `Money` bileşeni eklendi; `RuntimeDirectorGrid` iki
ekrandan çıkarıldı.

### Performans — üçü de ölçümle

`briefing` ve `amazon/director` ekranlarının **kökünde** `useNow()` vardı
ve arkasında gerçek `setInterval(1000)` var. Kökteki tek tick **tüm ağacı
saniyede bir** render ediyordu: 48 satırlık sanal tablo, 8 KPI, direktör
kartları, 40 kayıtlık timeline. Repoda hiç `React.memo` yok (tarandı) ve
React Compiler kapalı — hiçbir çocuk korunmuyordu. Maliyetin tamamı **tek
bir zaman etiketi** içindi. `useNow` ihtiyaç duyan bileşene indi.

**Lint kanıtladı:** çıkarma sonrası kökteki `now` "hiç kullanılmıyor"
uyarısı verdi — yani bulgu tahmin değildi.

`skuColumns()` her render'da yeni 7 elemanlı dizi üretiyordu; TanStack'in
`getAllColumns` memo'su `[_getColumnDefs()]`e bağlı, kimlik değişince yedi
`createColumn` ve ~140 hücre nesnesi yeniden kuruluyordu. Modül sabitine
alındı.

### ⚠️ Kendi hatam

Toplu silme betiğim `listItemTransition`'ı da sildi ve o **üç yerde**
kullanılıyordu — `tsc` yakaladı, geri kondu. **Ölü kodu toplu silmek
yanlıştır; her biri tek tek doğrulanmalı.**

### Ölçüm

`tsc` 0 · `lint` 0/0 · unit 17 dosya / 304 test · storybook 58 dosya /
221 test · atlanan 0 · düşen 0.

---

## UI-ADR-184 — Kapsam sayı değildir: `play` kriteri ve store politikası

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-132 · 142 · 162 · 183

Meclis (gavadolar 2/2) *"22 story'nin hepsine `play` yaz"*ı **REDDETTİ**
ve kriter verdi: `play` yalnız gözlenebilir **davranış sözleşmesi** varsa
yazılır; statik varyant, token galerisi ve salt kompozisyon hariç. Gerekçe
ölçülebilir: `play` olmayan story de `addon-a11y` + `a11y-gate` ile
koşuyor, yani `play` a11y kanıtı DEĞİL etkileşim kanıtıdır.

### Button — test edilmemiş taşıyıcı kilit

    const locked = disabled || loading || offline;

Üç prop tek kilide iniyordu ve **üçü de ölçülmüyordu**; mevcut `States`
hikâyesi dördünü yan yana ÇİZİYOR ama hiçbirine dokunmuyordu. `disabled`
native'dir, kaybolsa tarayıcı korur; `loading` ve `offline` **ODIN'in
kendi icadıdır** — `locked` sadeleşirse sessizce tıklanabilir olurlar. Bu
bir karar sistemi: `offline` bir butonun ateşlediği komut ağ olmadığı için
gerçekleşemez ama kullanıcı yapıldığını sanır.

Dördüncü test **karşı kutup** (kilitsiz buton GERÇEKTEN tıklanır) — onsuz
"her şey kilitli" yazan bir hata da yeşil kalırdı.

### DecisionCard — yorumun iddia ettiği, hiçbir şeyin koşturmadığı

Hikâye yorumu zaten *"Bayat veri → ÜÇ eylem de kilitli, sebep yazılı"*
diyordu. **Yorum kapı değildir.** Kilit `disabled={stale}` ile üç ayrı
butona tek tek yazılmış; dördüncü eylemde unutmayı engelleyen şey yok.
Test kilidi butona değil KARARA bağladı.

### Store politikası — Zustand değil, bizim kararlarımız

Kural (React Query kuralının store karşılığı): **abonelik/selector/
güncelleme mekanizması yeniden test EDİLMEZ; durum geçişi, değişmez ve
kalıcılık sözleşmesi test EDİLİR.** 15 test yazıldı. İçlerinden biri
UI-ADR-162'nin **gerçek regresyonunu** kilitliyor (satır seçimi açık
kartları düşürüyordu). `universe` kasten atlandı: 26 satır, düz
delegasyon, politikası yok.

### ⚠️ Ortam bulgusu

`zustand`'ın `persist`i node'da **sessizce kendini kapatıyor** —
`middleware.js` `if (!storage) return config(...)` ile erken çıkıyor ve
`api.persist` HİÇ iliştirilmiyor. İlk üç test bu yüzden düştü; **kod
kusuru değil ORTAM kusuruydu** ve ayrımı yapmadan "persist bozuk" demek
yanlış olurdu.

### ⚠️ Kendi hatam

Bir testte `scrollTop` için `toBeUndefined()` bekledim;
`toggleExpandedItem` yeni girdiye `{scrollTop: 0}` veriyor. **Yanlış olan
kod değil benim varsayımımdı.**

### Ölçüm

`tsc` 0 · `lint` 0/0 · store 15/15 · button 8/8 · decision-card 4/4.

---

## UI-ADR-185 — Doğru sonuç, doğrulanmış sonuç değildir

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-183 · 184

### Tekrar: Decision Center geçişi

İki ekran birebir aynı sekiz satırı taşıyordu ve her ikisi de `useRouter`'ı
**yalnızca** o tek satır için import ediyordu. `DecisionCenterLink`
çıkarıldı; `useRouter` iki ekrandan da düştü.

**Semantik kusur BİLEREK korundu:** bu bir gezinme ve `<button>` ile
yapılıyor. Doğrusu `<Link href>`tir ve aynı repoda `app/not-found.tsx:39`
tam olarak öyle yazılmış — yani doğru desen ZATEN VAR, bu iki ekran ondan
sapmış. Çevirmek gözlenebilir davranışı değiştirirdi (ctrl+tık yeni sekme,
hedef durum çubuğunda, ekran okuyucu "bağlantı" der). Meclis 2/2: önce
tekrarı kaldır, semantiği aynen koru; **dönüşüm AYRI bir karardır.**

### ⚠️ NAV_ITEMS — dört ölçümün dördü de yanlıştı

| kim | hüküm | gerçek |
|---|---|---|
| ben | "gerçekten ölü" | **yanlış** — satır 237 kullanıyor, okumadan yazdım |
| terra | "saf ölü kod, silinmeli" | **yanlış** — silinse `findWorkspaceByPath` kırılırdı |
| Gemini | "SİLİNMELİ" | aynı hata |
| Qwen | "silme, şu iki dosya kullanıyor" | **sonuç doğru, gerekçe UYDURMA** — iki dosya da repoda yok (arandı, 0) |

Aynı üye ölçmediği React Profiler sayıları da verdi ("Money 12 ms").
**Bir üyenin sonucuna katılmak, gerekçesini doğrulamamak için sebep
değildir.** Doğru işlem `export`u düşürmekti, silmek değil.

### ⚠️ Ölçülüp REDDEDİLEN meclis önerisi

terra: *"`_KpiMatchesType`/`_AlertMatchesType` `export` olmamalı; derleme
iddiasıdır, dışa açmak kontrole bir şey katmaz."* İlk kısım **doğru ve
denendi**: `export` kaldırılıp `Partial<ExecutiveKPI>` yerine `string`
yazıldığında `tsc` yine patladı (TS2344).

**Ama reddedildi:** `export` düşünce iki takma ad "tanımlı ama
kullanılmıyor" uyarısı üretiyor ve bu reponun kapısı `--max-warnings 0`
ile koşuyor — `npm run test:ci` **DÜŞÜYOR**. Bir tarama gürültüsünü
susturmak için ÇALIŞAN BİR KAPIYI kırmak olurdu. Kusur `export`ta değil,
ölü-kod tarayıcımın varsayımındaydı. Gerekçe dosyaya yazıldı ki bir
sonraki denetim aynı öneriyi yeniden getirmesin.

**Kural:** meclis önerisini uygulamadan önce (a) iddiayı kaynaktan
doğrula, (b) uygula ve **kapıyı koştur** — öneri kendi başına doğru olsa
bile reponun kendi kurallarını düşürebilir.

---

## UI-ADR-186 — Boyut 9 ve 7 kapandı: silinecek ölü kod YOK, kullanılmayan 13 bileşen VAR

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-148 · 184 · 185

### 22 story tek tek sınıflandı — isimden değil koddan

Etkileşim sinyali tarandı (olay · yerel durum · kontrol · `aria-toggle` ·
kilit · odak). **17'sine `play` yazılmadı, her biri gerekçeli:** 13 statik;
`alert-stack` ve `timeline` `Pressable`e delege ediyor ve
`pressable.stories.tsx` Tab+Enter+Space'i zaten test ediyor (ikinci kez
test etmek kriterin ihlali olurdu); `input.tsx` düz native sarmalayıcı.

`card.tsx` bir ders verdi: tarayıcım "odak" sinyali verdi ama **eşleşme
YORUMUN İÇİNDEYDİ** — yorum klavyenin BİLEREK verilmediğini söylüyor.
Regex kodu okumaz; eşleşmeye bakıp geçseydim gereksiz bir test yazacaktım.

**5'ine yazıldı.** İkisi kurtuluş yolu: `ErrorState` retry (bağlanmazsa
ekran DOĞRU görünür ama basmak hiçbir şey yapmaz) ve `Section`'ın o
retry'ı **İLETMESİ** — meclisin (terra) tek itirazıydı ve haklıydı:
`ErrorState`in kendi testi `Section`ı kanıtlamaz, çünkü hangi dalın
çizileceğine karar veren `Section`dır.

### İki AYRI sözleşme, aynı görünüm

Meclis 2/2: `ai-recommendation-card` (`useDisclosureMemory`, store tabanlı,
unmount'tan sağ çıkar) ile `campaign-intelligence` (yerel `useState`,
unmount'ta ölür) **aynı görünen iki ayrı sözleşmedir.**

Farkı `unmount`/`remount` ile **ölçemedim** — bir story tek kez render
edilir. Bunun yerine **ayırt edici iz** ölçüldü: biri store'a yazıyor,
öteki hiç dokunmuyor. İkinci test farkı **kilitlemek için değil, bugün var
olduğunu belgelemek için**; sahip "birleştir" derse kırılacak ve kırılması
doğru olacak.

### Boyut 7 yeniden ölçüldü — "53 ölü export" SAYIM ARTEFAKTIYDI

Tarayıcım "sıfır dış referans = ölü" varsayıyordu; `NAV_ITEMS` bunu
çürüttü (UI-ADR-185). Düzeltilmiş sınıflandırma:

| kategori | adet |
|---|---|
| A · gerçekten ölü | **0** |
| B · dışa açık ama yalnız kendi dosyasında kullanılıyor | 49 |
| C · yalnız test/story tüketiyor | 46 |
| D · derleme-zamanı iddiası | 2 |

**Silinecek ölü kod yok.** B kategorisi "export yüzeyi geniş", ölü değil.

### ⚠️ C'den çıkan asıl bulgu: 13 tam bileşeni hiçbir ekran kullanmıyor

`Tabs` · `TabPanel` · `Tooltip` · `Drawer` · `Avatar` · `TelemetryBar` ·
`AreaChart` · `BarChart` · `FilterBar` · `RadioGroup` · `Toggle` ·
`Textarea` · `Select`.

Her biri hikâyeli, testli, a11y kanıtlı — **ve kullanıcı hiçbirini
görmüyor.** Bu bir kod kusuru değil, **ürün bulgusudur** ve reponun kendi
kuralı (CLAUDE.md 6, S8 dersi) tam olarak bunu sorar: *"kaç GERÇEK EKRAN
TÜKETİCİSİ var? Sıfırsa altyapı işidir."* Silmek özellik kaldırmak olur →
**sahibin kararı.**

### ⚠️ `transport.ts` ölçüldü

terra'nın ölçütüyle: tek import edeni bir **test**, dinamik import yok,
`app/` altında hiç geçmiyor, üretim girişinden zincir yok → meclisin kendi
ölçütüyle **ulaşılamaz üretim kodu**. Silmek yasak kapsamında; ölçüm
belgelendi, kod değiştirilmedi.

### SAHİBİN KARARINI BEKLEYEN ÜÇ MADDE

1. **`simulation-panel.tsx:39` `caseLabel` eksi işaretini düşürüyor** —
   `changePercent` −10 ekranda `%10` yazıyor (+15 → `+%15`). Ölçüldü.
   %10'luk bir bütçe **kesintisi** artıştan ayırt edilemiyor. Meclis
   BÖLÜNDÜ (terra "kusur onarımıdır", luna "görünür çıktıyı değiştirir,
   eskale et"). Test o etikete bağlanmadı ki kusur çimentolanmasın.
2. **`<button>` ile gezinme → `<Link href>` dönüşümü** (yukarıda).
3. **`amazon/director/screen.tsx` 422 kod satırı** — terra: *"bu denetim
   kapanmış sayılmamalı."* Bölmek ayrı bir UI-ADR.

### Ölçüm

`npm run test:ci`: `tsc` 0 · `lint` 0 hata 0 uyarı ·
**unit 18 dosya / 319 test** (alt sınır 316) ·
**storybook 58 dosya / 225 test** (alt sınır 222) ·
atlanan 0 · düşen 0 · **a11y ihlali 0, koşum kanıtı 225/225**.

---

## UI-ADR-187 — Kapanış denetimi: üç kusur, biri kendi mantığımla

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-161 · 182 · 184 · 186

Yazılımcılar meclisinin kapanış denetimi **üç gerçek kusur** buldu. Üçü de
kaynaktan doğrulandı ve kapatıldı. Bu turda meclis uydurmadı — geçen turun
aksine (UI-ADR-185).

### 1 · Bağlama testi — terra beni kendi argümanımla yakaladı

`alert-stack` ve `timeline` için *"`Pressable` zaten testli"* demiştim.
Ama **aynı turda** `Section`'ın `onRetry`'ı **iletmesini** test etmeyi
kabul etmiştim — gerekçe birebir aynıydı ve buraya uygulamamıştım.

Primitive'in testi şunların hiçbirini kanıtlamaz:

1. `onSelect` verilmediğinde satırın **sarılmadığı**,
2. geri çağrıya **doğru nesnenin** geçtiği — indeks ya da yanlış öğe
   geçseydi sağ bağlam paneli BAŞKA bir olayın detayını açardı ve ekranda
   her şey tutarlı göründüğü için kimse sorgulamazdı,
3. erişilebilir adın **kimlik değil başlık** olduğu (UI-ADR-161).

Üçüncüsü özellikle önemli: **axe adın VAR olduğunu görür, ANLAMLI olduğunu
göremez.** `"evt-4821, buton"` diye okunan bir satır her a11y kapısından
geçer ve ekran okuyucu kullanıcısına hiçbir şey söylemez.

`Timeline`'ın `Default` hikâyesine karşı kutup kondu: `onSelect` YOKSA
hiçbir satır tıklanabilir olmamalı. `AlertStack`'e **yeni** hikâye
eklendi — mevcut hikâyeye `onSelect` vermek onun GÖRÜNÜMÜNÜ değiştirirdi
ve bu görevin yasağı kapsamındaydı.

### 2 · `universe` atlaması savunulamazdı

UI-ADR-184'te *"26 satır, düz set delegasyonu, politikası yok"* diye
atlamıştım. Meclis 2/2 itiraz etti ve haklıydılar: `universe.ts` kendi
başlığında **neden var olduğunu** yazıyor — *"ÖNBELLEK ANAHTARININ
parçasıdır."* Politika setter'ında değil, `use-odin-query.ts:72`de:

    queryKey: [DATA_MODE, universeId, ...key]

`universeId` o diziden düşerse iki evren **aynı önbellek girdisini
paylaşır** ve A evreninin sayıları B evreninin ekranında görünür. Sayılar
makul durur, kaynağı yanlıştır — 2 numaralı kuralın en sinsi hâli; hiçbir
tip ve hiçbir a11y kapısı göremez.

⚠️ **Neden kaynak taraması:** `useOdinQuery` bir hook ve `unit` projesi
node ortamında koşuyor (jsdom kurulu değil). Anahtar üreticisini test için
dışa çıkarmak **üretim kodunu teste göre değiştirmek** olurdu ve bu repo o
yolu UI-ADR-182'de açıkça reddetti. Kaynaktan türeyen kapı burada yerleşik
bir desendir (`mocks/registry.test.ts`). Zayıf yanı yorumda yazılı.

### 3 · ⚠️ "0 döngü" iddiam YANLIŞTI — eksik grafikte ölçülmüştü

Meclis kör nokta olduğunu söyledi ve ölçtüm: **haklıydılar, ama kör nokta
ölü-kod taramasında değil KATMAN taramasındaydı.** Döngü DFS'im yalnız
`@/` yollarını çözüyordu; **göreli import'ların tamamı** ve
`mocks/registry.ts`teki **23 dinamik `await import()`** grafiğin
dışındaydı.

Tam grafik: **205 modül, 667 kenar** — ve **bir döngü**:

    mocks/registry.ts → mocks/goals.ts → lib/data/odin-state.ts → mocks/registry.ts

**Karakterizasyonu önemli — bu bir ÇALIŞMA ZAMANI döngüsü DEĞİL:**

| kenar | tür | çalışma zamanında |
|---|---|---|
| `registry → goals` | `await import()` | ertelenmiş |
| `goals → odin-state` | `import type` | **silinir** |
| `odin-state → registry` | değer import'u | var |

Bugün zararsız. **Ama** `goals.ts` bir gün `import type` yerine değer
import'u yazarsa **gerçek döngü olur.** Bulgu belgelendi, kod
değiştirilmedi: döngüyü kırmak mimari bir karardır, denetim işi değil.

Doğru ifade terra'dan alındı: *"gerçekten ölü 0"* değil, **"taranan
grafikte ölü 0"**.

### Ölçülen ve BULUNMAYAN kör noktalar

barrel/`index.ts` dosyası **yok** · `import.meta.glob` **yok** ·
`require()` **yok** · repo dışı paket tüketicisi **yok**.

`mock-badge` üretim ağacında (4 ekran) ve `lib/data/mode` okuyor — bu bir
**ihlal değil, sahte-veri kuralının uygulaması**: veri mock'sa rozeti
gösteren bileşenin modu bilmesi gerekir.

### Kapatılmayan iki bulgu — gerekçeli

- **E2E akış testi yok** (meclis 2/2 boşluk diyor). Yeni test altyapısı
  demek, denetim kapsamı dışı; ayrıca terra'nın kendi uyarısı: gerçek test
  ortamı olmadan önerilmez (sahte veri yasağı).
- **"Durum geçişi / veri yaşam döngüsü" boyutu** (cache invalidation,
  async yarışlar, route değişiminde temizlik) — 13. boyut önerisi,
  **sahibin kapsam kararı.**

### Ölçüm

`npm run test:ci`: `tsc` 0 · `lint` 0 hata 0 uyarı ·
**unit 18 dosya / 321 test** (alt sınır 318) ·
**storybook 58 dosya / 226 test** (alt sınır 223) ·
atlanan 0 · düşen 0 · **a11y ihlali 0, koşum kanıtı 226/226**.

---

## UI-ADR-188 — `amazon/director/screen.tsx` BÖLÜNMEYECEK: eşik ekrana körlemesine uygulanmaz

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-096 · 183 · 187

Denetimin tek "BÖLÜNMELİ" dosyası (422 kod satırı / 552 ham) ölçüldü ve
**bölünmemesine karar verildi.** Bu bir erteleme değil, gerekçeli bir
karardır; bir sonraki oturum aynı analizi yeniden yapmasın diye yazıldı.

### Meclis ne dedi (gavadolar 2/2)

Seçenek **(c)** — yalnız kendi kendine yeten ağır JSX blokları çıkarılsın,
kancalar/`screenState`/`<Section>` iskeleti ekranda kalsın. Ölçüt:

1. kesintisiz tek bir JSX alt ağacı,
2. kanca / `useUiStore` / `screenState` / `reloadAll` ÇAĞIRMAZ,
3. yeni state, effect ya da DOM sarmalayıcı eklemez,
4. **props bölümün veri modelini temsil eder, ekranın tüm kaynaklarını taşımaz.**

Ve ikisi de ayrıca şunu söyledi: **422 satır tek başına kusur kanıtı
değildir.** Bir ekran doğası gereği orkestratördür; 8 kaynağı çağırmak,
ortak durum kararını üretmek ve 11 bölümü sıraya dizmek onun meşru işidir.

### Ölçüm: kendi ölçütlerine göre üç adayın üçü de kalıyor

| aday | gövde | prop yüzeyi | hüküm |
|---|---|---|---|
| Inventory Intelligence | **3 satır** | — | çıkarılacak gövde YOK |
| SKU Health | ~25 satır | **6 prop** (2 setter · 2 veri · 2 durum) | ölçüt 4'ü ihlal: tutarlı bir veri modeli değil |
| PPC Intelligence Center | ~22 satır | 3 tutarlı prop | ölçütü geçer — kazanç **~22 satır** |

SKU Health'i çıkarmak, boyut 4'te (prop drilling) kapatılan kusuru boyut
1'i (dosya boyutu) kapatmak için geri açmak olurdu. Kalan tek geçerli aday
422'yi 400'e indiriyor — eşiğin altına bile inmiyor.

### Ağırlık nerede: JSX'in %41'i `<Section>` proplarında

| bölge | kod satırı |
|---|---|
| orkestrasyon (8 kanca + türetmeler + `screenState`) | 152 |
| JSX ağacı | 298 |
| ...bunun `<Section>` **açılış propları** | **123** |
| ...gövde | 175 |

İlk bakışta bu bir tekrar gibi duruyor: `onRetry={reloadAll}` on kez,
`error={error}` sekiz, `loading={loading}` yedi kez. Sayılar tutmuyordu ve
tutarsızlık sandım.

### ⚠️ Tutarsızlık YOKTU — kendi regex'imin artefaktıydı

Bölüm bölüm okundu:

- **Canlı bölümler** (`Executive KPI Strip`, `Alerts`) düz `loading={loading}`
  yazmıyor; `loading={loading || kpis.loading}` ve
  `error={sectionError(kpis.error)}` yazıyor. Yani kendi uç noktasının
  hatasını gösteriyorlar, ekran geneli hatayı değil — **S8 dersinin ta
  kendisi** (bir bölüm gerçek uç noktadan besleniyorsa, o uç düştüğünde
  ekranda beş adımlı açıklama görünmeli).
- **Sözleşmesi olmayan bölümler** (`Orders`, `Sales & Profit Analytics`)
  `{...noContract(...)}` yayıyor ve bilerek hiçbir durum propu almıyor
  (UI-ADR-096).

Düz sayım bunların hiçbirini göremiyordu. **Aklımdan geçen "üç propu tek
`{...durum}` nesnesinde topla" fikri uygulansaydı bu ayrımı EZECEKTİ** —
canlı bölüm kendi hatası yerine ekran geneli hatayı gösterirdi ve S8'de
öğrenilen ders geri alınırdı. Tekrar sanılan şey, ekranın en dikkatli
yazılmış yeriydi.

### Kanıt sorunu — bölmemenin ikinci gerekçesi

Meclis 2/2 aynı uyarıyı verdi: elimdeki kapılar (`tsc`, lint, 226 story
+ `play`, a11y 226/226) **tip, erişilebilirlik ve kapsanan etkileşimleri**
doğrular; **DOM/piksel eşdeğerliğini doğrulamaz.** Görsel baseline yok.
terra'nın hükmü: *"Görsel baseline oluşturulamıyorsa, risk nedeniyle
bölmeyi ertelemek makuldür."*

### Karar

**Bölme yapılmadı.** Gerekçe üç katmanlı:

1. Meclisin kendi ölçütü üç adaydan ikisini eliyor, üçüncüsü ~22 satır
   kazandırıyor ve eşiğin altına indirmiyor.
2. Dosyanın ağırlığı (`<Section>` propları) **tekrar değil, ayrım** —
   sadeleştirmek bilgi kaybettirir.
3. Eşdeğerlik kanıtı yok; geri alması pahalı bir değişiklik için yetersiz.

**Eşik korunuyor ama yorumu netleşiyor:** 400+ satır bir EKRAN dosyasında
otomatik kusur değildir. Bölme gerekçesi satır sayısı değil, bağımsız
render bölgelerinin ayrılmasıdır — ve burada o gerekçe ölçülüp
BULUNAMADI.

### Ölçüm

Kod değiştirilmedi; kapı UI-ADR-187'deki hâliyle duruyor:
`tsc` 0 · `lint` 0/0 · unit 18 dosya / 321 test · storybook 58 dosya /
226 test · atlanan 0 · düşen 0 · a11y ihlali 0, koşum kanıtı 226/226.

---

## UI-ADR-189 — Triyaj: kalan beş maddenin BEŞİ de sahibin kararı (meclis 2/2)

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-183…188

Denetim kapandı. Sahibin duran kuralı — *"en önemlileri bana sakla ama
normal ve az önemlileri gavadolarla hallet"* — gereği kalan maddeleri
**kendim sınıflandırmıştım ve bu bir atlamaydı**: sınıflandırmanın
kendisini meclise sormamıştım. Soruldu.

### Hüküm (gavadolar 2/2, oybirliği)

| # | madde | hüküm | gerekçe |
|---|---|---|---|
| 1 | `caseLabel` eksi işareti | **SAHİP** | düzeltme doğru olsa da ekrandaki anlamı ve davranışı değiştirir; yazılı yasağı yalnız sahip istisnalandırabilir |
| 2 | `<button>` → `<Link>` | **SAHİP** | semantiği, erişilebilirliği ve kullanıcı etkileşimini değiştirir; ayrı bugfix olarak dahi onay gerekir |
| 3 | 13 kullanılmayan bileşen | **SAHİP** | silmek açıkça özellik kaldırmadır ve ürün kapsamı kararıdır |
| 4 | E2E akış testi | **SAHİP** | yeni kapsam ve gerçek ortam gerektirir; sahte veri yasağı altında sahip karar vermeli |
| 5 | 13. boyut (veri yaşam döngüsü) | **SAHİP** | denetim kapsamını ve risk önceliğini genişletir |

**Beşte beş.** Meclisin hiçbir üyesi hiçbirini "az önemli" saymadı.

Dikkat çekici olan 1. madde: geçen turlarda iki meclis toplamında **3
"düzelt" / 2 "eskale"** çıkmıştı. Doğrudan triyaj sorulduğunda hüküm
**oybirliğiyle SAHİP**'e döndü. Fark, sorunun kendisinde: *"bu kusur mu?"*
ile *"bunu kim kapatır?"* aynı soru değildir. Birincisi teknik, ikincisi
yetki sorusudur ve meclis yetkiyi devralmayı reddetti.

### Sonuç

Denetimin **kendi kapsamında ölçülmemiş madde kalmadı.** Kalan her şey —
yukarıdaki beşi ve ayrıca `origin`'e itme / `main`'e merge — sahibin
onayına bağlıdır. İtme ve merge meclise hiç sorulmadı: dışa dönük ve geri
alması zor işlerde meclis zaten yetkili değildir.

### Ölçüm

Kod değiştirilmedi. Kapı UI-ADR-187'deki hâliyle:
`tsc` 0 · `lint` 0/0 · unit 18 dosya / 321 test · storybook 58 dosya /
226 test · atlanan 0 · düşen 0 · a11y ihlali 0, koşum kanıtı 226/226.

---

## UI-ADR-190 — 13. boyut ölçüldü: beş riskin dördü YAPI GEREĞİ kapalı

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-115 · 184 · 187 · 189

Yazılımcılar meclisi 12 boyutun **"durum geçişi ve veri yaşam döngüsü
doğruluğu"nu** ölçmediğini söyledi ve beş risk saydı. Bu tur **yalnızca
ölçüm** yapıldı — kod değiştirilmedi, kapı eklenmedi.

⚠️ Sahip bu boyutu 12'ye eklemeye karar VERMEDİ (UI-ADR-189: kapsam
kararı). Buradaki ölçüm, o kararın önüne kanıt koymak içindir.

### Meclis ölçülebilirlikte BÖLÜNDÜ

- **terra:** beş riskten yalnız 3'ün store alt-invariantı ölçülebilir;
  kalanı hook render / kontrollü gecikme / gerçek sunucu ister.
- **luna:** yeni story senaryolarıyla (gecikmeli A/B mock) çoğu ölçülebilir.

terra'nın okuması benim kısıtlarıma daha yakın: `unit` node ortamında
(jsdom yok, hook render edilemez), story tek kez render edilir
(unmount/remount yok). luna'nın yöntemi **yeni senaryo yazmayı** gerektirir
ve bu "ölçüm" değil "test inşası"dır — kapsam dışı.

Bu yüzden **statik denetim** yapıldı, ikisinin de verdiği somut desenlerle.
Reponun 1 numaralı kuralı gereği: ölçülmemiş olan, ölçülmüş gibi
yazılmadı.

### Sonuç

| # | risk | hüküm | kanıt |
|---|---|---|---|
| 1 | cache izolasyonu / invalidation | **kapalı — yapı gereği** | `queryKey: [DATA_MODE, universeId, ...key]` · manuel cache işlemi **SIFIR** |
| 2 | async yarış / stale response | **kısmen kapalı · ÖLÇÜLMEDİ** | iptal zinciri tam, async `useEffect`+`setState` deseni **sıfır** — ama gerçek yarış koşturulmadı |
| 3 | route değişiminde temizlik | **kapalı** | `app-shell.tsx:61` türetilmiş `workspace?.id`'ye bağlı |
| 4 | retry sonrası doğru state | **kapalı — politika** | `retryable` sözleşme hatasını dışlıyor · `screenState` gerçek hata TAŞIMIYOR |
| 5 | evren sızıntısı | **kapalı** (yetki boyutu **N/A**) | `placeholderData`/`keepPreviousData`/`initialData` **sıfır** |

### Neden bir bug SINIFI hiç oluşamıyor

İki sayı, iki tam sıfır:

    invalidateQueries · setQueryData · removeQueries · getQueryData  → 0
    placeholderData · keepPreviousData · initialData                → 0

Birincisi: **elle cache'e dokunan hiçbir yer yok.** Meclisin en çok
uyardığı kusur — "invalidate anahtarı üretim anahtarıyla uyuşmuyor" —
oluşabilmesi için elle bir invalidate çağrısı gerekir; hiç yok. Her şey
anahtar-güdümlü: evren değişince `queryKey` değişir, yeni sorgu kurulur,
eskisi `gcTime` ile düşer. Doğruluk bir disipline değil, **yapıya** bağlı.

İkincisi: eski verinin yeni bağlamda görünmesinin en sık yolu bu üç
seçenektir. Hiçbiri kullanılmıyor.

### Üç ayrı yerde beklediğimden iyi çıktı

**Route temizliği (risk 3).** terra'nın endişesi *"`resetContextPanelOnNavigate`
tüm `push`/`replace`/`pop` yollarında çağrılıyor mu?"* idi. Cevap: hiçbir
router olayına bağlı DEĞİL —

    useEffect(() => { resetContextPanel(); }, [workspace?.id, resetContextPanel]);

Türetilmiş workspace kimliğine bağlı, yani navigasyonun NASIL yapıldığı
fark etmiyor: `push`, `replace`, tarayıcı geri/ileri, hatta doğrudan URL.
Router olayına bağlamaktan **daha güçlü**, çünkü unutulacak bir yol yok.

**Retry (risk 4).** terra *"`screenState` eski hatayı yeni veriye tercih
edebilir"* dedi. Ölçüldü: `screenState.error` **gerçek hata taşımıyor** —

    error: demo === "error" ? error : null

Yalnızca Storybook demo zorlaması. Gerçek hatalar bölüm bazında
`sectionError(live.error)` ile geliyor (S8 dersi, UI-ADR-115). Yani
"ekran geneli bayat hata" diye bir şey mimaride yok.

**İptal zinciri (risk 2).** `client.ts:96` `AbortSignal.any([signal,
timeout])` ile çağıranın sinyalini zaman aşımıyla birleştiriyor ve
`errors.ts:121` iptali `signal.reason` KİMLİĞİYLE ayırt ediyor — ada göre
değil. İptal, hata olarak `screenState`e sızmıyor.

### Kapatılmayan tek şey — dürüst kayıt

**Risk 2 ÖLÇÜLMEDİ.** Desenler temiz ve iptal zinciri tam, ama *"B önce
döndü, sonra A geldi, ekran A'ya geri dönmedi"* iddiası **koşturulmadı**.
Bunu ölçmek gecikmeli A/B mock'lu yeni bir story senaryosu ister. Statik
kanıt "risk düşük" der, "risk yok" DEMEZ — ve aradaki fark bu reponun
1 numaralı kuralıdır.

### Yetki boyutu: bugün N/A, yarın kapı

`queryKey`de kimlik/kullanıcı/tenant boyutu yok. Ölçüldü: **sistemde
kimlik ya da yetki katmanı hiç yok** (tarandı; bütün `role=` eşleşmeleri
ARIA rolü). Localhost'ta tek kullanıcı çalışıyor.

⚠️ **Ama bu bir muafiyet değil, bir bağımlılıktır:** kimlik eklendiği gün
`queryKey` bir kimlik boyutu kazanmak ZORUNDA, yoksa bir kullanıcının
verisi diğerinin ekranında görünür. Bugün doğru olan şey, yarın sessizce
yanlış olur. Not `13-backend-recommendations.md`ye değil buraya düşüldü
çünkü bu bir ARAYÜZ sözleşmesidir.

### Hüküm: boyut ayrı mı, 8/10'un içinde mi

Meclis 2/2 "ayrı olmalı" dedi ve ölçüm onları **kısmen** doğruluyor: bu
turda bulunan hiçbir şey boyut 8 (performans) ya da 10 (test kapsamı)
merceğinden görünmezdi — ikisi de "manuel cache işlemi sıfır" ya da
"`screenState` gerçek hata taşımıyor" demez.

**Ama bulunan şey kusur değil, sağlamlık.** Bu boyutun kalıcı bir kapıya
dönüşmesi için önce risk 2'nin ölçülebilir hâle gelmesi gerekir; ölçülemeyen
bir kapı, açık olduğunu ayarından çıkaran bir kapıdır. **Sahibin kapsam
kararına kanıt olarak sunulur; kapı eklenmedi.**

### Ölçüm

Kod değiştirilmedi. Kapı UI-ADR-187'deki hâliyle:
`tsc` 0 · `lint` 0/0 · unit 18 dosya / 321 test · storybook 58 dosya /
226 test · atlanan 0 · düşen 0 · a11y ihlali 0, koşum kanıtı 226/226.

---

## UI-ADR-191 — İki blocker kapandı; ve "eksik özellik mi, kusur mu" ayrımı kanıtlandı

**Durum:** DONDURULDU
**Tarih:** 1 Ağustos 2026
**İlgili:** UI-ADR-133 · 184 · 189 · 190 · ODIN ADR-0142 · ER-0025

Sahip Release Readiness raporunu okudu, dört blocker'ı **önem sırasına
ayırdı** ve raporun en zayıf noktasını buldu.

### Sahibin itirazı — ve haklıydı

> *"Rapor şu an sadece 'göndermiyor' demiş. Ama 'göndermesi gerekiyordu'
> kanıtını göstermemiş. Bu küçük ama önemli fark."*

İki senaryo ayırt edilmemişti:

- **A** — UI hazır, backend yazılmadı → **eksik özellik**, kusur değil.
- **B** — backend hazır, UI göndermiyor → **kritik bug**.

ODIN çekirdeği okundu. **Senaryo B doğrulandı**, üç bağımsız kanıtla:

1. `odin/__main__.py:98` — CLI fiili var:
   `python -m odin ceo verdict <rec_id> <approved|rejected|deferred> [neden]`
2. `odin/cockpit.py` `ALLOWED_COMMANDS` — `"ceo"` beyaz listede ve gerekçe
   yorumda yazılı: *"the UI submits owner verdicts through THIS whitelist …
   the refusal text travels back verbatim **so the UI can show WHY**"*
3. `request-registry.md` ER-0025 — **"implemented v1 (ADR-0142)"**,
   `tests/test_cockpit.py` **7 yeşil**, ve satır arayüzün iki hata biçimini
   nasıl ayırt edeceğini tarif ediyor.

Yani backend, **arayüzün çağıracağı sözleşmesiyle** tasarlandı, uygulandı,
test edildi ve *tamamlandı* diye kapatıldı. Arayüz o çağrıyı hiç yapmadı;
kodundaki not hâlâ *"S7'de bağlanacak"* diyor ve **S7 çoktan geçti**.

**Bu bir bekleyen özellik değil, kopmuş bir el sıkışmadır.** İki taraf da
kendi tarafını bitmiş sayıyor; arada kimsenin sahiplenmediği bir boşluk
var. ER-0025'in "implemented" damgası bugün **yanıltıcıdır** — komut
çalışıyor ama onu çağıran yok.

**Ders:** iki repolu bir sistemde "tamamlandı" tek taraflı verilemez. Bir
sözleşmenin iki ucu vardır ve yalnız biri kapandığında kayıt "bitti" der,
sistem "bitmedi" der. Bunu ne backend'in 7 yeşil testi ne arayüzün 226
testi yakalayabilirdi: **ikisi de kendi tarafında haklıydı.**

### B2 — eksi işareti düşüyordu (kapandı)

    // önce
    return `${p > 0 ? "+" : ""}%${Math.abs(p)}`;      // −10 → "%10"
    // sonra
    return `${p > 0 ? "+" : p < 0 ? "−" : ""}%${Math.abs(p)}`;

`Math.abs` işareti siliyor, artı için geri konuyor, eksi için
konmuyordu — %10'luk bütçe **kesintisi** artıştan ayırt edilemiyordu.

Dikkat çekici olan: **fonksiyonun kendi JSDoc'u zaten `"-%10"` yazıyordu.**
Sözleşme beyan edilmiş, kod tutmuyordu ve hiçbir şey ölçmüyordu — bu
denetimin baştan sona tekrar eden deseni.

Sözleşme testi kondu; UI-ADR-184'te kusuru **çimentolamamak için** bilerek
etikete bağlanmamıştı, şimdi bağlandı.

### B3 — kök hata sınırı (kapandı)

`src/app/global-error.tsx` eklendi. `(shell)/error.tsx` bir route segment
sınırıdır ve `layout.tsx`'in KENDİSİ patlarsa devreye giremez; o durumda
kullanıcı boş beyaz sayfa görüyordu.

**⚠️ Bu dosyayı yazarken kapı beni İKİ KEZ düzeltti:**

1. *"Kök çöktüyse `globals.css` yüklendiğine güvenilemez"* diyerek inline
   stil yazdım; token kapısı **dokuz satırda birden** durdurdu. Varsayımı
   gözden geçirdim: stil yoksa sayfa **stilsiz ama OKUNUR** kalır. Kuralı
   çiğnemeye gerekçe yoktu. **Bir kapıyı susturmak için bulunan gerekçe,
   gerekçe değildir.**
2. `bg-surface-base` yazdım — **öyle bir token yok.** Kullanımdan türeterek
   yakalandı: repoda tek geçtiği yer benim satırımdı. Tailwind onu sessizce
   yok sayar ve hata sayfası **zeminsiz** kalırdı; hiçbir test bunu
   göremezdi. Kabuğun kullandığı `bg-bg` ile değiştirildi.

Ayrıca `<a>` yerine `<Link>` kullanıldı: repo **`noInlineConfig`** ile
koşuyor, yani hiçbir kural satır içi susturulamıyor. Gerekçemi ("kök
çöktüyse istemci gezinmesi de çökmüş olabilir") yeniden tarttım ve
**spekülatifti** — `global-error` taze bir React kökü kurar ve router'ın da
çöktüğüne dair kanıtım yoktu.

⚠️ Bu dosyanın **story'si yok**, yani a11y kapısından geçmiyor: kök çökme
Storybook'ta üretilemiyor. Bilerek kayda geçirildi.

### ⚠️ Testim yine benden önce yanılmadı

Sözleşme testini `getByText("−%10")` ile yazdım ve **"multiple elements"**
ile düştü: etiket artık **iki yerde** görünüyor (radyo düğmesi ve gövde).
Düşme, düzeltmenin ikisinde de çalıştığının kanıtıydı. Bu oturumda
sekizinci kez yanlış olan kod değil **benim testimdi**.

### Ölçüm

`npm run test:ci`: `tsc` 0 · `lint` 0 hata 0 uyarı ·
**unit 18 dosya / 321 test** · **storybook 58 dosya / 226 test** ·
atlanan 0 · düşen 0 · **a11y ihlali 0, koşum kanıtı 226/226**.

### Kalan iki blocker

- **B1** — Human Sign-off. Sözleşme ER-0025'te yazılı, backend hazır.
- **B4** — yetkilendirme. **Dağıtım modeli beyanı sahibindir**: tek
  kullanıcılı localhost aracı ise N/A, çok kullanıcılı ise blocker.

---

## UI-ADR-192 — ER-0025 kapandı: kopmuş el sıkışma tamamlandı

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** ODIN ADR-0142 · ADR-0131 · ADR-0086 · ADR-0005 · ER-0025 · UI-ADR-190 · 191

Denetimin en ağır blocker'ı (B1) kapandı. **Backend'de tek satır
değişmedi**; arayüz ODIN'in var olan sözleşmesine uyduruldu.

### Sözleşme — okundu, uydurulmadı

`odin/cockpit.py: run_command` **üç yanıt biçimi** döndürüyor ve **üçü de
HTTP 200**. Ayırt edici sinyal HTTP kodu değil, **`exit` anahtarının
varlığı**:

| durum | gövde | kayıt |
|---|---|---|
| komut KOŞTU | `{ok: exit===0, exit, output}` | `exit===0` → yazıldı · `exit!==0` → **yazılmadı** |
| beyaz liste reddi | `{ok:false, error}` — `exit` **YOK** | kesinlikle yazılmadı |
| sunucu zaman aşımı | `{ok:false, error:"timeout (300s)"}` — `exit` **YOK** | **BELİRSİZ** |

Backend testi bunu zaten çivilemiş (`tests/test_cockpit.py`):

    self.assertIn("exit", result)           # the verb DID run
    self.assertNotEqual(result["exit"], 0)  # the verdict was REFUSED
    self.assertIn("REDDED", result["output"])

### Eklenen üç dosya

| dosya | sorumluluk |
|---|---|
| `lib/data/command.ts` | `POST /api/command`; üç biçimi `CommandOutcome`'a ayırır |
| `lib/data/use-verdict.ts` | `useMutation` · `verdictArgv` · retry/optimistic politikası |
| `components/executive/verdict-status.tsx` | altı sonucun ekran karşılığı |

### İki politika kararı — ikisi de gerekçeli

**`retry: false`.** Okuma yolundaki `retryable` politikası burada geçerli
DEĞİL: bu bir yazma ve `ceo verdict` idempotent olduğunu **beyan
etmiyor**. Ağ hatasında istek sunucuya ulaşmış ve kayıt yazılmış olabilir;
sessizce tekrar denemek aynı kararı iki kez kaydeder. Karar defteri
**silinmeyen** bir defterdir (ODIN ADR-0005) — ikinci kayıt geri alınamaz.
Tekrar denemeyi **insan** seçer.

**Optimistic update YOK.** İyimser güncelleme "kaydedildi" der ve sonra
geri alır; burada geri alınacak şey sahibin **kararıdır**. ODIN reddedebilir
(tarihsiz erteleme, eksik gerekçe) ve o red bir hata değil **geçerli bir
cevaptır**. Ekranda bir an "onaylandı" görünüp kaybolması, reponun 2
numaralı kuralının (sahte gösterge) tam ihlalidir. Karar ancak ODIN
yazdığını söyledikten SONRA verilmiş görünür.

### Altı sonuç neden ayrı gösteriliyor

Ayrım kozmetik değil: sahibin bir sonraki hamlesi her birinde farklıdır.

| sonuç | sahibin hamlesi |
|---|---|
| gönderiliyor | bekle, tekrar basma |
| kaydedildi | iş bitti |
| **ODIN reddetti** | gerekçeyi düzelt (kayıt YOK) |
| komut reddedildi | arayüz hatası, yapacağı yok (kayıt YOK) |
| **zaman aşımı** | ⚠️ **tekrar gönderme** — önce listeyi tazele (kayıt BELİRSİZ) |
| taşıma hatası | yeniden dene (istek ulaşmamış olabilir) |

**En kritik ayrım zaman aşımıdır.** Diğer beşinde "kaydedildi mi?"
sorusunun cevabı kesin; orada değil. Sunucu 300 sn çalıştırabiliyor,
istemci 30 sn'de vazgeçiyor. Bunu "hata" diye göstermek sahibi tekrar
göndermeye iter ve çift kayıt üretir.

**Red metni DEĞİŞTİRİLMEDEN gösterilir** — ER-0025 bunu şart koşuyor.
Gerekçe somut: kuralı ODIN uyguluyor (ADR-0131); arayüz metni yeniden
ifade ederse kural değiştiğinde arayüz **eskisini söylemeye devam eder**.

### İki ince tuzak

**`--revisit` atlanamaz.** `lifecycle.verdict` tarihsiz bir ertelemeyi
reddeder. Bayrak gönderilmezse **her erteleme** sunucuda reddedilirdi ve
arayüz "ODIN reddediyor" diye görünürdü — hata arayüzde olurdu.

**Boş gerekçe hiç eklenmez, boş string olarak değil.** `args[0] if args
else None` boş stringi "verilmiş gerekçe" sayar ve ODIN'in gerekçe kapısı
sessizce atlanmış olurdu.

### ⚠️ Neredeyse denetimin kendi uyardığı hatayı işliyordum

`onSuccess` içine `invalidateQueries({ queryKey: ["odin"] })` yazmıştım.
Gerçek anahtar `[DATA_MODE, universeId, "odin", …]` (`use-odin-query.ts:72`)
— yani `"odin"` bir **önek değil, üçüncü parça**. Çağrı hiçbir şeyle
eşleşmez, sessizce hiçbir şey tazelenmez, ekran bayat kalır ve hata
**görünmez**.

Bu, UI-ADR-190'da *"meclisin en çok uyardığı kusur"* diye kaydettiğim
sınıfın ta kendisi — ve repodaki **ilk elle cache işlemini** eklerken
neredeyse ben işliyordum. Anahtarsız çağrıya çevrildi: kapsam biraz geniş
ama **yanlış olamaz**.

Bir denetimin bulgusunu yazmak, o bulguya karşı bağışıklık kazandırmıyor.

### Linter yine öksüzü yakaladı

`verdicts` / `setVerdicts` oturum-içi haritası artık kullanılmıyordu;
`--max-warnings 0` kapısı ikisini de, sonra öksüz kalan `useState`
import'unu da gösterdi. Kararın tek kaydı artık ODIN'de — ekranda ikinci
bir "işaretlendi" listesi tutmak iki gerçek kaynağı olurdu.

### Ölçüm

`npm run test:ci`: `tsc` 0 · `lint` 0 hata 0 uyarı ·
**unit 19 dosya / 338 test** (alt sınır 335) ·
**storybook 59 dosya / 233 test** (alt sınır 230) ·
atlanan 0 · düşen 0 · **a11y ihlali 0, koşum kanıtı 233/233**.

Bu turda eklenen: **24 test** (17 unit sözleşme + 7 story etkileşim).

### B4 — ölçüldü, N/A

Dağıtım modeli **varsayılmadı**: `cockpit.py:719` bağlamayı `127.0.0.1`e
**sabitliyor** (yapılandırılabilir değil), modül başlığı *"bound strictly
to 127.0.0.1"* diyor, `cockpit.py:9` *"the console IS the owner's CLI"*
diyor ve arayüz `CLAUDE.md:166` *"bilinçli olarak sadece localhost … dışarı
açma, kapsam dışı"* diyor. **Tek kullanıcı · localhost · owner-only.**

⚠️ Bu bir muafiyet değil bağımlılıktır: sunucu dışarı açıldığı gün
`queryKey` bir kimlik boyutu kazanmak **zorundadır**.

### Sonuç

**Dört blocker'ın dördü de kapandı. Release Decision: READY** — kapsamı
localhost/tek-kullanıcı dağıtımıyla sınırlı olmak üzere
(`21-release-readiness.md` §9).

⚠️ Tek tavsiye: sözleşmenin iki ucu da test edildi (backend 7 yeşil,
arayüz 24 yeşil) ama **uçtan uca birlikte hiç koşmadılar**. Üretimde
kullanmadan önce bir gerçek gönderim elle denenmeli — bu raporun bulduğu
en pahalı hatanın sınıfı tam olarak buydu.

---

## UI-ADR-193 — Alt bar Timeline canlıya bağlandı: yeni uç değil, mevcut pencere

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-111 · UI-ADR-174 · 03-information-architecture.md §16

`ExecutiveTimeline` (workspace altındaki şerit) `events: never[]` ile
boştu — arayüzde `/api/events`in 0 tüketicisi vardı. Meclis (gavadolar
2/2) ve ölçüm aynı yere çıktı: **yeni `/api/events` tüketicisi AÇILMADI**,
şerit intelligence-feed'in zaten kullandığı `/api/state.timeline`
penceresine bağlandı (`useOdinTimeline` — adaptör, şema ve politika
hazırdı; ilk kez bir ekran tüketicisi oldu).

- **Neden A değil B değil:** `/api/events?since=N` artımlı uç hazır ama
  ilk tüketicisini 40px'lik bir şerit için açmak yeni transport + şema +
  hata yüzeyi demekti; `/api/state` zaten her ekranda çekiliyor ve
  request coalescing ile marjinal maliyet ~0. Artımlı akış gerektiren ilk
  gerçek ihtiyaçta (ör. kesintisiz canlı akış ekranı) `/api/events`e
  geçilir — yükseltme yolu budur.
- **Sunum hükmü yok (UI-ADR-111):** şerit pencerenin SON 5 olayını API
  sırasında basar; ton/öncelik/"yönetici olayı" seçkisi ODIN'de
  yayınlanmıyor, arayüzde üretilmiyor. Olay adı kaydın gerçek adıdır.
- **Adaptör dışa alındı:** `useOdinTimeline` içindeki satır içi eşleme
  `adaptTimeline` olarak dışa çıkarıldı (`adaptGoals` deseninde) ve canlı
  cockpit'ten alınan `api-state-timeline.json` fixture'ına karşı test
  edildi (`odin-timeline.test.ts`, 4 test).
- **Intelligence-feed NO-OP:** gece emri "intelligence-feed'i
  /api/events'e bağla" diyordu; ölçüm feed'in ZATEN canlı olduğunu
  gösterdi (`useOdinFeed` → `/api/state.timeline`, UI-ADR-174). Çalışan
  entegrasyonu eşdeğer bir uca taşımak risk alıp değer katmazdı —
  no-op, kanıtıyla burada kayıtlı.

---

## UI-ADR-194 — Karar kuyruğu kartlarına verdict eylemi: form Decision'dan koparıldı

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-192 · UI-ADR-156 · UI-ADR-092 · ODIN ADR-0131 · ADR-0017 · ADR-0005

UI-ADR-192 boruyu döşedi (`useVerdictMutation` + `VerdictStatus`) ama tek
tüketici briefing'deki `DecisionCard` idi ve o `/api/state.decisions`tan
beslenir — bugün BOŞ. Yani sahibin kararını yazabildiği hiçbir canlı yüzey
yoktu; karar CLI'dan veriliyordu. `/decisions` (Decision Center) kuyruğu
kendi kartlarıyla çiziyor (`DecisionQueueItem`) ve `VerdictForm`
`decision: Decision` istiyordu — tip uyuşmazlığı yüzeyi kilitliyordu.

Kararlar (gavadolar 2/2 şartlı onay, dördü de uygulandı):

1. **Prop daraltıldı:** `VerdictForm` artık `recClass?: OdinRecClass`
   alır — formun TEK veri bağımlılığı zaten buydu. `Decision` istemek,
   farklı tipte beslenen meşru bir tüketiciyi dışarıda bırakıyordu.
2. **`toRecClass` fail-closed:** ODIN'in serbest `klass` alanından yalnız
   A/B/C geçer; `null`/bilinmeyen `undefined` olur ve gerekçe ZORUNLU
   kalır (UI-ADR-156). Sessizce sınıfa dönüştürme yok.
3. **Eylem alanı yalnız karara bağlanmamış kartta** (`decided=false` ve
   `verdict=null`). `decided=true` ama verdict'siz eski kayıt yeniden
   karar VERİLEMEZ yapılmadı — "ayrıntı yayınlanmadı" diye işaretlenir;
   ikinci kayıt geri alınamaz (ODIN ADR-0005 no-delete).
4. **Tek mutation, çift emir koruması:** `isPending` tüm kartların
   düğmelerini kilitler; sonuç yalnız `variables.decisionId` eşleşen
   kartta gösterilir. Bayat veri kilidi decision-card'daki UI-ADR-092
   kuralının aynısı.

---

## UI-ADR-195 — Finance ekranı: core'a dokunmadan, defter pozisyonu ham aktarımla

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-111 · UI-ADR-116 · UI-ADR-128 · ODIN ADR-0094 · gavadolar 2/2

Gece emri "cockpit'e finance projeksiyonu ekle" diyordu; ölçüm çürüttü:
`finance_position` ZATEN yayınlanıyor (`finance/director.py
current_position()` — nakit+provenance, aylık akış, operating/cash-flow
net ayrımı, runway+hedefler, zorunlu rezerv, `source_not_connected`).
Core'a SIFIR satır dokunuldu; `/finance` yalnız tüketir.

Kilitlenen sınırlar (gavadolar 2/2):

1. **Para birimi izolasyonu:** ekrandaki her tutar ODIN'in bildirdiği
   birimde (bugün TRY). USD gelir/marj bu ekranda ÇİZİLMEZ — briefing
   KPI'larında kendi birimleriyle yaşıyorlar. UI kur çevirmez; nakit
   provenance'ı (USD × kur = TRY, sahip beyanı, tarih) olduğu gibi
   gösterilir.
2. **`operating_net` ≠ `cash_flow_net` ayrımı ekranda korunur** ve
   ikisine de "net kâr" denmez (UI-ADR-116'nın kuralı) — notlar "borç
   servisi ÖNCESİ/SONRASI" der.
3. **Runway nötr:** runway ile sahip hedefi ham yan yana; renk/eşik/hüküm
   yok (UI-ADR-111). ODIN bir gün `runway_status` yayınlarsa o render
   edilir — yükseltme yolu budur.
4. **`source_not_connected` ölçümün kendisidir:** 7 bağlı olmayan kaynak
   adıyla listelenir (role="note"); onlardan türeyecek hiçbir alan
   çizilmez.
5. **`empty` demo durumu beyan edilmiyor:** pozisyon tek nesne; cockpit
   "defter boş"u `null` yayınlar ve cockpit boş/okunamadı ayrımı
   yapamadığı için dal sebepli HATA olarak çizilir.

---

## UI-ADR-196 — Amazon Inventory sayfası: aynı boru, envanter odaklı geniş görünüm

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-128 · UI-ADR-183 · ODIN ADR-0149 · 03-information-architecture.md §7

`/amazon/inventory` nav'da vardı, ekranı yoktu. Yeni boru AÇILMADI:
Director'ın kanonik `useAmazonSkus` kancası tüketildi (48 gerçek SKU).
Sayfa envanter odaklı GENİŞ görünüm — Director'daki dar kolon 6 sütunla
sınırlı ve ürün adı taşımıyor.

- **Kolon seçimi ölçümdür (UI-ADR-128):** `reorder_units`,
  `estimated_stockout_at`, `sales.revenue` canlı veride 48/48 null
  (ADR-0149 — üretici politikaları yok) → kolonları YOK. Ölçülen altı
  kolon: SKU · Ürün · Durum · Stok · Kalan gün · Satılan (7g). Üretici
  kazanan alan, kolonunu o gün geri alır.
- **Sabit kolon referansı** (UI-ADR-183 dersi) modül sabitinde.
- **Satır seçimi Director'la AYNI sağ paneli açar** — kabuk sabit,
  içerik sağlayıcısı değişken (§7); ikinci bir SKU detayı yazılmadı.
- **Boş tablo bir cevaptır:** "SP-API'den SKU gelmedi" der, "katalog
  boş" iddiasına çevrilmez (story kilitledi).

---

## UI-ADR-197 — Amazon PPC sayfası: Katman 1 canlı, kampanya kırılımı fail-closed

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-111 · UI-ADR-156 · ODIN ADR-0112 · FR-0026 · backend-istekleri.md

`/amazon/ppc` nav'da vardı, ekranı yoktu. Director'ın kanonik
`useAmazonPpc` kancası + `PPCOverviewCard` tüketildi — beş reklam KPI'ı
bugün CANLI (spend $689,05 · sales $8.380,43 · ACOS %8,2 · ROAS 12,2 ·
net after ads $1.733,38; canlı sayfada doğrulandı).

- **Kampanya kırılımı FAIL-CLOSED:** ODIN `/api/amazon`da kırılım
  yayınlamıyor; veri çekirdekte var (94 satırlık reklam raporu KO'su)
  ama sözleşme açılmadı — talep backend-istekleri.md'de zaten kayıtlı.
  `CampaignIntelligenceList` null zarfla "üretilmedi" basar. 94 satırı
  arayüzün KO'dan okuyup kendi kırılımını üretmesi, çekirdeğin yapmadığı
  değerlendirmeyi arayüzde icat etmek olurdu (UI-ADR-111) — yapılmadı.
- **Story dersi:** NoData gerekçesi GÖRÜNÜR metin değil `aria-label`dır
  (UI-ADR-156); durum story'leri metinle değil `getByRole("note",
  {name})` ile sorgular. İlk yazım metinle sorguladı ve kapı koşumu
  durdurulup düzeltildi.

---

## UI-ADR-198 — Today's Mission + Current Focus canlı: seçim çekirdekte

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** ODIN cockpit `executive_focus` (core 0595180) · 13-backend-recommendations.md §14.1

Briefing'in üç boş alanının İKİSİ doldu. UI tarafında seçim yapılmadı:
cockpit `executive_focus` yayınlıyor — `todays_mission` sahibin urgent
hedeflerinin BİRLEŞİMİ (sıralama yok), `current_focus` roadmap'in active
fazı. Hero adaptörü okur; eski çekirdek yayınlamıyorsa alan `nullish` ve
"—" kalır. Header'daki Mission çipi de AYNI kancaya bağlandı (istek
coalescing ile ekranlarınkiyle birleşir) — "veri kaynağı bağlı değil"
notu üstbilgiden kalktı.

**AI Readiness bilerek "—" KALDI:** ölçen kaynak yayınlanmıyor
(13-backend-recommendations.md §14.1) — üç alandan biri dolu OLMAMAYI
sürdürür; dürüstlük budur.

---

## UI-ADR-199 — System Performance: ham nabız, ham iş sayıları, etiketli istemci ölçümü

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-111 · UI-ADR-129 · ODIN ADR-0148

`/system/performance` nav'da vardı, ekranı yoktu. Core değişikliği
GEREKMEDİ — üç kaynak zaten yayında ya da istemcide ölçülebilir:

1. **Çekirdek nabzı** `/api/state.health`ten ham: son olay, sıra no,
   `events.jsonl` / `telemetry.jsonl` boyutları. Günlük boyutu bilinen
   performans sürücüsüdür (/api/state o dosyayı okur) — artık ekranda.
2. **Zamanlanmış işler** `directors` yayınından; şema iş başına
   `runs`/`failuresTotal`ı DÜŞÜRÜYORDU, opsiyonel olarak eklendi.
   Sayılar KÜMÜLATİF ve YAN YANA ham gösterilir — arayüz başarı ORANI
   türetmez (UI-ADR-111); story bunu kilitler ("başarı" kelimesi ekranda
   geçemez).
3. **`/api/state` bekleme süresi** istemcinin KENDİ ölçümüdür ve öyle
   etiketlenir ("ODIN yayını değil") — coalescing yüzünden paylaşılan
   isteğin beklemesi ölçülebilir; kullanıcının beklediği süre tam olarak
   budur. Sunucu kendi süresini yayınlarsa ayrıca gösterilir.

- **Uptime/CPU/RAM ÇİZİLMEDİ** — hiçbir uçta yayınlanmıyor (system
  ekranındaki kararın aynısı); story yokluklarını da kilitler.
- **Ders:** `Stat` `<dt>/<dd>` basar; `<dl>` ebeveynsiz kullanım axe
  dlitem ihlali (kapı yakaladı, ilk koşum kırmızıydı — director-card
  deseni kopyalandı).

---

## UI-ADR-200 — System Storage: ölçülen büyüme, türetilmiş projeksiyon YOK

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-111 · UI-ADR-199 · ODIN `odin/storage.py`

Gece taraması `/system/storage` için "üçüncü kopya ekran değer katmaz"
demişti (`disk_used_pct` + günlük boyutları /system ve /system/performance'ta
zaten var). **Bu ölçüm eksikti** ve bu ekran onu düzeltiyor: iki ekranın
cevapladığı soru "ne kadar dolu", buranınki **hangi dizin büyüyor ve ne
hızla** — ki `/api/state` her istekte `events.jsonl`i okuduğu için o
dosyanın büyümesi bir gecikme bütçesidir, trivia değil.

**Core geliştirildi (kaynak YOKTU, uydurulmadı):** `odin/storage.py` +
`GET /api/storage`. `/api/state`e anahtar EKLENMEDİ — envanter veri
dizinindeki ~3.000 dosyayı stat'lıyor (ölçüldü: 0,59 sn) ve `/api/state`
her açık ekranın yokladığı sıcak yoldur. `/api/amazon` ile aynı gerekçe.

**Büyüme ÖLÇÜMDÜR, tahmin değil:** ekleme-yalnız bir JSONL kendi ilk ve
son `ts`ini taşır; bayt/gün = boyut / gözlenen süre. Bir saatten kısa
gözlemde `null` döner — bir sabahın yazımı güne çarpılmaz.

**PROJEKSİYON ÇİZİLMEDİ:** "şu kadar gün sonra dolar / N gün kaldı"
yazılmaz. Ölçülen hız ile ölçülen boş alan YAN YANA durur; hüküm
sahibindir (UI-ADR-111'in aynı kuralı). Story bunu kilitler —
"dolar/kalan gün/tahmin" kelimeleri ekranda geçemez.

**`empty` = "ölçüldü, veri dizini boş"**, "ölçülmedi" değil: zarf
atılmaz, listeler boşaltılır. Disk ölçümü boşaltılMAZ — boş bir veri
dizini diskin doluluğunu geçersiz kılmaz.

**KANIT [17:19, üretim 3000, gerçek cockpit]:** 63,9 MB / 3.091 dosya ·
disk %83 · 26,6 GB boş · events.jsonl **1,68 MB/gün** (4,62 günlük
gözlem) · telemetry.jsonl 0,35 MB/gün · 49 satırlık döküm (staging 685
dosya 20,1 MB en büyük kalem).

---

## UI-ADR-201 — Memory: hafıza defteri, karar kuyruğunun kopyası değil

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-111 · UI-ADR-194 · ODIN ADR-0005 · ADR-0046 · ADR-0131

Gece taraması `/memory` için "executive-memory dosyaları var ama
projeksiyonu yok; karar/verdict zaten /decisions'ta" demişti. İkinci yarı
YANLIŞTI: `/decisions` **şu an açık** olanı gösterir (31 kayıt), hafıza
ise **bugüne kadarki her şeyi** (2.335 öneri). Farklı iki soru.

**Core geliştirildi:** `lifecycle.projection()` + `GET /api/memory`. İki
depo zaten vardı ve hiçbir şey yayınlamıyordu — `decisions.jsonl` (ODIN'in
ürettiği her öneri) ve `lifecycle.jsonl` (sahibin verdiği her hüküm);
`rec_id` ile birleşiyorlar. Yeni yazma yolu YOK, salt projeksiyon
(ADR-0044).

**FİLTRE YOK — kararın kendisi bu:** her verdict gerekçesiyle listelenir,
zayıf gerekçeli olan da. Ekleme-yalnız defter (ADR-0005) ancak sahip
içine bakabildiği sürece bir anlam taşır; kendi zayıf kaydını gizleyen
bir defter, defter değildir.

**ORAN YOK:** "2.335 öneri / 1 karar" ham ve yan yana durur. Arayüz bundan
"karar verme yüzdesi" ya da kalite skoru türetmez (UI-ADR-111). Story
bunu kelime sınırıyla kilitler.

**Ekran ilk açılışta bir bulgu gösterdi:** defterdeki TEK verdict'in
gerekçesi `"gerekçen"` — 2 Ağu 10:13'te gerçek deftere yazılmış bir TEST
girdisi (gece raporu "gerçek deftere iz yok" diyordu; o iddia E2E'den
ÖNCEKİ elle denemeyi kapsamıyormuş). Silinemez (ADR-0005); ekran onu
gizlemez, sahip düzeltici bir hüküm yazabilir.

**KANIT [17:37, üretim 3000]:** 2.335 öneri · 1 karar · 0 sonuç kaydı ·
risk.detected 2321 / opportunity.* 14 · sınıf A 2334, B 1 · tek verdict
gerekçesiyle listede.

---

## UI-ADR-202 — Amazon Orders: taramanın çürüyen iddiası, gerçek sipariş tablosu

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-111 · UI-ADR-128 · UI-ADR-158 · ODIN ADR-0138 · ADR-0147

Gece taraması `/amazon/orders` için "sipariş listesi anahtarı YOK; SP-API
orders KO'su promote edilmemiş" yazmıştı. **Kaynaktan çürüdü:** core/
altında YEDİ `KO-spapi-orders-*` var, en yenisi **49 gerçek sipariş**
(7 günlük kayan pencere, 2026-07-24→31). Kayıt vardı; yayınlayan uç yoktu
— ADR-0147'nin gerekçesinin birebir tekrarı, bir yıl sonra aynı yerde.

**Ders (üçüncü kez):** iddia kaynaktan doğrulanmadan planlanmaz. Bu
oturumda taramanın üç satırından biri yanlış çıktı.

**Core:** `amazon_api.build_orders()` + `GET /api/orders`. Ayrı yüzey —
satır listesi `/api/amazon`ın ~10 katı, tek ekran istiyor; aynı
`AmazonProjection` önbelleğinin ikinci örneği.

**TUTARSIZ SİPARİŞ 0 DEĞİLDİR:** Pending/Canceled siparişlerde
`OrderTotal` yok. Toplama 0 olarak katılmaz; ayrı sayılır ve kart
"42 siparişin toplamı · 7 siparişte tutar yok" der. Tabloda "—" görünür.
Story bunu kilitler. (UI-ADR-158'in "eksik ≠ sıfır" kuralının para hâli.)

**Para çekirdekte `Decimal`:** tutarlar dize gelir ("47.90"); float
toplamı kuruş kaybeder. Arayüz tek satır okurken `Number()` ile taşır ve
ayrıştıramazsa **null** yazar, 0 değil.

**YAŞ GİZLENMEZ:** kaydın tarihi (31 Tem 22:40) ve KENDİ beyan ettiği
pencere başlıkta durur. Bugün 2 Ağustos — anlık görüntü iki günlük ve
ekran bunu saklamıyor.

**KANIT [18:02, üretim 3000]:** 49 sipariş · 2.044,80 USD (42 tutarlı,
7 tutarsız) · Shipped 42 / Pending 5 / Canceled 2 · Amazon.com 49 · AFN 49
· 49 satırlık tablo, en yeni 31.07 19:58 Bekliyor (tutar "—").

---

## UI-ADR-203 — Listings + Returns: promote edilmiş iki kayıt, çekirdek beyanlı fail-closed

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-093 · UI-ADR-111 · UI-ADR-156 · UI-ADR-202 · gavadolar 2/2

Gece taraması iki hedef için daha "veri yayınlanmıyor" demişti; **ikisi de
core'da promote edilmiş halde duruyordu** (UI-ADR-202'den sonra ÜÇÜNCÜ ve
DÖRDÜNCÜ çürüyen iddia):

- `KO-amazon-asin-catalog-2026H1-0001` → 42 ASIN, oturum/adet/ciro/
  dönüşüm/Buy Box + 1.542 birim stok → **Listings**
- `KO-amazon-customer-satisfaction-2026H1-0001` → 43 satır yıldız/yorum/
  iade oranı/sipariş → **Returns**

**Core:** `amazon_api.build_catalog()` + `GET /api/catalog`. İki ekran tek
yükü paylaşır, ayrı `queryKey` alır (KPI/Alert deseni).

**İADE ORANI ÖLÇEĞİ — bu ekranın en tehlikeli hatası.** Kaydın sütunu
"Refund rate (%)" adını taşıyor ama değeri **0-1** (0,0922). Çekirdek
`refund_rate_scale: "0-1"` BEYAN eder, arayüz `toPercentUnit` ile okur.
Beyan sözlük dışıysa değer **hiç basılmaz** (UI-ADR-093). Story bunu iki
yönden kilitler: ekranda "9,22" VAR, "922,00" YOK.

**"Total" satırı ürün listesinde değil:** kaydın kendi özet satırı ayrı
kartta durur; listeye karışsaydı her toplam iki kez sayılırdı.

**SIFIR YORUM SIFIR YILDIZ DEĞİLDİR:** kayıt yorumsuz ürüne 0 yazıyor;
ekran onu "Henüz yorum yok" diye gösterir, "0/5" diye değil.

**`derived_flags` ÖLÇÜM DEĞİL:** kaydı hazırlayan ajanın yorumları; ayrı
bölümde "ÖLÇÜM DEĞİL" etiketiyle. KPI'a çevrilmez.

**YENİ ORTAK PARÇA — `sourceUnavailable()` (gavadolar 2/2):** çekirdek
`available:false` + `reason` gönderdiğinde bölüm hatasını üreten tek
fonksiyon. Meclisin şartı buydu: *"fail-closed gerekçesi API tarafından
üretilmeli; UI'da rotaya özel sabit metin olmamalı"* — yoksa kaynak
durumu değiştiği gün ekran eski cümleyi söylemeye devam eder. Orders
ekranı da bu fonksiyona taşındı (üç çağıran).

**Ders:** `NoData` gerekçesi `aria-label`dır (UI-ADR-156) — story'de
`getByText` DEĞİL `getByRole("note", {name})` ile aranır. İlk koşum bu
yüzden kırmızıydı.

**KANIT [18:22, üretim 3000]:** Listings 42 ASIN / 1.542 birim, ciro
lideri B0GCHNCCXT 2.090 oturum → 82 adet → 19.963,54 (%3,92 dönüşüm,
%98,9 Buy Box). Returns özet %9,22 iade · 5,0/5 · 26 yorum · 1.508 birim
/ 72.171,34 USD; en yüksek iade %100,00 (7 birim), yorumsuz satır "—".

---

## UI-ADR-204 — Amazon Profit: ölçülen zincir + adıyla bildirilen boşluk

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-116 · UI-ADR-111 · UI-ADR-203 · ODIN ADR-0157

Gece taraması `/amazon/profit` için "SKU bazlı gerçek kâr COGS ister;
COGS kapsamı SAHİP KARARI bekliyor" demişti. Doğru ama **eksik**: bekleyen
karar **SKU KIRILIMI** içindir. **TOPLAM zincir bugün tamamen ölçülü** —
42/42 ASIN eşleşmiş, 0 eşleşmemiş birim. Ekran ölçüleni gösterir,
bekleyeni adıyla bildirir; ikisini birbirine karıştırmaz.

**Core (tek satırlık ekleme):** `contribution_margin` artık `gross_profit`
ve `contribution` TUTARLARINI da yayınlıyor. Yeni hesap değil — iki yüzde
zaten aynı ifadeden üretiliyordu; amaç arayüzün üç alanı çıkarıp sonuca
"kâr" dememesi (UI-ADR-111'in çıkarma hâli). Çekirdek testi yayınlanan
tutarla yayınlanan yüzdenin ayrışmasını yasaklıyor.

**"NET KÂR" DENMİYOR (UI-ADR-116):** zincirin son halkası KATKI. Kayıt
neyi hariç tuttuğunu kendisi söylüyor (`refunds`, `advertising`) ve ekran
o listeyi rozet olarak basıyor. Reklam AYRI katman, kendi kaydından
(`/api/amazon` PPC kalemleri) — birleştirilmiyor.

**`dated:false` GİZLENMİYOR:** maliyet beyanları 21 Tem'den geçerli,
ölçülen dönem 30 Haz'da bitiyor. Kayıt kendi tarihleme eksikliğini
bildiriyor; ekran bunu cümleyle yazıyor.

**Eşleşmeyen birim uyarısı bilerek koşullu:** bugün 0. Sıfırken metin
çizilseydi olmayan bir sorun ekranda dururdu.

**KANIT [18:41, üretim 3000]:** 70.246,54 ciro − 34.414,62 COGS =
35.831,92 brüt (%51,0) − 13.741,87 ücret = **22.090,05 katkı (%31,4)**,
sahip tabanı %40. Reklam katmanı: 689,05 harcama / 8.380,43 satış /
%8,20 ACOS / ROAS 12,16 / 1.733,38 reklam sonrası.

---

## UI-ADR-205 — System AI Runtime: ölçülen açılır, maliyet null kalır

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-111 · UI-ADR-156 · 15-execution-plan.md (S9) · gavadolar 2/2

S9 "AI Gateway" **maliyet paneli yüzünden** ertelenmişti. Erteleme
gerekçesi MALİYETE aitti, ÖLÇÜME değil — ve `odin/ai.py:usage()` model
kırılımını, token'ları, gecikmeyi, hataları ve son çağrıları **başından
beri ölçüyordu**; `/api/state` yalnız dört alanını (`ai_spend`)
yayınlıyordu. Bu ekran ölçüleni açar, maliyeti açmaz.

**Meclis sınırı (2/2, terra + luna):** gösterilebilir = sağlayıcı, model,
çağrı sayısı, token, gecikme, hata kapsamı. Gösterilemez = toplam maliyet,
ortalama maliyet, maliyet trendi, maliyete dayalı skor. **`$0` kesinlikle
yasak.**

**Core:** `GET /api/ai` = `ai.usage()` + `_providers()`. Yeni hesap yok.
Sağlayıcı listesi yanında çünkü *"anahtar var ama hiç çağrılmamış"*
ancak ikisi yan yanayken görünür. `_providers()` ortak yardımcıya
çıkarıldı — iki ucun FARKLI sağlayıcı listesi yayınlaması, hiç
yayınlamamaktan kötü olurdu.

**BAŞARI ORANI TÜRETİLMİYOR:** 12 çağrıya 13 hata düşüyor. Bu bir
yüzdeye sıkıştırılmaması gereken bir olgudur (UI-ADR-111); iki sayı ham
ve yan yana durur.

**Ders (ikinci kez bu oturumda):** kendi vaadini yakalayan negatif
assertion. `/başarı oranı/` araması bölümün KENDİ açıklamasını buldu ve
kapıyı yanlış yerden kırmızıya çevirdi — negatif iddia RAKAMLI yüzde
arar (`/\d\s*%|%\s*\d/`), vaadin kelimeleri ayrıca pozitif olarak
doğrulanır.

**KANIT [18:57, üretim 3000]:** 12 çağrı / 13 hata · 34.139 + 4.301
token · ort. 49,9 sn gecikme · llama-3.3-70b 11 / gpt-oss-120b 1 ·
maliyet "—" (0 çağrı fiyat bildirdi), fiyatsız çağrı 12 · 12 sağlayıcı
anahtarlı · son hata 1 Ağu 03:01 nvidia HTTPError.

---

## UI-ADR-206 — Yetenek durumu: placeholder yerine ÖLÇÜLMÜŞ yokluk

**Durum:** DONDURULDU
**Tarih:** 2 Ağustos 2026
**İlgili:** UI-ADR-096 · UI-ADR-203 · ODIN `odin/capability.py` · gavadolar 2/2

Dört hedefin verisi GERÇEKTEN yok: `/amazon/suppliers` · `/trading` ·
`/system/network` · `/system/backups`. Bugüne kadar hepsi tek bir genel
yakalayıcıya düşüyordu: *"Bu ekran henüz üretilmedi… kendi sprintinde
gelecek."*

**O cümle neden bir yalandı:** ölçüme dayanmıyordu, hiç eskimiyordu ve
kaynak indiği gün AYNI kalacaktı. Bir sprint vaadi, bir veri durumu
değil.

**Meclisin şartı (terra + luna, 2/2):** genel placeholder değil, gerçek
bir **capability unavailable** ekranı; ve kritik olan — *"bu durum API
tarafından üretilmeli; UI'da rotaya özel sabit metin olmamalı."*

**Çekirdek:** `odin/capability.py` + `GET /api/capabilities[?id=]`. Her
yetenek kendi PROBUNU taşır ve üç şey döner: `available` · `reason`
(adıyla, ne eksik) · `evidence` (neye bakıldı — iddia denetlenebilsin).

**Tek ekran, dört rota** (`features/capability/screen.tsx`): metin
farkının tamamı çekirdekten gelir. Arayüzde tek bir rota-özel cümle yok.
Kaynak indiği gün ekran kendiliğinden değişir — bu, kararın bütün amacı.

**ARŞİV YEDEK DEĞİLDİR:** prob `archive/`i ÖLÇER (21 dosya, 3,85 MB) ve
yine de yeteneği KAPALI sayar, çünkü neyin/hangi sıklıkta/nereye
kopyalandığını söyleyen kayıt yok. İkisini karıştırmamak probun asıl işi.

**Sahte metrik yok:** boş tablo, boş grafik, sıfır çizilmez. Yokluğun
dürüst hâli boş bir grafik değil, açık bir cümledir. Story `queryByRole
("table")`ın null olduğunu ve eski placeholder cümlesinin geçmediğini
kilitler.

**KANIT [19:22, üretim 3000]:** /system/backups → "Veri kaynağı bağlı
değil · system.backups" + ölçülmüş gerekçe + "Ne gerekiyor" + kanıt
(`archive/: 21 dosya, 3.85 MB` · `backup-policy.json: YOK`) + ölçüm anı.
Dört rota da 200.
