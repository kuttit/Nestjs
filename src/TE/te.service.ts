import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
const  Xid = require('xid-js');
import { RedisService } from 'src/redisService';
import { TeCommonService } from './teCommonService';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import { CommonService } from 'src/commonService';
import { QueueConsumer } from './queueConsumer';
import { Input } from './Dto/input';
import Bull from 'bull';



/*
  # This is process flow execution service. 
  # Each and Every node is executed in the "getProcess method".
  # The key is combination of tenantName, appGroupName, appName, artifacts and resource.
  # Each and Every node validates a config, workflow and set a placeholders in the "pfpreprocessor method".
  # OverAll nodes are could be processed in the  "pfprocessor method".
  # In the "pfpostprocessor method" are used for garbage clean.
  # In the  api node to read a pre config to set npc and ipc in the "nodepreprocessor method".
  # In the  api node to read a pro config to set npc and ipc in the "nodeprocessor method".
  # In the  api node to read a post config to set npc and ipc in the "nodepostprocessor method".
  # To check the permission for the role in the "getSecurityJson method".
*/

@Injectable()
export class TeService { 
  constructor(   
    private readonly tecommonService: TeCommonService,
    private readonly commonService: CommonService,
    private readonly  redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly queueConsumer: QueueConsumer
  ) {}
  private readonly logger = new Logger(TeService.name);
  
  async getTeStream(sfkey,key,token,mode,sflag,queueName) {
    this.logger.log("PE Stream Started")
    try {
      //Unique Process Id created for every execution

     // var upId = Xid.next()   
    //  var pKey, pId, pToken,pMode

      
      var input: Input = new Input();    

      // const PECredentials= {
      //   sessionInfo:token,     
      //   processInfo: {
      //     key: key,
      //     pId: input.upId,
      //     mode:mode
      //   }
      // }

    // this.queueConsumer.generateQueue('PF',input)   
     const queuedata: any = await this.queueConsumer.getAllJobsFromQueue(queueName);
    
      var jobdata = queuedata[0].data.input;
     

      // await this.redisService.setStreamData('TEStream', 'TEField', JSON.stringify(PECredentials))
      // var grpInfo = await this.redisService.getInfoGrp('TEStream')
      // if(grpInfo.length == 0){
      //   await this.redisService.createConsumerGroup('TEStream','TEGroup')
      // }else if(!grpInfo[0].includes('TEGroup')){
      //   await this.redisService.createConsumerGroup('TEStream','TEGroup')    
      // } 
      //   let msg1:any = await this.redisService.readConsumerGroup('TEStream','TEGroup','Consumer1');
      //   if(msg1.length >0){
      //     for(var s=0;s<msg1.length;s++){
      //       var msgid = msg1[s].msgid;
      //       var data = msg1[s].data     

      //       if(data.length > 0 && data[1] != null){
      //         pToken = JSON.parse(data[1]).sessionInfo 
      //         pKey = JSON.parse(data[1]).processInfo.key
      //         pId = JSON.parse(data[1]).processInfo.pId
      //         pMode = JSON.parse(data[1]).processInfo.mode
      //       }   
      //     }
      //   }
              
        var artifact = jobdata.key.split(':')[4]
       
        if(artifact == 'SSH'){         
          var sreq = JSON.parse(await this.redisService.getJsonData(jobdata.key+'nodeProperty')) 
          if(sreq != null){           
            var robj = {}
            robj['key'] = jobdata.key
            robj['upId'] = jobdata.upId
            robj['nodeId'] = sreq.nodeId
            robj['nodeName'] = sreq.nodeName         
            robj['mode'] = jobdata.mode
            return await this.commonService.responseData(201,robj)
          }
        }
        else{
        var result:any = await this.getProcess(jobdata.sfkey,jobdata.key,jobdata.upId,jobdata.token,jobdata.mode,sflag)

        if(result == 'Success'){
         // await this.redisService.ackMessage('TEStream', 'TEGroup', msgid);
          this.logger.log("TE Stream completed")
          await this.queueConsumer.completeJobs(jobdata[0]);
          return await this.commonService.responseData(201,jobdata.key+jobdata.upId)
        }
        else if(result.status == 200){
          this.logger.log("TE Stream completed")
          return await this.commonService.responseData(201,result.data)
        }  
        else{
          return result
        } 
      }
    } catch (error) {    
      throw error;
    }        
    }
 
    async staticCodeExec(sfkey,key,upId,nodeId,nodeName,reqdata,token,mode){
      this.logger.log("static code execution started")
      try{      
      var sreq = JSON.parse(await this.redisService.getJsonData(key+'nodeProperty')) 
       
      var placeholder = {"request":{},"response":{},"exception":{}}   
      await this.redisService.setJsonData(key + upId + ':NPC:' + nodeName + '.PRE', JSON.stringify(placeholder)) 
      await this.redisService.setJsonData(key + upId + ':NPC:' + nodeName + '.PRO', JSON.stringify(placeholder)) 
      await this.redisService.setJsonData(key + upId + ':NPC:' + nodeName + '.PST', JSON.stringify(placeholder)) 
      if(sreq.nodeType == "postnode"){   
        await this.redisService.setJsonData(key+'nodeProperty',JSON.stringify(reqdata),'data.pro.request')      
        var url = sreq.execution.pro.url      
        var resdata = await this.commonService.postCall(url,JSON.stringify(reqdata))     
        await this.redisService.setJsonData(key+'nodeProperty',JSON.stringify(resdata),'data.pro.response')    
      }    
      await this.tecommonService.getTElogs(key, upId, sreq,mode,reqdata,resdata,'PRO')
      return await this.commonService.responseData(201,key + upId)
    
    }
    catch(err){   
        //logging Technical Exception in stream
        var techError = await this.tecommonService.getException(sreq,mode,token,key,upId,err,err.status,'PRO')
        throw new BadRequestException(techError)
    }
    }

 
  async resumeProcess(sfkey,key,upid,token,mode,sflag?,queuename?){
    try{
      this.logger.log("Resume Process started")
      const queuedata: any = await this.queueConsumer.getAllJobsFromQueue(queuename);   
      var jobdata = queuedata[0].data.input;       
      var nodeInfo = await this.getNodeInfo(jobdata.key+jobdata.upId,jobdata.mode)         
      var nodeId
        if(jobdata.mode == 'E')
          nodeId = nodeInfo[0]  
        if(jobdata.mode == 'D')
          nodeId = nodeInfo[nodeInfo.length-1] 

      var arr = JSON.parse(await this.redisService.getJsonData(jobdata.key+jobdata.upId+':previousArray'))
      if(jobdata.mode == 'D' && sflag == 'N'){
        var continueresult = await this.Processor(jobdata.key,jobdata.upId,nodeId,arr,jobdata.mode,jobdata.token,sflag)    
       // await this.pfPostProcessor(key, upid);   
      
        
        if(continueresult == 'Success'){  
          await this.queueConsumer.completeJobs(jobdata[0]);
          return await this.commonService.responseData(201,jobdata.key+jobdata.upId)
        }else{
          return continueresult
        }
        }
        else{
      const decoded =  this.jwtService.decode(jobdata.token,{ json: true })     
      var psjson:any = await this.commonService.getSecurityJson(jobdata.sfkey,decoded);    
      if(typeof psjson !== 'object') {
        return psjson
      }
      var sjson = await this.tecommonService.getPSJson(jobdata.key,decoded,psjson)       
            
      if(typeof sjson !== 'object') {
        return sjson
      }
      var incomingarr = sjson['PFaction']   
      var flag = sjson['PFflag']
      var resumeflgpermit
      if(flag == 'E') {

        if(jobdata.mode == 'E')
          resumeflgpermit = incomingarr.includes('Execute') || incomingarr.includes('*')        
        if(jobdata.mode == 'D')
          resumeflgpermit = incomingarr.includes('Debug') || incomingarr.includes('*')        
        
        if(resumeflgpermit){
          if(jobdata.mode == 'E')
            return {status:400,err:"Permission Denied to Execute"}          
          if(jobdata.mode == 'D')
            return {status:400,err:"Permission Denied to Debug"}
        }   
      }
      else if(flag == 'A') {
        if(jobdata.mode == 'E')
          resumeflgpermit = incomingarr.includes('Execute') || incomingarr.includes('*')        
        if(jobdata.mode == 'D')
          resumeflgpermit = incomingarr.includes('Debug') || incomingarr.includes('*')        
      
        if(!resumeflgpermit){
          if(jobdata.mode == 'E')
            return {status:400,err:"Permission Denied to Execute"}          
          if(jobdata.mode == 'D')
            return {status:400,err:"Permission Denied to Debug"}
        } 
        else{  
   
        var continueresult = await this.Processor(jobdata.key,jobdata.upId,nodeId,arr,jobdata.mode,jobdata.token,sflag,sjson['Node'])    
        
        if(continueresult == 'Success'){ 
          await this.queueConsumer.completeJobs(jobdata[0]);        
          return await this.commonService.responseData(201,jobdata.key+jobdata.upId)
        }else{
          return continueresult
        }
      }
    }
  }
  }catch(err){
    throw err
  }
  }
    

  async getNodeInfo(feild:any,mode:any){   
    try{
      var entries;
      if(mode == 'E'){
        entries = await this.redisService.getStreamRange("TEExceptionLogs") 
      }
      if(mode == 'D'){
        entries = await this.redisService.getStreamRange("TELogs") 
      }     
      var result = [];
      var response = []
        for (let entry of entries) {
          var [id, data] = entry;      
          var entryData = {};
          if(data.length>0){
            for (let i = 0; i < data.length; i += 2) {
              entryData[data[i]] = data[i + 1];
            }
          }        
          if (entryData[feild]) {
            result.push(JSON.parse(entryData[feild]));         
          }            
        }
    
       
        if(result.length>0){
          for(let k=0;k<result.length;k++){
            if(mode == 'E')
               response.push(result[k].processInfo.nodeId)    
            if(mode == 'D')   
              response.push(result[k].nodeId)                       
          }
        }       
           
     return response;  
    } catch(error){
      throw error
    }    
  }
   
  async Processor(key,upId,nodeId,arr,mode,token,sflag,nodeDetails?) {
    this.logger.log('Resume Pf Processor started!');   
  
    var nodeid = nodeId
    var nodeIdChk =[]
    if(arr.length>0){
      for(let p=0;p<arr.length;p++){
        nodeIdChk.push(arr[p].nodeid)      
      } 
    }   
    const json = await this.redisService.getJsonData( key + 'processFlow'); 
    var pfjson: any = JSON.parse(json);     
    if(pfjson.length>0){
      for (var i = 0; i < pfjson.length; i++) {  

       // Humantask node
       if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'humantasknode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) { 
        if(mode == 'D' && sflag == 'N')
          var nodeSjson = true
        else 
        var nodeSjson = await this.tecommonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName,mode)        
           if(nodeSjson == true){        
            try{
            this.logger.log("Humantask node started...")      
              var obj = {};
              var cmresult = {};
              var htresult = {};

              obj['nodeid'] = pfjson[i].nodeId;
              obj['nodename'] = pfjson[i].nodeName;
              obj['nodetype'] = pfjson[i].nodeType;                     
              if(!nodeIdChk.includes(pfjson[i].nodeId)){
                arr.push(obj);   
                await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))    
              }           
              var htNodeProp = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId);
              if(Object.keys(htNodeProp).length>0){             
                var fdataReq = JSON.parse(htNodeProp).data.pro.request  
                var fdataRes = JSON.parse(htNodeProp).data.pro.response 
                var rmcResult = await this.getRuleMapCustomResult(key,upId,arr,pfjson[i],mode)
                  if (rmcResult.CustomCodeResult != undefined)
                    cmresult = Object.assign(rmcResult.CustomCodeResult)

                  if (rmcResult.PreMapperResult != undefined)
                    cmresult = Object.assign(cmresult, rmcResult.PreMapperResult)

                  if (rmcResult.ProMapperResult != undefined)
                    cmresult = Object.assign(cmresult, rmcResult.ProMapperResult)
                  
                  if (rmcResult.PstMapperResult != undefined)
                    cmresult = Object.assign(cmresult, rmcResult.PstMapperResult)

                  //htresult = Object.assign(htresult, fdataRes)
                  htresult = await this.commonService.responseData(201,fdataRes)
                  if (Object.keys(cmresult).length > 0)
                    htresult = Object.assign(htresult, cmresult)

                for(var y=0; y<pfjson.length; y++){  
                  if(pfjson[y].nodeType == "apinode" || pfjson[y].nodeType == "decisionnode")
                      await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(fdataRes), pfjson[y].nodeId+'.data.pro.request')             
                } 
                
                //logging execution in PElogs
                if(!nodeIdChk.includes(pfjson[i].nodeId)){
                  await this.tecommonService.getTElogs(key, upId, pfjson[i],mode,fdataReq,fdataRes,'PRO')
                  if(mode == 'D' && JSON.parse(htNodeProp).breakPoint == 'Y'){  
                    return {arr,key,upId}
                  } 
                }     
                else{
                  nodeid = pfjson[i].routeArray[0].nodeId;
                }   
                this.logger.log("Humantask node completed...") 
              }    
            }catch(error)
            {          
              //logging Technical Exception in stream
              var techError = await this.tecommonService.getException(pfjson[i],mode,token,key,upId,error,error.status,'PRO')   
              throw new BadRequestException(techError)
            }
          }else{
            //logging Security Exception in stream
            var secError = await this.tecommonService.getsecurityExceptionlogs(pfjson[i],key,upId,mode,token) 
            throw new BadRequestException(secError)            
          }
       }

       // Webhook Node
       if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'webhooknode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) {
        if(mode == 'D' && sflag == 'N')
          var nodeSjson = true
        else 
        var nodeSjson = await this.tecommonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName,mode)
        if(nodeSjson == true){
          try {
            this.logger.log("WebHook node started...")
            var obj = {};
            obj['nodeid'] = pfjson[i].nodeId;
            obj['nodename'] = pfjson[i].nodeName;
            obj['nodetype'] = pfjson[i].nodeType;
            if(!nodeIdChk.includes(pfjson[i].nodeId)){
                arr.push(obj);       
                await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))
            }  
            await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))
            var whnodeprop = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId);
            if(Object.keys(whnodeprop).length>0){            
              var whReq = JSON.parse(whnodeprop).data.pro.request  
              var whurl = JSON.parse(whnodeprop).execution.pro.url  
            
              var eventstream = JSON.parse(whnodeprop).execution.pro.eventStream
              var eventname = whReq.event
              if(eventname == 'OrderCreated'){
                var params ={
                    streamName:eventstream,
                    field:'orders',
                    data:whReq
                }
                await this.commonService.postCall(whurl, params)
                
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
                  await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(paymentData), pfjson[i].nodeId + '.data.pro.response');
                  await this.redisService.setStreamData('EStorePaymentStream','Payment',paymentData)
                
                  var nextnodeid = pfjson[i].routeArray[0].nodeId;              
                  whReq.eventType = 'PaymentMade'
                  await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(whReq), nextnodeid + '.data.pro.request')
                
                  //logging execution in PE stream
                  if(!nodeIdChk.includes(pfjson[i].nodeId)){                     
                    await this.tecommonService.getTElogs(key, upId, pfjson[i],mode,whReq,paymentData,'PRO')
                    if(mode == 'D' && JSON.parse(whnodeprop).breakPoint == 'Y'){  
                      return {arr,key,upId}
                    }  
                  }               
              }
              else if(eventname == 'PaymentMade'){
                  var params ={
                    streamName:eventstream,
                    field:'dispatches',
                    data:whReq
                  }
                  await this.commonService.postCall(whurl, params)               
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
                  await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(dispatchData), pfjson[i].nodeId + '.data.pro.response');
              
                //logging execution in stream
                if(!nodeIdChk.includes(pfjson[i].nodeId)){
                  await this.tecommonService.getTElogs(key, upId, pfjson[i],mode,whReq,dispatchData,'PRO')
                  if(mode == 'D' && JSON.parse(whnodeprop).breakPoint == 'Y'){  
                    return {arr,key,upId}
                  } 
                }              
              }                    
             
              nodeid = pfjson[i].routeArray[0].nodeId;
                                     
              
              this.logger.log("webhook node completed...")
            }
          } catch (error) {
            //logging Technical Exception in stream
            var techError = await this.tecommonService.getException(pfjson[i],mode,token,key,upId,error,error.status,'PRO')
            throw new BadRequestException(techError)
          }
        }else{
          //logging Security Exception in stream 
          var secError = await this.tecommonService.getsecurityExceptionlogs(pfjson[i],key,upId,mode,token)     
          throw new BadRequestException(secError)        
        }
       }

        // Decision Node
        if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'decisionnode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) { 
          this.logger.log("decision node execution started...")
          if(mode == 'D' && sflag == 'N')
            var nodeSjson = true
          else 
          var nodeSjson = await this.tecommonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName,mode)
          if(nodeSjson == true){       
            try{  
                var obj = {};
                obj['nodeid'] = pfjson[i].nodeId;
                obj['nodename'] = pfjson[i].nodeName;
                obj['nodetype'] = pfjson[i].nodeType;
                if(!nodeIdChk.includes(pfjson[i].nodeId)){                                 
                  arr.push(obj);       
                  await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))
                }               
                var cmresult = {}
                var deciresult = {}
  
                var currNode = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId);                         
                if(Object.keys(currNode).length > 0 ){                
                  var rmcResult = await this.getRuleMapCustomResult(key,upId,arr,pfjson[i],mode)


                  if (rmcResult.CustomCodeResult != undefined)
                    cmresult = Object.assign(rmcResult.CustomCodeResult)

                  if (rmcResult.PreMapperResult != undefined)
                    cmresult = Object.assign(cmresult, rmcResult.PreMapperResult)

                  if (rmcResult.ProMapperResult != undefined)
                    cmresult = Object.assign(cmresult, rmcResult.ProMapperResult)
                  
                  if (rmcResult.PstMapperResult != undefined)
                    cmresult = Object.assign(cmresult, rmcResult.PstMapperResult)

                  if(pfjson[i].routeArray.length>0){                  
                    for (var k = 0; k < pfjson[i].routeArray.length; k++) {   
                      // check the rule engine result with process flow result of identification of next node                         
                           
                      if (pfjson[i].routeArray[k].conditionResult ==  rmcResult.ZenResult.ZenResult) {                         
                       // deciresult = Object.assign(deciresult,pfjson[i].routeArray[k])    
                        decirequest = await this.commonService.responseData(201,pfjson[i].routeArray[k])            
                        if(Object.keys(cmresult).length>0) 
                          deciresult =  Object.assign(deciresult,cmresult)
                       
                        await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(deciresult), pfjson[i].nodeId+'.data.pro.response');                          
                        var decirequest = JSON.parse(currNode).data.pro.request 
                                  
                    
                      //logging execution in PElogs
                      if(!nodeIdChk.includes(pfjson[i].nodeId)){                     
                         await this.tecommonService.getTElogs(key, upId, pfjson[i],mode,decirequest,deciresult,'PRO')
                         if(mode == 'D' && JSON.parse(currNode).breakPoint == 'Y'){
                          return {arr,key,upId}
                         }                       
                      }else{  

                        nodeid = pfjson[i].routeArray[k].nodeId;                                     
                      } 
                                    
                      this.logger.log("decision node execution completed..")                     
                      break
                      }
                    }
                  }
                }
              
            }catch(error){
              //logging Technical Exception in stream
              var techError = await this.tecommonService.getException(pfjson[i],mode,token,key,upId,error,error.status,'PRO')
              throw new BadRequestException(techError)
            }    
          }else{
            //logging Security Exception in stream
            var secError = await this.tecommonService.getsecurityExceptionlogs(pfjson[i],key,upId,mode,token)  
            throw new BadRequestException(secError)           
          }   
        }        
     
        // Api Node
        if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'apinode' && pfjson[i].nodeType != 'startnode' && pfjson[i].nodeType != 'endnode') {
          if(mode == 'D' && sflag == 'N')
            var nodeSjson = true
          else 
          var nodeSjson = await this.tecommonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName,mode)
           
          if(nodeSjson == true){
              this.logger.log("Api Node execution started")    
              var apinodeprop = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId);
             if(Object.keys(apinodeprop).length>0){             
              var obj = {};
              obj['nodeid'] = pfjson[i].nodeId;
              obj['nodename'] = pfjson[i].nodeName;
              obj['nodetype'] = pfjson[i].nodeType;

              if(!nodeIdChk.includes(pfjson[i].nodeId)){                
                arr.push(obj);    
                await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))
              }     
              await this.nodePreProcess(key,pfjson[i],upId,mode,token)
              await this.nodeProcess(key,pfjson[i],arr,upId,mode,token,nodeIdChk)
              await this.nodePostProcess(key,pfjson[i],upId,mode,token)

              if(!nodeIdChk.includes(pfjson[i].nodeId)){              
                if(mode == 'D' && JSON.parse(apinodeprop).breakPoint == 'Y'){                                 
                  return {arr,key,upId}
                }
              } else{
                nodeid = pfjson[i].routeArray[0].nodeId;
              }             
                   
              this.logger.log("Api Node execution completed")
             } 
          }else{
            //logging Security Exception in stream
            var secError = await this.tecommonService.getsecurityExceptionlogs(pfjson[i].nodeName,pfjson[i].nodeId,key,upId,token)            
            throw new BadRequestException(secError)
          }
        }      
       
        //  End Node
        if (pfjson[i].nodeType == 'endnode') { 
          var obj = {};
          obj['nodeid'] = pfjson[i].nodeId;
          obj['nodename'] = pfjson[i].nodeName;
          obj['nodetype'] = pfjson[i].nodeType;
          arr.push(obj);      
                   
          // //logging End nodename in stream
          await this.tecommonService.getTElogs(key, upId, pfjson[i],mode)
          break;    
        }
      }
    }
        
    console.log(arr);    
    await this.redisService.setJsonData(key+'response',JSON.stringify(arr))
    return 'Success'      
  }

  async nodePreProcess(key,pfjson,upId,mode,token){
    this.logger.log('Node PreProcessor started!');  
    try{     
    if(pfjson.npcPREFlag){  // set npc
      if(pfjson.npcPREFlag == 'Y'){  
        
        var preNodeProp = JSON.parse( await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId))
          var preReq = preNodeProp.data.pre.request  
          var preRes = preNodeProp.data.pre.response  
          await this.tecommonService.getTElogs(key, upId, pfjson,mode,preReq,preRes,'PRE')
         
        if(pfjson.ipcFlag){ // set ipc
          if(pfjson.ipcFlag != 'N'){ 
            var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty','.'+pfjson.nodeId+ '.data.pre');             
            await this.redisService.setJsonData(key+upId+':IPC:'+ pfjson.ipcFlag +':'+ pfjson.nodeName +'.PRE',setData)
          }
        }
      }
    } 
    }catch(error){
    //logging Technical Exception in stream
    var errorobj = await this.tecommonService.getException(pfjson,mode,token,key,upId,error,error.status,'PRE')     
    throw new BadRequestException(errorobj)
  }
  }

  async nodeProcess(key,pfjson,arr,upId,mode,token,nodeIdChk){    
    this.logger.log('Node Processor started!');      
      try{  
        var cmresult = {}
        var apiresult =  {}      
        var currNode = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId)
      
        if(Object.keys(currNode).length > 0){
          var rmcResult = await this.getRuleMapCustomResult(key,upId,arr,pfjson,mode)
          if(nodeIdChk.includes(pfjson.nodeId)){ 
            var inputparams = JSON.parse(await this.redisService.getJsonDataWithPath(key + upId+':NPC:'+ pfjson.nodeName+'.PRO','.request'))
          }else{
            var inputparams = JSON.parse(currNode).data.pro.request    
          }
             
          var url = JSON.parse(currNode).execution.pro.url  
               
          if (Object.keys(inputparams).length > 0 ) {
            var data = await this.commonService.postCall(url,inputparams)    
           
            if (rmcResult.ZenResult != undefined)
              cmresult = Object.assign(rmcResult.ZenResult)
            if (rmcResult.CustomCodeResult != undefined)
              cmresult = Object.assign(cmresult, rmcResult.CustomCodeResult)
            
            if (rmcResult.PreMapperResult != undefined)
              cmresult = Object.assign(cmresult, rmcResult.PreMapperResult)
          
            if (rmcResult.ProMapperResult != undefined)
              cmresult = Object.assign(cmresult, rmcResult.ProMapperResult)
          
            if (rmcResult.PstMapperResult != undefined)
              cmresult = Object.assign(cmresult, rmcResult.PstMapperResult)    
          
            apiresult = Object.assign(apiresult,data)
            if(Object.keys(cmresult).length>0)  
              apiresult = Object.assign(apiresult,cmresult)           
        
            await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(apiresult), pfjson.nodeId+ '.data.pro.response') 
                   
            // IPC set
            if(pfjson.ipcFlag){
              if(pfjson.ipcFlag != 'N')     
                var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId + '.data.pro');               
              await this.redisService.setJsonData(key+upId+':IPC:'+ pfjson.ipcFlag +':'+ pfjson.nodeName +'.PRO',setData)     
            }           
            if(!nodeIdChk.includes(pfjson.nodeId)){              
              await this.tecommonService.getTElogs(key, upId, pfjson,mode,inputparams,apiresult,'PRO')              
            }   
          }
        }       
          
        }catch(error){   
        //logging Technical Exception in stream
        var secError = await this.tecommonService.getException(pfjson,mode,token,key,upId,error,error.status,'PRO')
        throw new BadRequestException(secError)
      }      
  }

  async nodePostProcess(key,pfjson,upId,mode,token){
    this.logger.log('Node PostProcessor started!');
      try{ 
        if (pfjson.npcPSTFlag){  // set npc
          if (pfjson.npcPSTFlag == 'Y'){      
            
            var pstNodeProp = JSON.parse( await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId))
            var pstReq = pstNodeProp.data.pst.request  
            var pstRes = pstNodeProp.data.pst.response  
            await this.tecommonService.getTElogs(key, upId, pfjson,mode,pstReq,pstRes,'PST')
           
          if(pfjson.ipcFlag){  // set ipc
          if(pfjson.ipcFlag != 'N')  
            var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', + '.'+pfjson.nodeId+ '.data.pst');   
          await this.redisService.setJsonData(key+upId+':IPC:'+ pfjson.ipcFlag +':'+ pfjson.nodeName +'.PST',setData)  
          }
          }
        }   
      }catch(error){  
       //logging Technical Exception in stream
        var errorobj = await this.tecommonService.getException(pfjson,mode,token,key,upId,error,error.status,'PST')     
        throw new BadRequestException(errorobj)
      }    
  }
 
    

  /* Store the form data to humantask node's request
     @param key -  The key used to identify the process flow.
     @param nodeName - The name of the node whose property needs to be updated.
     @param fdata - The form data to be set as the node property.
     @param role  - The role used for process execution.
  */
  async getFormdata(sfkey:any,key:any,upId:any, nodeId:any, nodeName:any, fdata:any,token:any,mode:any,sflag?:any) {
    this.logger.log("Execution getFormData started")
    try{
      var fjson = await this.redisService.getJsonData(key + 'processFlow');
      var fdjson: any = JSON.parse(fjson);
      if(fdjson.length>0){
        for (var z = 0; z < fdjson.length; z++) {
          if (fdjson[z].nodeType == 'humantasknode' && fdjson[z].nodeId == nodeId) {
            await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(fdata), fdjson[z].nodeId + '.data.pro.response')
          }
        }
      }
    

    //call the processs flow execution
    var response = await this.getProcess(sfkey,key,upId,token,mode,sflag)  
    if(response == 'Success')
      return await this.commonService.responseData(201,key+upId)
    else  
    return response;
    }catch(error){
      throw error
    }
    }
    
    

  /* checks if the form data exists in the humantask node's request, else
     it will returns either URL or success message   
     @param key - The key used to identify the process flow.
  */
  async returnformdata(key, upId,mode,token,sflag?,nodeDetails?) {
      this.logger.log("Return formData executed")
      try{
        var nodeSjson;
        const json = await this.redisService.getJsonData(key + 'processFlow');
        var pfjson: any = JSON.parse(json);
        if(pfjson.length>0){
          for (var i = 0; i < pfjson.length; i++) {
            if (pfjson[i].nodeType == 'humantasknode') {
              if(mode == 'D' && sflag == 'N')
                nodeSjson = true
              else 
              nodeSjson = await this.tecommonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName,mode)
              if(nodeSjson == true){
                var mconfig = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId)
                
                var formurl = JSON.parse(mconfig).execution.pro.url 
      
                this.logger.log(formurl)
                var robj = {}
                robj['key'] = key
                robj['upId'] = upId
                robj['nodeId'] = pfjson[i].nodeId
                robj['nodeName'] = pfjson[i].nodeName
                robj['url'] = formurl
                robj['mode'] = mode
      
                //returns the URL if request data doesn't exist       
                var req = JSON.parse(mconfig).data.pro.response
                if (Object.keys(req).length == 0) {
                  return robj;
                }
              } 
              else{
                //logging Security Exception in stream
                var secError = await this.tecommonService.getsecurityExceptionlogs(pfjson[i],key,upId,mode,token)         
                throw new BadRequestException(secError)
              }         
            }
          }
        }      
        return 'Success'   
      }catch(error){
        throw error
      }
  }
      

  /* Executes the process flow based on a given valid key and role check
     @param key  - The key used to identify the process flow.  
     @param role - Check if the incoming role had a permission to enter this method
  */
  async getProcess(sfkey,key,upId,token,mode,sflag?) {  //GSS-DEV:WPS:IPP:PF:payment:v1:

    this.logger.log("Torus Process Engine Started....") 
    try {  
      if(mode == 'D' && sflag == 'N'){
        const pfjson = JSON.parse(await this.redisService.getJsonData(key + 'processFlow'));
        var formjson = await this.returnformdata(key, upId, mode,token,sflag)
          await this.pfPreProcessor(key, upId,pfjson,mode,token);
          if (formjson == 'Success') {         
            var pfresponse = await this.pfProcessor(key, upId,token,mode,pfjson,sflag);
            await this.pfPostProcessor(key, upId,pfjson,mode,token);  
            return pfresponse
          }
          else {      
            return { status: 200, data: formjson };
          }
      }
      else{
      const decoded =  this.jwtService.decode(token,{ json: true })        
      var psjson:any = await this.commonService.getSecurityJson(sfkey,decoded);    
      if(typeof psjson !== 'object') {
        return psjson
      }
      var sjson = await this.tecommonService.getPSJson(key,decoded,psjson)       
            
      if(typeof sjson !== 'object') {
        return sjson
      }
      var incomingarr = sjson['PFaction']   
      var flag = sjson['PFflag']
      var flgpermit

      if(flag == 'E') {

        if(mode == 'E')
          flgpermit = incomingarr.includes('Execute') || incomingarr.includes('*')        
        if(mode == 'D')
          flgpermit = incomingarr.includes('Debug') || incomingarr.includes('*')        
        
        if(flgpermit){
          if(mode == 'E')
            return {status:400,err:"Permission Denied to Execute"}          
          if(mode == 'D')
            return {status:400,err:"Permission Denied to Debug"}
        }   
      }
      else if(flag == 'A') {
        if(mode == 'E')
          flgpermit = incomingarr.includes('Execute') || incomingarr.includes('*')        
        if(mode == 'D')
          flgpermit = incomingarr.includes('Debug') || incomingarr.includes('*')        
      
        if(!flgpermit){
          if(mode == 'E')
            return {status:400,err:"Permission Denied to Execute"}          
          if(mode == 'D')
            return {status:400,err:"Permission Denied to Debug"}
        }        
        else {
        const pfjson = JSON.parse(await this.redisService.getJsonData(key + 'processFlow'));
        var formjson = await this.returnformdata(key, upId, mode,token,sflag,sjson['Node'])
          await this.pfPreProcessor(key, upId,pfjson,mode,token);
          if (formjson == 'Success') {         
            var pfresponse = await this.pfProcessor(key, upId, token,mode,pfjson,sflag,sjson['Node']);
            await this.pfPostProcessor(key, upId,pfjson,mode,token);  
            return pfresponse
          }
          else {      
            return { status: 200, data: formjson };
          }
        }      
      } 
    } 
    }catch (error) {          
      throw error
    }
  }

  // -----------------------------pfPreProcessor--------------------------------------

  /* Checks Processflow json along with all nodes having config, 
     workflow and setting placeholder for NPC,IPC
     @param key - The key used to identify the process flow.
  */
  async pfPreProcessor(key, upId,pfjson,mode,token) {
    this.logger.log('Pf PreProcessor started!');
    try {
      var placeholder = {"request":{},"response":{},"exception":{}}   
          
      if(pfjson.length>0){
        for (var i = 0; i < pfjson.length; i++) {
          if (pfjson[i].nodeType != 'startnode' && pfjson[i].nodeType != 'endnode') {
            //set npc, ipc placeholders
            await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson[i].nodeName + '.PRE', JSON.stringify(placeholder))
            await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson[i].nodeName + '.PRO', JSON.stringify(placeholder))
            await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson[i].nodeName + '.PST', JSON.stringify(placeholder))
  
            if (pfjson[i].ipcFlag) {
              if (pfjson[i].ipcFlag != 'N') {
  
                await this.redisService.setJsonData(key + upId + ':IPC:' + pfjson[i].ipcFlag + ':' + pfjson[i].nodeName + '.PRE', JSON.stringify(placeholder))
                await this.redisService.setJsonData(key + upId + ':IPC:' + pfjson[i].ipcFlag + ':' + pfjson[i].nodeName + '.PRO', JSON.stringify(placeholder))
                await this.redisService.setJsonData(key + upId + ':IPC:' + pfjson[i].ipcFlag + ':' + pfjson[i].nodeName + '.PST', JSON.stringify(placeholder))
              }
            }
          }
        }
      }
      
      this.logger.log("pf Preprocessor completed")
      return 'Success'
    } catch (error) {
      var techError = await this.tecommonService.getException(pfjson[i],mode,token,key,upId,error,error.status,'PRE')      
      await this.redisService.setJsonData(key + upId + ':ERR:' + pfjson[i].nodeName, JSON.stringify(techError))
      throw new BadRequestException(techError)
    }
  }

  // --------------------------------pfProcessor--------------------------------------

  /* Process flow Execution by iterating through the all the nodes 
     and executing the corresponding logic for each node type.
     @param key - The key used to identify the process flow.  
  */
  async pfProcessor(key, upId, token,mode,pfjson,sflag?,nodeDetails?) {
    this.logger.log('Pf Processor started!');
      var arr = [];
      var nodeid;   
    
      if(pfjson.length>0){
        for (var i = 0; i < pfjson.length; i++) {

          // Start Node
          if (pfjson[i].nodeType == 'startnode') {
            var sobj = {};
            sobj['nodeid'] = pfjson[i].nodeId;
            sobj['nodename'] = pfjson[i].nodeName;
            sobj['nodetype'] = pfjson[i].nodeType;
            arr.push(sobj);
            await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))

            // //logging nodename in stream        
            await this.tecommonService.getTElogs(key, upId, pfjson[i],mode)
            nodeid = pfjson[i].routeArray[0].nodeId;
          }

          // Humantask node        
          if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'humantasknode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) {     
            if(mode == 'D' && sflag == 'N')
            var nodeSjson = true
            else
            var nodeSjson = await this.tecommonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName,mode)          
            if(nodeSjson == true){   
              try {
                this.logger.log("Humantask node started...")
                var hobj = {};
                var cmresult = {};
                var htresult = {};

                hobj['nodeid'] = pfjson[i].nodeId;
                hobj['nodename'] = pfjson[i].nodeName;
                hobj['nodetype'] = pfjson[i].nodeType;
                arr.push(hobj);
                await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr)) 

                var htNodeProp = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId);    
                if(Object.keys(htNodeProp).length > 0){                   

                  var fdataReq = JSON.parse(htNodeProp).data.pro.request  
                  var fdataRes = JSON.parse(htNodeProp).data.pro.response 

                  var rmcResult = await this.getRuleMapCustomResult(key,upId,arr,pfjson[i],mode)
                  if (rmcResult.CustomCodeResult != undefined)
                    cmresult = Object.assign(rmcResult.CustomCodeResult)

                  if (rmcResult.PreMapperResult != undefined)
                    cmresult = Object.assign(cmresult, rmcResult.PreMapperResult)

                  if (rmcResult.ProMapperResult != undefined)
                    cmresult = Object.assign(cmresult, rmcResult.ProMapperResult)
                  
                  if (rmcResult.PstMapperResult != undefined)
                    cmresult = Object.assign(cmresult, rmcResult.PstMapperResult)

                  //htresult = Object.assign(htresult, fdataRes)
                  htresult = await this.commonService.responseData(201,fdataRes)
                  if (Object.keys(cmresult).length > 0)
                    htresult = Object.assign(htresult, cmresult)

                  if(pfjson.length > 0){
                    for (var y = 0; y < pfjson.length; y++) {
                      if (pfjson[y].nodeType != "startnode" || pfjson[y].nodeType != "endnode") //pfjson[y].nodeType == "apinode" || pfjson[y].nodeType == "decisionnode")
                        await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(fdataRes), pfjson[y].nodeId + '.data.pro.request')
                    } 
                  }                          
                
                  //logging execution in stream
                  await this.tecommonService.getTElogs(key, upId, pfjson[i],mode,fdataReq,htresult,'PRO')
                
                  if(mode == 'D' && JSON.parse(htNodeProp).breakPoint == 'Y'){  
                    return {arr,key,upId}
                  }           
                  else{
                    nodeid = pfjson[i].routeArray[0].nodeId;
                  } 
                }
                this.logger.log("Humantask node completed...")
              } catch (error) {            
                //logging Technical Exception in stream
                var techError = await this.tecommonService.getException(pfjson[i],mode,token,key,upId,error,error.status,'PRO')
                throw new BadRequestException(techError)
              }
            }else{
              //logging Security Exception in stream
              var secError = await this.tecommonService.getsecurityExceptionlogs(pfjson[i],key,upId,mode,token)             
              throw new BadRequestException(secError)
            }
          }

          // Webhook Node
          if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'webhooknode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) {
            if(mode == 'D' && sflag == 'N')
              var nodeSjson = true
            else
            var nodeSjson = await this.tecommonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName,mode)
            if(nodeSjson == true){
              try {
                this.logger.log("WebHook node started...")
                var whobj = {};
                whobj['nodeid'] = pfjson[i].nodeId;
                whobj['nodename'] = pfjson[i].nodeName;
                whobj['nodetype'] = pfjson[i].nodeType;
                arr.push(whobj);
                await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))
                var whnodeprop = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId);
                if(Object.keys(whnodeprop).length > 0){  
                  var whReq = JSON.parse(whnodeprop).data.pro.request  
                  var whurl = JSON.parse(whnodeprop).execution.pro.url 
                 
                  var eventstream = JSON.parse(whnodeprop).execution.pro.eventStream
                  var eventname = whReq.event

                  if(eventname == 'OrderCreated'){
                    this.logger.log("event started...")
                    var orderParams ={
                        streamName:eventstream,
                        field:'orders',
                        data:whReq
                    }
                    await this.commonService.postCall(whurl, orderParams)   

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
                      await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(paymentData), pfjson[i].nodeId + '.data.pro.response');
                      await this.redisService.setStreamData('EStorePaymentStream','Payment',paymentData)
                    
                      var nextnodeid = pfjson[i].routeArray[0].nodeId;                     
                      whReq.event = 'PaymentMade'
                      await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(whReq), nextnodeid + '.data.pro.request')
                    
                      //logging execution in PE stream
                      await this.tecommonService.getTElogs(key, upId, pfjson[i],mode,whReq,paymentData,'PRO')
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
                     await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(dispatchData), pfjson[i].nodeId + '.data.pro.response');
                   
                    //logging execution in stream
                    await this.tecommonService.getTElogs(key, upId, pfjson[i],mode,whReq,dispatchData,'PRO')
                    this.logger.log("event completed...")
                  }
                
                  if(mode == 'D' && JSON.parse(whnodeprop).breakPoint == 'Y'){  
                    return {arr,key,upId}
                  }else{
                    nodeid = pfjson[i].routeArray[0].nodeId;
                  } 
                }                 
                this.logger.log("webhook node completed...")
              } catch (error) {
                //logging Technical Exception in stream
                var techError = await this.tecommonService.getException(pfjson[i],mode,token,key,upId,error,error.status,'PRO')
                throw new BadRequestException(techError)
              }
            }else{
              //logging Security Exception in stream 
              var secError = await this.tecommonService.getsecurityExceptionlogs(pfjson[i],key,upId,mode,token) 
              throw new BadRequestException(secError)            
            }
          }

          // Decision Node
          if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'decisionnode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) {
            this.logger.log("decision node execution started...")
            if(mode == 'D' && sflag == 'N')
              var nodeSjson = true
            else
            var nodeSjson = await this.tecommonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName,mode)
          
            if(nodeSjson == true){
              try {
                var dobj = {};
                dobj['nodeid'] = pfjson[i].nodeId;
                dobj['nodename'] = pfjson[i].nodeName;
                dobj['nodetype'] = pfjson[i].nodeType;
                arr.push(dobj);
                await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))
               
                var cmresult = {}
                var deciresult = {}  

                var deciNodeProp = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId);
             
                if(Object.keys(deciNodeProp).length > 0){      


                  var rmcResult = await this.getRuleMapCustomResult(key,upId,arr,pfjson[i],mode)
                              
                  if (rmcResult.CustomCodeResult != undefined)
                    cmresult = Object.assign(rmcResult.CustomCodeResult)

                  if (rmcResult.PreMapperResult != undefined)
                    cmresult = Object.assign(cmresult, rmcResult.PreMapperResult)

                  if (rmcResult.ProMapperResult != undefined)
                    cmresult = Object.assign(cmresult, rmcResult.ProMapperResult)
                  
                  if (rmcResult.PstMapperResult != undefined)
                    cmresult = Object.assign(cmresult, rmcResult.PstMapperResult)

                  if(pfjson[i].routeArray.length>0){
                    for (var k = 0; k < pfjson[i].routeArray.length; k++) {
                      // check the rule engine result with process flow result of identification of next node 
                      if (pfjson[i].routeArray[k].conditionResult == rmcResult.ZenResult.ZenResult) {  
                        //deciresult = Object.assign(deciresult, pfjson[i].routeArray[k])
                        deciresult = await this.commonService.responseData(201,pfjson[i].routeArray[k])
                        if (Object.keys(cmresult).length > 0)
                          deciresult = Object.assign(deciresult, cmresult)                       
                        await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(deciresult), pfjson[i].nodeId + '.data.pro.response');
      
                        var decirequest = JSON.parse(deciNodeProp).data.pro.request 
                        //logging Execution in PE stream
                        await this.tecommonService.getTElogs(key, upId, pfjson[i],mode,decirequest,deciresult,'PRO')  
                       
                        if(mode == 'D' && JSON.parse(deciNodeProp).breakPoint == 'Y'){  
                          return {arr,key,upId}
                        }else{
                          nodeid = pfjson[i].routeArray[k].nodeId;
                        }                                                        
                        this.logger.log("decision node execution completed..")
                        break
                      }
                    }
                  }
                }  
              } catch (error) {
                //logging Technical Exception in stream
                var techError = await this.tecommonService.getException(pfjson[i],mode,token,key,upId,error,error.status,'PRO')
                throw new BadRequestException(techError)
              }
            }else{
              //logging Security Exception in stream
              var secError = await this.tecommonService.getsecurityExceptionlogs(pfjson[i],key,upId,mode,token)            
              throw new BadRequestException(secError)
            }
          }

          // Api Node
          if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'apinode' && pfjson[i].nodeType != 'startnode' && pfjson[i].nodeType != 'endnode') {
            if(mode == 'D' && sflag == 'N')
              var nodeSjson = true
            else
            var nodeSjson = await this.tecommonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName,mode)
          
            if(nodeSjson == true){
              this.logger.log("Api Node execution started")
                var apinodeprop = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId);
                if(Object.keys(apinodeprop).length>0){            
                  
                  var obj = {};
                  obj['nodeid'] = pfjson[i].nodeId;
                  obj['nodename'] = pfjson[i].nodeName;
                  obj['nodetype'] = pfjson[i].nodeType;
                  arr.push(obj);
                  await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))
                  await this.nodePreProcessor(key, pfjson[i], upId,mode,token)
                  await this.nodeProcessor(key, pfjson[i], arr, upId,mode,token)
                  await this.nodePostProcessor(key, pfjson[i], upId,mode,token)
                
                  if(mode == 'D' && JSON.parse(apinodeprop).breakPoint == 'Y'){  
                    return {arr,key,upId}
                  }else{
                    nodeid = pfjson[i].routeArray[0].nodeId;
                }     
                this.logger.log("Api Node execution completed")         
                }
              }else{
              //logging Security Exception in stream
              var secError = await this.tecommonService.getsecurityExceptionlogs(pfjson[i].nodeName,pfjson[i].nodeId,key,upId,token)             
              throw new BadRequestException(secError)
            }
          }

          // End node
          if (pfjson[i].nodeType == 'endnode') {
            var obj = {};
            obj['nodeid'] = pfjson[i].nodeId;
            obj['nodename'] = pfjson[i].nodeName;
            obj['nodetype'] = pfjson[i].nodeType;
            arr.push(obj);
          
            // //logging End nodename in stream
            await this.tecommonService.getTElogs(key, upId, pfjson[i],mode)
            break;
          }
        }
      }     
      console.log(arr);

      await this.redisService.setJsonData(key + 'response', JSON.stringify(arr))    
      this.logger.log('Pf Processor completed!');  
      return 'Success'    
    }
   
    

  // -----------------------------NodePreProcessor--------------------------------------

  /* Performs pre-processing tasks (make avaiable Pre data in NPC,IPC) for a specific node
     @params key    - The key passed to identify the particular node in process flow.
     @params pfjson - This variable holding the values of parsed process flow json 
  */
     async nodePreProcessor(key, pfjson, upId,mode,token) {
      this.logger.log('Node PreProcessor started!');
      try {
        if (pfjson.npcPREFlag) {  // set npc
          if (pfjson.npcPREFlag == 'Y') {
            var preNodeProp = JSON.parse( await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId))
            var preReq = preNodeProp.data.pre.request  
            var preRes = preNodeProp.data.pre.response  
            await this.tecommonService.getTElogs(key, upId, pfjson,mode,preReq,preRes,'PRE')
           
  
             if (pfjson.ipcFlag) { // set ipc
              if (pfjson.ipcFlag != 'N') {
                var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId + '.data.pre');
                await this.redisService.setJsonData(key + upId + ':IPC:' + pfjson.ipcFlag + ':' + pfjson.nodeName + '.PRE', setData)
              }
            }
          }
        }
  
      } catch (error) {
        //logging Technical Exception in stream
        var errorobj = await this.tecommonService.getException(pfjson,mode,token,key,upId,error,error.status,'PRE')     
        throw new BadRequestException(errorobj)
      }
    }

  // --------------------------------NodeProcessor--------------------------------------

  /* Performs API call (make avaiable Pro data in NPC,IPC) for a specific node
     @params key    - The key passed to identify the particular node in process flow.
     @params pfjson - This variable holding the values of parsed process flow json       
  */
  async nodeProcessor(key, pfjson, arr, upId,mode,token) {
    this.logger.log('Node Processor started!');
    try {
      var cmresult = {}
      var apiresult = {}
      var apiNodeProp = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId)
     
      if(Object.keys(apiNodeProp).length > 0){

        var rmcResult = await this.getRuleMapCustomResult(key,upId,arr,pfjson,mode)
        var apireq = JSON.parse(apiNodeProp).data.pro.request
        var url = JSON.parse(apiNodeProp).execution.pro.url  

        if (Object.keys(apireq).length > 0 ) {
          var data = await this.commonService.postCall(url,apireq)        
        }    
      
      if (rmcResult.ZenResult != undefined)
        cmresult = Object.assign(rmcResult.ZenResult)

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
     
        await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(apiresult), pfjson.nodeId + '.data.pro.response')
     
      // IPC set
      if (pfjson.ipcFlag) {
        if (pfjson.ipcFlag != 'N') {
          var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId + '.data.pro');
          await this.redisService.setJsonData(key + upId + ':IPC:' + pfjson.ipcFlag + ':' + pfjson.nodeName + '.PRO', setData)
        }
      }
     
      //logging Execution in stream
      await this.tecommonService.getTElogs(key, upId, pfjson,mode,apireq,apiresult,'PRO')
      }
    } catch (error) { 
      //logging Technical Exception in stream   
      var secError = await this.tecommonService.getException(pfjson,mode,token,key,upId,error,error.status,'PRO')
      throw new BadRequestException(secError)  
    }
  }

  // -----------------------------NodePostProcessor--------------------------------------

  /* Performs post-processing tasks (make avaiable Post data in NPC,IPC) for a specific node
     @params key    - The key passed to identify the particular node in process flow.
     @params pfjson - This variable holding the values of parsed process flow json 
  */
     async nodePostProcessor(key, pfjson, upId,mode,token) {
      this.logger.log('Node PostProcessor started!');
      try {
        if (pfjson.npcPSTFlag) {  // set npc
          if (pfjson.npcPSTFlag == 'Y') {
            
            var pstNodeProp = JSON.parse( await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId))
            var pstReq = pstNodeProp.data.pst.request  
            var pstRes = pstNodeProp.data.pst.response  
            await this.tecommonService.getTElogs(key, upId, pfjson,mode,pstReq,pstRes,'PST')
           
            if (pfjson.ipcFlag) {  // set ipc
              if (pfjson.ipcFlag != 'N')
                var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', + '.' + pfjson.nodeId + '.data.pst');
                await this.redisService.setJsonData(key + upId + ':IPC:' + pfjson.ipcFlag + ':' + pfjson.nodeName + '.PST', setData)
            }
          }
        }
  
      } catch (error) {
       //logging Technical Exception in stream
       var errorobj = await this.tecommonService.getException(pfjson,mode,token,key,upId,error,error.status,'PST')     
       throw new BadRequestException(errorobj)
      }
    }
  // -----------------------------pfPostProcessor--------------------------------------

  /* Perform garbage clean logic and calling external API
     @params key -  The key passed to identify the particular node in process flow.
  */
  async pfPostProcessor(key, upId,pfjson,mode,token) {
    this.logger.log('Pf PostProcessor started!');
    try{

      //Node's response would be cleared when execution is completed      
      if(pfjson.length > 0){
        // for (var i = 0; i < pfjson.length; i++) {       
        //   await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify({}), pfjson[i].nodeId + '.data.pro.response')      
        // }
      }  
      var keys = await this.redisService.getKeys(key + upId)
      if(keys.length > 0){
        for (var k = 0; k < keys.length; k++) {     
          await this.redisService.expire(keys[k],10000)
        }
      }      
     this.logger.log('Pf PostProcessor completed!');  //86400 secs = 1 day 'Datafabrics:TorusPOC:StreamTest:v2:cr5tw08ezv8jbt7173jg:NPC:Input.PST',                                       
    } catch(error){                                   //18000 secs = 5 hrs
      var techError = await this.tecommonService.getException(pfjson,mode,token,key,upId,error,error.status,'PST')
      throw new BadRequestException(techError)
    }                                              
  }

  async getRuleMapCustomResult(key, upId,arr,pfjson,mode){
    this.logger.log('GetRuleMapCustomResult started!');      
      var c, z, mpre, mpro, mpst = 0;
 
      var apiNodeProp = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId)
    
      var custconf = JSON.parse(apiNodeProp).customCode
      if (custconf) {
        if (custconf.request.code) {
          var codedata = custconf.request.code          
          var coderesult = await this.tecommonService.customCodeProcess(key,upId, codedata,arr,mode);
          c = 1;
          var cusCodeResponse = { "CustomCodeResult": coderesult }    
            
        }
      }
      var ruleChk = JSON.parse(apiNodeProp).rule
      if (ruleChk) {
        var zenresult = await this.tecommonService.zenrule(key,upId,ruleChk,pfjson,mode)
        z = 1;
        var zenResponse = { "ZenResult": zenresult }
      }
      var mapper = JSON.parse(apiNodeProp).mapper  
      if (mapper) {                    
        if(Object.keys(mapper.pre.mapData).length > 0){
          var mapperconfig = JSON.parse(apiNodeProp).mapper.pre
          var premapperResult = await this.tecommonService.getMapper(mapperconfig)
          mpre = 1;        
         
        }        
        if(Object.keys(mapper.pro.mapData ).length > 0){
          var mapperconfig = JSON.parse(apiNodeProp).mapper.pro
          var promapperResult = await this.tecommonService.getMapper(mapperconfig)
          mpro = 1;        
        }      
        if(Object.keys( mapper.pst.mapData).length > 0){
          var mapperconfig = JSON.parse(apiNodeProp).mapper.pst
          var pstmapperResult = await this.tecommonService.getMapper(mapperconfig)
          mpst = 1;        
        }
      }
            
      return { "CustomCodeResult": cusCodeResponse, "ZenResult": zenResponse , "PreMapperResult": premapperResult,"ProMapperResult": promapperResult,"PstMapperResult": pstmapperResult} ;
     
    }
 
}


