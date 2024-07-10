import { Controller, Get, Logger } from "@nestjs/common";
import { TeCommonService } from "./teCommonService";

@Controller('log')
export class LogController {
    constructor(private readonly tecommonService:TeCommonService ) {}        
        private readonly logger = new Logger(LogController.name);

    @Get('processLog')   
    async getPrcLogs(): Promise<any> {   
       return await this.tecommonService.getPrcLogs();       
    }
 
    @Get('exceptionLog')
    async getExceplogs(): Promise<any> {   
       return await this.tecommonService.getExceplogs()     
    }  
     
}