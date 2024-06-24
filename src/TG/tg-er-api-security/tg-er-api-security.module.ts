import { Module } from '@nestjs/common';
import { TgErApiSecurityService } from './tg-er-api-security.service';
import { TgErApiSecurityController } from './tg-er-api-security.controller';
import { RedisService } from 'src/redisService';
import { TG_CommonService } from 'src/TG/tg-common/tg-common.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtServices } from 'src/jwt.services';

@Module({
  imports: [JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1d' },
  })],
  controllers: [TgErApiSecurityController],
  providers: [TgErApiSecurityService,RedisService,TG_CommonService,JwtServices],
})
export class TgErApiSecurityModule {}
