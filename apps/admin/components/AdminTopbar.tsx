'use client'

import React from 'react'
import { Bell, Search, User, LogOut, ExternalLink } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@repo/ui/components/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'

export function AdminTopbar() {
  return (
    <header className="h-16 border-b border-white/5 bg-[#111113]/80 backdrop-blur-xl flex items-center justify-between px-8 z-10 sticky top-0">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
          <Input 
            placeholder="Search tenants, plans, or logs..." 
            className="pl-10 bg-white/5 border-white/5 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl h-10 w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#111113]" />
        </Button>
        
        <div className="h-8 w-px bg-white/5 mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-1 pr-3 gap-3 rounded-xl hover:bg-white/5">
              <Avatar className="w-8 h-8 rounded-lg border border-white/10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-600/20 text-blue-400 text-xs">AD</AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-white">Administrator</p>
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">SuperAdmin</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#111113] border-white/10 text-white rounded-xl shadow-2xl">
            <DropdownMenuLabel className="text-xs font-medium text-zinc-500 px-3 py-2 uppercase tracking-widest">My Account</DropdownMenuLabel>
            <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer py-2.5 rounded-lg mx-1 my-0.5 gap-3">
              <User className="w-4 h-4 text-zinc-400" />
              <span>Admin Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer py-2.5 rounded-lg mx-1 my-0.5 gap-3">
              <ExternalLink className="w-4 h-4 text-zinc-400" />
              <span>Main Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="focus:bg-red-500/10 focus:text-red-400 text-red-400 cursor-pointer py-2.5 rounded-lg mx-1 my-0.5 gap-3">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
