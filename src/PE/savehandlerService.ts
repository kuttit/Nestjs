import { Injectable, Logger } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import  axios from 'axios';
var _ = require('underscore');
import { RedisService } from 'src/redisService';
import { PeService } from './pe.service';
import { DebugService } from './debugService';

@Injectable()
export class SavehandlerService {    
    constructor(private readonly debugService: DebugService,private readonly redisService:RedisService, private readonly peService:PeService) {}
    private readonly logger = new Logger(PeService.name);

        /**
     * Asynchronously handles the save operation for a given key, event, session information, pKey, nodeId, nodeName, role, mode, and upId.
     *
     * @param {string} key - The key used to identify the save operation.
     * @param {any} event - The event associated with the save operation.
     * @param {object} sessionInfo - The session information for the user.
     * @param {string} pKey - The pKey associated with the save operation.
     * @param {string} nodeId - The nodeId associated with the save operation.
     * @param {string} nodeName - The nodeName associated with the save operation.
     * @param {string} role - The role associated with the save operation.
     * @param {string} mode - The mode associated with the save operation.
     * @param {string} upId - The upId associated with the save operation.
     * @return {Promise<any>} The form data returned from the save operation.
     * @throws {Error} If an error occurs while posting data.
     */
    async savehandler(key,event,sessionInfo,sfkey,pKey,nodeId,nodeName,token,mode,upId){ //GSS-DEV:Payments:Torus:v1:Events:Groupform:ButtonSubmit:v1
    
      this.logger.log("SaveHandler service started...")
       var obj = {}
       var formdata
      
       var request = JSON.parse(await this.redisService.getJsonDataWithPath(key,'.params.request'))    
    
       obj = Object.assign(request)          
       var stt = JSON.parse(await this.redisService.getJsonDataWithPath(key,'.stt')) 
       this.logger.log(obj)    
       obj = Object.assign(obj,stt)
     
       var apiurl = JSON.parse(await this.redisService.getJsonDataWithPath(key,'.params.urls.apiUrl'))    
     
       const requestConfig: AxiosRequestConfig = {
        headers: {
          'Authorization': `Bearer ${token}`,
        }};
        this.logger.log("SaveHandler service completed")
        try { 
        if(mode == 'E')  {
          if(nodeName == undefined || _.isEmpty(nodeName)){
            var cnodeName = await this.getnodename(pKey,nodeId)
            var Exres = await this.peService.getFormdata(sfkey,pKey,upId,nodeId,cnodeName,obj,token)
            if(Exres == 'Success'){             
              formdata = {data:{status:201,data:pKey+upId}}
            }
          }else{
            var Exres = await this.peService.getFormdata(sfkey,pKey,upId,nodeId,nodeName,obj,token)
            if(Exres == 'Success'){             
              formdata = {data:{status:201,data:pKey+upId}}
            }
          }       
         
        }
        else if(mode == 'D'){
          if(nodeName == undefined || _.isEmpty(nodeName)){
            var cnodeName = await this.getnodename(pKey,nodeId)
            formdata = await this.debugService.getFormdata(pKey,upId,nodeId,cnodeName,obj,token)
          }else{
            formdata = await this.debugService.getFormdata(pKey,upId,nodeId,nodeName,obj,token)
          }         
          //return formdata
        }         
        else if(mode == 'ND'){          
          if(nodeName == undefined || _.isEmpty(nodeName)){
            var cnodeName = await this.getnodename(pKey,nodeId)          
            var res = await this.redisService.setJsonData(pKey+upId+':NPCI:'+cnodeName,JSON.stringify(obj),'request')          
            formdata = {status:201, res}
          }
          else{
            var res = await this.redisService.setJsonData(pKey+upId+':NPCI:'+nodeName,JSON.stringify(obj),'request')          
            formdata = {status:201, res}
          }       
        }
        const response = await axios.post(apiurl, obj, requestConfig);         
        this.logger.log("Response",response.data)  
        return formdata
        } catch (error) {
          this.logger.log('Error occurred while posting data:', error)
          return error
        } 
    }

    async getnodename(pKey,nodeId){
      const json = await this.redisService.getJsonData(pKey + 'processFlow'); 
      var pfjson: any = JSON.parse(json);
      for (var i = 0; i < pfjson.length; i++) {
        if(nodeId == pfjson[i].nodeId){
          var snodeName = JSON.parse(await this.redisService.getJsonDataWithPath(pKey+'nodeProperty','.'+nodeId+'.nodeName'))
          return snodeName
        }
      }
    }
} 