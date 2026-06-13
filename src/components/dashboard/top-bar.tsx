"use client";

import { Search, Bell, Command, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { UserMenu } from "./user-menu";

interface TopBarProps {
  onCommandPaletteOpen?: () => void;
  sidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function TopBar({ onCommandPaletteOpen, sidebarCollapsed, onToggleCollapse }: TopBarProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      {/* Sidebar toggle */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onToggleCollapse}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        </TooltipContent>
      </Tooltip>

      {/* Search bar */}
      <div className="flex-1 max-w-xl">
        <button
          onClick={onCommandPaletteOpen}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 text-left">Search emails, contacts, or commands...</span>
          <kbd className="hidden pointer-events-none h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
            <Command className="size-3" />K
          </kbd>
        </button>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button variant="ghost" size="icon" className="relative size-9 text-muted-foreground hover:text-foreground">
          <Bell className="size-4" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}
