import { Body, Controller, Get, Post } from '@nestjs/common';
import { ExecutionService } from './execution.service';

@Controller('codeExecute')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post()
  async getProcess(@Body() input): Promise<any> {
    if (input.key && input.nodeName && input.code)
      return await this.executionService.getProcess(
        input.key,
        input.nodeName,
        input.code,
      );
    else if (input.code) {
      const data = await this.executionService.customCodeExcute(input.code);
      return {
        status: 201,
        data: data,
      };
    }
  }
}
