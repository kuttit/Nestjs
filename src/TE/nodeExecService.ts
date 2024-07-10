
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/redisService';
import { TeCommonService } from './teCommonService';
import { CommonService } from 'src/commonService';
import { JwtService } from '@nestjs/jwt';
/*
  # This is Node level execution service in process flow. 
  # The key is combination of tenantName, appGroupName, appName, artifacts and resource with UPID.
  # To check the permission based on the role in the "getSecurityJson method".
  # This method, is responsible for executing a node based on keywithUPid, nodename, node type, and role.
  # In this method Retrieving the NPC data of a given node from Redis if the node can be executed.  
*/

@Injectable()
export class NodeExecutionService {
  constructor( private readonly jwtService: JwtService, private readonly commonService:CommonService, 
    private readonly tecommonService:TeCommonService ) {}
  private readonly logger = new Logger(NodeExecutionService.name);   
  redisService : RedisService = new RedisService()

    /**
   * Asynchronously executes a node based on keywithUPid, nodeName, nodeType, and role.
   * Retrieves the NPC data of a given node from Redis if the node can be executed.
   *
   * @param {string} keywithUPid - The key with UPID used to identify the key.
   * @param {string} nodeId - The ID of the node.
   * @param {string} nodeName - The name of the node whose property needs to be retrieved.
   * @param {string} nodeType - The type of the node whose property needs to be retrieved.
   * @param {string} role - The role for which the permissions are checked.
   * @return {Promise<Object>} - Returns an object with status and error message if permission is denied,
   *                             otherwise returns the parsed NPC data of the node.
   * @throws {Error} - Throws an error if the ActionDenied or ActionAllowed array is empty.
   */

    async nodeExecution(sfkey,keywithUPid,nodeId,nodeName,nodeType,mode,token){ 
      this.logger.log("Node level execution Started....")     
        //To split UPId from key to pass param in getSecurityJson
     
        var key = keywithUPid.split(':',6).join(':')  
        var upId = keywithUPid.split(':',7).join(':').split(':').pop()    
        var pfjson = {
          nodeName : nodeName,
          nodeId : nodeId 
         }   
        const decoded =  this.jwtService.decode(token,{ json: true }) 
      
        var psjson:any = await this.commonService.getSecurityJson(sfkey,decoded);
        if(typeof psjson !== 'object'){
          return psjson
        }
        var sjson = await this.tecommonService.getPSJson(key,decoded,psjson)       
        if(typeof sjson !== 'object'){
          return sjson
        }
        var nodeDetails = sjson['Node']
        var nodeSjson = await this.tecommonService.getNodeSecurityJson(nodeDetails,nodeName,mode)
          
        if(nodeSjson == true){          
            var npcchk = await this.redisService.getJsonData(keywithUPid +':NPC:' +nodeName+'.PRO')             
            if(npcchk == null){                        
               var techError = await this.tecommonService.getException(pfjson,mode,token,key+':',upId,'Node Not Found',404,'PRO')
               throw new BadRequestException(techError)
            }
            return JSON.parse(npcchk)                 
        }else{
         //logging Security Exception in stream
          var secError = await this.tecommonService.getsecurityExceptionlogs(pfjson,key,upId,mode,token)             
          throw new BadRequestException(secError)
        }      
    }    
}  

