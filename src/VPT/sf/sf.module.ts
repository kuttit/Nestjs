import { Module } from '@nestjs/common';
import { SFService } from './sf.service';
import { SFController } from './sf.controller';
import { RedisService } from 'src/redisService';

@Module({
  controllers: [SFController],
  providers: [SFService,RedisService],
})
export class SFModule {}
