import { BadRequestException,Injectable, Logger, UnauthorizedException, } from '@nestjs/common';
//const  Xid = require('xid-js');
import Xid from 'xid-js'
import 'dotenv/config';
import { format } from 'date-fns';
import { RedisService } from 'src/redisService';
import { GoRuleEngine } from 'src/gorule';
import { PeCommonService } from './peCommonService';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import { CommonService } from 'src/commonService';

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
  constructor(  private readonly jwtService: JwtService,  private readonly redisService : RedisService,private readonly comnService: CommonService, private readonly commonService: PeCommonService) {}
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
    var response = JSON.parse(await this.redisService.getJsonDataWithPath(key+upId+":NPCI:"+nodeName,'.response'))
    return response
  }
  
  /* 
    To Store the form data to humantask node's request(if request was empty)
    @param key      - The key used to identify the process flow.
    @param nodeName - The name of the node whose property needs to be updated.
    @param fdata    - The form data to be set as the node property.
    @param role     - The role passed to check permission in process execution.
  */
  async getFormdata(key,upId, nodeId, nodeName, fdata, role){ 
    var fjson = await this.redisService.getJsonData( key + 'processFlow'); 
    if(!fjson){
      this.logger.log("Processflow does not exist");
        throw new BadRequestException("Processflow does not exist. Please check the key");
      }
      var fdjson: any = JSON.parse(fjson);  
      for (var z = 0; z < fdjson.length; z++) { 
        if( fdjson[z].nodeType == 'humantasknode' && fdjson[z].nodeId == nodeId){ // identify the humantask node from the flow            
          await this.redisService.setJsonData(key + 'nodeProperty',JSON.stringify(fdata),fdjson[z].nodeId+'.data.pro.response')
        }
      }   
     var response = await this.debugcall(key,upId);   
     return response;  
  }

    /**
     * Asynchronously returns the form data for a humantask node in the process flow.
     *
     * @param {string} key - The key used to identify the process flow.
     * @param {string} upId - The unique identifier for the process flow.
     * @return {Promise<Object|string>} An object containing the form data and mode, or 'Success' if no form data is found.
     */
  async returnformdata(key,upId){
    const json = await this.redisService.getJsonData( key + 'processFlow'); 
      var pfjson: any = JSON.parse(json);  
      for (var i = 0; i < pfjson.length; i++) {   
        if(pfjson[i].nodeType == 'humantasknode'){        
          var mconfig = await this.redisService.getJsonDataWithPath(key + 'nodeProperty','.'+pfjson[i].nodeId+'.data.pro')
          var formdata = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty','.'+pfjson[i].nodeId+'.execution.pro.url'))
         
          var robj = {}
          robj['key'] = key
          robj['upId'] = upId
          robj['nodeId'] = pfjson[i].nodeId
          robj['nodeName'] = pfjson[i].nodeName
          robj['url'] = formdata          
          robj['mode'] = 'D'         
          //returns the URL if request data doesn't exist       
          var req = JSON.parse(mconfig).response          
          if(Object.keys(req).length == 0){
            return robj;
          }                       
        }                
      }   
      return 'Success' 
  }
  /*
    Based on a given valid key & role, debug execution takes place & respective request,response are stored in NPCI
    @param key  - The key used to identify the process flow.  
    @param role - Check if the incoming role had a permission to enter this method
  */

  async debugcall(key,upId){
    await this.debugpfPreProcessor(key,upId);             
    await this.debugpfProcessor(key,upId);   
    await this.debugpfPostProcessor(key,upId); 
    return {status:201,key:key,upid:upId}; 
  }

    /**
   * Asynchronously executes the debug process based on a given valid key and role check.
   *
   * @param {string} key - The key used to identify the process flow.
   * @param {string} role - Check if the incoming role had a permission to enter this method.
   * @return {Promise<Object>} - A promise that resolves to an object with a status and error message if permission is denied,
   * or an object with a status, key, and upId if the debug process is successful.
   */
  async getdebug(sfkey,key, token){
   
      this.logger.log("Debug Execution Started....")  
      const decoded =  this.jwtService.decode(token,{ json: true })      
    
      var psjson:any = await this.comnService.getSecurityJson(sfkey,decoded);
      console.log("PSjson",psjson);
      if(typeof psjson !== 'object'){
        return psjson
      }
      var sjson = await this.commonService.getPSJson(key,decoded,psjson)  
      console.log("Sjson",sjson);
      if(typeof sjson !== 'object'){
        return sjson
      }
      var incomingarr = sjson['PFaction']
      var flag = sjson['PFflag']
      var permit
      console.log(sjson);
      if(flag == 'E'){
        permit = incomingarr.includes('Debug')
        if(permit){
          return {status:400,err:"Permission Denied to Debug"}  
        }           
      }
      else if(flag == 'A'){
        permit = incomingarr.includes('Debug')
        if(!permit)
          return {status:400,err:"Permission Denied to Debug"}
        else{
         var upId = Xid.next()         
         var formjson = await this.returnformdata(key,upId)                 
            if(formjson == 'Success') {  
              var response = await this.debugcall(key,upId)   
              return response     
            }
            else{
              return {status:201,formjson};      
            }          
        }      
      }           
      
  }  
  
  /*  
    Debug Execution takes place by iterating through the all the nodes    
    and executing the corresponding logic for each node type.
    @param key - The key used to identify the process flow.  
  */
  async debugpfProcessor(key,upId) {

    this.logger.log('Debug Pf Processor started!');    
    try{
    var arr = [];
    var nodeid;  
    var node_name;   
  
    // Read ProcessFlow Json to process nodes
      const json = await this.redisService.getJsonData( key + 'processFlow');  
      var pfjson: any = JSON.parse(json);         
    
    for (var i = 0; i < pfjson.length; i++) { 
      
      // Start Node
      if (pfjson[i].nodeType == 'startnode') {
        node_name = pfjson[i].nodeName;
        var obj = {};
        obj['nodeid'] = pfjson[i].nodeId;
        obj['nodename'] = pfjson[i].nodeName;
        obj['nodetype'] = pfjson[i].nodeType;
        
        arr.push(obj);
        var deci = {};
        deci['nodeName']=pfjson[i].nodeName; 

         //logging nodename in stream        
        await this.redisService.setStreamData('TPEDebuglogs', key+upId, JSON.stringify(deci));
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
             
              var mconfig = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId+'.data.pro.response'))
               
              //set NPCI request
              await this.redisService.setJsonData(key + upId+':NPCI:'+pfjson[i].nodeName, JSON.stringify(mconfig), 'response')
             
              var fdataReq = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId+'.data.pro.request');       
              var fdataRes = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId+'.data.pro.response');       
              
              //set NPCI response
             
              nodeid = pfjson[i].routeArray[0].nodeId; 
              
              for(var y=0; y<pfjson.length; y++){
                if(pfjson[y].nodeType == "apinode" || pfjson[y].nodeType == "decisionnode"){
                  await this.redisService.setJsonData(key + upId+':NPCI:'+pfjson[y].nodeName, JSON.stringify(mconfig), 'request')             
                }
              }
              var deci = {};
              deci['nodeName'] = pfjson[i].nodeName;          
              deci['request']  = JSON.parse(fdataReq)
              deci['response'] = JSON.parse(fdataRes)               
              await this.redisService.setStreamData('TPEDebuglogs', key+upId, JSON.stringify(deci));
         
          this.logger.log("Humantask node completed..")       
        }catch(error)
        {
          var errorobj = await this.commonService.errorobj(error) 
          errorobj['previousArray'] = obj
          await this.redisService.setStreamData('TPEDebugExceptionlogs', key+upId, JSON.stringify(errorobj))            
          await this.redisService.setJsonData(key + upId+':NPCI:'+ pfjson[i].nodeName, JSON.stringify(errorobj),'exception')
          throw error
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
          arr.push(obj);   
          
          var currNode = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId);                         
          
          var r=0;
          var ruleChk = JSON.parse(currNode).rule         
          if(ruleChk){         
            var zenresult = await this.zenrule(key,ruleChk,upId,pfjson[i].nodeName,pfjson[i].nodeId)
            r=1;    
            var zenResponse = {"ZenResult":zenresult}              
          }  
         
          var c=0;
          var custconf = JSON.parse(currNode).customCode 
          if(custconf){            
            if(custconf.request.code){
              var codedata = custconf.request.code             
              var customcoderesult = await this.customCodeProcess(key,upId,codedata,arr);
              c=1;             
              var customCodeResponse = {"CustomCodeResult":customcoderesult}                          
            }
          }
          
          var m=0;
          var mapper = JSON.parse(currNode).mapper
          if(mapper){
            if(mapper.pre.mapData){
              let preRequest = JSON.parse(currNode).mapper.pre.request
              let preResponse = JSON.parse(currNode).mapper.pre.response
              let preMapData = JSON.parse(currNode).mapper.pre.mapData
              let mapperResult = await this.commonService.mapper(preRequest, preResponse,preMapData)
              m=1;
              var mapperResponse = {"Mapper Result":mapperResult};              
            }    
            if(mapper.pro.mapData){
              let proRequest = JSON.parse(currNode).mapper.pro.request
              let proResponse = JSON.parse(currNode).mapper.pro.response
              let proMapData = JSON.parse(currNode).mapper.pro.mapData
              let mapperResult = await this.commonService.mapper(proRequest, proResponse,proMapData)
              m=1;
              var mapperResponse = {"Mapper Result":mapperResult};              
            }  
            if(mapper.pst.mapData){
              let pstRequest = JSON.parse(currNode).mapper.pst.request
              let pstResponse = JSON.parse(currNode).mapper.pst.response
              let pstMapData = JSON.parse(currNode).mapper.pst.mapData
              let mapperResult = await this.commonService.mapper(pstRequest, pstResponse,pstMapData )
              m=1;
              var mapperResponse = {"Mapper Result":mapperResult};         
            }     
          }
                      
            var cmresult = {}
            var deciresult = {statuscode: 200,status: 'SUCCESS'}
            if(r==1)
              cmresult = Object.assign(zenResponse) 
            if(c==1)
              cmresult = Object.assign(cmresult,customCodeResponse)           
            if(m == 1)
              cmresult = Object.assign(cmresult,mapperResponse) 

            
            for (var k = 0; k < pfjson[i].routeArray.length; k++) { 
              // check the rule engine result with process flow result of identification of next node        
              if (pfjson[i].routeArray[k].conditionResult == zenresult) {  
                deciresult = Object.assign(deciresult,pfjson[i].routeArray[k])  
                if(Object.keys(cmresult).length>0) 
                  deciresult =  Object.assign(deciresult,cmresult)
                await this.redisService.setJsonData(key + upId +':NPCI:'+ pfjson[i].nodeName ,JSON.stringify(deciresult),'response');        
                nodeid = pfjson[i].routeArray[k].nodeId; 
                var decirequest = await this.redisService.getJsonDataWithPath(key +upId +':NPCI:'+ pfjson[i].nodeName,'.request'); 
                var setData = await this.redisService.getJsonDataWithPath(key + upId +':NPCI:'+ pfjson[i].nodeName,'.response'); 
                                
                var deci = {};
                deci['nodeName']=pfjson[i].nodeName;
                deci['request'] =  decirequest    
                deci['response'] =  JSON.parse(setData)           
                await this.redisService.setStreamData('TPEDebuglogs', key+upId, JSON.stringify(deci));
                this.logger.log("decision node execution completed..") 
                break            
              }  
            }
         
      }catch(error){
        var errorobj = await this.commonService.errorobj(error) 
        errorobj['previousArray'] = obj
        await this.redisService.setStreamData('TPEDebugExceptionlogs', key+upId, JSON.stringify(errorobj))      
        await this.redisService.setJsonData(key + upId+':NPCI:'+ pfjson[i].nodeName, JSON.stringify(errorobj), 'exception')
        throw error
      }       
      }        
             
      // Api Node

      if (nodeid == pfjson[i].nodeId && pfjson[i].nodeType == 'apinode' && (pfjson[i].nodeType != 'startnode' || pfjson[i].nodeType != 'endnode')) {
      
        this.logger.log("Api Node execution started")     
        node_name=pfjson[i].nodeName;
        var obj = {};
        obj['nodeid'] = pfjson[i].nodeId;
        obj['nodename'] = pfjson[i].nodeName;
        obj['nodetype'] = pfjson[i].nodeType;
        arr.push(obj);   
        // microservice execution
          await this.nodeProcessor(key,upId,pfjson[i],arr)
        
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

        var deci = {};
        deci['nodeName']=pfjson[i].nodeName;
        
        //logging nodename in stream
        await this.redisService.setStreamData('TPEDebuglogs', key+upId, JSON.stringify(deci));
      break;
      }
      }     
    await this.redisService.setJsonData(key+'response',JSON.stringify(arr))
    return arr
    }catch(error){
      // var errorobj = await this.commonService.errorobj(error)     
      // errorobj['previousArray'] = obj
      // await this.redisService.setStreamData('TPEDebugExceptionlogs', key+upId , JSON.stringify(errorobj));
      throw error; 
    }  
  }

  /*   
    Makes an API call using the url and stores the response in respective node.
    @params key    - The key passed to identify the particular node in process flow.
    @params pfjson - This variable holding the values of parsed process flow json
    @params input -  This is passed to form the url with current node name         
  */
  async nodeProcessor(key,upId,pfjson,arr){
      
    this.logger.log('Node Processor started!');      
      try{          
        var apiconfig = JSON.parse(await this.redisService.getJsonDataWithPath(key + upId+':NPCI:'+ pfjson.nodeName,'.request'))
              
        var currNode = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId); 
        
        var c=0;
        var custconf = JSON.parse(currNode).customCode 
          if(custconf){            
            if(custconf.request.code){
              var codedata = custconf.request.code             
              var customcoderesult = await this.customCodeProcess(key,upId,codedata,arr);
              c=1;
              var customCodeResponse = {"CustomCodeResult":customcoderesult}               
            }          
          }
          var s=0;      

          var ruleChk = JSON.parse(currNode).rule
          if(ruleChk){
            var zenresult = await this.zenrule(key,ruleChk,upId,pfjson.nodeName,pfjson.nodeId) 
            s=1;   
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
          var data        
          var url =  JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId+'.execution.pro.url'))   

          data = await this.postapicall(url,apiconfig)
                    
         
          var cmresult = {}
          var apiresult =  {statuscode: 200,status: 'SUCCESS'}
          if(s==1)
            cmresult = Object.assign(zenResponse) 
          if(c==1)
            cmresult = Object.assign(cmresult,customCodeResponse)           
          if(m == 1)
            cmresult = Object.assign(cmresult,mapperResponse) 
                 
         
          apiresult = Object.assign(apiresult,data)  
          if(Object.keys(cmresult).length>0)  
            apiresult = Object.assign(apiresult,cmresult)  
         
         
          if(data != true){  
            //store the object in the NPCI's response
            await this.redisService.setJsonData(key + upId+':NPCI:'+ pfjson.nodeName, JSON.stringify(apiresult), 'response')
          }               

          var setData = JSON.parse(await this.redisService.getJsonDataWithPath(key + upId+':NPCI:'+ pfjson.nodeName,  '.response'))
        
          var deci = {};
          deci['nodeName']=pfjson.nodeName;
          deci['request'] = apiconfig
          deci['response'] =  setData
         
          await this.redisService.setStreamData('TPEDebuglogs', key+upId, JSON.stringify(deci));
    
      }catch(error){
        var errorobj = await this.commonService.errorobj(error)     
        errorobj['previousArray'] = arr  
        await this.redisService.setStreamData('TPEDebugExceptionlogs',key+upId, JSON.stringify(errorobj))
        await this.redisService.setJsonData(key + upId+':NPCI:'+ pfjson.nodeName, JSON.stringify(errorobj),'exception')     
        throw error
      }      
  }


  /*
    Based on a given valid key & role, to debug a specific node in a process flow. 
    validates the wrong flow, retrieves the request data based on the node type and additional parameters & 
    store it to NPCI, then calls the debugProcessor method.
    If no additional parameters are provided,it returns the existing NPCI data.
  */
  async getdebugNodeProcess(sfnodeDetails,key,upId,nodeName,nodeType,nodeId, params) { 
    this.logger.log("Node level Debug started")
      try {   
        var nodeSjson = await this.commonService.getNodeSecurityJson(sfnodeDetails,nodeName)
        
        if(nodeSjson == true){
          await this.redisService.setJsonData(key + upId +':NPCI:'+ nodeName, JSON.stringify(params), 'request')  
          await this.debugProcessor(key,upId,nodeName,nodeId);                  
          return 'Success'
        }else{          
          throw new UnauthorizedException('Permission Restricted to Execute the '+nodeName)        
        }                 
      }catch (error) {    
        return {status:400,err:error}                  
      }    
  }
   

//--------------------------------pfPreProcessor------------------------------------
  
 /*
    Checks Processflow json along with all nodes having config, 
    workflow and setting placeholder for NPCI
    @param key - The key used to identify the process flow.
  */
  async debugpfPreProcessor(key,upId) { 

    this.logger.log('Debug Pf PreProcessor started!');   
    try{ 
    var placeholder = {"request":{},"response":{},"exception":{}}    
    const json = await this.redisService.getJsonData( key + 'processFlow');      
    var pfjson: any = JSON.parse(json);        
    
    for (var i = 0; i < pfjson.length; i++) { 
      if(pfjson[i].nodeType != 'startnode' && pfjson[i].nodeType != 'endnode'){ 
        await this.redisService.setJsonData(key+upId+':NPCI:'+ pfjson[i].nodeName, JSON.stringify(placeholder))      
      }
    }
    return 'Success'
    }catch(error){
      var errorobj = await this.commonService.errorobj(error)    
      await this.redisService.setJsonData(key + upId + ':ERR:'+ pfjson[i].nodeName, JSON.stringify(errorobj))
      throw errorobj
    }
  }
  


  
// --------------------------------pfProcessor--------------------------------------

  /*
    Debug the a specific node in process flow based on a given key and specific node name.
    @params key - The key used to identify the process flow.
    @params node_name - The specific node name for which the debugging is targeted.
  */

  async debugProcessor(key,upId,node_name,nodeId) {  
  
      this.logger.log('Debug Node Processor started!');
      try{
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
          
            await this.redisService.setStreamData('TPENodeDebuglogs', key+ upId, JSON.stringify(deci));
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
          var fdataReq = JSON.parse(await this.redisService.getJsonDataWithPath(key + upId+':NPCI:'+pfjson[i].nodeName, '.request'));       
          await this.redisService.setJsonData(key + upId+':NPCI:'+pfjson[i].nodeName,JSON.stringify(fdataReq), 'response');       
         
          
          for(var y=0; y<pfjson.length; y++){
            if(pfjson[y].nodeType == "apinode" || pfjson[y].nodeType == "decisionnode"){
              await this.redisService.setJsonData(key + upId+':NPCI:'+pfjson[y].nodeName, JSON.stringify(fdataReq), 'request')             
            }
          }
          var deci = {};
          deci['nodeName'] = pfjson[i].nodeName;          
          deci['request']  = fdataReq
          deci['response'] = fdataReq      
          await this.redisService.setStreamData('TPENodeDebuglogs', key+upId, JSON.stringify(deci));
        }
        nodeid = pfjson[i].routeArray[0].nodeId; 
        this.logger.log("Humantask node completed..")   

        }catch(error)
        {
          var errorobj = await this.commonService.errorobj(error) 
          errorobj['previousArray'] = obj
          await this.redisService.setStreamData('TPENodeDebugExceptionlogs', key+upId, JSON.stringify(errorobj))
        
          await this.redisService.setJsonData(key + upId+':NPCI:'+ pfjson[i].nodeName, JSON.stringify(errorobj),'exception')
          throw error
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
            var currNode = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson[i].nodeId);                         
          
            var ruleChk = JSON.parse(currNode).rule         
            if(ruleChk){
              var zenresult = await this.zenrule(key,ruleChk,upId,pfjson[i].nodeName,pfjson[i].nodeId)               
            }  

            if(node_name == pfjson[i].nodeName){
            var c=0
            var custconf = JSON.parse(currNode).customCode 
            if(custconf){            
              if(custconf.request.code){
                var codedata = custconf.request.code
                var customcoderesult = await this.commonService.customCodeProcess(key,codedata,arr);
                c=1
                var customCodeResponse = {"CustomCodeResult":customcoderesult} 
              }
            }           
           
            var m=0
            var mapper = JSON.parse(currNode).mapper
            if(mapper){
              if(mapper.pre.mapData){
                let preRequest = JSON.parse(currNode).mapper.pre.request
                let preResponse = JSON.parse(currNode).mapper.pre.response
                let preMapData = JSON.parse(currNode).mapper.pre.mapData
                let mapperResult = await this.commonService.mapper(preRequest, preResponse,preMapData)
                m=1
                var mapperResponse = {"Mapper Result":mapperResult};                
              }    
              if(mapper.pro.mapData){
                let proRequest = JSON.parse(currNode).mapper.pro.request
                let proResponse = JSON.parse(currNode).mapper.pro.response
                let proMapData = JSON.parse(currNode).mapper.pro.mapData
                let mapperResult = await this.commonService.mapper(proRequest, proResponse,proMapData)
                m=1
                var mapperResponse = {"Mapper Result":mapperResult};               
              }  
              if(mapper.pst.mapData){
                let pstRequest = JSON.parse(currNode).mapper.pst.request
                let pstResponse = JSON.parse(currNode).mapper.pst.response
                let pstMapData = JSON.parse(currNode).mapper.pst.mapData
                let mapperResult = await this.commonService.mapper(pstRequest, pstResponse,pstMapData )
                m=1
                var mapperResponse = {"Mapper Result":mapperResult}          
              }     
            }            
          
              if(c==1)
                cmresult = Object.assign(customCodeResponse)           
              if(m==1)
                cmresult = Object.assign(cmresult,mapperResponse) 
            }            
              for (var k = 0; k < pfjson[i].routeArray.length; k++) {                 
                if (pfjson[i].routeArray[k].conditionResult == zenresult) {                 
                  var deciresult ={statuscode: 200,status: 'SUCCESS'}                   
                    deciresult = Object.assign(deciresult,pfjson[i].routeArray[k])  
                    if(Object.keys(cmresult).length>0)
                    deciresult = Object.assign(deciresult,cmresult)              
                    await this.redisService.setJsonData(key + upId +':NPCI:'+ pfjson[i].nodeName ,JSON.stringify(deciresult),'response');
                  
                  var decirequest =  await this.redisService.getJsonDataWithPath(key + upId  +':NPCI:'+ pfjson[i].nodeName,'.request'); 
                  var resData = await this.redisService.getJsonDataWithPath(key + upId  +':NPCI:'+ pfjson[i].nodeName,'.response'); 
                  nodeid = pfjson[i].routeArray[k].nodeId;  
                  var deci = {};
                  deci['nodeName'] = pfjson[i].nodeName;             
                  deci['request'] =  JSON.parse(decirequest)   
                  deci['response'] = JSON.parse(resData)  
                  await this.redisService.setStreamData('TPENodeDebuglogs', key+upId, JSON.stringify(deci));
                  this.logger.log("decision node execution completed..")
                  break;
                }
              }              
              
            } catch (error) {
              var errorobj = await this.commonService.errorobj(error)         
              errorobj['previousArray'] = obj   
            await this.redisService.setStreamData('TPENodeDebugExceptionlogs', key+upId, JSON.stringify(errorobj));
            await this.redisService.setJsonData(key + upId +':NPCI:'+ pfjson[i].nodeName, JSON.stringify(errorobj) ,'exception')
            throw error
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
          await this.nodedebugProcessor(key,upId,pfjson[i],node_name,arr)
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

          var deci = {};
          deci['nodeName'] = pfjson[i].nodeName;         
          
          //logging End nodename in stream         
          await this.redisService.setStreamData('TPENodeDebuglogs', key+upId, JSON.stringify(deci));
          this.logger.log("End node executed") 
        break;
        }
        }      
      await this.redisService.setJsonData(key+'Debugresponse',JSON.stringify(arr))
      this.logger.log("Node level Debug completed") 
      
      }catch(error){    
        //var errorobj = await this.commonService.errorobj(error)     
        //errorobj['previousArray'] = obj
       // await this.redisService.setStreamData('TPENodeDebugExceptionlogs', key+upId , JSON.stringify(errorobj));
        await this.redisService.setJsonData(key+upId+':NPCI:'+ pfjson[i].nodeName, JSON.stringify(errorobj),'exception') 
        throw error; 
      }   
  }

  /*  
    Performs API call (make avaiable Pro data in NPC,IPC) for a specific node
    @params key    - The key passed to identify the particular node in process flow.
    @params pfjson - This variable holding the values of parsed process flow json
    @params input  - This is passed to form the url with current node name              
  */
  async  nodedebugProcessor(key,upId,pfjson,node_name,arr){    
    this.logger.log('Node Processor started!');        
      try{   
        var apiresult = {}
        var apiconfig = JSON.parse(await this.redisService.getJsonDataWithPath(key + upId+':NPCI:'+ pfjson.nodeName,'.request'))
      
        var currNode = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId);                                   
        
        var c=0   
        var custconf = JSON.parse(currNode).customCode 
            if(custconf){            
              if(custconf.request.code){
                var codedata = custconf.request.code
                var customcoderesult = await this.commonService.customCodeProcess(key,codedata,arr);
                c=1
                var customCodeResponse = {"CustomCodeResult":customcoderesult}     
                        
              }          
            }

          var s=0;   
          var ruleChk = JSON.parse(currNode).rule
          if(ruleChk){
            var zenresult = await this.zenrule(key,ruleChk,upId,pfjson.nodeName,pfjson.nodeId)        
            s=1;   
            var zenResponse = {"ZenResult":zenresult} 
              
          }  

          var m=0
          var mapper = JSON.parse(currNode).mapper
          if(mapper){
            if(mapper.pre.mapData){
              let preRequest = JSON.parse(currNode).mapper.pre.request
              let preResponse = JSON.parse(currNode).mapper.pre.response
              let preMapData = JSON.parse(currNode).mapper.pre.mapData
              let mapperResult = await this.commonService.mapper(preRequest, preResponse,preMapData)
              m=1
              var mapperResponse = {"Mapper Result":mapperResult}; 
               
            }    
            if(mapper.pro.mapData){
              let proRequest = JSON.parse(currNode).mapper.pro.request
              let proResponse = JSON.parse(currNode).mapper.pro.response
              let proMapData = JSON.parse(currNode).mapper.pro.mapData
              let mapperResult = await this.commonService.mapper(proRequest, proResponse,proMapData)
              m=1
              var mapperResponse = {"Mapper Result":mapperResult}; 
              
            }  
            if(mapper.pst.mapData){
              let pstRequest = JSON.parse(currNode).mapper.pst.request
              let pstResponse = JSON.parse(currNode).mapper.pst.response
              let pstMapData = JSON.parse(currNode).mapper.pst.mapData
              let mapperResult = await this.commonService.mapper(pstRequest, pstResponse,pstMapData )
              m=1
              var mapperResponse = {"Mapper Result":mapperResult}; 
           
            }     
          }
        var url =  JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+pfjson.nodeId+'.execution.pro.url'))   
        var data = await this.postapicall(url,apiconfig) 
             
          var cmresult = {}
          var debugapiresult = {statuscode: 200,status: 'SUCCESS'}
          if(s==1)
            cmresult = Object.assign(zenResponse)
          if(c==1)
            cmresult = Object.assign(cmresult,customCodeResponse)           
          if(m == 1)
            cmresult = Object.assign(cmresult,mapperResponse) 
           
           debugapiresult = Object.assign(debugapiresult,data)
           if(Object.keys(cmresult).length>0)
            debugapiresult = Object.assign(debugapiresult,cmresult)
         
        
          if(data != true){
            await this.redisService.setJsonData(key+upId+':NPCI:'+ node_name, JSON.stringify(debugapiresult), 'response') 
          }                           
         
           var req = await this.redisService.getJsonDataWithPath(key+upId+':NPCI:'+ node_name, '.request')
       
           var setData = await this.redisService.getJsonDataWithPath(key+upId+':NPCI:'+ node_name, '.response')
       
           var deci = {};
          deci['nodeName']=pfjson.nodeName;       
          deci['request'] =JSON.parse(req)
          deci['response'] =  JSON.parse(setData)      
       
        await this.redisService.setStreamData('TPENodeDebuglogs', key+upId, JSON.stringify(deci));
       
      }catch(error){
        var errorobj = await this.commonService.errorobj(error)   
        errorobj['previousArray'] = arr
        await this.redisService.setStreamData('TPENodeDebugExceptionlogs', key+upId , JSON.stringify(errorobj));  
        await this.redisService.setJsonData(key + upId+':NPCI:'+ pfjson.nodeName, JSON.stringify(errorobj), 'exception')           
     
        throw error
    }      
  }
  
    /**
   * Asynchronously executes the debugpfPostProcessor function.
   *
   * @param {string} key - The key used for identifying the process flow.
   * @param {string} upId - The unique identifier for the process flow.
   * @return {Promise<void>} A Promise that resolves when the function completes.
   */
  async debugpfPostProcessor(key,upId) {
    this.logger.log('Pf PostProcessor started!');
    //change flag in humantasknode when  execution is completed
    await this.changeFlag(key)  
   
    var keys = await this.redisService.getKeys(key + upId)
    for(var k=0;k<keys.length;k++){     
      await this.redisService.expire(keys[k],1000) //86400 secs = 1 day 'Datafabrics:TorusPOC:StreamTest:v2:cr5tw08ezv8jbt7173jg:NPC:Input.PST',
    }                                            //18000 secs = 5 hrs
  }

    /**
   * Asynchronously changes the flag in the humantasknode when the execution is completed.
   *
   * @param {string} key - The key used for identifying the process flow.
   * @return {Promise<void>} A Promise that resolves when the function completes.
   * @throws {Error} If there is an error retrieving the process flow or setting the node property.
   */
  async changeFlag(key){
    this.logger.log("Change Flag")
    try {
      const json = await this.redisService.getJsonData( key + 'processFlow');       
      var pfjson: any = JSON.parse(json);
      for(var i=0; i<pfjson.length; i++){      
        if(pfjson[i].nodeType == 'humantasknode' ) {
          await this.redisService.setJsonData(key + 'nodeProperty', JSON.stringify({}), pfjson[i].nodeId+'.data.pro.response')            
        }
      }
    } catch (error) {
      throw error
    }  
  }  

  /**
   * Asynchronously makes a POST request to the specified URL with the given parameters and returns the response data.
   * If an error occurs during the request, the error is logged and re-thrown.
   *
   * @param {Object} params - The parameters to include in the POST request body.
   * @return {Promise<Object>} The response data from the POST request.
   * @throws {Error} If there is an error making the POST request.
   */
  async postapicall(url,params){    
    this.logger.log('POST API Execution')    
        try {
          const postres = await axios.post(url, params)         
          return postres.data
        } catch (error) {
          console.error('Error occurred while posting data:', error);
          throw error
        }     
  }
  
  /**
   * Asynchronously executes a Go Rule engine with the given parameters and returns the output of the rule execution.
   *
   * @param {any} key - The key used to retrieve node properties from Redis.
   * @param {any} rule - The rule to be executed by the Go Rule engine.
   * @param {any} upId - The ID used to retrieve node properties from Redis.
   * @param {any} nodeName - The name of the node.
   * @param {any} nodeId - The ID of the node.
   * @return {Promise<any>} The output of the rule execution.
   */
  async zenrule(key:any,rule:any,upId:any,nodeName:any,nodeId){
    this.logger.log("Go Rule Started")
    var goruleEngine : GoRuleEngine = new GoRuleEngine();    
   
    var greq = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+nodeId+'.rule..inputs'))  
    
    var gparamreq={};
        for(var g=0;g<greq.length;g++){     
          var decreq = JSON.parse(await this.redisService.getJsonDataWithPath(key + upId +':NPCI:'+ nodeName, '..' + greq[g].field));
          gparamreq[greq[g].field]=decreq        
        }  
      var goruleres = await goruleEngine.goRule((rule), gparamreq)     

      return (goruleres.result.output)
  }

  /**
   * Asynchronously processes custom code.
   *
   * @param {any} key - The key used to retrieve data from Redis.
   * @param {any} upId - The ID used to retrieve data from Redis.
   * @param {any} data - The custom code to be processed.
   * @param {any[]} arr - An array of objects containing node names.
   * @return {Promise<any>} The result of evaluating the custom code.
   */
  async customCodeProcess(key:any,upId:any,data:any,arr:any){    
    try {      
    
      if(data!= undefined){
      
      for(var k = 1; k < arr.length-1; k++){
        var curnName = (arr[k].nodename).toLowerCase();
        var str = data.indexOf(curnName)
        if(str != -1){           
        var value = await this.redisService.getJsonDataWithPath(key + upId +':NPCI:'+ arr[k].nodename, '.request')           
      
        var chkdata = JSON.parse(value) 
        // get the key and value of decision node request data        
        var chkkey = Object.keys(chkdata)
        var chkval = Object.values(chkdata)
        // form the data for replace the value in the customcode
        for(var s=0;s<chkkey.length;s++){
          var val = curnName+'.pro.request.'+chkkey[s]             
          if(data.indexOf(val)){
          data = data.replace(new RegExp(val, 'g'), chkval[s])      
         
        } 
        }         
    }         
  }
  
  //let result = ts.transpile(data);
  
  // evaluate the custom code 
  var t1 = eval(data);     
  return t1
  }
  else{
    return true
  }
    } catch (error) {
        throw error
    }
  }

}


