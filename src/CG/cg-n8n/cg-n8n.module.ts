import { Module } from '@nestjs/common';
import { CG_N8nController } from './cg-n8n.controller';
import { CG_N8nService } from './cg-n8n.service';
import { CG_CommonService } from 'src/CG/cg-common/cg-common.service';
import { RedisService } from 'src/redisService';

@Module({
  controllers: [CG_N8nController],
  providers: [CG_N8nService,CG_CommonService,RedisService],
})
export class CG_N8n {}
