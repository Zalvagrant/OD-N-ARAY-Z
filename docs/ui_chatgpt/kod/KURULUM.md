# kod/ — Kurulum Notu

Bu klasördeki dosyalar **hazır kod.** Claude Code bunları projeye yerleştirecek.

## Dosyalar

| Dosya | Nereye gider (öneri) | Ne yapar |
|---|---|---|
| `tokens.css` | `src/styles/tokens.css` | Tüm tasarım token'ları. Global CSS'te ilk import edilir |
| `tailwind.config.ts` | Proje kökü | Tailwind'in token'ları tanıması |
| `theme-provider.tsx` | `src/components/layout/` | Tema altyapısı. App root'unu sarar |
| `motion.ts` | `src/animations/motion.ts` | Animasyon preset'leri |
| `telemetry-registry.ts` | `src/lib/telemetry/registry.ts` | 20 kanalın kayıt defteri |
| `data-envelope.ts` | `src/types/data-envelope.ts` | Veri zarfı + anti-fake guard |
| `eslint-token-rule.md` | — | Lint kuralı tarifi |

Yollar önerdir. Mevcut proje yapısına göre Claude Code ayarlayacak.

## Sıra

1. `tokens.css`'i global stile import et
2. `tailwind.config.ts`'i mevcut config ile birleştir
3. `ThemeProvider`'ı app root'una sar
4. Diğer üç dosyayı yerleştir
5. Lint kuralını ekle
6. Storybook token showcase sayfası

## Doğrulama

Kurulum bitti sayılır eğer:

- [ ] `bg-surface`, `text-content`, `border-line` gibi sınıflar çalışıyor
- [ ] Sayılar sütunda hizalanıyor (`.odin-num` sınıfı)
- [ ] `prefers-reduced-motion` açıkken animasyonlar duruyor
- [ ] Hardcoded renk yazınca lint hata veriyor
- [ ] Storybook'ta tüm token'lar görünüyor

## Önemli

**Bu dosyaların içeriğini değiştirme.** Değişiklik gerekiyorsa önce
`docs/ui_chatgpt/11-design-tokens.md` güncellenir, sonra kod.

Tersi olursa doküman ile kod birbirinden ayrışır — ki bu projenin
başına gelen en yaygın felakettir.
