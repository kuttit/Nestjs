import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { CommonService } from './commonService';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,private readonly commonService: CommonService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('commonApiPost')
  async postCall(@Body() input, @Req() token:any){
    return await this.commonService.postCall(input.url, input.payload,token.headers)
  }

  @Get('commonApiGet')
  async getCall(@Body() input, @Req() token:any){
    return await this.commonService.getCall(input.url,token.headers)
  }

  @Post('commonApiError')
  async exceptionCall(@Body() input, @Req() request:any){
    var bearToken = request.headers.authorization.split(' ')[1];
    return await this.commonService.commonErrorLogs(input.errData,bearToken,input.key,input.error,input.status)
  }
}
