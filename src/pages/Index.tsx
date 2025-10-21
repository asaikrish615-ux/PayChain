import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { WalletDashboard } from "@/components/WalletDashboard";
import { AIChat } from "@/components/AIChat";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <WalletDashboard />
      <AIChat />
    </div>
  );
};

export default Index;
