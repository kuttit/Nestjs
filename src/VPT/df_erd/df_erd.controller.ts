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

  @Get('defaultVersion')
  async getdefaultversion(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.dfErdService.getDefaultVersion();
  }
}
