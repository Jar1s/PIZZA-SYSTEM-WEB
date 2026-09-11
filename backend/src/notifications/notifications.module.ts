import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SlackExceptionFilter } from './slack-exception.filter';
import { SlackNotificationsService } from './slack-notifications.service';

@Module({
  providers: [
    SlackNotificationsService,
    {
      provide: APP_FILTER,
      useClass: SlackExceptionFilter,
    },
  ],
  exports: [SlackNotificationsService],
})
export class NotificationsModule {}
