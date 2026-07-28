"use client";

/**
 * Field Anatomy — 10-component-library.md §8.2 (DONDURULMUŞ)
 *
 *   Label → Description → Field → Helper Text → Validation → Action
 *
 * Sıra değişmez. Her giriş alanı bu iskeleti kullanır; bileşenler kendi
 * etiket/hata düzenini KURMAZ (§2 "UI mantığı kopyalama" yasağı).
 *
 * Yaşam döngüsü (§8.1) doğrudan `status` prop'udur:
 *   idle → focused/typing (CSS) → validating → valid | invalid → saved
 * Focused ve typing prop DEĞİLDİR: biri CSS pseudo-class, diğeri
 * kullanıcının kendi girdisi. (UI-ADR-086)
 *
 * Doğrulama seviyeleri (§8.3) bu bileşenin işi değildir — local/business/
 * remote ayrımını çağıran katman yapar, Field yalnızca sonucu gösterir.
 */

import { useId, type ReactNode } from "react";
import { Check, CircleAlert, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/typography";

export type FieldStatus =
  | "idle"
  | "validating"
  | "valid"
  | "invalid"
  | "saved";

/** Field'ın ürettiği erişilebilirlik bağlantıları — girdiye yayılır. */
export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-busy"?: boolean;
}

const STATUS_VIEW: Record<
  Exclude<FieldStatus, "idle">,
  { icon: typeof Check; tone: string; fallback: string }
> = {
  validating: {
    icon: Loader2,
    tone: "text-content-secondary",
    fallback: "Doğrulanıyor",
  },
  valid: { icon: Check, tone: "text-success", fallback: "Geçerli" },
  invalid: { icon: CircleAlert, tone: "text-danger", fallback: "Geçersiz" },
  saved: { icon: Check, tone: "text-success", fallback: "Kaydedildi" },
};

export function Field({
  label,
  description,
  helper,
  status = "idle",
  message,
  required,
  action,
  children,
}: {
  label: string;
  description?: string;
  helper?: string;
  status?: FieldStatus;
  /** Durum mesajı. Verilmezse duruma ait varsayılan metin gösterilir. */
  message?: string;
  required?: boolean;
  /** Alanın altındaki eylem: "Toplu içe aktar", "Sıfırla" gibi. */
  action?: ReactNode;
  children: (props: FieldControlProps) => ReactNode;
}) {
  const id = useId();
  const descId = `${id}-desc`;
  const helperId = `${id}-helper`;
  const msgId = `${id}-msg`;

  const describedBy =
    [description && descId, helper && helperId, status !== "idle" && msgId]
      .filter(Boolean)
      .join(" ") || undefined;

  const view = status === "idle" ? null : STATUS_VIEW[status];
  const StatusIcon = view?.icon;

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      {description && (
        <p id={descId} className="text-sm text-content-secondary">
          {description}
        </p>
      )}

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": status === "invalid" || undefined,
        "aria-busy": status === "validating" || undefined,
      })}

      {helper && (
        <p id={helperId} className="text-xs text-content-tertiary">
          {helper}
        </p>
      )}

      {/* Doğrulama satırı: ikon + metin. Renk tek başına anlam taşımaz. */}
      {view && StatusIcon && (
        <p
          id={msgId}
          role={status === "invalid" ? "alert" : "status"}
          className={`flex items-center gap-1 text-xs ${view.tone}`}
        >
          <StatusIcon
            className={`h-3 w-3 ${status === "validating" ? "animate-spin" : ""}`}
            aria-hidden
          />
          {message ?? view.fallback}
        </p>
      )}

      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
