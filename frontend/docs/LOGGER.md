# Frontend Logger Documentation

## Overview

The frontend logger provides structured, environment-aware logging for the Santé application. It replaces basic `console.*` calls with a comprehensive logging system that includes context, metadata, and production monitoring support.

## Features

- **Environment-Aware**: Detailed logs in development, minimal in production
- **Multiple Log Levels**: error, warn, info, debug
- **Structured Logging**: Add context and metadata to every log entry
- **Error Storage**: Automatically stores errors in production for debugging
- **TypeScript Support**: Fully typed for better developer experience

## Installation

The logger is located at `src/lib/logger.ts` and can be imported in any component:

```typescript
import logger from '@/lib/logger';
```

## Usage

### Basic Logging

```typescript
// Error logging
logger.error('Failed to load user data');

// Warning logging
logger.warn('API response took longer than expected');

// Info logging (development only)
logger.info('User successfully logged in');

// Debug logging (development only)
logger.debug('API response received');
```

### Logging with Context

Add structured context to provide more information about the error:

```typescript
logger.error('Failed to update profile', {
  userId: user.id,
  field: 'email',
  attemptNumber: 3,
});
```

### Logging with Error Objects

Pass Error objects for stack trace capture (in development):

```typescript
try {
  await api.users.update(data);
} catch (error) {
  logger.error('Failed to update user', {
    userId: user.id,
    data: data,
  }, error as Error);
}
```

### Complex Context

The logger supports complex context objects:

```typescript
logger.error('Payment processing failed', {
  user: {
    id: user.id,
    email: user.email,
  },
  payment: {
    amount: 100.00,
    currency: 'USD',
    method: 'credit_card',
  },
  attempt: 1,
  timestamp: Date.now(),
}, error);
```

## Log Levels

### ERROR
- **When to use**: For errors that affect functionality
- **Behavior**: 
  - Development: Full details with stack trace
  - Production: Minimal message + stored in sessionStorage
- **Example**:
```typescript
logger.error('Failed to load appointments', { userId: user.id }, error);
```

### WARN
- **When to use**: For potentially problematic situations
- **Behavior**: 
  - Development: Full details
  - Production: Simple message
- **Example**:
```typescript
logger.warn('API rate limit approaching', { 
  remaining: 10, 
  resetTime: '2025-10-20T00:00:00Z' 
});
```

### INFO
- **When to use**: For general informational messages
- **Behavior**: 
  - Development: Full details
  - Production: Not logged to console (to reduce noise)
- **Example**:
```typescript
logger.info('User profile updated', { 
  userId: user.id, 
  fields: ['email', 'phone'] 
});
```

### DEBUG
- **When to use**: For debugging during development
- **Behavior**: 
  - Development: Full details
  - Production: Not logged at all
- **Example**:
```typescript
logger.debug('API response', { 
  endpoint: '/api/users', 
  duration: 150,
  responseSize: 1024 
});
```

## Environment Behavior

### Development (`NODE_ENV=development`)
- All log levels are active
- Full context and metadata displayed
- Stack traces included for errors
- Formatted with timestamps and log levels

### Production (`NODE_ENV=production`)
- ERROR and WARN: Minimal console output
- INFO and DEBUG: Not logged to console
- Errors stored in sessionStorage for debugging
- Limited to last 50 errors

## Retrieving Stored Errors

In production, errors are automatically stored in sessionStorage. You can retrieve them:

```typescript
// Get all stored errors
const errors = logger.getStoredErrors();
console.log('Stored errors:', errors);

// Clear stored errors
logger.clearStoredErrors();
```

This is useful for:
- Debugging production issues
- Sending error reports to support
- Analyzing user-reported problems

## Best Practices

### 1. Always Include Context

**Bad:**
```typescript
logger.error('Failed to load data');
```

**Good:**
```typescript
logger.error('Failed to load data', {
  userId: user?.id,
  endpoint: '/api/appointments',
  errorMessage: error?.message,
}, error);
```

### 2. Use Appropriate Log Levels

- Use `error` for actual errors that break functionality
- Use `warn` for degraded performance or potential issues
- Use `info` for successful operations (in dev)
- Use `debug` for detailed troubleshooting data

### 3. Don't Log Sensitive Data

**Bad:**
```typescript
logger.error('Login failed', {
  password: user.password,  // Never log passwords!
  ssn: user.ssn,            // Never log PII!
});
```

**Good:**
```typescript
logger.error('Login failed', {
  userId: user.id,
  email: user.email,  // Email is okay if needed for debugging
  attemptNumber: 3,
});
```

### 4. Structure Your Context

Use consistent context object structures for similar operations:

```typescript
// Standard error context
{
  userId: user?.id,
  action: 'update_profile',
  errorMessage: error?.message,
}

// API call context
{
  userId: user?.id,
  endpoint: '/api/appointments',
  method: 'POST',
  statusCode: response?.status,
}
```

## Example: Complete Error Handling

```typescript
const handleSubmit = async (data: ProfileData) => {
  try {
    setSaving(true);
    
    logger.info('Updating user profile', {
      userId: user.id,
      fields: Object.keys(data),
    });
    
    await api.users.update(data);
    
    logger.info('Profile updated successfully', {
      userId: user.id,
    });
    
    setMessage({ type: 'success', text: 'Profile updated!' });
  } catch (error: any) {
    logger.error('Failed to update profile', {
      userId: user?.id,
      fields: Object.keys(data),
      errorMessage: error?.message,
      statusCode: error?.response?.status,
    }, error);
    
    setMessage({ 
      type: 'error', 
      text: error.message || 'Failed to update profile' 
    });
  } finally {
    setSaving(false);
  }
};
```

## Integration with Monitoring Services

The logger is designed to integrate with monitoring services like Sentry, LogRocket, or DataDog. To integrate:

1. Modify the `sendToMonitoring` method in `src/lib/logger.ts`
2. Add your monitoring service initialization
3. Send errors to your service in production

Example (Sentry):

```typescript
private sendToMonitoring(entry: LogEntry): void {
  if (!this.isProduction) {
    return;
  }

  if (entry.level === LogLevel.ERROR) {
    // Send to Sentry
    Sentry.captureException(entry.error || new Error(entry.message), {
      contexts: {
        custom: entry.context,
      },
    });
  }
}
```

## Testing

The logger includes comprehensive tests covering all functionality. See `src/test/logger.test.ts` for examples.

Run tests:
```bash
npm test
```

## Migration Guide

To migrate from `console.*` to the logger:

**Before:**
```typescript
try {
  await api.call();
} catch (error) {
  console.error('Failed to call API:', error);
}
```

**After:**
```typescript
try {
  await api.call();
} catch (error: any) {
  logger.error('Failed to call API', {
    userId: user?.id,
    errorMessage: error?.message,
  }, error);
}
```

## Summary

The frontend logger provides:
- ✅ Structured, searchable logs
- ✅ Environment-aware behavior
- ✅ Production error storage
- ✅ Better debugging capabilities
- ✅ Future monitoring service integration
- ✅ Comprehensive test coverage

For questions or issues, please refer to the test suite or create an issue.
