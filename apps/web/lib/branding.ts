export interface ResellerBranding {
  name: string;
  logo: string | null;
  primaryColor: string;
  accentColor: string;
  theme: "light" | "dark" | "system";
  hidePoweredBy: boolean;
  customDomain: string | null;
}

export async function fetchBranding(): Promise<ResellerBranding> {
  try {
    const res = await fetch("/api/reseller/branding");
    if (!res.ok) throw new Error("Failed to fetch branding");
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching branding:", error);
    return {
      name: "SaaS Platform",
      logo: null,
      primaryColor: "#0f172a",
      accentColor: "#3b82f6",
      theme: "light",
      hidePoweredBy: false,
      customDomain: null,
    };
  }
}

export function applyBranding(branding: ResellerBranding) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  
  if (branding.primaryColor) {
    // Basic implementation - in a real app, you'd calculate HSL values for Tailwind
    root.style.setProperty("--primary", branding.primaryColor);
  }
  
  if (branding.accentColor) {
    root.style.setProperty("--accent", branding.accentColor);
  }

  // Handle theme
  if (branding.theme === "dark") {
    root.classList.add("dark");
  } else if (branding.theme === "light") {
    root.classList.remove("dark");
  }
}
