"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  Calendar,
  Users,
  Settings,
  Search,
  Sparkles,
  Mail,
  Clock,
  Command,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/common/logo";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "Inbox", href: "/dashboard/inbox", icon: Inbox, badge: 12 },
  { label: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { label: "Contacts", href: "/dashboard/contacts", icon: Users },
  { label: "Search", href: "/dashboard/search", icon: Search },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const aiItems: NavItem[] = [
  { label: "Command Center", href: "/dashboard/ai", icon: Sparkles },
  { label: "Daily Brief", href: "/dashboard/brief", icon: Mail },
  { label: "Follow-ups", href: "/dashboard/follow-ups", icon: Clock },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-64"
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
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("size-4 shrink-0", isActive && "text-primary")} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
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
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("size-4 shrink-0", isActive && "text-primary")} />
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </ScrollArea>

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
    </aside>
  );
}
