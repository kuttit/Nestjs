import { Module } from '@nestjs/common';
import { TpService } from './tp.service';
import { TpController } from './tp.controller';
import { RedisService } from 'src/redisService';
import { JwtService } from '@nestjs/jwt';
import { CommonService } from 'src/commonService';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TpService, RedisService, JwtService, CommonService, AuthService],
  controllers: [TpController, AuthController],
})
export class TpModule {}
