import { GoRuleEngine } from "src/gorule";
import { RedisService } from "src/redisService";
import { Injectable, Logger } from "@nestjs/common";
import { format } from "date-fns";
import { CommonService } from "src/commonService";
var _ = require('underscore');
var { transform } = require("node-json-transform")

@Injectable()
export class PeCommonService {
  constructor(private readonly redisService: RedisService,private readonly commonService: CommonService) { }

  private readonly logger = new Logger(PeCommonService.name);
  
  /* validate the individual nodetype requirments for a given role and key
    @param key -  The key used to retrieve the security information.
    @param role - check whether the role exists in the request header or not
  */
  async validate(key) {
      this.logger.log("validate")
      var valarr: any = []
      var warnarr: any = []
  
      var fjson = await this.redisService.exist(key + 'processFlow')
  
      if (fjson === 0) {
        var errobj = {}
        errobj['error'] = 'Processflow does not exist'
        valarr.push(errobj)
      }
      else {
        //var nodeProperty = JSON.parse(await this.redisService.getJsonData( key + 'nodeProperty')); 
        var nodeProperty = await this.redisService.exist(key + 'nodeProperty')
  
        if (nodeProperty === 0) {
          var errobj = {}
          errobj['error'] = 'NodeProperty does not exist'
          valarr.push(errobj)
        }
        else {
          var fdjson: any = JSON.parse(await this.redisService.getJsonData(key + 'processFlow'));
          var nodeProperty = JSON.parse(await this.redisService.getJsonData(key + 'nodeProperty'));
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
  
    var found = false;
    for (var o = 0; o < psarr.length; o++) {
      if (psarr[o].psCode == token.psGrp.psCode) {
        var pf = psarr[o].pf
     
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
            found = true; // Set found to true since keyobj was found
          }
        }
      }
    }
    if (!found) {
      return (`Key object (${keyobj['appGroupName']}, ${keyobj['appName']}, ${keyobj['policyName']}, ${keyobj['artifacts']}) not found in tenant Security Json.`);
    }
    var sjson = {};
    sjson['PFaction'] = action;
    sjson['PFflag'] = flag;
    sjson['Node'] = nodepolicy; 
    this.logger.log('PS SecurityJSON completed');
    return sjson;
  }

  async getNodeSecurityJson(nodeDetails:any, nodeName: string) {
   this.logger.log("Node Security Json Started")
    var permit, flag
    var actionflag:any
  
    for (var i = 0; i < nodeDetails.length; i++) {
      if (nodeDetails[i].resource == nodeName) {
        if (nodeDetails[i].SIFlag.selectedValue == 'E') {   
          actionflag = nodeDetails[i].actionDenied.selectedValue      
          permit = actionflag.includes('Execute') || actionflag.includes( '*')         
          flag = nodeDetails[i].SIFlag.selectedValue         
        }
        else if (nodeDetails[i].SIFlag.selectedValue == 'A') {   
          actionflag = nodeDetails[i].actionAllowed.selectedValue        
          permit = actionflag.includes('Execute') || actionflag.includes( '*')     
          
          flag = nodeDetails[i].SIFlag.selectedValue         
         
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

  async customCodeProcess(key: any, data: any, arr: any) {
    try {
      if (data != undefined) {
       
        for (var k = 1; k < arr.length - 1; k++) {
          var curnName = (arr[k].nodename).toLowerCase();
          var str = data.indexOf(curnName)
          if (str != -1) {
            var value = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + arr[k].nodeid + '.data.pro.request')

            var chkdata = JSON.parse(value)
            // get the key and value of decision node request data        
            var chkkey = Object.keys(chkdata)
            var chkval = Object.values(chkdata)
            // form the data for replace the value in the customcode
            for (var s = 0; s < chkkey.length; s++) {
              var val = curnName + '.pro.request.' + chkkey[s]
              if (data.indexOf(val)) {
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

  async zenrule(key: any, rule: any, nodeId: any) {
    var goruleEngine: GoRuleEngine = new GoRuleEngine();
    var greq = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + nodeId + '.rule..inputs'))

    var gparamreq = {};
    for (var g = 0; g < greq.length; g++) {
      var decreq = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + nodeId + '.data.pro.request..' + greq[g].field))

      gparamreq[greq[g].field] = decreq
    }
   
    var goruleres = await goruleEngine.goRule((rule), gparamreq)
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
    for (var val in mapData) {
      if (response.hasOwnProperty(val)) {
        response[val] = mapData[val]
      }
    }
    var obj = {}
    obj['item'] = response

    var mappedval = transform(request, obj);
    return mappedval;
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

  async getPElogs(key: any, upId: any, nodeName:any,nodeId:any,nodeType:any,npc?:any,pro?:any): Promise<any>{
    if(nodeType != 'startnode' && nodeType != 'endnode'){
    var Req = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + nodeId + '.data.pro.request'));
    var Res = JSON.parse(await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + nodeId + '.data.pro.response'));
    }
    var deci = {};
    deci['nodeName'] = nodeName;
    deci['nodeId'] = nodeId;
    deci['nodeType'] = nodeType;
    deci['request'] = Req;
    deci['response'] = Res;    
    if(npc && pro){
      var setData = await this.redisService.getJsonDataWithPath(key + 'nodeProperty', '.' + nodeId + '.data.pro');
      await this.redisService.setJsonData(key + upId + ':'+ npc +':'+ nodeName + '.'+ pro, setData)
    }
    var Pelog = await this.redisService.setStreamData('PElogs', key + upId, JSON.stringify(deci));  
    return Pelog    
  }

  async getExceptionlogs(error,status,nodeName,nodeId,PreviousArray,key,upId,npc?,pro?){
  
    var errorobj = await this.commonService.errorobj('TE',error,status)  
      errorobj['nodeName'] = nodeName
      errorobj['nodeId'] = nodeId   
      PreviousArray.pop()
      errorobj['previousArray'] = PreviousArray
      await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(errorobj))
      if(npc && pro){
        await this.redisService.setJsonData(key+upId +':'+ npc +':'+ nodeName + '.'+ pro, JSON.stringify(errorobj), 'exception')
      }         
      errorobj['key']=key
      errorobj['upId']=upId
      return errorobj
      //throw new BadRequestException(errorobj)
  }
  async getsecurityExceptionlogs(nodeName,nodeId,key,upId){
      var secErrorObj = await this.commonService.errorobj('TE','Permission Restricted to Execute '+nodeName,403)  
      secErrorObj['errorCategory'] = 'Security'
      secErrorObj['nodeName'] = nodeName
      secErrorObj['nodeId'] = nodeId  
      await this.redisService.setStreamData('TPEExceptionlogs', key + upId, JSON.stringify(secErrorObj))
      return secErrorObj
  }

  /**
 * Creates an error object with the provided error details and node name.
 *
 * @param {any} error - The error details to be included in the error object.
 * @param {any} nodename - The name of the node associated with the error.
 * @return {Promise<any>} A promise that resolves to the created error object.
 */

  // async errorobj(error: any,status:any): Promise<any> {
  //   if(error.code == 'ETIMEDOUT')
  //     status=408
  //   var errobj = {} 
  //     errobj['T_ErrorGroup'] = "Technical",
  //     errobj['T_ErrorCategory'] = "Redis",
  //     errobj['T_ErrorType'] = "Fatal",
  //     errobj['T_ErrorCode'] = "<Hardcoded>",
  //     errobj['errorCode'] = status,
  //     errobj['errorDetail'] = error   
  //   return errobj
  // }


  // async responseData(data: any,): Promise<any> {
  //   var resobj = {}    
  //   resobj['status'] = 'Success',
  //   resobj['statusCode'] = 201,
  //   resobj['result'] = data     
  //   return resobj
  // }

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

      var messages = await this.redisService.getStreamRange('TPEprocesslogs')  
      messages.forEach(([msgId, value]) => {
        msgid.push(msgId)
        strmarr.push(value)
      });
      for (var s = 0; s < msgid.length; s++) {

        //Converting Stream ID into below specific format
        var date = new Date(Number(msgid[s].split("-")[0]));
        var entryId = format(date, 'HH:mm:ss.SSS dd MMM yyyy')
        if (JSON.parse(strmarr[s][1]).nodeName != 'Start' || JSON.parse(strmarr[s][1]).execution == 'Stop') {
          var nodeInfo: any = {};
          var objnpc: any = {};
          var objipc: any = {};
          //Form the process log structure of NPC & IPC           
          nodeInfo.key = strmarr[s][0]
          nodeInfo.time = entryId
          nodeInfo.nodeName = JSON.parse(strmarr[s][1]).nodeName

          var npcpre = await this.redisService.getJsonDataWithPath(nodeInfo.key + ':NPC:' + nodeInfo.nodeName, '.PRE');
          var npcpro = await this.redisService.getJsonDataWithPath(nodeInfo.key + ':NPC:' + nodeInfo.nodeName, '.PRO');
          var npcpst = await this.redisService.getJsonDataWithPath(nodeInfo.key + ':NPC:' + nodeInfo.nodeName, '.PST');
          var errval = await this.redisService.getJsonDataWithPath(nodeInfo.key + ':ERR:', nodeInfo.nodeName);
          var ipcpre = await this.redisService.getJsonDataWithPath(nodeInfo.key + ':IPC:' + nodeInfo.nodeName, '.PRE');
          var ipcpro = await this.redisService.getJsonDataWithPath(nodeInfo.key + ':IPC:' + nodeInfo.nodeName, '.PRO');
          var ipcpst = await this.redisService.getJsonDataWithPath(nodeInfo.key + ':IPC:' + nodeInfo.nodeName, '.PST');

          objnpc.PRE = npcpre
          objnpc.PRO = npcpro
          objnpc.PST = npcpst
          nodeInfo.npc = (objnpc);
          nodeInfo.err = (errval)

          objipc.PRE = ipcpre
          objipc.PRO = ipcpro
          objipc.PST = ipcpst

          nodeInfo.ipc = objipc
          arrData.push(nodeInfo);
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

      var messages = await this.redisService.getStreamRange('TPEExceptionlogs')
      messages.forEach(([msgId, value]) => {
        msgid.push(msgId)
        strmarr.push(value)
      });
    
      for (var s = 0; s < msgid.length; s++) {
        var nodeInfo: any = {};
        var date = new Date(Number(msgid[s].split("-")[0]));
        var entryId = format(date, 'HH:mm:ss.SSS dd MMM yyyy')
        nodeInfo.key = strmarr[s][0]
        nodeInfo.time = entryId
        nodeInfo.nodeName = JSON.parse(strmarr[s][1]).nodename

        var obj = {}
        obj['errorGroup'] = JSON.parse(strmarr[s][1]).errorGroup
        obj['errorCategory'] = JSON.parse(strmarr[s][1]).errorCategory
        obj['errorType'] = JSON.parse(strmarr[s][1]).errorType
        obj['errorCode'] = JSON.parse(strmarr[s][1]).errorCode
        obj['errorDetail'] = JSON.parse(strmarr[s][1]).errorDetail

        nodeInfo.error = obj

        arrData.push(nodeInfo);
      }
      return (arrData);
    } catch (error) {
      throw error
    }

  }

  /**
 * Retrieves the debug exception logs from the 'TPEDebugExceptionlogs' stream in Redis.
 *
 * @return {Promise<any>} A promise that resolves to an array of debug exception log objects.
 * @throws {Error} If there is an error retrieving the debug exception logs.
 */
  async getdebugExceplogs(): Promise<any> {

    try {
      var msgid = []
      var strmarr = []
      var arrData = [];

      var messages = await this.redisService.getStreamRange('TPEDebugExceptionlogs')
      messages.forEach(([msgId, value]) => {
        msgid.push(msgId)
        strmarr.push(value)
      });

      for (var s = 0; s < msgid.length; s++) {
        var nodeInfo: any = {};
        var date = new Date(Number(msgid[s].split("-")[0]));
        var entryId = format(date, 'HH:mm:ss.SSS dd MMM yyyy')
        nodeInfo.key = strmarr[s][0]
        nodeInfo.time = entryId
        nodeInfo.nodeName = JSON.parse(strmarr[s][1]).nodeName

        var obj = {}
        obj['errorGroup'] = JSON.parse(strmarr[s][1]).errorGroup
        obj['errorCategory'] = JSON.parse(strmarr[s][1]).errorCategory
        obj['errorType'] = JSON.parse(strmarr[s][1]).errorType
        obj['errorCode'] = JSON.parse(strmarr[s][1]).errorCode
        obj['errorDetail'] = JSON.parse(strmarr[s][1]).errorDetail

        nodeInfo.error = obj
        arrData.push(nodeInfo);
      }
      return (arrData);
    } catch (error) {
      throw error
    }
  }

  /**
 * Retrieves the debug logs from the 'TPEDebuglogs' stream in Redis.
 *
 * @return {Promise<Array<Object>>} An array of debug log objects.
 * @throws {Error} If there is an error retrieving the debug logs.
 */
  async getDebugLogs() {
    try {
      var msgid = [];
      var strmarr = [];
      var arrData = [];

      var messages = await this.redisService.getStreamRange('TPEDebuglogs')

      messages.forEach(([msgId, value]) => {
        msgid.push(msgId)
        strmarr.push(value)
      });

      for (var s = 0; s < msgid.length; s++) {
        var date = new Date(Number(msgid[s].split("-")[0]));
        var entryId = format(date, 'HH:mm:ss.SSS dd MMM yyyy')
        if (JSON.parse(strmarr[s][1]).nodeName != 'Start' || JSON.parse(strmarr[s][1]).execution == 'Stop') {
          var nodeInfo: any = {};
          nodeInfo.key = strmarr[s][0];
          nodeInfo.time = entryId;
          nodeInfo.nodeName = JSON.parse(strmarr[s][1]).nodeName
          var npci = JSON.parse(await this.redisService.getJsonData(nodeInfo.key + ':NPCI:' + nodeInfo.nodeName));
          nodeInfo.npci = npci
         
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
      return (arrData);
    } catch (error) {
      throw error
    }
  }

  /**
 * Retrieves the exception logs from the 'TPEExceptionlogs' stream in Redis.
 *
 * @return {Promise<any>} A promise that resolves to an array of exception log objects.
 * @throws {Error} If there is an error retrieving the exception logs.
 */
  async getNodeExceplogs(): Promise<any> {
    try {
      var msgid = []
      var strmarr = []
      var arrData = [];

      var messages = await this.redisService.getStreamRange('TPEExceptionlogs')
      messages.forEach(([msgId, value]) => {
        msgid.push(msgId)
        strmarr.push(value)
      });    

      for (var s = 0; s < msgid.length; s++) {
        var nodeInfo: any = {};
        var date = new Date(Number(msgid[s].split("-")[0]));
        var entryId = format(date, 'HH:mm:ss.SSS dd MMM yyyy')
        nodeInfo.key = strmarr[s][0]
        nodeInfo.time = entryId
        nodeInfo.nodeName = JSON.parse(strmarr[s][1]).nodename

        var obj = {}
        obj['errorGroup'] = JSON.parse(strmarr[s][1]).errorGroup
        obj['errorCategory'] = JSON.parse(strmarr[s][1]).errorCategory
        obj['errorType'] = JSON.parse(strmarr[s][1]).errorType
        obj['errorCode'] = JSON.parse(strmarr[s][1]).errorCode
        obj['errorDetail'] = JSON.parse(strmarr[s][1]).errorDetail

        nodeInfo.error = obj

        arrData.push(nodeInfo);
      }
      return (arrData);
    } catch (error) {
      throw error
    }
  }
}