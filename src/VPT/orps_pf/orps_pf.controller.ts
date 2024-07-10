import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { Orps_pfServices } from './orps_pf.service';

@Controller('orps_pf')
export class EventsController {
  constructor(private readonly orpspfServices: Orps_pfServices) {}

  @Get()
  getCCW(@Query(new ValidationPipe({ transform: true })) query: any) {
    return this.orpspfServices.getOrpspf(
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
    return this.orpspfServices.getVersion(
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
  //   return this.orpspfServices.getWholeVersion(
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
  //   return this.orpspfServices.eventsWholeVersion(
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
    return this.orpspfServices.saveOrpspf(
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
    return this.orpspfServices.deleteOrpspf(
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
