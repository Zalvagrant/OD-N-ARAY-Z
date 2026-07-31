/**
 * Amazon Director rotası — 06-workspaces.md §1.
 *
 * Ekran gövdesi `features/amazon/director/screen.tsx`'tedir; bu dosya
 * yalnızca rotayı bağlar. Statik segment, `[[...slug]]` yakalayıcısından önce
 * seçilir — alt rotalar (/amazon/orders …) hâlâ yakalayıcıya düşer.
 */

import { AmazonDirector } from "@/features/amazon/director/screen";

export default function AmazonPage() {
  return <AmazonDirector />;
}
