import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

type PaymentStatus = 'idle' | 'processing' | 'validating' | 'deducting' | 'completing' | 'success' | 'failed';

export const usePayment = () => {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<any>(null);

  const processPayment = async (paymentRequest: PaymentRequest) => {
    try {
      setStatus('processing');
      setError(null);

      // Call the secure process-payment edge function
      const { data, error: paymentError } = await supabase.functions.invoke('process-payment', {
        body: paymentRequest,
      });

      if (paymentError) {
        console.error('Payment error:', paymentError);
        
        // Parse error message for user-friendly feedback
        let errorMessage = 'Payment failed. Please try again.';
        
        if (paymentError.message?.includes('Insufficient balance')) {
          errorMessage = 'Insufficient balance in your wallet';
          toast.error(errorMessage, {
            description: 'Please add funds to your wallet and try again',
          });
        } else if (paymentError.message?.includes('Wallet not found')) {
          errorMessage = 'Wallet not found';
          toast.error(errorMessage, {
            description: 'Please check your wallet and try again',
          });
        } else if (paymentError.message?.includes('unauthorized') || 
                   paymentError.message?.includes('Authentication')) {
          errorMessage = 'Authentication required';
          toast.error(errorMessage, {
            description: 'Please sign in to continue',
          });
        } else if (paymentError.message?.includes('wallet locked')) {
          errorMessage = 'Wallet temporarily locked';
          toast.error(errorMessage, {
            description: 'Another transaction is in progress. Please wait.',
          });
        } else {
          toast.error('Payment Failed', {
            description: errorMessage,
          });
        }
        
        setError(errorMessage);
        setStatus('failed');
        return { success: false, error: errorMessage };
      }

      if (data?.success) {
        setStatus('success');
        setTransaction(data.transaction);
        
        toast.success('Payment Successful!', {
          description: `Transaction of ${paymentRequest.amount} ${paymentRequest.currency} completed`,
        });
        
        return { success: true, transaction: data.transaction };
      } else {
        throw new Error(data?.error || 'Payment processing failed');
      }
    } catch (err: any) {
      console.error('Payment processing error:', err);
      const errorMessage = err.message || 'An unexpected error occurred';
      
      setError(errorMessage);
      setStatus('failed');
      
      toast.error('Payment Error', {
        description: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  };

  const reset = () => {
    setStatus('idle');
    setError(null);
    setTransaction(null);
  };

  return {
    status,
    error,
    transaction,
    processPayment,
    reset,
  };
};
