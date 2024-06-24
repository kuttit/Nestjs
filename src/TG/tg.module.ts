import { Module } from '@nestjs/common';
import { TgService } from './tg.service';
import { TgController } from './tg.controller';
import { TgCommonModule } from './tg-common/tg-common.module';
import { TG_API_JestModule } from './tg-api-jest/cg-api-jest.module';
import { TgErApiSecurityModule } from './tg-er-api-security/tg-er-api-security.module';
import { TgTorusComponentsModule } from './tg-torus-components/tg-torus-components.module';
import { TgSecurityCheckModule } from './tg-security-check/tg-security-check.module';
import { ConfigModule } from '@nestjs/config';
import { TgErApiSecurityService } from './tg-er-api-security/tg-er-api-security.service';
import { RedisService } from 'src/redisService';
import { TgTorusComponentsService } from './tg-torus-components/tg-torus-components.service';
import { JwtServices } from 'src/jwt.services';
import { JwtModule } from '@nestjs/jwt';
import { CommonService } from 'src/commonService';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    ConfigModule.forRoot({ envFilePath: `${process.env.NODE_ENV}.env` }),TgCommonModule,
    TG_API_JestModule,
    TgErApiSecurityModule,
    TgTorusComponentsModule,
    TgSecurityCheckModule],
  controllers: [TgController],
  providers: [TgService,TgErApiSecurityService,TgTorusComponentsService,RedisService,CommonService,JwtServices],
})
export class TgModule {}
