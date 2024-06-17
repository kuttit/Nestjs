import { Module } from '@nestjs/common';
import { EventsController } from './orps_pf.controller';
import { Orps_pfServices } from './orps_pf.service';
import { RedisService } from 'src/redisService';

@Module({
  providers: [Orps_pfServices, RedisService],
  controllers: [EventsController],
})
export class EventsModule {}
