/**
 * Logger centralizado para MarketingOS
 * 
 * Uso:
 * logger.info('Mensaje', { meta: 'data' });
 * logger.error('Error', error, { meta: 'data' });
 */

type LogLevel = "INFO" | "ERROR" | "SUCCESS" | "WARNING" | "DEBUG";

interface LogMeta {
  [key: string]: any;
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, meta?: LogMeta): string {
    const timestamp = this.formatTimestamp();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${level}] ${timestamp} - ${message}${metaStr}`;
  }

  /**
   * Log informativo
   */
  info(message: string, meta?: LogMeta): void {
    console.log(this.formatMessage("INFO", message, meta));
  }

  /**
   * Log de error
   */
  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    const errorMeta = error instanceof Error
      ? {
          error: error.message,
          stack: error.stack,
          ...meta,
        }
      : { error: String(error), ...meta };

    console.error(this.formatMessage("ERROR", message, errorMeta));
  }

  /**
   * Log de éxito
   */
  success(message: string, meta?: LogMeta): void {
    console.log(`✅ ${this.formatMessage("SUCCESS", message, meta)}`);
  }

  /**
   * Log de advertencia
   */
  warning(message: string, meta?: LogMeta): void {
    console.warn(`⚠️ ${this.formatMessage("WARNING", message, meta)}`);
  }

  /**
   * Log de debug (solo en development)
   */
  debug(message: string, meta?: LogMeta): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(`🔍 ${this.formatMessage("DEBUG", message, meta)}`);
    }
  }

  /**
   * Log de inicio de operación
   */
  start(operation: string, meta?: LogMeta): void {
    this.info(`⏱️ Starting: ${operation}`, meta);
  }

  /**
   * Log de fin de operación
   */
  end(operation: string, durationMs?: number, meta?: LogMeta): void {
    const duration = durationMs ? ` (${durationMs}ms)` : "";
    this.success(`Completed: ${operation}${duration}`, meta);
  }

  /**
   * Wrapper para medir tiempo de ejecución
   */
  async time<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.start(operation);

    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.end(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed: ${operation} (${duration}ms)`, error as Error);
      throw error;
    }
  }

  /**
   * Log de API request
   */
  apiRequest(method: string, path: string, meta?: LogMeta): void {
    this.info(`API Request: ${method} ${path}`, meta);
  }

  /**
   * Log de API response
   */
  apiResponse(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    meta?: LogMeta
  ): void {
    const level = statusCode >= 400 ? "WARNING" : "INFO";
    const message = `API Response: ${method} ${path} - ${statusCode} (${durationMs}ms)`;

    if (level === "WARNING") {
      this.warning(message, meta);
    } else {
      this.info(message, meta);
    }
  }
}

// Exportar instancia singleton
export const logger = new Logger();

