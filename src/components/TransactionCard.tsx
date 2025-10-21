import { ArrowUpRight, ArrowDownLeft, RefreshCcw, CheckCircle2 } from "lucide-react";

interface TransactionCardProps {
  type: "sent" | "received" | "exchange";
  amount: string;
  crypto?: string;
  from?: string;
  to?: string;
  time: string;
  status: "completed" | "pending" | "failed";
}

export const TransactionCard = ({
  type,
  amount,
  crypto,
  from,
  to,
  time,
  status,
}: TransactionCardProps) => {
  const getIcon = () => {
    switch (type) {
      case "sent":
        return <ArrowUpRight className="h-5 w-5" />;
      case "received":
        return <ArrowDownLeft className="h-5 w-5" />;
      case "exchange":
        return <RefreshCcw className="h-5 w-5" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case "sent":
        return "bg-destructive/20 text-destructive";
      case "received":
        return "bg-primary/20 text-primary";
      case "exchange":
        return "bg-secondary/20 text-secondary";
    }
  };

  const getTitle = () => {
    switch (type) {
      case "sent":
        return `Sent to ${to}`;
      case "received":
        return `Received from ${from}`;
      case "exchange":
        return "Crypto Exchange";
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${getIconBg()} flex items-center justify-center group-hover:rotate-12 transition-transform`}>
            {getIcon()}
          </div>
          <div>
            <h4 className="font-semibold text-lg">{getTitle()}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{time}</span>
              {status === "completed" && (
                <>
                  <span>•</span>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <p className={`text-2xl font-bold ${type === "sent" ? "text-destructive" : "text-primary"}`}>
            {type === "sent" && "-"}
            {type === "received" && "+"}
            {amount}
          </p>
          {crypto && (
            <p className="text-sm text-muted-foreground">{crypto}</p>
          )}
        </div>
      </div>
    </div>
  );
};
