import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { OrpsdfService } from './orps_df.service';

@Controller('orps_df')
export class OrpsdfController {
  constructor(private readonly orpsdfService: OrpsdfService) {}

  @Get()
  getOrpsdf(@Query(new ValidationPipe({ transform: true })) query: any) {
    return this.orpsdfService.getOrpsdf(
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
    return this.orpsdfService.getVersion(
      query.tenant,
      query.appGroup,
      query.app,
      query.fabrics,
      query.artifact,
      query.version,
      query.internalFabric,
    );
  }

  // @Get('wholeVersions')
  // wholeVersions(@Query(new ValidationPipe({ transform: true })) query: any) {
  //   return this.orpsdfService.getWholeVersion(
  //     query.tenant,
  //     query.appGroup,
  //     query.app,
  //     query.artifact,
  //     query.version,
  //   );
  // }

  // @Post('wholeVersion')
  // wholeVersion(
  //   @Body() body,
  //   @Query(new ValidationPipe({ transform: true })) query: any,
  // ) {
  //   return this.orpsdfService.eventsWholeVersion(
  //     query.tenant,
  //     query.appGroup,
  //     query.app,
  //     query.artifact,
  //     query.version,
  //   );
  // }

  @Post()
  saveCCW(
    @Body() body,
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    return this.orpsdfService.saveOrpsdf(
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
    return this.orpsdfService.deleteOrpsdf(
      query.tenant,
      query.appGroup,
      query.app,
      query.fabrics,
      query.artifact,
      query.version,
      query.internalFabric,
      query.internalFabricVersion,
    );
  }
}
