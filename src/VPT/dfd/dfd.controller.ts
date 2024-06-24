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
import { DfdService } from './dfd.service';

@Controller('dfd')
export class DfdController {
  constructor(private readonly VptErdService: DfdService) {}

  @Get()
  async getJson(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.VptErdService.getJson(
      query.version,
      query.artifact,
      query.source,
      query.domain,
      query.fabrics,
    );
  }

  @Get('versionList')
  async versionList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.VptErdService.getVersion(
      query.source,
      query.domain,
      query.fabrics,
      query.artifact,
    );
  }

  @Get('domainList')
  async getDomain(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.VptErdService.getDomain(query.source);
  }

  @Get('fabricsList')
  async fabricsList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.VptErdService.getFabrics(query.source, query.domain);
  }

  @Get('artifactList')
  async artifactList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.VptErdService.getArtifact(
      query.source,
      query.domain,
      query.fabrics,
    );
  }

  @Post()
  async saveJson(
    @Body() req: any,
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    return await this.VptErdService.saveaWorkFlow(
      req,
      query.type,
      query.version,
      query.source,
      query.domain,
      query.fabrics,
    );
  }
}
