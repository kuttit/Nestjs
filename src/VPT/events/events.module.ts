import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { RedisService } from 'src/redisService';

@Module({
  providers: [EventsService, RedisService],
  controllers: [EventsController],
})
export class EventsModule {}
