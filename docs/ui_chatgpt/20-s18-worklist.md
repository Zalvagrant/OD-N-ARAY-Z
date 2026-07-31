# S18 — Ölçülebilirlik ve Kaynak Doğruluğu · çalışma kaydı

> **Durum: HAZIRLIK — sahip onayı bekliyor. Hiçbir iş başlamadı.**
> Bu belge 1 Ağustos 2026 ölçümü + meclis oturumundan üretildi.
> Kod yazılmadı (hazırlık oturumu kuralı).

---

## 0. Planda ne diyordu, ne oldu

`15-execution-plan.md` sprint numaraları gerçek sprint'lerle örtüşmüyor.
Ölçüm sonucu S11 ve S12 çoktan `origin/main`'de; plan bunları hiç yazmıyor.

### Ölçüm tablosu — 1 Ağustos 2026, komut çıktısı

| Ölçüm | Sonuç | Not |
|---|---|---|
| UI `origin/main` | `700ce1d` — *fix(UI-ADR-152): bağımsız denetim* | 6 saat önce `35bbf54`'tü |
| En yüksek UI-ADR | **152** → sıradaki **153** | prompt "152'den başla" diyordu, çakışacaktı |
| UI `test:ci` → unit | ✅ **AÇIK** — 16 dosya / 234 test (alt sınır 230) | |
| UI `test:ci` → storybook | ❌ **KAPALI** — 195 test, 1 düştü | düşen test **untracked WIP** dosyasında (`goals/screen.stories.tsx`) → `origin/main`'in kendi kapısı etkilenmiyor |
| UI çalışma ağacı | ⚠️ **KİRLİ** — 5 değişmiş + 2 untracked dosya (177 satır) | başka bir oturumun devam eden işi olabilir |
| ODIN `main` | `77c6ecc` (ADR-0167) | |
| ODIN sıradaki ADR | **0169** | `adr-0168` dosyası **untracked** ama numarayı tüketiyor |
| ODIN çalışma ağacı | ⚠️ kirli — `odin/curation.py`, `tests/test_curator.py`, `request-registry.md` | |
| `/api/state` | 39 anahtar | |
| `/api/amazon` | coverage **2/3**, 11 KPI, 48 SKU, 1 alarm | |
| `telemetry.jsonl` | **3** `provider.call` · **0**'ında `cost_known:true` | token DOLU (155/25), `cost_usd` null |

### Ölçümün çürüttüğü iki iddia

**1. "health_score tek sayı" — YANLIŞ.** İki skor zaten var:

| | Skor | Kapsam | Bileşenler |
|---|---|---|---|
| İş ekseni | 68 | 6/6 | Gelir 36 · Müşteri memnuniyeti 100 · Kâr 78 · Büyüme 100 · Nakit akışı 26 · Borç 68 |
| **Sistem ekseni** (`operational`) | 68 | 4/4 | Stok sağlığı 92 · AI hazırlığı 100 · Workspace erişimi 50 · Bilgi akışı 30 |

Kaynak: `odin/briefing.py:83 operational_readiness_score()`, ADR-0129.
İkisinin de 68 çıkması **tesadüf** — aritmetikle doğrulandı: 408/6 = 68.0 ve 272/4 = 68.0.

→ **C-2 "yeni skor kur" değil, "mevcut `operational`ı 4 eksenden 8 eksene genişlet".**

**2. "health_score detail metinleri bozuk" (eski BULGU 3) — ÇÜRÜDÜ.**
Ham HTTP baytında geçerli UTF-8 var (`şİğüöç`), U+FFFD yok, mojibake imzası
(0xC3 0x83) yok. Sorun **konsol kod sayfası**, veri değil. S18 konusu DEĞİL.

### Sekiz eksen — ölçülebilirlik (ölçüldü, varsayılmadı)

| Eksen | Durum | Kanıt |
|---|---|---|
| Runtime | ✅ ölçülebilir | `state.health` (last_seq 2094, event_log_bytes, last_event_ts) + `loop_steps`(9) + `phases`(4) |
| Amazon | ✅ ölçülebilir | `/api/amazon` coverage 2/3, 11 KPI, 48 SKU |
| Finance | ✅ ölçülebilir | `state.finance_position` (cash_try 93.600, provenance'lı) + `contribution_margin` (%31,4) |
| Directors | ⚠️ kısmi | `state.directors` 8 kayıt (status/lastBeat/failuresTotal dolu) **ama `state.agents` = [] boş** |
| Memory | ⚠️ kısmi | yalnız `staging_stats` {count 306, avg_trust 55.7} |
| Knowledge | ⚠️ kısmi | `state`'te anahtar **yok**; `odin-data/staging`'de 615 json |
| AI | ⚠️ kısmi | `ai_spend` + `providers`(12) var, ama 3/3 çağrıda `cost_known:false`; router modülü yok |
| Security | ❌ **ölçülemez** | `state`'te güvenlik anahtarı yok. `legal`(11) hukuktur, `risks`(3) genel risktir — ikisi de güvenlik değil |

**Ölçülebilir 3 · kısmi 4 · ölçülemez 1.** Sekiz eksenin hiçbiri
"varsayılarak" skor üretmeyecek (sahip kuralı; R-006'da "nötr 50" çürütülmüştü).

---

## 1. Bloklar

Sıra **terra**'nınki (bkz. §3 çelişki kaydı): baz hattı önce, çünkü kirli
ağaç üzerinde alınan her ölçüm sahte.

> **SAHİP KARARI — S18 beş bloktur ve kapsam kilitlendi (1 Ağu 2026):**
> B1 Repository Baseline · B2 Generated CLAUDE.md · B3 Commit Guard ·
> B4 Operational Score (C-2) · B5 Session Lease Detection.
>
> **Kilitleyici ilke: S18 yalnızca GÖRÜNÜRLÜK sağlar; S19 YAPTIRIM getirir.**
> Bu ayrım B5'te en keskin: tespit ve uyarı S18, read-only/force-lock/
> kill-session/otomatik worktree S19. Aynı ilke B3 için de geçerli —
> guard raporlar ve reddeder, ortamı yeniden yapılandırmaz.

### B1 — Repository Baseline  *(ön koşul, ürün işi değil)*

> **✅ KENDİ KENDİNE ÇÖZÜLDÜ — hazırlık oturumu sürerken.** Kirli dosyaların
> sahibi belirlendi: başka oturumlardı ve ikisi de işini indirdi.
> UI WIP → `1aa1a65` **UI-ADR-153** "muafiyetler kaldırıldı — kapılar artık
> boşluk bırakmıyor" (UI-ADR-152'nin "kabul edildi ama yapılmadı" maddeleri).
> ODIN WIP → `b139b36` **ADR-0169**. Her iki ağaç şu an **temiz**.
> Geriye kalan tek iş: storybook alt sınırının temiz ağaçta yeniden ölçülmesi.

- **Girdi:** ~~UI'da 5 değişmiş + 2 untracked · ODIN'de 3 değişmiş + `adr-0168` untracked~~ → hepsi commit edildi
- **Çıktı:** storybook alt sınırı **temiz `origin/main`'den** yeniden ölçülmüş ve commit'li
- **Kontrol:** `git status --porcelain` boş; `npm run test:ci` temiz ağaçta koşuyor
- **Done:** kapı yeşili WIP'ten değil, `origin/main`'den geliyor

### B2 — Generated CLAUDE.md  *(C-1)*

- **Girdi:** `CLAUDE.md`'deki elle yazılan sprint tablosu (bugün **dört** yerde yanlış — §2)
- **Çıktı:** `tools/sprint_board.py --write` / `--check`; `CLAUDE.md`'de
  `<!-- SPRINT-BOARD:BEGIN/END -->` bloğu

- **Kontrol:** `--check` byte-level karşılaştırma yapar (regex ile gevşek eşleşme YOK);
  BEGIN/END tam birer kez, sırayla; marker dışına yazmayı reddeder;
  kontrol karakterleri (U+0000–U+001F, newline/tab hariç) reddedilir
- **Done:** pano elle güncellenmiyor; `--check` `test:ci` zincirinde koşuyor ve kırmızı yanabiliyor

**Panoya ne yazılır (sahip kararı):** ham test sonucu **YAZILMAZ** — yoksa
pano her koşuda kirlenir ve `--check` sürekli kırmızı yanar. Panonun taşıdığı
alanlar sabittir:

| Alan | Kaynak | Neden bu |
|---|---|---|
| `Last Measurement` | ölçümü yapan commit'in SHA'sı | sonucun kendisi değil, **kim ölçtü** |
| `Commit` | `git rev-parse` | pano hangi ağacı anlatıyor |
| `Coverage` | `measured/expected` | ADR-0129'un formu |
| `Threshold` | `verify-tests.mjs` alt sınırı | 190/230 gibi kalibrasyon değeri |
| `Generated At` | üretim zamanı | bayatlığın kendisi görünür olur |

Alt sınır kalibrasyon değeridir, tercih değil — düşürmeden önce soğuk ölç
(UI-ADR-142 dersi).

**Kaynak otoritesi** (tek kaynak yok — her bilgi farklı yerden):

| Bilgi | Otorite | Neden |
|---|---|---|
| Merged ADR'ler | `origin/main`'deki tracked ADR dosyaları | |
| ADR numara tahsisi | dosya sisteminde `adr-*.md`, **untracked DAHİL** | `adr-0168` untracked ama numarayı tüketiyor |
| Yayında mı | `git merge-base --is-ancestor <commit> origin/main` | |
| Sprint işi/durumu | tracked worklist / decision-log | |
| ~~`git branch --merged`~~ | **KULLANILMAZ** | silinmiş branch ve squash-merge ilişkiyi kaybettirir |
| ~~`git tag`~~ | yalnız release bilgisi | sprint durumu için kaynak değil (repoda 6 tag var ama sprint'i anlatmıyorlar) |

**Nerede koşar:** ikisi de, farklı amaçla. Pre-commit untracked ADR + kirli
ağacı yakalar (atlanabilir, güvenlik kapısı değil); `test:ci` commit'li
panonun kaynaklardan türediğini doğrular (**nihai otorite**).

### B3 — Commit Guard  *(arayüz reposu DAHİL)*

- **Girdi (ölçüldü):**

  | | Çekirdek | Arayüz |
  |---|---|---|
  | `core.hooksPath` | ✅ `tools/hooks` | ❌ **boş** |
  | pre-commit | ✅ `tools/precommit.py` (138 satır) | ❌ **yok** |
  | Mevcut kontroller | yetenek karışımı (ADR-0048) · mesajda `ADR-NNNN`/`chore:` · `status --porcelain` ile bekleyen paralel iş | — |

- **Çıktı:** çekirdeğin hook sistemi arayüz reposuna taşınır + iki kontrol eklenir:
  1. **Stage kontrolü** — commit'e senin dokunmadığın dosya giriyor mu
  2. **Dal kontrolü** — beklenen dalda mısın
- **Kontrol:** her kontrol için kasıtlı ihlal enjekte edilip KIRMIZI yandığı kanıtlanır
- **Done:** iki repoda da hook koşuyor; `core.hooksPath` ayarlı; "script var ama koşmuyor" tekrarı yok

> ⚠️ **Zincirin ilk iki halkası hook'la kurulamaz — tasarım bunu varsaymalı.**
> `pwd` ve "doğru repo mu" kontrolleri bir pre-commit hook'una yazılamaz:
> hook, commit'in yapıldığı reponun İÇİNDE çalışır, o seçim çoktan
> yapılmıştır. Yanlış repoda commit atılsaydı o reponun hook'u koşacak ve
> gayet meşru görünen bir commit görecekti.
>
> **1 Ağu'da bu tam olarak yaşandı:** çalışma dizini çekirdek repoydu,
> `git rev-parse --abbrev-ref HEAD` "main" dedi ve `git log -- CLAUDE.md`
> çekirdeğin geçmişini gösterdi. Yakalayan şey hook değil, `git -C` ile
> mutlak yol doğrulamasıydı. Bu bir **ajan davranış kuralıdır**, kapı değil.
>
> Guard'ın gerçekten otomatikleşen değeri 5. halkadır: **yabancı dosya
> stage edilmiş mi.** Aynı gün `git add .` yerine dosya adı kullanıldığı
> için başka bir oturumun `eslint.config.mjs` ve `package.json` değişiklikleri
> commit'e girmedi — bu elle yapıldı, otomatikleşmeli.

### B4 — Operational Score  *(C-2 · ODIN çekirdeği, ADR gerektirir)*

- **Girdi:** `odin/briefing.py:83 operational_readiness_score()`, 4 bileşen, şema `{name, value, detail}`
- **Çıktı:** 8 kanonik eksen; bileşen şeması geriye dönük uyumlu genişletme:
  ```
  {name, value, detail,            ← mevcut; arayüz bunları okumaya devam eder
   status: "measured"|"unmeasurable",
   evidence: {source, fields} | null,
   updated_at}
  ```
- **Kurallar:**
  - `value` yalnız `status=="measured"` iken 0..100; ölçülemeyende **`null`** — asla 0 veya 50
  - `measured`/`expected`/`coverage_ratio` bileşen listesinden **türetilir**, elle sayaç tutulmaz
  - eski 4 bileşen `legacy_components` altında taşınır, **zorla eşlenmez** (Workspace erişimi ≠ Security; Bilgi akışı Memory ile Knowledge arasında bölünemez) ve kanonik skora girmez
  - kapsam tamamlanmadan tek kesin sayı gösterilmez:
    `{score: null, measured_score: 68, measured: 3, expected: 8, coverage: "3/8", score_status: "incomplete"}`
- **Kontrol:** sözleşme testi — 8 eksen mevcut · ölçülemeyende `value=null` · `0/50` fallback yok · eksik kapsamda `score=null`
- **Done:** ADR yazılı, R-006 satırı açık, arayüz `null`'ı 0 gibi göstermiyor

> **Bu kural artık tartışılmıyor — ODIN'de üç kez karara bağlandı.**
> C-2 yeni bir ilke önermiyor, mevcut ilkenin dördüncü uygulaması:
> - **ADR-0129** — `coverage` skorun yanında yayınlanır ki "tek bileşenden 100" ile "hepsinden 100" ayırt edilebilsin
> - **ADR-0156** — `ai_spend` maliyeti bilinmeyen üç çağrı üzerinden `total_usd: 0.0` yayınlıyordu; sıfır ölçüm gibi görünüyordu
> - **ADR-0169** (1 Ağu, `b139b36`) — `TrustScorer.score()` `components.get(name, 0.0)` okuyordu; hiç ölçülmemiş bileşen "sicilini kontrol ettik, yok" gibi görünüyordu
>
> ADR-0169 `briefing.py`'ye **dokunmadı** (son dokunuş ADR-0162) — yani
> `operational` hâlâ 4 eksen; C-2'nin işi duruyor, yalnız gerekçesi kanıtlandı.
- **Modül:** `briefing.py`'de kalır (iki skor mantığı/iki sözleşme oluşmasın); eksen hesaplayıcıları saf `_measure_<eksen>()` fonksiyonları olur

#### B4.1 — Consumer doğrulaması  *(§8'in kararı: daraltıldı, ayrı blok değil)*

**Kabul kriteri (sahip kararı):**

> C-2 kapsamında eklenen **her yeni `/api/state` alanı** için en az bir
> doğrulanmış consumer bulunmalıdır. Consumer yoksa alan **"orphan"** olarak
> raporlanmalı ve sprint kapanışında **görünür** olmalıdır.

Her yeni alan için sorulacaklar — hepsi bu, fazlası değil:

| Soru | Cevap |
|---|---|
| `/api/state` yayınlıyor mu? | ✓ / ✗ |
| Dashboard okuyor mu? | ✓ / ✗ |
| Briefing okuyor mu? | ✓ / ✗ |
| Director kullanıyor mu? | ✓ / ✗ |
| Testi var mı? | ✓ / ✗ |

Sonuç iki değerlidir: **`✓ consumer var`** veya **`ORPHAN`**.

**KAPSAM DIŞI — açıkça:** 39 anahtarın tamamı için consumer grafiği
çıkarmak. O iş `UI → API → Agent → Dashboard → Docs` zincirinin tamamını
açar ve **başlı başına bir sprint konusudur** (S19'un yayın–tüketim
envanteri). B4.1 yalnız C-2'nin **eklediği** alanlara bakar.

**Gerekçe (S8'de birebir yaşandı):** producer ✅ · endpoint ✅ · test ✅ ·
consumer ❌. `httpLoad` ve `useOdinQuery`'nin hiçbir ekran çağıranı yoktu,
ekranda tek bir canlı ODIN değeri görünmüyordu, ve **testlerin geçmesi bunu
gizledi**. API yayınlıyor ama kimse okumuyorsa o alan fiilen yoktur.

> ⚠️ **Çözülen tasarım gerilimi.** "Raporlasın ama yaptırım olmasın" bu
> repoda tehlikelidir: hiç kırmızı yanamayan bir kapı, kapı değildir
> (UI-ADR-152'nin KRİTİK 1'i tam buydu). Ama yaptırım koymak da S18'in
> "görünürlük" ilkesini deler.
>
> **Çözüm — alt sınır örüntüsünü tekrar kullan:** orphan listesi commit'li
> bir kabul listesidir. Kapı, orphan **varlığında** değil, listede
> **olmayan yeni bir orphan belirdiğinde** kırmızı yanar. Bugünkü
> orphan'lar kabul edilmiş sayılır ve görünür kalır; sessizce yenisi
> eklenemez.
>
> Bu, `verify-tests.mjs`'in alt sınır mekanizmasının aynısıdır (FLOOR 140'ta
> unutulunca 53 test sessizce kaybolabiliyordu). Yeni mekanizma değil,
> çalıştığı kanıtlanmış olanın ikinci kullanımı.

### B5 — Session Lease Detection  *(YALNIZ TESPİT)*

- **Girdi (ölçülmüş risk, varsayım değil):** bu hazırlık oturumu sırasında
  aynı worktree **üç kez** başka oturumlar tarafından değiştirildi; commit
  anında `eslint.config.mjs` ve `package.json` altımızdan değişmişti
- **Çıktı:** `SessionStart` hook'u worktree'ye kira yazar
  (`.git/odin-session-lease`: oturum kimliği + zaman damgası).
  Açılışta başka **canlı** kira varsa **UYARIR**.
- **Kontrol:** iki kira aynı anda kurulur, ikincisi uyarı üretir
- **Done:** çakışma ilk saniyede görünür — `git status`'un altından
  değişmesiyle değil

> **YAPTIRIM YOK — S19'a bırakıldı.** S18'de olmayan: read-only mod ·
> force-lock · kill-session · otomatik yeni worktree · kira yenileme ·
> timeout. S18 çakışmayı **görünür** kılar, çözmez.
>
> Altyapı zaten var: `SessionStart` hook'u bu depoda hâlihazırda çalışıyor.
> Yeni mekanizma değil, mevcut kancaya ~30 satır.

---

## 2. `CLAUDE.md` panosunun bugünkü yanlışları  *(B2'den AYRI, elle düzeltilecek)*

C-1 mekanizması bunun **tekrarını** önler; aşağıdaki dört satır **bugünün**
hatasıdır. İkisi ayrı iştir, karıştırılmayacak.

> **SAHİP KARARI (1 Ağu 2026): pano ŞİMDİ elle düzeltilmeyecek.**
> Gerekçe: aynı dosyada devam eden başka çalışma varken düzeltmek gereksiz
> merge çakışması üretir ve pano birkaç saat sonra yine değişir — nitekim
> değişti (§7). Sıra sabit:
> 1. kirli ağacın kaderi belli olsun → **✅ oldu** (B1)
> 2. storybook temiz ağaçta yeniden yeşil ölçülsün
> 3. sprint durumu son kez doğrulansın
> 4. `CLAUDE.md` **tek seferde** güncellensin
>
> Böylece doküman geçici bir anın değil, doğrulanmış repo durumunun
> yansıması olur. İkinci kez dokunmak gerekmez.

| Satır | Diyor | Gerçek |
|---|---|---|
| 213 | S8 "⚠️ dalda" | `origin/main`'de (0 unmerged commit) |
| 214 | S10 "⚠️ dalda" | `origin/main`'de (0 unmerged commit) |
| 215 | S9 "telemetry.jsonl'de **0 model çağrısı**" | **3 çağrı** var, token'lar yayınlanıyor (gerekçe kısmen çürüdü) |
| — | S11 ve S12 panoda **hiç yok** | ikisi de merge edilmiş |

---

## 3. Meclis kaydı

**Katılım:** gavadolar 2/2 (terra, luna) · yazılımcılar **2/4** cevap verdi
(terra, Qwen) — DeepSeek 529 overloaded, Gemini-Flash bozuk çıktı üretti.
Karar bu nedenle **2 gerçek cevap** üzerinden alındı.

### Hemfikir oldukları

- C-1 + C-2 S18'in **çekirdeği ama tamamı değil**; yanına baz hattı ve envanter girer
- C-2 = mevcut `operational`ın genişletilmesi, yeni skor değil
- **AI maliyet paneli YAPILMAZ** — 3/3 çağrıda `cost_known:false`, panel sahte-veri kuralını ihlal eder
- Decision Center · Finance/Trading workspace · Tablet/Mobile · geniş Hardening S18'e **girmez**

### Çelişkiler

| # | Çelişki | Hüküm |
|---|---|---|
| 1 | Sıra: terra 1→2→3→4 (baz hattı önce) · luna C-2 önce | **terra kazandı** — ölçüm gösteriyor ki kirli ağaçta alınan storybook sonucu yanıltıcıydı; baz hattı alınmadan C-2'nin kapısı da ölçülemez |
| 2 | terra AI Gateway'i tamamen S19'a atıyor · luna "panel değil ama telemetri temeli S18'de" | **terra kazandı, luna'nın şartı korunarak** — S18'de AI ekseni `status:"unmeasurable"` taşır; `cost_reason` alanı S19 Gateway'in ilk kabul kriteri olur |

### Ölçümle ÇÜRÜTÜLEN görüşler *(kaybettiler, gerekçesi yazılı)*

| İddia | Kim | Neden çürüdü |
|---|---|---|
| "Yeni eksenler için `value: 0` veya `nan` koy" | Qwen | **Sahip kuralına doğrudan aykırı.** 0/50 yasak; R-006'da "nötr 50" zaten çürütülmüştü |
| "`git tag` yalan söyleyemez, en güvenilir kaynak" | Qwen | Repoda 6 tag var ama hiçbiri sprint durumu anlatmıyor; tag release bilgisidir. terra'nın ayrımı doğru |
| "Storybook `--ci` flag'i v6'da yok, v7 ile zorla" | Qwen | Repo **Storybook 10.5.5** — tavsiye iki ana sürüm bayat |
| "`components` şemasına per-component `measured/expected` ekle" | Qwen | `measured`/`expected` **toplam** alanlardır; bileşen başına taşımak coverage'ı iki yerden üretir |

**Meclis sentezi ADR değildir.** Önce ADR, sonra kod.

---

## 4. Karar listesi *(numaralar ÖLÇÜLEREK alınacak, burada rezerve edilmiyor)*

Numara tahsisinden **önce** `08-decision-log.md`'nin SONUNA ve
`origin/main`'e bakılacak — bu dosyada sekiz kez numara çakıştı.

| Karar | Nerede | Konu |
|---|---|---|
| UI-ADR (sıradaki, ölçümle) | arayüz | Sprint panosu üretilen + CI'da doğrulanan olur; marker bloğu sözleşmesi |
| UI-ADR (sıradaki+1) | arayüz | Arayüz `value: null`'ı 0 olarak göstermez; `score_status:"incomplete"` gösterim formu |
| **ODIN ADR (sıradaki)** | çekirdek | `operational` 4→8 eksen; ölçülemeyen eksen skor üretmez; `legacy_components` geçişi. ADR-0169'un ilkesini `briefing.py` yüzeyine taşır |

> **Numaralar bu oturumda üç kez tükendi.** Hazırlık başladığında sıradakiler
> UI-ADR-152 ve ADR-0166'ydı; şu an UI-ADR-**154** ve ADR-**0170**. Bu yüzden
> tabloda numara yazılmıyor — tahsis anında ölçülecek.
| R-006 satırı | çekirdek | ADR-0050 gereği: C-2 mimariye dokunuyor → tipli istek satırı |

---

## 5. Kapsam DIŞI — ve neden

| Dışarıda | Neden (ölçümle) |
|---|---|
| AI Gateway implementasyonu + maliyet paneli | 3/3 çağrıda `cost_known:false` → panel sahte veri olur |
| Decision Center · HQ · Settings | `/api/state`'in hangi kısmının tüketildiği bilinmiyor; yeni karar yüzeyi kopukluğu büyütür |
| Knowledge / Memory ürün yüzeyleri | Knowledge `state`'te yok, Memory yalnız `staging_stats`; önce C-2 ölçümü |
| Finance + Trading workspace | F10'un tanımı yok; kabul kriteri ve risk sınırı tanımsız |
| Tablet / Mobile | UI kapıları yeni onarıldı, storybook sonucu WIP'ten etkileniyor |
| Geniş H13 Hardening → v1.0 | S18'in ölçüm altyapısı bitmeden anlamlı kabul kriteri üretilemez |
| Eski BULGU 3 (bozuk metinler) | **Çürüdü** — veri temiz, konsol artefaktı |
| **Memory Validation** | **Katman karışması.** Hafıza `~/.claude/projects/.../memory/` altında — iki reponun da DIŞINDA, versiyonlanmıyor, makineye özel. Bir git hook'u ona sahip olamaz; ODIN'in ürün mimarisi de değil. Bu bir **harness (Claude Code hook)** işidir, ODIN sprinti değil. S18'den bağımsız yapılabilir |
| B5'in yaptırım katmanı | read-only · force-lock · kill-session · otomatik worktree · kira yenileme · timeout → **S19**. S18 görünürlük, S19 yaptırım |

---

## 6. Done — hangi şartlarda kapanır

S18 kapanış kapısı **tek bir yeni script değil**, `test:ci` zincirine
bağlanan zorunlu alt kapılardır. Bu repoda kapıların kendisi **yedi kez**
yanlış çıktı (görünmez 0x08 baytı · bayrağa bağlı kapı · iskelette çözülen
çapa · hiç koşmayan lint · FLOOR'un ölçümün 53 altında kalması) — bu yüzden
kapının kendisi de kanıt ister.

1. Ölçümler **temiz baz hattında** alınmış
2. Storybook alt sınırı temiz `origin/main`'den yeniden hesaplanmış ve commit'li
3. Lint **gerçekten** zincirde koşuyor — script'in varlığı değil, exit code'u zorunlu
4. `sprint_board --check` başarılı; marker + görünmez bayt + merge-conflict kontrolleri geçiyor
5. ADR numara taraması: yerelde tracked+untracked, CI'da tracked + tekrar/sıra doğrulaması
6. C-2 sözleşme testleri geçiyor (8 eksen · `null` · `0/50` yok · eksik kapsamda `score=null`)
7. `/api/state` envanteri üretilmiş çıktıyla eşleşiyor

**Kapıyı kim doğrular:** kapının yazarı değil. Her kapı için **kasıtlı
negatif fixture** gerekir ve her birinin CI'da gerçekten KIRMIZI yandığı
kanıtlanmadan kapı kabul edilmez:

- marker içinde 0x08 baytı · bozuk marker sırası · bayat pano
- düşürülmüş storybook alt sınırı · lint hatası
- `value:50, status:"unmeasurable"` · aynı numaralı iki ADR

Son olarak kapı komutunun `test:ci` **tarafından çağrıldığı** test edilir —
"script var ama hiç koşmuyor" tekrarına izin verilmez (UI-ADR-152'nin
KRİTİK 1'i tam buydu).

---

## 7. C-1'in gerekçesi: ağaç bu hazırlık oturumu SÜRERKEN üç kez hareket etti

C-1 teorik bir iyileştirme değil. Tek bir hazırlık oturumu boyunca ölçülen
gerçek hareket:

| Zaman | Arayüz `origin/main` | ODIN `main` | Sıradaki numaralar |
|---|---|---|---|
| Prompt yazıldığında | `35bbf54` (UI-ADR-151) | `f1d6385` (ADR-0165) | UI 152 · ODIN 0166 |
| Ölçüm yapıldığında | `700ce1d` (UI-ADR-152) | `77c6ecc` (ADR-0167) | UI 153 · ODIN 0169 |
| Meclis bittiğinde | `1aa1a65` (UI-ADR-153) | `b139b36` (ADR-0169) | UI 154 · ODIN 0170 |

**Üç saatte iki repo, dört sprint numarası.** Prompt'un içine yazılmış
`ADR-0166` ve `UI-ADR-152` sabitleri, yazıldıktan birkaç saat sonra
çakışacak numaralardı — ikisi de kullanılmadan önce yakalandı, ama elle
yakalandı.

Elle tutulan hiçbir pano bu hızı takip edemez. Bu, C-1'in kendisinden daha
güçlü bir kanıt: pano bayat olduğu için değil, **bayatlaması kaçınılmaz
olduğu için** türetilmeli.

Aynı ölçüm ikinci bir şeyi de gösteriyor: bu depoda **eşzamanlı oturumlar**
çalışıyor. B1'in kirli dosyaları kimseye sorulmadan çözüldü çünkü sahipleri
kendi oturumlarındaydı. C-1 tasarımı bunu varsaymalı — pano tek bir oturumun
gerçeğini değil, `origin/main`'in gerçeğini yazmalı.

---

## 8. ~~AÇIK SORU~~ → KAPANDI: 3. seçenek onaylandı

> **SAHİP KARARI (1 Ağu 2026): B4'ün içine daraltıldı — `B4.1 Consumer
> doğrulaması`.** Altıncı blok açılmadı, S19'a da tamamen bırakılmadı.
> Gerekçe: altıncı blok `/api/state`'in 39 anahtarı için tam consumer
> grafiği demektir ve bu başlı başına bir sprint konusudur; S19'a tamamen
> bırakmak ise S8'de ölçülmüş gerçek riski bir sprint boyunca açık tutardı.
> Kabul kriteri ve kapsam sınırı **B4.1**'de.

Aşağıdaki tartışma kaydı, kararın nasıl alındığını gösterdiği için duruyor.

### Sorunun kaydı

Sahibin kilitlediği beş blok listesinde **`/api/state` yayın–tüketim
envanteri yok.** Bu hazırlığın ilk sürümünde dördüncü blok oydu. Sessizce
düşürmüyorum, çünkü meclisin iki kurulu da onu **C-2'nin ön koşulu** saydı:

> terra: *"Bu çalışma C-2'nin yeni sistem-sağlığı alanlarının 'yayınlandı ama
> görünmüyor' durumuna düşmesini engeller."*
> luna: *"Yayınlanan ama gösterilmeyen veri de önemlidir: kullanılmayan
> sözleşme, gizli operasyonel risk ve gereksiz API yüzeyi oluşturur."*

Somut riski: B4 sekiz ekseni `/api/state`'e yayınlayacak. Envanter yoksa
yeni eksenlerin ekranda karşılığı olup olmadığı **ölçülmez** — ve bu tam
olarak S8'de yaşanan hatadır (boru ve kapılar teslim edildi, `httpLoad`'un
hiçbir ekran çağıranı yoktu, testler bunu gizledi; CLAUDE.md'nin 6. sprint
sorusu bu yüzden var).

Ölçülmüş durum: `/api/state` **39 anahtar** yayınlıyor, arayüz tüketim
eşlemesi ölçülmemiş — yani "kaçı ekranda karşılıksız" sorusunun cevabı
bugün **BİLİNMİYOR** (meclis de sayı tahmin etmeyi reddetti).

Üç seçenek:
1. **Altıncı blok olarak S18'e girsin** — B4'ün ön koşulu olduğu için
2. **S19'a gitsin** — S18 zaten beş blok; envanter yaptırım değil ölçüm,
   ama B4 onsuz kör bir yüzey yayınlayabilir
3. **B4'ün içine daralt** — yalnız C-2'nin eklediği alanların ekran
   karşılığı doğrulansın, 39 anahtarın tamamı değil

**Karar: 3. seçenek.** Yukarıdaki kutuya bakın — B4.1 olarak kapandı.
