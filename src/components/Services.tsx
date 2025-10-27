import { 
  Smartphone, 
  Zap, 
  Droplets, 
  Flame, 
  Wifi, 
  Plane, 
  Train, 
  Hotel, 
  Shield, 
  HandCoins, 
  TrendingUp, 
  Gem, 
  Ticket, 
  ShoppingBag, 
  Gamepad2,
  CreditCard
} from "lucide-react";

const services = [
  {
    icon: Smartphone,
    title: "Mobile Recharge",
    description: "Instant prepaid & postpaid",
    color: "primary",
  },
  {
    icon: Zap,
    title: "Electricity",
    description: "Pay your electricity bills",
    color: "accent",
  },
  {
    icon: Droplets,
    title: "Water Bill",
    description: "Pay water bills online",
    color: "secondary",
  },
  {
    icon: Flame,
    title: "Gas Booking",
    description: "Book LPG cylinders",
    color: "primary",
  },
  {
    icon: Wifi,
    title: "DTH Recharge",
    description: "All DTH operators",
    color: "secondary",
  },
  {
    icon: CreditCard,
    title: "Credit Card",
    description: "Pay credit card bills",
    color: "accent",
  },
  {
    icon: Plane,
    title: "Flights",
    description: "Book domestic & international",
    color: "primary",
  },
  {
    icon: Train,
    title: "Trains",
    description: "IRCTC train tickets",
    color: "secondary",
  },
  {
    icon: Hotel,
    title: "Hotels",
    description: "Book hotels worldwide",
    color: "accent",
  },
  {
    icon: Shield,
    title: "Insurance",
    description: "Life, health & vehicle",
    color: "primary",
  },
  {
    icon: HandCoins,
    title: "Loans",
    description: "Instant personal loans",
    color: "secondary",
  },
  {
    icon: TrendingUp,
    title: "Mutual Funds",
    description: "Invest & grow wealth",
    color: "accent",
  },
  {
    icon: Gem,
    title: "Digital Gold",
    description: "Buy & sell gold online",
    color: "primary",
  },
  {
    icon: Ticket,
    title: "Events & Movies",
    description: "Book tickets instantly",
    color: "secondary",
  },
  {
    icon: ShoppingBag,
    title: "Shopping",
    description: "Exclusive deals & offers",
    color: "accent",
  },
  {
    icon: Gamepad2,
    title: "Games",
    description: "Play & win rewards",
    color: "primary",
  },
];

const getIconBgColor = (color: string) => {
  switch (color) {
    case "primary":
      return "bg-primary/10 group-hover:bg-primary/20";
    case "secondary":
      return "bg-secondary/10 group-hover:bg-secondary/20";
    case "accent":
      return "bg-accent/10 group-hover:bg-accent/20";
    default:
      return "bg-primary/10";
  }
};

const getIconColor = (color: string) => {
  switch (color) {
    case "primary":
      return "text-primary";
    case "secondary":
      return "text-secondary";
    case "accent":
      return "text-accent";
    default:
      return "text-primary";
  }
};

export const Services = () => {
  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            All-in-One <span className="gradient-text">FinTech Platform</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From payments to investments, manage everything in one place
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="glass-card p-6 rounded-2xl hover:scale-105 transition-all duration-300 cursor-pointer group hover:shadow-glow-primary"
            >
              <div className={`w-12 h-12 rounded-xl ${getIconBgColor(service.color)} flex items-center justify-center mb-4 transition-all duration-300`}>
                <service.icon className={`w-6 h-6 ${getIconColor(service.color)}`} />
              </div>
              <h3 className="text-base md:text-lg font-bold mb-1">{service.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 glass-card p-8 rounded-3xl text-center">
          <h3 className="text-2xl font-bold mb-3">
            Earn <span className="gradient-text-secondary">Cashback & Rewards</span>
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get instant cashback on every transaction. Earn reward points that can be redeemed for exciting offers and discounts.
          </p>
        </div>
      </div>
    </section>
  );
};
