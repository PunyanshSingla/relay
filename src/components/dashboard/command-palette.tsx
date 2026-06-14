"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Inbox,
  Calendar,
  Users,
  Settings,
  Sparkles,
  Mail,
  Clock,
  FileText,
  Send,
  Reply,
  Forward,
  Trash,
  Archive,
  Star,
  Plus,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/inbox"))}
          >
            <Inbox className="mr-2 size-4" />
            <span>Inbox</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/calendar"))}
          >
            <Calendar className="mr-2 size-4" />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/contacts"))}
          >
            <Users className="mr-2 size-4" />
            <span>Contacts</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/ai"))}
          >
            <Sparkles className="mr-2 size-4" />
            <span>AI Command Center</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/brief"))}
          >
            <Mail className="mr-2 size-4" />
            <span>Daily Brief</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/settings"))}
          >
            <Settings className="mr-2 size-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Email Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/compose"))}
          >
            <Plus className="mr-2 size-4" />
            <span>Compose Email</span>
            <kbd className="ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              C
            </kbd>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {})}>
            <Reply className="mr-2 size-4" />
            <span>Reply to Email</span>
            <kbd className="ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              R
            </kbd>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {})}>
            <Forward className="mr-2 size-4" />
            <span>Forward Email</span>
            <kbd className="ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              F
            </kbd>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {})}>
            <Archive className="mr-2 size-4" />
            <span>Archive Email</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {})}>
            <Trash className="mr-2 size-4" />
            <span>Delete Email</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {})}>
            <Star className="mr-2 size-4" />
            <span>Star Email</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Calendar Actions">
          <CommandItem onSelect={() => runCommand(() => {})}>
            <Plus className="mr-2 size-4" />
            <span>Create Event</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {})}>
            <Send className="mr-2 size-4" />
            <span>Send Calendar Invite</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="AI">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/ai"))}>
            <Sparkles className="mr-2 size-4" />
            <span>Open AI Command Center</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/follow-ups"))}>
            <Clock className="mr-2 size-4" />
            <span>View Follow-ups</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/brief"))}>
            <FileText className="mr-2 size-4" />
            <span>Generate Daily Brief</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
