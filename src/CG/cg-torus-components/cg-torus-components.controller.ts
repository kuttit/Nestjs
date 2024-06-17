import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CgTorusComponentsService } from './cg-torus-components.service';
import { torusComponentGenDto } from './Dto/apiGen.dto';
import { securityGuard } from '../guards/security.guard';

@Controller('CGTorusComponents')
export class CgTorusComponentsController {
    constructor(private readonly dynamicUfGenNextUiService: CgTorusComponentsService) {}
  @Post()
  @UseGuards(securityGuard)
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
