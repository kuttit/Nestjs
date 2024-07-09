import { Module } from '@nestjs/common';
import { TG_CommonService } from './tg-common.service';
import { RedisService } from 'src/redisService';
import { CommonService } from 'src/commonService';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [TG_CommonService,RedisService,CommonService,JwtService],
  exports: [TG_CommonService],
})
export class TgCommonModule {}
