import { Body, Controller, Post } from '@nestjs/common';
import { CG_NextUiService } from './cg-next-ui.service';
import { apiGenDto } from 'src/CG/Dto/apiGen.dto';

@Controller('NextUi')
export class CG_NextUiController {
  constructor(private readonly dynamicUfGenNextUiService: CG_NextUiService) {}

  @Post()
  /**
   * A description of the entire function.
   *
   * @param {apiGenDto} body - parameter containing the key
   * @return {Promise<any>} resolves to the generated code
   */
  async createCode(@Body() body: apiGenDto): Promise<any> {
    const { key } = body;
    return await this.dynamicUfGenNextUiService.generateApi(key);
  }
}
