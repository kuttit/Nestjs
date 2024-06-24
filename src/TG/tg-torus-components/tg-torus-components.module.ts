import { Module } from '@nestjs/common';
import { TgTorusComponentsController } from './tg-torus-components.controller';
import { TgTorusComponentsService } from './tg-torus-components.service';
import { TG_CommonService } from '../tg-common/tg-common.service';
import { RedisService } from 'src/redisService';
import { JwtModule } from '@nestjs/jwt';
import { JwtServices } from 'src/jwt.services';

@Module({
  imports: [JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1d' },
  })],
  controllers: [TgTorusComponentsController],
  providers: [TgTorusComponentsService,TG_CommonService,RedisService,JwtServices],
})
export class TgTorusComponentsModule {}
