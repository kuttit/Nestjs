import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpStatus,
  Post,
  Query,
  Req,
  ValidationPipe,
} from "@nestjs/common";
import { TpService } from "./tp.service";
import { CustomException } from "./customException";
import { CommonService } from "src/commonService";

@Controller("tp")
export class TpController {
  constructor(
    private readonly tpservice: TpService,
    private readonly commonservice: CommonService
  ) {}

  @Get("getTenantInfo")
  async getTenantInfo(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const { tenant } = query;
    return await this.tpservice.getTenantProfile(tenant);
  }

  @Post("postTenantInfo")
  async postTenantInfo(
    @Body(new ValidationPipe({ transform: true })) body: any
  ) {
    const { tenant, data } = body;
    return await this.tpservice.postTenantProfile(tenant, data);
  }

  @Get("getappgrouplist")
  async getAppGroupList(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const { tenant } = query;
    return this.tpservice.getAppGroupList(tenant);
  }

  @Get("getapplist")
  async getAppList(@Query(new ValidationPipe({ transform: true })) query: any) {
    const { tenant, appGroup } = query;
    return this.tpservice.getAppList(tenant, appGroup);
  }

  @Delete("deleteAppGroup")
  async deleteAppGroup(
    @Query(new ValidationPipe({ transform: true })) query: any
  ): Promise<any> {
    const { appGroup, tenant } = query;
    return await this.tpservice.deleteAppGroup(appGroup, tenant);
  }

  @Post("getAppEnvironment")
  async getAppEnvironment(
    @Body(new ValidationPipe({ transform: true })) body: any
  ) {
    const { tenant, app } = body;
    return await this.tpservice.getAppEnvironment(tenant, app);
  }

  @Post("postAppEnvironment")
  async postAppEnvironment(
    @Body(new ValidationPipe({ transform: true })) body: any
  ) {
    const { tenant, data } = body;
    return await this.tpservice.postAppEnvironment(tenant, data);
  }

  @Post("postAppRequirement")
  async postAppRequirement(
    @Body(new ValidationPipe({ transform: true })) body: any
  ): Promise<any> {
    const { tenant, appGroup, app, reqObj, date } = body;
    return await this.tpservice.postAppRequirement(
      tenant,
      appGroup,
      app,
      reqObj,
      date
    );
  }

  @Post("getAppRequirement")
  async getAppRequirement(
    @Body(new ValidationPipe({ transform: true })) body: any
  ) {
    const { tenant, appGroup, app } = body;
    return await this.tpservice.getAppRequirement(tenant, appGroup, app);
  }

  @Get("getAssemblerVersion")
  async getAssemblerVersion(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const { key } = query;
    return await this.tpservice.getAssemblerVersion(key);
  }

  @Get("getAssemblerData")
  async getAssemblerData(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const { key } = query;
    return await this.tpservice.getAssemblerData(key);
  }

  @Post("saveAssemblerData")
  async saveAssemblerData(
    @Body(new ValidationPipe({ transform: true })) body: any
  ) {
    const { key, data } = body;
    return await this.tpservice.saveAssemblerData(key, data);
  }

  @Post("updateAssemblerData")
  async updateAssemblerData(
    @Body(new ValidationPipe({ transform: true })) body: any
  ) {
    const { key, data } = body;
    return await this.tpservice.updateAssemblerData(key, data);
  }

  @Get("getORPGroupData")
  async getORPData(@Query(new ValidationPipe({ transform: true })) query: any) {
    const { tenant, group } = query;
    return this.tpservice.getORPGroupData(tenant, group);
  }

  @Post("updateToken")
  async updateToken(@Body(new ValidationPipe({ transform: true })) body: any) {
    const { token, ORPData } = body;
    return this.tpservice.updateTokenWithORP(token, ORPData);
  }

  @Get("getSFArtifacts")
  async getSFArtifacts(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const { key } = query;
    return this.tpservice.getSFArtifacts(key);
  }

  @Get("getSFVersion")
  async getSFVersion(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const { key, artifacts } = query;
    return this.tpservice.getSFVersion(key, artifacts);
  }

  @Get("getSFData")
  async getSFData(@Query(new ValidationPipe({ transform: true })) query: any) {
    const { key, artifacts, version } = query;
    return this.tpservice.getSFData(key, artifacts, version);
  }

  @Post("postSFData")
  async postSFData(@Body(new ValidationPipe({ transform: true })) body: any) {
    const { key, artifacts, version, data } = body;
    return this.tpservice.postSFData(key, artifacts, version, data);
  }

  @Get("checkUser")
  async checkUser(@Req() req: Request) {
    const { authorization }: any = req.headers;
    if (authorization) {
      const token = authorization.split(" ")[1];
      return this.tpservice.checkUser(token);
    } else {
      return new CustomException("Token not found", HttpStatus.UNAUTHORIZED);
    }
  }

  @Get("getOrgGrpFromTSf")
  async gettsforganisation() {
    return this.tpservice.getorggrp();
  }

  @Get("getOrgFromTSF")
  async getorgFromTSF(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const { orgGrpCode } = query;
    return this.tpservice.getorgFromTSF(orgGrpCode);
  }

  @Get("getRGfromTSF")
  async getRGFromTSF(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const { orgGrpCode, orgCode } = query;
    return this.tpservice.getRGFromTSF(orgGrpCode, orgCode);
  }

  @Get("getRoleFromTSF")
  async getRoleFromTSF(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const { orgGrpCode, orgCode, roleGrpCode } = query;
    return this.tpservice.getRoleFromTSF(orgGrpCode, orgCode, roleGrpCode);
  }

  @Get("getPSGfromTSF")
  asyncgetPSGfromTSF(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const { orgGrpCode, orgCode, roleGrpCode, roleCode } = query;
    return this.tpservice.getPSGFromTSF(
      orgGrpCode,
      orgCode,
      roleGrpCode,
      roleCode
    );
  }

  @Get("getPSfromTSF")
  asyncgetPSfromTSF(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const { orgGrpCode, orgCode, roleGrpCode, roleCode, psGrpCode } = query;
    return this.tpservice.getPSFromTSF(
      orgGrpCode,
      orgCode,
      roleGrpCode,
      roleCode,
      psGrpCode
    );
  }

  @Get("getTenantAgApp")
  async getTenantAgApp(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const {
      orgGrpCode,
      orgCode,
      roleGrpCode,
      roleCode,
      psGrpCode,
      psCode,
    } = query;
    return this.tpservice.getTenantAgApp(
      orgGrpCode,
      orgCode,
      roleGrpCode,
      roleCode,
      psGrpCode,
      psCode
    );
  }
  @Get("getPortal")
  async getPortal(@Req() req: Request) {
    const { authorization }: any = req.headers;
    if (authorization) {
      const token = authorization.split(" ")[1];
      return this.tpservice.getPortal(token);
    } else {
      return new CustomException("Token not found", HttpStatus.UNAUTHORIZED);
    }
  }

  @Post("tpErrorLogs")
  async tpErrorLogs(@Body(new ValidationPipe({ transform: true })) body: any) {
    const { token, statusCode, errorDetails, key } = body;
    return this.commonservice.commonErrorLogs(
      "TP",
      token,
      key ?? "",
      errorDetails,
      statusCode
    );
  }

  @Get("getJsonValue")
  async getValueFromRedis(
    @Query(new ValidationPipe({ transform: true })) query: any
  ) {
    const { key } = query;
    return this.tpservice.getValueFromRedis(key);
  }

  @Post("setJsonValue")
  async postValueinRedis(
    @Body(new ValidationPipe({ transform: true })) body: any
  ) {
    const { key, data } = body;
    return this.tpservice.postValueinRedis(key, data);
  }
}
