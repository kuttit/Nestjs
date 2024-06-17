import { Body, Controller, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { CgErApiSecurityService } from './cg-er-api-security.service';
import { erApiSecurityGenDto } from './Dto/er-api-securityGen.dto';
import { securityGuard } from 'src/CG/guards/security.guard';

@Controller('ERAPISecurityCodeGeneration')
export class CgErApiSecurityController {
  constructor(private readonly codeGenerateService: CgErApiSecurityService) {}

  @Post()
  @UseGuards(securityGuard)
   /**
   * Asynchronously creates a new code based on the provided key.
   *
   * @param {erApiSecurityGenDto} body - The body of the request containing the key.
   * @param {Request} request - The request object.
   * @return {Promise<any>} A promise that resolves to the generated code.
   */
  async createCode(@Body() body: erApiSecurityGenDto,@Req() request: Request): Promise<any> {
    const { key } = body;
    return await this.codeGenerateService.generateApi(key,'');
  }
}
