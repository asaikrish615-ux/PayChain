interface LogContext {
  action: string;
  userId?: string;
  status?: string;
  [key: string]: any;
}

class SecureLogger {
  private isProduction = Deno.env.get('ENVIRONMENT') === 'production';
  
  info(message: string, context?: LogContext) {
    if (this.isProduction) {
      const sanitized = this.sanitizeContext(context);
      console.log(JSON.stringify({ level: 'info', message, ...sanitized }));
    } else {
      console.log(message, context);
    }
  }
  
  error(message: string, error?: Error, context?: LogContext) {
    const sanitized = this.sanitizeContext(context);
    
    if (this.isProduction) {
      console.error(JSON.stringify({
        level: 'error',
        message,
        errorType: error?.name || 'Unknown',
        ...sanitized
      }));
    } else {
      console.error(message, error, context);
    }
  }
  
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;
    
    const sanitized: LogContext = {
      action: context.action,
      status: context.status,
    };
    
    // Hash user IDs for privacy
    if (context.userId) {
      sanitized.userHash = this.hashUserId(context.userId);
    }
    
    // Remove sensitive fields
    const sensitiveFields = ['balance', 'amount', 'fee', 'totalAmount', 'walletId', 'transactionId'];
    for (const key in context) {
      if (!sensitiveFields.includes(key) && key !== 'userId' && key !== 'action' && key !== 'status') {
        sanitized[key] = context[key];
      }
    }
    
    return sanitized;
  }
  
  private hashUserId(userId: string): string {
    return `user_${userId.slice(0, 8)}`;
  }
}

export const logger = new SecureLogger();
