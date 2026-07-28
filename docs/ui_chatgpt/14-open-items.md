# 14 — Open Items (ÇÖZÜLDÜ)

**Tarih:** 28 Temmuz 2026
**Durum:** 13 maddenin **tamamı kapandı.** ✅

Kararların tam ADR kayıtları: `08-decision-log.md` → Bölüm 2.

---

## Karar Özeti

| # | Konu | Karar | ADR |
|---|---|---|---|
| 1 | Görsel dil | **Hibrit** — çerçeve sakin, AI bölgeleri mor glow. Warning için amber ayrıldı | UI-ADR-069 |
| 2 | Navigation | **Hibrit menü** — kategori etiketleri + düz maddeler | UI-ADR-070 |
| 3 | Alt menü / sekme | **İkisi de**, senkron | UI-ADR-072 |
| 4 | Universe switcher | **İkisi de** — ODIN HQ + header switcher | UI-ADR-073 |
| 5 | Director listesi | AI Director / Workspace ayrımı kabul. 6 aktif Director | UI-ADR-074 |
| 6 | Responsive | **Tam kapsam** — Desktop+Tablet+Mobile × Dark+Light, sıralı üretim | UI-ADR-075 |
| 7 | Telemetri | **Gerçek olanla başla** — 6 kanal, 3 AI halkası | UI-ADR-071 |
| 8 | AI Core | **Ayrı ekran yok.** AI her yerde. Telemetri System Director'a taşındı | UI-ADR-077 |
| 9 | Adaptive UI | **v1.0'da kapalı.** Kullanım olayları yine de kaydedilir | UI-ADR-082 |
| 10 | Header | 4 görünür ikon. Weather ve Time kaldırıldı | UI-ADR-076 |
| 11 | Voice | v1.0 dışı, backlog'a alındı | UI-ADR-080 |
| 12 | Tanımsız workspace | Finance → Trading → Projects → Automation. Executive Director silindi | UI-ADR-078, UI-ADR-079 |
| 13 | Bileşen sırası | M2'de önce Typography, sonra Table | UI-ADR-081 |

---

## #6 — Nihai kapsam kararı (UI-ADR-075 revize)

**Karar:** Tam kapsam hedeftir, ancak **iki aşamada** teslim edilir.

### Aşama 1 — v1.0 "Kullanılabilir" (hedef: günlük kullanıma başlamak)

| Varyant | Kapsam |
|---|---|
| Desktop / Dark | ✅ Tam — 9 ekran, tüm state'ler |
| Tablet | ✅ **Çalışır durumda** — 8 kolon grid, aynı bileşenler |
| Mobile | ✅ **Çalışır durumda** — companion mod: brief, alarm, karar onayı |
| Light tema | ⏭️ Aşama 2 |

"Çalışır durumda" = kullanabilirsin, bozuk görünmez, ama piksel seviyesinde
cilalanmamıştır.

### Aşama 2 — v1.1 "Tam" (yapılacaklar listesinde)

- Light tema (tüm ekranlar)
- Tablet ve Mobile'ın piksel seviyesinde cilalanması
- Her varyant için ayrı loading / empty / error tasarımı
- Presentation, Wallboard, High Contrast temaları

**Gerekçe:** Amaç önce ODIN'i **kullanmaya başlamak**, sonra cilalamak.
Üç cihazda çalışan sade bir sürüm, tek cihazda mükemmel bir sürümden daha
değerlidir — çünkü gerçek kullanım gerçek geri bildirim üretir.

**Koruma kuralı:** Desktop/Dark referanstır ve asla kesilmez. Değişirse diğer
varyantların hepsi yeniden yapılır — bu yüzden önce o dondurulur.

---

## ⚠️ Hâlâ doğrulanmamış: backend gerçekleri

Bu maddeler karar değil, **kontrol** gerektiriyor. Claude Code'un repo
analizinde cevaplanacak:

| Soru | Neden kritik |
|---|---|
| `universe_id` veri modelinde var mı? | UI-ADR-073 bunsuz çalışmaz. Retrofit ~10 kat pahalı |
| Ads API bağlı mı? | PPC Intelligence bunsuz çalışmaz |
| Fee / COGS verisi var mı? | Net kâr bunsuz **yanlış** hesaplanır |
| Confidence skoru gerçekten üretiliyor mu? | Üretilemiyorsa gösterilmez |
| Director heartbeat servisi var mı? | Yoksa yeni yazılacak |
| Decision kayıtları kalıcı saklanıyor mu? | Decision Center'ın çekirdeği |

**Net kâr uyarısı:** COGS Amazon'da yoktur, senin girmen gerekir. Kalemlerden
biri eksikse gösterilen net kâr yanlıştır — ve yanlış bir kâr rakamı tüm
ODIN'in güvenilirliğini bitirir. Hesaplanamıyorsa "Gross Profit (ücretler
hariç)" gösterilir ve neyin hariç olduğu açıkça yazılır.

---

## Kaynak sohbetin eksik kısmı

KARAR-001…045 numaralandırmasının **~32 tanesi** elimizdeki 7 dosyada yok
(003–009, 011–014, 016–020, 023–029, 031–038, 040–043).

**Karar gerekli:** Sohbetin tamamına erişimin var mı? Varsa o kararlar da
çıkarılmalı. Yoksa, kod yazarken karşılaşılan her boşluk yeni bir ADR olarak
`08-decision-log.md`'ye eklenir.
