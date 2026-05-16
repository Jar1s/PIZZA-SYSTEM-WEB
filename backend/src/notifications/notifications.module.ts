import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TelegramExceptionFilter } from './telegram-exception.filter';
import { TelegramNotificationsService } from './telegram-notifications.service';

@Module({
  providers: [
    TelegramNotificationsService,
    {
      provide: APP_FILTER,
      useClass: TelegramExceptionFilter,
    },
  ],
  exports: [TelegramNotificationsService],
})
export class NotificationsModule {}
