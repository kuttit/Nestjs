import { Injectable } from '@nestjs/common';
import { JwtServices } from 'src/jwt.services';
import { RedisService } from 'src/redisService';
import { CG_CommonService } from '../cg-common/cg-common.service';
import { CommonService } from 'src/commonService';

@Injectable()
export class CgSecurityCheckService {
  constructor(
    private readonly jwtService: JwtServices,
    private readonly redisService: RedisService,
    private readonly cgCommonSevice: CommonService,
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
    // console.log(userRoles,"userRoles");

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
    // console.log(uniqueRoleName);

    console.log(userRoles);

    for (let o = 0; o < userRoles.length; o++) {
      // let flag:boolean=uniqueRoleName.has(userRoles[i])
      // console.log(flag,"flag");
      console.log(uniqueRoleName);

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
                          console.log(
                            userMatrixJson.appGroupDetails[i].appDetails[j]
                              .rolePolicyDetails[k].UFpolicy[l].resource,
                          );

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
                          console.log(
                            userMatrixJson.appGroupDetails[i].appDetails[j]
                              .rolePolicyDetails[k].UFpolicy[l].resource,
                          );

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
    console.log(compArray);

    return compArray;
  }

  async setSaveHandlerData(key, value, path) {
    value = JSON.stringify(value);
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
    console.log(screenName, 'screenNames');

    const keyParts: string[] = sfKey.split('-');
    const genScreens: string[] = screenName.split(',');
    console.log(genScreens);

    const decodedToken: any = await this.jwtService.decodeToken(token);
    var orpSecurity: any = await this.cgCommonSevice.getSecurityJson(
      keyParts[0],
      decodedToken,
    );
    // return orpSecurity
    orpSecurity= orpSecurity[0]
    if (!orpSecurity) {
      return 'SF JSON not found';
    }

  //  var  orpSecurity = [
  //     {
  //       uf: [
  //         {
  //           resourceType: 'Page',
  //           resource: 'ABC:CG:ME:bankmaster:v1',
  //           SIFlag: {
  //             type: 'dropdown',
  //             selectedValue: 'A',
  //             selectionList: ['A', 'E'],
  //             SIFlag: {
  //               selectedValue: 'A',
  //             },
  //           },
  //           actionAllowed: {
  //             type: 'dropdown',
  //             selectedValue: ['*'],
  //             selectionList: ['*', 'menu', 'Nav'],
  //             actionAllowed: {
  //               selectedValue: '*',
  //             },
  //           },
  //           actionDenied: {
  //             type: 'dropdown',
  //             selectedValue: ['*'],
  //             selectionList: ['*', 'menu', 'Nav'],
  //           },
  //           componentDetails: [
  //             {
  //               id: 'a3379537-e360-4c7f-a895-bf8788981ac4',
  //               resourceType: 'Component',
  //               resource: 'menu',
  //               SIFlag: {
  //                 type: 'dropdown',
  //                 selectedValue: 'A',
  //                 selectionList: ['A', 'E'],
  //                 SIFlag: {
  //                   selectedValue: 'A',
  //                 },
  //               },
  //               actionAllowed: {
  //                 type: 'dropdown',
  //                 selectedValue: ['*'],
  //                 selectionList: [
  //                   '*',
  //                   'Bank_Code',
  //                   'Bank_Type',
  //                   'Save',
  //                   'Short_Code',
  //                 ],
  //                 actionAllowed: {
  //                   selectedValue: '*',
  //                 },
  //               },
  //               actionDenied: {
  //                 type: 'dropdown',
  //                 selectedValue: ['*'],
  //                 selectionList: [
  //                   '*',
  //                   'Bank_Code',
  //                   'Bank_Type',
  //                   'Save',
  //                   'Short_Code',
  //                 ],
  //               },
  //               controlDetails: [
  //                 {
  //                   resourceType: 'controls',
  //                   resource: 'Bank_Code',
  //                   SIFlag: {
  //                     type: 'dropdown',
  //                     selectedValue: 'A',
  //                     selectionList: ['A', 'E'],
  //                     SIFlag: {
  //                       selectedValue: 'A',
  //                     },
  //                   },
  //                   actionAllowed: {
  //                     type: 'dropdown',
  //                     selectedValue: ['*'],
  //                     selectionList: ['*', 'Y', 'N'],
  //                     actionAllowed: {
  //                       selectedValue: 'Y',
  //                     },
  //                   },
  //                   actionDenied: {
  //                     type: 'dropdown',
  //                     selectedValue: ['*'],
  //                     selectionList: ['*', 'Y', 'N'],
  //                   },
  //                 },
  //                 {
  //                   resourceType: 'controls',
  //                   resource: 'Bank_Type',
  //                   SIFlag: {
  //                     type: 'dropdown',
  //                     selectedValue: 'A',
  //                     selectionList: ['A', 'E'],
  //                     SIFlag: {
  //                       selectedValue: 'A',
  //                     },
  //                   },
  //                   actionAllowed: {
  //                     type: 'dropdown',
  //                     selectedValue: ['*'],
  //                     selectionList: ['*', 'Y', 'N'],
  //                     actionAllowed: {
  //                       selectedValue: 'Y',
  //                     },
  //                   },
  //                   actionDenied: {
  //                     type: 'dropdown',
  //                     selectedValue: ['*'],
  //                     selectionList: ['*', 'Y', 'N'],
  //                   },
  //                 },
  //                 {
  //                   resourceType: 'controls',
  //                   resource: 'Save',
  //                   SIFlag: {
  //                     type: 'dropdown',
  //                     selectedValue: 'A',
  //                     selectionList: ['A', 'E'],
  //                   },
  //                   actionAllowed: {
  //                     type: 'dropdown',
  //                     selectedValue: ['*'],
  //                     selectionList: ['*', 'Y', 'N'],
  //                   },
  //                   actionDenied: {
  //                     type: 'dropdown',
  //                     selectedValue: ['*'],
  //                     selectionList: ['*', 'Y', 'N'],
  //                   },
  //                 },
  //                 {
  //                   resourceType: 'controls',
  //                   resource: 'Short_Code',
  //                   SIFlag: {
  //                     type: 'dropdown',
  //                     selectedValue: 'A',
  //                     selectionList: ['A', 'E'],
  //                     SIFlag: {
  //                       selectedValue: 'A',
  //                     },
  //                   },
  //                   actionAllowed: {
  //                     type: 'dropdown',
  //                     selectedValue: ['*'],
  //                     selectionList: ['*', 'Y', 'N'],
  //                     actionAllowed: {
  //                       selectedValue: 'Y',
  //                     },
  //                   },
  //                   actionDenied: {
  //                     type: 'dropdown',
  //                     selectedValue: ['*'],
  //                     selectionList: ['*', 'Y', 'N'],
  //                   },
  //                 },
  //               ],
  //             },
  //             {
  //               id: '8c2a6837-8ed2-4ec4-a30f-845bf8d4f427',
  //               resourceType: 'Component',
  //               resource: 'Nav',
  //               SIFlag: {
  //                 type: 'dropdown',
  //                 selectedValue: 'A',
  //                 selectionList: ['A', 'E'],
  //                 SIFlag: {
  //                   selectedValue: 'A',
  //                 },
  //               },
  //               actionAllowed: {
  //                 type: 'dropdown',
  //                 selectedValue: ['*'],
  //                 selectionList: ['*', 'navBar'],
  //                 actionAllowed: {
  //                   selectedValue: '*',
  //                 },
  //               },
  //               actionDenied: {
  //                 type: 'dropdown',
  //                 selectedValue: ['*'],
  //                 selectionList: ['*', 'navBar'],
  //               },
  //               controlDetails: [
  //                 {
  //                   resourceType: 'controls',
  //                   resource: 'navBar',
  //                   SIFlag: {
  //                     type: 'dropdown',
  //                     selectedValue: 'A',
  //                     selectionList: ['A', 'E'],
  //                     SIFlag: {
  //                       selectedValue: 'A',
  //                     },
  //                   },
  //                   actionAllowed: {
  //                     type: 'dropdown',
  //                     selectedValue: ['*'],
  //                     selectionList: ['*', 'Y', 'N'],
  //                     actionAllowed: {
  //                       selectedValue: 'Y',
  //                     },
  //                   },
  //                   actionDenied: {
  //                     type: 'dropdown',
  //                     selectedValue: ['*'],
  //                     selectionList: ['*', 'Y', 'N'],
  //                   },
  //                 },
  //               ],
  //             },
  //           ],
  //         },
  //       ],
  //     },
  //   ];

    let allowedScreensArray: any[] = [];

    // orpSecurity.forEach((orpSecurity) => {
      if (orpSecurity.uf) {
        orpSecurity.uf.forEach((uf) => {
          if (
            uf.resourceType === 'Page' &&
            // uf.resource === keyParts[1] &&
            uf.SIFlag.selectedValue === 'A'
          ) {
            console.log(1);
            
            var page = uf.resource.split(':')[3];
            var Components = [];

            uf.componentDetails.forEach((componentDetails) => {
              if (
                uf.actionAllowed.selectedValue.includes('*') ||
                uf.actionAllowed.selectedValue.includes(componentDetails.resource)
              ) {
                console.log(2);
                if (
                  componentDetails.resourceType === 'Component' &&
                  componentDetails.SIFlag.selectedValue === 'A'
                ) {
                  console.log(3);
                  var componentName = '';
                  var control = [];
                  componentName = componentDetails.resource;
                  componentDetails.controlDetails.forEach((controlDetails) => {
                    if (
                      componentDetails.actionAllowed.selectedValue.includes('*') ||
                      componentDetails.actionAllowed.selectedValue.includes(
                        controlDetails.resource,
                      )
                    ) {
                      console.log(4);
                      if (
                        controlDetails.resourceType === 'controls' &&
                        ((controlDetails.SIFlag.selectedValue === 'A' &&
                          controlDetails.actionAllowed.selectedValue.includes('Y')) ||
                          (componentDetails.SIFlag.selectedValue === 'E' &&
                            componentDetails.actionDenied.selectedValue.includes('N')))
                      ) {
                        console.log(controlDetails.resource, 'controlDetails');
                        
                        control.push(controlDetails.resource);
                      }
                    }
                  });

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
                      if (
                        controlDetails.resourceType === 'controls' &&
                        ((controlDetails.SIFlag.selectedValue === 'A' &&
                          controlDetails.actionAllowed.selectedValue.includes('Y')) ||
                          (componentDetails.SIFlag.selectedValue === 'E' &&
                            componentDetails.actionDenied.selectedValue.includes('N')))
                      ) {
                        control.push(controlDetails.resource);
                      }
                    }
                  });
                  Components.push({
                    componentName,
                    control,
                  });
                }
              }
            });
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
                  componentDetails.controlDetails.forEach((controlDetails) => {
                    if (
                      componentDetails.actionAllowed.selectedValue.includes('*') ||
                      componentDetails.actionAllowed.selectedValue.includes(
                        controlDetails.resource,
                      )
                    ) {
                      if (
                        controlDetails.resourceType === 'controls' &&
                        ((controlDetails.SIFlag.selectedValue === 'A' &&
                          controlDetails.actionAllowed.selectedValue.includes('Y')) ||
                          (componentDetails.SIFlag.selectedValue === 'E' &&
                            componentDetails.actionDenied.selectedValue.includes('N')))
                      ) {
                        control.push(controlDetails.resource);
                      }
                    }
                  });

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
                      if (
                        controlDetails.resourceType === 'controls' &&
                        ((controlDetails.SIFlag.selectedValue === 'A' &&
                          controlDetails.actionAllowed.selectedValue.includes('Y')) ||
                          (componentDetails.SIFlag.selectedValue === 'E' &&
                            componentDetails.actionDenied.selectedValue.includes('N')))
                      ) {
                        control.push(controlDetails.resource);
                      }
                    }
                  });
                  Components.push({
                    componentName,
                    control,
                  });
                }
              }
            });
            allowedScreensArray.push({
              page: page,
              Components: Components,
            });
          }
        });
      }
    // });

    return allowedScreensArray;

    var filteredScreen = [];

    if (allowedScreensArray.length) {
      console.log(genScreens);

      genScreens.forEach((element) => {
        allowedScreensArray.forEach((allowedScreens) => {
          if (allowedScreens.page.toLowerCase() === element.toLowerCase()) {
            filteredScreen.push(allowedScreens);
          }
        });
      });

      return filteredScreen;
    } else {
      return [];
    }
  }
}
