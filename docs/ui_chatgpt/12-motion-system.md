# 12 — Motion System

**Durum:** ✅ Kurallar DONDURULDU / ⬜ sayısal değerler tanımsız
**Kaynak:** dosya_1 (IV Living Interface, V AI Body Language), dosya_5 (Audit-7, Audit-8, Motion Audit), dosya_6 (Motion Tokens)

---

## 1. Temel Kural

Animasyon yalnızca **dört amaç** için kullanılır:

| Amaç | Örnek |
|---|---|
| **Context Change** | Workspace geçişi |
| **Focus** | Odaklanılan öğenin öne çıkması |
| **Feedback** | Butona basıldığında yanıt |
| **State Transition** | Loading → Ready |

**Dekoratif animasyon kullanılmaz.** Bir animasyonun bu dört amaçtan birine
hizmet ettiği gösterilemiyorsa, o animasyon kaldırılır.

---

## 2. Motion Tokens

```
duration.fast
duration.normal
duration.slow

easing.standard
easing.enter
easing.exit

scale.hover
opacity.disabled
```

⬜ **TANIMSIZ:** Kaynak sayısal değer vermedi.

🟡 **Önerilen değerler** (Executive Presence hedefine uygun — hızlı ama
telaşsız):

| Token | Öneri | Kullanım |
|---|---|---|
| `duration.fast` | 120 ms | Hover, focus, küçük geri bildirim |
| `duration.normal` | 220 ms | Panel açılma, kart genişleme |
| `duration.slow` | 400 ms | Workspace geçişi, bağlam değişimi |
| `easing.standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Genel |
| `easing.enter` | `cubic-bezier(0, 0, 0.2, 1)` | Giriş — hızlı başla, yumuşak bit |
| `easing.exit` | `cubic-bezier(0.4, 0, 1, 1)` | Çıkış — yumuşak başla, hızlı bit |
| `scale.hover` | 1.01 | Çok hafif — 1.05 zaten fazla |
| `opacity.disabled` | 0.4 | |

**Neden bu kadar kısa:** `01-product-vision.md` Personality Matrix'te
"Gösterişli 1/10". Uzun animasyon gösteriştir. 400 ms üstü hiçbir geçiş
olmamalıdır.

---

## 3. Living Interface

Hiçbir ekran statik değildir. Ama "canlı" olmak "hareketli" olmak değildir.

| Element | Hareket |
|---|---|
| Knowledge Graph | Sürekli, çok yavaş hareket |
| Director Heartbeat | Gerçek heartbeat ritmi (veriye bağlı) |
| AI Core | Nefes alır — yavaş genişleme/daralma |
| Voice Ring | Titremez, **organik** hareket eder |
| Charts | Her saniye çok küçük data refresh hissi |
| Network göstergesi | Paket akışı |
| Footer | Telemetri akar |

**Kritik ayrım:** Bu hareketler **ortam** hareketleridir (ambient), dikkat
çekmez, göz takip etmez. Kullanıcı baktığında fark eder, bakmadığında rahatsız
olmaz.

**Sınır:** `02-design-principles.md` §10 "Sonsuz animasyon" yasağı burada
nüanslıdır. Yasaklanan: dikkat çeken, döngüsel, dekoratif animasyon.
İzin verilen: ölçülebilir bir sistem durumunu yansıtan çok yavaş ortam
hareketi. Ayırt edici test: **hareket bir veriye bağlı mı?** Bağlıysa
telemetridir; bağlı değilse dekorasyondur ve kaldırılır.

---

## 4. AI Body Language — Motion Eşlemesi

`07-ai-directors.md` §11'in hareket karşılığı:

| AI durumu | Hareket | Süre |
|---|---|---|
| Thinking | Core yavaş döner | sürekli, `duration.slow` döngü |
| Learning | Knowledge Ring aktifleşir | `duration.normal` geçiş |
| Searching | Graph pulse | `duration.normal` |
| Reasoning | Particle orbit | sürekli |
| Memory Recall | Memory Ring parlar | `duration.fast` parlama |
| Confidence High | Yeşil halo | `duration.normal` fade |
| Confidence Low | Amber glow | `duration.normal` fade |
| Conflict | Kırmızı halka | `duration.fast`, **titremez** |
| Voice aktif | Wave | ses girdisine bağlı |
| Silence | Calm glow | çok yavaş nefes |

**Kural:** Hiçbiri zıplamaz, hiçbiri titremez. Conflict durumu bile sakin bir
kırmızı halkadır — yanıp sönen bir alarm değil.

---

## 5. Executive Timing

`02-design-principles.md` §7'nin hareket karşılığı:

| Olay | Zamanlama |
|---|---|
| Kritik uyarı | Anında görünür, `duration.fast` |
| KPI güncellemesi | `duration.normal` tween — sayı zıplamaz |
| Arka plan senkronizasyonu | Görsel geri bildirim yok (sessiz) |
| AI cevabı | Streaming — kelime kelime akar |

**Sayı geçişi kuralı:** Bir metrik değeri değiştiğinde eski değerden yeni
değere tween ile geçer. Anlık değişim, kullanıcının değişimi kaçırmasına veya
irkilmesine sebep olur.

---

## 6. Workspace Transition

Workspace değiştiğinde animasyon **sayfa değiştirme** hissi değil,
**bağlam değişimi** hissi verir.

Bu ne demek:

| Sayfa geçişi hissi (❌) | Bağlam değişimi hissi (✅) |
|---|---|
| Soldan sağa kayma | Yerinde derinlik değişimi |
| Beyaz flash | Yumuşak opacity + hafif scale |
| Tüm ekranın değişmesi | Çerçeve sabit, içerik değişir |

App Shell (header, sidebar, status bar) **hiç animasyon almaz.** Yalnızca
Workspace içeriği geçiş yapar. Bu, ODIN'i klasik dashboard'lardan ayıran
önemli bir UX detayıdır.

---

## 7. Loading Pattern

Skeleton yalnızca gri kutu değildir — **gerçek yerleşimi temsil eder.**

Sonuç: layout shift oluşmaz. İçerik geldiğinde hiçbir şey yerinden oynamaz.

Skeleton animasyonu: yumuşak shimmer, `duration.slow` döngü, düşük kontrast.

---

## 8. Performans Kuralları

**Tercih edilen** (GPU dostu):
```
transform · opacity · scale
```

**Kaçınılan** (layout/paint tetikler):
```
width · height · top · left
büyük blur yarıçapları
pahalı filtreler
```

**Bütçe:** 60 FPS. Bir animasyon bu bütçeyi aşıyorsa basitleştirilir veya
kaldırılır.

**Glass + Motion kombinasyonu:** Hareketli içerik cam yüzey arkasındaysa blur
her karede yeniden hesaplanır. Bu en pahalı kombinasyondur. Kural: hareketli
içeriğin üzerinde `glass.heavy` kullanılmaz.

---

## 9. Reduced Motion

`prefers-reduced-motion: reduce` aktifse:

| Normal | Reduced |
|---|---|
| Geçiş animasyonları | Anlık geçiş |
| Ambient hareket (graph, core) | Durur |
| Heartbeat nabzı | Statik gösterge |
| Shimmer skeleton | Sabit gri |
| Sayı tween | Anlık değişim |
| Streaming AI cevabı | **Devam eder** (içerik akışı, animasyon değil) |

**Kural:** Reduced motion modunda hiçbir bilgi kaybolmaz. Yalnızca hareket
kalkar. Heartbeat animasyonu duruyorsa yerine bir metin durumu gösterilir.

---

## 10. Yasaklar

- ❌ Zıplayan animasyon (bounce, spring overshoot)
- ❌ Yanıp sönen uyarı
- ❌ Otomatik dönen carousel
- ❌ Parallax
- ❌ 400 ms üstü geçiş
- ❌ Dikkat çekmek için hareket kullanmak
- ❌ Veriye bağlı olmayan sürekli animasyon
- ❌ Aynı anda 3'ten fazla bağımsız animasyon

---

## 11. Uygulama notu (Framer Motion)

Motion token'ları merkezi bir `animations/` modülünde tanımlanır ve tüm
bileşenler oradan import eder. Bileşen içinde inline `transition={{ duration: 0.3 }}`
yazmak yasaktır — token kullanılır.

```ts
// animations/tokens.ts
export const motion = {
  fast:   { duration: 0.12, ease: [0.4, 0, 0.2, 1] },
  normal: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
  slow:   { duration: 0.40, ease: [0.4, 0, 0.2, 1] },
} as const;
```

---

## 12. Motion Denetimi (kabul kriteri)

- [ ] Her animasyon 4 amaçtan birine hizmet ediyor
- [ ] Hiçbir geçiş 400 ms'i aşmıyor
- [ ] Yalnızca `transform` / `opacity` animate ediliyor
- [ ] `prefers-reduced-motion` tam destekleniyor
- [ ] Reduced motion modunda hiçbir bilgi kaybolmuyor
- [ ] App Shell geçişte animasyon almıyor
- [ ] Ambient hareketlerin hepsi gerçek veriye bağlı
- [ ] Aynı anda 3'ten fazla bağımsız animasyon yok
- [ ] 60 FPS ölçülmüş ve doğrulanmış
