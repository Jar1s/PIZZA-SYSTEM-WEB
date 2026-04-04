import { Module } from '@nestjs/common';
import { StoryousService } from './storyous.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [StoryousService],
  exports: [StoryousService],
})
export class StoryousModule {}









