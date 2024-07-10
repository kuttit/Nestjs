import { Module } from '@nestjs/common';
import { DfdService } from './dfd.service';
import { DfdController } from './dfd.controller';
import { RedisService } from 'src/redisService';

@Module({
  controllers: [DfdController],
  providers: [DfdService,RedisService],
})
export class DfdModule {}
