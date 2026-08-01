"use client";

/**
 * Karar gönderiminin SONUCU — ER-0025 · UI-ADR-192.
 *
 * Altı sonuç birbirinden AYRI gösterilir. Ayrım kozmetik değil: sahibin
 * bir sonraki hamlesi her birinde farklıdır.
 *
 *   gönderiliyor      → bekle, tekrar basma
 *   kaydedildi        → iş bitti
 *   ODIN REDDETTİ     → gerekçeyi düzelt, tekrar gönder     (kayıt YOK)
 *   komut reddedildi  → arayüz hatası, sahibin yapacağı yok (kayıt YOK)
 *   zaman aşımı       → ⚠️ kayıt BELİRSİZ — tekrar göndermeden ÖNCE bak
 *   taşıma hatası     → ağ/sunucu; `OdinError` beş adımı zaten taşıyor
 *
 * ⚠️ EN KRİTİK AYRIM zaman aşımıdır. Diğer beş durumda "kaydedildi mi?"
 * sorusunun cevabı KESİN. Zaman aşımında değil: sunucu komutu 300 sn
 * çalıştırabiliyor ve istemci 30 sn'de vazgeçiyor, yani ODIN kararı
 * yazmış OLABİLİR. Bunu "hata" diye göstermek sahibi tekrar göndermeye
 * iter ve karar defteri silinmeyen bir defterdir (ODIN ADR-0005) —
 * ikinci kayıt geri alınamaz.
 *
 * ⚠️ REDDİN METNİ DEĞİŞTİRİLMEDEN gösterilir. ER-0025 bunu açıkça şart
 * koşuyor ("the refusal text travels back verbatim so the UI can show
 * WHY") ve gerekçesi somut: kuralı ODIN uyguluyor (ADR-0131), arayüzün
 * onu Türkçeleştirmesi ya da özetlemesi iki metnin ayrışmasına yol açar
 * ve kural değiştiğinde arayüz eskisini söylemeye devam eder.
 */

import { AlertTriangle, Check, Loader2, X } from "lucide-react";

import type { CommandOutcome } from "@/lib/data/command";
import { OdinError } from "@/lib/data/errors";
import { ErrorState } from "@/components/ui/error-state";
import { Text } from "@/components/ui/typography";

/** Gönderim sırasında ekranda ne var. */
export interface VerdictStatusProps {
  pending: boolean;
  outcome: CommandOutcome | null | undefined;
  error: OdinError | null | undefined;
  /** Yeniden denemeyi İNSAN seçer — otomatik retry YOK (use-verdict.ts). */
  onRetry?: () => void;
}

function Satir({
  icon,
  tone,
  children,
}: {
  icon: React.ReactNode;
  tone: "ai" | "success" | "danger" | "warning";
  children: React.ReactNode;
}) {
  const TONE = {
    ai: "text-ai-text",
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
  } as const;
  return (
    <div
      className="mt-3 flex items-start gap-2"
      /* Sonuç ekran okuyucuya DUYURULUR: gönderim butonun altında sessizce
         değişirse klavye/ekran-okuyucu kullanıcısı kaydın olup olmadığını
         hiç öğrenemez. `polite` — odağı çalmaz. */
      role="status"
      aria-live="polite"
    >
      <span className={`mt-0.5 shrink-0 ${TONE[tone]}`} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function VerdictStatus({ pending, outcome, error, onRetry }: VerdictStatusProps) {
  if (pending) {
    return (
      <Satir icon={<Loader2 className="h-4 w-4 animate-spin" />} tone="ai">
        <Text size="sm" tone="secondary">
          Karar ODIN&apos;e yazılıyor…
        </Text>
      </Satir>
    );
  }

  /* Taşıma hatası: ağ, sunucu, sözleşme. `OdinError` beş adımlı anlatıyı
     zaten taşıyor (ne oldu/neden/etkisi/çözüm) — burada yeniden yazmak
     iki metin üretir ve biri bayatlar. */
  if (error) {
    return (
      <div className="mt-3" role="status" aria-live="polite">
        <ErrorState {...error.toErrorState()} onRetry={onRetry} />
      </div>
    );
  }

  if (!outcome) return null;

  if (outcome.kind === "success") {
    return (
      <Satir icon={<Check className="h-4 w-4" />} tone="success">
        <Text size="sm" tone="secondary">
          Karar ODIN&apos;e kaydedildi.
        </Text>
        {/* ODIN'in kendi çıktısı — "owner karari kaydedildi: … -> …" */}
        <pre className="odin-mono mt-1 max-w-full overflow-x-auto whitespace-pre-wrap text-xs text-content-tertiary">
          {outcome.output.trim()}
        </pre>
      </Satir>
    );
  }

  if (outcome.kind === "refused") {
    return (
      <Satir icon={<X className="h-4 w-4" />} tone="danger">
        <Text size="sm" tone="secondary">
          ODIN bu kararı <strong className="text-content">reddetti</strong> —
          kayıt yapılmadı. Sebebi ODIN&apos;in kendi sözleriyle:
        </Text>
        {/* DEĞİŞTİRİLMEDEN — ER-0025. Kuralı uygulayan taraf metni de
            yazar; arayüz onu yeniden ifade ederse ikisi ayrışır. */}
        <pre className="odin-mono mt-1 max-w-full overflow-x-auto whitespace-pre-wrap text-xs text-danger">
          {outcome.output.trim()}
        </pre>
        <Text size="sm" tone="tertiary" className="mt-1">
          Gerekçeyi düzeltip yeniden gönderebilirsin.
        </Text>
      </Satir>
    );
  }

  if (outcome.kind === "timeout") {
    return (
      <Satir icon={<AlertTriangle className="h-4 w-4" />} tone="warning">
        <Text size="sm" tone="secondary">
          <strong className="text-content">
            Kararın kaydedilip kaydedilmediği belirsiz.
          </strong>{" "}
          ODIN yanıt vermeden zaman aşımına uğradı; komut sunucuda hâlâ
          çalışıyor olabilir.
        </Text>
        <Text size="sm" tone="tertiary" className="mt-1">
          <strong className="text-content">Tekrar gönderme.</strong> Önce
          karar listesini tazele ve kaydın düşüp düşmediğine bak — aynı
          kararı iki kez yazmak geri alınamaz.
        </Text>
      </Satir>
    );
  }

  /* rejected: komut hiç koşmadı. Kayıt kesinlikle YOK — bu, sahibin
     düzeltebileceği bir şey değil, arayüzün yanlış komut göndermesidir. */
  return (
    <Satir icon={<X className="h-4 w-4" />} tone="danger">
      <Text size="sm" tone="secondary">
        ODIN komutu çalıştırmadı — kayıt yapılmadı. Bu bir arayüz hatasıdır,
        kararında bir sorun yok.
      </Text>
      <pre className="odin-mono mt-1 max-w-full overflow-x-auto whitespace-pre-wrap text-xs text-danger">
        {outcome.error}
      </pre>
    </Satir>
  );
}
