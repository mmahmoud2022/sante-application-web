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

export enum LogCategory {
  AUTH = 'auth',
  API = 'api',
  UI = 'ui',
  NAVIGATION = 'navigation',
  FORM = 'form',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  VALIDATION = 'validation',
  PAYMENT = 'payment',
  NOTIFICATION = 'notification',
  WEBSOCKET = 'websocket',
  STORAGE = 'storage',
  GENERAL = 'general',
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
  userId?: string | number;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private sessionId: string;
  private performanceMetrics: PerformanceMetric[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeGlobalErrorHandler();
  }

  private get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  private get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Initialize global error handlers
   */
  private initializeGlobalErrorHandler(): void {
    if (typeof window === 'undefined') return;

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error(
        'Unhandled Promise Rejection',
        {
          reason: event.reason,
          promise: event.promise,
        },
        event.reason instanceof Error ? event.reason : undefined,
        LogCategory.GENERAL
      );
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      this.error(
        'Global Error',
        {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        event.error,
        LogCategory.GENERAL
      );
    });
  }

  /**
   * Get user info for logging context
   */
  private getUserContext(): Pick<LogEntry, 'userId' | 'userAgent' | 'url'> {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      userId: this.getCurrentUserId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  /**
   * Get current user ID from storage or context
   */
  private getCurrentUserId(): string | number | undefined {
    if (typeof window === 'undefined') return undefined;

    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.id;
      }
    } catch {
      // Fail silently
    }
    return undefined;
  }

  /**
   * Create a formatted log entry
   */
  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      category,
      message,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      context,
      error,
      ...this.getUserContext(),
    };
  }

  /**
   * Format log entry for console output
   */
  private formatLogMessage(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      `[${entry.category.toUpperCase()}]`,
      entry.message,
    ];

    if (entry.userId) {
      parts.push(`\nUser: ${entry.userId}`);
    }

    if (entry.url && this.isDevelopment) {
      parts.push(`\nURL: ${entry.url}`);
    }

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
   * Get appropriate emoji for log level
   */
  private getLogEmoji(level: LogLevel): string {
    const emojis = {
      [LogLevel.ERROR]: '❌',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.DEBUG]: '🐛',
    };
    return emojis[level] || '';
  }

  /**
   * Get color for log category
   */
  private getCategoryColor(category: LogCategory): string {
    const colors: Record<LogCategory, string> = {
      [LogCategory.AUTH]: '#9333ea',
      [LogCategory.API]: '#3b82f6',
      [LogCategory.UI]: '#10b981',
      [LogCategory.NAVIGATION]: '#f59e0b',
      [LogCategory.FORM]: '#8b5cf6',
      [LogCategory.PERFORMANCE]: '#ef4444',
      [LogCategory.SECURITY]: '#dc2626',
      [LogCategory.VALIDATION]: '#f97316',
      [LogCategory.PAYMENT]: '#059669',
      [LogCategory.NOTIFICATION]: '#06b6d4',
      [LogCategory.WEBSOCKET]: '#6366f1',
      [LogCategory.STORAGE]: '#84cc16',
      [LogCategory.GENERAL]: '#6b7280',
    };
    return colors[category] || '#6b7280';
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
  error(
    message: string,
    context?: LogContext,
    error?: Error,
    category: LogCategory = LogCategory.GENERAL
  ): void {
    const entry = this.createLogEntry(LogLevel.ERROR, category, message, context, error);
    
    if (this.isDevelopment) {
      const emoji = this.getLogEmoji(LogLevel.ERROR);
      console.error(`${emoji} ${this.formatLogMessage(entry)}`);
    } else {
      console.error(`[ERROR] [${category}] ${message}`);
    }
    
    this.sendToMonitoring(entry);
  }

  /**
   * Log a warning message
   */
  warn(
    message: string,
    context?: LogContext,
    category: LogCategory = LogCategory.GENERAL
  ): void {
    const entry = this.createLogEntry(LogLevel.WARN, category, message, context);
    
    if (this.isDevelopment) {
      const emoji = this.getLogEmoji(LogLevel.WARN);
      const color = this.getCategoryColor(category);
      console.warn(`${emoji} %c${this.formatLogMessage(entry)}`, `color: ${color}`);
    } else {
      console.warn(`[WARN] [${category}] ${message}`);
    }
    
    this.sendToMonitoring(entry);
  }

  /**
   * Log an info message
   */
  info(
    message: string,
    context?: LogContext,
    category: LogCategory = LogCategory.GENERAL
  ): void {
    const entry = this.createLogEntry(LogLevel.INFO, category, message, context);
    
    if (this.isDevelopment) {
      const emoji = this.getLogEmoji(LogLevel.INFO);
      const color = this.getCategoryColor(category);
      console.info(`${emoji} %c${this.formatLogMessage(entry)}`, `color: ${color}`);
    }
    // Don't log info in production console to reduce noise
  }

  /**
   * Log a debug message (only in development)
   */
  debug(
    message: string,
    context?: LogContext,
    category: LogCategory = LogCategory.GENERAL
  ): void {
    if (!this.isDevelopment) {
      return;
    }
    
    const entry = this.createLogEntry(LogLevel.DEBUG, category, message, context);
    const emoji = this.getLogEmoji(LogLevel.DEBUG);
    const color = this.getCategoryColor(category);
    console.debug(`${emoji} %c${this.formatLogMessage(entry)}`, `color: ${color}`);
  }

  /**
   * Log performance metrics
   */
  performance(name: string, duration: number, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.performanceMetrics.push(metric);

    // Keep only last 100 metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics.shift();
    }

    if (this.isDevelopment) {
      const color = duration > 1000 ? '#ef4444' : duration > 500 ? '#f59e0b' : '#10b981';
      console.log(
        `⚡ %c[PERFORMANCE] ${name}: ${duration}ms`,
        `color: ${color}; font-weight: bold`,
        metadata || ''
      );
    }

    // Log slow operations as warnings
    if (duration > 2000) {
      this.warn(
        `Slow operation detected: ${name}`,
        { duration, ...metadata },
        LogCategory.PERFORMANCE
      );
    }
  }

  /**
   * Start a performance timer
   */
  startTimer(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.performance(name, duration);
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
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
