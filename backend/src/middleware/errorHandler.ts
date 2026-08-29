import { Request, Response, NextFunction } from 'express';

export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Global Error Handler]', err);

  const statusCode = err.status || err.statusCode || 500;
  const message =
    statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Action failed.';

  res.status(statusCode).json({
    error: err.name || 'Error',
    message,
  });
}
