import { Module } from '@nestjs/common';
import { CgSecurityCheckController } from './tg-security-check.controller';
import { TgSecurityCheckService } from './tg-security-check.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtServices } from 'src/jwt.services';
import { RedisService } from 'src/redisService';
import { TG_CommonService } from '../tg-common/tg-common.service';
import { CommonService } from 'src/commonService';

@Module({
  imports: [JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1d' },
  })],
  controllers: [CgSecurityCheckController],
  providers: [TgSecurityCheckService,JwtServices,RedisService,TG_CommonService,CommonService]
})
export class TgSecurityCheckModule {}
