import { Module } from '@nestjs/common';
import { CgErApiSecurityService } from './cg-er-api-security.service';
import { CgErApiSecurityController } from './cg-er-api-security.controller';
import { RedisService } from 'src/redisService';
import { CG_CommonService } from 'src/CG/cg-common/cg-common.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtServices } from 'src/jwt.services';

@Module({
  imports: [JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1d' },
  })],
  controllers: [CgErApiSecurityController],
  providers: [CgErApiSecurityService,RedisService,CG_CommonService,JwtServices],
})
export class CgErApiSecurityModule {}
