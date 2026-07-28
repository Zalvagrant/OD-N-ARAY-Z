/**
 * Navigasyon kayıt defteri — routing'in TEK kaynağı.
 * Kaynak: 04-navigation-system.md §3 (UI-ADR-070 hibrit menü)
 *
 * Kategori başlıkları TIKLANAMAZ etikettir, açılır menü değildir.
 * ODIN HQ, Mission Control'ün üstündedir (UI-ADR-073).
 * "AI Core" menüde YOKTUR (UI-ADR-077).
 * "Executive Director" YOKTUR (UI-ADR-078).
 *
 * Alt menüler yalnızca dokümanda TANIMLI olan modüllerde vardır.
 * Tanımsız modüle alt menü uydurulmaz.
 */

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  Boxes,
  Brain,
  Building2,
  CandlestickChart,
  FolderKanban,
  Gauge,
  Landmark,
  LayoutDashboard,
  Library,
  ScrollText,
  Settings,
  ShoppingCart,
} from "lucide-react";

export interface NavChild {
  id: string;
  label: string;
  href: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Workspace tipi — 03-information-architecture.md §8 */
  type:
    | "executive"
    | "operational"
    | "analytical"
    | "knowledge"
    | "configuration"
    | "monitoring";
  children?: NavChild[];
}

export interface NavGroup {
  /** null ise kategori etiketi çizilmez (Mission Control / ODIN HQ) */
  label: string | null;
  items: NavItem[];
}

/** Amazon alt menüsü — 04-navigation-system.md §4'te açıkça tanımlı. */
const AMAZON_CHILDREN: NavChild[] = [
  { id: "amazon-dashboard", label: "Dashboard", href: "/amazon" },
  { id: "amazon-orders", label: "Orders", href: "/amazon/orders" },
  { id: "amazon-inventory", label: "Inventory", href: "/amazon/inventory" },
  { id: "amazon-ppc", label: "PPC", href: "/amazon/ppc" },
  { id: "amazon-listings", label: "Listings", href: "/amazon/listings" },
  { id: "amazon-profit", label: "Profit", href: "/amazon/profit" },
  { id: "amazon-forecast", label: "Forecast", href: "/amazon/forecast" },
  { id: "amazon-suppliers", label: "Suppliers", href: "/amazon/suppliers" },
  { id: "amazon-returns", label: "Returns", href: "/amazon/returns" },
];

/** System sekmeleri — 06-workspaces.md §8'de tanımlı. */
const SYSTEM_CHILDREN: NavChild[] = [
  { id: "system-health", label: "Health", href: "/system" },
  { id: "system-performance", label: "Performance", href: "/system/performance" },
  { id: "system-security", label: "Security", href: "/system/security" },
  { id: "system-ai-runtime", label: "AI Runtime", href: "/system/ai-runtime" },
  { id: "system-storage", label: "Storage", href: "/system/storage" },
  { id: "system-network", label: "Network", href: "/system/network" },
  { id: "system-backups", label: "Backups", href: "/system/backups" },
  { id: "system-version", label: "Version", href: "/system/version" },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      {
        id: "hq",
        label: "ODIN HQ",
        href: "/hq",
        icon: Building2,
        type: "executive",
      },
      {
        id: "mission-control",
        label: "Mission Control",
        href: "/mission-control",
        icon: LayoutDashboard,
        type: "operational",
      },
    ],
  },
  {
    label: "EXECUTIVE",
    items: [
      {
        id: "briefing",
        label: "Executive Briefing",
        href: "/briefing",
        icon: ScrollText,
        type: "executive",
      },
      {
        id: "decisions",
        label: "Decision Center",
        href: "/decisions",
        icon: Gauge,
        type: "operational",
      },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      {
        id: "amazon",
        label: "Amazon",
        href: "/amazon",
        icon: ShoppingCart,
        type: "operational",
        children: AMAZON_CHILDREN,
      },
      {
        id: "finance",
        label: "Finance",
        href: "/finance",
        icon: Landmark,
        type: "operational",
      },
      {
        id: "trading",
        label: "Trading",
        href: "/trading",
        icon: CandlestickChart,
        type: "monitoring",
      },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      {
        id: "knowledge",
        label: "Knowledge",
        href: "/knowledge",
        icon: Library,
        type: "knowledge",
      },
      {
        id: "memory",
        label: "Memory",
        href: "/memory",
        icon: Brain,
        type: "knowledge",
      },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      {
        id: "projects",
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
        type: "knowledge",
      },
      {
        id: "automation",
        label: "Automation",
        href: "/automation",
        icon: Bot,
        type: "operational",
      },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      {
        id: "system",
        label: "System",
        href: "/system",
        icon: Activity,
        type: "monitoring",
        children: SYSTEM_CHILDREN,
      },
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: Settings,
        type: "configuration",
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Bir yola karşılık gelen workspace. En uzun eşleşme kazanır. */
export function findWorkspaceByPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`)
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

export function findGroupOf(itemId: string): NavGroup | undefined {
  return NAV_GROUPS.find((g) => g.items.some((i) => i.id === itemId));
}

/** Boş workspace ikonu — placeholder sayfalar kullanır. */
export const FALLBACK_ICON = Boxes;
