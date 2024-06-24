import { Module } from '@nestjs/common';
import { TpService } from './tp.service';
import { TpController } from './tp.controller';
import { RedisService } from 'src/redisService';
import { JwtService } from '@nestjs/jwt';
import { CommonService } from 'src/commonService';

@Module({
  providers: [TpService, RedisService, JwtService, CommonService],
  controllers: [TpController],
})
export class TpModule {}
