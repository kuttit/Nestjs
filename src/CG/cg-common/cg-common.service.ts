import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import * as fs from 'fs';
import { JwtServices } from 'src/jwt.services';
import { RedisService } from 'src/redisService';

@Injectable()
export class CG_CommonService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Asynchronously creates a schema file based on the provided template, data, relation, and path.
   *
   * @param {any} template - The template used for schema creation.
   * @param {any} data - The data to be used in the schema.
   * @param {any} relation - The relation of the schema.
   * @param {string} path - The path where the schema file will be written.
   * @return {void} This function does not return a value.
   */
  async CreateSchemaFile(template, data, relation, path) {
    try {
      let objtemplate: any = await this.ReadFile(template);
      let fn = ejs.compile(objtemplate);
      let str = fn({
        data: data,
        relation: relation,
      });
      if (str != '') {
        fs.writeFileSync(path, str);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Asynchronously reads the contents of a file at the specified path and returns it as a string.
   *
   * @param {any} strReadPath - The path of the file to be read.
   * @return {Promise<string>} A promise that resolves to the contents of the file as a string.
   * @throws {Error} If there is an error reading the file.
   */
  async ReadFile(strReadPath: any) {
    try {
      return await fs.readFileSync(strReadPath, 'utf8');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Asynchronously creates a folder with the given name.
   *
   * @param {string} foldername - The name of the folder to create.
   * @return {Promise<string>} A promise that resolves to 'success' when the folder is created.
   */
  async createFolder(foldername: string) {
    // let strroot_path: string = path.join('src', foldername)
    fs.mkdirSync(foldername, { recursive: true });
    return await 'success';
  }
  /**
   * Asynchronously creates a file based on the provided template, data, and path.
   *
   * @param {any} template - The template used for file creation.
   * @param {any} data - The data to be used in the file.
   * @param {string} path - The path where the file will be written.
   * @return {Promise<void>} A promise that resolves when the file is created.
   * @throws {Error} If there is an error reading the template or writing the file.
   */
  async createFile(template, data, path) {
    try {
      let objtemplate: any = await this.ReadFile(template);

      let fn = ejs.compile(objtemplate);
      let str = fn(data);
      if (str != '') {
        fs.writeFileSync(path, str);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Asynchronously creates a file based on the provided template, data, relation, data1, and data2, and writes it to the specified path.
   *
   * @param {any} template - The path of the template file.
   * @param {any} data - The data to be used in the file.
   * @param {any} relation - The relation of the data.
   * @param {any} data1 - Additional data.
   * @param {any} data2 - Additional data.
   * @param {string} path - The path where the file will be written.
   * @return {Promise<void>} A promise that resolves when the file is created.
   * @throws {Error} If there is an error reading the template or writing the file.
   */
  async CreateFileWithThreeParam(template, data, relation, data1, data2, path) {
    try {
      let objtemplate: any = await this.ReadFile(template);
      let fn = ejs.compile(objtemplate);
      let str = fn({
        data: data,
        relation: relation,
        data1: data1,
        data2: data2,
      });
      if (str != '') {
        fs.writeFileSync(path, str);
      }
    } catch (error) {
      throw error;
    }
  }

  async toPascalCase(inputString) {
    return inputString
      .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index === 0 ? word.toUpperCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  }

  async copyFile(source, target) {
    fs.copyFileSync(source, target);
  }

  async securityCheck(key, decodedToken) {
    const orgGrpCode = decodedToken.orgGrp.orgGrpCode;
    const orgCode = decodedToken.orgGrp.orgCode;
    const roleGrpCode = decodedToken.roleGrp.roleGrpCode;
    const roleCode = decodedToken.roleGrp.roleCode;
    const psGrpCode = decodedToken.psGrp.psGrpCode;
    const psCode = decodedToken.psGrp.psCode;
    let securityFlag = false;
    // console.log(orgCode, typeof orgCode, 'orgCode');

    interface orps {
      orgGrpCode: string;
      orgCode: string;
      roleGrpCode: string;
      roleCode: string;
      psGrpCode: string;
      psCode: string;
      resource: any;
      SIFlag: string;
      can: Array<string>;
      cannot: Array<string>;
    }

    let orpSecurity = JSON.parse(await this.redisService.getJsonData(key));
    try {
      if (orpSecurity) {
        orpSecurity.orgGrp.map(async (orgGrp) => {
          if (
            orgGrp.orgGrpCode === orgGrpCode &&
            orgGrp.SIFlag === 'A' &&
            orgGrp.org
          ) {
            // console.log(orgGrp.actionAllowed);

            if (
              orgGrp.actionAllowed.includes('*') ||
              orgGrp.actionAllowed.includes(orgCode)
            ) {
              // console.log('hi');

              orgGrp.org.map((org) => {
                if (org.orgCode === orgCode && org.roleGrp) {
                  org.roleGrp.map((roleGrp) => {
                    if (
                      roleGrp.roleGrpCode === roleGrpCode &&
                      roleGrp.SIFlag === 'A' &&
                      roleGrp.roles
                    ) {
                      if (
                        roleGrp.actionAllowed.includes('*') ||
                        roleGrp.actionAllowed.includes(roleCode)
                      ) {
                        roleGrp.roles.map((role) => {
                          if (role.roleCode === roleCode && role.psGrp) {
                            role.psGrp.map((psGrp) => {
                              if (
                                psGrp.psGrpCode === psGrpCode &&
                                psGrp.SIFlag === 'A' &&
                                psGrp.ps
                              ) {
                                if (
                                  psGrp.actionAllowed.includes('*') ||
                                  psGrp.actionAllowed.includes(psCode)
                                ) {
                                  psGrp.ps.map((ps) => {
                                    if (ps.psCode === psCode) {
                                      return ps;
                                    }
                                  });
                                }
                              } else if (
                                psGrp.psGrpCode === psGrpCode &&
                                psGrp.SIFlag === 'E' &&
                                psGrp.ps
                              ) {
                                if (
                                  psGrp.actionDenied.includes('*') ||
                                  psGrp.actionDenied.includes(psCode)
                                ) {
                                  securityFlag = false;
                                } else {
                                  psGrp.ps.map((ps) => {
                                    if (ps.psCode === psCode) {
                                      return ps;
                                    }
                                  });
                                }
                              }
                            });
                          }
                        });
                      }
                    } else if (
                      roleGrp.roleGrpCode === roleGrpCode &&
                      roleGrp.SIFlag === 'E' &&
                      roleGrp.roles
                    ) {
                      if (
                        roleGrp.actionDenied.includes('*') ||
                        roleGrp.actionDenied.includes(roleCode)
                      ) {
                        securityFlag = false;
                      } else {
                        roleGrp.roles.map((role) => {
                          if (role.roleCode === roleCode && role.psGrp) {
                            role.psGrp.map((psGrp) => {
                              if (
                                psGrp.psGrpCode === psGrpCode &&
                                psGrp.SIFlag === 'A' &&
                                psGrp.ps
                              ) {
                                if (
                                  psGrp.actionAllowed.includes('*') ||
                                  psGrp.actionAllowed.includes(psCode)
                                ) {
                                  psGrp.ps.map((ps) => {
                                    if (ps.psCode === psCode) {
                                      return ps;
                                    }
                                  });
                                }
                              } else if (
                                psGrp.psGrpCode === psGrpCode &&
                                psGrp.SIFlag === 'E' &&
                                psGrp.ps
                              ) {
                                if (
                                  psGrp.actionDenied.includes('*') ||
                                  psGrp.actionDenied.includes(psCode)
                                ) {
                                  securityFlag = false;
                                } else {
                                  psGrp.ps.map((ps) => {
                                    if (ps.psCode === psCode) {
                                      return ps;
                                    }
                                  });
                                }
                              }
                            });
                          }
                        });
                      }
                    }
                  });
                }
              });
            }
          } else if (
            orgGrp.orgGrpCode === orgGrpCode &&
            orgGrp.SIFlag === 'E' &&
            orgGrp.org
          ) {
            if (
              orgGrp.actionDenied.includes('*') ||
              orgGrp.actionDenied.includes(orgCode)
            ) {
              securityFlag = false;
            } else {
              orgGrp.org.map((org) => {
                if (org.orgCode === orgCode && org.roleGrp) {
                  org.roleGrp.map((roleGrp) => {
                    if (
                      roleGrp.roleGrpCode === roleGrpCode &&
                      roleGrp.SIFlag === 'A' &&
                      roleGrp.roles
                    ) {
                      if (
                        roleGrp.actionAllowed.includes('*') ||
                        roleGrp.actionAllowed.includes(roleCode)
                      ) {
                        roleGrp.roles.map((role) => {
                          if (role.roleCode === roleCode && role.psGrp) {
                            role.psGrp.map((psGrp) => {
                              if (
                                psGrp.psGrpCode === psGrpCode &&
                                psGrp.SIFlag === 'A' &&
                                psGrp.ps
                              ) {
                                if (
                                  psGrp.actionAllowed.includes('*') ||
                                  psGrp.actionAllowed.includes(psCode)
                                ) {
                                  psGrp.ps.map((ps) => {
                                    if (ps.psCode === psCode) {
                                      return ps;
                                    }
                                  });
                                }
                              } else if (
                                psGrp.psGrpCode === psGrpCode &&
                                psGrp.SIFlag === 'E' &&
                                psGrp.ps
                              ) {
                                if (
                                  psGrp.actionDenied.includes('*') ||
                                  psGrp.actionDenied.includes(psCode)
                                ) {
                                  securityFlag = false;
                                } else {
                                  psGrp.ps.map((ps) => {
                                    if (ps.psCode === psCode) {
                                      return ps;
                                    }
                                  });
                                }
                              }
                            });
                          }
                        });
                      }
                    } else if (
                      roleGrp.roleGrpCode === roleGrpCode &&
                      roleGrp.SIFlag === 'E' &&
                      roleGrp.roles
                    ) {
                      if (
                        roleGrp.actionDenied.includes('*') ||
                        roleGrp.actionDenied.includes(roleCode)
                      ) {
                        securityFlag = false;
                      } else {
                        roleGrp.roles.map((role) => {
                          if (role.roleCode === roleCode && role.psGrp) {
                            role.psGrp.map((psGrp) => {
                              if (
                                psGrp.psGrpCode === psGrpCode &&
                                psGrp.SIFlag === 'A' &&
                                psGrp.ps
                              ) {
                                if (
                                  psGrp.actionAllowed.includes('*') ||
                                  psGrp.actionAllowed.includes(psCode)
                                ) {
                                  psGrp.ps.map((ps) => {
                                    if (ps.psCode === psCode) {
                                      return ps;
                                    }
                                  });
                                }
                              } else if (
                                psGrp.psGrpCode === psGrpCode &&
                                psGrp.SIFlag === 'E' &&
                                psGrp.ps
                              ) {
                                if (
                                  psGrp.actionDenied.includes('*') ||
                                  psGrp.actionDenied.includes(psCode)
                                ) {
                                  securityFlag = false;
                                } else {
                                  psGrp.ps.map((ps) => {
                                    if (ps.psCode === psCode) {
                                      return ps;
                                    }
                                  });
                                }
                              }
                            });
                          }
                        });
                      }
                    }
                  });
                }
              });
            }
          }
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  async getSecurityJson(key, token) {
    // console.log(key);
    
    try {
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
      var orpSecurity = JSON.parse(
        await this.redisService.getJsonDataWithPath(
          str[0] + ':' + str[1] + ':' + str[2] + ':SF:' + str[4] + ':' + str[5],'.orgGrp',
        ),
      );
      
      // console.log(orpSecurity, 'orpSecurity');
      if (orpSecurity.length !== 0) {
        for (var a = 0; a < orpSecurity.length; a++) {
          if (orpSecurity[a].orgGrpCode == orggrp) {
            if (orpSecurity[a].SIFlag == 'A') {
              for (var b = 0; b < orpSecurity[a].actionAllowed.length; b++) {
                // console.log(orpSecurity[a].actionAllowed[b]);
  
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
                                              var PS = psgrpname[m].ps;
  
                                              return PS;
                                            } else {
                                              return 'No Access';
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
                                              return 'No Access';
                                            } else {
                                              var PS = psgrpname[m].ps;
                                              return PS;
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              } else {
                                return 'No Access';
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
                                return 'No Access';
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
                                              var PS = psgrpname[m].ps;
  
                                              return PS;
                                            } else {
                                              return 'No Access';
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
                                              return 'No Access';
                                            } else {
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
                  return 'No access';
                }
              }
            } else if (orpSecurity[a].SIFlag == 'E') {
              // console.log(1);
  
              for (var c = 0; c < orpSecurity[a].actionDenied.length; c++) {
                // console.log(2);
  
                if (
                  orpSecurity[a].actionDenied[c] == '*' ||
                  orpSecurity[a].actionDenied[c] == orgcode
                ) {
                  // console.log(3);
  
                  return 'No access';
                } else {
                  var orgname = orpSecurity[a].org;
  
                  console.log('org', orgname);
  
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
                                              var PS = psgrpname[m].ps;
  
                                              return PS;
                                            } else {
                                              return 'No Access';
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
                                              return 'No Access';
                                            } else {
                                              var PS = psgrpname[m].ps;
  
                                              return PS;
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              } else {
                                return 'No Access';
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
                                return 'No Access';
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
                                              var PS = psgrpname[m].ps;
  
                                              return PS;
                                            } else {
                                              return 'No Access';
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
                                              return 'No Access';
                                            } else {
                                              var PS = psgrpname[m].ps;
  
                                              return PS;
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
      }else {
        return 'No Security Policy';
      }
    } catch (error) {
      throw error;
    }
  }
}
