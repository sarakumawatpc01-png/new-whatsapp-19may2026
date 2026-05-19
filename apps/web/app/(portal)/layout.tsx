"use client";

import { BrandingProvider } from "@/components/branding-provider";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary selection:text-white">
      <BrandingProvider>
        {children}
      </BrandingProvider>
    </div>
  );
}
