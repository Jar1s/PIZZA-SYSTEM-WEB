import { Module } from '@nestjs/common';
import { StoryousService } from './storyous.service';

@Module({
  providers: [StoryousService],
  exports: [StoryousService],
})
export class StoryousModule {}









