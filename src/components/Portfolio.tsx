import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Plus, ExternalLink } from "lucide-react";

interface PortfolioItem {
  name: string;
  symbol: string;
  amount: string;
  value: string;
  change: number;
  logo: string;
}

export const Portfolio = () => {
  const portfolioItems: PortfolioItem[] = [
    {
      name: "Ethereum",
      symbol: "ETH",
      amount: "1.823",
      value: "₹4,46,923",
      change: 5.2,
      logo: "⟠",
    },
    {
      name: "Bitcoin",
      symbol: "BTC",
      amount: "0.042",
      value: "₹2,03,700",
      change: 3.8,
      logo: "₿",
    },
    {
      name: "Tether",
      symbol: "USDT",
      amount: "5,420",
      value: "₹4,52,570",
      change: 0.1,
      logo: "₮",
    },
    {
      name: "UPI Wallet",
      symbol: "INR",
      amount: "45,680",
      value: "₹45,680",
      change: 0,
      logo: "₹",
    },
  ];

  const totalValue = portfolioItems.reduce((sum, item) => {
    return sum + parseFloat(item.value.replace(/[₹,]/g, ""));
  }, 0);

  const totalChange = 4.3;

  return (
    <div className="glass-card p-6 rounded-3xl hover:shadow-glow-secondary transition-all animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Portfolio Overview</h2>
          <div className="flex items-center gap-3">
            <p className="text-4xl font-bold gradient-text">
              ₹{totalValue.toLocaleString("en-IN")}
            </p>
            <Badge
              className={`${
                totalChange >= 0
                  ? "bg-accent/10 text-accent border-accent/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              {totalChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {totalChange >= 0 ? "+" : ""}
              {totalChange}%
            </Badge>
          </div>
        </div>

        <Button className="bg-gradient-primary hover:opacity-90 hover:scale-105 transition-all gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {portfolioItems.map((item, index) => (
          <Card
            key={index}
            className="p-4 bg-gradient-to-br from-card to-card/50 border-2 border-border/50 hover:border-primary/30 hover:scale-105 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                  {item.logo}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.symbol}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Amount</p>
                <p className="font-semibold">{item.amount} {item.symbol}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Value</p>
                <p className="font-bold text-lg">{item.value}</p>
              </div>
              {item.change !== 0 && (
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className={`${
                      item.change >= 0
                        ? "border-accent/30 text-accent"
                        : "border-destructive/30 text-destructive"
                    }`}
                  >
                    {item.change >= 0 ? "+" : ""}
                    {item.change}%
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
