import { Shield, Zap, Globe, Lock, TrendingUp, RefreshCcw } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Transactions",
    description: "Lightning-fast blockchain settlements with real-time UPI confirmations",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Multi-layer encryption with biometric authentication and cold storage",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Send crypto globally, receive in local currency via UPI instantly",
  },
  {
    icon: Lock,
    title: "Zero Knowledge Proofs",
    description: "Complete privacy with advanced cryptographic protocols",
  },
  {
    icon: TrendingUp,
    title: "Best Rates",
    description: "Real-time exchange rates with 0.1% fees - lowest in the industry",
  },
  {
    icon: RefreshCcw,
    title: "Instant Swaps",
    description: "One-tap conversion between 50+ cryptocurrencies and fiat",
  },
];

export const Features = () => {
  return (
    <section className="py-32 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Why Choose <span className="gradient-text">PayChain</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built for the future, accessible today. Experience the next generation of payments.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-8 rounded-3xl hover:scale-105 transition-all duration-300 hover:shadow-glow group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
