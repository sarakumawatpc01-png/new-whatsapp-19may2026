"use client";

import Link from "next/link";
import { ArrowRight, MessageSquare, Zap, Globe, Shield, Activity } from "lucide-react";
import { Button } from "@repo/ui";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden selection:bg-primary/30 relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] opacity-40 animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 glass-darker border-b border-white/5 px-6 lg:px-12 h-20 flex items-center justify-between sticky top-0 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-primary to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <MessageSquare className="text-white" size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            WHATSAPP AI
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#developers" className="hover:text-white transition-colors">API</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl font-bold">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary text-white hover:opacity-90 rounded-2xl font-black px-6 shadow-2xl shadow-primary/40 transition-all hover:scale-105">
              Start Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 pt-32 pb-24 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass border border-white/10 bg-white/5 backdrop-blur-md mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Next-Gen WhatsApp Engine</span>
        </motion.div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
          Automate. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-400 to-purple-500">
            Dominate.
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
          The all-in-one AI platform to scale your WhatsApp marketing, sales, and support. Built for retail brands that move fast.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
          <Link href="/signup">
            <Button className="h-16 px-10 bg-primary text-white rounded-2xl text-xl font-black shadow-2xl shadow-primary/40 transition-all hover:scale-105 group">
              Get Started for Free
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={24} />
            </Button>
          </Link>
          <Link href="#demo">
            <Button variant="outline" className="h-16 px-10 border-white/10 hover:bg-white/5 rounded-2xl text-xl font-bold glass backdrop-blur-lg transition-all hover:scale-105">
              Watch Demo
            </Button>
          </Link>
        </div>

        {/* Dashboard Mockup Showcase */}
        <div className="relative max-w-6xl mx-auto mt-20 p-4 glass-darker rounded-[40px] border border-white/10 shadow-[0_64px_128px_-16px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-1000">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
          <img 
            src="/dashboard_mockup_1777875632155.png" 
            alt="WhatsApp AI Dashboard" 
            className="rounded-[32px] w-full shadow-2xl border border-white/5"
          />
        </div>

        {/* Trusted By Section */}
        <div className="mt-32 pt-20 border-t border-white/5">
           <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-12">Empowering 2,500+ High-Growth Brands</p>
           <div className="flex flex-wrap justify-center items-center gap-16 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
              {['Shopify', 'Amazon', 'Nike', 'Zara', 'Adidas'].map(brand => (
                 <span key={brand} className="text-3xl font-black tracking-tighter text-white hover:text-primary cursor-default">{brand}</span>
              ))}
           </div>
        </div>

        {/* Feature Cards Grid */}
        <div id="features" className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
          <div className="glass-card p-10 group cursor-pointer">
            <div className="h-16 w-16 rounded-[24px] bg-primary/10 flex items-center justify-center mb-8 text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-primary/5">
              <Zap size={32} />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tight">AI Sales Copilot</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              Automate lead qualification and level-1 support with AI that sounds human and converts 3x better.
            </p>
          </div>

          <div className="glass-card p-10 group cursor-pointer">
            <div className="h-16 w-16 rounded-[24px] bg-indigo-500/10 flex items-center justify-center mb-8 text-indigo-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-indigo-500/5">
              <Activity size={32} />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tight">Smart Campaigns</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              Send personalized broadcasts with dynamic variables and automated follow-ups to skyrocket your ROI.
            </p>
          </div>

          <div className="glass-card p-10 group cursor-pointer">
            <div className="h-16 w-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center mb-8 text-emerald-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-emerald-500/5">
              <Shield size={32} />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tight">Enterprise Shield</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              Industrial-grade security, multi-tenant isolation, and official WhatsApp Business API integration.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
