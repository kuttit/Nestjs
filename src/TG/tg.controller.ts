import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { TgService } from './tg.service';
@Controller()
export class TgController {
  constructor(private readonly tgService: TgService) {}

  @Post('codeGeneration')
  // @UseGuards(securityGuard1)
  async codeGeneration(@Body() body: any,@Req() req): Promise<any> {
    const { key } = body;
    const token = req.headers.authorization.split(' ')[1];
    return this.tgService.codeGeneration(key, token);
  }
}
