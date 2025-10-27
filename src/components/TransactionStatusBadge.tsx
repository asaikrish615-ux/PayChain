import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TransactionStatusBadgeProps {
  status: 'pending' | 'completed' | 'failed';
  showIcon?: boolean;
}

export const TransactionStatusBadge = ({ status, showIcon = true }: TransactionStatusBadgeProps) => {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: "Pending",
      variant: "secondary" as const,
      className: "bg-secondary/20 text-secondary border-secondary/30",
    },
    completed: {
      icon: CheckCircle2,
      label: "Completed",
      variant: "default" as const,
      className: "bg-green-500/20 text-green-500 border-green-500/30",
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      variant: "destructive" as const,
      className: "bg-destructive/20 text-destructive border-destructive/30",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} flex items-center gap-1.5`}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </Badge>
  );
};
