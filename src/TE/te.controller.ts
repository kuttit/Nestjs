import { Controller,Post, Body, Headers, Logger, UseGuards, Session } from '@nestjs/common';
import { TeService } from './te.service';
import { DebugService } from './debugService';
import { NodeExecutionService } from './nodeExecService';
import { TeCommonService } from './teCommonService';
import { AuthGuard } from './Guard/auth.guard';
import { SavehandlerService } from './savehandlerService';
import { Process, Processor } from '@nestjs/bull';

import {DebugHtRequestDTO, DebugNodeDTO, DebugRequestDTO, DebugresponseDTO, FormdataDTO, NodeExecuteDTO, Input, ResumeDTO  } from './Dto/input';
import { QueueConsumer } from './queueConsumer';
import Bull from 'bull';
import { ApiBody, ApiTags } from '@nestjs/swagger';
const  Xid = require('xid-js');

@UseGuards(AuthGuard)
@ApiTags('TE')
@Processor('pfPaymentProcess')
@Controller('pe')
export class TeController {
  /**
   * The constructor for the TE controller class.
   * @param appService The TE service instance.
   * @param debugservice The debug service instance.
   * @param nodeExecService The node execution service instance.
   * @param tecommonService The TE common service instance.
   * @param savehandlerService The save handler service instance.
   * @param queueConsumer The queue consumer instance.
   */
  constructor(private readonly appService: TeService, private readonly debugservice: DebugService, 
  private readonly nodeExecService:NodeExecutionService, private readonly tecommonService:TeCommonService,
  private readonly savehandlerService:SavehandlerService, private readonly queueConsumer:QueueConsumer) {}
  
  private readonly logger = new Logger(TeController.name);


//Execution

  // Processflow Execution 
   /**
    * Process flow execution
    * @param input -
    * @param auth - 
    */
  @Process()  
  @Post('peStream')
  @ApiBody({
    description: 'Input parameters',
    type: Input,
  })
   
  //   async getPeStream(@Body() input:Input , @Headers('Authorization') auth:any){       
  //   var token = auth.split(' ')[1];  
     
  //  var inputValidate = await this.tecommonService.APIKeyValidation(input,'peStream')
  //  if(inputValidate == undefined){
      
  //     input.token = token
  //     input.upId =  Xid.next() 
      
  //     var result:any = await this.queueConsumer.generateQueue(input.name,input)
      
  //     if(result.status == 200)
  //        return await this.appService.getTeStream(input.sfkey,input.key,token,input.mode,input.sflag,input.name);
  //     }else{
  //     return inputValidate
  //   }
  //  }

  async getPeStream(@Body() input:Input ,@Session() session: any){
   
    var inputValidate = await this.tecommonService.APIKeyValidation(input,'peStream')
    if(inputValidate == undefined){      
      input.token = session.sToken
      input.upId =  Xid.next()  
     // var result = await this.queueConsumer.autogenerate(input.name,input)  
       
      var result:any = await this.queueConsumer.generateQueue(input.name,input)
     
      // console.log(result);
           
       //if(result.status == 200)
        return await this.appService.getTeStream(session.psArray,input.key,session.sToken,input.mode,input.sflag,input.name);
    }else{
      return inputValidate
    }
   }
   

   //process resume after process flow stopped

    /**
    * Resume process flow execution after process flow stopped
    * @param input - {sfkey: string, key: string, upId: string, mode: string}
    * @param auth - 
    */
   @Post('resume')
   @ApiBody({
    description: 'Input parameters',
    type: ResumeDTO,
  })
   async resumeProcess(@Body() input, @Headers('Authorization') auth:any){  
    var token = auth.split(' ')[1]; 
    var inputValidate = await this.tecommonService.APIKeyValidation(input,'resume')  
    if(inputValidate == undefined){
      return await this.appService.resumeProcess(input.sfkey,input.key,input.upId,token,input.mode);
    }else{
      return inputValidate
    } 
       
   } 
   
    

  // process execution after humantask data collected
  /**
   * Get form data after humantask data collected
   * @param input - {sfkey: string, key: string, upId: string, mode: string,
   *                 nodeId: string, nodeName: string, formdata: any}
   * @param auth - 
   * @returns form data
   */
  @Post('formdata')
  @ApiBody({
    description: 'Input parameters',
    type: FormdataDTO,
  })
  async getFormdata(@Body() input, @Headers('Authorization') auth:any): Promise<any> {  
    var token = auth.split(' ')[1];    
    var inputValidate = await this.tecommonService.APIKeyValidation(input,'formdata')
     if(inputValidate == undefined){
      return await this.appService.getFormdata(input.sfkey,input.key,input.upId,input.nodeId,input.nodeName, input.formdata, token,input.mode); 
     }else{
      return inputValidate
     }
    } 

  //node level execution
  /**
   * Execute a node in the process flow
   * @param input - {sfkey: string, key: string, nodeId: string, nodeName: string, nodeType: string}+   * @param auth - 
   * @returns {Promise<any>} - The result of the node execution
   */
  @Post('nodeExec')
  @ApiBody({
    description: 'Input parameters',
    type: NodeExecuteDTO,
  })
  async nodeExecution(@Body() input, @Headers('Authorization') auth:any): Promise<any> { 
    var token = auth.split(' ')[1];  
    var inputValidate = await this.tecommonService.APIKeyValidation(input,'nodeExec')
    if(inputValidate == undefined){
      return await this.nodeExecService.nodeExecution(input.sfkey,input.key,input.nodeId,input.nodeName,input.nodeType,'NE',token);       
    }else{
      return inputValidate
    }
             
  } 

  
  
  //retry execution
  /**
   * Retry a process execution
   * @param input - {sfkey: string, key: string, upId: string, mode: string,
   *                 sflag?: string}
   * @param auth - 
   * @returns {Promise<any>} - The result of the retry process execution
   */
  @Post('retry')
  async getRetryProcess(@Body() input, @Headers('Authorization') auth:any): Promise<any> {  
    var token = auth.split(' ')[1]; 
    var inputValidate = await this.tecommonService.APIKeyValidation(input,'retry')
    if(inputValidate == undefined){
      return await this.appService.getProcess(input.sfkey,input.key,input.upId,token,input.mode,input.sflag); 
    }  else{
      return inputValidate
    }
   }

  //Debug    

  // debug node level
  /**
   * Debug a process flow at the node level
   * @param input - {key: string, upId: string, nodeName: string, nodeType: string,
   *                    nodeId: string, params: any}
   * @param auth - 
   * @returns {Promise<any>} - The result of the debug process
   */
  @Post('debugNode')
  @ApiBody({
    description: 'Input parameters',
    type: DebugNodeDTO,
  })
  async getdebugProcess(@Body() input, @Headers('Authorization') auth:any): Promise<any> {        
      var token = auth.split(' ')[1];   
       var inputValidate = await this.tecommonService.APIKeyValidation(input,'debugNode')
      
       if(inputValidate == undefined){
       
        
        await this.debugservice.getdebugNodeProcess(input.key,input.upId,input.nodeName,input.nodeType,input.nodeId,input.params,'ND',token);       
        return await this.debugservice.getDebugResponse(input.key,input.upId, input.nodeName, input.nodeId);
       } else{
        return inputValidate
       }    
       
    
  } 

 

 /**
   * Debug a process flow request
   * @param input - {key: string, upId: string, nodeName: string, nodeId: string}
   * @param auth -
   * @returns {Promise<any>} - The result of the debug request
   */
  @Post('debugrequest')
  @ApiBody({
    description: 'Input parameters',
    type: DebugRequestDTO ,
  })
  async debugRequest(@Body() input, @Headers('Authorization') auth:any): Promise<any> {         
      var token = auth.split(' ')[1]; 
      var inputValidate = await this.tecommonService.APIKeyValidation(input,'debugrequest')
      if(inputValidate == undefined){
        return await this.debugservice.getDebugRequest(input.key,input.upId, input.nodeName, input.nodeId);
      }else{
        return inputValidate
      }
  }


   /**
   * Debug a process flow request for a HT node
   * @param input - {key: string, upId: string, nodeName: string, nodeId: string}
   * @param auth - Authorization header
   * @returns {Promise<any>} - The result of the debug request
   */
  @Post('debughtrequest')
  @ApiBody({
    description: 'Input parameters',
    type: DebugHtRequestDTO,
  })
  async debughtRequest(@Body() input, @Headers('Authorization') auth:any): Promise<any> {
    var token = auth.split(' ')[1]; 
    var inputValidate = await this.tecommonService.APIKeyValidation(input,'debughtrequest')
    if(inputValidate == undefined){
      return await this.debugservice.getDebughtRequest(input.key,input.upId, input.nodeName, input.nodeId);
    }else{
      return inputValidate
    }
   
  }

  
  /**
   * Debug a process flow response
   * @param input - {key: string, upId: string, nodeName: string, nodeId: string}
   * @param auth - Authorization header
   * @returns {Promise<any>} - The result of the debug response request
   */
  @Post('debugresponse')
  @ApiBody({
    description: 'Input parameters',
    type: DebugresponseDTO,
  })
  async debugResponse(@Body() input,@Headers('Authorization') auth:any): Promise<any> {
    var token = auth.split(' ')[1]; 
    var inputValidate = await this.tecommonService.APIKeyValidation(input,'debugresponse')
    if(inputValidate == undefined){
      return await this.debugservice.getDebugResponse(input.key,input.upId, input.nodeName, input.nodeId);
    }else{
      return inputValidate
    }
   
  }

 
  /**
   * Saves data for a given input object and authorization header
   * @param input - The input object containing the necessary data for the save operation
   * @param auth - The authorization header containing the necessary token
   * @returns {Promise<any>} - The result of the save operation
   */
 @Post('save')
   async save(@Body() input, @Headers('Authorization') auth:any) : Promise<any> {  
    var token = auth.split(' ')[1];  
    var inputValidate = await this.tecommonService.APIKeyValidation(input,'save')
    if(inputValidate == undefined){
      return await this.savehandlerService.savehandler(input.key,input.sfkey,input.pKey,input.nodeId,input.nodeName,token,input.mode,input.upId)
    }else{
      return inputValidate
    }
   }
     
}
