/**
 * MOCK DATA rozeti — UI-ADR-094.
 *
 * Ekranda mock veri varken görünür. Üretim derlemesinde HİÇ render edilmez;
 * mock veri zaten üretime çıkmamalıdır, rozet de çıkmaz.
 *
 * Rozet dikkat çekmez (nötr ton): bir uyarı değil, bir etikettir. Amber
 * kullanmak her ekranı alarm hâline getirirdi (bkz. UI-ADR-091 gerekçesi).
 */

import { Badge } from "@/components/ui/badge";

export function MockBadge({ note }: { note?: string }) {
  if (process.env.NODE_ENV === "production") return null;

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
