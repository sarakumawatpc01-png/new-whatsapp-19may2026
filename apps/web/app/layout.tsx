import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { BrandingProvider } from "@/components/branding-provider";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Dyad | AI-Native WhatsApp Marketing & Automation Platform",
    template: "%s | Dyad AI"
  },
  description: "Scale your business with AI-powered WhatsApp campaigns, automated support, and smart CRM. The next-generation WhatsApp SaaS for growing retail brands.",
  keywords: ["whatsapp marketing", "ai automation", "saas", "customer support", "whatsapp api", "marketing automation"],
  authors: [{ name: "Dyad AI Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
