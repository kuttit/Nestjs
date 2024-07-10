import { Module } from '@nestjs/common';
import { DfErdService } from './df_erd.service';
import { DfErdController } from './df_erd.controller';
import { RedisService } from 'src/redisService';

@Module({
  controllers: [DfErdController],
  providers: [DfErdService,RedisService],
})
export class DfErdModule {}
