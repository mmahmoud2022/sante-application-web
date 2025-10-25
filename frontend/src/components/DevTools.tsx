/**
 * Developer Tools Component
 * Provides debugging utilities for development mode
 */

'use client';

import { useState, useEffect } from 'react';
import { Bug, X, Download, Trash2, BarChart3, AlertCircle } from 'lucide-react';
import logger, { LogEntry } from '@/lib/logger';
import apiMonitor from '@/lib/api-monitor';

export default function DevTools() {
  const isDev = process.env.NODE_ENV === 'development';
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'api' | 'performance'>('logs');
  const [errors, setErrors] = useState<LogEntry[]>([]);
  const [apiSummary, setApiSummary] = useState<ReturnType<typeof apiMonitor.getSummary>>();
  const [performanceMetrics, setPerformanceMetrics] = useState<ReturnType<typeof logger.getPerformanceMetrics>>([]);

  // Only show in development
  useEffect(() => {
    if (!isDev || !isOpen) {
      return;
    }

    // Refresh data when panel is opened
    setErrors(logger.getStoredErrors());
    setApiSummary(apiMonitor.getSummary());
    setPerformanceMetrics(logger.getPerformanceMetrics());
  }, [isDev, isOpen, activeTab]);

  if (!isDev) {
    return null;
  }

  const handleExportLogs = () => {
    const data = {
      errors: logger.getStoredErrors(),
      apiMetrics: apiMonitor.exportMetrics(),
      performanceMetrics: logger.getPerformanceMetrics(),
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    logger.clearStoredErrors();
    apiMonitor.clear();
    logger.clearPerformanceMetrics();
    setErrors([]);
    setApiSummary(apiMonitor.getSummary());
    setPerformanceMetrics([]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all"
        title="Open Developer Tools"
      >
        <Bug className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-2/3 lg:w-1/2 h-96 bg-gray-900 text-gray-100 z-50 rounded-tl-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-purple-400" />
          <span className="font-semibold">Developer Tools</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportLogs}
            className="p-1.5 hover:bg-gray-700 rounded transition"
            title="Export logs"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={handleClearLogs}
            className="p-1.5 hover:bg-gray-700 rounded transition"
            title="Clear logs"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-gray-700 rounded transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'logs'
              ? 'bg-gray-900 text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Error Logs ({errors.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'api'
              ? 'bg-gray-900 text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            API Metrics
          </div>
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'performance'
              ? 'bg-gray-900 text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Performance ({performanceMetrics.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'logs' && (
          <div className="space-y-2">
            {errors.length === 0 ? (
              <p className="text-gray-500 text-sm">No errors logged</p>
            ) : (
              errors.map((error, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded p-3 text-xs font-mono border-l-4 border-red-500"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-red-400 font-semibold">[{error.level.toUpperCase()}]</span>
                    <span className="text-gray-500">{new Date(error.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-200 mb-2">{error.message}</p>
                  {error.context && (
                    <details className="mt-2">
                      <summary className="text-purple-400 cursor-pointer">Context</summary>
                      <pre className="mt-1 text-gray-400 overflow-auto">
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </details>
                  )}
                  {error.error && (
                    <details className="mt-2">
                      <summary className="text-orange-400 cursor-pointer">Stack Trace</summary>
                      <pre className="mt-1 text-gray-400 overflow-auto max-h-32">
                        {error.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'api' && apiSummary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gray-800 rounded p-3">
                <div className="text-gray-400 text-xs">Total Calls</div>
                <div className="text-2xl font-bold text-blue-400">{apiSummary.totalCalls}</div>
              </div>
              <div className="bg-gray-800 rounded p-3">
                <div className="text-gray-400 text-xs">Success Rate</div>
                <div className="text-2xl font-bold text-green-400">
                  {apiSummary.successRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-800 rounded p-3">
                <div className="text-gray-400 text-xs">Avg Duration</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {apiSummary.averageDuration.toFixed(0)}ms
                </div>
              </div>
              <div className="bg-gray-800 rounded p-3">
                <div className="text-gray-400 text-xs">Slow Calls</div>
                <div className="text-2xl font-bold text-orange-400">{apiSummary.slowCalls}</div>
              </div>
              <div className="bg-gray-800 rounded p-3">
                <div className="text-gray-400 text-xs">Failed Calls</div>
                <div className="text-2xl font-bold text-red-400">{apiSummary.failedCalls}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-2">
            {performanceMetrics.length === 0 ? (
              <p className="text-gray-500 text-sm">No performance metrics logged</p>
            ) : (
              performanceMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded p-3 text-xs font-mono flex items-center justify-between"
                >
                  <div>
                    <span className="text-purple-400">{metric.name}</span>
                    {metric.metadata && (
                      <span className="text-gray-500 ml-2">
                        {JSON.stringify(metric.metadata)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-semibold ${
                      metric.duration > 1000
                        ? 'text-red-400'
                        : metric.duration > 500
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {metric.duration.toFixed(0)}ms
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
