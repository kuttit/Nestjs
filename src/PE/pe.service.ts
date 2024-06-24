import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
const  Xid = require('xid-js');
import { RedisService } from 'src/redisService';
import { PeCommonService } from './peCommonService';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import { CommonService } from 'src/commonService';


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
export class PeService { 
  constructor(   
    private readonly commonService: PeCommonService,
    private readonly comnService: CommonService,
    private readonly  redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}
  private readonly logger = new Logger(PeService.name);
  
  async getPeStream(sfkey,key,token) {
    this.logger.log("PE Stream Started")
    try {
      //Unique Process Id created for every execution

      var upId = Xid.next()   
      var pKey, pId, pToken

      const PECredentials= {
        sessionInfo:token,     
        processInfo: {
          key: key,
          pId: upId
        }
      }
      await this.redisService.setStreamData('PEStream', 'PEField', JSON.stringify(PECredentials))
      var grpInfo = await this.redisService.getInfoGrp('PEStream')
      if(grpInfo.length == 0){
        await this.redisService.createConsumerGroup('PEStream','PEGroup')
      }else if(!grpInfo[0].includes('PEGroup')){
        await this.redisService.createConsumerGroup('PEStream','PEGroup')    
      } 
        let msg1:any = await this.redisService.readConsumerGroup('PEStream','PEGroup','Consumer1');
        for(var s=0;s<msg1.length;s++){
          var msgid = msg1[s].msgid;
          var data = msg1[s].data        

            pToken = JSON.parse(data[1]).sessionInfo 
            pKey = JSON.parse(data[1]).processInfo.key
            pId = JSON.parse(data[1]).processInfo.pId  
        }
      
        var artifact = pKey.split(':')[4]
       
        if(artifact == 'SSH'){
         
          var sreq = JSON.parse(await this.redisService.getJsonData(key+'nodeProperty')) 
          if(sreq != null){
           
          var robj = {}
          robj['key'] = pKey
          robj['upId'] = pId
          robj['nodeId'] = sreq.nodeId
          robj['nodeName'] = sreq.nodeName         
          robj['mode'] = 'E'
          return await this.comnService.responseData(201,robj)
          }
        }
        else{
        var result:any = await this.getProcess(sfkey,pKey,pId,pToken)

        if(result == 'Success'){
          await this.redisService.ackMessage('PEStream', 'PEGroup', msgid);
          this.logger.log("PE Stream completed")
          return await this.comnService.responseData(201,key+upId)
        }
        else if(result.status == 200){
          this.logger.log("PE Stream completed")
          return await this.comnService.responseData(201,result.url)
        }  
        else{
          return result
        } 
      }
    } catch (error) {
      console.log("PE STREAM ERROR: ", error);
      throw error;
    }        
    }
 
  async staticCodeExec(sfkey,key,upId,nodeId,nodeName,reqdata,token){
    this.logger.log("static code execution started")
    try{
   // var sdata = await this.getPid(token,key)  
    var sreq = JSON.parse(await this.redisService.getJsonData(key+'nodeProperty')) 
     
    var placeholder = {"request":{},"response":{},"exception":{}}   
    await this.redisService.setJsonData(key + upId + ':NPC:' + nodeName + '.PRE', JSON.stringify(placeholder)) 
    await this.redisService.setJsonData(key + upId + ':NPC:' + nodeName + '.PRO', JSON.stringify(placeholder)) 
    await this.redisService.setJsonData(key + upId + ':NPC:' + nodeName + '.PST', JSON.stringify(placeholder)) 
    if(sreq.nodeType == "postnode"){   
       await this.redisService.setJsonData(key+'nodeProperty',JSON.stringify(reqdata),'data.pro.request') 
       await this.redisService.setJsonData(key + upId + ':NPC:' + nodeName + '.PRO',JSON.stringify(reqdata),'request')    
      var url = sreq.execution.pro.url      
      var resdata = await this.comnService.postCall(url,JSON.stringify(reqdata))     
      await this.redisService.setJsonData(key+'nodeProperty',JSON.stringify(resdata),'data.pro.response')
      await this.redisService.setJsonData(key +upId + ':NPC:' + nodeName + '.PRO',JSON.stringify(resdata),'response')          
    }
    var deci = {};
    deci['nodeName'] = sreq.nodeName;
    deci['nodeId'] = sreq.nodeId;
    deci['nodeType'] = sreq.nodeType;
    deci['request'] = reqdata;
    deci['response'] = resdata; 
    await this.redisService.setStreamData('TElogs', key + upId, JSON.stringify(deci));  
    return await this.comnService.responseData(201,key + upId)
  
  }
  catch(err){
    var exception = await this.comnService.commonErrorLogs('TE',token,key,err,err.status)
    throw exception
  }
  }

  async getPid(token,key){
    try{
    var upId = Xid.next()   
      var pKey, pId, pToken

      const PECredentials= {
        sessionInfo:token,     
        processInfo: {
          key: key,
          pId: upId
        }
      }
      await this.redisService.setStreamData('PEStream', 'PEField', JSON.stringify(PECredentials))
      var grpInfo = await this.redisService.getInfoGrp('PEStream')
      if(grpInfo.length == 0){
        await this.redisService.createConsumerGroup('PEStream','PEGroup')
      }else if(!grpInfo[0].includes('PEGroup')){
        await this.redisService.createConsumerGroup('PEStream','PEGroup')    
      } 
        let msg1:any = await this.redisService.readConsumerGroup('PEStream','PEGroup','Consumer1');
        for(var s=0;s<msg1.length;s++){
          var msgid = msg1[s].msgid;
          var data = msg1[s].data        

            pToken = JSON.parse(data[1]).sessionInfo 
            pKey = JSON.parse(data[1]).processInfo.key
            pId = JSON.parse(data[1]).processInfo.pId  
        }
      //  return {token:pToken,key:pKey,upId:pId}
        return {pToken,pKey,pId}
      }catch(err){
        var exception = await this.comnService.commonErrorLogs('TE',token,key,err,err.status)
        throw exception
      }
  }
  async resumeProcess(sfkey,key,upid,token){
    
    const decoded =  this.jwtService.decode(token,{ json: true })     
    var psjson:any = await this.comnService.getSecurityJson(sfkey,decoded);    
    if(typeof psjson !== 'object') {
      return psjson
    }
    var sjson = await this.commonService.getPSJson(key,decoded,psjson)       
          
    if(typeof sjson !== 'object') {
      return sjson
    }
    var incomingarr = sjson['PFaction']   
    var flag = sjson['PFflag']
    var permit
    if(flag == 'E') {
      permit = incomingarr.includes('Resume') || incomingarr.includes('*')
      if(permit){
        return {status:400,err:"Permission Denied to Resume"}  
      }   
    } else if(flag == 'A') {
      permit = incomingarr.includes('Resume') || incomingarr.includes('*')    
      if(!permit)
        return {status:400,err:"Permission Denied to Resume"}
      else{
        var nodeInfo = await this.getNodeInfo(key+upid)
        var nodeId = nodeInfo[0]
        var arr = nodeInfo[1]  
   
        var continueResponse = await this.Processor(key,upid,nodeId,arr,sjson['Node'])    
       // await this.pfPostProcess(key, upid);     
        console.log(continueResponse);
        
        if(continueResponse == 'Success'){    
         return { status: 201, data: key + upid };
        }
      }
    }
     
  }

  async getNodeInfo(feild:any){   
    var entries = await this.redisService.getStreamRange("TPEExceptionlogs") 
    var result = [];
    var response = []
      for (let entry of entries) {
        var [id, data] = entry;      
        var entryData = {};
        for (let i = 0; i < data.length; i += 2) {
          entryData[data[i]] = data[i + 1];
        }
        if (entryData[feild]) {
          result.push(JSON.parse(entryData[feild]));         
        }            
      }
      for(let k=0;k<result.length;k++){
        response.push(result[k].nodeId)  
        response.push(result[k].previousArray)          
      }  
   return response;  
  } 

  async Processor(key,upId,nodeId,arr,nodeDetails) {
    this.logger.log('Continue Pf Processor started!');   
    try{       
    var nodeid = nodeId
    var nodeIdChk =[]
    for(let p=0;p<arr.length;p++){
      nodeIdChk.push(arr[p].nodeid)      
    }  
   
    const json = await this.redisService.getJsonData( key + 'processFlow'); 
    var pfjson: any = JSON.parse(json);     
    
    for (var i = 0; i < pfjson.length; i++) {  

      // Humantask node
      if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'humantasknode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) { 
        var nodeSjson = await this.commonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName)        
        if(nodeSjson == true){        
          try{
          this.logger.log("Humantask node started...")      
            var obj = {};
            obj['nodeid'] = pfjson[i].nodeId;
            obj['nodename'] = pfjson[i].nodeName;
            obj['nodetype'] = pfjson[i].nodeType;                     
            if(!nodeIdChk.includes(pfjson[i].nodeId)){
              arr.push(obj);       
            }           
          
            var fdataReq = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId+'.data.pro.request'));
            var fdataRes = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId+'.data.pro.response'));       
                  
            for(var y=0; y<pfjson.length; y++){  
              if(pfjson[y].nodeType == "apinode" || pfjson[y].nodeType == "decisionnode")
                  await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(fdataRes), pfjson[y].nodeId+'.data.pro.request')             
            } 
            var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty','.'+pfjson[i].nodeId+ '.data.pro');  
            await this.redisService.setJsonData(key+upId+':NPC:'+ pfjson[i].nodeName +'.PRO',setData)                                  
            
            //logging execution in PElogs
            await this.commonService.getPElogs(key, upId, pfjson[i].nodeName,pfjson[i].nodeId,pfjson[i].nodeType,fdataReq,fdataRes)
            
            nodeid = pfjson[i].routeArray[0].nodeId; 
          
            this.logger.log("Humantask node completed...")       
          }catch(error)
          {          
            //logging Technical Exception in TPEExceptionlogs
            var exception = await this.commonService.getExceptionlogs(error,error.status,pfjson[i].nodeName,pfjson[i].nodeId,arr,key,upId,'NPC','PRO')
            throw new BadRequestException(exception)
          }
        }else{
          //logging Security Exception in TPEExceptionlogs
          var secException = await this.commonService.getsecurityExceptionlogs(pfjson[i].nodeName,pfjson[i].nodeId,key,upId)
          throw new UnauthorizedException(secException)
        }
      }
     
      // Decision Node
      if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'decisionnode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) { 
        this.logger.log("decision node execution started...")
        var nodeSjson = await this.commonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName)
        if(nodeSjson == true){       
          try{  
              var obj = {};
              obj['nodeid'] = pfjson[i].nodeId;
              obj['nodename'] = pfjson[i].nodeName;
              obj['nodetype'] = pfjson[i].nodeType;
              if(!nodeIdChk.includes(pfjson[i].nodeId)){
                arr.push(obj);       
              }
              var decirequest          
              var resData; 
              var cmresult = {}
              var deciresult = {statuscode: 200,status: 'SUCCESS'}

              var currNode = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId);                         
            
              var ruleChk = JSON.parse(currNode).rule         
              if(ruleChk){
                var zenresult = await this.commonService.zenrule(key,ruleChk,pfjson[i].nodeId)               
              }  
              var c=0;
              var custconf = JSON.parse(currNode).customCode 
              if(custconf){            
                if(custconf.request.code){
                  var codedata = custconf.request.code
                  var coderesult = await this.commonService.customCodeProcess(key,codedata,arr);
                  c=1;
                  var cusCodeResponse = {"CustomCodeResult":coderesult}   
                }
              }
              var mpre,mpro,mpst = 0;    
     
              var mapper = JSON.parse(currNode).mapper   
              if (mapper) {                    
                if(Object.keys(mapper.pre.mapData).length > 0){
                  var mapperconfig = JSON.parse(currNode).mapper.pre
                  var premapperResult = await this.commonService.getMapper(mapperconfig) 
                  mpre = 1;        
                 
                }         
                if(Object.keys(mapper.pro.mapData ).length > 0){
                  var mapperconfig = JSON.parse(currNode).mapper.pro
                  var promapperResult = await this.commonService.getMapper(mapperconfig) 
                  mpro = 1;         
                }      
                if(Object.keys( mapper.pst.mapData).length > 0){
                  var mapperconfig = JSON.parse(currNode).mapper.pst
                  var pstmapperResult = await this.commonService.getMapper(mapperconfig) 
                  mpst = 1;        
                }
              }
              
                if(c==1)
                  cmresult = Object.assign(cusCodeResponse)
                if (mpre == 1)
                  cmresult = Object.assign(cmresult, premapperResult)
                if (mpro == 1)
                  cmresult = Object.assign(cmresult, promapperResult)
                if (mpst == 1)
                  cmresult = Object.assign(cmresult, pstmapperResult)
      
                for (var k = 0; k < pfjson[i].routeArray.length; k++) {   
                  // check the rule engine result with process flow result of identification of next node        
                  if (pfjson[i].routeArray[k].conditionResult == zenresult) {                
                    deciresult = Object.assign(deciresult,pfjson[i].routeArray[k])                
                    if(Object.keys(cmresult).length>0) 
                      deciresult =  Object.assign(deciresult,cmresult)
                    await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(deciresult), pfjson[i].nodeId+'.data.pro.response');  
                            
                    var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty','.'+pfjson[i].nodeId+ '.data.pro'); 
                    await this.redisService.setJsonData(key+upId+':NPC:'+ pfjson[i].nodeName +'.PRO',setData)                            
                
                  decirequest = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty','.'+pfjson[i].nodeId+'.data.pro.request'))          
                  resData = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty','.'+pfjson[i].nodeId+'.data.pro.response')); 
                  
                  nodeid = pfjson[i].routeArray[k].nodeId;

                  //logging execution in PElogs
                  await this.commonService.getPElogs(key, upId, pfjson[i].nodeName,pfjson[i].nodeId,pfjson[i].nodeType,decirequest,resData)
                 
                  this.logger.log("decision node execution completed..")                     
                  break
                  }
                }
            
          }catch(error){
            //logging Technical Exception in TPEExceptionlogs
            var exception = await this.commonService.getExceptionlogs(error,error.status,pfjson[i].nodeName,pfjson[i].nodeId,arr,key,upId,'NPC','PRO')
            throw new BadRequestException(exception)
          }    
        }else{
          //logging Security Exception in TPEExceptionlogs
          var secException = await this.commonService.getsecurityExceptionlogs(pfjson[i].nodeName,pfjson[i].nodeId,key,upId)
          throw new UnauthorizedException(secException)
        }   
      }        
   
      // Api Node
      if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'apinode' && pfjson[i].nodeType != 'startnode' && pfjson[i].nodeType != 'endnode') {
        var nodeSjson = await this.commonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName)
         
        if(nodeSjson == true){
            this.logger.log("Api Node execution started")    
          
            var obj = {};
            obj['nodeid'] = pfjson[i].nodeId;
            obj['nodename'] = pfjson[i].nodeName;
            obj['nodetype'] = pfjson[i].nodeType;
            if(!nodeIdChk.includes(pfjson[i].nodeId)){
              arr.push(obj);       
            }     
            await this.nodePreProcess(key,pfjson[i],upId)
            await this.nodeProcess(key,pfjson[i],arr,upId)
            await this.nodePostProcess(key,pfjson[i],upId)
            
            nodeid = pfjson[i].routeArray[0].nodeId;       
            this.logger.log("Api Node execution completed") 
        }else{
          //logging Security Exception in TPEExceptionlogs
          var secException = await this.commonService.getsecurityExceptionlogs(pfjson[i].nodeName,pfjson[i].nodeId,key,upId)
          throw new UnauthorizedException(secException) 
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
        await this.commonService.getPElogs(key, upId, pfjson[i].nodeName,pfjson[i].nodeId,pfjson[i].nodeType)
        break;    
      }
    }    
    console.log(arr);    
    await this.redisService.setJsonData(key+'response',JSON.stringify(arr))
    return 'Success'

    }catch(error){      
      throw error; 
    }   
  }

  async nodePreProcess(key,pfjson,upId){
    this.logger.log('Node PreProcessor started!');  
    try{     
    if(pfjson.npcPREFlag){  // set npc
      if(pfjson.npcPREFlag == 'Y'){  
        var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty','.'+pfjson.nodeId+ '.data.pre'); 
        await this.redisService.setJsonData(key+upId+':NPC:'+ pfjson.nodeName +'.PRE',setData) 
        await this.redisService.setStreamData('PElogs', key+upId, setData); 
        if(pfjson.ipcFlag){ // set ipc
          if(pfjson.ipcFlag != 'N'){             
            await this.redisService.setJsonData(key+upId+':IPC:'+ pfjson.ipcFlag +':'+ pfjson.nodeName +'.PRE',setData)
          }
        }
      }
    } 
    }catch(error){
    var errorobj = await this.comnService.errorobj('TE',error,error.status)    
    await this.redisService.setStreamData('TPEExceptionlogs', key+upId, JSON.stringify(errorobj)) 
    await this.redisService.setJsonData(key+upId+':NPC:'+ pfjson.nodeName +'.PRE', JSON.stringify(errorobj),'exception')
    return error  
  }
  }

  async nodeProcess(key,pfjson,arr,upId){    
    this.logger.log('Node Processor started!');      
      try{  
        var customConfig = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId)
        var c=0;
        var custconf = JSON.parse(customConfig).customCode 
          if(custconf){            
            if(custconf.request.code){
              var codedata = custconf.request.code
              var coderesult = await this.commonService.customCodeProcess(key,codedata,arr);
              c=1;
              var cusCodeResponse = {"CustomCodeResult":coderesult}  
            }          
          }
          var z=0;   
          var currNode = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId);                         
          var ruleChk = JSON.parse(currNode).rule
          if(ruleChk){
            var zenresult = await this.commonService.zenrule(key,ruleChk,pfjson.nodeId) 
            z=1; 
            var zenResponse = {"ZenResult":zenresult}                  
          }   
          var mpre,mpro,mpst = 0;
          var mapper = JSON.parse(currNode).mapper   
          if (mapper) {                    
            if(Object.keys(mapper.pre.mapData).length > 0){
              var mapperconfig = JSON.parse(currNode).mapper.pre
              var premapperResult = await this.commonService.getMapper(mapperconfig) 
              mpre = 1;        
            
            }         
            if(Object.keys(mapper.pro.mapData ).length > 0){
              var mapperconfig = JSON.parse(currNode).mapper.pro
              var promapperResult = await this.commonService.getMapper(mapperconfig) 
              mpro = 1;         
            }      
            if(Object.keys( mapper.pst.mapData).length > 0){
              var mapperconfig = JSON.parse(currNode).mapper.pst
              var pstmapperResult = await this.commonService.getMapper(mapperconfig) 
              mpst = 1;        
            }
          }             
              
          var inputparams = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId+'.data.pro.request'))   
          
          var url = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId+'.execution.pro.url'))   
               
           if (Object.keys(inputparams).length > 0 ) {
             var data = await this.postapicall(url, inputparams, key, pfjson.nodeName, upId)
           }      
             
           var cmresult = {}
           var apiresult =  {statuscode: 200,status: 'SUCCESS'}
          if(z==1)
            cmresult = Object.assign(zenResponse) 
          if(c==1)
            cmresult = Object.assign(cmresult,cusCodeResponse)           
          if (mpre == 1)
            cmresult = Object.assign(cmresult, premapperResult)
          if (mpro == 1)
            cmresult = Object.assign(cmresult, promapperResult)
          if (mpst == 1)
            cmresult = Object.assign(cmresult, pstmapperResult)         
         
          apiresult = Object.assign(apiresult,data)
          if(Object.keys(cmresult).length>0)  
            apiresult = Object.assign(apiresult,cmresult)           
       
            await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(apiresult), pfjson.nodeId+ '.data.pro.response') 
         
        var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId+ '.data.pro'); 
        await this.redisService.setJsonData(key+upId+':NPC:'+ pfjson.nodeName +'.PRO',setData) 
        // IPC set
          if(pfjson.ipcFlag){
            if(pfjson.ipcFlag != 'N')                    
            await this.redisService.setJsonData(key+upId+':IPC:'+ pfjson.ipcFlag +':'+ pfjson.nodeName +'.PRO',setData)     
          }
           
        var req = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty',  '.'+pfjson.nodeId+ '.data.pro.request'))
       
        var setData = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId+ '.data.pro.response'))
      
      
      await this.commonService.getPElogs(key, upId, pfjson.nodeName,pfjson.nodeId,pfjson.nodeType,req,apiresult)
      }catch(error){   
        //logging Technical Exception in TPEExceptionlogs
        var exception = await this.commonService.getExceptionlogs(error,error.status,pfjson.nodeName,pfjson.nodeId,arr,key,upId,'NPC','PRO')
        throw new BadRequestException(exception)
      }      
  }

  async nodePostProcess(key,pfjson,upId){
    this.logger.log('Node PostProcessor started!');
      try{ 
        if (pfjson.npcPSTFlag){  // set npc
          if (pfjson.npcPSTFlag == 'Y'){      
            var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', + '.'+pfjson.nodeId+ '.data.pst'); 
          
          await this.redisService.setJsonData(key+upId+':NPC:'+ pfjson.nodeName +'.PST',setData)
          await this.redisService.setStreamData('PElogs', key+upId, setData);
          if(pfjson.ipcFlag){  // set ipc
          if(pfjson.ipcFlag != 'N')    
          await this.redisService.setJsonData(key+upId+':IPC:'+ pfjson.ipcFlag +':'+ pfjson.nodeName +'.PST',setData)  
          }
          }
        }   
      }catch(error){  
        var errorobj = await this.comnService.errorobj('TE',error,error.status) 
        await this.redisService.setStreamData('TPEExceptionlogs', key+upId,JSON.stringify(errorobj))
        await this.redisService.setJsonData(key+upId+':NPC:'+ pfjson.nodeName +'.PRO', JSON.stringify(errorobj),'exception')
        return error
      }    
  }

  async pfPostProcess(key, upId) {   
    const json = await this.redisService.getJsonData(key + 'processFlow');
    var pfjson: any = JSON.parse(json);
    for (var i = 0; i < pfjson.length; i++) {
      if (pfjson[i].nodeType == 'humantasknode') {
        await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify({}), pfjson[i].nodeId + '.data.pro.response')
      }
    }    
    var keys = await this.redisService.getKeys(key + upId)
    for (var k = 0; k < keys.length; k++) {
      await this.redisService.expire(keys[k],1000)
    }                                  //86400 secs = 1 day 'Datafabrics:TorusPOC:StreamTest:v2:cr5tw08ezv8jbt7173jg:NPC:Input.PST',
                                      //18000 secs = 5 hrs
                                       
  }

  /* Store the form data to humantask node's request
     @param key -  The key used to identify the process flow.
     @param nodeName - The name of the node whose property needs to be updated.
     @param fdata - The form data to be set as the node property.
     @param role  - The role used for process execution.
  */
  async getFormdata(sfkey,key,upId, nodeId, nodeName, fdata,token) {
    this.logger.log("Execution getFormData started")
    var fjson = await this.redisService.getJsonData(key + 'processFlow');
    var fdjson: any = JSON.parse(fjson);
    for (var z = 0; z < fdjson.length; z++) {
      if (fdjson[z].nodeType == 'humantasknode' && fdjson[z].nodeId == nodeId) {
        await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(fdata), fdjson[z].nodeId + '.data.pro.response')
      }
    }

    //call the processs flow execution
    var response = await this.getProcess(sfkey,key,upId,token)    
    return response;

  }

  /* checks if the form data exists in the humantask node's request, else
     it will returns either URL or success message   
     @param key - The key used to identify the process flow.
  */
  async returnformdata(key, upId,nodeDetails) {
      this.logger.log("Return formData executed")
      const json = await this.redisService.getJsonData(key + 'processFlow');
      var pfjson: any = JSON.parse(json);
      for (var i = 0; i < pfjson.length; i++) {
        if (pfjson[i].nodeType == 'humantasknode') {
          var nodeSjson = await this.commonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName)
          if(nodeSjson == true){
            var mconfig = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro')
            var formdata = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.execution.pro.url'))
  
            this.logger.log(formdata)
            var robj = {}
            robj['key'] = key
            robj['upId'] = upId
            robj['nodeId'] = pfjson[i].nodeId
            robj['nodeName'] = pfjson[i].nodeName
            robj['url'] = formdata
            robj['mode'] = 'E'
  
            //returns the URL if request data doesn't exist       
            var req = JSON.parse(mconfig).response
            if (Object.keys(req).length == 0) {
              return robj;
            }
          } 
          else{
              var errorobj = await this.comnService.errorobj('TE','Permission Restricted to Execute the '+pfjson[i].nodeName,403)  
              errorobj['errorCategory'] = 'Security'
              errorobj['nodeName'] = pfjson[i].nodeName
              errorobj['nodeId'] = pfjson[i].nodeId   
                
              await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(errorobj))
              throw new UnauthorizedException(errorobj)
             
          }         
        }
      }
      return 'Success'
   
  }

  /* Executes the process flow based on a given valid key and role check
     @param key  - The key used to identify the process flow.  
     @param role - Check if the incoming role had a permission to enter this method
  */
  async getProcess(sfkey,key,upId,token) {  //GSS-DEV:WPS:IPP:PF:payment:v1:

    this.logger.log("Torus Process Engine Started....") 
    try {           
      const decoded =  this.jwtService.decode(token,{ json: true })     
      var psjson:any = await this.comnService.getSecurityJson(sfkey,decoded);    
      if(typeof psjson !== 'object') {
        return psjson
      }
      var sjson = await this.commonService.getPSJson(key,decoded,psjson)       
            
      if(typeof sjson !== 'object') {
        return sjson
      }
      var incomingarr = sjson['PFaction']   
      var flag = sjson['PFflag']
      var permit

      if(flag == 'E') {
        permit = incomingarr.includes('Execute') || incomingarr.includes('*')
        if(permit){
          return {status:400,err:"Permission Denied to Execute "}  
        }   
      }
      else if(flag == 'A') {
        permit = incomingarr.includes('Execute') || incomingarr.includes('*')
      
        if(!permit)
          return {status:400,err:"Permission Denied to Execute"}
        else {
        var formjson = await this.returnformdata(key, upId, sjson['Node'])
          await this.pfPreProcessor(key, upId);
          if (formjson == 'Success') {         
            var pfresponse = await this.pfProcessor(key, upId, sjson['Node']);

            await this.pfPostProcessor(key, upId);        
            return await this.comnService.responseData(201,key+upId)
          }
          else {      
          return { status: 200, url: formjson };
          }
        }      
      }  
    }catch (error) {
      //console.log("GET PROCESS ERROR",error);     
      throw error
    }
  }

  // -----------------------------pfPreProcessor--------------------------------------

  /* Checks Processflow json along with all nodes having config, 
     workflow and setting placeholder for NPC,IPC
     @param key - The key used to identify the process flow.
  */
  async pfPreProcessor(key, upId) {
    this.logger.log('Pf PreProcessor started!');
    try {
      var placeholder = {"request":{},"response":{},"exception":{}}    
      // Read Process Flow Json
      const json = await this.redisService.getJsonData(key + 'processFlow');
      var pfjson: any = JSON.parse(json);
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
      this.logger.log("pf Preprocessor completed")
      return 'Success'
    } catch (error) {
      var errorobj = await this.comnService.errorobj('TE',error,error.status)
      await this.redisService.setJsonData(key + upId + ':ERR:' + pfjson[i].nodeName, JSON.stringify(errorobj))
      throw errorobj
    }
  }

  // --------------------------------pfProcessor--------------------------------------

  /* Process flow Execution by iterating through the all the nodes 
     and executing the corresponding logic for each node type.
     @param key - The key used to identify the process flow.  
  */
  async pfProcessor(key, upId, nodeDetails) {
    this.logger.log('Pf Processor started!');
   
      var arr = [];
      var nodeid;

      const json = await this.redisService.getJsonData(key + 'processFlow');
      var pfjson: any = JSON.parse(json);

      for (var i = 0; i < pfjson.length; i++) {

        // Start Node
        if (pfjson[i].nodeType == 'startnode') {
          var obj = {};
          obj['nodeid'] = pfjson[i].nodeId;
          obj['nodename'] = pfjson[i].nodeName;
          obj['nodetype'] = pfjson[i].nodeType;
          arr.push(obj);
          await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))

          // //logging nodename in stream        
          await this.commonService.getPElogs(key, upId, pfjson[i].nodeName,pfjson[i].nodeId,pfjson[i].nodeType)
          nodeid = pfjson[i].routeArray[0].nodeId;
        }

        // Humantask node        
        if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'humantasknode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) {
                
          var nodeSjson = await this.commonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName)
        
          if(nodeSjson == true){
            try {
              this.logger.log("Humantask node started...")
              var obj = {};
              obj['nodeid'] = pfjson[i].nodeId;
              obj['nodename'] = pfjson[i].nodeName;
              obj['nodetype'] = pfjson[i].nodeType;
              arr.push(obj);
              await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))             
              var fdataRes = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro.response'));

              for (var y = 0; y < pfjson.length; y++) {
                if (pfjson[y].nodeType == "apinode" || pfjson[y].nodeType == "decisionnode")
                  await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(fdataRes), pfjson[y].nodeId + '.data.pro.request')
              }            
            
              //logging execution in PE stream
              await this.commonService.getPElogs(key, upId, pfjson[i].nodeName,pfjson[i].nodeId,pfjson[i].nodeType,'NPC','PRO')
             
              nodeid = pfjson[i].routeArray[0].nodeId;
              this.logger.log("Humantask node completed...")
            } catch (error) {            
              //logging Technical Exception in TPEExceptionlogs
              var exception = await this.commonService.getExceptionlogs(error,error.status,pfjson[i].nodeName,pfjson[i].nodeId,arr,key,upId,'NPC','PRO')
              throw new BadRequestException(exception)
            }
          }else{
            //logging Security Exception in TPEExceptionlogs
            var secException = await this.commonService.getsecurityExceptionlogs(pfjson[i].nodeName,pfjson[i].nodeId,key,upId)
            throw new UnauthorizedException(secException)
          }
        }

        // Webhook Node
        if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'webhooknode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) {
          var nodeSjson = await this.commonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName)
         
           if(nodeSjson == true){
             try {
               this.logger.log("WebHook node started...")
               var obj = {};
               obj['nodeid'] = pfjson[i].nodeId;
               obj['nodename'] = pfjson[i].nodeName;
               obj['nodetype'] = pfjson[i].nodeType;
               arr.push(obj);
               await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))
               var fdataReq = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro.request'));
               var fdataRes = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.execution.pro'));
               var url = fdataRes.url
               var eventstream = fdataRes.eventStream
               var eventname = fdataReq.event
               if(eventname == 'OrderCreated'){
                var params ={
                    streamName:eventstream,
                    field:'orders',
                    data:fdataReq
                }
                const response = await axios.post(url, params)
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
                  for(var o=0;o<orderStream.length;o++){                    
                    paymentData = orderStream[o].data[1]
                  }
                  var rep = await this.redisService.setJsonData(key + 'nodeProperty', paymentData, pfjson[i].nodeId + '.data.pro.response');
                  this.logger.log(rep)
                  await this.redisService.setStreamData('EStorePaymentStream','Payment',paymentData)
                  var req = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro.request'));
                  var nextnodeid = pfjson[i].routeArray[0].nodeId;
                  this.logger.log(nextnodeid)
                  req.eventType = 'PaymentMade'
                  await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(req), nextnodeid + '.data.pro.request')
                 
                  //logging execution in PE stream
                  await this.commonService.getPElogs(key, upId, pfjson[i].nodeName,pfjson[i].nodeId,pfjson[i].nodeType,fdataReq,fdataRes)
               }
                else if(eventname == 'PaymentMade'){
                  var params ={
                    streamName:eventstream,
                    field:'dispatches',
                    data:fdataReq
                  }
                  const response = await axios.post(url, params)
                  this.logger.log(response.data)
                  var grpinfo = await this.redisService.getInfoGrp(eventstream)               
                  if(grpinfo.length == 0){                                                      
                    await this.redisService.createConsumerGroup(eventstream,'DispatchGroup')                                    
                  } else if(!grpinfo[0].includes('DispatchGroup')){                                   
                    await this.redisService.createConsumerGroup(eventstream,'DispatchGroup')                  
                  }
                 var dispatchStream = await this.redisService.readConsumerGroup(eventstream,'DispatchGroup','DispatchConsumer')
                 var dispatchData
                  for(var o=0;o<dispatchStream.length;o++){                    
                    dispatchData = dispatchStream[o].data[1]
                  }
                 var nextnode = pfjson[i].routeArray[0].nodeId;
                 this.logger.log(nextnode)
                 var respon = await this.redisService.setJsonData(key + 'nodeProperty', dispatchData, pfjson[i].nodeId + '.data.pro.response');
                 this.logger.log(respon)

                 //logging execution in PE stream
                 await this.commonService.getPElogs(key, upId, pfjson[i].nodeName,pfjson[i].nodeId,pfjson[i].nodeType,fdataReq,fdataRes)
               }
               var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro');
               await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson[i].nodeName + '.PRO', setData)
               
               nodeid = pfjson[i].routeArray[0].nodeId;
               this.logger.log("webhook node completed...")
             } catch (error) {
              //logging Technical Exception in TPEExceptionlogs
              var exception = await this.commonService.getExceptionlogs(error,error.status,pfjson[i].nodeName,pfjson[i].nodeId,arr,key,upId,'NPC','PRO')
              throw new BadRequestException(exception)
             }
           }else{
            //logging Security Exception in TPEExceptionlogs 
            var secException = await this.commonService.getsecurityExceptionlogs(pfjson[i].nodeName,pfjson[i].nodeId,key,upId)
            throw new UnauthorizedException(secException)
          }
        }

        // Decision Node
        if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'decisionnode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) {
          this.logger.log("decision node execution started...")
          var nodeSjson = await this.commonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName)
         
          if(nodeSjson == true){
            try {
              var obj = {};
              obj['nodeid'] = pfjson[i].nodeId;
              obj['nodename'] = pfjson[i].nodeName;
              obj['nodetype'] = pfjson[i].nodeType;
              arr.push(obj);
              await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))
              var decirequest
              var resData;
              var cmresult = {}
              var deciresult = { statuscode: 200, status: 'SUCCESS' }

              var currNode = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId);

              var ruleChk = JSON.parse(currNode).rule
              if (ruleChk) {
                var zenresult = await this.commonService.zenrule(key, ruleChk, pfjson[i].nodeId)
              }
              var c = 0;
              var custconf = JSON.parse(currNode).customCode
              if (custconf) {
                if (custconf.request.code) {
                  var codedata = custconf.request.code
                  var coderesult = await this.commonService.customCodeProcess(key, codedata, arr);
                  c = 1;
                  var cusCodeResponse = { "CustomCodeResult": coderesult }
                }
              }
              var m = 0;
            
              var mapper = JSON.parse(currNode).mapper
              if (mapper) {    
                var mpr = mapper.ph[0].mapData 
                console.log(mpr)
                if(Object.keys(mapper.ph[0].mapData).length > 0){
                  var mapperconfig = JSON.parse(currNode).mapper.pre
                  var mapperResult = await this.commonService.getMapper(mapperconfig) 
                  m = 1;                
                }         
                if(Object.keys(mapper.pro.mapData ).length > 0){
                  var mapperconfig = JSON.parse(currNode).mapper.pro
                  var mapperResult = await this.commonService.getMapper(mapperconfig) 
                  m = 1;                
                }      
                if(Object.keys( mapper.pst.mapData).length > 0){
                  var mapperconfig = JSON.parse(currNode).mapper.pst
                  var mapperResult = await this.commonService.getMapper(mapperconfig) 
                  m = 1;                 
                }
              }

              if (c == 1)
                cmresult = Object.assign(cusCodeResponse)
              if (m == 1)
                cmresult = Object.assign(cmresult, mapperResult)

              for (var k = 0; k < pfjson[i].routeArray.length; k++) {

                // check the rule engine result with process flow result of identification of next node  

                if (pfjson[i].routeArray[k].conditionResult == zenresult) {

                  deciresult = Object.assign(deciresult, pfjson[i].routeArray[k])
                  if (Object.keys(cmresult).length > 0)
                    deciresult = Object.assign(deciresult, cmresult)
                  await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(deciresult), pfjson[i].nodeId + '.data.pro.response');

                  var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro');
                  await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson[i].nodeName + '.PRO', setData)

                  decirequest = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro.request'))
                  resData = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro.response'));

                  nodeid = pfjson[i].routeArray[k].nodeId;

                  //logging Execution in PE stream
                  await this.commonService.getPElogs(key, upId, pfjson[i].nodeName,pfjson[i].nodeId,pfjson[i].nodeType,decirequest,resData)                                
                  this.logger.log("decision node execution completed..")
                  break
                }
              }

            } catch (error) {
              //logging Technical Exception in TPEExceptionlogs
              var exception = await this.commonService.getExceptionlogs(error,error.status,pfjson[i].nodeName,pfjson[i].nodeId,arr,key,upId,'NPC','PRO')
              throw new BadRequestException(exception)
            }
          }else{
            //logging Security Exception in TPEExceptionlogs
            var secException = await this.commonService.getsecurityExceptionlogs(pfjson[i].nodeName,pfjson[i].nodeId,key,upId)
            throw new UnauthorizedException(secException)
          }
        }

        // Api Node
        if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'apinode' && pfjson[i].nodeType != 'startnode' && pfjson[i].nodeType != 'endnode') {
          var nodeSjson = await this.commonService.getNodeSecurityJson(nodeDetails,pfjson[i].nodeName)
         
          if(nodeSjson == true){
            this.logger.log("Api Node execution started")
              var obj = {};
              obj['nodeid'] = pfjson[i].nodeId;
              obj['nodename'] = pfjson[i].nodeName;
              obj['nodetype'] = pfjson[i].nodeType;
              arr.push(obj);
              await this.redisService.setJsonData(key + upId + ':previousArray', JSON.stringify(arr))
              await this.nodePreProcessor(key, pfjson[i], upId)
              await this.nodeProcessor(key, pfjson[i], arr, upId)
              await this.nodePostProcessor(key, pfjson[i], upId)

              nodeid = pfjson[i].routeArray[0].nodeId;
              this.logger.log("Api Node execution completed")         
           }else{
            //logging Security Exception in TPEExceptionlogs
            var secException = await this.commonService.getsecurityExceptionlogs(pfjson[i].nodeName,pfjson[i].nodeId,key,upId)
            throw new UnauthorizedException(secException) 
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
          await this.commonService.getPElogs(key, upId, pfjson[i].nodeName,pfjson[i].nodeId,pfjson[i].nodeType)
          break;
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
  async nodePreProcessor(key, pfjson, upId) {
    this.logger.log('Node PreProcessor started!');
    try {
      if (pfjson.npcPREFlag) {  // set npc
        if (pfjson.npcPREFlag == 'Y') {
          var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId + '.data.pre');
          await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson.nodeName + '.PRE', setData)
          await this.redisService.setStreamData('PElogs', key + upId, setData);
          if (pfjson.ipcFlag) { // set ipc
            if (pfjson.ipcFlag != 'N') {
              await this.redisService.setJsonData(key + upId + ':IPC:' + pfjson.ipcFlag + ':' + pfjson.nodeName + '.PRE', setData)
            }
          }
        }
      }

    } catch (error) {
      var errorobj = await this.comnService.errorobj('TE',error,error.status)
      await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(errorobj))
      await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson.nodeName + '.PRE', JSON.stringify(errorobj), 'exception')
    }
  }

  // --------------------------------NodeProcessor--------------------------------------

  /* Performs API call (make avaiable Pro data in NPC,IPC) for a specific node
     @params key    - The key passed to identify the particular node in process flow.
     @params pfjson - This variable holding the values of parsed process flow json       
  */
  async nodeProcessor(key, pfjson, arr, upId) {
    this.logger.log('Node Processor started!');
    try {
      var customConfig = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId)
      var c = 0;
      var custconf = JSON.parse(customConfig).customCode
      if (custconf) {
        if (custconf.request.code) {
          var codedata = custconf.request.code
          var coderesult = await this.commonService.customCodeProcess(key, codedata, arr);
          c = 1;
          var cusCodeResponse = { "CustomCodeResult": coderesult }          
        }
      }
      var z = 0;
      var currNode = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId);
      var ruleChk = JSON.parse(currNode).rule
      if (ruleChk) {
        var zenresult = await this.commonService.zenrule(key, ruleChk, pfjson.nodeId)
        z = 1;
        var zenResponse = { "ZenResult": zenresult }
      }
      var mpre,mpro,mpst = 0;
      var mapper = JSON.parse(currNode).mapper   
      if (mapper) {                    
        if(Object.keys(mapper.pre.mapData).length > 0){
          var mapperconfig = JSON.parse(currNode).mapper.pre
          var premapperResult = await this.commonService.getMapper(mapperconfig) 
          mpre = 1;        
         
        }         
        if(Object.keys(mapper.pro.mapData ).length > 0){
          var mapperconfig = JSON.parse(currNode).mapper.pro
          var promapperResult = await this.commonService.getMapper(mapperconfig) 
          mpro = 1;         
        }      
        if(Object.keys( mapper.pst.mapData).length > 0){
          var mapperconfig = JSON.parse(currNode).mapper.pst
          var pstmapperResult = await this.commonService.getMapper(mapperconfig) 
          mpst = 1;        
        }
      }
     
      var inputparams = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId + '.data.pro.request'))
      var url = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId + '.execution.pro.url'))
     
      if (Object.keys(inputparams).length > 0 ) {
        var data = await this.postapicall(url, inputparams, key, pfjson.nodeName, upId)
      }      
     
      var cmresult = {}
      var apiresult = { statuscode: 200, status: 'SUCCESS' }
      if (z == 1)
        cmresult = Object.assign(zenResponse)
      if (c == 1)
        cmresult = Object.assign(cmresult, cusCodeResponse)
      if (mpre == 1)
        cmresult = Object.assign(cmresult, premapperResult)
      if (mpro == 1)
        cmresult = Object.assign(cmresult, promapperResult)
      if (mpst == 1)
        cmresult = Object.assign(cmresult, pstmapperResult)

      apiresult = Object.assign(apiresult, data)
      if (Object.keys(cmresult).length > 0)
        apiresult = Object.assign(apiresult, cmresult)
      
        await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(apiresult), pfjson.nodeId + '.data.pro.response')
     

      var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId + '.data.pro');
      await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson.nodeName + '.PRO', setData)


      // IPC set
      if (pfjson.ipcFlag) {
        if (pfjson.ipcFlag != 'N') {
          await this.redisService.setJsonData(key + upId + ':IPC:' + pfjson.ipcFlag + ':' + pfjson.nodeName + '.PRO', setData)
        }
      }

      var req = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId + '.data.pro.request'))

      var setData = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId + '.data.pro.response'))

      //logging execution in PE stream
      await this.commonService.getPElogs(key, upId, pfjson.nodeName,pfjson.nodeId,pfjson.nodeType,req,apiresult)
    } catch (error) { 
      //logging Technical Exception in TPEExceptionlogs
      var exception = await this.commonService.getExceptionlogs(error,error.status,pfjson.nodeName,pfjson.nodeId,arr,key,upId,'NPC','PRO')      
      throw new BadRequestException(exception);
    }
  }

  // -----------------------------NodePostProcessor--------------------------------------

  /* Performs post-processing tasks (make avaiable Post data in NPC,IPC) for a specific node
     @params key    - The key passed to identify the particular node in process flow.
     @params pfjson - This variable holding the values of parsed process flow json 
  */
  async nodePostProcessor(key, pfjson, upId) {
    this.logger.log('Node PostProcessor started!');
    try {
      if (pfjson.npcPSTFlag) {  // set npc
        if (pfjson.npcPSTFlag == 'Y') {
          var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', + '.' + pfjson.nodeId + '.data.pst');

          await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson.nodeName + '.PST', setData)
          await this.redisService.setStreamData('PElogs', key + upId, setData);
          if (pfjson.ipcFlag) {  // set ipc
            if (pfjson.ipcFlag != 'N')
              await this.redisService.setJsonData(key + upId + ':IPC:' + pfjson.ipcFlag + ':' + pfjson.nodeName + '.PST', setData)
          }
        }
      }

    } catch (error) {
      var errorobj = await this.comnService.errorobj('TE',error,error.status)
      await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(errorobj))
      await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson.nodeName + '.PRO', JSON.stringify(errorobj), 'exception')
    }
  }
  // -----------------------------pfPostProcessor--------------------------------------

  /* Perform garbage clean logic and calling external API
     @params key -  The key passed to identify the particular node in process flow.
  */
  async pfPostProcessor(key, upId) {
    this.logger.log('Pf PostProcessor started!');
    //change flag in humantasknode when execution is completed
    await this.changeFlag(key)
  
   var keys = await this.redisService.getKeys(key + upId)
    for (var k = 0; k < keys.length; k++) {     
      await this.redisService.expire(keys[k],1000)
    } 
    this.logger.log('Pf PostProcessor completed!');  //86400 secs = 1 day 'Datafabrics:TorusPOC:StreamTest:v2:cr5tw08ezv8jbt7173jg:NPC:Input.PST',                                       
  }                                                //18000 secs = 5 hrs



  /**
 * Sends a POST request to the specified URL with the given parameters and returns the response data.
 * If an error occurs during the request, the error is logged and stored in Redis with the given key.
 *
 * @param {string} url - The URL to send the POST request to.
 * @param {Object} params - The parameters to include in the POST request body.
 * @param {string} key - The key used for storing error logs.
 * @param {string} nodeName - The name of the node being processed.
 * @param {string} upId - The unique identifier of the node being processed.
 * @return {Promise<Object>} The response data from the POST request.
 */
  async postapicall(url, params, key, nodeName, upId) {   
    try {
      this.logger.log("POST API call Execution")
    //  const postres = await axios.post(url, params)
      const postres = await this.comnService.postCall(url,params)      
      // response.status,
      return postres
    } catch (error) {   
      await this.redisService.setJsonData(key + upId + ':NPC:' + nodeName + '.PRO', JSON.stringify(error), 'exception')
      throw error
    }
  }

  /*change flag in humantasknode when  execution is completed
    @params key - The key passed to identify the particular node in process flow.
  */
  async changeFlag(key) {
    this.logger.log("Clear response")
    try {
      const json = await this.redisService.getJsonData(key + 'processFlow');
      var pfjson: any = JSON.parse(json);
      for (var i = 0; i < pfjson.length; i++) {       
          await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify({}), pfjson[i].nodeId + '.data.pro.response')      
      }
    } catch (error) {
      throw error
    }
  }
}


