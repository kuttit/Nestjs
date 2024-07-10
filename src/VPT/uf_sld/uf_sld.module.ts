import { Module } from '@nestjs/common';
import { UfSldService } from './uf_sld.service';
import { UfSldController } from './uf_sld.controller';
import { RedisService } from 'src/redisService';

@Module({
  controllers: [UfSldController],
  providers: [UfSldService,RedisService],
})
export class UfSldModule {}
