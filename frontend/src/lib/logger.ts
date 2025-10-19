/**
 * Frontend Logger
 * Provides structured logging with different log levels and context support
 * Environment-aware: detailed logs in development, minimal in production
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  private get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Create a formatted log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
  }

  /**
   * Format log entry for console output
   */
  private formatLogMessage(entry: LogEntry): string {
    const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`, entry.message];

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(`\nContext: ${JSON.stringify(entry.context, null, 2)}`);
    }

    if (entry.error) {
      parts.push(`\nError: ${entry.error.message}`);
      if (entry.error.stack && this.isDevelopment) {
        parts.push(`\nStack: ${entry.error.stack}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Send logs to monitoring service in production
   */
  private sendToMonitoring(entry: LogEntry): void {
    if (!this.isProduction) {
      return;
    }

    // In production, we would send logs to a monitoring service
    // For now, we'll just store critical errors
    if (entry.level === LogLevel.ERROR && typeof window !== 'undefined') {
      try {
        // Could integrate with services like Sentry, LogRocket, etc.
        // For now, just store in sessionStorage for debugging
        const logs = JSON.parse(sessionStorage.getItem('error_logs') || '[]');
        logs.push(entry);
        // Keep only last 50 errors
        if (logs.length > 50) {
          logs.shift();
        }
        sessionStorage.setItem('error_logs', JSON.stringify(logs));
      } catch (e) {
        // Fail silently if sessionStorage is not available
      }
    }
  }

  /**
   * Log an error message
   */
  error(message: string, context?: LogContext, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    
    if (this.isDevelopment) {
      console.error(this.formatLogMessage(entry));
    } else {
      console.error(`[ERROR] ${message}`);
    }
    
    this.sendToMonitoring(entry);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    
    if (this.isDevelopment) {
      console.warn(this.formatLogMessage(entry));
    } else {
      console.warn(`[WARN] ${message}`);
    }
    
    this.sendToMonitoring(entry);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    
    if (this.isDevelopment) {
      console.info(this.formatLogMessage(entry));
    }
    // Don't log info in production console to reduce noise
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) {
      return;
    }
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    console.debug(this.formatLogMessage(entry));
  }

  /**
   * Get stored error logs (for debugging in production)
   */
  getStoredErrors(): LogEntry[] {
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      return JSON.parse(sessionStorage.getItem('error_logs') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear stored error logs
   */
  clearStoredErrors(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('error_logs');
    }
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;
