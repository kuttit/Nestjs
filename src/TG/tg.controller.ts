import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TgService } from './tg.service';
@Controller()
export class TgController {
  constructor(private readonly tgService: TgService) {}

  @Post('codeGeneration')
  // @UseGuards(securityGuard1)
  async codeGeneration(@Body() body: any): Promise<any> {
    const { key } = body;
    return this.tgService.codeGeneration(key);
  }
}
