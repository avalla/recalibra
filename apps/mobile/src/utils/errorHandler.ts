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
    console.log(`[${error.level}] ${context}: ${error.message} (${error.code})`);
    // Log a servizi di monitoring se necessario
  } else if (error instanceof Error) {
    console.error(`[error] ${context}: ${error.message}`, error.stack);
  } else {
    console.error(`[error] ${context}: Unknown error`, error);
  }
};

export const createError = (message: string, code: string, level: 'info' | 'warning' | 'error' = 'error'): AppError => {
  return new AppError(message, code, level);
};
