"use client";

import { useEffect, useState } from "react";
import { fetchBranding, applyBranding, ResellerBranding } from "@/lib/branding";

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<ResellerBranding | null>(null);

  useEffect(() => {
    fetchBranding().then((data) => {
      setBranding(data);
      applyBranding(data);
    });
  }, []);

  return (
    <>
      {children}
      {branding && !branding.hidePoweredBy && (
        <div className="fixed bottom-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded border z-50">
          Powered by SaaS Platform
        </div>
      )}
    </>
  );
}
