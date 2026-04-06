import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Logs each HTTP request when it finishes: METHOD path status duration.
 * Useful for tracing mobile app traffic without dumping bodies (multipart stays opaque).
 */
@Injectable()
export class HttpRequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const path = req.originalUrl ?? req.url;
    res.on('finish', () => {
      const ms = Date.now() - start;
      this.logger.log(`${req.method} ${path} ${res.statusCode} ${ms}ms`);
    });
    next();
  }
}
