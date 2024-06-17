import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CgService } from './cg.service';
import { securityGuard1 } from './guards/security1.guard';

@Controller()
export class CgController {
  constructor(private readonly cgService: CgService) {}

  @Post('codeGeneration')
  // @UseGuards(securityGuard1)
  async codeGeneration(@Body() body: any): Promise<any> {
    const { key } = body;
    return this.cgService.codeGeneration(key);
  }
}
