"use client";

/**
 * App Shell — her ekran istisnasız aynı iskeleti kullanır.
 * Kaynak: 03-information-architecture.md §1
 *
 * KRİTİK: Bu bileşen sayfa değişiminde YENİDEN MOUNT OLMAZ. Next.js App
 * Router'da (shell) route group'unun layout'una konularak sağlanır — grup
 * içindeki tüm rotalar aynı layout örneğini paylaşır.
 *
 * Scroll yalnızca Workspace içindedir; header, sidebar ve status bar sabittir.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { findGroupOf, findWorkspaceByPath } from "@/lib/navigation/registry";
import { useNavigationStore } from "@/lib/store/navigation";
import { useUiStore } from "@/lib/store/ui";
import { recordWorkspaceVisit } from "@/lib/usage/events";
import { TopHeader, type Crumb } from "./top-header";
import { LeftSidebar } from "./left-sidebar";
import { RightContextPanel } from "./right-context-panel";
import { ExecutiveTimeline } from "./executive-timeline";
import { StatusBar } from "./status-bar";
import { CommandPalette } from "./command-palette";
import { Workspace } from "./workspace";
import { IntelligenceFeed } from "@/components/screens/intelligence-feed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const workspace = findWorkspaceByPath(pathname);
  const group = workspace ? findGroupOf(workspace.id) : undefined;
  const child = workspace?.children?.find((c) => c.href === pathname);

  const setActiveWorkspace = useNavigationStore((s) => s.setActiveWorkspace);
  const resetContextPanel = useUiStore((s) => s.resetContextPanelOnNavigate);

  /* Navigation store tek kaynaktır: aktif workspace yalnızca burada set edilir. */
  useEffect(() => {
    setActiveWorkspace(workspace?.id ?? null);
  }, [workspace?.id, setActiveWorkspace]);

  /* Workspace değişince panel kapanır — Pinned hariç (§11). */
  useEffect(() => {
    resetContextPanel();
  }, [workspace?.id, resetContextPanel]);

  /* Kullanım olayı kaydı — UI-ADR-082. Özellik KAPALI, yalnızca kayıt. */
  const visitRef = useRef<{ id: string; at: Date } | null>(null);
  useEffect(() => {
    const previous = visitRef.current;
    if (previous) {
      recordWorkspaceVisit(
        previous.id,
        previous.at,
        Date.now() - previous.at.getTime()
      );
    }
    visitRef.current = workspace ? { id: workspace.id, at: new Date() } : null;
  }, [workspace?.id, workspace]);

  const crumbs: Crumb[] = [
    ...(group?.label ? [{ label: group.label }] : []),
    ...(workspace ? [{ label: workspace.label, href: workspace.href }] : []),
    ...(child ? [{ label: child.label, href: child.href }] : []),
  ];

  return (
    /* reducedMotion="user": işletim sistemi ayarı açıksa Framer hareketi
       kaldırır — bilgi kalkmaz (12-motion-system.md §9). */
    <MotionConfig reducedMotion="user">
      <div className="flex h-screen flex-col overflow-hidden bg-bg">
        <TopHeader crumbs={crumbs} />

        <div className="flex min-h-0 flex-1">
          <LeftSidebar
            activeWorkspaceId={workspace?.id ?? null}
            pathname={pathname}
          />
          <Workspace workspaceKey={pathname}>{children}</Workspace>
          {/* Sağ panelin kabuğu sabittir; içerik sağlayıcısı workspace'e göre
              değişir (03-...md §7). Executive Briefing'de akan istihbarat
              paneli vardır (05-...md §6); diğerlerinde seçili nesne detayı. */}
          <RightContextPanel workspaceLabel={workspace?.label ?? "ODIN"}>
            {workspace?.id === "briefing" ? <IntelligenceFeed /> : undefined}
          </RightContextPanel>
        </div>

        <ExecutiveTimeline />
        <StatusBar />
        <CommandPalette activeWorkspaceId={workspace?.id ?? null} />
      </div>
    </MotionConfig>
  );
}
