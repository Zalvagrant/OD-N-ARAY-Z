/**
 * Trading rotası — UI-ADR-206.
 * Ölçülmüş yokluk; gerekçe çekirdeğin `trading` probundan gelir.
 */

import { CapabilityScreen } from "@/features/capability/screen";

export default function Page() {
  return (
    <CapabilityScreen
      id="trading"
      title="Trading"
      context="Trading verisi — kaynak durumu ölçülmüştür"
    />
  );
}
