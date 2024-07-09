import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TgUfService } from './tg-uf.service';
import { TgUfGenDto } from './Dto/apiGen.dto';


@Controller('CGTorusComponents')
export class TgUfController {
    constructor(private readonly dynamicUfGenNextUiService: TgUfService) {}
  // @Post()
  // // @UseGuards(securityGuard)
  // /**
  //  * Asynchronously creates a new code component using the provided torusComponentGenDto object.
  //  *
  //  * @param {TgUfGenDto} body - The torusComponentGenDto object containing the key for the new code component.
  //  * @return {Promise<any>} A promise that resolves with the generated code component.
  //  */
  // async createCode(@Body() body: TgUfGenDto): Promise<any> {
  //   const { key } = body;
  //   return await this.dynamicUfGenNextUiService.generateApi(key,'');
  // }
}
