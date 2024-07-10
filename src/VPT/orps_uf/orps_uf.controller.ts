import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { Orps_ufService } from './orps_uf.service';

@Controller('orps_uf')
export class Orps_ufController {
  constructor(private readonly orpsufService: Orps_ufService) {}

  @Get()
  getCCW(@Query(new ValidationPipe({ transform: true })) query: any) {
    return this.orpsufService.getOrpsuf(
      query.tenant,
      query.appGroup,
      query.app,
      query.fabrics,
      query.artifact,
      query.version,
      query.internalFabric,

      query.intenalFabricsVersion,
    );
  }

  @Get('version')
  getVersion(@Query(new ValidationPipe({ transform: true })) query: any) {
    return this.orpsufService.getVersion(
      query.tenant,
      query.appGroup,
      query.app,
      query.fabrics,
      query.artifact,
      query.version,
      query.internalFabric,
    );
  }

  @Post()
  saveCCW(
    @Body() body,
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    return this.orpsufService.saveOrpsuf(
      query.tenant,
      query.appGroup,
      query.app,
      query.fabrics,
      query.artifact,
      query.version,
      query.internalFabric,
      query.internalFabricVersion,
      body,
    );
  }

  @Delete()
  deleteCCW(@Query(new ValidationPipe({ transform: true })) query: any) {
    return this.orpsufService.deleteOrpsUf(
      query.tenant,
      query.appGroup,
      query.app,
      query.fabrics,
      query.artifact,
      query.internalFabric,
      query.internalFabricVersion,
    );
  }
}
