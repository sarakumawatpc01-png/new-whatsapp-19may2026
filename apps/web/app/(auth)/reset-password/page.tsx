"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must be at least 8 chars, 1 uppercase, 1 number");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res: any = await api.post("/auth/reset-password", { token, newPassword: password });
      if (res.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token && !success) {
    return (
      <div className="text-center">
        <h1 className="text-2xl text-white mb-4">Invalid Link</h1>
        <p className="text-gray-400 mb-6">The password reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="text-primary hover:underline">Request a new one</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-6 py-6">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary text-2xl">
          ✅
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Password Reset</h1>
          <p className="text-gray-400 mt-2">Your password has been successfully reset.</p>
        </div>
        <button onClick={() => router.push("/login")} className="w-full py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleReset} className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">New Password</h1>
        <p className="text-muted-foreground mt-2">Enter your new password below</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">New Password</label>
        <input 
          type="password" required 
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white placeholder-gray-500"
          placeholder="••••••••"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button type="submit" disabled={loading} className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex justify-center items-center">
        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl border border-white/10 relative z-10"
      >
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
