/**
 * Shell layout — App Shell'in TEK örneği burada yaşar.
 * Route group içindeki her rota bu layout'u paylaşır, dolayısıyla workspace
 * değişiminde header/sidebar/status bar YENİDEN MOUNT OLMAZ
 * (03-information-architecture.md §1 çıkış kriteri).
 */
import { AppShell } from "@/components/layout/app-shell";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
