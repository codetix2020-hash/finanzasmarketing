/**
 * Logger centralizado para el sistema MarketingOS
 * 
 * Proporciona logging consistente con timestamps y metadata
 * para debugging y monitoring de todas las operaciones de marketing
 */

type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

interface LogMeta {
  [key: string]: any;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: LogMeta): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${level}] ${timestamp} - ${message}${metaStr}`;
  }

  /**
   * Log información general
   */
  info(message: string, meta?: LogMeta): void {
    console.log(this.formatMessage('INFO', message, meta));
  }

  /**
   * Log operaciones exitosas
   */
  success(message: string, meta?: LogMeta): void {
    console.log(`✅ ${this.formatMessage('SUCCESS', message, meta)}`);
  }

  /**
   * Log advertencias (no críticas)
   */
  warning(message: string, meta?: LogMeta): void {
    console.warn(`⚠️ ${this.formatMessage('WARNING', message, meta)}`);
  }

  /**
   * Log errores con stack trace
   */
  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    const errorMeta: LogMeta = { ...meta };
    
    if (error instanceof Error) {
      errorMeta.error = error.message;
      errorMeta.stack = error.stack;
    } else if (error) {
      errorMeta.error = String(error);
    }
    
    console.error(`❌ ${this.formatMessage('ERROR', message, errorMeta)}`);
  }

  /**
   * Log para debugging detallado (solo en desarrollo)
   */
  debug(message: string, meta?: LogMeta): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`🔍 ${this.formatMessage('INFO', message, meta)}`);
    }
  }

  /**
   * Log para eventos de negocio importantes
   */
  business(event: string, meta?: LogMeta): void {
    console.log(`💼 [BUSINESS] ${new Date().toISOString()} - ${event}`, meta || '');
  }
}

export const logger = new Logger();
