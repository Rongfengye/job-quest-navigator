/**
 * Centralized logging utility with environment-based control
 * 
 * Log Levels:
 * - error: Always shown (critical errors)
 * - warn: Shown in development and when explicitly enabled in production
 * - info: Shown in development and when explicitly enabled in production
 * - debug: Only shown in development or when debug mode is enabled
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LoggerConfig {
  isDevelopment: boolean;
  enableProductionLogs: boolean;
  enableDebugLogs: boolean;
  logPrefix: string;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      isDevelopment: import.meta.env.DEV || import.meta.env.MODE === 'development',
      enableProductionLogs: import.meta.env.VITE_ENABLE_PRODUCTION_LOGS === 'true',
      enableDebugLogs: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
      logPrefix: import.meta.env.VITE_LOG_PREFIX || '🔷'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // Errors always log
    if (level === 'error') return true;

    // In development, log everything
    if (this.config.isDevelopment) return true;

    // In production, check specific flags
    if (level === 'debug') {
      return this.config.enableDebugLogs;
    }

    // For warn and info, check if production logs are enabled
    return this.config.enableProductionLogs;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = this.getPrefix(level);
    
    if (this.config.isDevelopment) {
      return `${prefix} [${timestamp}] ${message}`;
    }
    
    // Simpler format for production
    return `${prefix} ${message}`;
  }

  private getPrefix(level: LogLevel): string {
    const prefixes = {
      error: '❌',
      warn: '⚠️',
      info: '📘',
      debug: '🔍'
    };
    
    return prefixes[level] || this.config.logPrefix;
  }

  error(message: string, error?: Error | any): void {
    if (!this.shouldLog('error')) return;

    const formattedMessage = this.formatMessage('error', message);
    
    if (error instanceof Error) {
      console.error(formattedMessage, '\n', error.message, '\n', error.stack);
    } else if (error) {
      console.error(formattedMessage, error);
    } else {
      console.error(formattedMessage);
    }
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog('warn')) return;

    const formattedMessage = this.formatMessage('warn', message);
    
    if (data !== undefined) {
      console.warn(formattedMessage, data);
    } else {
      console.warn(formattedMessage);
    }
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog('info')) return;

    const formattedMessage = this.formatMessage('info', message);
    
    if (data !== undefined) {
      console.info(formattedMessage, data);
    } else {
      console.info(formattedMessage);
    }
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog('debug')) return;

    const formattedMessage = this.formatMessage('debug', message);
    
    if (data !== undefined) {
      console.log(formattedMessage, data);
    } else {
      console.log(formattedMessage);
    }
  }

  // Convenience method for logging groups (useful for complex operations)
  group(label: string, fn: () => void): void {
    if (!this.config.isDevelopment && !this.config.enableDebugLogs) {
      fn();
      return;
    }

    console.group(this.formatMessage('info', label));
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  }

  // Performance timing helper
  time(label: string): () => void {
    if (!this.shouldLog('debug')) {
      return () => {}; // No-op in production
    }

    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`${label} took ${duration.toFixed(2)}ms`);
    };
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogLevel };