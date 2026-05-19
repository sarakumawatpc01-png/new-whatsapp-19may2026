"use client";

import { useEffect } from "react";
import { Button } from "@repo/ui";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8 animate-bounce">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      
      <h1 className="text-4xl font-bold text-white mb-4">Something went wrong!</h1>
      <p className="text-gray-400 mb-12 max-w-md mx-auto leading-relaxed">
        We've encountered an unexpected error. Our team has been notified. 
        In the meantime, you can try refreshing the page or head back home.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mx-auto">
        <Button 
          onClick={() => reset()}
          className="flex-1 h-12 rounded-xl gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <RefreshCcw size={18} />
          Try Again
        </Button>
        <Link href="/dashboard" className="flex-1">
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl gap-2 border-white/10 hover:bg-white/5 text-gray-400"
          >
            <Home size={18} />
            Go Home
          </Button>
        </Link>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-12 p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-left overflow-auto max-w-2xl w-full">
          <p className="text-xs font-mono text-red-400 whitespace-pre-wrap">
            {error.stack}
          </p>
        </div>
      )}
    </div>
  );
}
