import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TgTorusComponentsService } from './tg-torus-components.service';
import { torusComponentGenDto } from './Dto/apiGen.dto';


@Controller('CGTorusComponents')
export class TgTorusComponentsController {
    constructor(private readonly dynamicUfGenNextUiService: TgTorusComponentsService) {}
  @Post()
  // @UseGuards(securityGuard)
  /**
   * Asynchronously creates a new code component using the provided torusComponentGenDto object.
   *
   * @param {torusComponentGenDto} body - The torusComponentGenDto object containing the key for the new code component.
   * @return {Promise<any>} A promise that resolves with the generated code component.
   */
  async createCode(@Body() body: torusComponentGenDto): Promise<any> {
    const { key } = body;
    return await this.dynamicUfGenNextUiService.generateApi(key,'');
  }
}
