import { Body, Controller, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { TgDfService } from './tg-df.service';
import { DFGenDto } from './Dto/df.dto';

@Controller('ERAPISecurityCodeGeneration')
export class TgDfController {
  constructor(private readonly codeGenerateService: TgDfService) {}

  // @Post()
  //  /**
  //  * Asynchronously creates a new code based on the provided key.
  //  *
  //  * @param {erApiSecurityGenDto} body - The body of the request containing the key.
  //  * @param {Request} request - The request object.
  //  * @return {Promise<any>} A promise that resolves to the generated code.
  //  */
  // async createCode(@Body() body: DFGenDto,@Req() request: Request): Promise<any> {
  //   const { key } = body;
  //   return await this.codeGenerateService.generateApi(key,'');
  // }
}
