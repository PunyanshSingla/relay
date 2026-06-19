"use client";

import { Suspense, useState, useEffect } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useKeyboardShortcuts();

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <QueryProvider>
      <SyncStatusProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Sidebar */}
          <Suspense fallback={<div className="w-64 h-full bg-sidebar border-r border-sidebar-border" />}>
            <Sidebar
              collapsed={isMobile ? false : sidebarCollapsed}
              mobileOpen={sidebarOpen}
              onToggleCollapse={toggleSidebar}
              onCloseMobile={closeMobileSidebar}
              isMobile={isMobile}
            />
          </Suspense>

          {/* Main content area */}
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            {/* Top bar */}
            <TopBar
              onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
              sidebarCollapsed={isMobile ? !sidebarOpen : sidebarCollapsed}
              onToggleCollapse={toggleSidebar}
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
