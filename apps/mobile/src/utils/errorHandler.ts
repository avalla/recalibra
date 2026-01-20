import { logger } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public level: 'info' | 'warning' | 'error' = 'error'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown, context: string) => {
  if (error instanceof AppError) {
    if (error.level === 'warning') {
      logger.warn(`${context}: ${error.message} (${error.code})`, 'AppError');
      return;
    }
    if (error.level === 'info') {
      logger.info(`${context}: ${error.message} (${error.code})`, 'AppError');
      return;
    }
    logger.error(`${context}: ${error.message} (${error.code})`, error, 'AppError');
    // Log a servizi di monitoring se necessario
  } else if (error instanceof Error) {
    logger.error(`${context}: ${error.message}`, error, 'AppError');
  } else {
    logger.error(`${context}: Unknown error`, new Error('Unknown error'), 'AppError');
  }
};

export const createError = (message: string, code: string, level: 'info' | 'warning' | 'error' = 'error'): AppError => {
  return new AppError(message, code, level);
};
