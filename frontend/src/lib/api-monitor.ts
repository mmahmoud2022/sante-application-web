/**
 * API Monitoring Utilities
 * Provides utilities for monitoring API calls, performance, and errors
 */

import logger, { LogCategory } from './logger';

export interface APICallMetrics {
  endpoint: string;
  method: string;
  statusCode?: number;
  duration: number;
  timestamp: string;
  success: boolean;
  error?: string;
  userId?: string | number;
}

class APIMonitor {
  private metrics: APICallMetrics[] = [];
  private readonly MAX_METRICS = 200;

  /**
   * Log an API call with metrics
   */
  logAPICall(metrics: Omit<APICallMetrics, 'timestamp'>): void {
    const entry: APICallMetrics = {
      ...metrics,
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(entry);

    // Keep only last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log based on outcome
    if (metrics.success) {
      logger.info(
        `API ${metrics.method} ${metrics.endpoint} - ${metrics.statusCode}`,
        {
          duration: metrics.duration,
          statusCode: metrics.statusCode,
        },
        LogCategory.API
      );

      // Warn on slow API calls
      if (metrics.duration > 3000) {
        logger.warn(
          `Slow API call detected: ${metrics.method} ${metrics.endpoint}`,
          {
            duration: metrics.duration,
            statusCode: metrics.statusCode,
          },
          LogCategory.PERFORMANCE
        );
      }
    } else {
      logger.error(
        `API ${metrics.method} ${metrics.endpoint} failed`,
        {
          duration: metrics.duration,
          statusCode: metrics.statusCode,
          error: metrics.error,
        },
        undefined,
        LogCategory.API
      );
    }
  }

  /**
   * Get all stored metrics
   */
  getMetrics(): APICallMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalCalls: number;
    successRate: number;
    averageDuration: number;
    slowCalls: number;
    failedCalls: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalCalls: 0,
        successRate: 0,
        averageDuration: 0,
        slowCalls: 0,
        failedCalls: 0,
      };
    }

    const totalCalls = this.metrics.length;
    const successfulCalls = this.metrics.filter((m) => m.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const successRate = (successfulCalls / totalCalls) * 100;
    const averageDuration =
      this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalCalls;
    const slowCalls = this.metrics.filter((m) => m.duration > 2000).length;

    return {
      totalCalls,
      successRate,
      averageDuration,
      slowCalls,
      failedCalls,
    };
  }

  /**
   * Get metrics by endpoint
   */
  getMetricsByEndpoint(endpoint: string): APICallMetrics[] {
    return this.metrics.filter((m) => m.endpoint.includes(endpoint));
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics as JSON for debugging
   */
  exportMetrics(): string {
    return JSON.stringify(
      {
        summary: this.getSummary(),
        metrics: this.metrics,
      },
      null,
      2
    );
  }
}

// Export singleton instance
const apiMonitor = new APIMonitor();
export default apiMonitor;

/**
 * Hook for easier API monitoring in components
 */
export function useAPIMonitor() {
  return {
    logCall: (metrics: Omit<APICallMetrics, 'timestamp'>) =>
      apiMonitor.logAPICall(metrics),
    getMetrics: () => apiMonitor.getMetrics(),
    getSummary: () => apiMonitor.getSummary(),
    clear: () => apiMonitor.clear(),
  };
}
