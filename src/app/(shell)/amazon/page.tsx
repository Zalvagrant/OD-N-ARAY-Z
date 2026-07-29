/**
 * Amazon Director rotası — 06-workspaces.md §1.
 *
 * Ekran gövdesi `components/screens/amazon-director.tsx`'tedir; bu dosya
 * yalnızca rotayı bağlar. Statik segment, `[[...slug]]` yakalayıcısından önce
 * seçilir — alt rotalar (/amazon/orders …) hâlâ yakalayıcıya düşer.
 */

import { AmazonDirector } from "@/components/screens/amazon-director";

export default function AmazonPage() {
  return <AmazonDirector />;
}
