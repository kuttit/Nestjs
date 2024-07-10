import { Module } from '@nestjs/common';
import { CgTorusComponentsController } from './cg-torus-components.controller';
import { CgTorusComponentsService } from './cg-torus-components.service';
import { CG_CommonService } from '../cg-common/cg-common.service';
import { RedisService } from 'src/redisService';
import { JwtModule } from '@nestjs/jwt';
import { JwtServices } from 'src/jwt.services';

@Module({
  imports: [JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1d' },
  })],
  controllers: [CgTorusComponentsController],
  providers: [CgTorusComponentsService,CG_CommonService,RedisService,JwtServices],
})
export class CgTorusComponentsModule {}
