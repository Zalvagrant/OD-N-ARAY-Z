/**
 * MOCK DATA rozeti — UI-ADR-094.
 *
 * KONUM: `components/ui/` (UI-ADR-135). Önceden `src/mocks/` altındaydı ve
 * her ekran onu oradan import ediyordu; bu, ekran katmanından mock
 * katmanına doğru 4 ayrı sınır ihlali demekti. Rozet mock ÜRETMEZ, yalnız
 * `IS_MOCK` bayrağını okuyup bir etiket çizer — yeri UI katmanıdır.
 *
 * Ekranda mock veri varken görünür. Üretim derlemesinde HİÇ render edilmez;
 * mock veri zaten üretime çıkmamalıdır, rozet de çıkmaz.
 *
 * Rozet dikkat çekmez (nötr ton): bir uyarı değil, bir etikettir. Amber
 * kullanmak her ekranı alarm hâline getirirdi (bkz. UI-ADR-091 gerekçesi).
 */

import { Badge } from "@/components/ui/badge";
import { IS_MOCK } from "@/lib/data/mode";

export function MockBadge({ note }: { note?: string }) {
  /* S7 D7.10 — rozetin kaynağı artık TEK anahtar. Eskiden NODE_ENV'e
     bakıyordu: gerçek veriye geçildiği gün geliştirme derlemesinde rozet
     durmaya devam ederdi ve tersi de mümkündü. */
  if (!IS_MOCK) return null;

  const reason =
    note ?? "Bu ekran mock veriyle besleniyor. Gerçek veri S8'de bağlanacak.";

  return (
    <span title={reason}>
      <Badge variant="tertiary" size="sm">
        MOCK DATA
      </Badge>
      <span className="sr-only"> — {reason}</span>
    </span>
  );
}
