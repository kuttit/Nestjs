import { Module } from '@nestjs/common';
import { CgService } from './cg.service';
import { CgController } from './cg.controller';
import { CgCommonModule } from './cg-common/cg-common.module';
import { CG_APIModule } from './cg-api/cg-api.module';
import { CG_N8n } from './cg-n8n/cg-n8n.module';
import { CG_NextUiModule } from './cg-next-ui/cg-next-ui.module';
import { CG_API_JestModule } from './cg-api-jest/cg-api-jest.module';
import { CgErApiSecurityModule } from './cg-er-api-security/cg-er-api-security.module';
import { CgTorusComponentsModule } from './cg-torus-components/cg-torus-components.module';
import { CgSecurityCheckModule } from './cg-security-check/cg-security-check.module';
import { ConfigModule } from '@nestjs/config';
import { CgErApiSecurityService } from './cg-er-api-security/cg-er-api-security.service';
import { RedisService } from 'src/redisService';
import { CgTorusComponentsService } from './cg-torus-components/cg-torus-components.service';
import { JwtServices } from 'src/jwt.services';
import { JwtModule } from '@nestjs/jwt';
import { CommonService } from 'src/commonService';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    ConfigModule.forRoot({ envFilePath: `${process.env.NODE_ENV}.env` }),CgCommonModule,
    CG_APIModule,
    CG_N8n,
    CG_NextUiModule,
    CG_API_JestModule,
    CgErApiSecurityModule,
    CgTorusComponentsModule,
    CgSecurityCheckModule],
  controllers: [CgController],
  providers: [CgService,CgErApiSecurityService,CgTorusComponentsService,RedisService,CommonService,JwtServices],
})
export class CgModule {}
