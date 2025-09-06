import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    error: {
      message,
      status,
      timestamp: new Date().toISOString()
    }
  });
};