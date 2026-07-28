# BURADAN BAŞLA

Diğer 18 dosyayı şimdi okuman gerekmiyor. Onlar **Claude Code için**.
Sen sadece bu dosyayı oku.

---

## İki repon var — hangisi neye ait

```
Zalvagrant/ODIN            → Backend. Amazon API, veri, iş mantığı, Board raporu.
                             Buraya DOKUNULMAYACAK (sadece okunacak + birkaç ek).

Zalvagrant/OD-N-ARAY-Z     → Arayüz. Yeni ekranlar burada yazılacak.
                             ⭐ DOKÜMANLAR BURAYA GİDECEK.
```

**Neden arayüz reposuna:** Claude Code tek repoda çalışır. Yazacağı kodun
yanında spesifikasyonu görmesi gerekiyor. ODIN reposuna koyarsan, arayüz
yazarken dokümanı göremez.

---

# ADIM 1 — Klasörü arayüz reposuna koy

`ui_chatgpt` klasörünü `OD-N-ARAY-Z` reposunda `docs/` içine at:

```
OD-N-ARAY-Z/
├── docs/
│   └── ui_chatgpt/     ← bu klasör
└── ...
```

```
git add docs/ui_chatgpt
git commit -m "docs(ui): ODIN UI spesifikasyonu v1.0"
git push
```

**ODIN reposuna da küçük bir işaret bırak** — ileride kafan karışmasın diye.
`ODIN/docs/UI-SPEC-NEREDE.md` adında tek satırlık dosya:

```
Arayüz spesifikasyonu OD-N-ARAY-Z reposunda: docs/ui_chatgpt/
Backend değişiklikleri için bak: docs/ui_chatgpt/13-backend-recommendations.md
```

**Adım 1 bitti.**

---

# ADIM 2 — İki analiz yaptır

S0'ın soruları iki repoya birden ait. O yüzden ikiye bölüyoruz.
Sıra önemli değil, ikisini de yap.

---

## 2A — ARAYÜZ reposunda

Claude Code'u `OD-N-ARAY-Z` klasöründe aç. Şunu kopyala yapıştır:

```
Bu repo ODIN'in yeni arayüzü için. docs/ui_chatgpt/ klasöründe tam
spesifikasyon var.

SADECE ANALİZ yap. Hiçbir kod değiştirme, hiçbir dosya oluşturma
(rapor dosyası hariç). Sadece oku ve rapor et.

Şunları cevapla:

1. Bu repoda şu an ne var? Dizin ve dosya haritasını çıkar.
   Boş mu, başlanmış mı, ne kadar ilerlemiş?
2. Hangi teknolojiler kurulu? package.json'ı incele:
   React versiyonu, Next.js var mı, Tailwind versiyonu, TypeScript,
   shadcn/ui, Framer Motion, Zustand, React Query, TanStack Table.
   docs/ui_chatgpt/10-component-library.md §12'deki hedef stack ile
   karşılaştır — hangisi eksik, hangisi farklı versiyon?
3. Mevcut bir tasarım sistemi / token yapısı var mı?
   Varsa docs/ui_chatgpt/kod/tokens.css ile çakışır mı?
4. Mevcut bileşenler var mı? Varsa listele ve
   docs/ui_chatgpt/10-component-library.md §10'daki envanterle eşleştir.
5. Routing yapısı var mı? Varsa mevcut route'lar
   docs/ui_chatgpt/04-navigation-system.md §3'teki menü ile uyumlu mu?
6. Bu repo ODIN backend'ine nasıl bağlanıyor? API client var mı?
7. Mevcut kod üstüne mi yazılmalı, yoksa temiz başlangıç mı daha mantıklı?
   Gerekçeni yaz.
8. docs/ui_chatgpt/kod/ klasöründeki 6 dosya bu projeye nasıl entegre
   edilir? Her biri için hedef dosya yolunu öner.

Raporu docs/ui_chatgpt/audit-frontend.md dosyasına yaz.
Emin olmadığın yere "BİLİNMİYOR" yaz, tahmin etme.
```

---

## 2B — ODIN reposunda

Claude Code'u `ODIN` klasöründe aç. Şunu kopyala yapıştır:

```
Bu repo ODIN'in backend'i. Yeni bir arayüz yazılacak ve o arayüzün
backend'den ne beklediğini bilmem gerekiyor.

SADECE ANALİZ yap. HİÇBİR KOD DEĞİŞTİRME. Sadece oku ve rapor et.

Şunları cevapla:

1. Mevcut kod yapısı nasıl? Dizin ve modül haritasını çıkar.
   Hangi dil/framework? Veritabanı var mı, hangisi?
2. Dışarıya API veriyor mu? Veriyorsa endpoint listesini çıkar.
   Yoksa arayüz veriye nasıl ulaşacak?
3. Veri modelinde universe_id veya benzeri bir multi-tenancy /
   çoklu-organizasyon boyutu var mı?
   (Lillu, Personal Finance, Trading gibi ayrı "evrenler" desteklenecek)
4. Amazon SP-API hangi endpoint'leri çekiyor? Tam liste.
5. Amazon Ads API bağlı mı?
6. Amazon fee/ücret verisi çekiliyor mu?
   COGS (ürün maliyeti) verisi herhangi bir yerde tutuluyor mu?
   NET KÂR hesaplanabiliyor mu, hesaplanıyorsa formülü nedir?
7. Confidence (güven) skoru üretiliyor mu?
   Üretiliyorsa nasıl hesaplanıyor — gerçek bir hesap mı, sabit sayı mı?
8. Kararlar (decision) veritabanında kalıcı saklanıyor mu?
   Kanıt (evidence) saklanıyor mu?
9. "Director" kavramı kodda var mı? Varsa hangileri, durum bilgisi
   üretiyorlar mı (heartbeat gibi)?
10. Telemetri: şu an ölçülebilen şeyler neler?
    Son senkron zamanı, API çağrı sayısı, arka plan işleri, hata sayısı —
    bunlardan hangileri gerçekten mevcut?
11. AI çağrıları nasıl yapılıyor? Merkezi bir yerden mi, dağınık mı?
    Model seçimi nasıl oluyor? Token/maliyet kaydı tutuluyor mu?

Raporu docs/audit-backend.md dosyasına yaz.
Emin olmadığın yere "BİLİNMİYOR" yaz, tahmin etme.
```

---

# ADIM 3 — İki raporu da bana getir

`audit-frontend.md` ve `audit-backend.md` — ikisini de bana yapıştır.

Ondan sonra:
- Sprint 1'in (token katmanı) kesin entegrasyon talimatını yazacağım
- Eksik çıkan backend parçaları için ayrı iş listesi çıkaracağım
- Sprint sırasını gerçek duruma göre güncelleyeceğim

---

# Hazır bekleyen kod

`kod/` klasöründe Sprint 1'in tamamı **yazılmış durumda:**

| Dosya | Ne yapar |
|---|---|
| `tokens.css` | Tüm renkler, boşluklar, gölgeler, cam efektleri |
| `tailwind.config.ts` | Tailwind'in bu renkleri tanıması |
| `theme-provider.tsx` | Tema altyapısı |
| `motion.ts` | Animasyon süreleri |
| `telemetry-registry.ts` | 20 telemetri kanalı (6'sı açık) |
| `data-envelope.ts` | Veri zarfı + sahte veri koruması |

Bunlar Adım 2'nin raporu geldikten sonra entegre edilecek. Sen bir şey
yazmayacaksın.

---

# Aklında bulunsun (3 şey)

**1. Net kâr yanlış çıkabilir.**
Amazon sana ürün maliyetini (COGS) vermiyor. Onu sen gireceksin. Girmezsen
ekranda gördüğün "net kâr" yanlış olur. Yanlış kâr rakamı en tehlikeli şey —
o yüzden hesaplanamıyorsa hiç gösterilmeyecek, yerine "Brüt Kâr (ücretler
hariç)" yazacak.

**2. Sahte veri yasak.**
Ekranda dönen bir AI halkası varsa gerçekten bir şey dönüyor olmalı. Sahte
animasyon, sahte güven skoru, sahte nabız yok. Karşılığı olmayan gösterge
hiç çizilmiyor.

**3. Her sprint sonunda 5 soru sor.**
Çalışıyor mu? Responsive mi? Hata var mı? Mimariye uygun mu? Merge'e hazır mı?
Beşi de "evet" değilse sonraki sprinte geçme. Bu tek kural projeyi bitirir.

---

**Şu an bulunduğun yer:** Adım 1.
**Hedef:** Sprint 8'de ODIN'i kullanmaya başlıyorsun.
