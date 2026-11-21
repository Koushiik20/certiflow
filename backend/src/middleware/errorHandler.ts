import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[CertiFlow Server Error]', err);

  const statusCode = err.statusCode || (err.name === 'ZodError' ? 400 : 500);
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    details: err.issues || err.details || undefined,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

