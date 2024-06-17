import { Module } from '@nestjs/common';
import { OrpsdfController } from './orps_df.controller';
import { OrpsdfService } from './orps_df.service';
import { RedisService } from 'src/redisService';

@Module({
  providers: [OrpsdfService, RedisService],
  controllers: [OrpsdfController],
})
export class OrpsdfModule {}
