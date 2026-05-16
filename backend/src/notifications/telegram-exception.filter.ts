import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TelegramNotificationsService } from './telegram-notifications.service';

@Catch()
export class TelegramExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TelegramExceptionFilter.name);

  constructor(private readonly telegram: TelegramNotificationsService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      void this.telegram.notifyError({
        title: exception instanceof Error ? exception.name : 'Unhandled exception',
        message: exception instanceof Error ? exception.message : String(exception),
        statusCode: status,
        method: request.method,
        path: request.originalUrl || request.url,
        stack: exception instanceof Error ? exception.stack : undefined,
      }).catch((error) => {
        this.logger.warn('Failed to send Telegram exception report', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    if (response.headersSent) return;

    response.status(status).json({
      statusCode: status,
      message: this.clientMessage(exception, status),
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
    });
  }

  private clientMessage(exception: unknown, status: number): string | string[] {
    if (!(exception instanceof HttpException)) return 'Internal server error';

    const body = exception.getResponse();
    if (typeof body === 'string') return body;

    if (body && typeof body === 'object' && 'message' in body) {
      return (body as { message: string | string[] }).message;
    }

    return status >= HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Internal server error'
      : exception.message;
  }
}
