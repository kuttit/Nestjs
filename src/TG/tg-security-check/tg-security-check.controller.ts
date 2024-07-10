import { Body, Controller, Post, Req } from '@nestjs/common';
import { TgSecurityCheckService } from './tg-security-check.service';

@Controller('UF')
export class CgSecurityCheckController {
  constructor(private readonly appService: TgSecurityCheckService) {}

  @Post('CGSecurityCheck')
  async securityCheck(@Body() body: any, @Req() req: any) {
    const token = req.headers.authorization.split(' ')[1];
    return await this.appService.securityCheck(body, token);
  }
  @Post('SFCheckScreen')
  async SFCheckScreen(@Body() body: any, @Req() req: any) {
    const token = req.headers.authorization.split(' ')[1];
    var {sfKey,screenNames} = body
    return await this.appService.SFCheckScreen(sfKey, token,screenNames);
  }
  @Post('setSaveHandlerData')
  async setSaveHandlerData(@Body() body: any) {
    const { key, value, path } = body;  
    console.log(key, value, path);
    
    return await this.appService.setSaveHandlerData(key ,value, path);
  }

  @Post('uploadHandlerData')
  async uploadHandlerData(@Body() body: any) {
    const { key } = body;
    return await this.appService.uploadHandlerData(key);
  }
}
