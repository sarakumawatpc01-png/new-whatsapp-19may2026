'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui'
import { Shield, Lock, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function AdminLoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res: any = await api.post('/auth/superadmin/login', { email, password })
      if (res.success) {
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken || '')
        toast.success('Welcome to Command Center')
        router.push('/dashboard')
      }
    } catch (err: any) {
      setLoading(false)
      toast.error(err.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[150px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="glass-card p-10 space-y-8 relative overflow-hidden">
          <div className="text-center space-y-4">
             <div className="h-16 w-16 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary shadow-2xl shadow-primary/20">
                <Shield size={32} />
             </div>
             <h1 className="text-4xl font-black text-white tracking-tighter italic">SUPERADMIN</h1>
             <p className="text-slate-400 font-medium">Platform Orchestration Layer</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Admin Identity</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-primary/50 transition-all"
                placeholder="admin@platform.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Access Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-primary/50 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-primary text-white rounded-2xl font-black text-lg shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
            >
              {loading ? "Authenticating..." : (
                <>
                  Enter System <ArrowRight size={20} />
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
