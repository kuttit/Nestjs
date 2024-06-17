import { Controller, Get, Logger } from "@nestjs/common";
import { PeCommonService } from "./peCommonService";

@Controller('log')
export class LogController {
    constructor(private readonly commonService:PeCommonService ) {}        
        private readonly logger = new Logger(LogController.name);

    @Get('processLog')   
    async getPrcLogs(): Promise<any> {   
       return await this.commonService.getPrcLogs();       
    }
 
    @Get('exceptionLog')
    async getExceplogs(): Promise<any> {   
       return await this.commonService.getExceplogs()     
    }
  
    
    @Get('debugLog')
    async getDebugLogs(): Promise<any> {   
         return await this.commonService.getDebugLogs();       
    }
 
    @Get('debugExceptionLog')
    async getdebugExceplogs(): Promise<any> {   
       return await this.commonService.getdebugExceplogs()     
    }
    
    @Get('nodeDebugLog')
    async getNodeDebugLogs(): Promise<any> {   
         return await this.commonService.getNodeDebugLogs();       
    }
 
    @Get('nodeExcepLog')
    async getNodeExceplogs(): Promise<any> {   
         return await this.commonService.getNodeExceplogs();       
    }  
}