# CLAUDE CODE'A TAŞIMA — Tek Sayfalık Talimat

Bu sayfayı bitirdiğinde bu sohbete bir daha ihtiyacın kalmayacak.
Her şey repoda olacak ve Claude Code oradan devam edecek.

---

# ADIM 1 — Dosyaları indir

Bu sohbetten şu iki şeyi indir:

| İndirilecek | Nereye gidecek |
|---|---|
| `CLAUDE.md` | Repo **kökü** (en üst klasör) |
| `ui_chatgpt/` klasörünün tamamı | `docs/ui_chatgpt/` |

`ui_chatgpt` klasöründe 20 dosya + `kod/` alt klasörü var. Hepsini al.

---

# ADIM 2 — Repoya yerleştir

`OD-N-ARAY-Z` reposunu bilgisayarına klonla (zaten varsa aç), sonra:

```
OD-N-ARAY-Z/
├── CLAUDE.md              ← kök dizine (ÖNEMLİ: docs içine değil)
├── README.md              (zaten var)
└── docs/
    └── ui_chatgpt/        ← 20 dosya + kod/ klasörü
        ├── _BURADAN_BASLA.md
        ├── 00-index.md
        ├── ... (15 numaralı dosya)
        ├── audit-report.md
        ├── README.md
        ├── handover.md
        └── kod/
            ├── tokens.css
            ├── tailwind.config.ts
            ├── theme-provider.tsx
            ├── motion.ts
            ├── telemetry-registry.ts
            ├── data-envelope.ts
            ├── eslint-token-rule.md
            └── KURULUM.md
```

**`CLAUDE.md` kökte olmalı.** Claude Code onu her oturumda otomatik okuyor.
Bütün kuralları, sınırları ve bağlamı oradan alacak — sen tekrar anlatmak
zorunda kalmayacaksın.

Sonra:

```
git add .
git commit -m "docs(ui): ODIN arayüz spesifikasyonu v1.0 + Sprint 1 kodu"
git push
```

---

# ADIM 3 — ODIN reposuna işaret bırak

`ODIN` reposunda `docs/UI-SPEC-NEREDE.md` adında tek dosya oluştur:

```markdown
# Arayüz Spesifikasyonu

ODIN'in yeni arayüzü ayrı bir repodadır:
https://github.com/Zalvagrant/OD-N-ARAY-Z → docs/ui_chatgpt/

- Arayüz kararları: UI-ADR-001…085 (bu reponun ADR-0001…0086 serisinden ayrıdır)
- Yeni arayüz, ADR-0080'deki IRenderer portunun bir adaptörü olarak konumlanır
- Bu repodan beklenen backend işleri: docs/ui_chatgpt/13-backend-recommendations.md
```

ODIN'in commit kuralı gereği (ADR-0048):

```
git commit -m "chore: point to UI spec repository"
```

---

# ADIM 4 — Claude Code'u başlat

`OD-N-ARAY-Z` klasöründe Claude Code'u aç. İlk mesaj olarak **sadece şunu**
yapıştır:

```
CLAUDE.md ve docs/ui_chatgpt/15-execution-plan.md dosyalarını oku.

Şu an S1 — Token & Theme Katmanı sprintindeyiz. Bu repo tamamen boş,
temiz başlangıç yapacağız.

Sırayla şunları yap:

1. Next.js + TypeScript + Tailwind projesi kur (App Router).
2. docs/ui_chatgpt/kod/ klasöründeki 6 dosyayı projeye entegre et.
   Yolları docs/ui_chatgpt/kod/KURULUM.md'deki öneriye göre ayarla.
   Dosyaların İÇERİĞİNİ DEĞİŞTİRME.
3. Storybook kur ve bir token showcase sayfası oluştur — tüm renkler,
   boşluklar, gölgeler, tipografi ölçeği görünsün.
4. ESLint'e docs/ui_chatgpt/kod/eslint-token-rule.md'deki kuralları ekle.
5. Doğrula: bg-surface, text-content, border-line sınıfları çalışıyor mu?
   .odin-num sınıfı sayıları hizalıyor mu?
   prefers-reduced-motion açıkken animasyonlar duruyor mu?
   bg-[#111827] yazınca lint hata veriyor mu?

Bitirince bana şu beş soruyu cevaplayacak şekilde rapor ver:
çalışıyor mu, responsive mi, hata var mı, mimariye uygun mu, merge'e hazır mı?

Plan üretme. Kod üret.
```

---

# ADIM 5 — Sonraki sprintler

Her sprint bitince Claude Code'a sadece şunu de:

```
docs/ui_chatgpt/15-execution-plan.md dosyasındaki S2 — App Shell
sprintini yap. Görev listesi orada. Bitirince beş soruyu cevapla.
```

`S2` yerine sıradaki sprint numarasını yaz. Sprint listesi:

```
S1   Token & Theme          ← şimdi buradasın
S2   App Shell              → uygulama ilk kez açılıyor
S3   Core Components
S4   Executive Components
S5   Briefing + Mission Control
S6   Amazon Director
S7   State & Data Layer
S8   Amazon canlı veri      → 🎯 KULLANMAYA BAŞLA
S9   AI Gateway
S10  Finance + Trading
S11  Decision + Knowledge + System
S12  Tablet + Mobile
S13  Hardening              → 🚀 v1.0
```

---

# Bilmen gereken 3 şey

**1. Bir sprint bitmeden diğerine geçme.**
Beş soruya da "evet" alacaksın: çalışıyor mu, responsive mi, hata var mı,
mimariye uygun mu, merge'e hazır mı? Bu tek kural projeyi bitirir.

**2. Claude Code plan üretmeye başlarsa durdur.**
"Plan istemiyorum, kodu yaz" de. CLAUDE.md'de bu yazıyor ama hatırlatman
gerekebilir. Şimdiye kadarki en büyük risk buydu.

**3. Net kâr konusunda dikkatli ol.**
Amazon ürün maliyetini (COGS) vermiyor. Sen girmezsen ekrandaki "net kâr"
yanlış olur. Hesaplanamıyorsa hiç gösterilmeyecek şekilde kuruldu — ama
S8'de bunu kontrol et.

---

# Bu sohbette çözülenler (kayıt için)

| Konu | Karar |
|---|---|
| ADR numaralandırma | `UI-ADR-###` — ODIN'in serisinden ayrı (UI-ADR-085) |
| İkincil aksan | Cyan `#00D4FF` — turuncu kaldırıldı (UI-ADR-084) |
| Dokümanların yeri | Arayüz reposu, `docs/ui_chatgpt/` |
| Mimari konum | ODIN'in IRenderer portunun (ADR-0080) adaptörü |
| Backend bağlantısı | Mevcut `/api/state` — yeni backend yazılmayacak |
| Doküman dili | Türkçe (ayrı repo, ODIN'in ADR-0002'si işlemez) |
| Açık kararlar | 13/13 kapandı — UI-ADR-069…085 |
