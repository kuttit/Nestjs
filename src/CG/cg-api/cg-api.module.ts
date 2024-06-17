import { Module } from '@nestjs/common';
import { CG_APIController } from './cg-api.controller';
import { CG_APIService } from './cg-api.service';
import { CG_CommonService } from 'src/CG/cg-common/cg-common.service';
import { RedisService } from 'src/redisService';

@Module({

  controllers: [CG_APIController],
  providers: [CG_APIService,CG_CommonService,RedisService]
})
export class CG_APIModule {}
