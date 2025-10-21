import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  amount: number;
  currency: string;
  fromWalletId: string;
  toWalletId?: string;
  recipientUpi?: string;
  recipientName?: string;
  transactionType: 'send' | 'receive' | 'exchange';
  cryptoAmount?: number;
  cryptoCurrency?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth token
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const paymentRequest: PaymentRequest = await req.json();
    console.log('Processing payment:', paymentRequest);

    // Calculate fee (0.1%)
    const fee = paymentRequest.amount * 0.001;

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: user.id,
        from_wallet_id: paymentRequest.fromWalletId,
        to_wallet_id: paymentRequest.toWalletId,
        transaction_type: paymentRequest.transactionType,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        crypto_amount: paymentRequest.cryptoAmount,
        crypto_currency: paymentRequest.cryptoCurrency,
        recipient_name: paymentRequest.recipientName,
        recipient_upi: paymentRequest.recipientUpi,
        fee: fee,
        status: 'pending',
        transaction_hash: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction creation error:', transactionError);
      throw transactionError;
    }

    // Simulate payment processing
    // In a real app, this would integrate with blockchain and UPI APIs
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update transaction status to completed
    const { error: updateError } = await supabaseClient
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Transaction update error:', updateError);
      throw updateError;
    }

    // Update wallet balances
    if (paymentRequest.transactionType === 'send') {
      // Deduct from sender's wallet
      const { error: deductError } = await supabaseClient
        .rpc('update_wallet_balance', {
          wallet_id: paymentRequest.fromWalletId,
          amount_change: -(paymentRequest.amount + fee),
        });

      if (deductError) {
        console.error('Wallet deduction error:', deductError);
      }
    }

    console.log('Payment processed successfully:', transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        transaction: transaction,
        message: 'Payment processed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
