/**
 * Tests for Frontend Logger
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import logger, { LogLevel } from '../lib/logger';

describe('Logger', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
    // Clear session storage
    sessionStorage.clear();
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should log error messages with full details in development', () => {
      const message = 'Test error message';
      const context = { userId: 123, action: 'test' };
      const error = new Error('Test error');

      logger.error(message, context, error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('userId')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });

    it('should log warning messages in development', () => {
      const message = 'Test warning';
      const context = { component: 'TestComponent' };

      logger.warn(message, context);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
    });

    it('should log info messages in development', () => {
      const message = 'Test info';
      const context = { page: 'dashboard' };

      logger.info(message, context);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]')
      );
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
    });

    it('should log debug messages in development', () => {
      const message = 'Test debug';
      const context = { data: 'test' };

      logger.debug(message, context);

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]')
      );
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
    });

    it('should include stack trace for errors in development', () => {
      const error = new Error('Test error with stack');
      logger.error('Error occurred', {}, error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Stack:')
      );
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should log minimal error messages in production', () => {
      const message = 'Production error';
      logger.error(message);

      expect(console.error).toHaveBeenCalledWith('[ERROR] Production error');
    });

    it('should not log debug messages in production', () => {
      logger.debug('Debug message');

      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should not log info to console in production', () => {
      logger.info('Info message');

      expect(console.info).not.toHaveBeenCalled();
    });

    it('should store error logs in sessionStorage in production', () => {
      const message = 'Critical error';
      const context = { severity: 'high' };

      logger.error(message, context);

      const storedLogs = logger.getStoredErrors();
      expect(storedLogs).toHaveLength(1);
      expect(storedLogs[0].message).toBe(message);
      expect(storedLogs[0].level).toBe(LogLevel.ERROR);
      expect(storedLogs[0].context).toEqual(context);
    });

    it('should limit stored errors to 50 entries', () => {
      // Log 60 errors
      for (let i = 0; i < 60; i++) {
        logger.error(`Error ${i}`);
      }

      const storedLogs = logger.getStoredErrors();
      expect(storedLogs.length).toBeLessThanOrEqual(50);
      // Should keep the most recent errors
      expect(storedLogs[storedLogs.length - 1].message).toBe('Error 59');
    });
  });

  describe('Error Log Storage', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should retrieve stored error logs', () => {
      
      logger.error('First error', { id: 1 });
      logger.error('Second error', { id: 2 });

      const logs = logger.getStoredErrors();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('First error');
      expect(logs[1].message).toBe('Second error');
    });

    it('should clear stored error logs', () => {
      
      logger.error('Error to clear');
      expect(logger.getStoredErrors()).toHaveLength(1);

      logger.clearStoredErrors();
      expect(logger.getStoredErrors()).toHaveLength(0);
    });

    it('should return empty array if no errors stored', () => {
      const logs = logger.getStoredErrors();
      expect(logs).toEqual([]);
    });
  });

  describe('Log Entry Format', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should include timestamp in log entries', () => {
      logger.info('Test message');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
    });

    it('should include log level in uppercase', () => {
      logger.error('Error');
      logger.warn('Warning');
      logger.info('Info');
      logger.debug('Debug');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]')
      );
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]')
      );
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]')
      );
    });

    it('should format context as JSON', () => {
      const context = { userId: 123, action: 'login', status: 'success' };
      logger.info('User action', context);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Context:')
      );
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('"userId": 123')
      );
    });

    it('should handle logs without context', () => {
      logger.error('Simple error');

      expect(console.error).toHaveBeenCalled();
      // Should not throw error
    });

    it('should handle logs with empty context', () => {
      logger.warn('Warning with empty context', {});

      expect(console.warn).toHaveBeenCalled();
      // Should not include empty context in output
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should handle Error objects correctly', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at test.ts:1:1';

      logger.error('Error occurred', {}, error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });

    it('should extract error message from Error objects', () => {
      const error = new Error('Custom error message');
      logger.error('Operation failed', {}, error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Custom error message')
      );
    });
  });

  describe('Context Support', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should support complex context objects', () => {
      const context = {
        user: { id: 1, name: 'Test User' },
        request: { url: '/api/test', method: 'POST' },
        timestamp: Date.now(),
      };

      logger.info('Complex context', context);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('"id": 1')
      );
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('"method": "POST"')
      );
    });

    it('should support arrays in context', () => {
      const context = {
        items: [1, 2, 3],
        tags: ['error', 'critical'],
      };

      logger.warn('Array context', context);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('"items"')
      );
    });
  });
});
