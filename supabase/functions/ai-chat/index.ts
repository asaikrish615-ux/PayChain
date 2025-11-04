import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { logger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long (max 2000 chars)')
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema)
    .min(1, 'At least one message required')
    .max(50, 'Conversation too long (max 50 messages)')
    .refine(
      (msgs) => msgs.reduce((sum, m) => sum + m.content.length, 0) <= 50000,
      'Total conversation exceeds 50,000 characters'
    )
});

// Rate limiting constants
const DAILY_REQUEST_LIMIT = 100;
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

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

    // Validate request body
    const body = await req.json();
    const validation = ChatRequestSchema.safeParse(body);
    
    if (!validation.success) {
      logger.info('Invalid chat request', {
        action: 'ai_chat',
        userId: user.id,
        status: 'validation_failed'
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request', 
          details: validation.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { messages } = validation.data;

    // Check rate limiting
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: usage } = await adminClient
      .from('ai_chat_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const now = new Date();
    const needsReset = !usage || new Date(usage.daily_reset_at) <= now;

    if (!needsReset && usage.daily_requests >= DAILY_REQUEST_LIMIT) {
      logger.info('Rate limit exceeded', {
        action: 'ai_chat',
        userId: user.id,
        status: 'rate_limited',
        requests: usage.daily_requests
      });
      return new Response(
        JSON.stringify({ 
          error: `Daily request limit reached (${DAILY_REQUEST_LIMIT} requests)`,
          limit: DAILY_REQUEST_LIMIT,
          resetAt: usage.daily_reset_at,
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update usage tracking
    const nextDay = new Date(now);
    nextDay.setHours(24, 0, 0, 0);

    await adminClient.from('ai_chat_usage').upsert({
      user_id: user.id,
      daily_requests: needsReset ? 1 : (usage?.daily_requests || 0) + 1,
      daily_tokens: needsReset ? 0 : (usage?.daily_tokens || 0),
      last_request_at: now.toISOString(),
      daily_reset_at: needsReset ? nextDay.toISOString() : usage.daily_reset_at
    });
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

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('AI request timeout', error, {
          action: 'ai_chat',
          userId: user.id,
          status: 'timeout'
        });
        return new Response(
          JSON.stringify({ 
            error: 'Request timeout (30s limit exceeded)',
            code: 'REQUEST_TIMEOUT'
          }),
          {
            status: 408,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

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
