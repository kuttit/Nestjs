import { Module } from '@nestjs/common';
import { TgUfController } from './tg-uf.controller';
import { TgUfService } from './tg-uf.service';
import { TG_CommonService } from '../tg-common/tg-common.service';
import { RedisService } from 'src/redisService';
import { JwtModule } from '@nestjs/jwt';
import { JwtServices } from 'src/jwt.services';
import { CommonService } from 'src/commonService';

@Module({
  imports: [JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1d' },
  })],
  controllers: [TgUfController],
  providers: [TgUfService,TG_CommonService,RedisService,JwtServices,CommonService],
})
export class TgUfModule {}
