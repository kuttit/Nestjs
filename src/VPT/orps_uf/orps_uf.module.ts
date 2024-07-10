import { Module } from '@nestjs/common';
import { Orps_ufController } from './orps_uf.controller';
import { Orps_ufService } from './orps_uf.service';
import { RedisService } from 'src/redisService';

@Module({
  providers: [Orps_ufService, RedisService],
  controllers: [Orps_ufController],
})
export class EventsModule {}
