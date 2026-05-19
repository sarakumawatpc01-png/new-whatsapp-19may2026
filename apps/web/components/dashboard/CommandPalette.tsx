"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Users,
  Megaphone,
  Workflow,
  BarChart3,
  FileText,
  Settings,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@repo/ui";
import { useUIStore } from "@/store/uiStore";

const navItems = [
  { icon: MessageSquare, label: "Inbox", href: "/dashboard" },
  { icon: Users, label: "Contacts", href: "/contacts" },
  { icon: Megaphone, label: "Campaigns", href: "/campaigns" },
  { icon: Workflow, label: "Automations", href: "/automations" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: FileText, label: "Templates", href: "/templates" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function CommandPalette() {
  const open = useUIStore((s: any) => s.commandPaletteOpen);
  const setOpen = useUIStore((s: any) => s.setCommandPaletteOpen);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList className="glass-card">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => runCommand(() => router.push(item.href))}
              className="flex items-center gap-2 text-gray-300 hover:text-white"
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => {})} className="text-gray-300 hover:text-white">
            <Search size={16} className="mr-2" />
            Search Conversations
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {})} className="text-gray-300 hover:text-white">
            <Users size={16} className="mr-2" />
            Add New Contact
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
