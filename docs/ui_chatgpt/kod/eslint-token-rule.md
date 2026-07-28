# Lint Kuralı — Hardcoded Değer Yasağı

**Kaynak:** `11-design-tokens.md` §15

## Amaç

Bir bileşende `bg-[#111827]` veya `text-[#A855F7]` yazılırsa, tema sistemi
çöker. Light tema eklendiğinde o bileşen kararmış kalır.

Bu kural onu yakalar.

## Tailwind arbitrary value yasağı

`.eslintrc` içine:

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/(bg|text|border|shadow|fill|stroke)-\\\\[#[0-9a-fA-F]{3,8}\\\\]/]",
        "message": "Hardcoded renk yasak. docs/ui_chatgpt/11-design-tokens.md'deki semantic token'ı kullan (bg-surface, text-content, border-line...)."
      },
      {
        "selector": "Literal[value=/(p|m|gap|w|h)-\\\\[[0-9]+px\\\\]/]",
        "message": "Hardcoded ölçü yasak. 8px taban spacing token'ını kullan."
      }
    ]
  }
}
```

## Inline style yasağı

```json
{
  "rules": {
    "react/forbid-dom-props": [
      "error",
      { "forbid": [{ "propName": "style", "message": "Inline style yerine token tabanlı Tailwind sınıfı kullan." }] }
    ]
  }
}
```

**İstisna:** Dinamik değerler (grafik yüksekliği, ilerleme çubuğu genişliği).
Bunlar için `style={{ width: `${pct}%` }}` serbest — ama **renk asla**.

## Motion yasağı

`12-motion-system.md` §11: bileşen içinde inline transition yazılmaz.

```json
{
  "selector": "Property[key.name='transition'] ObjectExpression Property[key.name='duration']",
  "message": "Inline animasyon süresi yasak. src/animations/motion.ts'ten import et."
}
```

## Doğrulama

Kural çalışıyorsa şu satır hata vermeli:

```tsx
<div className="bg-[#111827]" />   // ❌ ESLint error
<div className="bg-surface" />     // ✅
```
