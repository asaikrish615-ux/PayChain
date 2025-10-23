import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching exchange rates...');

    // Mock exchange rates (in production, fetch from real APIs)
    const rates = [
      { from_currency: 'ETH', to_currency: 'INR', rate: 245000.50 },
      { from_currency: 'BTC', to_currency: 'INR', rate: 4850000.75 },
      { from_currency: 'USDT', to_currency: 'INR', rate: 83.50 },
      { from_currency: 'INR', to_currency: 'ETH', rate: 0.00000408 },
      { from_currency: 'INR', to_currency: 'BTC', rate: 0.00000021 },
      { from_currency: 'INR', to_currency: 'USDT', rate: 0.01198 },
    ];

    // Update exchange rates in database
    for (const rate of rates) {
      const { error } = await supabaseClient
        .from('exchange_rates')
        .upsert(
          {
            from_currency: rate.from_currency,
            to_currency: rate.to_currency,
            rate: rate.rate,
            last_updated: new Date().toISOString(),
          },
          {
            onConflict: 'from_currency,to_currency',
          }
        );

      if (error) {
        console.error('Error updating rate:', error);
      }
    }

    console.log('Exchange rates updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        rates: rates,
        message: 'Exchange rates updated successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in fetch-exchange-rates function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to update exchange rates. Please try again later.',
        code: 'RATE_UPDATE_FAILED'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
