import { GoRuleEngine } from "src/gorule";
import { RedisService } from "src/redisService";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { format } from "date-fns";
import { CommonService } from "src/commonService";
var _ = require('underscore');
var { transform } = require("node-json-transform")

@Injectable()
export class TeCommonService {
  constructor(
    private readonly redisService: RedisService,
    private readonly commonService: CommonService,
    private readonly goruleEngine:GoRuleEngine) { }

  private readonly logger = new Logger(TeCommonService.name);
  
  /* validate the individual nodetype requirments for a given role and key
    @param key -  The key used to retrieve the security information.
    @param role - check whether the role exists in the request header or not
  */
  async validate(key) {
    try{
      this.logger.log("validate")
      var valarr: any = []
      var warnarr: any = []  
      
        var nodeProperty = await this.redisService.exist(key + 'nodeProperty')
  
        if (nodeProperty === 0) {
          var errobj = {}
          errobj['error'] = 'NodeProperty does not exist'
          valarr.push(errobj)
        }
        else {
          var fdjson: any = JSON.parse(await this.redisService.getJsonData(key + 'processFlow'));
          var nodeProperty = JSON.parse(await this.redisService.getJsonData(key + 'nodeProperty'));
          if(fdjson.length > 0){
            for (var z = 0; z < fdjson.length; z++) {
              if (fdjson[z].nodeType != 'startnode' && fdjson[z].nodeType != 'endnode') {
                var nodekeychk = Object.keys(nodeProperty).includes(fdjson[z].nodeId)
                if (nodekeychk == false) {
                  var errobj = {}
                  errobj['nodeName'] = fdjson[z].nodeName;
                  errobj['error'] = 'Node ID does not exist'
                  valarr.push(errobj)
                } else {
                  var hurlchk = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + fdjson[z].nodeId))
                  // var request: any = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.'+fdjson[z].nodeId+'.data');       
                  if (!hurlchk.data) {
                    var errobj = {}
                    errobj['nodeName'] = fdjson[z].nodeName;
                    errobj['error'] = 'config does not exist'
                    valarr.push(errobj)
                  } else {
                    if (hurlchk.nodeType == 'humantasknode') {
    
                      if (!hurlchk.execution) {
                       // console.log("execution URL does not exist");
                        var errobj = {}
                        errobj['nodeName'] = fdjson[z].nodeName;
                        errobj['error'] = 'execution URL does not exist'
                        valarr.push(errobj)
                      } else {
                        var hpreurl = hurlchk.execution.pre.url
                        if (_.isEmpty(hpreurl)) {
                          var errobj = {}
                          errobj['nodeName'] = fdjson[z].nodeName;
                          errobj['warning'] = 'PRE URL is empty'
                          warnarr.push(errobj)
                        } else {
                          var valid = await this.isUrlValid(hpreurl)
                          if (valid != true) {
                            var errobj = {}
                            errobj['nodeName'] = fdjson[z].nodeName;
                            errobj['error'] = valid
                            valarr.push(errobj)
                          }
                        }
    
                        var hprourl = hurlchk.execution.pro.url
                        if (_.isEmpty(hprourl)) {
                          var errobj = {}
                          errobj['nodeName'] = fdjson[z].nodeName;
                          errobj['error'] = 'PRO URL is required'
                          valarr.push(errobj)
                        } else {
                          var valid = await this.isUrlValid(hprourl)
                          if (valid != true) {
                            var errobj = {}
                            errobj['nodeName'] = fdjson[z].nodeName;
                            errobj['error'] = valid
                            valarr.push(errobj)
                          }
                        }
    
                        var hpsturl = hurlchk.execution.pst.url
                        if (_.isEmpty(hpsturl)) {
                          var errobj = {}
                          errobj['nodeName'] = fdjson[z].nodeName;
                          errobj['warning'] = 'PST URL is empty'
                          warnarr.push(errobj)
                        } else {
                          var valid = await this.isUrlValid(hpsturl)
                          if (valid != true) {
                            var errobj = {}
                            errobj['nodeName'] = fdjson[z].nodeName;
                            errobj['error'] = valid
                            valarr.push(errobj)
                          }
                        }
                      }
                    }
                    if (hurlchk.nodeType == 'apinode') {
                      // var aurlchk = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty','.'+fdjson[z].nodeId))
                      if (!hurlchk.execution) {
                       // console.log("execution URL does not exist");
                        var errobj = {}
                        errobj['nodeName'] = fdjson[z].nodeName;
                        errobj['warning'] = 'execution URL does not exist'
                        warnarr.push(errobj)
                      } else {
                        var apreurl = hurlchk.execution.pre.url
    
                        if (_.isEmpty(apreurl)) {
                          var errobj = {}
                          errobj['nodeName'] = fdjson[z].nodeName;
                          errobj['warning'] = 'PRE URL is empty'
                          warnarr.push(errobj)
                        } else {
                          var valid = await this.isUrlValid(apreurl)
                          if (valid != true) {
                            var errobj = {}
                            errobj['nodeName'] = fdjson[z].nodeName;
                            errobj['error'] = valid
                            valarr.push(errobj)
                          }
                        }
    
                        var aprourl = hurlchk.execution.pro.url
                        if (_.isEmpty(aprourl)) {
                          var errobj = {}
                          errobj['nodeName'] = fdjson[z].nodeName;
                          errobj['error'] = 'PRO URL is required'
                          valarr.push(errobj)
                        } else {
                          var valid = await this.isUrlValid(aprourl)
                          if (valid != true) {
                            var errobj = {}
                            errobj['nodeName'] = fdjson[z].nodeName;
                            errobj['error'] = valid
                            valarr.push(errobj)
                          }
                        }
    
                        var apsturl = hurlchk.execution.pst.url
                        //if(apsturl== ""){
                        if (_.isEmpty(apsturl)) {
                          var errobj = {}
                          errobj['nodeName'] = fdjson[z].nodeName;
                          errobj['warning'] = 'PST URL is empty'
                          warnarr.push(errobj)
                        } else {
                          var valid = await this.isUrlValid(aprourl)
                          if (valid != true) {
                            var errobj = {}
                            errobj['nodeName'] = fdjson[z].nodeName;
                            errobj['error'] = valid
                            valarr.push(errobj)
                          }
                        }
                      }
                    }
                    if (hurlchk.nodeType == 'decisionnode') {
                      // var drule = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty','.'+fdjson[z].nodeId))    
                      if (hurlchk.rule) {
                        if (hurlchk.rule.length == 0) {
                          var errobj = {}
                          errobj['nodeName'] = fdjson[z].nodeName;
                          errobj['error'] = 'Rule is empty'
                          valarr.push(errobj)
                        }
                      } else {
                        var errobj = {}
                        errobj['nodeName'] = fdjson[z].nodeName;
                        errobj['error'] = 'Rule tab doesnot exist'
                        valarr.push(errobj)
                      }
                    }
                  }
                }
              }
            }
          }
          
        }
      
      this.logger.log(warnarr)
      if (valarr.length == 0) {
        var arrobj = {}
        arrobj['validateresult'] = 'validation completed'
        arrobj['warning'] = warnarr
        return arrobj

      }
      return valarr.concat(warnarr);
    
  }catch (error){
   throw error
  }
  
    }
      
  
  /**
  * Validates if a given string is a valid URL.
  *
  * @param {string} string - The string to be validated.
  * @return {boolean|Error} - Returns true if the string is a valid URL, otherwise returns an Error object.
  */
  async isUrlValid(string) {
      try {
        new URL(string);
        return true;
      } catch (err) {
        return err;
      }
  }

  
  /**
 * Retrieves the security JSON for a given role and key.
 * @param {string} key - The key used to retrieve the security information.
 * @param {string} token - The role to check for in the request header.
 * @return {Promise<Object>} An object containing the PFaction, PFflag, and Node properties.
 * @throws {Error} If the role is undefined or if there is an error retrieving the security information.
 */

  async getPSJson(key, token, psarr: any) {  
    this.logger.log('PS SecurityJSON started');
    try{
     var action = [];
    var flag;
    var nodepolicy;
    var str = key.split(':');

    var keyobj = {};
    keyobj['tenatName'] = str[0];
    keyobj['appGroupName'] = str[1];
    keyobj['appName'] = str[2];
    keyobj['fabrics'] = str[3];
    keyobj['artifacts'] = str[4] + ':' + str[5];

    var pfkey = str[0] + ':' +str[1] + ':' + str[2]+':' + str[4] + ':' + str[5]
  
    var FLGNodeDetails = false;
    if(psarr.length>0){
      for (var o = 0; o < psarr.length; o++) {
        if (psarr[o].psCode == token.psGrp.psCode) {
          var pf = psarr[o].pf
       if(pf.length>0){
        for (var p = 0; p < pf.length; p++) {     
          if (pf[p].resource == pfkey) {
            if (pf[p].SIFlag.selectedValue == 'E') {
              action = pf[p].actionDenied.selectedValue;
              flag = pf[p].SIFlag.selectedValue;
            }
            else if (pf[p].SIFlag.selectedValue == 'A') {
              action = pf[p].actionAllowed.selectedValue;
              flag = pf[p].SIFlag.selectedValue;
            }
            nodepolicy = pf[p].nodeDetails;
            FLGNodeDetails = true; // Set found to true since keyobj was found
          }
        }
       }
         
        }
      }
    }
    
    if (!FLGNodeDetails) {
      return (`Key object (${keyobj['appGroupName']}, ${keyobj['appName']}, ${keyobj['policyName']}, ${keyobj['artifacts']}) not found in tenant Security Json.`);
    }
    var sjson = {};
    sjson['PFaction'] = action;
    sjson['PFflag'] = flag;
    sjson['Node'] = nodepolicy; 
    this.logger.log('PS SecurityJSON completed');
    return sjson;
  } catch(error){
    throw error
  }
  } 
    

  async getNodeSecurityJson(nodeDetails:any, nodeName: string,mode:string) {
    this.logger.log("Node Security Json Started")
  
     var permit:any, flag:any
     var actionflag:any
     if(nodeDetails.length > 0){
       for (var i = 0; i < nodeDetails.length; i++) {
         if (nodeDetails[i].resource == nodeName) {
           if (nodeDetails[i].SIFlag.selectedValue == 'E') {  
             actionflag = nodeDetails[i].actionDenied.selectedValue    
             if(mode == 'E'){
               permit = actionflag.includes('Execute') || actionflag.includes( '*')        
             }
             if(mode == 'D'){
               permit = actionflag.includes('Debug') || actionflag.includes( '*')        
             }        
             flag = nodeDetails[i].SIFlag.selectedValue        
           }
           else if (nodeDetails[i].SIFlag.selectedValue == 'A') {  
             actionflag = nodeDetails[i].actionAllowed.selectedValue
             if(mode == 'E'){
               permit = actionflag.includes('Execute') || actionflag.includes( '*')        
             }
             if(mode == 'D'){
               permit = actionflag.includes('Debug') || actionflag.includes( '*')        
             }
             flag = nodeDetails[i].SIFlag.selectedValue    
           }
         }
       }
     }  
  
     if (flag == 'E' && permit == true) {
       this.logger.log("Node Security Json completed")
       return false
     }
     else if (flag == 'E' && permit == false) {
       this.logger.log("Node Security Json completed")
       return true
     }
     else if (flag == 'A' && permit == true) {
       this.logger.log("Node Security Json completed")
       return true
     }
     else if (flag == 'A' && permit == false) {
       this.logger.log("Node Security Json completed")
       return false
     }
   }
  

  /**
 * Asynchronously processes custom code.
 *
 * @param {any} key - The key used to retrieve data.
 * @param {any} data - The custom code to be processed.
 * @param {any} arr - An array of objects containing node information.
 * @return {Promise<any>} A promise that resolves to the result of processing the custom code.
 */

  async customCodeProcess(key: any, upId:any,data: any, arr: any,mode) {
    try {
      if (data != undefined) {
       if(arr.length>0){
        for (var k = 1; k < arr.length - 1; k++) {
          var curnName = (arr[k].nodename).toLowerCase();
          var str = data.indexOf(curnName)
          if (str != -1) {
            if(mode == 'D')
            var value = await this.redisService.getJsonDataWithPath(key + upId +':NPC:'+ arr[k].nodename+'.PRO', '.request') 
            else
            var value = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + arr[k].nodeid + '.data.pro.request')

            var chkdata = JSON.parse(value)
            // get the key and value of decision node request data        
            var chkkey = Object.keys(chkdata)
            var chkval = Object.values(chkdata)
            // form the data for replace the value in the customcode
            if(chkkey.length>0){
              for (var s = 0; s < chkkey.length; s++) {
                var val = curnName + '.pro.request.' + chkkey[s]
                if (data.indexOf(val)) {
                  data = data.replace(new RegExp(val, 'g'), chkval[s])
                }
              }
            }
            
          }
        }
       }
        

        //let result = ts.transpile(data);

        // evaluate the custom code 
        var t1 = eval(data);
        return t1
      }
      else {
        return true
      }
    } catch (error) {
      throw error
    }
  }

  /**
 * Asynchronously executes a Go rule using the provided key, rule, and nodeId.
 *
 * @param {any} key - The key used to retrieve the Go rule from Redis.
 * @param {any} rule - The Go rule to be executed.
 * @param {any} nodeId - The ID of the node associated with the Go rule.
 * @return {Promise<any>} A promise that resolves to the output of the Go rule execution.
 */

  async zenrule(key: any, upId:any, rule: any, pfjson: any,mode:string) {
    // var goruleEngine: GoRuleEngine = new GoRuleEngine();
     var gparamreq = {};
     var decreq;
     
     var greq = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId + '.rule..inputs'))
     var npcreq = JSON.parse(await this.redisService.getJsonDataWithPath(key + upId +':NPC:'+ pfjson.nodeName+'.PRO','.request'))
       for (var g = 0; g < greq.length; g++) {
        if(mode == 'D' && Object.keys(npcreq).length>0)
         decreq = JSON.parse(await this.redisService.getJsonDataWithPath(key + upId +':NPC:'+ pfjson.nodeName+'.PRO', '..' +  greq[g].field))
        else
         decreq = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + pfjson.nodeId + '.data.pro.request..' + greq[g].field))
         gparamreq[greq[g].field] = decreq
       }
    console.log(gparamreq)
     var goruleres = await this.goruleEngine.goRule((rule), gparamreq)
     return (goruleres.result.output)
   }
   
  /**
 * Maps the values from the `mapData` object to the corresponding properties in the `response` object.
 *
 * @param {any} request - The request object used for mapping.
 * @param {any} response - The response object where the values will be mapped to.
 * @param {any} mapData - The object containing the mapping data.
 * @return {Promise<any>} - A promise that resolves to the mapped value.
 */

  async mapper(request: any, response: any, mapData: any) {
      try{for (var val in mapData) {
        if (response.hasOwnProperty(val)) {
          response[val] = mapData[val]
        }
      }
      var obj = {}
      obj['item'] = response

      var mappedval = transform(request, obj);
      return mappedval;
    }catch(error){
      throw error
    }
  }
      

  
  async getMapper(mapperconfig:any){
    this.logger.log("Mapper called")
    try { 

    let sourcerequest:any = mapperconfig.request
    let targetresponse:any = mapperconfig.response
    let mapData:any = mapperconfig.mapData
   
    for (var val in mapData) {
      if (targetresponse.hasOwnProperty(val)) {
        targetresponse[val] = mapData[val]
      }
    }
    var obj = {}
    obj['item'] = targetresponse

    var mappedval = transform(sourcerequest, obj);    
    //return mappedval;
    return { "MapperResult": mappedval }
  } catch (error) {
    console.log(error);
    throw error
  }
  }

  async getTElogs(key: any, upId: any, pfjson:any,mode:string,request?:any,response?:any,prcType?:any){
  
    var deci = {};
    deci['nodeName'] = pfjson.nodeName;
    deci['nodeId'] = pfjson.nodeId;
    deci['nodeType'] = pfjson.nodeType;
    deci['mode'] = mode
    if(request){
      deci['request'] = request;    
      await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson.nodeName+'.'+prcType ,JSON.stringify(request), 'request')
    }
    if(response){
      deci['response'] = response;
      await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson.nodeName+'.'+prcType ,JSON.stringify(response) ,'response')     
    }      
      
    await this.redisService.setStreamData('TELogs', key + upId, JSON.stringify(deci));    
  }
   
  async getException(pfjson:any,mode:string,token:any,key:any,upId:any,error:any,status:any,prcType?:any){
       
    var errdata = {
       tname:'TE',
       errGrp:'Technical',
       fabric:'PF',
       errType:'Fatal',
       errCode:'001'
     }
     var processInfo = {
       mode : mode,
       nodeName : pfjson.nodeName,
       nodeId : pfjson.nodeId       
     }

     var ErrorObj = await this.commonService.commonErrorLogs(errdata,token,key+upId,error,status,processInfo)  
      
     await this.redisService.setJsonData(key + upId + ':NPC:' + pfjson.nodeName+'.'+prcType ,JSON.stringify(ErrorObj), 'exception')    
         
     ErrorObj['key'] = key
     ErrorObj['upId'] = upId     
   
     return ErrorObj
 }
  
    
  async getsecurityExceptionlogs(pfjson:any,key:any,upId:any,mode:string,token:any){
    var secErrorObj;
    var errdata = {
      tname:'TE',
      errGrp:'Security',
      fabric:'PF',
      errType:'Fatal',
      errCode:'001'
    }
    var processInfo = {
      mode : mode,
      nodeName : pfjson.nodeName,
      nodeId : pfjson.nodeId       
    }   

    if(mode == 'E')
      secErrorObj = await this.commonService.commonErrorLogs(errdata,token,key+upId,'Permission Restricted to Execute '+pfjson.nodeName,403,processInfo)  
        
    if(mode == 'D')
      secErrorObj = await this.commonService.commonErrorLogs(errdata,token,key+upId,'Permission Restricted to Debug '+pfjson.nodeName,403,processInfo)  
       
    return secErrorObj    
  }
      

  /**
 * Creates an error object with the provided error details and node name.
 *
 * @param {any} error - The error details to be included in the error object.
 * @param {any} nodename - The name of the node associated with the error.
 * @return {Promise<any>} A promise that resolves to the created error object.
 */

 

  /**  
 * Retrieves process logs from Redis and organizes them
   into ERR, NPC, and IPC structures (pre,pro,pst)     
 * @return {Promise<Array>} An array of process log objects.
 * @throws {Error} If there is an error retrieving the process logs.
 */

   async getPrcLogs() {
    try {
      var msgid = []
      var strmarr = []
      var arrData = [];

      var messages = await this.redisService.getStreamRange('TELogs')  
    
      messages.forEach(([msgId, value]) => {
        msgid.push(msgId)
        strmarr.push(value)
      });
    
      if(msgid.length > 0){
        for (var s = 0; s < msgid.length; s++) {

          //Converting Stream ID into below specific format
          var date = new Date(Number(msgid[s].split("-")[0]));
          var entryId = format(date, 'HH:mm:ss.SSS dd MMM yyyy')
          if (JSON.parse(strmarr[s][1]).nodeName != 'Start' && JSON.parse(strmarr[s][1]).nodeName != 'End') {
            var nodeInfo: any = {};
            var objnpc: any = {};
            var objipc: any = {};
            //Form the process log structure of NPC & IPC           
            nodeInfo.key = strmarr[s][0]
            nodeInfo.time = entryId
            nodeInfo.nodeName = JSON.parse(strmarr[s][1]).nodeName
            nodeInfo.mode = JSON.parse(strmarr[s][1]).mode
            
            var npcpre = JSON.parse(await this.redisService.getJsonData(nodeInfo.key + ':NPC:' + nodeInfo.nodeName+ '.PRE'));
            var npcpro = JSON.parse(await this.redisService.getJsonData(nodeInfo.key + ':NPC:' + nodeInfo.nodeName+ '.PRO'));
            var npcpst = JSON.parse(await this.redisService.getJsonData(nodeInfo.key + ':NPC:' + nodeInfo.nodeName+ '.PST'));
          
            var ipcpre = await this.redisService.getJsonData(nodeInfo.key + ':IPC:' + nodeInfo.nodeName+  '.PRE');
            var ipcpro = await this.redisService.getJsonData(nodeInfo.key + ':IPC:' + nodeInfo.nodeName+  '.PRO');
            var ipcpst = await this.redisService.getJsonData(nodeInfo.key + ':IPC:' + nodeInfo.nodeName+  '.PST');
  
            objnpc.PRE = npcpre
            objnpc.PRO = npcpro
            objnpc.PST = npcpst
            nodeInfo.npc = (objnpc);         
  
            objipc.PRE = ipcpre
            objipc.PRO = ipcpro
            objipc.PST = ipcpst
  
            nodeInfo.ipc = objipc
            arrData.push(nodeInfo);
          }
        }
      }
      
      return (arrData);
    } catch (error) {
      throw error
    }
  }

  /**
 * Retrieves the exception logs from the 'TPEExceptionlogs' stream in Redis.
 *
 * @return {Promise<any>} An array of exception log objects.
 * @throws {Error} If there is an error retrieving the exception logs.
 */
  async getExceplogs(): Promise<any> {
    try {
      var msgid = []
      var strmarr = []
      var arrData = [];

      var messages = await this.redisService.getStreamRange('TEExceptionLogs')
      messages.forEach(([msgId, value]) => {
        msgid.push(msgId)
        strmarr.push(value)
      });
    if(msgid.length > 0){
      for (var s = 0; s < msgid.length; s++) {
        var nodeInfo: any = {};
        var date = new Date(Number(msgid[s].split("-")[0]));
        var entryId = format(date, 'HH:mm:ss.SSS dd MMM yyyy')
        nodeInfo.key = strmarr[s][0]
        nodeInfo.time = entryId
        nodeInfo.sessionInfo = JSON.parse(strmarr[s][1]).sessioninfo 
        nodeInfo.errorDetails = JSON.parse(strmarr[s][1]).errorDetails
        nodeInfo.processInfo = JSON.parse(strmarr[s][1]).processinfo 
        // var obj = {}
        // obj['errorGroup'] = JSON.parse(strmarr[s][1]).errorGroup
        // obj['errorCategory'] = JSON.parse(strmarr[s][1]).errorCategory
        // obj['errorType'] = JSON.parse(strmarr[s][1]).errorType
        // obj['errorCode'] = JSON.parse(strmarr[s][1]).errorCode
        // obj['errorDetail'] = JSON.parse(strmarr[s][1]).errorDetail

        // nodeInfo.error = obj

        arrData.push(nodeInfo);
      }
    }
      
      return (arrData);
    } catch (error) {
      throw error
    }

  }
 

  /**
 * Retrieves the debug logs from the 'TPENodeDebuglogs' stream in Redis.
 *
 * @return {Promise<Array<Object>>} An array of debug log objects.
 * @throws {Error} If there is an error retrieving the debug logs.
 */
  async getNodeDebugLogs() {
    try {
      var msgid = [];
      var strmarr = [];
      var arrData = [];

      var messages = await this.redisService.getStreamRange('TPENodeDebuglogs')
     
      messages.forEach(([msgId, value]) => {
        msgid.push(msgId)
        strmarr.push(value)
      });
      if(msgid.length > 0){
        for (var s = 0; s < msgid.length; s++) {
          var date = new Date(Number(msgid[s].split("-")[0]));
          var entryId = format(date, 'HH:mm:ss.SSS dd MMM yyyy')
          if (JSON.parse(strmarr[s][1]).nodeName != 'Start' && JSON.parse(strmarr[s][1]).nodeName != 'End') {
            var nodeInfo: any = {};
            nodeInfo.key = strmarr[s][0];
            nodeInfo.time = entryId;
            nodeInfo.nodeName = JSON.parse(strmarr[s][1]).nodeName
  
            var npci = JSON.parse(await this.redisService.getJsonData(nodeInfo.key + ':NPCI:' + nodeInfo.nodeName));
            nodeInfo.npci = npci
            arrData.push(nodeInfo);
          }
        }
      }
      
      return (arrData);
    } catch (error) {
      throw error
    }
  } 
  
  async commonReturn(input,path): Promise<any> {
    var params:any = (Object.keys(input))
   //  var arr =[];
   // var keyValidate =[];
     if(path == 'peStream'){
       const missingKeys = params.filter(key => !input[key]);
         if (missingKeys.length > 0) {
            return ` ${missingKeys.join(', ')} ${missingKeys.length > 1 ? 'are' : 'is'} empty`;
       }  
     }
   
   if(path == 'formdata'){
     const missingKeys = params.filter(key => !input[key]);
     if (missingKeys.length > 0) {
       return ` ${missingKeys.join(', ')} ${missingKeys.length > 1 ? 'are' : 'is'} empty`;
     }  
   }
     
  if(path == 'resume'){
   const missingKeys = params.filter(key => !input[key]);
   if (missingKeys.length > 0) {
      return ` ${missingKeys.join(', ')} ${missingKeys.length > 1 ? 'are' : 'is'} empty`;
   }  
  }
  if(path == 'nodeExec'){
   const missingKeys = params.filter(key => !input[key]);
         if (missingKeys.length > 0) {
            return ` ${missingKeys.join(', ')} ${missingKeys.length > 1 ? 'are' : 'is'} empty`;
         }  
  }
  if(path == 'retry'){
   const missingKeys = params.filter(key => !input[key]);
   if (missingKeys.length > 0) {
      return ` ${missingKeys.join(', ')} ${missingKeys.length > 1 ? 'are' : 'is'} empty`;
   } 
  }
  if(path == 'debugNode'){
   const missingKeys = params.filter(key => !input[key]);
   if (missingKeys.length > 0) {
      return ` ${missingKeys.join(', ')} ${missingKeys.length > 1 ? 'are' : 'is'} empty`;
   } 
  } 
  
  if(path == 'debugrequest'){
   const missingKeys = params.filter(key => !input[key]);
   if (missingKeys.length > 0) {
      return ` ${missingKeys.join(', ')} ${missingKeys.length > 1 ? 'are' : 'is'} empty`;
   } 
  }
  if(path == 'debughtrequest'){
   const missingKeys = params.filter(key => !input[key]);
   if (missingKeys.length > 0) {
      return ` ${missingKeys.join(', ')} ${missingKeys.length > 1 ? 'are' : 'is'} empty`;
   } 
  }
  if(path == 'debugresponse'){
   const missingKeys = params.filter(key => !input[key]);
   if (missingKeys.length > 0) {
      return ` ${missingKeys.join(', ')} ${missingKeys.length > 1 ? 'are' : 'is'} empty`;
   } 
  }
  if(path == 'save'){
   const missingKeys = params.filter(key => !input[key]);
         if (missingKeys.length > 0) {
            return ` ${missingKeys.join(', ')} ${missingKeys.length > 1 ? 'are' : 'is'} empty`;
         } 
  }
   }
}