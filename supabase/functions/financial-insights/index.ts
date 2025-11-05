import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { logger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const FinancialDataSchema = z.object({
  currentBalance: z.number(),
  currency: z.string(),
  weeklySpending: z.number(),
  monthlySpending: z.number(),
  dailyAverage: z.number(),
  daysUntilLow: z.number(),
  predictedBalance: z.number(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's JWT for authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      logger.info('Unauthorized financial insights attempt', {
        action: 'auth_check',
        status: 'unauthorized'
      });
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Financial insights request received', {
      action: 'financial_insights',
      userId: user.id
    });

    // Validate request body
    const body = await req.json();
    const validation = FinancialDataSchema.safeParse(body);
    
    if (!validation.success) {
      logger.info('Invalid financial data', {
        action: 'financial_insights',
        userId: user.id,
        status: 'validation_failed'
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid financial data',
          details: validation.error.errors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const financialData = validation.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      logger.error('API key not configured', new Error('Missing LOVABLE_API_KEY'), {
        action: 'financial_insights',
        status: 'config_error'
      });
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a financial advisor AI analyzing user spending patterns. Provide actionable, personalized insights based on the data.`;

    const userPrompt = `Analyze this financial data and provide 3-4 actionable insights:

Current Balance: ${financialData.currentBalance} ${financialData.currency}
Weekly Spending: ${financialData.weeklySpending}
Monthly Spending: ${financialData.monthlySpending}
Daily Average: ${financialData.dailyAverage}
Days Until Low Balance: ${financialData.daysUntilLow}
Predicted Balance (7 days): ${financialData.predictedBalance}

Focus on: spending patterns, budget alerts, savings opportunities, and cash flow predictions.`;

    logger.info('Calling AI for financial insights', {
      action: 'financial_insights',
      userId: user.id
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_financial_insights",
              description: "Return 3-4 actionable financial insights based on the user's spending data.",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { 
                          type: "string", 
                          enum: ["warning", "info", "success", "danger"],
                          description: "Severity level of the insight"
                        },
                        title: { 
                          type: "string",
                          description: "Brief, attention-grabbing title (max 50 chars)"
                        },
                        description: { 
                          type: "string",
                          description: "Clear explanation in one sentence"
                        },
                        prediction: { 
                          type: "string",
                          description: "Specific prediction if applicable"
                        },
                        action: { 
                          type: "string",
                          description: "One concrete, actionable recommendation"
                        }
                      },
                      required: ["type", "title", "description", "action"],
                      additionalProperties: false
                    },
                    minItems: 3,
                    maxItems: 4
                  }
                },
                required: ["insights"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_financial_insights" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        logger.error('AI gateway rate limit exceeded', new Error('Rate limit'), {
          action: 'financial_insights',
          userId: user.id,
          status: 'rate_limited'
        });
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        logger.error('AI gateway payment required', new Error('Payment required'), {
          action: 'financial_insights',
          userId: user.id,
          status: 'payment_required'
        });
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      logger.error('AI gateway error', new Error(errorText), {
        action: 'financial_insights',
        userId: user.id,
        status: 'gateway_error',
        statusCode: response.status
      });
      
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract insights from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      logger.error('No tool call in AI response', new Error('Missing tool call'), {
        action: 'financial_insights',
        userId: user.id
      });
      return new Response(
        JSON.stringify({ error: "Failed to generate insights" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const insights = JSON.parse(toolCall.function.arguments).insights;

    logger.info('Financial insights generated successfully', {
      action: 'financial_insights',
      userId: user.id,
      insightCount: insights.length
    });

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    logger.error('Financial insights function error', error as Error, {
      action: 'financial_insights',
      status: 'error'
    });
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while generating insights. Please try again.'
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
