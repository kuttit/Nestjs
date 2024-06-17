import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
const Xid = require('xid-js');
import 'dotenv/config';
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
     
      var result:any = await this.getProcess(sfkey,pKey,pId,pToken)
      
      if(result == 'Success'){
        await this.redisService.ackMessage('PEStream', 'PEGroup', msgid);
        return {status:201,data:pKey+pId}
      }
      else if(result.status == 200){
        return {status: 201, url:result.url}
      }  
      else{
        return result
      }
     
    }
 
  async resumeProcess(key,upid){
    
     var nodeInfo = await this.getNodeInfo(key+upid)
     var nodeId = nodeInfo[0]
     var arr = nodeInfo[1]  

     var continueResponse = await this.Processor(key,upid,nodeId,arr)    
    // await this.pfPostProcess(key, upid);     
     console.log(continueResponse);
     
     if(continueResponse == 'Success'){    
      return { status: 201, data: key + upid };
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

  async Processor(key,upId,nodeId,arr) {
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
          var deci = {};
          deci['nodeName'] = pfjson[i].nodeName;  
          deci['nodeId']=pfjson[i].nodeId;
          deci['nodeType']=pfjson[i].nodeType;       
          deci['request']  = fdataReq
          deci['response'] = fdataRes 

          await this.redisService.setStreamData('PElogs', key+upId, JSON.stringify(deci)); 
          this.logger.log(fdataReq)
          this.logger.log(fdataRes)
          nodeid = pfjson[i].routeArray[0].nodeId; 
         
          this.logger.log("Humantask node completed...")       
        }catch(err)
        {          
          var errorobj = await this.commonService.errorobj(err) 
          errorobj['nodeName'] = pfjson[i].nodeName
          errorobj['nodeId'] = pfjson[i].nodeId 
          errorobj['previousArray'] = obj
          await this.redisService.setStreamData('TPEExceptionlogs', key+upId, JSON.stringify(errorobj))
          await this.redisService.setJsonData(key+upId+':NPC:'+ pfjson[i].nodeName +'.PRO', JSON.stringify(errorobj),'exception')
          errorobj['key']=key
          errorobj['upId']=upId
          throw new BadRequestException(errorobj)
        }
      }
     
      // Decision Node
      if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'decisionnode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) { 
        this.logger.log("decision node execution started...")
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
          var m = 0;
          var mapper = JSON.parse(currNode).mapper
          if(mapper){
            if(mapper.pre.mapData){
              let preRequest = JSON.parse(currNode).mapper.pre.request
              let preResponse = JSON.parse(currNode).mapper.pre.response
              let preMapData = JSON.parse(currNode).mapper.pre.mapData
              let mapperResult = await this.commonService.mapper(preRequest, preResponse,preMapData)
              m = 1;
              var mapperResponse = {"MapperResult":mapperResult};                
            }    
            if(mapper.pro.mapData){
              let proRequest = JSON.parse(currNode).mapper.pro.request
              let proResponse = JSON.parse(currNode).mapper.pro.response
              let proMapData = JSON.parse(currNode).mapper.pro.mapData
              let mapperResult = await this.commonService.mapper(proRequest, proResponse,proMapData)
              m = 1;
              var mapperResponse = {"MapperResult":mapperResult};                  
            }  
            if(mapper.pst.mapData){
              let pstRequest = JSON.parse(currNode).mapper.pst.request
              let pstResponse = JSON.parse(currNode).mapper.pst.response
              let pstMapData = JSON.parse(currNode).mapper.pst.mapData
              let mapperResult = await this.commonService.mapper(pstRequest, pstResponse,pstMapData )
              m = 1;
              var mapperResponse = {"MapperResult":mapperResult}; 
            }     
          }    
             
            if(c==1)
              cmresult = Object.assign(cusCodeResponse)
            if(m==1)
              cmresult = Object.assign(cmresult,mapperResponse)
  
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
               var deci = {};
                deci['nodeName']=pfjson[i].nodeName;
                deci['request'] = decirequest       
                deci['response'] = resData 
                deci['nodeId']=pfjson[i].nodeId;
                deci['nodeType']=pfjson[i].nodeType;      
                      
              await this.redisService.setStreamData('PElogs', key+upId, JSON.stringify(deci)); 
              this.logger.log(decirequest)
              this.logger.log(resData)
              this.logger.log("decision node execution completed..")                     
              break
              }
            }
        
        }catch(error){
          var errorobj = await this.commonService.errorobj(error) 
          errorobj['nodeName'] = pfjson[i].nodeName
          errorobj['nodeId'] = pfjson[i].nodeId 
          errorobj['previousArray'] = obj
          await this.redisService.setStreamData('TPEExceptionlogs', key+upId, JSON.stringify(errorobj))    
          await this.redisService.setJsonData(key+upId+':NPC:'+ pfjson[i].nodeName +'.PRO', JSON.stringify(errorobj),'exception')
          errorobj['key']=key
          errorobj['upId']=upId
          throw new BadRequestException(errorobj)
        }       
      }        
   
      // Api Node
      if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'apinode' && pfjson[i].nodeType != 'startnode' && pfjson[i].nodeType != 'endnode') {
       
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
      }      
     
      //  End Node
      if (pfjson[i].nodeType == 'endnode') { 
        var obj = {};
        obj['nodeid'] = pfjson[i].nodeId;
        obj['nodename'] = pfjson[i].nodeName;
        obj['nodetype'] = pfjson[i].nodeType;
        arr.push(obj);      
                 
        var deci = {};
        deci['nodeName'] = pfjson[i].nodeName;
        deci['nodeId']=pfjson[i].nodeId;
        deci['nodeType']=pfjson[i].nodeType;  
        
        //logging End nodename in stream
        await this.redisService.setStreamData('PElogs', key+upId, JSON.stringify(deci)); 
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
    var errorobj = await this.commonService.errorobj(error)    
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
          var m = 0;
          var mapper = JSON.parse(currNode).mapper
          if(mapper){
            if(mapper.pre.mapData){
              let preRequest = JSON.parse(currNode).mapper.pre.request
              let preResponse = JSON.parse(currNode).mapper.pre.response
              let preMapData = JSON.parse(currNode).mapper.pre.mapData
              let mapperResult = await this.commonService.mapper(preRequest, preResponse,preMapData)
              m = 1;
              var mapperResponse = {"MapperResult":mapperResult};              
            }    
            if(mapper.pro.mapData){
              let proRequest = JSON.parse(currNode).mapper.pro.request
              let proResponse = JSON.parse(currNode).mapper.pro.response
              let proMapData = JSON.parse(currNode).mapper.pro.mapData
              let mapperResult = await this.commonService.mapper(proRequest, proResponse,proMapData)
              m = 1;
              var mapperResponse = {"MapperResult":mapperResult};              
            }  
            if(mapper.pst.mapData){
              let pstRequest = JSON.parse(currNode).mapper.pst.request
              let pstResponse = JSON.parse(currNode).mapper.pst.response
              let pstMapData = JSON.parse(currNode).mapper.pst.mapData
              let mapperResult = await this.commonService.mapper(pstRequest, pstResponse,pstMapData )
              m = 1;
              var mapperResponse = {"MapperResult":mapperResult};             
            }     
          }                 
          var data;         
          var inputparams = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId+'.data.pro.request'))   
          
          var url = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId+'.execution.pro.url'))   
               
           if(Object.keys(inputparams).length > 0){
            try {              
              const postres = await axios.post(url, inputparams)
              data = postres.data
            } catch (error) {
              console.log('Error occurred while posting data:', error);
              await this.redisService.setJsonData(key+upId+':NPC:'+ pfjson.nodeName +'.PRO', JSON.stringify(error),'exception')
              throw error
            }                                      
           }          
             
           var cmresult = {}
           var apiresult =  {statuscode: 200,status: 'SUCCESS'}
          if(z==1)
            cmresult = Object.assign(zenResponse) 
          if(c==1)
            cmresult = Object.assign(cmresult,cusCodeResponse)           
          if(m == 1)
            cmresult = Object.assign(cmresult,mapperResponse)           
         
          apiresult = Object.assign(apiresult,data)
          if(Object.keys(cmresult).length>0)  
            apiresult = Object.assign(apiresult,cmresult)           

           if(data != true){          
            await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(apiresult), pfjson.nodeId+ '.data.pro.response') 
          }
        var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId+ '.data.pro'); 
        await this.redisService.setJsonData(key+upId+':NPC:'+ pfjson.nodeName +'.PRO',setData) 
        // IPC set
          if(pfjson.ipcFlag){
            if(pfjson.ipcFlag != 'N')                    
            await this.redisService.setJsonData(key+upId+':IPC:'+ pfjson.ipcFlag +':'+ pfjson.nodeName +'.PRO',setData)     
          }
           
        var req = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty',  '.'+pfjson.nodeId+ '.data.pro.request'))
       
        var setData = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId+ '.data.pro.response'))
      
        var deci = {};
        deci['nodeName']=pfjson.nodeName;
        deci['nodeId']=pfjson.nodeId;
        deci['nodeType']=pfjson.nodeType;  
        deci['request'] = req
        deci['response'] = apiresult
     
      await this.redisService.setStreamData('PElogs',  key+upId, JSON.stringify(deci)); 
      }catch(error){   
        var errorobj = await this.commonService.errorobj(error) 
        errorobj['nodeName'] = pfjson.nodeName
        errorobj['nodeId'] = pfjson.nodeId 
        errorobj['previousArray'] = arr
        await this.redisService.setStreamData('TPEExceptionlogs', key+upId, JSON.stringify(errorobj))
        await this.redisService.setJsonData(key+upId+':NPC:'+ pfjson.nodeName +'.PRO', JSON.stringify(errorobj),'exception')
        errorobj['key']=key
        errorobj['upId']=upId
        throw new BadRequestException(errorobj)
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
        var errorobj = await this.commonService.errorobj(error) 
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
    }//86400 secs = 1 day 'Datafabrics:TorusPOC:StreamTest:v2:cr5tw08ezv8jbt7173jg:NPC:Input.PST',
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
  async returnformdata(key, upId) {
    this.logger.log("Return formData started")
    const json = await this.redisService.getJsonData(key + 'processFlow');
    var pfjson: any = JSON.parse(json);
    for (var i = 0; i < pfjson.length; i++) {
      if (pfjson[i].nodeType == 'humantasknode') {
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
    }
    return 'Success'
  }

  /* Executes the process flow based on a given valid key and role check
     @param key  - The key used to identify the process flow.  
     @param role - Check if the incoming role had a permission to enter this method
  */
  async getProcess(sfkey,key,upId,token) {  //GSS-DEV:WPS:IPP:PF:payment:v1:

    this.logger.log("Torus Process Engine Started....") 
    
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
      var formjson = await this.returnformdata(key, upId)
      await this.pfPreProcessor(key, upId);
        if (formjson == 'Success') {         
          var pfresponse = await this.pfProcessor(key, upId, sjson['Node']);
          await this.pfPostProcessor(key, upId);        
          return pfresponse
        }
        else {      
         return { status: 200, url: formjson };
        }
      }      
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
      var errorobj = await this.commonService.errorobj(error)
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
          var deci = {};
          deci['nodeName'] = pfjson[i].nodeName;
          deci['nodeId'] = pfjson[i].nodeId;
          deci['nodeType'] = pfjson[i].nodeType;

          //logging nodename in stream
          await this.redisService.setStreamData('PElogs', key + upId, JSON.stringify(deci));
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
              var fdataReq = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro.request'));
              var fdataRes = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro.response'));

              for (var y = 0; y < pfjson.length; y++) {
                if (pfjson[y].nodeType == "apinode" || pfjson[y].nodeType == "decisionnode")
                  await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(fdataRes), pfjson[y].nodeId + '.data.pro.request')
              }
              var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro');
              await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson[i].nodeName + '.PRO', setData)
              var deci = {};
              deci['nodeName'] = pfjson[i].nodeName;
              deci['nodeId'] = pfjson[i].nodeId;
              deci['nodeType'] = pfjson[i].nodeType;
              deci['request'] = fdataReq
              deci['response'] = fdataRes

              await this.redisService.setStreamData('PElogs', key + upId, JSON.stringify(deci));
             
              nodeid = pfjson[i].routeArray[0].nodeId;
              this.logger.log("Humantask node completed...")
            } catch (err) {
              var errorobj = await this.commonService.errorobj(err)  
              errorobj['nodeName'] = pfjson[i].nodeName
              errorobj['nodeId'] = pfjson[i].nodeId   
              arr.pop()
              errorobj['previousArray'] = arr
              await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(errorobj))
              await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson[i].nodeName + '.PRO', JSON.stringify(errorobj), 'exception')
              errorobj['key']=key
              errorobj['upId']=upId
              throw new BadRequestException(errorobj)
            }
          }else{
              var errorobj = await this.commonService.errorobj('Permission Restricted to Execute the '+pfjson[i].nodeName)  
              errorobj['errorCategory'] = 'Security'
              errorobj['nodeName'] = pfjson[i].nodeName
              errorobj['nodeId'] = pfjson[i].nodeId   
                
            await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(errorobj))
            throw new UnauthorizedException('Permission Restricted to Execute the '+pfjson[i].nodeName) 
         
          }
        }

        // Webhook Node

        /*Listen the event in order stream in redis and eventtype is ordercreated
        The event is started get the stream data 
        set the webhooknode response and created the paymentstream data
        Listen the event in Dispatch stream in redis
        The event is started get the stream data 
        set the webhooknode response */

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
                 var result = await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(req), nextnodeid + '.data.pro.request')
                var deci = {};
               deci['nodeName'] = pfjson[i].nodeName;
               deci['nodeId'] = pfjson[i].nodeId;
               deci['nodeType'] = pfjson[i].nodeType;
               deci['request'] = fdataReq
               deci['response'] = fdataRes
               await this.redisService.setStreamData('TPEprocesslogs', key + upId, JSON.stringify(deci));
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
                var deci = {};
               deci['nodeName'] = pfjson[i].nodeName;
               deci['nodeId'] = pfjson[i].nodeId;
               deci['nodeType'] = pfjson[i].nodeType;
               deci['request'] = fdataReq
               deci['response'] = fdataRes
               await this.redisService.setStreamData('TPEprocesslogs', key + upId, JSON.stringify(deci));
               }
               var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson[i].nodeId + '.data.pro');
               await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson[i].nodeName + '.PRO', setData)
               this.logger.log(fdataReq)
               this.logger.log(fdataRes)
               nodeid = pfjson[i].routeArray[0].nodeId;
               this.logger.log("webhook node completed...")
             } catch (err) {
               var errorobj = await this.commonService.errorobj(err)  
               errorobj['nodeName'] = pfjson[i].nodeName
               errorobj['nodeId'] = pfjson[i].nodeId       
               errorobj['previousArray'] = arr.pop()
               await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(errorobj))
               await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson[i].nodeName + '.PRO', JSON.stringify(errorobj), 'exception')
               errorobj['key']=key
               errorobj['upId']=upId
               throw new BadRequestException(errorobj)
             }
           }else{
               var errorobj = await this.commonService.errorobj('Permission Restricted to Execute the '+pfjson[i].nodeName)  
               errorobj['errorCategory'] = 'Security'
               errorobj['nodeName'] = pfjson[i].nodeName
               errorobj['nodeId'] = pfjson[i].nodeId   
                 
             await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(errorobj))
             throw new UnauthorizedException('Permission Restricted to Execute the '+pfjson[i].nodeName) 
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
                if (mapper.pre.mapData) {
                  let preRequest = JSON.parse(currNode).mapper.pre.request
                  let preResponse = JSON.parse(currNode).mapper.pre.response
                  let preMapData = JSON.parse(currNode).mapper.pre.mapData
                  let mapperResult = await this.commonService.mapper(preRequest, preResponse, preMapData)
                  m = 1;
                  var mapperResponse = { "MapperResult": mapperResult };
                }
                if (mapper.pro.mapData) {
                  let proRequest = JSON.parse(currNode).mapper.pro.request
                  let proResponse = JSON.parse(currNode).mapper.pro.response
                  let proMapData = JSON.parse(currNode).mapper.pro.mapData
                  let mapperResult = await this.commonService.mapper(proRequest, proResponse, proMapData)
                  m = 1;
                  var mapperResponse = { "MapperResult": mapperResult };
                }
                if (mapper.pst.mapData) {
                  let pstRequest = JSON.parse(currNode).mapper.pst.request
                  let pstResponse = JSON.parse(currNode).mapper.pst.response
                  let pstMapData = JSON.parse(currNode).mapper.pst.mapData
                  let mapperResult = await this.commonService.mapper(pstRequest, pstResponse, pstMapData)
                  m = 1;
                  var mapperResponse = { "MapperResult": mapperResult };
                }
              }

              if (c == 1)
                cmresult = Object.assign(cusCodeResponse)
              if (m == 1)
                cmresult = Object.assign(cmresult, mapperResponse)

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
                  var deci = {};
                  deci['nodeName'] = pfjson[i].nodeName;
                  deci['nodeId'] = pfjson[i].nodeId;
                  deci['nodeType'] = pfjson[i].nodeType;
                  deci['request'] = decirequest
                  deci['response'] = resData

                  await this.redisService.setStreamData('PElogs', key + upId, JSON.stringify(deci));                 
                  this.logger.log("decision node execution completed..")
                  break
                }
              }

            } catch (error) {
              var errorobj = await this.commonService.errorobj(error)
              errorobj['nodeName'] = pfjson[i].nodeName
              errorobj['nodeId'] = pfjson[i].nodeId 
              arr.pop()
              errorobj['previousArray'] = arr
              await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(errorobj))
              await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson[i].nodeName + '.PRO', JSON.stringify(errorobj), 'exception')
              errorobj['key']=key
              errorobj['upId']=upId
              throw new BadRequestException(errorobj)
              }
          }else{
            var errorobj = await this.commonService.errorobj('Permission Restricted to Execute the '+pfjson[i].nodeName)  
            errorobj['errorCategory'] = 'Security'
            errorobj['nodeName'] = pfjson[i].nodeName
            errorobj['nodeId'] = pfjson[i].nodeId                 
            await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(errorobj))
            throw new UnauthorizedException('Permission Restricted to Execute the '+pfjson[i].nodeName) 
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
            var errorobj = await this.commonService.errorobj('Permission Restricted to Execute the '+pfjson[i].nodeName)  
            errorobj['errorCategory'] = 'Security'
            errorobj['nodeName'] = pfjson[i].nodeName
            errorobj['nodeId'] = pfjson[i].nodeId  
            await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(errorobj))           
            throw new UnauthorizedException('Permission Restricted to Execute the '+pfjson[i].nodeName) 
           }
        }

        if (pfjson[i].nodeType == 'endnode') {
          var obj = {};
          obj['nodeid'] = pfjson[i].nodeId;
          obj['nodename'] = pfjson[i].nodeName;
          obj['nodetype'] = pfjson[i].nodeType;
          arr.push(obj);
          var deci = {};
          deci['nodeName'] = pfjson[i].nodeName;
          deci['nodeId'] = pfjson[i].nodeId;
          deci['nodeType'] = pfjson[i].nodeType;
          //logging End nodename in stream
          await this.redisService.setStreamData('PElogs', key + upId, JSON.stringify(deci));
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
      var errorobj = await this.commonService.errorobj(error)
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
      var m = 0;
      var mapper = JSON.parse(currNode).mapper
      if (mapper) {
        if (mapper.pre.mapData) {
          let preRequest = JSON.parse(currNode).mapper.pre.request
          let preResponse = JSON.parse(currNode).mapper.pre.response
          let preMapData = JSON.parse(currNode).mapper.pre.mapData
          let mapperResult = await this.commonService.mapper(preRequest, preResponse, preMapData)
          m = 1;
          var mapperResponse = { "MapperResult": mapperResult };
        }
        if (mapper.pro.mapData) {
          let proRequest = JSON.parse(currNode).mapper.pro.request
          let proResponse = JSON.parse(currNode).mapper.pro.response
          let proMapData = JSON.parse(currNode).mapper.pro.mapData
          let mapperResult = await this.commonService.mapper(proRequest, proResponse, proMapData)
          m = 1;
          var mapperResponse = { "MapperResult": mapperResult };
        }
        if (mapper.pst.mapData) {
          let pstRequest = JSON.parse(currNode).mapper.pst.request
          let pstResponse = JSON.parse(currNode).mapper.pst.response
          let pstMapData = JSON.parse(currNode).mapper.pst.mapData
          let mapperResult = await this.commonService.mapper(pstRequest, pstResponse, pstMapData)
          m = 1;
          var mapperResponse = { "MapperResult": mapperResult };
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
      if (m == 1)
        cmresult = Object.assign(cmresult, mapperResponse)

      apiresult = Object.assign(apiresult, data)
      if (Object.keys(cmresult).length > 0)
        apiresult = Object.assign(apiresult, cmresult)

      if (data != true) {
        await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify(apiresult), pfjson.nodeId + '.data.pro.response')
      }

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

      var deci = {};
      deci['nodeName'] = pfjson.nodeName;
      deci['nodeId'] = pfjson.nodeId;
      deci['nodeType'] = pfjson.nodeType;
      deci['request'] = req
      deci['response'] = apiresult

      await this.redisService.setStreamData('PElogs', key + upId, JSON.stringify(deci));
    } catch (error) {   
      var errorobj = await this.commonService.errorobj(error)
      errorobj['nodeName'] = pfjson.nodeName
      errorobj['nodeId'] = pfjson.nodeId 
      arr.pop()
      errorobj['previousArray'] = arr
      await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(errorobj))
      await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson.nodeName + '.PRO', JSON.stringify(errorobj), 'exception')
      errorobj['key']=key
      errorobj['upId']=upId
      throw new BadRequestException(errorobj)
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
      var errorobj = await this.commonService.errorobj(error)
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
      const postres = await axios.post(url, params)
      return postres.data
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


