import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Verify authentication - CRITICAL for security
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      logger.info('Unauthorized AI chat attempt', {
        action: 'auth_check',
        status: 'unauthorized'
      });
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required', 
          code: 'UNAUTHORIZED' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logger.info('AI chat request received', {
      action: 'ai_chat',
      userId: user.id
    });

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      logger.error('API key not configured', new Error('Missing LOVABLE_API_KEY'), {
        action: 'ai_chat',
        status: 'config_error'
      });
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    logger.info('Processing AI chat request', {
      action: 'ai_chat',
      userId: user.id,
      messageCount: messages.length
    });

    const systemPrompt = `You are PayChain AI Assistant, a helpful and knowledgeable expert in blockchain technology, cryptocurrency, and UPI payments.

Your role is to:
- Help users understand blockchain and cryptocurrency concepts
- Explain how PayChain bridges crypto and UPI payments
- Provide guidance on transactions, wallets, and security
- Answer questions about exchange rates and fees
- Guide users through the payment process

Key facts about PayChain:
- Transaction fee: 0.1% (lowest in the industry)
- Supports instant crypto-to-UPI and UPI-to-crypto conversions
- Real-time exchange rates
- Bank-grade security with multi-layer encryption
- Supports ETH, BTC, USDT, and INR

Be concise, friendly, and helpful. Use emojis occasionally to make conversations engaging. Always prioritize user security and understanding.`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        logger.error('AI gateway rate limit exceeded', new Error('Rate limit'), {
          action: 'ai_chat',
          userId: user.id,
          status: 'rate_limited'
        });
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        logger.error('AI gateway payment required', new Error('Payment required'), {
          action: 'ai_chat',
          userId: user.id,
          status: 'payment_required'
        });
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      logger.error('AI gateway error', new Error('Gateway error'), {
        action: 'ai_chat',
        userId: user.id,
        status: 'gateway_error'
      });
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    logger.error('AI chat function error', error as Error, {
      action: 'ai_chat',
      status: 'error'
    });
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while processing your request. Please try again.',
        code: 'AI_CHAT_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
