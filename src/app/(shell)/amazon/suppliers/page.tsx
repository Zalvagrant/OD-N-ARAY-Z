/**
 * Amazon · Suppliers rotası — UI-ADR-206.
 * Ölçülmüş yokluk; gerekçe çekirdeğin `amazon.suppliers` probundan gelir.
 */

import { CapabilityScreen } from "@/features/capability/screen";

export default function Page() {
  return (
    <CapabilityScreen
      id="amazon.suppliers"
      title="Suppliers"
      context="Tedarikçi verisi — kaynak durumu ölçülmüştür"
    />
  );
}
