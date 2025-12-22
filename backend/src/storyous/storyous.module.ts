import { Module, forwardRef } from '@nestjs/common';
import { StoryousService } from './storyous.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [forwardRef(() => SettingsModule)],
  providers: [StoryousService],
  exports: [StoryousService],
})
export class StoryousModule {}









