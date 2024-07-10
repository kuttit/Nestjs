import { Body, Controller, Post, Req } from '@nestjs/common';
import { erApiGenDto } from './Dto/er-apiGen.dto';
import { CG_APIService } from './cg-er-api.service';

@Controller('ERAPICodeGeneration')
export class CG_APIController {
    constructor(private readonly apiCodeGenerateService: CG_APIService) {}
    
    @Post()
    /**
     * Asynchronously creates a new code based on the provided key.
     *
     * @param {erApiGenDto} body - The body of the request containing the key.
     * @param {Request} request - The request object.
     * @return {Promise<any>} A promise that resolves to the generated code.
     */
    async createCode(@Body() body: erApiGenDto,@Req() request: Request): Promise<any> {
      const { key } = body;
      return await this.apiCodeGenerateService.generateApi(key);
    }
}
