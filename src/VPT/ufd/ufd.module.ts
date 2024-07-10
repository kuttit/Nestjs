import { Module } from '@nestjs/common';
import { UfdService } from './ufd.service';
import { UfdController } from './ufd.controller';
import { RedisService } from 'src/redisService';

@Module({
  controllers: [UfdController],
  providers: [UfdService,RedisService],
})
export class UfdModule {}
