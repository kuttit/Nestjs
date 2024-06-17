import { DfErdService } from './df_erd.service';
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ValidationPipe,
  Delete,
  Inject,
} from '@nestjs/common';

@Controller('df-erd')
export class DfErdController {
  constructor(private readonly dfErdService: DfErdService) {}
  getHello(): string {
    return 'Hello World!';
  }

  @Get()
  async getJson(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.dfErdService.getJson(
      query.applicationName,
      query.version,
      query.artifact,
      query.tenant,
      query.appGroup,
      query.fabrics,
    );
  }

  @Get('appGroupList')
  async getAppGroupList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.dfErdService.getAppGroup(query.tenant);
  }

  @Get('applicationList')
  async getApplicationList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.dfErdService.getApplication(query.tenant, query.appGroup);
  }

  @Get('fabricsList')
  async getFabricsList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    return await this.dfErdService.getFabrics(
      query.tenant,
      query.appGroup,
      query.applicationName,
    );
  }

  @Get('artifactList')
  async getArtifactList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    return await this.dfErdService.getArtifact(
      query.tenant,
      query.appGroup,
      query.fabrics,
      query.applicationName,
    );
  }

  @Get('versionList')
  async getVersionList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    return await this.dfErdService.getVersion(
      query.tenant,
      query.appGroup,
      query.fabrics,
      query.applicationName,
      query.artifact,
    );
  }

  // @Get('applicationName')
  // async getApplicationName(
  //   @Query(new ValidationPipe({ transform: true })) query: any,
  // ): Promise<any> {
  //   return await this.dfErdService.getApplicationList(
  //     query.tenant,
  //     query.appGroup,
  //     query.fabrics,
  //   );
  // }

  // @Get('flowName')
  // async getFlowName(
  //   @Query(new ValidationPipe({ transform: true })) query: any,
  // ): Promise<any> {
  //   return await this.dfErdService.getFlowList(
  //     query.tenant,
  //     query.appGroup,
  //     query.fabrics,
  //     query.applicationName,
  //   );
  // }

  @Post()
  async saveJson(
    @Body() req: any,
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.dfErdService.saveaWorkFlow(
      req,
      query.type,
      query.version,
      query.tenant,
      query.appGroup,
      query.fabrics,
    );
  }

  // @Get('/sync')
  // async syncToFolder(
  //   @Query(new ValidationPipe({ transform: true })) query: any,
  // ) {
  //   return this.dfErdService.syncToFolder(query.tenant);
  // }

  @Delete('/deleteApplication')
  async deleteApplication(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return this.dfErdService.deleteApplication(
      query.applicationName,
      query.tenant,
      query.appGroup,
      query.fabrics,
    );
  }

  @Get('applicationDetails')
  async applicationDetails() {
    return this.dfErdService.applicationDetails();
  }

  @Get('/tenantDetails')
  async tenantDetails() {
    return this.dfErdService.tenantDetails();
  }

  @Get('/controlpolicy')
  async controlpolicy(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return this.dfErdService.controlpolicy(query.nodeType);
  }

  @Get('defaultVersion')
  async getdefaultversion(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.dfErdService.getDefaultVersion();
  }

  @Get('/userRole')
  async userRole(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return this.dfErdService.getUserRoleDetails(query.roleId);
  }

  // @Get('/redis')
  // async redisCheck(): Promise<any> {
  //   return await this.cacheManager.set('torus', {
  //     tenant: {
  //       application1: {
  //         pfflow: {
  //           v1: {
  //             data: '100',
  //           },
  //           v2: {
  //             data: '200',
  //           },
  //         },
  //       },
  //       application2: {
  //         pfflow: {
  //           v1: {
  //             data: '100',
  //           },
  //           v2: {
  //             data: '200',
  //           },
  //         },
  //       },
  //     },
  //   });
  //   // await this.cacheManager.get('sname')
  // }

  // @Get('/getredis')
  // async getredis(
  //   @Query(new ValidationPipe({ transform: true })) query: any,
  // ): Promise<any> {
  //   return await this.dfErdService.getRedis(query.tenant);
  // }
}
