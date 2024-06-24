import { Module } from '@nestjs/common';
import { TG_CommonService } from './tg-common.service';
import { RedisService } from 'src/redisService';

@Module({
  providers: [TG_CommonService,RedisService],
  exports: [TG_CommonService],
})
export class TgCommonModule {}
