"use client";

import { Suspense, useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { SyncStatusProvider } from "@/contexts/sync-status-context";
import { QueryProvider } from "@/providers/query-provider";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard shortcuts (C for compose works everywhere)
  // Thread-specific shortcuts (R, Shift+R, F, E) are handled in the thread view page
  useKeyboardShortcuts();

  return (
    <QueryProvider>
      <SyncStatusProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Sidebar */}
          <Suspense fallback={<div className="w-64 h-full bg-sidebar border-r border-sidebar-border" />}>
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            />
          </Suspense>

          {/* Main content area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Top bar */}
            <TopBar
              onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
              sidebarCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            />

            {/* Main content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </main>
          </div>

          {/* Command palette */}
          <CommandPalette
            open={commandPaletteOpen}
            onOpenChange={setCommandPaletteOpen}
          />
        </div>
      </SyncStatusProvider>
    </QueryProvider>
  );
}
