import { Body, Controller, Post } from '@nestjs/common';
import { apiGenDto } from './Dto/apiGen.dto';
import { CG_APIService } from './cg-api.service';

@Controller('APICodeGeneration')
export class CG_APIController {
    constructor(private readonly apiCodeGenerateService: CG_APIService) {}
    
    @Post()
     /**
   Asynchronously creates a new code based on the provided key.
   
   @param {apiGenDto} body - The body of the request containing the key.
   @return {Promise<any>} A promise that resolves to the generated code.
   **/
    async createCode(@Body() body: apiGenDto): Promise<any> {
      const { key } = body;
      return await this.apiCodeGenerateService.generateApi(key);
    }
}
