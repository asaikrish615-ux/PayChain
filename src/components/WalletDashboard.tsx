import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { TransactionCard } from "./TransactionCard";

export const WalletDashboard = () => {
  const [showBalance, setShowBalance] = useState(true);

  const transactions = [
    {
      type: "received" as const,
      amount: "₹5,200",
      crypto: "0.0654 ETH",
      from: "Rajesh Kumar",
      time: "2 min ago",
      status: "completed" as const,
    },
    {
      type: "sent" as const,
      amount: "₹12,450",
      crypto: "0.156 ETH",
      to: "Priya Sharma",
      time: "1 hour ago",
      status: "completed" as const,
    },
    {
      type: "exchange" as const,
      amount: "₹8,900",
      crypto: "0.112 ETH → ₹8,900",
      time: "3 hours ago",
      status: "completed" as const,
    },
  ];

  return (
    <section className="py-32 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Your <span className="gradient-text">Unified</span> Wallet
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage crypto and fiat in one beautiful interface
          </p>
        </div>

        {/* Balance Card */}
        <div className="glass-card p-8 rounded-3xl mb-8 hover:shadow-glow-secondary transition-all">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
              <div className="flex items-center gap-3">
                {showBalance ? (
                  <h3 className="text-5xl font-bold gradient-text">₹1,45,680</h3>
                ) : (
                  <h3 className="text-5xl font-bold">••••••</h3>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBalance(!showBalance)}
                  className="hover:bg-primary/10"
                >
                  {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {showBalance && (
                <p className="text-sm text-muted-foreground mt-2">≈ 1.823 ETH + ₹45,680 UPI</p>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                size="icon" 
                className="h-14 w-14 rounded-full bg-gradient-primary hover:opacity-90 hover:scale-110 transition-all"
              >
                <ArrowUpRight className="h-6 w-6" />
              </Button>
              <Button 
                size="icon" 
                className="h-14 w-14 rounded-full bg-gradient-primary hover:opacity-90 hover:scale-110 transition-all"
              >
                <ArrowDownLeft className="h-6 w-6" />
              </Button>
              <Button 
                size="icon" 
                className="h-14 w-14 rounded-full bg-secondary/20 hover:bg-secondary/30 hover:scale-110 transition-all"
              >
                <RefreshCcw className="h-6 w-6 text-secondary" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Crypto Assets</p>
              <p className="text-2xl font-bold text-primary">₹1,00,000</p>
            </div>
            <div className="bg-secondary/10 rounded-2xl p-4 border border-secondary/20">
              <p className="text-sm text-muted-foreground mb-1">UPI Balance</p>
              <p className="text-2xl font-bold text-secondary">₹45,680</p>
            </div>
            <div className="bg-accent/10 rounded-2xl p-4 border border-accent/20">
              <p className="text-sm text-muted-foreground mb-1">Monthly Gain</p>
              <p className="text-2xl font-bold text-accent">+12.5%</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Recent Activity</h3>
            <Button variant="link" className="text-primary">View All</Button>
          </div>

          <div className="space-y-4">
            {transactions.map((transaction, index) => (
              <TransactionCard key={index} {...transaction} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
