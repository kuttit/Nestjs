import { Module } from '@nestjs/common';
import { PfdService } from './pfd.service';
import { PfdController } from './pfd.controller';
import { RedisService } from 'src/redisService';

@Module({
  controllers: [PfdController],
  providers: [PfdService, RedisService ],
  exports: [PfdService],
})
export class PfdModule {}
