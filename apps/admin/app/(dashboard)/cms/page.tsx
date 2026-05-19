'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { FileText, Plus, Edit, Eye, Trash2, Globe, Search } from 'lucide-react'
import { toast } from 'sonner'

const mockPages = [
  { id: 'p_1', title: 'Home', slug: '/', status: 'PUBLISHED', lastEdited: '1d ago', views: 12450 },
  { id: 'p_2', title: 'Features', slug: '/features', status: 'PUBLISHED', lastEdited: '3d ago', views: 8320 },
  { id: 'p_3', title: 'Pricing', slug: '/pricing', status: 'PUBLISHED', lastEdited: '5d ago', views: 6240 },
  { id: 'p_4', title: 'Terms of Service', slug: '/terms', status: 'PUBLISHED', lastEdited: '1m ago', views: 940 },
  { id: 'p_5', title: 'Privacy Policy', slug: '/privacy', status: 'PUBLISHED', lastEdited: '1m ago', views: 720 },
  { id: 'p_6', title: 'New Landing Page', slug: '/launch', status: 'DRAFT', lastEdited: '2h ago', views: 0 },
]

export default function CmsPage() {
  const [search, setSearch] = useState('')

  const filtered = mockPages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pages / CMS</h1>
          <p className="text-zinc-500 mt-1">Manage website pages and content.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" /> New Page
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pages..."
          className="w-full bg-[#111113] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-indigo-500/50 text-sm" />
      </div>

      <Card className="bg-[#111113] border-white/5 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Page</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Slug</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Views</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Last Edited</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((page) => (
                <tr key={page.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-white">{page.title}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="text-xs font-mono text-zinc-400">{page.slug}</code>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      page.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {page.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-zinc-400 tabular-nums">{page.views.toLocaleString()}</td>
                  <td className="p-4 text-xs text-zinc-500">{page.lastEdited}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
