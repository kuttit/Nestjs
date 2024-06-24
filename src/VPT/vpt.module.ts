import { Module } from '@nestjs/common';

import { RedisService } from 'src/redisService';
import { VptService } from './vpt.service';
import { VptController } from './vpt.controller';
import { UfSldModule } from './uf_sld/uf_sld.module';
import { UfdModule } from './ufd/ufd.module';
import { PfPfdModule } from './pf_pfd/pf_pfd.module';
import { PfdModule } from './pfd/pfd.module';
import { DfErdModule } from './df_erd/df_erd.module';
import { DfdModule } from './dfd/dfd.module';
import { PfdService } from './pfd/pfd.service';
import { EventsModule } from './events/events.module';
import { HttpModule } from '@nestjs/axios';
import { ExecutionModule } from './customCodeExecution/execution.module';
import { SFModule } from './sf/sf.module';
import { PfPfdService } from './pf_pfd/pf_pfd.service';

@Module({
  imports: [
    UfSldModule,
    UfdModule,
    PfPfdModule,
    PfdModule,
    DfErdModule,
    DfdModule,
    SFModule,
    EventsModule,
    HttpModule,
    ExecutionModule,
  ],
  controllers: [VptController],
  providers: [VptService, RedisService, PfdService,PfPfdService],
})
export class VptModule {}
