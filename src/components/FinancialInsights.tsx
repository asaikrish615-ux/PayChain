import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Brain, 
  Sparkles,
  DollarSign,
  Calendar,
  Target,
  Loader2
} from "lucide-react";

interface Insight {
  type: 'warning' | 'info' | 'success' | 'danger';
  title: string;
  description: string;
  prediction?: string;
  action?: string;
}

export const FinancialInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictedBalance, setPredictedBalance] = useState<number | null>(null);
  const [daysUntilLow, setDaysUntilLow] = useState<number | null>(null);

  // Sanitize values for AI prompts to prevent injection attacks
  const sanitizeForPrompt = (value: any): string => {
    const str = String(value);
    
    // Remove newlines and control characters
    let sanitized = str.replace(/[\n\r\t]/g, ' ');
    
    // Remove non-alphanumeric except basic punctuation
    sanitized = sanitized.replace(/[^\w\s.,()-]/g, '');
    
    // Limit length
    sanitized = sanitized.slice(0, 100);
    
    // Trim whitespace
    return sanitized.trim();
  };

  const analyzeFinancialHealth = async () => {
    setIsAnalyzing(true);
    try {
      // Fetch recent transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (txError) throw txError;

      // Fetch current wallet balance
      const { data: wallets, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('is_primary', true)
        .single();

      if (walletError) throw walletError;

      // Calculate spending patterns
      const last7Days = transactions?.filter(t => {
        const txDate = new Date(t.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return txDate >= weekAgo && t.transaction_type === 'send';
      }) || [];

      const last30Days = transactions?.filter(t => {
        const txDate = new Date(t.created_at);
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return txDate >= monthAgo && t.transaction_type === 'send';
      }) || [];

      const weeklySpending = last7Days.reduce((sum, t) => sum + Number(t.amount), 0);
      const monthlySpending = last30Days.reduce((sum, t) => sum + Number(t.amount), 0);
      const dailyAverage = monthlySpending / 30;

      // Predict when balance will run low
      const currentBalance = Number(wallets.balance);
      const daysLeft = Math.floor(currentBalance / (dailyAverage || 1));
      const predictedBalanceIn7Days = currentBalance - (dailyAverage * 7);

      setPredictedBalance(predictedBalanceIn7Days);
      setDaysUntilLow(daysLeft);

      // Generate AI-powered insights with sanitized data - use streaming
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      
      let aiInsights: Insight[] = [];
      let fullResponse = '';
      
      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: [{
              role: 'user',
              content: `Analyze this financial data and provide 3-4 brief, actionable insights:
- Current balance: ${sanitizeForPrompt(currentBalance)} ${sanitizeForPrompt(wallets.currency)}
- Weekly spending: ${sanitizeForPrompt(weeklySpending)}
- Monthly spending: ${sanitizeForPrompt(monthlySpending)}
- Daily average: ${sanitizeForPrompt(dailyAverage.toFixed(2))}
- Days until low balance: ${sanitizeForPrompt(daysLeft)}
- Predicted balance in 7 days: ${sanitizeForPrompt(predictedBalanceIn7Days.toFixed(2))}

Provide insights in this exact JSON format:
[
  {
    "type": "warning|info|success|danger",
    "title": "Brief title",
    "description": "One sentence description",
    "prediction": "Specific prediction if applicable",
    "action": "One actionable recommendation"
  }
]

Focus on: spending patterns, budget alerts, savings opportunities, and cash flow predictions.`
            }]
          }),
        });

        if (resp.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        if (resp.status === 402) {
          throw new Error('AI usage limit reached. Please contact support.');
        }

        if (!resp.ok || !resp.body) {
          throw new Error('Failed to get AI insights');
        }

        // Read the streaming response
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) fullResponse += content;
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Parse the complete response
        try {
          const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            aiInsights = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('Failed to parse AI insights JSON:', e);
        }
      } catch (error: any) {
        console.error('AI insights error:', error);
        // Continue with rule-based insights even if AI fails
      }

      // Add rule-based insights
      const ruleBasedInsights: Insight[] = [];

      if (daysLeft < 7 && dailyAverage > 0) {
        ruleBasedInsights.push({
          type: 'danger',
          title: '🚨 Low Balance Alert',
          description: `At your current spending rate, your balance will run low in ${daysLeft} days`,
          prediction: `Predicted balance: ${predictedBalanceIn7Days.toFixed(2)} ${wallets.currency}`,
          action: 'Consider reducing non-essential spending or adding funds'
        });
      }

      if (weeklySpending > monthlySpending / 4 * 1.5) {
        ruleBasedInsights.push({
          type: 'warning',
          title: '📈 Higher Than Usual Spending',
          description: 'This week\'s spending is 50% above your average',
          action: 'Review recent transactions to identify unusual expenses'
        });
      }

      if (weeklySpending < monthlySpending / 4 * 0.5) {
        ruleBasedInsights.push({
          type: 'success',
          title: '🎯 Great Spending Control',
          description: 'You\'re spending less than usual this week',
          action: 'Consider moving extra savings to a savings wallet'
        });
      }

      // Combine AI and rule-based insights
      setInsights([...ruleBasedInsights, ...aiInsights].slice(0, 5));

      toast.success('Financial analysis complete', {
        description: `Generated ${ruleBasedInsights.length + aiInsights.length} insights`
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    analyzeFinancialHealth();
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'danger': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'warning': return <TrendingDown className="w-5 h-5 text-yellow-500" />;
      case 'success': return <TrendingUp className="w-5 h-5 text-green-500" />;
      default: return <Brain className="w-5 h-5 text-primary" />;
    }
  };

  const getInsightBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'danger': return 'destructive';
      case 'warning': return 'secondary';
      case 'success': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">AI Financial Insights</h2>
        </div>
        <Button 
          onClick={analyzeFinancialHealth} 
          disabled={isAnalyzing}
          size="sm"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>

      {/* Predictive Metrics */}
      {(predictedBalance !== null || daysUntilLow !== null) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictedBalance !== null && (
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Predicted Balance (7 days)</p>
                  <p className={`text-2xl font-bold ${predictedBalance < 0 ? 'text-destructive' : ''}`}>
                    {predictedBalance.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {daysUntilLow !== null && (
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Until Low Balance</p>
                  <p className={`text-2xl font-bold ${daysUntilLow < 7 ? 'text-destructive' : ''}`}>
                    {daysUntilLow > 365 ? '365+' : daysUntilLow}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-4">
        {isAnalyzing && insights.length === 0 ? (
          <Card className="glass-card p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Analyzing your financial patterns...</p>
            </div>
          </Card>
        ) : insights.length === 0 ? (
          <Card className="glass-card p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Brain className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground">No insights available yet</p>
              <Button onClick={analyzeFinancialHealth} variant="outline" size="sm">
                Generate Insights
              </Button>
            </div>
          </Card>
        ) : (
          insights.map((insight, index) => (
            <Card key={index} className="glass-card p-6 border-l-4" 
              style={{
                borderLeftColor: 
                  insight.type === 'danger' ? 'hsl(var(--destructive))' :
                  insight.type === 'warning' ? '#eab308' :
                  insight.type === 'success' ? '#22c55e' :
                  'hsl(var(--primary))'
              }}
            >
              <div className="flex items-start gap-4">
                {getInsightIcon(insight.type)}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{insight.title}</h3>
                    <Badge variant={getInsightBadgeVariant(insight.type)}>
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  {insight.prediction && (
                    <p className="text-sm font-medium text-primary">{insight.prediction}</p>
                  )}
                  {insight.action && (
                    <div className="pt-2 mt-2 border-t">
                      <p className="text-sm">
                        <span className="font-semibold">Action: </span>
                        {insight.action}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
