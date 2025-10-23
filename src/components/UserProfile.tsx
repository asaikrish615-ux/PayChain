import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Award, TrendingUp, Shield } from "lucide-react";

interface UserProfileProps {
  user: User;
}

export const UserProfile = ({ user }: UserProfileProps) => {
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="glass-card p-6 rounded-3xl hover:shadow-glow-primary transition-all animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-lg hover:scale-110 transition-transform">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-primary text-white text-xl font-bold">
                {getInitials(user.email || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1.5 shadow-lg">
              <Award className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-1">
              {user.user_metadata?.full_name || "Welcome"}
            </h2>
            <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
            <div className="flex gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
              <Badge className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                Pro Member
              </Badge>
            </div>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-primary/10 hover:rotate-90 transition-all duration-300"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-3 border border-primary/10 hover:scale-105 transition-transform">
          <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
          <p className="text-xl font-bold gradient-text">127</p>
        </div>
        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-3 border border-secondary/10 hover:scale-105 transition-transform">
          <p className="text-xs text-muted-foreground mb-1">Active Wallets</p>
          <p className="text-xl font-bold text-secondary">3</p>
        </div>
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-3 border border-accent/10 hover:scale-105 transition-transform">
          <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
          <p className="text-xl font-bold text-accent">99.8%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl p-3 border border-purple-500/10 hover:scale-105 transition-transform">
          <p className="text-xs text-muted-foreground mb-1">Member Since</p>
          <p className="text-xl font-bold text-purple-500">2024</p>
        </div>
      </div>
    </div>
  );
};
