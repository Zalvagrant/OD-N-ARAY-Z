# 01 — Product Vision

**Durum:** ✅ DONDURULDU
**Kaynak:** dosya_1 (Phase 6), dosya_3 (KARAR-044 sonrası), dosya_6 (Design DNA)

---

## 1. Kategori Tanımı

ODIN bir yazılım değil, bir **çalışma ortamıdır.**

> **ODIN = Executive Intelligence Operating Environment (EIOE)**

Bu kategori tanımı kozmetik değildir; her tasarım kararının referansıdır.
Google "arama motoru", Notion "not uygulaması", Palantir "dashboard" değildir.
Hepsi kendi kategorisini kurmuştur. ODIN de aynısını yapar.

**Ürün cümlesi:**

> You don't use ODIN. You operate through ODIN.

Kullanıcı bir program açmıyor. Bir operasyon merkezine giriyor.

---

## 2. ODIN Ne Değildir

Bu liste, kapsam kaymasını önlemek için vardır. Bir özellik önerisi bu
listelerden birine yaklaşıyorsa reddedilir.

| ODIN şu değildir | Çünkü |
|---|---|
| Dashboard | Dashboard veri gösterir; ODIN karar hazırlar |
| ERP | Kaynak planlama yapmaz, kayıt tutmaz |
| CRM | Müşteri ilişkisi yönetmez |
| BI aracı | Rapor üretmek amaç değil, karar kalitesi amaçtır |
| Chatbot | Sohbet arayüz değil, arayüzün bir parçasıdır |
| Otomasyon paneli | Otomasyon bir sonuçtur, ürün değildir |

**ODIN'in tek cümlelik tanımı:**

> ODIN karar *alan* değil, karar *kalitesini artıran* bir Executive Intelligence Platform'dur.

Bu ayrım kritiktir: ODIN CEO'nun yerine karar vermez. CEO'nun daha hızlı, daha
fazla kanıtla ve daha az bilişsel yükle karar vermesini sağlar. Onay her zaman
insandadır.

---

## 3. Personality Matrix

Her görsel/etkileşim kararı bu tabloya karşı test edilir: "Bu ODIN'in
karakterine uyuyor mu?"

| Özellik | Hedef |
|---|---|
| Güvenilir | 10/10 |
| Profesyonel | 10/10 |
| Sade | 9/10 |
| Teknolojik | 9/10 |
| Premium | 9/10 |
| Cesur | 6/10 |
| Eğlenceli | 2/10 |
| Gösterişli | 1/10 |

**Kullanımı:** Bir bileşen önerisi geldiğinde "Eğlenceli 2/10" ve "Gösterişli
1/10" satırları çoğu dekoratif fikri tek başına eler. Bu tablo bir tartışma
kısaltıcıdır.

---

## 4. Executive Presence

ODIN'in **hissettirmesi gereken** duygular:

- Kontrol
- Güven
- Netlik
- Hız
- Sessizlik
- Hakimiyet

ODIN'in **hissettirmemesi gereken** duygular:

- Karmaşa
- Gürültü
- Oyun arayüzü hissi
- Neon gösteriş
- Bilgi bombardımanı

**Hedef duygu — kullanıcı ODIN'i açtığında şunu düşünmeli:**

> "Kontrol bende. Sistem çalışıyor. Hiçbir şeyi kaçırmıyorum. Karar verebilirim."

Tasarımın gerçek başarı ölçütü budur; görsel etkileyicilik değil.

---

## 5. Executive Psychology

Bu bölüm ürünün en az anlaşılan ama en belirleyici parçasıdır.

**Temel varsayım:** CEO stres altındadır. Arayüz stres üretmemelidir.

Kurallar:

- Hiçbir popup bağırmaz.
- Hiçbir animasyon zıplamaz.
- Hiçbir renk göz yormaz.
- Kırmızı **yalnızca gerçek krizlerde** kullanılır.

**Renk semantiği (dondurulmuş):**

| Renk | Anlam |
|---|---|
| Kırmızı | Gerçek kriz — aksiyon şart |
| Amber | Bekleyen risk (turuncu değil — UI-ADR-084) |
| Mor | AI / yapay zekâ üretimi |
| Mavi | Bilgi |
| Yeşil | Onay / sağlıklı |

Bu semantik `11-design-tokens.md`'de token olarak sabitlenir. Hiçbir ekran bu
anlamların dışında renk kullanamaz.

---

## 6. Information First

Arayüzde en değerli şey grafik değildir. **En değerli şey karardır.**

Bilgi öncelik sırası:

```
Karar → Risk → Fırsat → Trend → Veri
```

Çoğu dashboard bunun tam tersini yapar (önce veri, sonra grafik, en sonda —
varsa — öneri). ODIN'in ayrıştığı nokta budur.

**Pratik sonucu:** Bir ekranın en üst bölgesi bir grafiğe ayrılamaz. En üst
bölge karara ayrılır.

---

## 7. Attention Economy

Her ekranın bir **dikkat bütçesi** vardır ve aşılamaz:

| Seviye | Adet |
|---|---|
| Hero Element | en fazla 1 |
| Primary Cards | en fazla 3 |
| Secondary | en fazla 5 |
| Details | sınırsız (ama gizli, açılabilir) |

Bu bütçe sayesinde ODIN ilk bakışta temiz görünür; derinlik talep üzerine açılır.

---

## 8. Silence Principle

> Boş alan kayıp alan değildir.

Boş alan:
- odak oluşturur,
- öncelik belirler,
- okunabilirliği artırır.

Hiçbir ekran "boş kalmasın" diye widget ile doldurulmaz.

ℹ️ **Not:** `02-design-principles.md`'de
"Zero Dead Space" kuralı da vardır ("boş alan yerine anlamlı telemetri"). Bu
ikisi çelişkili görünür. Çözüm ve sınır çizgisi `02-design-principles.md` §9'da
tanımlanmıştır — kısaca: *içerik alanında* sessizlik, *sistem katmanında*
telemetri.

---

## 9. Continuous Intelligence

Dashboard yüklenir ve durur. ODIN durmaz.

ODIN sürekli:
- düşünür,
- öğrenir,
- analiz eder,
- bağ kurar,
- fırsat çıkarır.

Kullanıcı hiçbir şey yapmasa bile ODIN çalışıyordur ve arayüz bunu
hissettirir — ama bağırarak değil, ortam sinyaliyle (bkz. §10).

---

## 10. Ambient Intelligence

Bilgi bağırmaz, hissedilir.

| Sistem olayı | Arayüz sinyali |
|---|---|
| AI çalışıyor | Çok hafif pulse |
| Background Job | Footer'da paket akışı |
| Memory Index | Ring hareketi |
| Knowledge Update | Graph pulse |
| Decision Ready | Glow |

CEO bunları okumaz. Hisseder. Bu sinyallerin hiçbiri metin bildirimi
gerektirmez ve hiçbiri dikkat çalmaz.

---

## 11. Executive Memory (Kişiselleştirme)

ODIN, CEO'nun çalışma stilini öğrenir ve arayüz buna uyum sağlar.

| Gözlem | Arayüz tepkisi |
|---|---|
| Sabahları hep Finance açıyor | Sabah workspace'i Finance olur |
| Amazon'a hep Inventory'den giriyor | Amazon workspace Inventory ile açılır |
| Legal neredeyse hiç kullanılmıyor | Menüde pasifleşir |
| Knowledge çok kullanılıyor | Daha görünür hale gelir |

❌ **v1.0'DA KAPALI (UI-ADR-082).** Bu davranış kullanıcıyı şaşırtabilir ("dün
buradaydı, bugün yok") ve sistem yeniyken yetersiz veriden yanlış öğrenir.

**v1.0'da yapılan tek şey:** Kullanım olayları (hangi workspace, hangi saat,
ne kadar süre) **kaydedilir.** Böylece v1.1'de özellik açıldığında geçmiş veri
hazır olur, sistem sıfırdan öğrenmeye başlamaz.

**v1.1'de açılırken:** menü öğesi asla kaybolmaz; adaptasyon görünür olur;
ayarlardan kapatılabilir.

---

## 12. Executive Story Engine

Dashboard rakam gösterir. ODIN **karar hikâyesi** anlatır.

```
Amazon Sales → Inventory → Ads → Cash → Risk
     → AI → Prediction → Decision → Expected Outcome
     → Confidence → Approve
```

Yönetici veriyi değil, kararı okur. Bir KPI kartı tek başına anlam taşımaz;
zincirin neresinde olduğunu göstermek zorundadır.

---

## 13. Multi-Organization: Executive Universe

**Karar:** ODIN hiçbir zaman tek şirkete bağlı olmayacak. Çoklu organizasyon
destekleyen bir Executive Operating System olacak.

Organizasyon değil, **evren (Universe)** değiştirilir:

```
ODIN
├── 🌍 Lillu Universe          Amazon US/UK, Finans, Operasyon, Stok
├── 💰 Personal Universe       Bankalar, Kredi Kartları, Bütçe, Varlıklar
├── 📈 Trading Universe        XAU/USD, XAU/TRY, USD/TRY, EUR/TRY, Prop hesaplar
└── 🏢 Holding Universe        İleride açılacak şirketler
```

**Cross Universe Intelligence** — evrenler birbirinden kopuk değildir:

```
Trading Universe: bu hafta kâr oluştu
        ↓
Finance Universe: nakit akışı güncellensin mi?
        ↓
Lillu Universe: yeni stok alımı için sermaye oluştu
        ↓
Decision Center: yeni yatırım önerisi üretildi
```

**ODIN HQ** — tüm evrenlerin tek ekranda özeti, her evren için sağlık skoru ve
tek bir Overall Executive Score.

✅ **ÇÖZÜLDÜ (UI-ADR-073):** Universe hem header sol üstte hızlı geçiş
switcher'ı olarak, hem de ayrı bir **ODIN HQ** workspace'i olarak yaşar.

---

## 14. Ürün Başarı Kriteri

Bu ürün şu soruya "evet" cevabı verdiğinde başarılıdır:

> Bir CEO, 30 saniyede şirketinin durumunu anlayıp bir kararı onaylayabiliyor mu?

Görsel kalite, animasyon zenginliği, bileşen sayısı — hiçbiri başarı ölçütü
değildir. Tek ölçüt karar hızı ve karar kalitesidir.
