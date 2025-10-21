import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 glass-card rounded-full">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">The Future of Payments</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
          Bridge <span className="gradient-text">Blockchain</span>
          <br />
          with <span className="gradient-text">UPI</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
          Experience seamless crypto-to-fiat transactions. Pay with blockchain, receive via UPI, 
          or vice versa - all in one revolutionary platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90 transition-all hover:scale-105 hover:shadow-glow group"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="border-primary/50 hover:bg-primary/10 hover:border-primary transition-all"
          >
            View Dashboard
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
          <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform">
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">$2.5B+</div>
            <div className="text-sm text-muted-foreground">Transaction Volume</div>
          </div>
          <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform">
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">150K+</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
          <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform">
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">0.1%</div>
            <div className="text-sm text-muted-foreground">Lowest Fees</div>
          </div>
        </div>
      </div>
    </section>
  );
};
