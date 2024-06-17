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
  
  import { SFService } from './sf.service';
  
  @Controller('sf')
  export class SFController {
    constructor(private readonly sfService: SFService) {}
  
    @Get()
    async getJson(
      @Query(new ValidationPipe({ transform: true })) query: any,
    ): Promise<any> {
      return await this.sfService.getJson(
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
      return await this.sfService.getAppGroup(query.tenant);
    }
  
    @Get('applicationList')
    async getApplicationList(
      @Query(new ValidationPipe({ transform: true })) query: any,
    ): Promise<any> {
      return await this.sfService.getApplication(query.tenant, query.appGroup);
    }
  
    @Get('fabricsList')
    async getFabricsList(
      @Query(new ValidationPipe({ transform: true })) query: any,
    ) {
      return await this.sfService.getFabrics(
        query.tenant,
        query.appGroup,
        query.applicationName,
      );
    }
  
    @Get('artifactList')
    async getArtifactList(
      @Query(new ValidationPipe({ transform: true })) query: any,
    ) {
      return await this.sfService.getArtifact(
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
      return await this.sfService.getVersion(
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
    //   return await this.sfService.getApplicationList(
    //     query.tenant,
    //     query.appGroup,
    //     query.fabrics,
    //   );
    // }
  
    @Get('propertyWindow')
    async propertyWindow(
      @Query(new ValidationPipe({ transform: true })) query: any,
    ): Promise<any> {
      return this.sfService.getpropertywindow(query.node);
    }
  
    // @Get('flowName')
    // async getFlowName(
    //   @Query(new ValidationPipe({ transform: true })) query: any,
    // ): Promise<any> {
    //   return await this.sfService.getFlowList(
    //     query.tenant,
    //     query.appGroup,
    //     query.fabrics,
    //     query.applicationName,
    //   );
    // }
  
    @Get('defaultVersion')
    async getdefaultversion(
      @Query(new ValidationPipe({ transform: true })) query: any,
    ): Promise<any> {
      return await this.sfService.getDefaultVersion();
    }
  
    // @Get('fabricsList')
    // async fabricsList(
    //   @Query(new ValidationPipe({ transform: true })) query: any,
    // ): Promise<any> {
    //   return await this.sfService.getFabrics(
    //     query.tenant,
    //     query.appGroup,
  
    //   );
    // }
    @Post()
    async saveJson(
      @Body() req: any,
      @Query(new ValidationPipe({ transform: true })) query: any,
    ): Promise<any> {
      return await this.sfService.saveaWorkFlow(
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
    //   return this.sfService.syncToFolder(query.tenant);
    // }
  
    @Delete('/deleteApplication')
    async deleteApplication(
      @Query(new ValidationPipe({ transform: true })) query: any,
    ): Promise<any> {
      return this.sfService.deleteApplication(
        query.applicationName,
        query.tenant,
        query.appGroup,
        query.fabrics,
      );
    }
  
    @Get('applicationDetails')
    async applicationDetails() {
      return this.sfService.applicationDetails();
    }
  
    @Get('/tenantDetails')
    async tenantDetails() {
      return this.sfService.tenantDetails();
    }
  
    @Get('/controlpolicy')
    async controlpolicy(
      @Query(new ValidationPipe({ transform: true })) query: any,
    ): Promise<any> {
      return this.sfService.controlpolicy(query.nodeType);
    }
  
    @Get('/userRole')
    async userRole(
      @Query(new ValidationPipe({ transform: true })) query: any,
    ): Promise<any> {
      return this.sfService.getUserRoleDetails(query.roleId);
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
    //   return await this.sfService.getRedis(query.tenant);
    // }
  }
  