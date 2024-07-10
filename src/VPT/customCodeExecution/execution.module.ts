import { Module } from '@nestjs/common';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';

import { HttpModule, HttpService } from '@nestjs/axios';
import { RedisService } from 'src/redisService';

@Module({
  imports: [HttpModule],
  controllers: [ExecutionController],
  providers: [ExecutionService,RedisService],
})
export class ExecutionModule {}
