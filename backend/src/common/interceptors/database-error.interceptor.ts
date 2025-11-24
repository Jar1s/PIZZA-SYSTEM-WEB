import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PrismaClientKnownRequestError, PrismaClientInitializationError } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DatabaseErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DatabaseErrorInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Check if it's a database connection error
        if (error instanceof PrismaClientInitializationError && error.errorCode === 'P1001') {
          // Database connection error - try to reconnect
          this.logger.warn('⚠️ Database connection error detected, attempting to reconnect...');
          
          this.prisma.reconnect().then((reconnected) => {
            if (reconnected) {
              this.logger.log('✅ Database reconnected successfully after error');
            } else {
              this.logger.error('❌ Failed to reconnect to database');
            }
          }).catch((reconnectError) => {
            this.logger.error('❌ Error during reconnection:', reconnectError);
          });
          
          return throwError(
            () => new HttpException(
              {
                statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                message: 'Database temporarily unavailable. Please try again in a moment.',
                error: 'Service Unavailable',
              },
              HttpStatus.SERVICE_UNAVAILABLE,
            ),
          );
        }

        // Check for other Prisma connection errors
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P1001') {
          this.logger.warn('⚠️ Database connection error (P1001), attempting to reconnect...');
          
          this.prisma.reconnect().then((reconnected) => {
            if (reconnected) {
              this.logger.log('✅ Database reconnected successfully after error');
            } else {
              this.logger.error('❌ Failed to reconnect to database');
            }
          }).catch((reconnectError) => {
            this.logger.error('❌ Error during reconnection:', reconnectError);
          });
          
          return throwError(
            () => new HttpException(
              {
                statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                message: 'Database temporarily unavailable. Please try again in a moment.',
                error: 'Service Unavailable',
              },
              HttpStatus.SERVICE_UNAVAILABLE,
            ),
          );
        }

        // For other errors, just pass them through
        return throwError(() => error);
      }),
    );
  }
}

