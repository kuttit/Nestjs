import { Module } from '@nestjs/common';
import { TpService } from './tp.service';
import { TpController } from './tp.controller';
import { RedisService } from 'src/redisService';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [TpService , RedisService,JwtService
  ],
  controllers: [TpController,],
  
})
export class TpModule {}
