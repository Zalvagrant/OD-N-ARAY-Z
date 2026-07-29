/**
 * Executive Briefing rotası — ODIN'in açılış ekranı (05-dashboard.md §2).
 *
 * Ekran gövdesi `components/screens/executive-briefing.tsx`'tedir; bu dosya
 * yalnızca rotayı bağlar. Statik segment, `[[...slug]]` yakalayıcısından
 * önce seçilir.
 */

import { ExecutiveBriefing } from "@/components/screens/executive-briefing";

export default function BriefingPage() {
  return <ExecutiveBriefing />;
}
