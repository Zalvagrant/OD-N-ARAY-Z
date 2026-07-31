/**
 * Executive Briefing rotası — ODIN'in açılış ekranı (05-dashboard.md §2).
 *
 * Ekran gövdesi `features/briefing/screen.tsx`'tedir; bu dosya
 * yalnızca rotayı bağlar. Statik segment, `[[...slug]]` yakalayıcısından
 * önce seçilir.
 */

import { ExecutiveBriefing } from "@/features/briefing/screen";

export default function BriefingPage() {
  return <ExecutiveBriefing />;
}
