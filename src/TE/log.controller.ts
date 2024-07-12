import { Controller, Get, Logger, Query } from "@nestjs/common";
import { TeCommonService } from "./teCommonService";

@Controller('log')
export class LogController {
    constructor(private readonly tecommonService:TeCommonService ) {}        
        private readonly logger = new Logger(LogController.name);

    /**
     * Retrieves the process logs from the TECommonService.

     * @return {Promise<any>} A promise that resolves to the process logs.
    */
    @Get('processLog')   
    async getPrcLogs(): Promise<any> {   
       return await this.tecommonService.getPrcLogs();       
    }
 

    /**
     * Retrieves the exception logs from the TECommonService.
     *
     * @param {Record<string, unknown>} input An object containing the query parameters.
     * @param {string} input.teamName The name of the team to retrieve the exception logs for.
     * @return {Promise<any>} A promise that resolves to the exception logs.
     * @throws {Error} If there is an error retrieving the exception logs.
     */

    @Get('exceptionLog')
    async getExceplogs(@Query() input): Promise<any> {  
        return await this.tecommonService.getExceplogs(input.teamName)    
     }  
     
}