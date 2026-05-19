"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { ArrowRight, UserPlus, Sparkles, CheckCircle2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

function getPasswordStrength(password: string): { label: string; color: string; width: string; score: number } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "w-1/4", score };
  if (score <= 2) return { label: "Fair", color: "bg-orange-500", width: "w-2/4", score };
  if (score <= 3) return { label: "Medium", color: "bg-yellow-500", width: "w-3/4", score };
  return { label: "Strong", color: "bg-emerald-500", width: "w-full", score };
}

export default function SignupForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => setMounted(true), []);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    
    setLoading(true);
    try {
      const res: any = await api.post("/auth/signup", { 
        email, 
        password, 
        name,
        companyName: companyName || name
      });
      if (res.success) {
        setAuth({
          user: res.data.user,
          tenant: res.data.tenant,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        });
        toast.success("Account created successfully!");
        setStep(3);
      }
    } catch (err: any) {
      setLoading(false);
      const message = typeof err.error === 'string' 
        ? err.error 
        : (err.message || "Signup failed");
      toast.error(String(message));
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-0 w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[30%] h-[30%] bg-violet-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[480px]"
      >
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${step >= s 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                  : 'bg-white/5 text-slate-500 border border-white/10'}
              `}>
                {step > s ? <CheckCircle2 size={16} /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-0.5 rounded transition-all ${step > s ? 'bg-indigo-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 font-medium mb-6">
          Step {step} of 3
        </p>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-10 relative overflow-hidden shadow-2xl shadow-black/50">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleStep1} 
                className="space-y-8"
              >
                <div className="space-y-4">
                   <div className="h-16 w-16 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center text-indigo-500 mb-6">
                      <UserPlus size={32} />
                   </div>
                   <h1 className="text-3xl font-black text-white tracking-tighter">Create Your Account</h1>
                   <p className="text-slate-400 font-medium">Start your 14-day free trial. No credit card required.</p>
                </div>

                <div className="space-y-5">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
                      <input
                        type="email" required
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500/50 transition-all placeholder-slate-600"
                        placeholder="you@company.com"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"} required
                          value={password} onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 pr-12 text-white outline-none focus:border-indigo-500/50 transition-all placeholder-slate-600"
                          placeholder="Min. 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {/* Password Strength Meter */}
                      {password.length > 0 && (
                        <div className="space-y-1.5 mt-2">
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${strength.color} ${strength.width} rounded-full transition-all duration-300`} />
                          </div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${
                            strength.score <= 1 ? 'text-red-400' :
                            strength.score <= 2 ? 'text-orange-400' :
                            strength.score <= 3 ? 'text-yellow-400' : 'text-emerald-400'
                          }`}>
                            {strength.label}
                          </p>
                        </div>
                      )}
                   </div>
                </div>

                <Button type="submit" className="w-full h-14 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Next <ArrowRight size={20} className="ml-2" />
                </Button>

                <p className="text-center text-xs font-bold text-slate-500">
                  Already have an account? <Link href="/login" className="text-indigo-400 underline underline-offset-4 hover:text-indigo-300">Sign in</Link>
                </p>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleStep2} 
                className="space-y-8"
              >
                <div className="space-y-4">
                   <div className="h-16 w-16 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center text-violet-400 mb-6">
                      <Sparkles size={32} />
                   </div>
                   <h1 className="text-3xl font-black text-white tracking-tighter">Your Details</h1>
                   <p className="text-slate-400 font-medium">Tell us about yourself and your company.</p>
                </div>

                <div className="space-y-5">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
                      <input
                        type="text" required
                        value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-violet-500/50 transition-all placeholder-slate-600"
                        placeholder="John Doe"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Company Name</label>
                      <input
                        type="text"
                        value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-violet-500/50 transition-all placeholder-slate-600"
                        placeholder="Acme Corporation"
                      />
                   </div>
                </div>

                <div className="flex gap-3">
                   <Button type="button" onClick={() => setStep(1)} variant="ghost" className="h-14 flex-1 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5">
                      <ArrowLeft size={16} className="mr-2" /> Back
                   </Button>
                   <Button disabled={loading} type="submit" className="h-14 flex-[2] bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-lg shadow-2xl shadow-violet-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      {loading ? (
                        <div className="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Create Account"
                      )}
                   </Button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-8 py-6"
              >
                <div className="h-24 w-24 bg-emerald-500/20 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-2xl shadow-emerald-500/20">
                   <CheckCircle2 size={48} />
                </div>
                <div className="space-y-3">
                   <h1 className="text-3xl font-black text-white tracking-tighter">You&apos;re All Set!</h1>
                   <p className="text-slate-400 font-medium">
                     Check your inbox at <span className="text-indigo-400 font-semibold">{email}</span> for a verification link.
                   </p>
                </div>
                <Button 
                  onClick={() => router.push("/dashboard")} 
                  className="w-full h-14 bg-white text-black rounded-2xl font-black text-lg hover:bg-slate-200 transition-all"
                >
                  Continue to Dashboard
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
