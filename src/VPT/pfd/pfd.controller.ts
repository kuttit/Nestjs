import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { PfdService } from './pfd.service';

@Controller('pfd')
export class PfdController {
  constructor(private readonly vptPfdService: PfdService) {}

  @Get()
  async getJson(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.vptPfdService.getJson(
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
    return await this.vptPfdService.getDomain(query.source);
  }

  @Get('fabricsList')
  async fabricsList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.vptPfdService.getFabrics(query.source, query.domain);
  }

  @Get('artifactList')
  async artifactList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.vptPfdService.getArtifact(
      query.source,
      query.domain,
      query.fabrics,
    );
  }
  @Get('versionList')
  async versionList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.vptPfdService.getVersion(
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
    return await this.vptPfdService.saveaWorkFlow(
      req,
      query.type,
      query.version,
      query.source,
      query.domain,
      query.fabrics,
    );
  }
}
