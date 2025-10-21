import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { WalletDashboard } from "@/components/WalletDashboard";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <WalletDashboard />
    </div>
  );
};

export default Index;
