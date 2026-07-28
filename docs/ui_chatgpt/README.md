# ODIN UI — ChatGPT Tasarım Oturumu Dokümantasyonu

**Klasör:** `docs/ui_chatgpt/`
**Sürüm:** v1.0
**Durum:** Kaynak sohbet DONDURULDU (freeze). Bu klasör o sohbetin tek resmi çıktısıdır.
**Kapsam:** Yalnızca UI / UX / Design System / Bilgi Mimarisi kararları.

---

## Bu klasör nedir?

ODIN'in yeni arayüzü için ChatGPT ile yapılan uzun bir tasarım oturumu vardır. O oturum
7 parçalık bir sohbet kaydı olarak arşivlendi. Bu klasör, o kaydın **temize çekilmiş,
çelişkileri ayıklanmış, mühendislik seviyesine indirgenmiş** halidir.

Sohbet kaydının kendisi bir spesifikasyon değildir:

- Aynı konu 4-5 kez, her seferinde farklı isimlerle tekrar edilmiştir.
- En az 5 paralel numaralandırma sistemi kullanılmıştır (Phase / DS / UI / P / M / EPIC).
- Bazı kararlar sonradan sessizce değiştirilmiştir.
- "Tamamlandı ✅" işaretlerinin büyük kısmı **kod değil, doküman tamamlanmasıdır**.

Bu klasör bu üç sorunu çözer: tekilleştirir, çelişkileri açıkça işaretler, ilerleme
iddialarını gerçekçi seviyeye çeker.

---

## Bu klasör ne DEĞİLDİR

- ❌ ODIN'in backend mimarisi değildir. Backend'e dokunulmamıştır.
- ❌ Yeni iş mantığı önerisi değildir.
- ❌ Mevcut ODIN kodunun yerine geçmez.
- ❌ Sohbetin özeti değildir — sohbetin **ürüne dönüştürülmüş** halidir.

Bu klasörde yazan hiçbir şey mevcut ODIN veri modelini, servislerini veya
iş akışlarını değiştirmez. Değişen tek şey **arayüz katmanıdır.**

---

## Okuma sırası

| Sıra | Dosya | Kim okumalı |
|---|---|---|
| 1 | `00-index.md` | Herkes |
| 2 | `01-product-vision.md` | Herkes |
| 3 | `02-design-principles.md` | Tasarım + Kod |
| 4 | `03-information-architecture.md` | Tasarım + Kod |
| 5 | `04-navigation-system.md` | Kod (öncelikli) |
| 6 | `05-dashboard.md` | Tasarım (ilk ekran) |
| 7 | `06-workspaces.md` | Tasarım + Kod |
| 8 | `07-ai-directors.md` | Backend + AI |
| 9 | `08-decision-log.md` | Herkes (referans) |
| 10 | `09-data-contracts.md` | Backend (öncelikli) |
| 11 | `10-component-library.md` | Kod |
| 12 | `11-design-tokens.md` | Kod (ilk uygulanacak) |
| 13 | `12-motion-system.md` | Kod |
| 14 | `13-backend-recommendations.md` | Backend |
| 15 | `14-open-items.md` | Referans — kararların kaydı |
| 16 | `handover.md` | Roller ve backlog |
| 17 | `15-execution-plan.md` | Sprint planı — detaylı görev listesi |
| 18 | `PROMPTLAR.md` | **⭐ 13 sprintin kopyala-yapıştır promptu** |

---

## Kullanım kuralları

**Claude Code için:**
> Bu klasördeki standartlara eksiksiz uy. Hiçbir iş mantığını değiştirme.
> Yalnızca görsel dili ve kullanıcı deneyimini dönüştür. Bir çelişki görürsen
> `14-open-items.md`'ye bak; orada da yoksa dur ve sor, tahmin etme.

**Claude Design için:**
> Ekranları yalnızca `03`, `04`, `05`, `06`, `10`, `11`, `12` numaralı dosyalara
> göre üret. Yeni bileşen icat etme; `10-component-library.md`'de olmayan bir şeye
> ihtiyaç duyarsan önce o dosyaya ekleme öner.

**Sen (CEO) için:**
> **Önce `_BURADAN_BASLA.md` oku.** Diğer dosyalar Claude Code için.
>
> 13 maddenin 12'si 28 Temmuz'da karara bağlandı — kayıtları
> `08-decision-log.md` Bölüm 2'de. Kalan tek açık madde: Adaptive UI (#9).
> Sıradaki iş `handover.md` §10 → Claude Code repo analizi.

---

## İşaretleme dili

Bu klasörde şu etiketler kullanılır:

| Etiket | Anlamı |
|---|---|
| ✅ **DONDURULDU** | Karar kesin. Değiştirmek için ADR gerekir. |
| 🟡 **ÖNERİ** | Kaynak sohbette önerilmiş, kesin karara bağlanmamış. |
| 🔴 **ÇELİŞKİ** | Kaynakta iki farklı karar vardı. *(28 Tem itibarıyla hepsi kapandı — `08-decision-log.md` Bölüm 2)* |
| ⚠️ **DOĞRULANMADI** | Mevcut ODIN kodunda karşılığı kontrol edilmedi. |
| ⬜ **TANIMSIZ** | Sadece ismi geçmiş, içeriği yok. |

Bu etiketlerin amacı şu: dokümanı okuyan kişi veya AI, hangi satırın emir hangi
satırın taslak olduğunu ayırt edebilsin. Emin olmadığımız bir şeyi "kesin" gibi
yazmak, bu belgenin en büyük riski olurdu.

---

## Sürüm ve değişiklik yönetimi

- Her dosya bağımsız sürümlenir.
- Karar değişikliği doğrudan dosyaya yazılmaz; önce `08-decision-log.md`'ye
  yeni bir ADR kaydı eklenir, sonra ilgili dosya güncellenir.
- Commit formatı: `docs(ui): <ne değişti>`

---

## Kaynak

7 parçalık ChatGPT sohbet kaydı (`dosya_1.docx` … `dosya_7.docx`).
Bu klasördeki her karar o kayda dayanır. Kaynakta olmayan hiçbir yeni özellik
eklenmemiştir; yalnızca çelişkiler işaretlenmiş ve boşluklar `14-open-items.md`'de
açıkça sorulmuştur.
