import { Controller } from '@nestjs/common';
import {
  Body,
  Get,
  Param,
  Post,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';

import { UfdService } from './ufd.service';

@Controller('ufd')
export class UfdController {
  constructor(private readonly vptUfdService: UfdService) {}

  @Get()
  async getJson(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.vptUfdService.getJson(
      query.version,
      query.artifact,
      query.source,
      query.domain,
      query.fabrics,
    );
  }

  @Get('domainList')
  async getDomain(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.vptUfdService.getDomain(query.source);
  }

  @Get('fabricsList')
  async fabricsList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.vptUfdService.getFabrics(query.source, query.domain);
  }

  @Get('artifactList')
  async artifactList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.vptUfdService.getArtifact(
      query.source,
      query.domain,
      query.fabrics,
    );
  }

  @Get('versionList')
  async versionList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.vptUfdService.getVersion(
      query.source,
      query.domain,
      query.fabrics,
      query.artifact,
    );
  }

  @Post()
  async saveJson(
    @Body() req: any,
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.vptUfdService.saveaWorkFlow(
      req,
      query.type,
      query.version,
      query.source,
      query.domain,
      query.fabrics,
    );
  }
  // @Get('version-list')
  // async fabricVersionList(): Promise<any> {
  //   return await this.vptUfdService.getFabricVersionList();
  // }

  // @Get('version/:version')
  // async fabricVersion(
  //   @Param('version') version: any
  // ): Promise<any> {
  //   return await this.vptUfdService.getFabricVersion(version);
  // }

  // @Put('update-version')
  // async updateFabric(
  //   @Body() req: any,
  //   @Query(new ValidationPipe({ transform: true })) query: any,
  // ): Promise<any> {
  //   return await this.vptUfdService.updateFabric(req, query.version);
  // }

  // @Post('save-new-version')
  // async saveFabric(
  //   @Body() req: any,
  // ): Promise<any> {
  //   return await this.vptUfdService.saveFabric(req.key, req.value);
  // }
}
