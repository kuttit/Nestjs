import { MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TeController } from './te.controller';
import { RedisService } from 'src/redisService';
import { DebugService } from './debugService';
import { NodeExecutionService } from './nodeExecService';
import { AuthMiddleware } from './Middleware/auth.middleware';
import { TeCommonService } from './teCommonService';
import { SavehandlerService } from './savehandlerService';
import { LogController } from './log.controller';
import { TeService } from './te.service';
import { CommonService } from 'src/commonService';
import { JwtService } from '@nestjs/jwt';
import { GoRuleEngine } from 'src/gorule';
import { BullModule } from '@nestjs/bull';
import { QueueConsumer } from './queueConsumer';


@Module({
  imports: [HttpModule,BullModule.forRootAsync({
    useFactory: () => ({
    redis:{
      host: '192.168.2.165',
      port: 8086,
    }
  })
  }
  ),  
  BullModule.registerQueueAsync({
    name: 'pfPaymentProcess'
  })],
  controllers: [TeController,LogController],
  providers: [RedisService,CommonService, DebugService,NodeExecutionService, TeCommonService, TeService,SavehandlerService,JwtService,GoRuleEngine,QueueConsumer,TeService],
})

export class TeModule implements NestModule 
{
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('pe');    
  }  
}

