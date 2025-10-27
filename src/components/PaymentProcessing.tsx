import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PaymentProcessingProps {
  status: 'processing' | 'validating' | 'deducting' | 'completing' | 'success' | 'failed';
  message?: string;
}

const statusConfig = {
  processing: {
    icon: Loader2,
    title: "Processing Payment",
    description: "Please wait while we process your transaction...",
    color: "text-primary",
    animate: true,
  },
  validating: {
    icon: Clock,
    title: "Validating Balance",
    description: "Checking your wallet balance...",
    color: "text-secondary",
    animate: true,
  },
  deducting: {
    icon: Loader2,
    title: "Deducting Funds",
    description: "Deducting amount from your wallet...",
    color: "text-primary",
    animate: true,
  },
  completing: {
    icon: Loader2,
    title: "Finalizing Transaction",
    description: "Almost done, completing your payment...",
    color: "text-primary",
    animate: true,
  },
  success: {
    icon: CheckCircle2,
    title: "Payment Successful!",
    description: "Your transaction has been completed successfully",
    color: "text-green-500",
    animate: false,
  },
  failed: {
    icon: XCircle,
    title: "Payment Failed",
    description: "We couldn't process your payment. Please try again.",
    color: "text-destructive",
    animate: false,
  },
};

export const PaymentProcessing = ({ status, message }: PaymentProcessingProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className="glass-card p-8 max-w-md mx-auto">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`${config.color} ${config.animate ? 'animate-spin' : ''}`}>
          <Icon className="w-16 h-16" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">{config.title}</h3>
          <p className="text-muted-foreground">
            {message || config.description}
          </p>
        </div>
        
        {status === 'success' && (
          <div className="w-full pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="text-green-500 font-medium">Completed</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-xs">#{Date.now()}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
