export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  error?: Error;
}

class Logger {
  private minLevel: LogLevel = __DEV__ ? 'debug' : 'info';
  
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  
  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }
  
  debug(message: string, context?: string): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${context ? `[${context}] ` : ''}${message}`);
    }
  }
  
  info(message: string, context?: string): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${context ? `[${context}] ` : ''}${message}`);
    }
  }
  
  warn(message: string, context?: string): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${context ? `[${context}] ` : ''}${message}`);
    }
  }
  
  error(message: string, error?: Error, context?: string): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, error);
    }
  }
  
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

export const logger = new Logger();
