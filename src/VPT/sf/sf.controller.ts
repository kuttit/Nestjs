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

  @Get('defaultVersion')
  async getdefaultversion(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.sfService.getDefaultVersion();
  }

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
}
