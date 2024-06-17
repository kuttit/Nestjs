import { HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from 'src/redisService';
import { CustomException } from './customException';
import { JwtService } from '@nestjs/jwt';
import {
  appGroupTemplate,
  appTemplate,
  group,
  tenantProfileTemplate,
} from './constants';

@Injectable()
export class TpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async getTenantProfile(tenant: string) {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:profile`,
      );
      const envTemplate = tenantProfileTemplate.ENV
      envTemplate.code = tenant;
      const updatedTemplate = {...tenantProfileTemplate ,ENV : envTemplate}
      if (responseFromRedis) {
        //send stored Tenant profile data from redis without AppGroups data
        const tenantProfileInfo = JSON.parse(responseFromRedis);
        const {ENV} = tenantProfileInfo
        delete ENV.APPS
        return { ...tenantProfileInfo, ENV: ENV };
      } else {
        return { ...updatedTemplate, Code: tenant };
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async postTenantProfile(tenant: string, tenantProfileInfo: any) {
    try {
      const UpdatedEnv = tenantProfileInfo.ENV;
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:profile`,
      );
      if (responseFromRedis) {
        const existingTenantProfile = JSON.parse(responseFromRedis);
        const { ENV } = existingTenantProfile;
        UpdatedEnv.APPS = ENV.APPS
        return await this.redisService.setJsonData(
          `${tenant}:profile`,
          JSON.stringify({
            ...tenantProfileInfo, ENV: UpdatedEnv
          }),
        );
      } else {
        return await this.redisService.setJsonData(
          `${tenant}:profile`,
          JSON.stringify(tenantProfileInfo),
        );
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAppGroupInfo(tenant: string, appGroup: string) {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:profile`,
      );

      if (responseFromRedis) {
        const tenantProfileInfo = JSON.parse(responseFromRedis);
        const existingAgIndex = tenantProfileInfo.AG.findIndex(
          (ele) => ele.code == appGroup,
        );
        if (existingAgIndex != -1) {
          const data = tenantProfileInfo['AG'][existingAgIndex];
          return { ...data, APPS: [] };
        } else {
          return { ...appGroupTemplate, code: appGroup };
        }
      } else {
        return { ...appGroupTemplate, code: appGroup };
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async postAppGroupInfo(tenant: string, appGroup: string, appGroupObj) {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:profile`,
      );
      if (responseFromRedis) {
        const tenantProfileInfo = JSON.parse(responseFromRedis);
        const existingAgIndex = tenantProfileInfo.AG.findIndex(
          (ele) => ele.code == appGroup,
        );
        if (existingAgIndex != -1) {
          //replace the existing index with the incoming appgroupObj without changing the APPS array it had already
          tenantProfileInfo.AG.splice(existingAgIndex, 1, {
            ...appGroupObj,
            APPS: tenantProfileInfo.AG[existingAgIndex].APPS,
          });
        } else {
          //push the incoming appgroupObj to the tenantprofile
          tenantProfileInfo.AG.push(appGroupObj);
        }
        //create the tenantProfile data with the updated informations
        return await this.redisService.setJsonData(
          `${tenant}:profile`,
          JSON.stringify(tenantProfileInfo),
        );
      } else {
        const data = { ...tenantProfileTemplate, Code: tenant };
        data.AG.push(appGroupObj);
        return await this.redisService.setJsonData(
          `${tenant}:profile`,
          JSON.stringify(data),
        );
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAppInfo(tenant: string, appGroup: string, app: string) {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:profile`,
      );
      if (responseFromRedis) {
        const tenantProfileInfo = JSON.parse(responseFromRedis);
        const existingAgIndex = tenantProfileInfo.AG.findIndex(
          (ele) => ele.code == appGroup,
        );
        if (existingAgIndex != -1) {
          const existingAppIndex = tenantProfileInfo['AG'][existingAgIndex][
            'APPS'
          ].findIndex((ele) => ele.code == app);
          if (existingAppIndex != -1) {
            const data =
              tenantProfileInfo['AG'][existingAgIndex]['APPS'][
                existingAppIndex
              ];
            return data;
          } else {
            return { ...appTemplate, code: app };
          }
        } else {
          return { ...appTemplate, code: app };
        }
      } else {
        return { ...appTemplate, code: app };
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async postAppInfo(
    tenant: string,
    appGroup: string,
    app: string,
    appObj: any,
  ) {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:profile`,
      );
      if (responseFromRedis) {
        const tenantProfileInfo = JSON.parse(responseFromRedis);
        const existingAgIndex = tenantProfileInfo.AG.findIndex(
          (ele) => ele.code == appGroup,
        );
        if (existingAgIndex != -1) {
          const existingAppIndex = tenantProfileInfo['AG'][existingAgIndex][
            'APPS'
          ].findIndex((ele) => ele.code == app);
          if (existingAppIndex != -1) {
            tenantProfileInfo['AG'][existingAgIndex]['APPS'].splice(
              existingAppIndex,
              1,
              appObj,
            );
          } else {
            tenantProfileInfo['AG'][existingAgIndex]['APPS'].push(appObj);
          }
        } else {
          const data = { ...appGroupTemplate, code: appGroup };
          data.APPS.push(appObj);
          tenantProfileInfo['AG'].push(data);
        }
        return await this.redisService.setJsonData(
          `${tenant}:profile`,
          JSON.stringify(tenantProfileInfo),
        );
      } else {
        const data = { ...tenantProfileTemplate, Code: tenant };
        const appGroupData = { ...appGroupTemplate, code: appGroup };
        appGroupData.APPS.push({ ...appObj });
        data.AG.push(appGroupData);
        return await this.redisService.setJsonData(
          `${tenant}:profile`,
          JSON.stringify(data),
        );
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAppGroupList(tenant: string) {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:profile`,
      );
      if (responseFromRedis) {
        const tenantProfileInfo = JSON.parse(responseFromRedis);
        const AppGroupList = tenantProfileInfo.AG.map((ele) => ele.code);
        return AppGroupList;
      } else {
        throw new Error('Tenant Details not available or tenant not exist');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAppList(tenant: string, appGroup: string) {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:profile`,
      );
      if (responseFromRedis && tenant && appGroup) {
        const tenantProfileInfo = JSON.parse(responseFromRedis);
        const existingAgIndex = tenantProfileInfo.AG.findIndex(
          (ele) => ele.code == appGroup,
        );
        if (existingAgIndex != -1) {
          const AppList = tenantProfileInfo['AG'][existingAgIndex]['APPS'].map(
            (ele) => ele.code,
          );
          return AppList;
        } else {
          throw new Error(
            'AppGroup not available in the tenant, please check AppGroup and App details',
          );
        }
      } else {
        throw new Error('Tenant Details not available or tenant not exist');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async createTenant(tenantObj: any) {
    try {
      const obj = tenantObj;
      const mainJSON = await this.redisService.getJsonData('tenantJson');
      if (mainJSON) {
        var completeData = JSON.parse(mainJSON);

        if (
          completeData.hasOwnProperty('TENANT') &&
          Array.isArray(completeData['TENANT'])
        ) {
          const index = completeData['TENANT'].findIndex(
            (item) => item.Code == obj['Tenant'].Code,
          );
          if (index != -1) {
            return { error: 'Tenant already exists' };
          } else {
            completeData['TENANT'].push(obj['Tenant']);

            await this.redisService.setJsonData(
              'tenantJson',
              JSON.stringify(completeData),
            );
            return { data: 'Tenant created successfully in local setup' };
          }
        }
      } else {
        return { error: 'Error occured' };
      }
    } catch (err) {
      return { error: 'Error occured' };
    }
  }

  async createAppGroup(appGroupObj: any, tenant: string) {
    try {
      const obj = appGroupObj;
      const newAppGroup = obj[tenant].AG;
      const appGroupName = newAppGroup.code;
      if (tenant && appGroupName && newAppGroup) {
        return this.postAppGroupInfo(tenant, appGroupName, newAppGroup);
      } else {
        throw new Error('There is not enough details to create AppGroup');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteAppGroup(appGroup: string, tenant: string) {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:profile`,
      );
      if (responseFromRedis) {
        const tenantProfileInfo = JSON.parse(responseFromRedis);
        const existingAppGroupIndex = tenantProfileInfo.AG.findIndex(
          (ele) => ele.code == appGroup,
        );
        if (existingAppGroupIndex != -1) {
          tenantProfileInfo['AG'].splice(existingAppGroupIndex, 1);
          return await this.redisService.setJsonData(
            `${tenant}:profile`,
            JSON.stringify(tenantProfileInfo),
          );
        } else {
          throw new Error('Given AppGroup not exist in tenant profile');
        }
      } else {
        throw new Error('There is not enough details to delete AppGroup');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async createApp(appObj: any, tenant: string, group: string) {
    try {
      const obj = appObj;
      const newApp = obj[group].APP;
      const appName = newApp.code;
      if (tenant && group && newApp && appName) {
        return this.postAppInfo(tenant, group, appName, newApp);
      } else {
        throw new Error('There is not enough data to create new Application');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteApplication(app: string, appGroup: string, tenant: string) {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:profile`,
      );
      if (responseFromRedis) {
        const tenantProfileInfo = JSON.parse(responseFromRedis);
        const existingAppGroupIndex = tenantProfileInfo.AG.findIndex(
          (ele) => ele.code == appGroup,
        );
        if (existingAppGroupIndex != -1) {
          const existingAppIndex = tenantProfileInfo['AG'][
            existingAppGroupIndex
          ]['APPS'].findIndex((ele) => ele.code == app);
          if (existingAppIndex != -1) {
            tenantProfileInfo['AG'][existingAppGroupIndex]['APPS'].splice(
              existingAppIndex,
              1,
            );
            return await this.redisService.setJsonData(
              `${tenant}:profile`,
              JSON.stringify(tenantProfileInfo),
            );
          } else {
            throw new Error('Application not available');
          }
        } else {
          throw new Error('AppGroup not available');
        }
      } else {
        throw new Error('No application available here');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAppEnvironment(tenantAndEnv: string, app: string) {
    try {
      const envObjTemplate = {
        code: app,
        version: '',
        status: '',
        appPath: '',
        generatedUrl: '',
        accessUrl: '',
      };
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenantAndEnv}:profile`,
      );
      if (responseFromRedis) {
        var tenantProfileInfo = JSON.parse(responseFromRedis);
        const {ENV} = tenantProfileInfo
        if(ENV.APPS){
          const index = ENV.APPS.findIndex((item) => item.code == app);
          if (index != -1) {
            const AlterData =  ENV.APPS[index]
            return AlterData;
          } else {
            return envObjTemplate
          }
        } else{
          return envObjTemplate
        }
      } else {
        throw new Error('There is not enough details to get App Environment');
      }
    } catch (error) {
      // Catch any other errors and throw a custom exception
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async postAppEnvironment(
    tenant: string,
    envAppObj: any,
  ) {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:profile`,
      );
      if (responseFromRedis) {
        var tenantProfileInfo = JSON.parse(responseFromRedis);
        const { ENV } = tenantProfileInfo;
        if(ENV.APPS){
        const existingAppIndex = ENV.APPS.findIndex((item) => item.code == envAppObj.code);
        if(existingAppIndex != -1){
          ENV.APPS.splice(existingAppIndex, 1, envAppObj);
        } else {
          ENV.APPS.push(envAppObj);
        }
        } else {
          ENV.APPS = [{...envAppObj}];
        }
        return await this.redisService.setJsonData(
          `${tenant}:profile`,
          JSON.stringify({...tenantProfileInfo, ENV:ENV}),
        );
      } else {
        throw new Error('There is not enough details to post App Environment');
      }
    } catch (error) {
      // Catch any other errors and throw a custom exception
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async postAppRequirement(
    tenant: string,
    appGroup: string,
    app: string,
    reqObj: any,
    date?: any,
  ): Promise<any> {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:${appGroup}:${app}:requirements`,
      );

      if (responseFromRedis) {
        const requirementJson = JSON.parse(responseFromRedis);
        if (date !== undefined) {
          const index = requirementJson.findIndex(
            (item) => item.createddateTime == date,
          );

          return await this.redisService.setJsonData(
            `${tenant}:${appGroup}:${app}:requirements`,
            JSON.stringify(reqObj),
            `[${index}]`,
          );
        } else {
          requirementJson.push(reqObj);
          return await this.redisService.setJsonData(
            `${tenant}:${appGroup}:${app}:requirements`,
            JSON.stringify(requirementJson),
          );
        }
      } else {
        return await this.redisService.setJsonData(
          `${tenant}:${appGroup}:${app}:requirements`,
          JSON.stringify([{ ...reqObj }]),
        );
      }
    } catch (error) {
      // Catch any other errors and throw a custom exception
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAppRequirement(tenant: string, appGroup: string, app: string) {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:${appGroup}:${app}:requirements`,
      );
      const appReqTemplate = [];

      if (responseFromRedis) {
        const requirementJson: any[] = JSON.parse(responseFromRedis);
        const res = requirementJson.filter((item) => item.recordType !== 'D');
        return res;
      } else {
        return appReqTemplate;
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAssemblerVersion(key: string) {
    try {
      if (key) {
        const allkeys = await this.redisService.getKeys(key);
        if (Array.isArray(allkeys) && allkeys.length) {
          const data: string[] = allkeys.map((item: string) => {
            return item.split(key)[1].split(':')[1];
          });
          return [...new Set(data)];
        } else {
          return allkeys;
        }
      } else {
        throw new Error('Please provide valid key to fetch version');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAssemblerData(key: string) {
    try {
      if (key) {
        const data = await this.redisService.getJsonData(key);
        if (data) {
          return JSON.parse(data);
        } else {
          throw new Error('There is no data available for the given key');
        }
      } else {
        throw new Error('Please provide valid key to fetch data');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async saveAssemblerData(key: string, data: any) {
    try {
      if (key && data) {
        const versions = await this.getAssemblerVersion(key);
        if (Array.isArray(versions) && versions.length) {
          //get versions array and check which version is maximum version and add one with that
          const newVersion =
            Math.max(...versions.map((item) => parseInt(item.slice(1)))) + 1;
          return await this.redisService.setJsonData(
            `${key}:v${newVersion}`,
            JSON.stringify(data),
          );
        } else {
          return await this.redisService.setJsonData(
            `${key}:v1`,
            JSON.stringify(data),
          );
        }
      } else {
        throw new Error('Either key or data not provided');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateAssemblerData(key: string, data: any) {
    try {
      if (key && data) {
        return await this.redisService.setJsonData(key, JSON.stringify(data));
      } else {
        throw new Error('Either key or data not provided correctly');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async checkTenantInTenantJson(tenant: string) {
    try {
      const responseFromRedis =
        await this.redisService.getJsonData('tenantJson');
      if (responseFromRedis) {
        const tenantLevelData = JSON.parse(responseFromRedis);
        if (
          tenantLevelData.hasOwnProperty('TENANT') &&
          Array.isArray(tenantLevelData['TENANT'])
        ) {
          const tenantIndex = tenantLevelData['TENANT'].findIndex(
            (ele) => ele.code == tenant,
          );

          if (tenantIndex != -1) {
            return true;
          } else {
            return false;
          }
        }
      } else {
        throw new Error('There is a change in key for tenant level control');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async createTenantIfnotAvailable(tenant: string) {
    try {
      const isExistForVPT = await this.redisService.getJsonData(tenant);
      if (!isExistForVPT) {
        await this.redisService.setJsonData(
          tenant,
          JSON.stringify({ [tenant]: {} }),
        );
      }
      const isExistInTenantJson = await this.checkTenantInTenantJson(tenant);
      if (isExistInTenantJson) {
        return 'tenant already present in Tenant json';
      } else {
        return await this.createTenant({
          Tenant: {
            Code: tenant,
            Name: '',
            Logo: '',
            AG: [],
          },
        });
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getORPGroupData(tenant: string, group: group) {
    try {
      const responseFromRedis = await this.redisService.getJsonData(
        `${tenant}:profile`,
      );
      if (responseFromRedis) {
        const tenantProfileInfo = JSON.parse(responseFromRedis);

        switch (group) {
          case 'role':
            return tenantProfileInfo.roleGrp;
          case 'org':
            return tenantProfileInfo.orgGrp;
          case 'ps':
            return tenantProfileInfo.psGrp;
          case 'all':
            return {
              roleGrp: tenantProfileInfo.roleGrp,
              orgGrp: tenantProfileInfo.orgGrp,
              psGrp: tenantProfileInfo.psGrp,
            };
          default:
            throw new Error(
              'Provided group detail is unrecognised , please check correct group detail ',
            );
        }
      } else {
        throw new Error(
          'No Details available for the tenant please setup Tenant group data',
        );
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateTokenWithORP(token: string, ORPData: any) {
    try {
      const payload = await this.jwtService.decode(token, { json: true });
      const updatedPayload = { ...payload, ...ORPData };
      return this.jwtService.signAsync(updatedPayload, {
        secret: 'cnkdnkddkdmkd',
      });
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getSFArtifacts(key: string) {
    try {
      if(key){
        const allkeys = await this.redisService.getKeys(`${key}:SF`)
        if (Array.isArray(allkeys) && allkeys.length) {
          const data: string[] = allkeys.map((item: string) => {
            return item.split(key)[1].split(':')[2];
          });
          return [...new Set(data)];
        }else{
          return []
        }
      }else{
        throw new Error('key not provided');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getSFVersion(key: string , artifacts: string) {
    try {
      if(key && artifacts){
        const allkeys = await this.redisService.getKeys(`${key}:SF:${artifacts}`)
        if (Array.isArray(allkeys) && allkeys.length) {
          const data: string[] = allkeys.map((item: string) => {
            return item.split(key)[1].split(':')[3];
          });
          return [...new Set(data)];
        }else{
          return []
        }
      }else{
        throw new Error('Either key or artifacts not provided');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getSFData(key: string, artifacts: string, version: string) {
    try {
      if(key&&artifacts&&version){
        const data = await this.redisService.getJsonData(`${key}:SF:${artifacts}:${version}:summary`)
        if(data){
          return JSON.parse(data)
        }else{
          throw new Error('Data not found');
        }
      } else{
        throw new Error('Either key or artifacts or version not provided');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async postSFData(key: string, artifacts: string, version: string, data: any) {
    try {
      if(key&&artifacts&&version&&data){
        return await this.redisService.setJsonData(`${key}:SF:${artifacts}:${version}:summary`,JSON.stringify(data))
      } else{
        throw new Error('Either key or artifacts or version not provided');
      }
    } catch (error) {
      throw new CustomException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
