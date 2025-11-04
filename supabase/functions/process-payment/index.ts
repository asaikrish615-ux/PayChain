import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { logger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PaymentSchema = z.object({
  amount: z.number().positive().max(1000000).finite(),
  currency: z.enum(['INR', 'USD', 'EUR', 'ETH', 'BTC', 'USDT']),
  fromWalletId: z.string().uuid(),
  toWalletId: z.string().uuid().optional(),
  recipientUpi: z.string().max(100).optional(),
  recipientName: z.string().max(100).optional(),
  transactionType: z.enum(['send', 'receive', 'exchange']),
  cryptoAmount: z.number().positive().max(1000).finite().optional(),
  cryptoCurrency: z.enum(['ETH', 'BTC', 'USDT']).optional(),
});

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

    // Validate and parse payment request
    const requestBody = await req.json();
    const parsedRequest = PaymentSchema.safeParse(requestBody);
    if (!parsedRequest.success) {
      logger.error('Invalid payment request', new Error('Validation failed'), {
        action: 'validate_payment',
        userId: user.id
      });
      return new Response(
        JSON.stringify({ error: 'Invalid payment request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentRequest = parsedRequest.data;
    const fee = paymentRequest.amount * 0.001;

    logger.info('Payment processing started', {
      action: 'process_payment',
      userId: user.id,
      transactionType: paymentRequest.transactionType
    });

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
      logger.error('Transaction creation failed', transactionError, {
        action: 'create_transaction',
        userId: user.id
      });
      throw new Error('Failed to create transaction');
    }

    logger.info('Transaction created', {
      action: 'create_transaction',
      userId: user.id,
      status: 'success'
    });

    // Step 3: Pre-validate wallet balance before processing
    logger.info('Validating wallet balance', {
      action: 'validate_balance',
      userId: user.id
    });
    if (paymentRequest.transactionType === 'send') {
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('balance')
        .eq('id', paymentRequest.fromWalletId)
        .single();

      if (walletError || !wallet) {
        logger.error('Wallet fetch failed', walletError, {
          action: 'validate_balance',
          userId: user.id
        });
        
        // Mark transaction as failed
        const { error: failError } = await supabaseClient.rpc('fail_transaction', {
          transaction_id: transaction.id,
          failure_reason: 'Wallet not found'
        });
        
        if (failError) {
          logger.error('Failed to mark transaction as failed', failError, {
            action: 'fail_transaction',
            userId: user.id
          });
        }
        
        throw new Error('Wallet not found');
      }

      const totalAmount = paymentRequest.amount + fee;
      if (wallet.balance < totalAmount) {
        logger.info('Insufficient balance detected', {
          action: 'validate_balance',
          userId: user.id,
          status: 'insufficient'
        });
        
        // Mark transaction as failed
        const { error: failError } = await supabaseClient.rpc('fail_transaction', {
          transaction_id: transaction.id,
          failure_reason: 'Insufficient balance'
        });
        
        if (failError) {
          logger.error('Failed to mark transaction as failed', failError, {
            action: 'fail_transaction',
            userId: user.id
          });
        }
        
        throw new Error('Insufficient balance');
      }
    }

    // Step 4: Deduct balance FIRST (before marking as completed)
    logger.info('Processing balance deduction', {
      action: 'deduct_balance',
      userId: user.id
    });
    if (paymentRequest.transactionType === 'send') {
      const { error: deductError } = await supabaseClient.rpc('update_wallet_balance', {
        wallet_id: paymentRequest.fromWalletId,
        amount_change: -(paymentRequest.amount + fee),
      });

      if (deductError) {
        logger.error('Balance deduction failed', deductError, {
          action: 'deduct_balance',
          userId: user.id,
          status: 'failed'
        });
        
        // Mark transaction as failed
        const { error: failError } = await supabaseClient.rpc('fail_transaction', {
          transaction_id: transaction.id,
          failure_reason: 'Balance deduction failed'
        });
        
        if (failError) {
          logger.error('Failed to mark transaction as failed', failError, {
            action: 'fail_transaction',
            userId: user.id
          });
        }
        
        throw new Error('Insufficient balance or wallet locked');
      }
      logger.info('Balance deducted successfully', {
        action: 'deduct_balance',
        userId: user.id,
        status: 'success'
      });
    }

    // Step 5: Simulate payment processing (blockchain/UPI confirmation)
    logger.info('Processing payment confirmation', {
      action: 'process_confirmation',
      userId: user.id
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 6: ONLY NOW mark transaction as completed
    logger.info('Marking transaction as completed', {
      action: 'complete_transaction',
      userId: user.id
    });
    const { error: completeError } = await supabaseClient.rpc('complete_transaction', {
      transaction_id: transaction.id
    });

    if (completeError) {
      logger.error('Transaction completion failed', completeError, {
        action: 'complete_transaction',
        userId: user.id,
        status: 'critical'
      });
      // This is a critical error - balance was deducted but transaction not marked complete
      // In production, this should trigger alerts and manual intervention
      throw new Error('Transaction completion failed - please contact support');
    }

    logger.info('Payment processed successfully', {
      action: 'process_payment',
      userId: user.id,
      status: 'completed'
    });

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
    logger.error('Payment processing error', error as Error, {
      action: 'process_payment',
      status: 'error'
    });
    
    // Provide safe, user-friendly error messages
    let safeMessage = 'Payment processing failed. Please try again.';
    let statusCode = 500;
    
    if (error.message?.toLowerCase().includes('unauthorized')) {
      safeMessage = 'Authentication required';
      statusCode = 401;
    } else if (error.message?.toLowerCase().includes('insufficient balance')) {
      safeMessage = 'Insufficient balance in wallet';
      statusCode = 400;
    } else if (error.message?.toLowerCase().includes('wallet not found')) {
      safeMessage = 'Wallet not found';
      statusCode = 404;
    } else if (error.message?.toLowerCase().includes('wallet locked')) {
      safeMessage = 'Wallet is temporarily locked. Please try again.';
      statusCode = 409;
    } else if (error.message?.toLowerCase().includes('contact support')) {
      safeMessage = 'Transaction error - please contact support';
      statusCode = 500;
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: safeMessage,
        code: 'PAYMENT_FAILED'
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
