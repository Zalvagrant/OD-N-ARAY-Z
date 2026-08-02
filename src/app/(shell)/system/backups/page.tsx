/**
 * System · Backups rotası — UI-ADR-206.
 * Ölçülmüş yokluk; gerekçe çekirdeğin `system.backups` probundan gelir.
 */

import { CapabilityScreen } from "@/features/capability/screen";

export default function Page() {
  return (
    <CapabilityScreen
      id="system.backups"
      title="Backups"
      context="Yedek politikası — kaynak durumu ölçülmüştür"
    />
  );
}
