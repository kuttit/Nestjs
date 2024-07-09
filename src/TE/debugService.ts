import { BadRequestException,Injectable, Logger, UnauthorizedException, } from '@nestjs/common';
//const  Xid = require('xid-js');
import Xid from 'xid-js'
import 'dotenv/config';
import { format } from 'date-fns';
import { RedisService } from 'src/redisService';
import { GoRuleEngine } from 'src/gorule';
import { TeCommonService } from './teCommonService';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import { CommonService } from 'src/commonService';
import { TeService } from './te.service';

/*
  # This is process flow Debug service. 
  # Each and Every node is debuged in the "getdebug method".
  # The key is combination of tenantName, appGroupName, appName, artifacts and resource.  
  # To check the permission for the incoming role in the "getSecurityJson method".
  # Each and Every node validates a config, workflow and set a NPCI placeholders in the "debugpfpreprocessor method".
  # OverAll nodes are could be processed  based on the node type in "debugpfprocessor method" also set npci request response.
  # In the api node to read a pro config to set npci in the "nodeprocessor method".
  # In the method "getdebugNodeProcess" is used to debug a specific node 
  # If additional parameters are provided, retrieve the request data for the specified node and merge
    it with the additional parameters then store the merged data as the NPCI request data perform debugProcessor call.
  # If no additional parameters are provided, retrieve and return the existing NPCI data.
*/


@Injectable()
export class DebugService {
  constructor(  private readonly teService: TeService,  private readonly redisService : RedisService,private readonly commonService: CommonService, private readonly tecommonService: TeCommonService) {}
  private readonly logger = new Logger(DebugService.name);

  static currtime = new Date()
  static entrytime = format(DebugService.currtime,'HH:mm:ss.SSS dd MMM yyyy')  
   
  /**
 * Validates the given key by checking if the processflow and nodeProperty exist in Redis.
 * If the processflow does not exist, an error is added to the validation array.
 * If the nodeProperty does not exist, an error is added to the validation array.
 * For each node in the processflow, if the node does not exist in the nodeProperty, an error is added to the validation array.
 * If the node exists, the configuration is checked for apinode, humantasknode, and decisionnode.
 * For apinode, the pre, pro, and pst URLs are checked for validity.
 * For humantasknode, the pre, pro, and pst URLs are checked for validity.
 * For decisionnode, the rule tab is checked for emptiness.
 * If no errors are found, an object with the validation result and warning array is returned.
 * If errors are found, the validation array is returned.
 

   /**
    * Retrieves the debug request from Redis based on the provided key, upId, nodeName, and nodeId.
    *
    * @param {string} key - The key used to identify the Redis data.
    * @param {string} upId - The unique identifier for the debug request.
    * @param {string} nodeName - The name of the node for which the debug request is being retrieved.
    * @param {string} nodeId - The ID of the node for which the debug request is being retrieved.
    * @return {Promise<any>} The debug request data from Redis.
    */
    async getDebugRequest(key,upId, nodeName, nodeid){  
     var request = await this.redisService.getJsonDataWithPath(key+upId+':NPCI:'+nodeName,'.request')    
     return request
    }

  /**
   * Retrieves the debug request from Redis based on the provided key, upId, nodeName, and nodeId.
   *
   * @param {string} key - The key used to identify the Redis data.
   * @param {string} upId - The unique identifier for the debug request.
   * @param {string} nodeName - The name of the node for which the debug request is being retrieved.
   * @param {string} nodeId - The ID of the node for which the debug request is being retrieved.
   * @return {Promise<{request: any, mode: string}>} An object containing the debug request data and the mode.
   */
   async getDebughtRequest(key,upId, nodeName, nodeid){ 
     var request = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty','.'+nodeid+'.execution.pro.url'))
     return {request,mode:'ND'}
   }

      /**
    * Retrieves the debug response from Redis based on the provided key, upId, nodeName, and nodeId.
    *
    * @param {string} key - The key used to identify the Redis data.
    * @param {string} upId - The unique identifier for the debug request.
    * @param {string} nodeName - The name of the node for which the debug response is being retrieved.
    * @param {string} nodeId - The ID of the node for which the debug response is being retrieved.
    * @return {Promise<any>} The debug response data from Redis.
    */
   async getDebugResponse(key,upId, nodeName, nodeid){
    var response = JSON.parse(await this.redisService.getJsonDataWithPath(key+upId+":NPC:"+nodeName+'.PRO','.response'))
    return response
  }   
 
 
  /*
    Based on a given valid key & role, to debug a specific node in a process flow. 
    validates the wrong flow, retrieves the request data based on the node type and additional parameters & 
    store it to NPCI, then calls the debugProcessor method.
    If no additional parameters are provided,it returns the existing NPCI data.
  */
    async getdebugNodeProcess(key,upId,nodeName,nodeType,nodeId, params,mode,token) { 
      this.logger.log("Node level Debug started")
        try { 
            await this.redisService.setJsonData(key + upId +':NPC:'+ nodeName+'.PRO', JSON.stringify(params), 'request')  
            var res = await this.debugProcessor(key,upId,nodeName,nodeId,mode,token);                  
            return res                                
        }catch (error) {    
          return {status:400,err:error}                  
        }    
    }
    


  
// --------------------------------pfProcessor--------------------------------------

  /*
    Debug the a specific node in process flow based on a given key and specific node name.
    @params key - The key used to identify the process flow.
    @params node_name - The specific node name for which the debugging is targeted.
  */

    async debugProcessor(key,upId,node_name,nodeId,mode,token) {  
  
      this.logger.log('Debug Node Processor started!');
     
      var arr = [];
      var nodeid; 

      const json = await this.redisService.getJsonData( key + 'processFlow');  
      var pfjson: any = JSON.parse(json);          
    
      for (var i = 0; i < pfjson.length; i++) { 
        
        // Start Node
            
        if (pfjson[i].nodeType == 'startnode') {
            var obj = {};
            obj['nodeid'] = pfjson[i].nodeId;
            obj['nodename'] = pfjson[i].nodeName;
            obj['nodetype'] = pfjson[i].nodeType;          
            arr.push(obj);
            var deci = {};
            deci['nodeName'] = pfjson[i].nodeName;
         
            //logging nodename in stream
            await this.tecommonService.getTElogs(key, upId, pfjson[i],mode)
           // await this.redisService.setStreamData('TPENodeDebuglogs', key+ upId, JSON.stringify(deci));
            nodeid = pfjson[i].routeArray[0].nodeId;        
        }  
     
       // Humantask node

       if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'humantasknode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) { 
        try{  
          this.logger.log("Humantask node started...")    
          var obj = {};
          obj['nodeid'] = pfjson[i].nodeId;
          obj['nodename'] = pfjson[i].nodeName;
          obj['nodetype'] = pfjson[i].nodeType;          
          arr.push(obj);
        
          if(node_name == pfjson[i].nodeName){
            var htNodeProp = await this.redisService.getJsonData(key + upId +':NPC:'+ pfjson[i].nodeName+'.PRO');    
               
            if(Object.keys(htNodeProp).length > 0){
              var fdataReq = JSON.parse(htNodeProp).request  //JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro.request'));        
              var fdataRes = JSON.parse(htNodeProp).response //JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro.response'));
            
            if(pfjson.length > 0){
            for(var y=0; y<pfjson.length; y++){
            if(pfjson[y].nodeType == "apinode" || pfjson[y].nodeType == "decisionnode"){
              await this.redisService.setJsonData(key + upId+':NPC:'+pfjson[y].nodeName, JSON.stringify(fdataReq), 'request')             
            }
          }
        }
          await this.tecommonService.getTElogs(key, upId, pfjson[i],mode,fdataReq,fdataRes)
         }
        }
        nodeid = pfjson[i].routeArray[0].nodeId; 
        this.logger.log("Humantask node completed..")   

        }catch(error)
        {
          var errorobj = await this.tecommonService.getException(pfjson[i],mode,token,key,upId,error,error.status)         
          throw new BadRequestException(errorobj)
        }
       }
       
        // Webhook Node
        if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'webhooknode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) {
          try {
              this.logger.log("WebHook node started...")
              var whobj = {};
              whobj['nodeid'] = pfjson[i].nodeId;
              whobj['nodename'] = pfjson[i].nodeName;
              whobj['nodetype'] = pfjson[i].nodeType;
              arr.push(whobj);
              if(node_name == pfjson[i].nodeName){    
              var whnpcReq = await this.redisService.getJsonData(key + upId +':NPC:'+ pfjson[i].nodeName+'.PRO');              
              var whnodeprop = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId);
              if(Object.keys(whnpcReq).length > 0 && Object.keys(whnodeprop).length > 0 ){  
                var whReq = JSON.parse(whnpcReq).request  //JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro.request'));
                var whurl = JSON.parse(whnodeprop).execution.pro.url  //JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.execution.pro'));
                //var url = fdataRes.url
                var eventstream = JSON.parse(whnodeprop).execution.pro.eventStream
                var eventname = whReq.event

                if(eventname == 'OrderCreated'){
                  this.logger.log("event started...")
                  var orderParams ={
                      streamName:eventstream,
                      field:'orders',
                      data:whReq
                  }
                  const response = await this.commonService.postCall(whurl, orderParams)
                  this.logger.log(response.data)
                    // payment process
                  var grpinfo = await this.redisService.getInfoGrp(eventstream)            
                
                  if(grpinfo.length == 0){                                                      
                    await this.redisService.createConsumerGroup(eventstream,'OrderGroup')                                       
                  } else if(!grpinfo[0].includes('OrderGroup')){                                   
                    await this.redisService.createConsumerGroup(eventstream,'OrderGroup')                   
                  }
                  var orderStream = await this.redisService.readConsumerGroup(eventstream,'OrderGroup','OrderConsumer')
                    var paymentData
                    if(orderStream.length >0){
                      for(var o=0;o<orderStream.length;o++){                    
                        paymentData = orderStream[o].data[1]
                      }
                    }                    
                    await this.redisService.setJsonData(key + upId +':NPC:'+ pfjson[i].nodeName+'.PRO', JSON.stringify(paymentData), 'response');
                    await this.redisService.setStreamData('EStorePaymentStream','Payment',paymentData)
                  // var req = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro.request'));
                    var nextnodeid = pfjson[i].routeArray[0].nodeId;
                    var nextnodename = pfjson[i].routeArray[0].nodeName;
                    this.logger.log(nextnodeid)
                    whReq.event = 'PaymentMade'
                    await this.redisService.setJsonData(key + upId +':NPC:'+ nextnodename+'.PRO', JSON.stringify(whReq), 'request')
                  
                    //logging execution in PE stream
                    await this.tecommonService.getTElogs(key, upId, pfjson[i],mode,whReq,paymentData)
                    this.logger.log("event completed...")
                }
                else if(eventname == 'PaymentMade'){
                    var dispatchParams ={
                      streamName:eventstream,
                      field:'dispatches',
                      data:whReq
                    }
                     await this.commonService.postCall(whurl, dispatchParams)                     
                    var grpinfo = await this.redisService.getInfoGrp(eventstream)  
                              
                    if(grpinfo.length == 0){                                                      
                      await this.redisService.createConsumerGroup(eventstream,'DispatchGroup')                                    
                    } else if(!grpinfo[0].includes('DispatchGroup')){                                   
                      await this.redisService.createConsumerGroup(eventstream,'DispatchGroup')                  
                    }
                    var dispatchStream = await this.redisService.readConsumerGroup(eventstream,'DispatchGroup','DispatchConsumer')
                    var dispatchData
                    if(dispatchStream.length >0){
                      for(var o=0;o<dispatchStream.length;o++){                    
                        dispatchData = dispatchStream[o].data[1]
                      }
                    }                   
                   await this.redisService.setJsonData(key + upId +':NPC:'+ pfjson[i].nodeName+'.PRO', JSON.stringify(dispatchData), 'response');
                 
                  //logging execution in stream
                  await this.tecommonService.getTElogs(key, upId, pfjson[i],mode,whReq,dispatchData)
                  this.logger.log("event completed...")
                }
              }
               
                }
                  nodeid = pfjson[i].routeArray[0].nodeId;
                 
                              
              this.logger.log("webhook node completed...")
            } catch (error) {
              //logging Technical Exception in stream
              var errorobj = await this.tecommonService.getException(pfjson[i],mode,token,key,upId,error,error.status)
              throw new BadRequestException(errorobj)
            }
          
        }

        // Decision Node
        
        if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'decisionnode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) {    
          try {  

            this.logger.log("decision node execution started..")
            var obj = {};
            obj['nodeid'] = pfjson[i].nodeId;
            obj['nodename'] = pfjson[i].nodeName;
            obj['nodetype'] = pfjson[i].nodeType;
            arr.push(obj);          
            var cmresult={}
            var decinpcReq = JSON.parse(await this.redisService.getJsonDataWithPath(key + upId +':NPC:'+ pfjson[i].nodeName+'.PRO','.request'))
            var currNode = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId);                         
            if(Object.keys(currNode).length > 0){      


              var rmcResult = await this.teService.getRuleMapCustomResult(key,upId,arr,pfjson[i],mode)
           

            if(node_name == pfjson[i].nodeName){
              if (rmcResult.CustomCodeResult != undefined)
                cmresult = Object.assign(rmcResult.CustomCodeResult)

              if (rmcResult.PreMapperResult != undefined)
                cmresult = Object.assign(cmresult, rmcResult.PreMapperResult)

              if (rmcResult.ProMapperResult != undefined)
                cmresult = Object.assign(cmresult, rmcResult.ProMapperResult)
              
              if (rmcResult.PstMapperResult != undefined)
                cmresult = Object.assign(cmresult, rmcResult.PstMapperResult)     
              
            }            
          
            if(pfjson[i].routeArray.length>0){
                      
              for (var k = 0; k < pfjson[i].routeArray.length; k++) {                 
                if (pfjson[i].routeArray[k].conditionResult == rmcResult.ZenResult.ZenResult) {                 
                  var deciresult ={statuscode: 200,status: 'SUCCESS'}                   
                    deciresult = Object.assign(deciresult,pfjson[i].routeArray[k])  
                    if(Object.keys(cmresult).length>0)
                    deciresult = Object.assign(deciresult,cmresult)              
                    await this.redisService.setJsonData(key + upId +':NPC:'+ pfjson[i].nodeName+'.PRO' ,JSON.stringify(deciresult),'response');
                  
                  nodeid = pfjson[i].routeArray[k].nodeId;  
                  await this.tecommonService.getTElogs(key, upId, pfjson[i],mode,decinpcReq,deciresult)  
                  this.logger.log("decision node execution completed..")
                  break;
                }
              } 
            }
            }             
              
            } catch (error) {
              var errorobj = await this.tecommonService.getException(pfjson[i],mode,token,key,upId,error,error.status)
              throw errorobj
          }  
        }

        // Api Node
        if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'apinode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) {
        
          this.logger.log("Api Node execution started")  
          
          var obj = {};
          obj['nodeid'] = pfjson[i].nodeId;
          obj['nodename'] = pfjson[i].nodeName;
          obj['nodetype'] = pfjson[i].nodeType;
          arr.push(obj);  
          if(node_name == pfjson[i].nodeName){
          await this.nodedebugProcessor(key,upId,pfjson[i],node_name,arr,mode,token)
          } 
          nodeid = pfjson[i].routeArray[0].nodeId; 
          this.logger.log("Api Node execution completed")        
             
        }
          
      
        // End Node      
        if (pfjson[i].nodeType == 'endnode'){   
             
          var obj = {};
          obj['nodeid'] = pfjson[i].nodeId;
          obj['nodename'] = pfjson[i].nodeName;
          obj['nodetype'] = pfjson[i].nodeType;
          arr.push(obj);
          await this.tecommonService.getTElogs(key, upId, pfjson[i],mode)
          this.logger.log("End node executed") 
        break;
        }
        }      
      await this.redisService.setJsonData(key+'Debugresponse',JSON.stringify(arr))
      this.logger.log("Node level Debug completed") 
      return 'Success'
       
  }

  /*  
    Performs API call (make avaiable Pro data in NPC,IPC) for a specific node
    @params key    - The key passed to identify the particular node in process flow.
    @params pfjson - This variable holding the values of parsed process flow json
    @params input  - This is passed to form the url with current node name              
  */
    async  nodedebugProcessor(key,upId,pfjson,node_name,arr,mode, token){    
      this.logger.log('Node Processor started!');        
        try{ 
          var cmresult = {}  
          var apiresult = {}
          var c, z, mpre, mpro, mpst = 0;
          var apiconfig = JSON.parse(await this.redisService.getJsonDataWithPath(key + upId+':NPC:'+ pfjson.nodeName+'.PRO','.request'))
        
          var currNode = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId);                                   
          
          if(Object.keys(apiconfig).length > 0 && Object.keys(currNode).length > 0){
          
            var rmcResult = await this.teService.getRuleMapCustomResult(key,upId,arr,pfjson,mode)
           
            var url = JSON.parse(currNode).execution.pro.url  
    
            if (Object.keys(apiconfig).length > 0 ) {
              var data = await this.commonService.postCall(url,apiconfig)        
            }    
          
          if (rmcResult.ZenResult != undefined)
            cmresult = Object.assign(cmresult,rmcResult.ZenResult)
    
          if (rmcResult.CustomCodeResult != undefined)
            cmresult = Object.assign(cmresult, rmcResult.CustomCodeResult)
          
          if (rmcResult.PreMapperResult != undefined)
            cmresult = Object.assign(cmresult, rmcResult.PreMapperResult)
         
          if (rmcResult.ProMapperResult != undefined)
            cmresult = Object.assign(cmresult, rmcResult.ProMapperResult)
        
          if (rmcResult.PstMapperResult != undefined)
            cmresult = Object.assign(cmresult, rmcResult.PstMapperResult)
    
          apiresult = Object.assign(apiresult, data)
          if (Object.keys(cmresult).length > 0)
            apiresult = Object.assign(apiresult, cmresult)
         
              await this.redisService.setJsonData(key + upId+':NPC:'+ pfjson.nodeName+'.PRO', JSON.stringify(apiresult), 'response')
           
            
           
            //logging Execution in stream
            await this.tecommonService.getTElogs(key, upId, pfjson,mode,apiconfig,apiresult)
            }
          } catch (error) { 
            //logging Technical Exception in stream   
            var errorobj = await this.tecommonService.getException(pfjson,mode,token,key,upId,error,error.status)  
            throw new BadRequestException(errorobj)
          } 
    }
  
  

}


