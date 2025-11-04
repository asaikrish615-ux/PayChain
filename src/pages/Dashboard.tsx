import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { WalletDashboard } from "@/components/WalletDashboard";
import { Features } from "@/components/Features";
import { Services } from "@/components/Services";
import { AIChat } from "@/components/AIChat";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Portfolio } from "@/components/Portfolio";
import { FinancialInsights } from "@/components/FinancialInsights";
import { User as UserIcon, History } from "lucide-react";

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUser(session.user);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header with Gradient */}
      <header className="border-b border-border glass-card sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">P</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">PayChain</h1>
              <p className="text-xs text-muted-foreground">
                Next-Gen Payment Platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/history")}
              className="hover:bg-primary/10 transition-all hover:scale-105"
            >
              <History className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="hover:bg-primary/10 transition-all hover:scale-105"
            >
              <UserIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="hover:bg-destructive/10 hover:text-destructive transition-all hover:scale-105"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Enhanced Spacing */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Portfolio Section */}
        <Portfolio />

        {/* Wallet Dashboard */}
        <WalletDashboard />

        {/* AI Financial Insights - Predictive Analytics */}
        <FinancialInsights />

        {/* Services Section */}
        <Services />

        {/* Features Section */}
        <Features />
      </div>
      
      {/* AI Chat Assistant */}
      <AIChat />
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
