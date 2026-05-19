"use client";

import Link from "next/link";
import { Card, CardContent } from "@repo/ui";
import { 
  MessageSquare, 
  Users, 
  Brain, 
  CreditCard, 
  User, 
  Building2, 
  Bell, 
  Shield,
  Code,
  Webhook,
  Globe,
  ChevronRight
} from "lucide-react";

const settingsGroups = [
  {
    title: 'Workspace',
    items: [
      { icon: Building2, label: 'General', description: 'Company info, timezone, business hours', href: '/settings/general' },
      { icon: User, label: 'Profile', description: 'Your personal information', href: '/settings/profile' },
      { icon: Users, label: 'Team Members', description: 'Manage team and roles', href: '/settings/team' },
    ]
  },
  {
    title: 'Channels',
    items: [
      { icon: MessageSquare, label: 'WhatsApp', description: 'Connected numbers and settings', href: '/settings/whatsapp' },
      { icon: Bell, label: 'Notifications', description: 'Alert preferences', href: '/settings/notifications' },
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { icon: Brain, label: 'AI Configuration', description: 'Provider, model, and behavior settings', href: '/settings/ai' },
    ]
  },
  {
    title: 'Billing',
    items: [
      { icon: CreditCard, label: 'Billing & Plans', description: 'Subscription and invoices', href: '/settings/billing' },
    ]
  },
  {
    title: 'Developer',
    items: [
      { icon: Code, label: 'API Keys', description: 'Manage API access', href: '/settings/api' },
      { icon: Webhook, label: 'Webhooks', description: 'Outbound webhook endpoints', href: '/settings/webhooks' },
    ]
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your workspace configuration.</p>
      </div>

      {settingsGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">{group.title}</h2>
          <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <CardContent className="p-0 divide-y divide-white/5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 p-5 hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-zinc-500">{item.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
