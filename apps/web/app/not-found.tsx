"use client";

import Link from "next/link";
import { Button } from "@repo/ui";
import { MoveLeft, Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10" />
      
      <div className="space-y-8 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <h1 className="text-[180px] font-black text-white/5 leading-none select-none">404</h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Ghost className="w-24 h-24 text-primary animate-bounce duration-[3000ms]" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-white tracking-tight">Lost in Space?</h2>
          <p className="text-gray-400 max-w-md mx-auto text-lg leading-relaxed">
            The page you're looking for has vanished into the digital void. 
            Let's get you back to familiar territory.
          </p>
        </div>

        <Link href="/dashboard" className="block pt-8">
          <Button 
            size="lg" 
            className="h-14 px-10 rounded-2xl gap-3 text-lg font-semibold bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/40 transition-all active:scale-95 group"
          >
            <MoveLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-10 left-10 text-white/5 text-8xl font-black rotate-12 select-none">OOPS</div>
      <div className="absolute top-10 right-10 text-white/5 text-8xl font-black -rotate-12 select-none">EMPTY</div>
    </div>
  );
}
