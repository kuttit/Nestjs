import { Module } from '@nestjs/common';
import { TgService } from './tg.service';
import { TgController } from './tg.controller';
import { TgCommonModule } from './tg-common/tg-common.module';
import { TG_API_JestModule } from './tg-api-jest/cg-api-jest.module';
import { TgErApiSecurityModule } from './tg-df/tg-df.module';
import { TgUfModule } from './tg-uf/tg-uf.module';
import { TgSecurityCheckModule } from './tg-security-check/tg-security-check.module';
import { ConfigModule } from '@nestjs/config';
import { TgDfService } from './tg-df/tg-df.service';
import { RedisService } from 'src/redisService';
import { TgUfService } from './tg-uf/tg-uf.service';
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
    TgUfModule,
    TgSecurityCheckModule],
  controllers: [TgController],
  providers: [TgService,TgDfService,TgUfService,RedisService,CommonService,JwtServices],
})
export class TgModule {}
