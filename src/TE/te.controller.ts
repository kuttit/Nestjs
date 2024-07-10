import { Controller,Post, Body, Headers, Logger, UseGuards } from '@nestjs/common';
import { TeService } from './te.service';
import { DebugService } from './debugService';
import { NodeExecutionService } from './nodeExecService';
import { TeCommonService } from './teCommonService';
import { AuthGuard } from './Guard/auth.guard';
import { SavehandlerService } from './savehandlerService';

@UseGuards(AuthGuard)
@Controller('pe')
export class TeController {
  constructor(private readonly appService: TeService, private readonly debugservice: DebugService, 
  private readonly nodeExecService:NodeExecutionService, private readonly tecommonService:TeCommonService,
  private readonly savehandlerService:SavehandlerService) {}
  
  private readonly logger = new Logger(TeController.name);


//Execution

  // Processflow Execution   
  @Post('peStream')
   async getPeStream(@Body() input:{sfkey:string,key:string,mode:string,sflag?:string} , @Headers('Authorization') auth:any){       
    var token = auth.split(' ')[1];  
     
   var inputValidate = await this.tecommonService.commonReturn(input,'peStream')
    if(inputValidate == undefined){
    return await this.appService.getTeStream(input.sfkey,input.key,token,input.mode,input.sflag);
   }else{
    return inputValidate
   }
   }
   

   //process resume after process flow stopped
   @Post('resume')
   async resumeProcess(@Body() input, @Headers('Authorization') auth:any){  
    var token = auth.split(' ')[1]; 
    var inputValidate = await this.tecommonService.commonReturn(input,'resume')  
    if(inputValidate == undefined){
      return await this.appService.resumeProcess(input.sfkey,input.key,input.upId,token,input.mode);
    }else{
      return inputValidate
    } 
       
   } 
   
    

  // process execution after humantask data collected
  @Post('formdata')
  async getFormdata(@Body() input, @Headers('Authorization') auth:any): Promise<any> {  
    var token = auth.split(' ')[1];    
    var inputValidate = await this.tecommonService.commonReturn(input,'formdata')
     if(inputValidate == undefined){
      return await this.appService.getFormdata(input.sfkey,input.key,input.upId,input.nodeId,input.nodeName, input.formdata, token,input.mode); 
     }else{
      return inputValidate
     }
    } 

  //node level execution
  @Post('nodeExec')
  async nodeExecution(@Body() input, @Headers('Authorization') auth:any): Promise<any> { 
    var token = auth.split(' ')[1];  
    var inputValidate = await this.tecommonService.commonReturn(input,'nodeExec')
    if(inputValidate == undefined){
      return await this.nodeExecService.nodeExecution(input.sfkey,input.key,input.nodeId,input.nodeName,input.nodeType,'NE',token);       
    }else{
      return inputValidate
    }
             
  } 

  
  
  //retry execution
  @Post('retry')
  async getRetryProcess(@Body() input, @Headers('Authorization') auth:any): Promise<any> {  
    var token = auth.split(' ')[1]; 
    var inputValidate = await this.tecommonService.commonReturn(input,'retry')
    if(inputValidate == undefined){
      return await this.appService.getProcess(input.sfkey,input.key,input.upId,token,input.mode,input.sflag); 
    }  else{
      return inputValidate
    }
   }

  //Debug    

  // debug node level
  @Post('debugNode')
  async getdebugProcess(@Body() input, @Headers('Authorization') auth:any): Promise<any> {        
      var token = auth.split(' ')[1];   
       var inputValidate = await this.tecommonService.commonReturn(input,'debugNode')
       console.log(inputValidate);
       if(inputValidate == undefined){
       
        
        await this.debugservice.getdebugNodeProcess(input.key,input.upId,input.nodeName,input.nodeType,input.nodeId,input.params,'ND',token);       
        return await this.debugservice.getDebugResponse(input.key,input.upId, input.nodeName, input.nodeId);
       } else{
        return inputValidate
       }    
       
    
  } 

 


  @Post('debugrequest')
  async debugRequest(@Body() input, @Headers('Authorization') auth:any): Promise<any> {         
      var token = auth.split(' ')[1]; 
      var inputValidate = await this.tecommonService.commonReturn(input,'debugrequest')
      if(inputValidate == undefined){
        return await this.debugservice.getDebugRequest(input.key,input.upId, input.nodeName, input.nodeId);
      }else{
        return inputValidate
      }
  }

  @Post('debughtrequest')
  async debughtRequest(@Body() input, @Headers('Authorization') auth:any): Promise<any> {
    var token = auth.split(' ')[1]; 
    var inputValidate = await this.tecommonService.commonReturn(input,'debughtrequest')
    if(inputValidate == undefined){
      return await this.debugservice.getDebughtRequest(input.key,input.upId, input.nodeName, input.nodeId);
    }else{
      return inputValidate
    }
   
  }

  @Post('debugresponse')
  async debugResponse(@Body() input,@Headers('Authorization') auth:any): Promise<any> {
    var token = auth.split(' ')[1]; 
    var inputValidate = await this.tecommonService.commonReturn(input,'debugresponse')
    if(inputValidate == undefined){
      return await this.debugservice.getDebugResponse(input.key,input.upId, input.nodeName, input.nodeId);
    }else{
      return inputValidate
    }
   
  }

 
 @Post('save')
   async save(@Body() input, @Headers('Authorization') auth:any) : Promise<any> {  
    var token = auth.split(' ')[1];  
    var inputValidate = await this.tecommonService.commonReturn(input,'save')
    if(inputValidate == undefined){
      return await this.savehandlerService.savehandler(input.key,input.sfkey,input.pKey,input.nodeId,input.nodeName,token,input.mode,input.upId)
    }else{
      return inputValidate
    }
   }
 
      
}
