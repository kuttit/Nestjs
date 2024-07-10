import { Module } from '@nestjs/common';
import { CG_API_JestService } from './cg-api-jest.service';
import { CG_CommonService } from 'src/CG/cg-common/cg-common.service';
import { CG_API_JestController } from './cg-api-jest.controller';
import { RedisService } from 'src/redisService';

@Module({
  controllers: [CG_API_JestController],
  providers: [CG_API_JestService,CG_CommonService,RedisService]
})
export class CG_API_JestModule {}
