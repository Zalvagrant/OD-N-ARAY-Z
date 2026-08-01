/**
 * Shell layout — App Shell'in TEK örneği burada yaşar.
 * Route group içindeki her rota bu layout'u paylaşır, dolayısıyla workspace
 * değişiminde header/sidebar/status bar YENİDEN MOUNT OLMAZ
 * (03-information-architecture.md §1 çıkış kriteri).
 */
import { AppShell } from "@/components/layout/app-shell";
import { OdinQueryProvider } from "@/lib/data/query";
import { contextPanel } from "./context-panel";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Veri katmanı kabuğun İÇİNDE: shell yeniden mount olmadığı için önbellek
     de workspace geçişlerinde hayatta kalır (S7 D7.1). */
  return (
    <OdinQueryProvider>
      <AppShell contextPanel={contextPanel}>{children}</AppShell>
    </OdinQueryProvider>
  );
}
