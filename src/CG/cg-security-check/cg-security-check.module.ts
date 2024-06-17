import { Module } from '@nestjs/common';
import { CgSecurityCheckController } from './cg-security-check.controller';
import { CgSecurityCheckService } from './cg-security-check.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtServices } from 'src/jwt.services';
import { RedisService } from 'src/redisService';
import { CG_CommonService } from '../cg-common/cg-common.service';
import { CommonService } from 'src/commonService';

@Module({
  imports: [JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1d' },
  })],
  controllers: [CgSecurityCheckController],
  providers: [CgSecurityCheckService,JwtServices,RedisService,CG_CommonService,CommonService]
})
export class CgSecurityCheckModule {}
