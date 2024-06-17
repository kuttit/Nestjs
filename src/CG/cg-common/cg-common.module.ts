import { Module } from '@nestjs/common';
import { CG_CommonService } from './cg-common.service';
import { RedisService } from 'src/redisService';

@Module({
  providers: [CG_CommonService,RedisService],
  exports: [CG_CommonService],
})
export class CgCommonModule {}
