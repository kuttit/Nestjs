import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  getCCW(@Query(new ValidationPipe({ transform: true })) query: any) {
    return this.eventsService.getEvents(
      query.tenant,
      query.appGroup,
      query.app,
      query.fabrics,
      query.artifact,
      query.version,
      query.componentName,
      query.controlName,
      query.ccwVersion,
    );
  }

  @Get('version')
  getVersion(@Query(new ValidationPipe({ transform: true })) query: any) {
    return this.eventsService.getVersion(
      query.tenant,
      query.appGroup,
      query.app,
      query.fabrics,
      query.artifact,
      query.version,
      query.componentName,
      query.controlName,
    );
  }

  // @Get('wholeVersions')
  // wholeVersions(@Query(new ValidationPipe({ transform: true })) query: any) {
  //   return this.eventsService.getWholeVersion(
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
  //   return this.eventsService.eventsWholeVersion(
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
    return this.eventsService.saveEvents(
      query.tenant,
      query.appGroup,
      query.app,
      query.fabrics,
      query.artifact,
      query.version,
      query.componentName,
      query.controlName,
      query.ccwVersion,
      body,
    );
  }

  @Delete()
  deleteCCW(@Query(new ValidationPipe({ transform: true })) query: any) {
    return this.eventsService.deleteEventVersion(
      query.tenant,
      query.appGroup,
      query.app,
      query.fabrics,
      query.artifact,
      query.version,
      query.ccwVersion,
    );
  }
}
