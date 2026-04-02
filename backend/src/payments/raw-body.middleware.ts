import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to capture raw request body for webhook signature verification
 * Must be applied before body-parser middleware
 */
@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.path.startsWith('/api/webhooks')) {
      let data = '';
      
      req.setEncoding('utf8');
      req.on('data', (chunk) => {
        data += chunk;
      });
      
      req.on('end', () => {
        // Store raw body as Buffer for signature verification
        (req as any).rawBody = Buffer.from(data, 'utf8');
        next();
      });
    } else {
      next();
    }
  }
}

