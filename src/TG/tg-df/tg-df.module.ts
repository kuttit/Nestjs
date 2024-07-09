import { Module } from '@nestjs/common';
import { TgDfService } from './tg-df.service';
import { TgDfController } from './tg-df.controller';
import { RedisService } from 'src/redisService';
import { TG_CommonService } from 'src/TG/tg-common/tg-common.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtServices } from 'src/jwt.services';
import { CommonService } from 'src/commonService';

@Module({
  imports: [JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1d' },
  })],
  controllers: [TgDfController],
  providers: [TgDfService,RedisService,TG_CommonService,JwtServices,CommonService],
})
export class TgErApiSecurityModule {}
