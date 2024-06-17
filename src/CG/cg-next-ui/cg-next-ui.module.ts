import { Module } from '@nestjs/common';
import { CG_NextUiService } from './cg-next-ui.service';
import { CG_NextUiController } from './cg-next-ui.controller';
import { CG_CommonService } from 'src/CG/cg-common/cg-common.service';
import { RedisService } from 'src/redisService';

@Module({
  controllers: [CG_NextUiController],
  providers: [CG_NextUiService,CG_CommonService,RedisService],
})
export class CG_NextUiModule {}
