# Yeni Oturum İçin Hazır Görev Metni — Merkez Kurulumu

> **Nasıl kullanılır**
>
> 1. Bu oturumu **ODIN repo klasöründe değil**, ev dizininde aç (`cd ~` sonra `claude`).
>    Sebep: repo içinde açarsan `OD-N-ARAY-Z/CLAUDE.md` devreye girer, ajan seni
>    arayüz işine çekmeye çalışır. Bu iş repo işi değil, makine kurulumu.
> 2. Aşağıdaki `---` çizgileri arasındaki metnin **tamamını** kopyala, yapıştır, gönder.
> 3. Gerisini o oturum yapar.

---

GÖREV: Bilgisayarımdaki Claude Code kurulumuna 5 paket ekleyeceğiz. Sadece bu iş.
Başka hiçbir şey yapma.

BAĞLAM
Yazılım bilmiyorum; kararları ben veriyorum, kodu sen yazıyorsun. Bu 5 paket,
GitHub'da yıldızladığım 148 repo tek tek incelenerek seçildi. Üçü Anthropic'in
resmî marketplace'inden geliyor. Amacım ajanın davranışını iyileştirmek:
tahmin etmek yerine bana sorsun, gereksiz kod yazmasın, bittiğini söylemeden
önce kendini doğrulasın, ve bana öğretebilsin.

ADIM 0 — ÖN KONTROL
Şu üçünü çalıştır ve çıktıyı bana göster:
  claude --version
  claude plugin marketplace list
  claude plugin list
`claude-plugins-official` listede yoksa şunu ekle:
  claude plugin marketplace add anthropics/claude-plugins-official

ADIM 1 — RESMÎ MARKETPLACE'TEN İKİ PAKET
  claude plugin install superpowers@claude-plugins-official
  claude plugin install mattpocock-skills@claude-plugins-official

ADIM 2 — ANTHROPIC BELGE BECERİLERİ
  claude plugin marketplace add anthropics/skills
  claude plugin install document-skills@anthropic-agent-skills

ADIM 3 — KARPATHY DAVRANIŞ KURALLARI
  claude plugin marketplace add forrestchang/andrej-karpathy-skills
  claude plugin install andrej-karpathy-skills@karpathy-skills

ADIM 4 — DOĞRULAMA
  claude plugin list
Sonra her paket için `claude plugin details <ad>@<marketplace>` çalıştır ve bana
TÜRKÇE bir tablo ver:
  | Paket | Bana gelen komutlar (ben yazacağım) | Otomatik devreye girenler | Hook var mı |
Komut adlarını tam yaz (önekleriyle birlikte, ör. `/mattpocock-skills:teach`).
Tahmin etme — `plugin details` çıktısında ne yazıyorsa onu yaz.

ADIM 5 — KAPANIŞ
Bana şunu söyle: değişikliklerin bu oturumda etkinleşmesi için `/reload-plugins`
yazmam gerekiyor mu, yoksa Claude Code'u yeniden başlatmam mı daha temiz.

KURALLAR — İSTİSNASIZ
1. Yukarıdaki listede olmayan HİÇBİR plugin, marketplace, skill veya araç ekleme.
   Aklına iyi bir fikir gelse bile önce bana sor.
2. Hiçbir `CLAUDE.md` dosyasına dokunma. Özellikle karpathy reposundaki
   `curl ... >> CLAUDE.md` yöntemini KULLANMA — plugin yolunu kullan.
3. Kurulum kapsamı: user scope (makine geneli). `--scope` ile oynama.
4. Bir komut hata verirse DURMA ve kendi kafana göre alternatif deneme.
   Hatanın tam çıktısını bana göster, `/plugin ...` biçimindeki elle yazılacak
   karşılığını yaz, sonraki adıma geç.
5. ODIN veya OD-N-ARAY-Z projesiyle ilgili hiçbir şey yapma. Dosya açma,
   repo klonlama, kod yazma yok. Bu oturum sadece kurulum.
6. İş bitince bana özet ver: ne kuruldu, ne kurulamadı, neden.

BİTİRDİKTEN SONRA BANA ŞUNLARI HATIRLAT
- `handoff` komutunu her oturum sonunda kullanmalıyım — oturumlar arası kopukluk
  benim en pahalı sorunum.
- `grill-me` komutunu fikir verdiğimde, kod yazılmadan önce kullanmalıyım.
- `teach` komutunu anlamadığım bir konu olduğunda kullanmalıyım.
- Karpathy paketi bana soru soracak; "sen bilirsin" dersem paketi işlevsiz
  kılarım. İki cümlelik cevap yeterli.
- superpowers plan yazmayı sever, ben ise çalışan kod isterim. Plan yazmaya
  başlarsa "plan değil kod" derim; ısrar ederse
  `/plugin disable superpowers@claude-plugins-official` ile kapatırım.
- Bir hafta sonra `/plugin` → Installed sekmesine bakacağım; "Not used recently"
  altında duran paketi sileceğim.

---

## Bu metnin arkasındaki gerekçeler

Kurulum kararı verilirken doğrulanan noktalar (2 Ağu 2026):

| Paket | Kaynak | Neden seçildi | Risk |
|---|---|---|---|
| `superpowers` | Resmî marketplace (MIT, Jesse Vincent) | Bitmeden doğrulama disiplini: `verification-before-completion`. Sprint sonu sorduğum "Çalışıyor mu? Hata var mı?" sorularının ajana gömülmüş hâli | Session-start hook'u var, ilk mesajdan itibaren devrede |
| `mattpocock-skills` | Resmî marketplace (MIT) | `teach` · `grill-me` · `handoff` · `to-spec`. Yazılım bilmeyen ama hızlı öğrenen biri için listedeki tek doğrudan öğrenme aracı | Düşük |
| `document-skills` (`anthropics/skills`) | Anthropic | docx · pdf · pptx · xlsx. Tedarikçi dosyaları, rapor, sunum | Yok |
| `andrej-karpathy-skills` | `forrestchang/...` (MIT, tek markdown) | Varsayımını söyle, tahmin etme, sor · sade tut · sadece isteneni değiştir · doğrulanabilir ölçüt koy | Yok, çalışan kod içermiyor |
| `claude-plugins-official` | Anthropic | Zaten kurulu geliyor. Kurulum değil, kontrol | Yok |

**Kurulmayanlar ve nedenleri:** `claude-mem` (5 hook + yerel servis + iki veritabanı
— getirisi yüksek ama bozulursa tamir edemem, ikinci tura kaldı) · `spec-kit`
(`docs/ui_chatgpt/` zaten aynı işi yapıyor, iki anayasa olmaz) · `gstack`
(kurulumu proje CLAUDE.md'lerini kendi değiştiriyor) · `addyosmani/agent-skills`,
`everything-claude-code`, `ponytail` (superpowers ile çakışır — asıl tehlike kötü
skill değil, çakışan skill) · `treehouse`, `axi` (biri curl ile ikili kuruyor ve
genç bir repo, diğeri CLI yazanlar için).

**Ölçüm:** kurulumdan sonra somut bir ODIN işi yapılacak — S18'in "sprint panosunu
Git'ten türet" maddesi (`20-s18-worklist.md` §B2, C-1). Hızlanma olmazsa paketler
kaldırılacak. Çıkarmak eklemekten ucuz.

**Sınır:** bu paketlerin hiçbiri denenmedi, sadece kaynakları ve kurulum yöntemleri
okundu. Yıldız sayıları iki kaynakta çeliştiği için hiçbir seçim popülerliğe
dayandırılmadı.
