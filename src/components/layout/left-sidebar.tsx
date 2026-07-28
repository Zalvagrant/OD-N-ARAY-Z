"use client";

/**
 * Left Sidebar — hibrit menü (UI-ADR-070).
 * Kaynak: 04-navigation-system.md §3, §4, §6
 *
 * - Kategori başlıkları TIKLANAMAZ etikettir (açılır menü değil)
 * - Aynı anda EN FAZLA BİR modülün alt menüsü açıktır
 * - Daraltılmış modda yalnızca ikon; isim hover'da tooltip olarak gelir
 * - Tercih localStorage'da kalıcıdır (useUiStore persist)
 *
 * Genişlik notu: token setinde layout genişliği tanımlı değil. Tailwind'in
 * 8px tabanlı varsayılan ölçeği kullanılıyor (w-64 = 256px, w-16 = 64px) —
 * 03-information-architecture.md §9.1 temel birim kuralına uyar.
 */

import Link from "next/link";
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV_GROUPS, type NavItem } from "@/lib/navigation/registry";
import { useNavigationStore } from "@/lib/store/navigation";
import { useUiStore } from "@/lib/store/ui";
import { DirectorStatusDot } from "./director-status-dot";

function SidebarItem({
  item,
  collapsed,
  active,
  activeChildHref,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  activeChildHref: string | null;
}) {
  const expandedId = useNavigationStore((s) => s.expandedId);
  const toggleExpanded = useNavigationStore((s) => s.toggleExpanded);

  const hasChildren = Boolean(item.children?.length);
  const expanded = hasChildren && !collapsed && expandedId === item.id;
  const Icon = item.icon;

  return (
    <li>
      <div
        className={`group flex items-center rounded-sm transition-colors duration-fast ease-standard ${
          active
            ? "bg-surface-elevated text-content"
            : "text-content-secondary hover:bg-surface hover:text-content"
        }`}
      >
        <Link
          href={item.href}
          title={collapsed ? item.label : undefined}
          aria-current={active ? "page" : undefined}
          className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Icon
            className={`h-4 w-4 shrink-0 ${active ? "text-icon-active" : "text-icon"}`}
            aria-hidden
          />
          {!collapsed && (
            <span className="min-w-0 flex-1 truncate text-base">{item.label}</span>
          )}
          {/* Director durum noktası: veri yokken hiçbir şey çizmez. */}
          {!collapsed && <DirectorStatusDot beat={null} />}
        </Link>

        {hasChildren && !collapsed && (
          <button
            type="button"
            onClick={() => toggleExpanded(item.id)}
            aria-expanded={expanded}
            aria-label={`${item.label} alt menüsünü ${expanded ? "kapat" : "aç"}`}
            className="px-2 py-2 text-icon hover:text-icon-active"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden />
            )}
          </button>
        )}
      </div>

      {expanded && (
        <ul className="mt-1 space-y-1 border-l border-line-subtle pl-4 ml-5">
          {item.children?.map((child) => {
            const childActive = activeChildHref === child.href;
            return (
              <li key={child.id}>
                <Link
                  href={child.href}
                  aria-current={childActive ? "page" : undefined}
                  className={`block rounded-sm px-3 py-1 text-sm transition-colors duration-fast ease-standard ${
                    childActive
                      ? "bg-surface text-content"
                      : "text-content-tertiary hover:text-content"
                  }`}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export function LeftSidebar({
  activeWorkspaceId,
  pathname,
}: {
  activeWorkspaceId: string | null;
  pathname: string;
}) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-line bg-bg-secondary transition-[width] duration-normal ease-standard ${
        collapsed ? "w-16" : "w-64"
      }`}
      aria-label="Ana navigasyon"
    >
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label ?? `group-${gi}`} className="mb-6">
            {/* Kategori başlığı: etiket, buton değil (UI-ADR-070). */}
            {group.label && !collapsed && (
              <div className="px-3 pb-2 text-xs uppercase tracking-wide text-content-tertiary">
                {group.label}
              </div>
            )}
            {group.label && collapsed && (
              <div className="mx-3 mb-2 border-t border-line-subtle" />
            )}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  active={activeWorkspaceId === item.id}
                  activeChildHref={pathname}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-2">
        <button
          type="button"
          onClick={toggleSidebar}
          title={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-content-secondary hover:bg-surface hover:text-content"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          )}
          {!collapsed && <span className="text-sm">Daralt</span>}
        </button>
      </div>
    </aside>
  );
}
