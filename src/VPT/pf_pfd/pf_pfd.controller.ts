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
import { PfPfdService } from './pf_pfd.service';

@Controller('pf-pfd')
export class PfPfdController {
  constructor(private readonly pfPfdService: PfPfdService) {}

  getHello(): string {
    return 'Hello World!';
  }

  @Get()
  async getJson(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.pfPfdService.getJson(
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
    return await this.pfPfdService.getAppGroup(query.tenant);
  }

  @Get('applicationList')
  async getApplicationList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.pfPfdService.getApplication(query.tenant, query.appGroup);
  }

  @Get('fabricsList')
  async getFabricsList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    return await this.pfPfdService.getFabrics(
      query.tenant,
      query.appGroup,
      query.applicationName,
    );
  }

  @Get('artifactList')
  async getArtifactList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    return await this.pfPfdService.getArtifact(
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
    return await this.pfPfdService.getVersion(
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
    return await this.pfPfdService.saveaWorkFlow(
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
    return this.pfPfdService.deleteApplication(
      query.applicationName,
      query.tenant,
      query.appGroup,
      query.fabrics,
    );
  }
}
