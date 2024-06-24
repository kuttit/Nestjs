import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisService } from './redisService';
import { PeModule } from './PE/pe.module';
import { UfdModule } from './VPT/ufd/ufd.module';
import { UfSldModule } from './VPT/uf_sld/uf_sld.module';
import { PfdModule } from './VPT/pfd/pfd.module';
import { PfPfdModule } from './VPT/pf_pfd/pf_pfd.module';
import { DfdModule } from './VPT/dfd/dfd.module';
import { DfErdModule } from './VPT/df_erd/df_erd.module';

import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { HttpExceptionFilter } from './TG/ExceptionFilter/exception.filter';
import { LoggerMiddleware } from './TG/Middleware/middleware';
import { keycloakModule } from './VPT/keyCloak/keycloak.module';
import { VptModule } from './VPT/vpt.module';
import { TgModule } from './TG/tg.module';
import { UploadController } from './fileUpload/upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FILE_UPLOADS_DIR } from './fileUpload/constants';
import { TpModule } from './TP/tp.module';


@Module({
  imports: [
    PeModule,
    ConfigModule.forRoot({ envFilePath: `${process.env.NODE_ENV}.env` }),
    TgModule,
    // UfdModule,
    // UfSldModule,
    // PfdModule,
    // PfPfdModule,
    // DfdModule,
    // DfErdModule,
    keycloakModule,
    VptModule,
    ServeStaticModule.forRoot({
      serveRoot: '/uploads', // The URL path where the static files will be served
      rootPath: join(__dirname, '..', 'uploads'), // Path to your image folder
    }),
    MulterModule.register({
      dest: FILE_UPLOADS_DIR,
      limits: {
        fileSize: 1000 * 1000 * 10,
      },
    }),

    TpModule,
  ],
  controllers: [AppController, UploadController],
  providers: [
    AppService,
    RedisService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_PIPE, useClass: ValidationPipe },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
