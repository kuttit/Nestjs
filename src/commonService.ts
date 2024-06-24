import { RedisService } from 'src/redisService';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';





@Injectable()
export class CommonService {
  constructor(private readonly redisService: RedisService,private readonly jwtService:JwtService) {}
  private readonly logger = new Logger(CommonService.name);

  async getSecurityJson(key, token) {
    try {
      this.logger.log('SecurityJSON started');
      var orggrp = token.orgGrp.orgGrpCode;
      var orgcode = token.orgGrp.orgCode;
      var rolegrp = token.roleGrp.roleGrpCode;
      var rolecode = token.roleGrp.roleCode;
      var psgrp = token.psGrp.psGrpCode;
      var pscode = token.psGrp.psCode;

      var str = key.split(':');

      var keyobj = {};
      keyobj['tenatName'] = str[0];
      keyobj['appGroupName'] = str[1];
      keyobj['appName'] = str[2];
      keyobj['fabric'] = str[3];
      keyobj['artifacts'] = str[4];
      keyobj['version'] = str[5];

      var found = false;
      var PS: any;
      var orpSecurity = JSON.parse(
        await this.redisService.getJsonDataWithPath(
          str[0] +
            ':' +
            str[1] +
            ':' +
            str[2] +
            ':SF:' +
            str[4] +
            ':' +
            str[5] +
            ':summary',
          '.orgGrp',
        ),
      );

      for (var a = 0; a < orpSecurity.length; a++) {
        if (orpSecurity[a].orgGrpCode == orggrp) {
          if (orpSecurity[a].SIFlag == 'A') {
            for (var b = 0; b < orpSecurity[a].actionAllowed.length; b++) {
              if (
                orpSecurity[a].actionAllowed[b] == '*' ||
                orpSecurity[a].actionAllowed[b] == orgcode
              ) {
                var orgname = orpSecurity[a].org;
                for (var d = 0; d < orgname.length; d++) {
                  if (orgname[d].orgCode == orgcode) {
                    var rlegrp = orgname[d].roleGrp;
                    for (var e = 0; e < rlegrp.length; e++) {
                      if (rlegrp[e].roleGrpCode == rolegrp) {
                        if (rlegrp[e].SIFlag == 'A') {
                          for (
                            var f = 0;
                            f < rlegrp[e].actionAllowed.length;
                            f++
                          ) {
                            if (
                              rlegrp[e].actionAllowed[f] == '*' ||
                              rlegrp[e].actionAllowed[f] == rolecode
                            ) {
                              var rle = rlegrp[e].roles;
                              for (var h = 0; h < rle.length; h++) {
                                if (rle[h].roleCode == rolecode) {
                                  var psgrpname = rle[h].psGrp;
                                  for (var m = 0; m < psgrpname.length; m++) {
                                    if (psgrpname[m].psGrpCode == psgrp) {
                                      if (psgrpname[m].SIFlag == 'A') {
                                        for (
                                          var n = 0;
                                          n < psgrpname[m].actionAllowed.length;
                                          n++
                                        ) {
                                          if (
                                            psgrpname[m].actionAllowed[n] ==
                                              '*' ||
                                            psgrpname[m].actionAllowed[n] ==
                                              pscode
                                          ) {
                                            found = true;
                                            PS = psgrpname[m].ps;
                                          } else {
                                            throw new BadRequestException(
                                              'Permission denied to access the Product Service',
                                            );
                                          }
                                        }
                                      } else if (psgrpname[m].SIFlag == 'E') {
                                        for (
                                          var j = 0;
                                          j < psgrpname[m].actionDenied.length;
                                          j++
                                        ) {
                                          if (
                                            psgrpname[m].actionDenied[j] ==
                                              '*' ||
                                            psgrpname[m].actionDenied[j] ==
                                              pscode
                                          ) {
                                            throw new BadRequestException(
                                              'Permission denied to access the Product Service group',
                                            );
                                          } else {
                                            found = true;
                                            PS = psgrpname[m].ps;
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            } else {
                              throw new BadRequestException(
                                'Permission denied to access the Role',
                              );
                            }
                          }
                        } else if (rlegrp[e].SIFlag == 'E') {
                          for (
                            var g = 0;
                            g < rlegrp[e].actionDenied.length;
                            g++
                          ) {
                            if (
                              rlegrp[e].actionDenied[g] == '*' ||
                              rlegrp[e].actionDenied[g] == rolecode
                            ) {
                              throw new BadRequestException(
                                'Permission denied to access the Role Group',
                              );
                            } else {
                              var rle = rlegrp[e].roles;
                              for (var h = 0; h < rle.length; h++) {
                                if (rle[h].roleCode == rolecode) {
                                  var psgrpname = rle[h].psGrp;
                                  for (var m = 0; m < psgrpname.length; m++) {
                                    if (psgrpname[m].psGrpCode == psgrp) {
                                      if (psgrpname[m].SIFlag == 'A') {
                                        for (
                                          var n = 0;
                                          n < psgrpname[m].actionAllowed.length;
                                          n++
                                        ) {
                                          if (
                                            psgrpname[m].actionAllowed[n] ==
                                              '*' ||
                                            psgrpname[m].actionAllowed[n] ==
                                              pscode
                                          ) {
                                            found = true;
                                            PS = psgrpname[m].ps;
                                          } else {
                                            throw new BadRequestException(
                                              'Permission denied to access the Product Service',
                                            );
                                          }
                                        }
                                      } else if (psgrpname[m].SIFlag == 'E') {
                                        for (
                                          var j = 0;
                                          j < psgrpname[m].actionDenied.length;
                                          j++
                                        ) {
                                          if (
                                            psgrpname[m].actionDenied[j] ==
                                              '*' ||
                                            psgrpname[m].actionDenied[j] ==
                                              pscode
                                          ) {
                                            throw new BadRequestException(
                                              'Permission denied to access the Product Service group',
                                            );
                                          } else {
                                            found = true;
                                            PS = psgrpname[m].ps;
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              } else {
                throw new BadRequestException(
                  'Permission denied to access the Organisation',
                );
              }
            }
          } else if (orpSecurity[a].SIFlag == 'E') {
            for (var c = 0; c < orpSecurity[a].actionDenied.length; c++) {
              if (
                orpSecurity[a].actionDenied[c] == '*' ||
                orpSecurity[a].actionDenied[c] == orgcode
              ) {
                throw new BadRequestException(
                  'Permission denied to access the Organisation group',
                );
              } else {
                var orgname = orpSecurity[a].org;
                for (var d = 0; d < orgname.length; d++) {
                  if (orgname[d].orgCode == orgcode) {
                    var rlegrp = orgname[d].roleGrp;
                    for (var e = 0; e < rlegrp.length; e++) {
                      if (rlegrp[e].roleGrpCode == rolegrp) {
                        if (rlegrp[e].SIFlag == 'A') {
                          for (
                            var f = 0;
                            f < rlegrp[e].actionAllowed.length;
                            f++
                          ) {
                            if (
                              rlegrp[e].actionAllowed[f] == '*' ||
                              rlegrp[e].actionAllowed[f] == rolecode
                            ) {
                              var rle = rlegrp[e].roles;
                              for (var h = 0; h < rle.length; h++) {
                                if (rle[h].roleCode == rolecode) {
                                  var psgrpname = rle[h].psGrp;
                                  for (var m = 0; m < psgrpname.length; m++) {
                                    if (psgrpname[m].psGrpCode == psgrp) {
                                      if (psgrpname[m].SIFlag == 'A') {
                                        for (
                                          var n = 0;
                                          n < psgrpname[m].actionAllowed.length;
                                          n++
                                        ) {
                                          if (
                                            psgrpname[m].actionAllowed[n] ==
                                              '*' ||
                                            psgrpname[m].actionAllowed[n] ==
                                              pscode
                                          ) {
                                            found = true;
                                            PS = psgrpname[m].ps;
                                          } else {
                                            throw new BadRequestException(
                                              'Permission denied to access the Product Service',
                                            );
                                          }
                                        }
                                      } else if (psgrpname[m].SIFlag == 'E') {
                                        for (
                                          var j = 0;
                                          j < psgrpname[m].actionDenied.length;
                                          j++
                                        ) {
                                          if (
                                            psgrpname[m].actionDenied[j] ==
                                              '*' ||
                                            psgrpname[m].actionDenied[j] ==
                                              pscode
                                          ) {
                                            throw new BadRequestException(
                                              'Permission denied to access the Product Service group',
                                            );
                                          } else {
                                            found = true;
                                            PS = psgrpname[m].ps;
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            } else {
                              throw new BadRequestException(
                                'Permission denied to access the Role',
                              );
                            }
                          }
                        } else if (rlegrp[e].SIFlag == 'E') {
                          for (
                            var g = 0;
                            g < rlegrp[e].actionDenied.length;
                            g++
                          ) {
                            if (
                              rlegrp[e].actionDenied[g] == '*' ||
                              rlegrp[e].actionDenied[g] == rolecode
                            ) {
                              throw new BadRequestException(
                                'Permission denied to access the Role group',
                              );
                            } else {
                              var rle = rlegrp[e].roles;
                              for (var h = 0; h < rle.length; h++) {
                                if (rle[h].roleCode == rolecode) {
                                  var psgrpname = rle[h].psGrp;
                                  for (var m = 0; m < psgrpname.length; m++) {
                                    if (psgrpname[m].psGrpCode == psgrp) {
                                      if (psgrpname[m].SIFlag == 'A') {
                                        for (
                                          var n = 0;
                                          n < psgrpname[m].actionAllowed.length;
                                          n++
                                        ) {
                                          if (
                                            psgrpname[m].actionAllowed[n] ==
                                              '*' ||
                                            psgrpname[m].actionAllowed[n] ==
                                              pscode
                                          ) {
                                            found = true;
                                            PS = psgrpname[m].ps;
                                          } else {
                                            throw new BadRequestException(
                                              'Permission denied to access the Product Service',
                                            );
                                          }
                                        }
                                      } else if (psgrpname[m].SIFlag == 'E') {
                                        for (
                                          var j = 0;
                                          j < psgrpname[m].actionDenied.length;
                                          j++
                                        ) {
                                          if (
                                            psgrpname[m].actionDenied[j] ==
                                              '*' ||
                                            psgrpname[m].actionDenied[j] ==
                                              pscode
                                          ) {
                                            throw new BadRequestException(
                                              'Permission denied to access the Product Service group',
                                            );
                                          } else {
                                            found = true;
                                            PS = psgrpname[m].ps;
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (found == true) {
        this.logger.log('SecurityJSON completed');
        return PS;
      } else {
        throw new BadRequestException(
          `${token.orgGrp.orgGrpCode} /${token.roleGrp.roleGrpCode} /${token.psGrp.psGrpCode} group code not found.`,
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async postCallwithAuth(url, body, token) {
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },

    }
  ) 
  return await this.responseData(response.status,response.data);
  }

  async postCall(url,body){
    try{
    const response = await axios.post(url,body,{
      headers: {
        'Content-Type': 'application/json',
      },

    })
    console.log('postapi res',response.data)
  return await this.responseData(response.status,response.data);
    }catch(err){
      throw err;
    }
  }

  async getCall(url){
    try{
    const response = await axios.get(url,{
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  return await this.responseData(response.status,response.data);
}catch(err){
  throw err;
}
  }


  async errorobj(tname:any,error: any,status:any): Promise<any> {
    if(error.code){
    if(error.code == 'ETIMEDOUT')
      status=408
  }
    var errobj = {} 
      errobj['T_ErrorSource'] = tname,
      errobj['T_ErrorGroup'] = "Technical",
      errobj['T_ErrorCategory'] = "<Fabric>",  // General - 9999
      errobj['T_ErrorType'] = "Fatal",
      errobj['T_ErrorCode'] = "<Hardcoded>",
      errobj['errorCode'] = status,
      errobj['errorDetail'] = error   
    return errobj
  }

  async commonErrorLogs(tname:any,stoken:any,key:any,error:any,status:any){
    try{
      var token:any = this.jwtService.decode(stoken,{ json: true }) 
      var str = key.split(':');
      var sessioninfo = {}
      sessioninfo['user'] =  token.preferred_username;
      sessioninfo['appGroupName'] =  str[1];
      sessioninfo['appName'] =  str[2];
      sessioninfo['fabric'] =  str[3];     
      sessioninfo['orgGrp'] =  token.orgGrp.orgGrpCode;
      sessioninfo['org'] =   token.orgGrp.orgCode;
      sessioninfo['roleGrp'] =  token.roleGrp.roleGrpCode;
      sessioninfo['role'] =  token.roleGrp.roleCode;
      sessioninfo['psGrp'] =  token.psGrp.psGrpCode;
      sessioninfo['ps'] =  token.psGrp.psCode;
      var errorDetails = await this.errorobj(tname,error,status)
      var logs = {}
      logs['sessioninfo'] = sessioninfo
      logs['errorDetails'] = errorDetails
      await this.redisService.setStreamData(tname+'ExceptionLogs',key,JSON.stringify(logs))
      return errorDetails
    } catch(err){
       throw err;
    }
    }

  async responseData(statuscode:any, data: any,): Promise<any> {
    try{
    var resobj = {}    
    resobj['status'] = 'Success',
    resobj['statusCode'] = statuscode,
    resobj['result'] = data     
    return resobj
  }catch(err){
    throw err
  }
} 

}