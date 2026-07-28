# 02 — Design Principles

**Durum:** ✅ DONDURULDU
**Kaynak:** dosya_1 (§13 Global UX + XII Design Restrictions), dosya_5 (DS-05/DS-06 audits), dosya_6 (Design DNA)

Bu dosya ODIN'in tasarım anayasasıdır. Bir bileşen veya ekran bu kurallardan
birini ihlal ediyorsa, ne kadar güzel görünürse görünsün sisteme girmez.

---

## 1. On Temel Kural (Global UX Standards)

| # | Kural | Anlamı |
|---|---|---|
| 1 | **Executive First** | Her ekranın amacı karar vermeyi hızlandırmaktır |
| 2 | **Explainable AI** | Her AI önerisi açıklanabilir olmalıdır |
| 3 | **Confidence Everywhere** | Her önemli bilgi bir güven skoru taşır |
| 4 | **Evidence Before Opinion** | AI yorumundan önce kanıt gösterilir |
| 5 | **Context Never Lost** | Ekran değişse bile bağlam korunur |
| 6 | **Live System** | Hiçbir ekran donuk görünmez |
| 7 | **Zero Dead Space** | Boş alan yerine anlamlı telemetri (sınırı §9'da) |
| 8 | **Progressive Disclosure** | Önce özet, sonra detay |
| 9 | **Keyboard First** | Klavye birinci, fare ikinci plandadır |
| 10 | **Trust Signals** | Verinin tazeliği ve kaynağı her zaman görünür |

Bu on kural her Design Review'ın kontrol listesidir.

---

## 2. Progressive Disclosure — Dört Seviye

Hiçbir pattern tüm bilgiyi aynı anda göstermez. Her bilgi dört seviyeden birine
aittir ve seviye atlanamaz.

```
Level 1  Executive Summary     "Ne oluyor?"        — her zaman görünür
Level 2  Operational Detail    "Neden oluyor?"     — tek tıkla
Level 3  Evidence              "Kanıtı ne?"        — açılır panel
Level 4  Raw Data              "Ham veri"          — talep üzerine
```

**Kural:** Bir ekran açıldığında yalnızca Level 1 görünür durumdadır. Level 4'e
ulaşmak için en fazla 3 etkileşim gerekir.

---

## 3. Executive Focus Rule

Bir ekranda aynı anda yalnızca:

- **1 ana karar**
- **1 ana görev**
- **1 ana alarm**

öne çıkar. Diğer her şey destekleyicidir ve görsel ağırlığı belirgin şekilde
daha düşüktür.

Bu, dikkat yönetiminin tek en önemli kuralıdır. İki şey aynı anda "en önemli"
olduğunda kullanıcı hiçbirine odaklanmaz.

---

## 4. Cognitive Load Budget

Her ekranın ölçülebilir bir bilişsel bütçesi vardır:

| Kısıt | Limit |
|---|---|
| Aynı anda ana odak sayısı | 5–7 |
| Güçlü vurgu rengi sayısı | en fazla 2 |
| Bir bölgede ana eylem | 1 |
| Gereksiz hareket | 0 |

Bu bütçe `01-product-vision.md` §7 Attention Economy ile birlikte okunur;
Attention Economy *ne kadar element*, Cognitive Load Budget *ne kadar zihinsel
yük* sorusunu cevaplar.

---

## 5. Decision Zones

Her ekranda görünmez üç bölge vardır. Tasarımcı bu bölgeleri çizmez ama
yerleşim bunları takip eder.

| Bölge | Soru |
|---|---|
| **Awareness** | Kullanıcı şu an ne durumda? |
| **Decision** | Şu anda neye karar vermeli? |
| **Action** | Hangi işlemi yapmalı? |

Bu akış tüm Director modüllerinde korunur. Bir ekranda Action bölgesi yoksa,
o ekran ODIN'e ait değildir — bir rapor sayfasıdır.

---

## 6. Visual Rhythm

Ekranlarda tekrarlayan bir ritim vardır:

```
Büyük Alan → Orta Alan → Detay → Boşluk → (tekrar)
```

Bu ritim ekranın nefes almasını sağlar. Ritmi bozan tek şey: eşit boyutlu
kartların yan yana dizilmesi. Eşit ağırlıklı grid, hiyerarşi yokluğu demektir
ve ODIN'de kullanılmaz.

---

## 7. Executive Timing

Bilgi güncellemeleri kullanıcının dikkatine göre ayarlanır:

| Olay | Zamanlama |
|---|---|
| Kritik uyarı | Anında |
| KPI güncellemesi | Dikkat dağıtmayacak şekilde, yumuşak |
| Arka plan senkronizasyonu | Tamamen sessiz |
| AI cevabı | Kademeli (streaming) |

Bir sayı ekranda "zıplayarak" değişmez. Değer geçişi tween ile yapılır ve
0.3 saniyeyi aşmaz.

---

## 8. Trust Signals

Executive bir sistemde güven, özellik değil zorunluluktur. Sistem her zaman
şunları görünür kılar:

- Verinin güncellenme zamanı
- Veri kaynağı
- İşlem durumu
- Senkronizasyon bilgisi

**Kural:** Kullanıcı hiçbir zaman "Bu bilgi güncel mi?" diye düşünmemelidir.
Her veri taşıyan bileşen bir `lastUpdated` ve `source` alanı göstermek
zorundadır. Bu, `09-data-contracts.md`'de veri sözleşmesi seviyesinde
zorunlu kılınmıştır.

---

## 9. "Zero Dead Space" vs "Silence Principle" — sınır

Kaynakta bu iki kural yan yana duruyor ve çelişkili görünüyor. Çözüm:

| Katman | Kural |
|---|---|
| **İçerik alanı** (workspace gövdesi) | Silence Principle geçerlidir. Boşluk bırakılır, doldurulmaz. |
| **Sistem katmanı** (footer, header, status bar) | Zero Dead Space geçerlidir. Boş piksel yerine telemetri akar. |

Yani: telemetri **çerçevede** yaşar, içerikte değil. Bir workspace'in ortasındaki
boşluk bir widget ile doldurulmaz; alt telemetri barındaki boşluk ise sistem
nabzı ile doldurulur.

---

## 10. Design Restrictions — YASAKLAR

Bu liste bir üretim AI'ına (Claude Design / Claude Code / v0 / Figma AI)
verilecek promptun ayrılmaz parçasıdır.

**ASLA:**

- ❌ Cyberpunk estetiği
- ❌ RGB / disco renk geçişleri
- ❌ Gamer UI dili
- ❌ Matrix efekti
- ❌ Hacker terminal görünümü
- ❌ Aşırı neon
- ❌ Gereksiz hologram
- ❌ Sonsuz döngüde animasyon
- ❌ Cam (glass) karmaşası — üst üste binen yarı saydam katmanlar
- ❌ Bilgi kalabalığı
- ❌ Dekoratif AI görselleri (gerçek durumu göstermeyen "AI süsü")
- ❌ Sahte dashboard / placeholder veri ile dolu ekran

**HER ZAMAN:**

- ✔ Executive
- ✔ Premium
- ✔ Minimal
- ✔ Intelligence First
- ✔ Calm Technology

**Referans alınan ürün dili:** Apple, Linear, Stripe, Palantir, Bloomberg
Terminal, Vision Pro.

✅ **ÇÖZÜLDÜ (UI-ADR-069) — Hibrit:** Çerçeve ve içerik alanı sakin kalır;
AI bölgeleri (AI Brief, Council, öneri kartları, AI Pulse) belirgin mor glow
alır. Cam yalnızca overlay katmanında (modal, drawer, command palette).

Özet kural: **neon bir aksan olabilir, bir tema olamaz.** Cam bir yüzey
olabilir, bir efekt gösterisi olamaz. Detay: `11-design-tokens.md` §5.

---

## 11. Motion Kuralı (özet)

Animasyon yalnızca dört amaç için kullanılır:

1. Context Change (bağlam değişimi)
2. Focus (odaklanma)
3. Feedback (geri bildirim)
4. State Transition (durum geçişi)

**Dekoratif animasyon kullanılmaz.** Detay: `12-motion-system.md`.

---

## 12. Responsive Kuralı

**Executive First:** ODIN'in birincil hedefi masaüstüdür.

| Cihaz | Yaklaşım |
|---|---|
| Büyük monitör / ultrawide | Birincil hedef, tam deneyim |
| Laptop | Tam deneyim |
| Tablet | Azaltılmış, okuma odaklı |
| Mobil | **Companion** — izleme ve onay, üretim değil |

Mobil, masaüstü deneyimiyle birebir eşitlenmeye çalışılmaz. Mobilde yapılacak
tek şey: brief okumak, alarm görmek, karar onaylamak.

✅ **KARAR (UI-ADR-075, revize) — iki aşamalı teslim:**

**v1.0 (kullanmaya başlamak için):** Desktop/Dark tam + Tablet ve Mobile
**çalışır durumda.** Üç cihazda da kullanabilirsin; mobil companion moddadır
(brief oku, alarm gör, kararı onayla).

**v1.1 (cilalama — yapılacaklar listesinde):** Light tema, Tablet/Mobile'ın
piksel seviyesinde cilalanması, her varyant için ayrı state tasarımları.

**Zorunlu sıra:** Desktop/Dark → Tablet → Mobile → Light.
Desktop/Dark referanstır ve dondurulmadan diğerlerine geçilmez; değişirse
hepsi yeniden yapılır.

---

## 13. Accessibility Zorunlulukları

Her ekran şunları sağlamak zorundadır:

- Klavye ile tam gezinme
- Görünür focus halkası
- Uygun yerlerde ARIA etiketleri
- Semantik HTML
- **Renkten bağımsız durum göstergesi** (sadece renkle anlam taşınmaz)
- `prefers-reduced-motion` desteği
- Okunabilir kontrast
- Mantıklı tab sırası
- Erişilebilir form, tablo ve grafik

⚠️ **DOĞRULANMADI:** WCAG uyumu otomatik testle (ör. axe-core) doğrulanmalıdır.
Bu tasarım sisteminin değil, uygulama aşamasının görevidir ve `handover.md`
M6'ya bağlanmıştır.

---

## 14. Performance Bütçesi

| Kısıt | Hedef |
|---|---|
| Etkileşim akıcılığı | 60 FPS |
| Layout shift | Minimum (skeleton gerçek yerleşimi temsil eder) |
| Uzun listeler | Sanallaştırılmış (virtualized) |
| Pahalı bileşenler | Memoize edilmiş |
| Senkron bloklayan iş | Yok |

**Animasyon performansı:**

- Tercih edilen: `transform`, `opacity`, `scale`
- Kaçınılan: `width`, `height`, `top`, `left`, büyük blur yarıçapları, pahalı filtreler

Bu, glass/blur kullanımını doğrudan sınırlar: cam yüzey sayısı ve blur
yarıçapı performans bütçesine tabidir.

---

## 15. Design Governance — Beş Kapı

Yeni hiçbir ekran veya bileşen bu beş kapıdan geçmeden sisteme eklenmez:

| Kapı | Soru |
|---|---|
| **Architecture Review** | Mevcut bilgi mimarisiyle uyumlu mu? |
| **Design Review** | Token ve bileşen standardına uyuyor mu? |
| **Interaction Review** | Davranış dili tutarlı mı? |
| **Performance Review** | FPS, render ve yükleme hedeflerini karşılıyor mu? |
| **Accessibility Review** | Erişilebilirlik standartlarını sağlıyor mu? |
| **Executive Review** | Gerçekten karar vermeyi hızlandırıyor mu? |

Son kapı en önemlisidir ve en çok atlananıdır. "Güzel oldu" cevabı bu kapıyı
geçirmez; "şu kararı şu kadar hızlandırıyor" cevabı geçirir.

---

## 16. Ekran Kabul Soruları

Bir ekran tamamlandı sayılmadan önce şu sorulara cevap verilir. Herhangi biri
"Hayır" ise ekran tamamlanmamıştır.

- Kurumsal yazılım gibi görünüyor mu?
- Sakin hissettiriyor mu?
- Yöneticinin iş yükünü azaltıyor mu?
- Her görselleştirme bir anlam taşıyor mu?
- Her grafik kendini açıklıyor mu?
- Bir CEO durumu 30 saniyenin altında anlayabilir mi?
- Bu arayüz yüzlerce modüle ölçeklenebilir mi?
- Apple bunu gereksiz karmaşıklık için reddeder miydi?
- Palantir mühendisleri bu bilgi hiyerarşisini kabul eder miydi?
