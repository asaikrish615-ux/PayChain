import { lazy, Suspense } from "react";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";

// Lazy load below-the-fold components to reduce initial bundle
const WalletDashboard = lazy(() => import("@/components/WalletDashboard").then(m => ({ default: m.WalletDashboard })));
const AIChat = lazy(() => import("@/components/AIChat").then(m => ({ default: m.AIChat })));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <Suspense fallback={<div className="h-96" />}>
        <WalletDashboard />
      </Suspense>
      <Suspense fallback={<div className="h-96" />}>
        <AIChat />
      </Suspense>
    </div>
  );
};

export default Index;
