import { Module } from '@nestjs/common';
import { TG_API_JestService } from './tg-api-jest.service';
import { TG_CommonService } from 'src/TG/tg-common/tg-common.service';
import { TG_API_JestController } from './tg-api-jest.controller';
import { RedisService } from 'src/redisService';
import { CommonService } from 'src/commonService';
import {  JwtService } from '@nestjs/jwt';

@Module({
  controllers: [TG_API_JestController],
  providers: [TG_API_JestService,TG_CommonService,RedisService,CommonService,JwtService]
})
export class TG_API_JestModule {}
