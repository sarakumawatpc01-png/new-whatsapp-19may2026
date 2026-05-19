"use client";

import { useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res: any = await api.post("/auth/forgot-password", { email });
      if (res.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.error || "Failed to request reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        layout
        className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl border border-white/10 relative z-10"
      >
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.form 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleForgot} 
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-white">Reset Password</h1>
                <p className="text-muted-foreground mt-2">Enter your email to receive a reset link</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email Address</label>
                <input 
                  type="email" required 
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white placeholder-gray-500"
                  placeholder="you@company.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex justify-center items-center">
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Send Reset Link"}
              </button>

              <p className="text-center text-sm text-gray-400 mt-6">
                Remember your password? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </motion.form>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-6"
            >
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary text-2xl">
                📬
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Check your email</h1>
                <p className="text-gray-400 mt-2">If an account exists for {email}, a password reset link has been sent.</p>
              </div>
              <Link href="/login" className="block w-full py-3 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors">
                Return to Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
