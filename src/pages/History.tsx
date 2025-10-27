import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Download, Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TransactionCard } from "@/components/TransactionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  status: string;
  created_at: string;
  recipient_name?: string;
  recipient_upi?: string;
  crypto_currency?: string;
  crypto_amount?: number;
  notes?: string;
}

function HistoryContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchTransactions(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUser(session.user);
          fetchTransactions(session.user.id);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions", {
          description: "Please try refreshing the page"
        });
        return;
      }

      setTransactions(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Failed to load transactions");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true;
    if (filter === "send") return tx.transaction_type === "send";
    if (filter === "receive") return tx.transaction_type === "receive";
    if (filter === "completed") return tx.status === "completed";
    if (filter === "pending") return tx.status === "pending";
    return true;
  });

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass-card sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Transaction History</h1>
              <p className="text-xs text-muted-foreground">
                View all your transactions
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="hover:bg-destructive/10 hover:text-destructive transition-all hover:scale-105"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="glass-card border-border mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filter Transactions</CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "send" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("send")}
              >
                Sent
              </Button>
              <Button
                variant={filter === "receive" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("receive")}
              >
                Received
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("completed")}
              >
                Completed
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                Pending
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <Card className="glass-card border-border">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No transactions found</p>
              </CardContent>
            </Card>
          ) : (
            filteredTransactions.map((transaction) => {
              const type = transaction.transaction_type === "send" 
                ? "sent" 
                : transaction.transaction_type === "receive" 
                ? "received" 
                : "exchange";
              
              const amount = `${transaction.currency} ${transaction.amount.toLocaleString()}`;
              const crypto = transaction.crypto_currency 
                ? `${transaction.crypto_amount} ${transaction.crypto_currency}`
                : undefined;
              
              const time = new Date(transaction.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              const status = transaction.status as "completed" | "pending" | "failed";
              
              return (
                <TransactionCard
                  key={transaction.id}
                  type={type}
                  amount={amount}
                  crypto={crypto}
                  from={transaction.recipient_name}
                  to={transaction.recipient_name || transaction.recipient_upi}
                  time={time}
                  status={status}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function History() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}
