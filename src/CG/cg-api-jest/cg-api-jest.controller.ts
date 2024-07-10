import { Body, Controller, Post } from '@nestjs/common';
import { CG_API_JestService } from './cg-api-jest.service';
import { apiGenDto } from '../Dto/apiGen.dto';


@Controller('testing-code-generate')
export class CG_API_JestController {

    constructor(private readonly aPIGenerationWithIAMJestService: CG_API_JestService) {}

    @Post()
    /**
     * async function to create code for testing.
     *
     * @param {apiGenDto} body - the input body containing the key
     * @return {Promise<any>} the result of generating code for testing
     */
    async createCodefortesting(@Body() body: apiGenDto): Promise<any> {
      const { key } = body;
      return await this.aPIGenerationWithIAMJestService.generatecodefortesting(key);
    }
    
}
