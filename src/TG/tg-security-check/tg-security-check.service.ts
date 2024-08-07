import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtServices } from 'src/jwt.services';
import { RedisService } from 'src/redisService';
import { CommonService } from 'src/commonService';
import { errorObj } from '../Interfaces/errorObj.interface';

@Injectable()
export class TgSecurityCheckService {
  constructor(
    private readonly jwtService: JwtServices,
    private readonly redisService: RedisService,
    private readonly tgCommonSevice: CommonService,
  ) {}
  async securityCheck(body: any, token: string) {
    const decodedToken = this.jwtService.decodeToken(token);
    const roles = decodedToken.realm_access.roles;
    const userRoles: string[] = [];
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const userRole = role.split('-');
      if (userRole[1]) userRoles.push(userRole[1]);
    }

    const uniqueRoleName = new Set();
    const tenantName: string = body.tenantName;
    const appGroupName: string = body.appGroupName;
    const appName: string = body.appName;
    const fabricType: string = body.fabricType;
    const screenName: string = body.screenName;

    let userMatrixJson: any = structuredClone(
      JSON.parse(
        await this.redisService.getJsonData('SecurityJSON:' + tenantName),
      ),
    );
    let compArray: string[] = [];

    for (let i = 0; i < userMatrixJson.appGroupDetails.length; i++) {
      if (userMatrixJson.appGroupDetails[i].appGroupName === appGroupName) {
        for (
          let j = 0;
          j < userMatrixJson.appGroupDetails[i].appDetails.length;
          j++
        ) {
          if (
            userMatrixJson.appGroupDetails[i].appDetails[j].appName === appName
          ) {
            for (
              let k = 0;
              k <
              userMatrixJson.appGroupDetails[i].appDetails[j].rolePolicyDetails
                .length;
              k++
            ) {
              for (
                let l = 0;
                l <
                userMatrixJson.appGroupDetails[i].appDetails[j]
                  .rolePolicyDetails[k].UFpolicy.length;
                l++
              ) {
                if (
                  userMatrixJson.appGroupDetails[i].appDetails[j]
                    .rolePolicyDetails[k].UFpolicy[l].resourceType ===
                  'Components'
                ) {
                  uniqueRoleName.add(
                    userMatrixJson.appGroupDetails[i].appDetails[j]
                      .rolePolicyDetails[k].roleName,
                  );
                }
              }
            }
          }
        }
      }
    }

    for (let o = 0; o < userRoles.length; o++) {

      if (uniqueRoleName.has(userRoles[o])) {
        for (let i = 0; i < userMatrixJson.appGroupDetails.length; i++) {
          if (userMatrixJson.appGroupDetails[i].appGroupName === appGroupName) {
            for (
              let j = 0;
              j < userMatrixJson.appGroupDetails[i].appDetails.length;
              j++
            ) {
              if (
                userMatrixJson.appGroupDetails[i].appDetails[j].appName ===
                appName
              ) {
                for (
                  let k = 0;
                  k <
                  userMatrixJson.appGroupDetails[i].appDetails[j]
                    .rolePolicyDetails.length;
                  k++
                ) {
                  if (
                    userMatrixJson.appGroupDetails[i].appDetails[j]
                      .rolePolicyDetails[k].UFpolicy.length !== 0 &&
                    fabricType === 'UF' &&
                    userRoles[o] ===
                      userMatrixJson.appGroupDetails[i].appDetails[j]
                        .rolePolicyDetails[k].roleName
                  ) {
                    for (
                      let l = 0;
                      l <
                      userMatrixJson.appGroupDetails[i].appDetails[j]
                        .rolePolicyDetails[k].UFpolicy.length;
                      l++
                    ) {
                      if (
                        userMatrixJson.appGroupDetails[i].appDetails[j]
                          .rolePolicyDetails[k].UFpolicy[l].resourceType ===
                          'Components' &&
                        userMatrixJson.appGroupDetails[i].appDetails[j]
                          .rolePolicyDetails[k].UFpolicy[l].artifacts ===
                          screenName
                      ) {
                        if (
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].UFpolicy[l].SIFlag === 'A' &&
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].UFpolicy[l]
                            .actionAllowed[0] === 'Y'
                        ) {

                          compArray.push(
                            userMatrixJson.appGroupDetails[i].appDetails[j]
                              .rolePolicyDetails[k].UFpolicy[l].resource,
                          );
                        }
                        if (
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].UFpolicy[l].SIFlag === 'E' &&
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].UFpolicy[l]
                            .actionDenied[0] === 'N'
                        ) {

                          compArray.push(
                            userMatrixJson.appGroupDetails[i].appDetails[j]
                              .rolePolicyDetails[k].UFpolicy[l].resource,
                          );
                        }
                      }
                    }
                    if (compArray.length === 0) {
                      compArray.push('ALL');
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return compArray;
  }

  async setSaveHandlerData(key, value, path) {
    var temp = structuredClone(value);
    var obj = {};
    if (Array.isArray(temp) || typeof temp === 'string') {
      obj = value;
    } else {
      Object.keys(temp).forEach((item) => {
        if (
          temp[item] !== '' &&
          temp[item] !== undefined &&
          temp[item] !== null
        ) {
          obj[item] = temp[item];
        }
      });
    }
    value = JSON.stringify(obj);
    await this.redisService.setJsonData(key, value, path);
  }

  async uploadHandlerData(key) {
    const flag: any = await this.redisService.getJsonData(key);
    let value: any = {
      params: {
        request: {},
        response: {},
        exception: {},
        urls: {
          apiUrl: 'http://192.168.2.93:3010/user',
        },
        filters: [{}],
        filterConditions: [{}],
        defaults: {
          created_date: '2024-05-23T12:30:00Z',
          created_by: 'Maker',
          modified_date: '2024-05-23T12:30:00Z',
          modified_by: 'Maker',
        },
      },
      stt: {
        eligibleStatus: 'formValidated',
        eligibleProcessStatus: 'verified',
        finalStatus: 'Created',
        finalProcessStatus: 'TransactionInitiated',
      },
    };
    if (!flag) {
      value = JSON.stringify(value);
      await this.redisService.setJsonData(key, value);
    }
  }

  async SFCheckScreen(sfKey, token, screenName) {

    const keyParts: string[] = sfKey.split('-');
    const genScreens: string[] = screenName.split(',');

    const decodedToken: any = await this.jwtService.decodeToken(token);
    var orpSecurity: any = await this.tgCommonSevice.getSecurityJson(
      keyParts[0],
      decodedToken,
    );
    if(!orpSecurity){
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp:'Technical',
        fabric:'SF',
        errType:'Fatal',
        errCode:'TG011',
      }
      const errorMessage = 'SF key is not valid';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj = await this.tgCommonSevice.commonErrorLogs(
        errorObj,
        token,
        keyParts[0],
        errorMessage,
        statusCode,
      );
      throw errObj;
    }
    // return orpSecurity
    orpSecurity= orpSecurity[0]

   let allowedScreensArray: any[] = [];

    // orpSecurity.forEach((orpSecurity) => {
      if (orpSecurity.uf.length > 0) {
        orpSecurity.uf.forEach((uf) => {
          if (
            uf.resourceType === 'Page' &&
            // uf.resource === keyParts[1] &&
            uf.SIFlag.selectedValue === 'A'
          ) {
            
            var page = uf.resource.split(':')[3];
            var Components = [];
            if(uf.componentDetails.length > 0){
              uf.componentDetails.forEach((componentDetails) => {
                if (
                  uf.actionAllowed.selectedValue.includes('*') ||
                  uf.actionAllowed.selectedValue.includes(componentDetails.resource)
                ) {
                  if (
                    componentDetails.resourceType === 'Component' &&
                    componentDetails.SIFlag.selectedValue === 'A'
                  ) {
                    var componentName = '';
                    var control = [];
                    componentName = componentDetails.resource;
                    if(componentDetails.controlDetails.length > 0){
                      componentDetails.controlDetails.forEach((controlDetails) => {
                        if (
                          componentDetails.actionAllowed.selectedValue.includes('*') ||
                          componentDetails.actionAllowed.selectedValue.includes(
                            controlDetails.resource,
                          )
                        ) {
                            control.push(controlDetails.resource);
                          }
                      });
                    }
                    Components.push({
                      componentName,
                      control,
                    });
                    // console.log(Components);
                  } else if (
                    componentDetails.resourceType === 'Component' &&
                    componentDetails.SIFlag.selectedValue === 'E'
                  ) {
                    var componentName = '';
                    var control = [];
                    componentName = componentDetails.resource;
                    if(componentDetails.controlDetails.length > 0){
                      componentDetails.controlDetails.forEach((controlDetails) => {
                        if (
                          componentDetails.actionDenied.selectedValue.includes('*') ||
                          componentDetails.actionDenied.selectedValue.includes(
                            controlDetails.resource,
                          )
                        ) {
                          control.push();
                        } else if (
                          !componentDetails.actionDenied.selectedValue.includes(
                            controlDetails.resource,
                          )
                        ) {
                            control.push(controlDetails.resource);
                        }
                      });
                    }
                    Components.push({
                      componentName,
                      control,
                    });
                  }
                }
              });
            }
            allowedScreensArray.push({
              page: page,
              Components: Components,
            });
          } else if (
            uf.resourceType === 'Page' &&
            // uf.resource === keyParts[1] &&
            uf.SIFlag.selectedValue === 'E'
          ) {
            var page = uf.resource.split(':')[4];
            var Components = [];

            if(uf.componentDetails.length > 0){
              uf.componentDetails.forEach((componentDetails) => {
                if (
                  uf.actionDenied.selectedValue.includes('*') ||
                  uf.actionDenied.selectedValue.includes(componentDetails.resource)
                ) {
                  Components.push();
                } else if (!uf.actionDenied.selectedValue.includes(componentDetails.resource)) {
                  if (
                    componentDetails.resourceType === 'Component' &&
                    componentDetails.SIFlag.selectedValue === 'A'
                  ) {
                    var componentName = '';
                    var control = [];
                    componentName = componentDetails.resource;
                    if(componentDetails.controlDetails.length > 0){
                      componentDetails.controlDetails.forEach((controlDetails) => {
                        if (
                          componentDetails.actionAllowed.selectedValue.includes('*') ||
                          componentDetails.actionAllowed.selectedValue.includes(
                            controlDetails.resource,
                          )
                        ) {
                            control.push(controlDetails.resource);
                        }
                      });
                    }
                    Components.push({
                      componentName,
                      control,
                    });
                    // console.log(Components);
                  } else if (
                    componentDetails.resourceType === 'Component' &&
                    componentDetails.SIFlag.selectedValue === 'E'
                  ) {
                    var componentName = '';
                    var control = [];
                    componentName = componentDetails.resource;
                    if(componentDetails.controlDetails.length > 0){
                      componentDetails.controlDetails.forEach((controlDetails) => {
                        if (
                          componentDetails.actionDenied.selectedValue.includes('*') ||
                          componentDetails.actionDenied.selectedValue.includes(
                            controlDetails.resource,
                          )
                        ) {
                          control.push();
                        } else if (
                          !componentDetails.actionDenied.selectedValue.includes(
                            controlDetails.resource,
                          )
                        ) {
                            control.push(controlDetails.resource);
                        }
                      });
                    }
                    Components.push({
                      componentName,
                      control,
                    });
                  }
                }
              });
            }
            allowedScreensArray.push({
              page: page,
              Components: Components,
            });
          }
        });
      }
    // });

    return allowedScreensArray;

  }
}
