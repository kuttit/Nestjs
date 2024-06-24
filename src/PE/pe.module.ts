import { MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PeController } from './pe.controller';
import { RedisService } from 'src/redisService';
import { DebugService } from './debugService';
import { NodeExecutionService } from './nodeExecService';
import { AuthMiddleware } from './Middleware/auth.middleware';
import { PeCommonService } from './peCommonService';
import { SavehandlerService } from './savehandlerService';
import { LogController } from './log.controller';
import { PeService } from './pe.service';
import { CommonService } from 'src/commonService';
import { JwtService } from '@nestjs/jwt';


@Module({
  imports: [HttpModule],
  controllers: [PeController,LogController],
  providers: [RedisService,CommonService, DebugService,NodeExecutionService, PeCommonService, PeService,SavehandlerService,JwtService],
})

export class PeModule implements NestModule 
{
  configure(consumer: MiddlewareConsumer) {
    //consumer.apply(AuthMiddleware).forRoutes('pe');
    consumer.apply(AuthMiddleware).forRoutes({path:'pe/peStream',method:RequestMethod.POST });
  }  
}

