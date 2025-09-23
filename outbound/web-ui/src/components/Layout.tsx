import { type ReactNode } from "react";
import { useRouter } from "next/router";
import { Navigation } from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const router = useRouter();
  
  // Don't show navigation on auth page
  if (router.pathname === "/auth") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0b132b] overflow-x-hidden">
      <Navigation key="main-navigation" />
      {/* Main content area with proper ID and spacing */}
      <main id="main-content" className="w-full min-h-screen bg-[#0b132b]">
        {children}
      </main>
    </div>
  );
} 