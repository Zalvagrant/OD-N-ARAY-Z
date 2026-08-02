# GitHub'ta Beğendiğin (Yıldızladığın) Repolar — Ne İşe Yarıyorlar

> Kaynak: `github.com/Zalvagrant?tab=stars`, 2 Ağustos 2026 itibarıyla
> çekildi. **148 repo**, 5 sayfa.
>
> İlgi sütunu: 🟢 = ODIN / bu arayüz için doğrudan işine yarar ·
> 🟡 = dolaylı, ileride işine yarayabilir · ⚪ = bu projeyle ilgisi yok
> (kişisel merak / arşiv).

---

## Önce özet: 148 yıldızın dağılımı

| Küme | Adet | Tek cümlede |
|---|---:|---|
| Agent harness / runtime / orkestrasyon | 28 | Kod ajanlarını çalıştıran kabuklar — en kalabalık küme |
| Skill & plugin kütüphaneleri | 24 | Claude Code / Codex için hazır beceri paketleri |
| Öğrenme kaynakları & awesome listeleri | 14 | Referans arşivi, çalışılacak malzeme |
| Genel altyapı & frontend | 16 | React, Svelte, Flutter, n8n, arrow… |
| Doküman / medya üretimi | 10 | Markdown, PPT, video, ses |
| Web scraping & veri toplama | 7 | Firecrawl, Scrapling, Amazon scraper'lar |
| Bellek & kod grafiği | 7 | Ajanlara kalıcı hafıza / kod bilgisi |
| **Amazon satıcılığı** | **7** | **ODIN'in iş alanı — en kritik küme** |
| Tasarım / UI üretimi | 8 | design.md, impeccable, ui-ux-pro-max |
| Finans / trading / karar | 6 | Karar zekâsı tarafına en yakın olanlar |
| LLM gateway / router | 4 | Çok sağlayıcılı tek uç nokta |
| Token / maliyet optimizasyonu | 5 | Ajan maliyetini düşürme |
| Güvenlik | 5 | Pentest, OSINT, sistem promptu arşivi |
| ML / model / araştırma | 5 | Inference motorları, vision modelleri |
| Spec-driven geliştirme | 2 | OpenSpec, spec-kit |
| Konu dışı / arşiv | 10 | 3D baskı, CAD, R kaynağı, eski deneyler |

**En çarpıcı okuma:** 148 yıldızın **~90'ı** (%60) tek bir temanın etrafında
— *AI ajanlarını nasıl daha iyi çalıştırırım*. Amazon/ODIN'in kendi iş
alanına dokunan repo sayısı ise **13** (7 Amazon + 6 finans). Yani yıldız
koleksiyonun bir "işletme aracı kütüphanesi" değil, bir **"ajan mühendisliği
kütüphanesi"**.

---

## 1. Amazon satıcılığı — ODIN'in doğrudan iş alanı 🟢

Bu küme senin için diğer 141 repodan daha değerli: ODIN'in `spapi.py`
adaptörünün beslediği alan burası.

| Repo | Ne yapar | Sana ne işe yarar |
|---|---|---|
| `amzn/ads-advanced-tools-docs` | Amazon Ads gelişmiş araçlar merkezinin resmî kod örnekleri | 🟢 **En değerlisi.** ODIN'de PPC sözleşmesi henüz yayınlanmıyor (`backend-istekleri.md`); Ads API'nin resmî örnekleri o boşluğu doğru doldurmanın referansı |
| `nexscope-ai/Amazon-Skills` | Amazon satıcıları için ajan becerileri: keyword araştırma, rakip analizi, listing denetimi | 🟢 ODIN'in Amazon Director'ünün hangi kararları vermesi gerektiğine dair hazır bir yetenek envanteri |
| `ScaleLeap/awesome-amazon-seller` | Amazon satıcı araç ve kaynak listesi | 🟢 Rakip/tamamlayıcı araç taraması — ODIN'in neyi yeniden icat etmemesi gerektiğini gösterir |
| `smart-seller/awesome-amazon-seller-tools` | Aynı temanın ikinci listesi | 🟡 Yukarıdakiyle büyük ölçüde çakışır |
| `oxylabs/amazon-scraper` | Arama, ürün, teklif, yorum, best-seller verisi çeken ticari scraper API | 🟡 SP-API'nin **vermediği** alanlar (rakip fiyatı, yorum metni) için plan-B. Dikkat: ToS riski, ODIN'in kanıt zorunluluğuyla (ADR-0081) uyumu ayrı sorgu ister |
| `dynamohuang/amazon-scrapy` | Best-seller ürünlerin detay ve en düşük fiyatını çeken Python spider | ⚪ Eğitim değeri var, üretim değeri düşük |
| `KushalVijay/AmazonCrackedResource` | Amazon **iş mülakatı** soruları | ⚪ Satıcılıkla ilgisi yok, isim benzerliği |

---

## 2. Finans, trading ve karar zekâsı 🟢🟡

ODIN bir *Decision Intelligence Standard*; bu repolar aynı problemi başka
sektörde çözüyor.

| Repo | Ne yapar | Sana ne işe yarar |
|---|---|---|
| `TauricResearch/TradingAgents` | Çok ajanlı LLM finansal işlem çerçevesi | 🟢 **Meclis/consensus mimarisinin referans uygulaması.** ODIN'in `IConsensusEngine`'i ile aynı fikir; minority opinion nasıl gösterilir sorusuna örnek |
| `anthropics/financial-services` | Anthropic'in finansal hizmetler plugin paketi | 🟢 Kurumsal karar ekranlarının nasıl sunulduğuna dair birinci elden örüntü |
| `Fincept-Corporation/FinceptTerminal` | Piyasa analitiği + yatırım araştırması + ekonomik veri terminali | 🟢 **Arayüz referansı.** "Terminal estetiği + yoğun veri" senin Mission Control ekranının komşusu |
| `HKUDS/Vibe-Trading` | Kişisel trading ajanı | 🟡 Tek kullanıcılı ajan akışı örneği |
| `ZhuLinsen/daily_stock_analysis` | LLM destekli çok pazarlı hisse analizi + karar panosu | 🟡 "Karar panosu" düzeni fikir verir |
| `ccxt/ccxt` | 100+ kripto borsası için birleşik trading API | ⚪ ODIN kripto ile ilgilenmiyor |

---

## 3. Agent harness / runtime / orkestrasyon — koleksiyonun kalbi 🟡

28 repo. Hepsi aynı soruyu farklı yanıtlıyor: *birden çok kod ajanı nasıl
paralel çalıştırılır?* ODIN'in kendisi için değil, **ODIN'i geliştirme
şeklin** için işine yararlar.

| Repo | Ne yapar | Sana ne işe yarar |
|---|---|---|
| `warpdotdev/warp` | Terminalden doğmuş agentic geliştirme ortamı | 🟡 Bu kümenin en olgunu; günlük çalışma ortamı adayı |
| `stablyai/orca` | Paralel ajan filosu için ADE, kendi aboneliğinle | 🟡 Çok sprintli çalışmada paralel oturum yönetimi |
| `herdrdev/herdr` | "Kod ajanlarının üzerinde yaşadığı runtime" (Rust) | 🟡 Aynı problem, altyapı katmanından |
| `multica-ai/multica` | Kod ajanlarını gerçek takım arkadaşına çeviren yönetilen platform | 🟡 |
| `paperclipai/paperclip` | İş yerinde ajan yönetimi uygulaması | 🟡 |
| `earendil-works/pi` | Birleşik LLM API + ajan döngüsü + TUI + CLI | 🟡 Ajan döngüsünün nasıl yazıldığını okumak için iyi kaynak |
| `can1357/oh-my-pi` | Terminal ajanı: hash-çapalı düzenleme, LSP, tarayıcı | 🟡 "Hash-anchored edit" fikri dosya düzenleme güvenliği için zekice |
| `Hmbown/CodeWhale` | Topluluk güdümlü açık ajan harness'ı | 🟡 |
| `crynta/terax-ai` | 7MB'lık terminal-öncelikli AI geliştirme çalışma alanı | 🟡 Hafiflik iddiası dikkat çekici |
| `garrytan/gbrain` | OpenClaw/Hermes tabanlı ajan çerçevesi | 🟡 |
| `garrytan/gstack` | Garry Tan'ın 23 araçlık Claude Code kurulumu (CEO, Designer, QA rolleri) | 🟢 **Doğrudan kopyalanabilir.** ODIN'in "meclis" fikrinin kod ajanı karşılığı |
| `NousResearch/hermes-agent` | "Seninle büyüyen ajan" | 🟡 |
| `nesquena/hermes-webui` | Hermes'i web/telefondan kullanma arayüzü | 🟡 |
| `fathah/hermes-desktop` | Hermes masaüstü eşlikçisi | 🟡 |
| `maka-agent/maka-agent` | Local-first AI masaüstü asistanı | 🟡 |
| `tinyhumansai/openhuman` | Local-first bellekli kişisel süper zekâ + ajan filosu | 🟡 |
| `odysseus-dev/odysseus` | Kendi sunucunda barındırılan AI çalışma alanı | 🟡 |
| `bytedance/UI-TARS-desktop` | Açık kaynak çok kipli AI ajan yığını | 🟡 Ekran/GUI kontrolü tarafı |
| `777genius/agent-teams-ai` | Ajanlar birbirine mesaj atıp birbirinin işini denetliyor | 🟢 **Meclis 2/2 kuralının** teknik karşılığı; peer-review akışı |
| `ColeMurray/background-agents` | Açık kaynak arka plan ajan sistemi | 🟡 |
| `ruvnet/ruflo` | Çok oyunculu ajan sürüleri için meta-harness | 🟡 |
| `msitarzewski/agency-agents` | Frontend/Reddit vb. uzman ajanlardan oluşan tam ajans | 🟡 |
| `kunchenguid/firstmate` | "Tek ajanla konuş, ekiple teslim et" | 🟡 |
| `kunchenguid/treehouse` | Worktree'leri yönetmeden worktree yönetimi | 🟢 **Somut fayda:** bu repoda sekiz kez ADR numarası çakıştı; kök neden paralel dallar. Worktree hijyeni tam da o sorunu hedefliyor |
| `kunchenguid/gnhf` | "Yatmadan önce ajanlarıma iyi geceler diyorum" | ⚪ Espri/deneysel |
| `esengine/DeepSeek-Reasonix` | DeepSeek yerlisi terminal kod ajanı | 🟡 |
| `BigPizzaV3/CodexPlusPlus` | Codex uygulaması için geliştirme aracı | 🟡 |
| `farion1231/cc-switch` | Birden çok AI kodlama platformu için masaüstü anahtarlayıcı | 🟡 |
| `Alishahryar1/free-claude-code` | Claude Code/Codex/Pi'yi terminalden ücretsiz kullanma | ⚪ Lisans/ToS grisi |

---

## 4. Skill & plugin kütüphaneleri 🟡

| Repo | Ne yapar | Sana ne işe yarar |
|---|---|---|
| `anthropics/skills` | Agent Skills'in resmî deposu | 🟢 **Kanonik kaynak.** Skill yazacaksan format buradan |
| `anthropics/claude-plugins-official` | Anthropic'in yönettiği resmî plugin dizini | 🟢 |
| `anthropics/knowledge-work-plugins` | Bilgi işçileri için Cowork plugin'leri | 🟡 |
| `anthropics/claude-for-legal` | Hukuk iş akışları için plugin paketi | ⚪ ODIN kapsamı dışı |
| `obra/superpowers` | Agentic skill çerçevesi + yazılım geliştirme metodolojisi | 🟢 Bu reponun CLAUDE.md disiplinine en yakın felsefe |
| `affaan-m/ECC` | Ajan harness performans optimizasyonu: skill, içgüdü, bellek, güvenlik | 🟡 |
| `addyosmani/agent-skills` | Üretim kalitesinde mühendislik becerileri | 🟢 addyosmani imzası = frontend kalite çıtası |
| `mattpocock/skills` | "Gerçek mühendisler için skill'ler" (TypeScript ekolü) | 🟢 TS tarafında en isabetli kaynak |
| `WorldFlowAI/everything-claude-code` | Ajan, komut, skill, kural, hook toolkit'i | 🟡 |
| `shanraisshan/claude-code-best-practice` | Vibe coding'den agentic engineering'e pratikler | 🟡 |
| `multica-ai/andrej-karpathy-skills` | Karpathy'nin LLM kodlama tuzağı gözlemlerinden türetilmiş tek CLAUDE.md | 🟢 **Bu reponun CLAUDE.md'siyle doğrudan kıyaslanabilir** |
| `Astro-Han/karpathy-llm-wiki` | Agent Skills uyumlu LLM wiki'si | 🟡 |
| `composio-community/awesome-codex-skills` | Codex CLI/API için pratik skill listesi | 🟡 |
| `coreyhaines31/marketingskills` | CRO, copywriting, SEO, analytics, growth becerileri | 🟢 **Amazon listing/PPC tarafına doğrudan uygulanabilir** |
| `K-Dense-AI/scientific-agent-skills` | Bilim için ajan becerileri kütüphanesi | ⚪ |
| `Imbad0202/academic-research-skills` | Araştır → yaz → denetle → revize → bitir zinciri | 🟡 Zincir yapısı ODIN'in karar akışına benzer |
| `Yuan1z0825/nature-skills` | Akademik ifade + bilimsel görselleştirme | ⚪ |
| `mukul975/Anthropic-Cybersecurity-Skills` | 817 yapılandırılmış siber güvenlik becerisi | ⚪ |
| `mvanhorn/last30days-skill` | Bir konuyu birden çok platformda araştıran skill | 🟡 Pazar/rakip taraması için uyarlanabilir |
| `blader/humanizer` | Metinden AI yazım izlerini temizler | 🟡 Listing metni üretiminde işe yarar |
| `alchaincyf/nuwa-skill` | Bir kişinin düşünme biçimini damıtır: zihinsel model, karar sezgileri | 🟢 **Fikir olarak çok değerli** — ODIN'in "sahibin karar tarzı" katmanı |
| `DietrichGebert/ponytail` | Ajanı "en tembel kıdemli geliştirici" gibi düşündürür: en iyi kod yazılmayan koddur | 🟢 Bu repodaki "bileşen tekrarı yasak" kuralının ruh ikizi |
| `JuliusBrussee/caveman` | Mağara adamı gibi konuşarak %65 token kısar | 🟡 Ölçüsü abartılı görünüyor, fikri eğlenceli |
| `datawhalechina/hello-agents` | "Sıfırdan akıllı ajan kurma" eğitimi | ⚪ |

---

## 5. Token & maliyet optimizasyonu 🟡

ODIN'in **S9 AI Gateway** sprinti tam olarak burada tıkanmış durumda
(3/3 çağrıda `cost_known:false`). Bu küme o sprintin ödevidir.

| Repo | Ne yapar | Sana ne işe yarar |
|---|---|---|
| `rtk-ai/rtk` | Yaygın dev komutlarında LLM token tüketimini %60-90 azaltan CLI proxy | 🟢 |
| `headroomlabs-ai/headroom` | Araç çıktılarını ve dosyaları LLM'e ulaşmadan sıkıştırır | 🟢 |
| `kunchenguid/axi` | Ajan ergonomisi ilkeleri: MCP ve düz CLI'dan hem daha doğru hem daha ucuz | 🟢 **S9'un tasarım referansı olabilir** |
| `RyanCodrai/turbovec` | TurboQuant üzerine kurulu vektör indeksi (Rust + Python) | 🟡 |
| `antirez/ds4` | DeepSeek 4 inference motoru (Metal/CUDA/ROCm) | ⚪ |

---

## 6. LLM gateway / router 🟡

S9'un "router modülü hâlâ yok" eksiğine dört farklı cevap.

| Repo | Ne yapar | Sana ne işe yarar |
|---|---|---|
| `router-for-me/CLIProxyAPI` | Antigravity/Codex/Claude Code/Grok'u OpenAI-Gemini-Claude uyumlu API'ye sarar | 🟡 |
| `Wei-Shaw/sub2api` | Claude/OpenAI/Gemini abonelikleri için birleşik API ağ geçidi | 🟡 |
| `diegosouzapw/OmniRoute` | Tek uç nokta, 290+ sağlayıcı, 500+ model (MIT) | 🟢 `IModelProvider` adaptörü için en temiz referans |
| `decolua/9router` | Çok platformlu "sınırsız ücretsiz AI kodlama" | ⚪ Sürdürülebilirliği şüpheli |

⚠️ Bu dördü de **kural 2'yi (sahte veri yasak)** ilgilendiriyor: maliyet
paneli çizmeden önce gateway'in gerçekten `cost` döndürdüğünü doğrula.

---

## 7. Bellek & kod bilgi grafiği 🟡

| Repo | Ne yapar | Sana ne işe yarar |
|---|---|---|
| `thedotmack/claude-mem` | Her ajan için oturumlar arası kalıcı bağlam | 🟢 Bu repoda ADR numarası çakışmasının kök nedeni "oturumlar birbirini görmüyor" |
| `rohitg00/agentmemory` | Gerçek dünya benchmark'larına dayalı kalıcı bellek | 🟡 |
| `DeusData/codebase-memory-mcp` | Depoları indeksleyen yüksek performanslı kod zekâsı sunucusu | 🟡 |
| `colbymchenry/codegraph` | Değişimde otomatik senkronlanan ön-indeksli kod bilgi grafiği | 🟡 ODIN'in `IKnowledgeGraph`'ıyla (ADR-0045) kavramsal akraba |
| `Graphify-Labs/graphify` | Herhangi bir kod tabanını sorgulanabilir bilgi grafiğine çevirir | 🟡 |
| `Egonex-AI/Understand-Anything` | Kodu keşfedilebilir, soru sorulabilir interaktif bilgi grafiğine çevirir | 🟢 **Görselleştirme fikri arayüz tarafına ilham** |
| `RyanCodrai/turbovec` | (yukarıda) vektör indeksi | 🟡 |

---

## 8. Tasarım & UI üretimi 🟢

Bu repo bir **arayüz** reposu olduğu için bu küme doğrudan konu içi.

| Repo | Ne yapar | Sana ne işe yarar |
|---|---|---|
| `google-labs-code/design.md` | Görsel kimliği kod ajanlarına anlatmak için format spesifikasyonu | 🟢 **`11-design-tokens.md`'nin standartlaşmış hâli.** Token disiplinini ajanlara aktarmanın hazır formatı |
| `VoltAgent/awesome-design-md` | Popüler marka tasarım sistemlerinin DESIGN.md analizleri | 🟢 Yukarıdakinin örnek arşivi |
| `pbakaus/impeccable` | AI yeteneklerini optimize eden tasarım dili çerçevesi | 🟢 |
| `nextlevelbuilder/ui-ux-pro-max-skill` | Platformlar arası profesyonel UI/UX için tasarım zekâsı skill'i | 🟡 İddia büyük, çıktı kalitesi doğrulanmalı |
| `alchaincyf/huashu-design` | Claude Code için HTML-yerlisi tasarım skill'i: prototip, slayt, animasyon | 🟡 |
| `nexu-io/open-design` | Ajanı tasarım motoruna çeviren açık kaynak alternatif | 🟡 |
| `kunchenguid/lavish-axi` | "HTML yeni markdown" — HTML artifact editörü | 🟡 |
| `heygen-com/hyperframes` | HTML yaz, video render et — ajanlar için | ⚪ |

---

## 9. Spec-driven geliştirme 🟢

| Repo | Ne yapar | Sana ne işe yarar |
|---|---|---|
| `github/spec-kit` | Spesifikasyon güdümlü geliştirme başlangıç kiti | 🟢 **`docs/ui_chatgpt/` zaten tam olarak bu.** Kendi yaklaşımını endüstri standardıyla kıyaslamak için |
| `Fission-AI/OpenSpec` | AI asistanları için spesifikasyon güdümlü geliştirme çerçevesi | 🟢 Aynı gerekçe |

---

## 10. Web scraping & veri toplama 🟡

| Repo | Ne yapar | Sana ne işe yarar |
|---|---|---|
| `firecrawl/firecrawl` | Web'i ölçekte arama/kazıma/etkileşim API'si | 🟢 Rakip ve pazar verisi için en olgun seçenek |
| `D4Vinci/Scrapling` | Tek istekten tam taramaya uyarlanabilir kazıma çerçevesi | 🟡 |
| `Panniantong/Agent-Reach` | Ajana Twitter/Reddit/YouTube/GitHub okuma-arama yeteneği verir | 🟡 Ürün trendi/sosyal sinyal tarafı |
| `CloakHQ/CloakBrowser` | Bot tespitini geçen gizli Chromium | ⚪ ToS riski yüksek |
| `soxoj/maigret` | Kullanıcı adından 3000+ siteden dosya çıkarır (OSINT) | ⚪ |
| `oxylabs/amazon-scraper`, `dynamohuang/amazon-scrapy` | (§1'de) | — |

---

## 11. Doküman & medya üretimi 🟡

| Repo | Ne yapar | Sana ne işe yarar |
|---|---|---|
| `microsoft/markitdown` | Ofis dosyalarını ve belgeleri Markdown'a çevirir | 🟢 **Günlük fayda.** Tedarikçi/rapor dosyalarını ODIN'e sokmanın en kısa yolu |
| `hugohe3/ppt-master` | Konudan veya belgeden gerçek native PowerPoint üretir | 🟡 Sahip sunumu gerekirse |
| `ggml-org/whisper.cpp` | Whisper'ın C/C++ portu | 🟡 Sesli not → metin |
| `supertone-inc/supertonic` | ONNX üzerinde cihaz-içi çok dilli TTS | ⚪ |
| `jamiepine/voicebox` | Açık kaynak AI ses stüdyosu | ⚪ |
| `harry0703/MoneyPrinterTurbo` | Konudan otomatik HD kısa video | ⚪ |
| `calesthio/OpenMontage` | Agentic video prodüksiyon sistemi | ⚪ |
| `ATH-MaaS/Pixelle-Video` | Tam otomatik kısa video motoru | ⚪ |
| `Anil-matcha/Open-Generative-AI` | 500+ modelli açık AI video alternatifi | ⚪ |
| `yikart/AiToEarn` | "AI ile para kazanalım" | ⚪ |

---

## 12. Genel altyapı & frontend 🟡

| Repo | Ne yapar | Sana ne işe yarar |
|---|---|---|
| `react` | Web ve native arayüzler kütüphanesi | 🟢 **Bu projenin temeli** |
| `sveltejs/svelte` | Alternatif frontend çerçevesi | ⚪ Bu proje React'e bağlı (ADR-0080 adaptör kararı) |
| `flutter/flutter` | Mobil ve ötesi için uygulama çerçevesi | ⚪ Kapsam dışı |
| `n8n-io/n8n` | Yerel AI yetenekli iş akışı otomasyon platformu | 🟡 ODIN'in olay akışını dış sistemlere bağlamak gerekirse |
| `binwiederhier/ntfy` | PUT/POST ile telefona/masaüstüne bildirim | 🟢 **Somut fayda:** ODIN alarmlarını (S14 runtime alarmları) telefona düşürmenin en ucuz yolu |
| `apple/container` | Mac'te hafif VM'lerle Linux konteyneri | 🟡 Geliştirme ortamı |
| `nushell/nushell` | Yeni tip kabuk | 🟡 |
| `apache/arrow` | Sütunlu evrensel veri formatı + bellek-içi analitik | 🟡 Veri hacmi büyürse |
| `automerge/automerge` + `automerge-classic` | Eşzamanlı düzenlenip otomatik birleşen CRDT veri yapısı | 🟡 Çok kullanıcılı arayüz düşünülürse |
| `apache/pouchdb` | Cep boyutunda veritabanı | 🟡 Çevrimdışı arayüz senaryosu |
| `http-party/http-server` | Sıfır yapılandırmalı komut satırı HTTP sunucusu | 🟡 Statik önizleme |
| `janl/mustache.js` | Minimal şablonlama | ⚪ |
| `ovity/octotree` | GitHub'a dosya ağacı ekleyen tarayıcı eklentisi | 🟡 Günlük konfor |
| `github/gitignore` | .gitignore şablonları | 🟡 |
| `scopatz/nanorc` | Nano için sözdizimi renklendirme | ⚪ |
| `wch/r-source` | R kaynak kodunun salt-okunur aynası | ⚪ |

---

## 13. Öğrenme kaynakları & awesome listeleri ⚪🟡

Bunlar "bir gün lazım olur" arşivi. Hiçbiri acil değil.

| Repo | Ne yapar |
|---|---|
| `sindresorhus/awesome` | Tüm awesome listelerinin kök dizini |
| `EbookFoundation/free-programming-books` | Ücretsiz programlama kitapları |
| `trimstray/the-book-of-secret-knowledge` | Kılavuz, cheatsheet, tek satırlık komut arşivi |
| `vinta/awesome-python` | Python çerçeve ve kütüphane listesi |
| `awesome-selfhosted/awesome-selfhosted` | Kendi sunucunda barındırılabilir yazılımlar |
| `codecrafters-io/build-your-own-x` | Sevdiğin teknolojiyi sıfırdan yazarak öğrenme |
| `rohitg00/ai-engineering-from-scratch` | AI mühendisliği: öğren, kur, yayınla |
| `datawhalechina/easy-vibe` | Başlangıçtan ileriye modern kodlama kursu |
| `datawhalechina/hello-agents` | Sıfırdan ajan kurma eğitimi |
| `openjournals/joss` | Açık kaynak yazılım dergisi |
| `santifer/career-ops` | Açık kaynak AI iş arama, CV uyarlama |
| `SimplifyJobs/Summer2027-Internships` | Staj ilanları |
| `gdg-x/hoverboard` | Konferans sitesi şablonu |
| `KushalVijay/AmazonCrackedResource` | Amazon mülakat soruları |

---

## 14. Güvenlik ⚪

| Repo | Ne yapar | Not |
|---|---|---|
| `usestrix/strix` | Açık kaynak AI penetrasyon test aracı | 🟡 ODIN'in localhost-only kararını (cockpit.py) doğrulamak için meşru kullanım |
| `Z4nzu/hackingtool` | "Hepsi bir arada" hacking aracı | ⚪ |
| `elder-plinius/CL4R1T4S` | Sızdırılmış sistem promptları arşivi | ⚪ |
| `soxoj/maigret` | OSINT dosya çıkarma | ⚪ |
| `mukul975/Anthropic-Cybersecurity-Skills` | 817 siber güvenlik becerisi | ⚪ |

---

## 15. ML / model / araştırma ⚪

| Repo | Ne yapar |
|---|---|
| `NVlabs/Eagle` | Veri merkezli stratejilerle sınır vision-language modelleri |
| `microsoft/TRELLIS.2` | 3B üretim için yapılandırılmış latent'ler |
| `FatihMakes/Mark-L` | Bilgisayar kontrol edebilen model iddiası |
| `ruvnet/RuView` | WiFi sinyallerini gerçek zamanlı mekânsal zekâya çevirir |
| `antirez/ds4` | DeepSeek 4 inference motoru |

---

## 16. Konu dışı / arşiv ⚪

| Repo | Ne yapar |
|---|---|
| `FULU-Foundation/OrcaSlicer-bambulab` | 3D yazıcı dilimleyici |
| `nkallen/plasticity` | CAD modelleme |
| `vincentchu/fuzz_ball` | C ile hızlı dizi içi metin arama |
| `vincentchu/sim_cache` | Log verisinden önbellek performansı incelemesi |
| `vincentchu/eth-private-net` | Kendi Ethereum özel ağını kurma |
| `kunchenguid/gnhf` | Deneysel/espri |

---

## Sonuç: bugün gerçekten işine yarayacak 10 tanesi

Sırayla, en yüksek getiriden başlayarak:

1. **`amzn/ads-advanced-tools-docs`** — PPC sözleşmesi ODIN'de eksik;
   resmî kaynak burada.
2. **`google-labs-code/design.md` + `VoltAgent/awesome-design-md`** —
   token disiplinini standart bir formata taşımak.
3. **`binwiederhier/ntfy`** — S14 runtime alarmlarını telefona düşürmek.
   Tek uç nokta, yarım saatlik iş.
4. **`kunchenguid/treehouse`** — sekiz ADR numarası çakışmasının kök
   nedenine (paralel dallar) doğrudan müdahale.
5. **`microsoft/markitdown`** — tedarikçi/rapor dosyalarını ODIN'e sokmak.
6. **`kunchenguid/axi` + `headroomlabs-ai/headroom` + `rtk-ai/rtk`** —
   S9 AI Gateway'in maliyet ölçümü sorunu.
7. **`TauricResearch/TradingAgents`** — çok ajanlı consensus'un çalışan
   referans uygulaması; `IConsensusEngine` ile kıyasla.
8. **`garrytan/gstack` + `777genius/agent-teams-ai`** — "meclis 2/2"
   kuralının kod ajanı karşılığı.
9. **`github/spec-kit` / `Fission-AI/OpenSpec`** — `docs/ui_chatgpt/`
   yaklaşımını endüstri standardıyla kıyaslamak.
10. **`nexscope-ai/Amazon-Skills` + `coreyhaines31/marketingskills`** —
    Amazon Director'ün yetenek envanterini genişletmek.

---

## Bu tablonun sınırları — okumadan karar verme

Kural 2 (sahte veri yasak) bu belgeye de uygulanır:

- **Yıldız sayıları bilerek yazılmadı.** Sayfa çekiminde dönen rakamlar
  tutarsızdı (bazı küçük repolara 100k+ yıldız atfediliyordu). Doğrulanmamış
  sayı yazmaktansa sütunu hiç açmadım.
- **"Ne yapar" sütunu repoların kendi tek satırlık açıklamasıdır.** Hiçbir
  reponun kodunu açıp doğrulamadım. Bir repoyu üretimde kullanmadan önce
  kendin bak.
- **"Sana ne işe yarar" sütunu benim değerlendirmemdir**, reponun iddiası
  değil. Tartışılabilir.
- **Birkaç sahip adı sayfadan tam okunamamış olabilir** (ör. `react/react`,
  `apache/pouchdb` — bunlar muhtemelen `facebook/react` ve
  `pouchdb/pouchdb`). Repo adları güvenilir, sahip önekleri değil.
- Liste **2 Ağustos 2026** fotoğrafıdır; sonra yıldızladıkların yok.
