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

import { UfSldService } from './uf_sld.service';

@Controller('uf-sld')
export class UfSldController {
  constructor(private readonly ufSldService: UfSldService) {}

  @Get()
  async getJson(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.ufSldService.getJson(
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
    return await this.ufSldService.getAppGroup(query.tenant);
  }

  @Get('applicationList')
  async getApplicationList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.ufSldService.getApplication(query.tenant, query.appGroup);
  }

  @Get('fabricsList')
  async getFabricsList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    return await this.ufSldService.getFabrics(
      query.tenant,
      query.appGroup,
      query.applicationName,
    );
  }

  @Get('artifactList')
  async getArtifactList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    return await this.ufSldService.getArtifact(
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
    return await this.ufSldService.getVersion(
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
    return await this.ufSldService.getDefaultVersion();
  }

  @Post()
  async saveJson(
    @Body() req: any,
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.ufSldService.saveaWorkFlow(
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
    return this.ufSldService.deleteApplication(
      query.applicationName,
      query.tenant,
      query.appGroup,
      query.fabrics,
    );
  }
}
