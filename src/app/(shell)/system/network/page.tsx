/**
 * System · Network rotası — UI-ADR-206.
 * Ölçülmüş yokluk; gerekçe çekirdeğin `system.network` probundan gelir.
 */

import { CapabilityScreen } from "@/features/capability/screen";

export default function Page() {
  return (
    <CapabilityScreen
      id="system.network"
      title="Network"
      context="Ağ telemetrisi — kaynak durumu ölçülmüştür"
    />
  );
}
