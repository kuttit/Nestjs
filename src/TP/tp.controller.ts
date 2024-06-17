import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { TpService } from './tp.service';

@Controller('tp')
export class TpController {
  constructor(private readonly tpservice: TpService) {}

  @Get('getTenantInfo')
  async getTenantInfo(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    const { tenant } = query;
    return await this.tpservice.getTenantProfile(tenant);
  }

  @Post('postTenantInfo')
  async postTenantInfo(
    @Body(new ValidationPipe({ transform: true })) body: any,
  ) {
    const { tenant, data } = body;
    return await this.tpservice.postTenantProfile(tenant, data);
  }

  @Get('getAppGroupInfo')
  async getAppGroupInfo(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    const { tenant, appGroup } = query;
    return await this.tpservice.getAppGroupInfo(tenant, appGroup);
  }

  @Post('postAppGroupInfo')
  async postAppGroupInfo(
    @Body(new ValidationPipe({ transform: true })) body: any,
  ) {
    const { tenant, appGroup, data } = body;
    return await this.tpservice.postAppGroupInfo(tenant, appGroup, data);
  }

  @Get('getAppInfo')
  async getAppInfo(@Query(new ValidationPipe({ transform: true })) query: any) {
    const { tenant, appGroup, app } = query;
    return await this.tpservice.getAppInfo(tenant, appGroup, app);
  }

  @Post('postAppInfo')
  async postAppInfo(@Body(new ValidationPipe({ transform: true })) body: any) {
    const { tenant, appGroup, app, data } = body;
    return await this.tpservice.postAppInfo(tenant, appGroup, app, data);
  }

  @Get('getappgrouplist')
  async getAppGroupList(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    const { tenant } = query;
    return this.tpservice.getAppGroupList(tenant);
  }

  @Get('getapplist')
  async getAppList(@Query(new ValidationPipe({ transform: true })) query: any) {
    const { tenant, appGroup } = query;
    return this.tpservice.getAppList(tenant, appGroup);
  }

  @Post('createTenant')
  async createTenant(
    @Body(new ValidationPipe({ transform: true })) body: any,
  ): Promise<any> {
    return await this.tpservice.createTenant(body);
  }

  @Post('createAppGroup')
  async createAppGroup(
    @Body(new ValidationPipe({ transform: true })) body: any,
  ): Promise<any> {
    const { appGroupObj, tenant } = body;
    return await this.tpservice.createAppGroup(appGroupObj, tenant);
  }

  @Delete('deleteAppGroup')
  async deleteAppGroup(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    const { appGroup, tenant } = query;
    return await this.tpservice.deleteAppGroup(appGroup, tenant);
  }

  @Post('createApp')
  async createApp(
    @Body(new ValidationPipe({ transform: true })) body: any,
  ): Promise<any> {
    const { appObj, tenant, group } = body;
    return await this.tpservice.createApp(appObj, tenant, group);
  }

  @Delete('deleteApplication')
  async deleteApplication(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ): Promise<any> {
    const { app, appGroup, tenant } = query;
    return await this.tpservice.deleteApplication(app, appGroup, tenant);
  }

  @Post('getAppEnvironment')
  async getAppEnvironment(
    @Body(new ValidationPipe({ transform: true })) body: any,
  ) {
    const { tenant, app } = body;
    return await this.tpservice.getAppEnvironment(tenant, app);
  }

  @Post('postAppEnvironment')
  async postAppEnvironment(
    @Body(new ValidationPipe({ transform: true })) body: any,
  ) {
    const { tenant, data } = body;
    return await this.tpservice.postAppEnvironment(
      tenant,
      data,
    );
  }

  @Post('postAppRequirement')
  async postAppRequirement(
    @Body(new ValidationPipe({ transform: true })) body: any,
  ): Promise<any> {
    const { tenant, appGroup, app, reqObj, date } = body;
    return await this.tpservice.postAppRequirement(
      tenant,
      appGroup,
      app,
      reqObj,
      date,
    );
  }

  @Post('getAppRequirement')
  async getAppRequirement(
    @Body(new ValidationPipe({ transform: true })) body: any,
  ) {
    const { tenant, appGroup, app } = body;
    return await this.tpservice.getAppRequirement(tenant, appGroup, app);
  }

  @Get('getAssemblerVersion')
  async getAssemblerVersion(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    const { key } = query;
    return await this.tpservice.getAssemblerVersion(key);
  }

  @Get('getAssemblerData')
  async getAssemblerData(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    const { key } = query;
    return await this.tpservice.getAssemblerData(key);
  }

  @Post('saveAssemblerData')
  async saveAssemblerData(
    @Body(new ValidationPipe({ transform: true })) body: any,
  ) {
    const { key, data } = body;
    return await this.tpservice.saveAssemblerData(key, data);
  }

  @Post('updateAssemblerData')
  async updateAssemblerData(
    @Body(new ValidationPipe({ transform: true })) body: any,
  ) {
    const { key, data } = body;
    return await this.tpservice.updateAssemblerData(key, data);
  }

  @Get('createTenantvpt')
  async createTenantIfnotAvailable(
    @Query(new ValidationPipe({ transform: true })) query: any,
  ) {
    const { tenant } = query;
    return await this.tpservice.createTenantIfnotAvailable(tenant);
  }

  @Get('getORPGroupData')
  async getORPData(@Query(new ValidationPipe({ transform: true })) query: any) {
    const { tenant, group } = query;
    return this.tpservice.getORPGroupData(tenant, group);
  }

  @Post('updateToken')
  async updateToken(@Body(new ValidationPipe({ transform: true })) body: any) {
    const { token, ORPData } = body;
    return this.tpservice.updateTokenWithORP(token, ORPData);
  }

  @Get('getSFArtifacts')
  async getSFArtifacts(@Query(new ValidationPipe({ transform: true })) query: any) {
    const {key} = query;
    return this.tpservice.getSFArtifacts(key);
  }

  @Get('getSFVersion')
  async getSFVersion(@Query(new ValidationPipe({ transform: true })) query: any) {
    const {key, artifacts} = query;
    return this.tpservice.getSFVersion(key, artifacts);
  }

  @Get('getSFData')
  async getSFData(@Query(new ValidationPipe({ transform: true })) query: any) {
    const {key, artifacts, version} = query;
    return this.tpservice.getSFData(key, artifacts, version);
  }

  @Post('postSFData')
  async postSFData(@Body(new ValidationPipe({ transform: true })) body: any) {
    const {key, artifacts, version, data} = body;
    return this.tpservice.postSFData(key, artifacts, version, data);
  }
}
