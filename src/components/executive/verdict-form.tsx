"use client";

/**
 * VerdictForm — ODIN ADR-0131 kurallarının YÜZEYİ. UI-ADR-144.
 *
 * NEDEN AYRI DOSYA (gavadolar 2/2): "kararı GÖSTERMEK" ile "karar VERMEK"
 * ayrı sözleşmelerdir. Bu form kendi durumunu tutar, kendi doğrulamasını
 * yapar ve kendi başına test edilebilir; `decision-card` ondan sonra
 * yalnızca ORKESTRASYON yapar. Bölme ölçütünün dördünü de geçen tek
 * parça buydu (UI-ADR-144 §Ölçüt) — diğer büyük dosyalar ekranın
 * DÜZENİdir ve yerinde kaldı.
 *
 * Modal değil: karar kartın ÜZERİNDE verilir, bağlam kaybolmaz.
 *
 * Taşıdığı iki kural sessizce gevşeyebilir ve ikisi de ODIN'in karar
 * kaydını bozar:
 *   1. Sınıfı gerektiriyorsa GEREKÇE zorunludur (ADR-0046 geri besleme
 *      döngüsü ondan öğrenir).
 *   2. "Tarihsiz erteleme sessiz bir HAYIRDIR" — `deferred` GELECEK bir
 *      tarih ister; istemci saati yoksa karar hiç verilmez (tahmin yok).
 */

import { useState } from "react";

import type { Decision } from "@/types/executive";
import {
  ODIN_MIN_REASON_CHARS,
  ODIN_REASON_REQUIRED_CLASSES,
  type OdinVerdict,
} from "@/types/odin";
import { useNow } from "@/lib/clock/tick";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/typography";

export interface VerdictInput {
  verdict: OdinVerdict;
  reason?: string;
  /** deferred için zorunlu, YYYY-MM-DD */
  revisitAt?: string;
}

/* --------------------------------------------------------------------------
   Verdict formu — ADR-0131 kurallarının yüzeyi. Modal değil: karar kartın
   üzerinde verilir, bağlam kaybolmaz.
   -------------------------------------------------------------------------- */

export function VerdictForm({
  decision,
  pending,
  onSubmit,
  onCancel,
}: {
  decision: Decision;
  pending: OdinVerdict;
  onSubmit: (v: VerdictInput) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [revisitAt, setRevisitAt] = useState("");
  const now = useNow(); // merkezi saat (UI-ADR-089) — render'da Date.now() yok

  const recClass = decision.recommendation.recClass;
  /**
   * BİLİNMİYORSA ZORUNLU — fail-CLOSED (UI-ADR-156).
   *
   * Önce `recClass !== undefined && ...` idi: sınıf taşımada DÜŞERSE
   * gerekce zorunlu OLMAKTAN ÇIKIYORDU. Yani ADR-0131'in B/C kuralı,
   * bir alanın kaybolmasıyla sessizce kalkıyor ve karar tek tıkla
   * kaydediliyordu — bu dosyanın kendi başlığı o riski zaten sayıyor.
   *
   * Bir yönetişim kuralı, kendisini tetikleyen verinin yokluğunda
   * GEVŞEMEZ. Sınıf bilinmiyorsa gerekçe İSTENİR: fazladan bir cümle
   * yazmak, kaydı gerekçesiz bırakmaktan ucuzdur.
   */
  const reasonRequired =
    recClass === undefined || ODIN_REASON_REQUIRED_CLASSES.includes(recClass);
  const reasonOk = !reasonRequired || reason.trim().length >= ODIN_MIN_REASON_CHARS;

  /* "Tarihsiz erteleme sessiz bir hayırdır" — gelecek tarih şart.
     Saat henüz gelmediyse (now === null) karar verilmez: tahmin yok. */
  const dateOk =
    pending !== "deferred" ||
    (revisitAt !== "" && now !== null && new Date(revisitAt).getTime() > now);

  const LABEL: Record<OdinVerdict, string> = {
    approved: "Onayı kaydet",
    rejected: "Reddi kaydet",
    deferred: "Ertelemeyi kaydet",
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-sm border border-line p-3">
      <Field
        label={
          reasonRequired
            ? `Gerekçe (sınıf ${recClass} — zorunlu, en az ${ODIN_MIN_REASON_CHARS} karakter)`
            : "Gerekçe (isteğe bağlı)"
        }
        description={
          reasonRequired
            ? "ODIN'in geri besleme döngüsü (ADR-0046) bu gerekçeden öğrenir."
            : undefined
        }
      >
        {(props) => (
          <Input
            {...props}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bu kararı neden böyle veriyorsun?"
          />
        )}
      </Field>

      {pending === "deferred" && (
        <Field
          label="Yeniden ele alma tarihi (zorunlu)"
          description="Tarihsiz erteleme sessiz bir hayırdır — ODIN o gün geri getirir."
        >
          {(props) => (
            <Input
              {...props}
              type="date"
              value={revisitAt}
              onChange={(e) => setRevisitAt(e.target.value)}
            />
          )}
        </Field>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={pending === "rejected" ? "danger" : "primary"}
          size="sm"
          disabled={!reasonOk || !dateOk}
          onClick={() =>
            onSubmit({
              verdict: pending,
              reason: reason.trim() || undefined,
              revisitAt: pending === "deferred" ? revisitAt : undefined,
            })
          }
        >
          {LABEL[pending]}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Vazgeç
        </Button>
        {!reasonOk && (
          <Text size="sm" tone="tertiary">
            Sınıf {recClass} kararı gerekçesiz kapanamaz.
          </Text>
        )}
        {pending === "deferred" && !dateOk && (
          <Text size="sm" tone="tertiary">
            Gelecek bir tarih seç.
          </Text>
        )}
      </div>
    </div>
  );
}
