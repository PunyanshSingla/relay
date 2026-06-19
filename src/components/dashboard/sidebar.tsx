"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import {
  Inbox,
  Calendar,
  Users,
  Settings,
  Search,
  Sparkles,
  Clock,
  Zap,
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Send,
  AlertTriangle,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Logo } from "@/components/common/logo";
import { SyncIndicator } from "./sync-indicator";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  connected?: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function useUnreadCount() {
  const { data } = useSWR("/api/emails/counts", fetcher, { refreshInterval: 30000 });
  return typeof data?.unread === "number" ? data.unread : null;
}

function useLabels() {
  const { data } = useSWR("/api/labels", fetcher, { refreshInterval: 60000 });
  return (data?.labels as { id: string; name: string; unread: number }[]) ?? [];
}

function useConnectionStatus() {
  const { data } = useSWR("/api/connect/status", fetcher, { refreshInterval: 60000 });
  return (data as { gmail: boolean; calendar: boolean } | null) ?? null;
}

const aiItems: NavItem[] = [
  { label: "Command Center", href: "/dashboard/ai", icon: Sparkles },
  { label: "Follow-ups", href: "/dashboard/follow-ups", icon: Clock },
  { label: "Automations", href: "/dashboard/automations", icon: Zap },
];

interface SidebarProps {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

function NavLink({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className={cn("size-4 shrink-0", isActive && "text-primary")} />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.connected && (
            <span className="size-1.5 rounded-full bg-green-500 shrink-0" />
          )}
          {item.badge && (
            <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
              {item.badge}
            </Badge>
          )}
        </>
      )}
      {collapsed && item.connected && (
        <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-green-500" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function Sidebar({ collapsed = false, mobileOpen = false, onToggleCollapse, onCloseMobile, isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const unreadCount = useUnreadCount();
  const labels = useLabels();
  const connectionStatus = useConnectionStatus();

  const navItems: NavItem[] = [
    { label: "Inbox", href: "/dashboard/inbox", icon: Inbox, badge: unreadCount ?? undefined, connected: connectionStatus?.gmail },
    { label: "Starred", href: "/dashboard/inbox?filter=starred", icon: Star },
    { label: "Sent", href: "/dashboard/inbox?filter=sent", icon: Send },
    { label: "Spam", href: "/dashboard/inbox?filter=spam", icon: AlertTriangle },
    { label: "Trash", href: "/dashboard/inbox?filter=trash", icon: Trash2 },
    { label: "Calendar", href: "/dashboard/calendar", icon: Calendar, connected: connectionStatus?.calendar },
    { label: "Contacts", href: "/dashboard/contacts", icon: Users },
    { label: "Search", href: "/dashboard/search", icon: Search },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "flex h-full flex-col border-r border-border bg-card transition-all duration-200 relative z-50",
          isMobile
            ? cn(
                "fixed inset-y-0 left-0 w-64",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              )
            : cn(
                collapsed ? "w-16" : "w-64"
              )
        )}
      >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-4">
        {collapsed ? (
          <div className="flex w-full justify-center">
            <Link href="/" className="flex items-center">
              <span className="text-lg font-bold text-primary">R</span>
            </Link>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between">
            <Logo />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:inline-flex">
              <Command className="size-3" />K
            </kbd>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const itemUrl = new URL(item.href, "http://localhost");
            const currentUrl = new URL(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""), "http://localhost");
            const isActive = currentUrl.pathname === itemUrl.pathname && itemUrl.searchParams.toString() === currentUrl.searchParams.toString();
            return (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive}
                collapsed={collapsed}
              />
            );
          })}
        </nav>

        {/* AI Section */}
        <div className="mt-6">
          {!collapsed && (
            <div className="mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              AI
            </div>
          )}
          <nav className="space-y-1">
            {aiItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  collapsed={collapsed}
                />
              );
            })}
          </nav>
        </div>

        {/* Labels Section */}
        {labels.length > 0 && !collapsed && (
          <div className="mt-6">
            <div className="mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Labels
            </div>
            <nav className="space-y-1">
              {labels.map((label) => (
                <Link
                  key={label.id}
                  href={`/dashboard/inbox?q=label:${encodeURIComponent(label.name)}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <span className="flex-1 truncate">{label.name}</span>
                  {label.unread > 0 && (
                    <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                      {label.unread}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </ScrollArea>

      {/* Sync indicator */}
      <SyncIndicator collapsed={collapsed} />

      {/* Keyboard shortcuts hint */}
      {!collapsed && (
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Keyboard Shortcuts</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Command palette</span>
                <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">
                  Ctrl+K
                </kbd>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Compose</span>
                <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">
                  C
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edge handle - visible on hover, positioned on right border (desktop only) */}
      {!isMobile && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute top-1/2 -right-3 z-10 flex h-10 w-3 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-border bg-card text-muted-foreground opacity-0 transition-all hover:opacity-100 hover:w-5 hover:shadow-sm"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-3" />
          ) : (
            <PanelLeftClose className="size-3" />
          )}
        </button>
      )}
      </aside>
    </>
  );
}
