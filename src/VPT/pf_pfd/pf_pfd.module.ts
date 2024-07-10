import { Module } from '@nestjs/common';
import { PfPfdService } from './pf_pfd.service';
import { PfPfdController } from './pf_pfd.controller';
import { RedisService } from 'src/redisService';

@Module({
  controllers: [PfPfdController],
  providers: [PfPfdService,RedisService],
})
export class PfPfdModule {}
