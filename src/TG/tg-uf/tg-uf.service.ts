import { HttpStatus, Injectable } from '@nestjs/common';
import * as path from 'path';
import { TG_CommonService } from '../tg-common/tg-common.service';
import { RedisService } from 'src/redisService';
import { CommonService } from 'src/commonService';
import { errorObj } from '../Interfaces/errorObj.interface';
import { sessionInfo } from '../Interfaces/sessionInfo.tgCommon.interface';

@Injectable()
export class TgUfService {
  /**
   * The CgTorusComponentsService class is used to generate a Next application for UF components
   * with the updated security JSON.
   * Initializes a new instance of the class.
   *
   * @param {TG_CommonService} CommonService - The common service.
   * @param {RedisService} redisService - The Redis service.
   */
  constructor(
    private readonly TGCommonService: TG_CommonService,
    private readonly redisService: RedisService,
    private readonly commonService: CommonService,
  ) {}

  /**
   * Generates API files and folders based on the provided key.
   *
   * @param {string} key - The key used for API generation
   * @return {Promise<any>} A promise that resolves to 'OK' when API generation is complete
   */

  async generateStaticFiles(
    keys: any,
    screenNames: string[],
    token,
  ): Promise<any> {
    let aKey: string = keys.aKey;
    let sfKey: string = keys.sfKey;
    let ufKey: string = keys.ufKey;
    let keyParts: string[] = aKey.split(':');
    let tenantName: string =keyParts[0];
    let appGroupName: string = keyParts[1];
    let appName: string = keyParts[2];
    let version: string = keyParts[4];
    let sessionInfo: sessionInfo = {
      key: ufKey,
      token: token,
    };
    let eventKey: string = keys.eventKey;

    if (!ufKey && ufKey === '') {
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'UF',
        errType: 'Fatal',
        errCode: 'TG006',
      };
      const errorMessage = 'UF Key not found';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        ufKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }else if(!sfKey || sfKey === ''){
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'UF',
        errType: 'Fatal',
        errCode: 'TG010',
      };
      const errorMessage = 'SF Key not found';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        ufKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }else if(!eventKey || eventKey === ''){
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'UF',
        errType: 'Fatal',
        errCode: 'TG008',
      };
      const errorMessage = 'Event Key not found';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        ufKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }
    //create a app inside the created path given below
    //this path is dynamically created based on the provided key

    let tenantPath: string = path.dirname(
      path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))),
    );

    let tenantPathName: string = path.join(tenantPath, tenantName);
    let appGroupPathName: string = path.join(tenantPathName, appGroupName);
    let app_name: string = path.join(appGroupPathName, appName, 'UF', version);
    // console.log(app_name);

    await this.TGCommonService.createFolder(tenantPathName);
    await this.TGCommonService.createFolder(appGroupPathName);
    await this.TGCommonService.createFolder(app_name);
    await this.TGCommonService.createFolder(app_name + '/app');
    await this.TGCommonService.createFolder(app_name + '/app' + '/components');
    await this.TGCommonService.createFolder(
      app_name + '/app' + '/torusComponents',
    );
    await this.TGCommonService.createFolder(app_name + '/app' + '/assets');
    await this.TGCommonService.createFolder(app_name + '/app' + '/register');
    await this.TGCommonService.createFolder(
      app_name + '/app' + '/resetPassword',
    );
    await this.TGCommonService.createFolder(
      app_name + '/app' + '/torusStaticHandlers',
    );
    await this.TGCommonService.createFolder(
      app_name + '/app' + '/tenantProfile',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/infoMsg.ejs',
      app_name + '/app' + '/torusStaticHandlers' + '/infoMsgHandler.tsx',
    );

    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/assets/favicon.ico',
      app_name + '/app' + '/assets' + '/favicon.ico',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/assets/github.png',
      app_name + '/app' + '/assets' + '/github.png',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/assets/google.png',
      app_name + '/app' + '/assets' + '/google.png',
    );

    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/tsconfig.ejs',
      app_name + '/tsconfig.json',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/tailwind.config.ejs',
      app_name + '/tailwind.config.ts',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/README.ejs',
      app_name + '/README.md',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/postcss.config.ejs',
      app_name + '/postcss.config.js',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/package.ejs',
      app_name + '/package.json',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/package-lock.ejs',
      app_name + '/package-lock.json',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/next.config.ejs',
      app_name + '/next.config.js',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/next-env.d.ejs',
      app_name + '/next-env.d.ts',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/.prettierrc.ejs',
      app_name + '/.prettierrc',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/.npmrc.ejs',
      app_name + '/.npmrc',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/gitignore.ejs',
      app_name + '/.gitignore',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/.eslintrc.json.ejs',
      app_name + '/.eslintrc.json',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/.env.local.ejs',
      app_name + '/.env.local',
    );

    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/global.css.ejs',
      app_name + '/app' + '/globals.css',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/registerPage.ejs',
      app_name + '/app' + '/register' + '/page.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/forgotPasswordPage.ejs',
      app_name + '/app' + '/resetPassword' + '/page.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/tenantProfile.ejs',
      app_name + '/app' + '/tenantProfile' + '/page.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/forgotPassword.ejs',
      app_name + '/app' + '/components' + '/forgotPassword.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/register.ejs',
      app_name + '/app' + '/components' + '/register.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/providers.ejs',
      app_name + '/app' + '/components' + '/providers.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/appSelector.ejs',
      app_name + '/app' + '/components' + '/appSelector.tsx',
    );
       await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/cookieMgment.ejs',
      app_name + '/app' + '/components' + '/cookieMgment.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/serverFunctions.ejs',
      app_name + '/app' + '/torusComponents' + '/serverFunctions.tsx',
    );

    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/IconsHead.ejs',
      app_name + '/app' + '/components' + '/IconsHead.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/logo.ejs',
      app_name + '/app' + '/components' + '/Logo.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/themeSwitcher.ejs',
      app_name + '/app' + '/components' + '/ThemeSwitcher.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/sideNav.ejs',
      app_name + '/app' + '/components' + '/sideNav.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/buttonComponent.ejs',
      app_name + '/app' + '/components' + '/button.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/inputComponent.ejs',
      app_name + '/app' + '/components' + '/input.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/navBarComponent.ejs',
      app_name + '/app' + '/components' + '/navBar.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/radioGroupComponent.ejs',
      app_name + '/app' + '/components' + '/radioGroup.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/textareaComponent.ejs',
      app_name + '/app' + '/components' + '/textarea.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/timeInputComponent.ejs',
      app_name + '/app' + '/components' + '/timeInput.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/dateInputComponent.ejs',
      app_name + '/app' + '/components' + '/dateInput.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/layout.ejs',
      app_name + '/app' + '/layout.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/mainPage.ejs',
      app_name + '/app' + '/page.tsx',
    );
    await this.TGCommonService.copyFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/static/logout.ejs',
      app_name + '/app' + '/components' + '/logout.tsx',
    );
    await this.TGCommonService.CreateSchemaFile(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/dynamic/login.ejs',
      screenNames,
      '',
      app_name + '/app' + '/components' + '/login.tsx',
    );
    await this.TGCommonService.CreateFileWithThreeParam(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/dynamic/appList.ejs',
      '',
      screenNames,
      sfKey + '-' + ufKey,
      '',
      app_name + '/app' + '/components' + '/appList.tsx',
    );
  }

  async generateScreenSpecificFiles(keys, token) {
    let aKey: string = keys.aKey;
    let ufKey: string = keys.ufKey;
    let pfKey: string = keys.pfKey;
    let eventKey: string = keys.eventKey;
    let sfKey: string = keys.sfKey;
    let ufKeyParts: string[] =ufKey.split(':');
    let screenName: string = ufKeyParts[4];
    let keyParts: string[] =aKey.split(':');
    let tenantName: string = keyParts[0];
    let appGroupName: string = keyParts[1];
    let appName: string = keyParts[2];
    let version: string = keyParts[4];
    let sessionInfo: sessionInfo = {
      key: keys.ufKey,
      token: token,
    };
    if (!ufKey && ufKey === '') {
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'UF',
        errType: 'Fatal',
        errCode: 'TG006',
      };
      const errorMessage = 'UF Key not found';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        ufKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }else if(!sfKey || sfKey === ''){
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'UF',
        errType: 'Fatal',
        errCode: 'TG010',
      };
      const errorMessage = 'SF Key not found';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        ufKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }else if(!eventKey || eventKey === ''){
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'UF',
        errType: 'Fatal',
        errCode: 'TG008',
      };
      const errorMessage = 'Event Key not found';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        ufKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }
    const nodeProperties: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(ufKey + ':nodeProperty')),
    );
    const nodes: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(ufKey + ':nodes')),
    );
    const eventProperties: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(eventKey)),
    );
    if((!nodes || nodes === '' )&& (!nodeProperties || nodeProperties === '')){
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'UF',
        errType: 'Fatal',
        errCode: 'TG007',
      };
      const errorMessage: string = 'Invalid UF key';
      const statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj: any = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        ufKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }else if(!nodes || nodes === ''){
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'UF',
        errType: 'Fatal',
        errCode: 'TG015',
      };
      const errorMessage: string = 'Node json not found';
      const statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj: any = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        ufKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
     
    }else if(!nodeProperties || nodeProperties === ''){
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'UF',
        errType: 'Fatal',
        errCode: 'TG016',
      };
      const errorMessage: string = 'NodeProperty json not found';
      const statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj: any = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        ufKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }else if(!eventProperties || eventProperties === ''){
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'UF',
        errType: 'Fatal',
        errCode: 'TG009',
      };
      const errorMessage = 'Invalid Event Key';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        ufKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }

    let nodePropertiesKeys = Object.keys(nodeProperties)
    if(nodes.length != nodePropertiesKeys.length){
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'UF',
        errType: 'Fatal',
        errCode: 'TG014',
      };
      const errorMessage = 'Mismatch counts in  Nodes and nodeproperties';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        ufKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }
    
    const tenantPath: string = path.dirname(
      path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))),
    );
    const tenantPathName: string = path.join(tenantPath, tenantName);

    const appGroupPathName: string = path.join(tenantPathName, appGroupName);
    const app_name: string = path.join(
      appGroupPathName,
      appName,
      'UF',
      version,
    );
    const screenHeight: number = nodes[0].viewport.screenHeight;
    const screenWidth: number = nodes[0].viewport.screenWidth;
    const layoutGroupId: string[] = [];
    const pageGroupId: string[] = [];
    const componentsId: string[] = [];
    const groupComponentsId: string[] = [];
    const compDetails: any[] = [];
    const navbarData: any = keys.navbarData;
    interface compObj {
      componentsId: string;
      controls: number[];
      layoutFlag: string;
      position: any;
      position1: any;
      height: number;
      width: number;
    }
    const eventDetailsArray: any[] = [];
    let eventDetailsObj: any = {};
    function addEventDetailsArray(data) {
      if (data.length > 0) {
        data.forEach((item) => {
          eventDetailsArray.push({
            id: item.id,
            name: item.name,
            type: item.type,
            sequence: item.sequence,
          });
          if (item.children.length > 0) {
            addEventDetailsArray(item.children);
          }
        });
      }
    }
    function addeventDetailsObj(data) {
      if (data.length > 0) {
        data.forEach((item) => {
          eventDetailsObj = {
            ...eventDetailsObj,
            [`${item.id}`]: {
              id: item.id,
              name: item.name,
              type: item.type,
              sequence: item.sequence,
            },
          };
          if (item.children.length > 0) {
            addeventDetailsObj(item.children);
          }
        });
      }
    }
    if (eventProperties !== null) {
      addEventDetailsArray([{ ...eventProperties }]);
      addeventDetailsObj([{ ...eventProperties }]);
    }

    if (nodes.length > 0) {
      for (let i = 0; i < nodes.length; i++) {
        componentsId.push(nodes[i].id);
        if (nodes[i].id === nodes[i].T_parentId && nodes[i].type === 'group') {
          groupComponentsId.push(nodes[i].id);
        }
      }
    } 

    if (groupComponentsId.length > 0) {
      for (let i = 0; i < groupComponentsId.length; i++) {
        const compDetail: compObj = {
          componentsId: '',
          controls: [],
          layoutFlag: '',
          position: {
            x: 0,
            y: 0,
          },
          position1: {
            x: 0,
            y: 0,
          },
          height: 0,
          width: 0,
        };
        if (nodes.length > 0) {
          for (let j = 0; j < nodes.length; j++) {
            if (nodes[j].T_parentId.includes(groupComponentsId[i])) {
              compDetail.componentsId = nodes[j].T_parentId;
              for (let k = 0; k < nodes.length; k++) {
                if (nodes[j].T_parentId === nodes[k].id) {
                  compDetail.layoutFlag = nodes[k].layoutFlag;
                  compDetail.position.x = nodes[k].position.x;
                  compDetail.position.y = nodes[k].position.y;
                  compDetail.position1.x = Math.round(
                    (nodes[k].positionAbsolute.x / screenWidth) * 100,
                  );
                  compDetail.position1.y = Math.round(
                    (nodes[k].positionAbsolute.y / screenHeight) * 100,
                  );
                  compDetail.height = (nodes[k].height / screenHeight) * 100;
                  compDetail.width = (nodes[k].width / screenWidth) * 100;
                }
              }
              if (nodes[j].T_parentId !== nodes[j].id) {
                compDetail.controls.push(nodes[j].id);
              }
            }
          }
        }
        compDetails.push(compDetail);
      }
    }

    if (compDetails.length > 0) {
      for (let i = 0; i < compDetails.length; i++) {
        if (compDetails[i].layoutFlag === 'no') {
          pageGroupId.push(compDetails[i].componentsId);
        } else {
          layoutGroupId.push(compDetails[i].componentsId);
        }
      }
    }

    /*--------------------- Create files for specific screen   ----------------------------------*/

    await this.TGCommonService.createFolder(
      app_name + '/app' + '/' + screenName,
    );

    await this.TGCommonService.CreateFileWithThreeParam(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/dynamic/compPage.ejs',
      pageGroupId,
      nodeProperties,
      screenName,
      [pfKey, sfKey],
      app_name + '/app' + '/' + screenName + '/page.tsx',
    );
    await this.TGCommonService.CreateFileWithThreeParam(
      sessionInfo,
      './src/TG/tg-AppTemplate/tg-uf/dynamic/compLayout.ejs',
      layoutGroupId,
      nodeProperties,
      '',
      '',
      app_name + '/app' + '/' + screenName + '/layout.tsx',
    );
    // console.log('compDetails', compDetails);

    /*--------------------- Create files for Torus Components   ----------------------------------*/
    if (compDetails.length > 0) {
      for (let i = 0; i < compDetails.length; i++) {
        // console.log(nodeProperties[compDetails[i].componentsId].nodeName);

        // return compDetails[i]
        await this.TGCommonService.createFolder(
          app_name +
            '/app' +
            '/' +
            screenName +
            '/' +
            'Group' +
            nodeProperties[compDetails[i].componentsId].nodeName,
        );
        await this.TGCommonService.CreateFileWithThreeParam(
          sessionInfo,
          './src/TG/tg-AppTemplate/tg-uf/dynamic/groupComponent.ejs',
          compDetails[i],
          nodeProperties,
          nodeProperties[compDetails[i].componentsId].nodeName,
          pfKey,
          app_name +
            '/app' +
            '/' +
            screenName +
            '/' +
            'Group' +
            nodeProperties[compDetails[i].componentsId].nodeName +
            '/' +
            'Group' +
            nodeProperties[compDetails[i].componentsId].nodeName +
            '.tsx',
        );

        if (nodes.length > 0) {
          for (let j = 0; j < nodes.length; j++) {
            if (nodes[j].T_parentId === compDetails[i].componentsId) {
              if (
                nodeProperties[nodes[j].id].elementInfo.component === 'TButton'
              ) {
                for (let k = 0; k < nodes.length; k++) {
                  if (nodes[j].T_parentId === nodes[k].id) {
                    let parentNodes: any = {
                      nodes: nodes[k],
                      nodeProperties: nodeProperties[nodes[k].id],
                    };

                    await this.TGCommonService.CreateFileWithThreeParam(
                      sessionInfo,
                      './src/TG/tg-AppTemplate/tg-uf/dynamic/button.ejs',
                      nodeProperties[componentsId[j]].elementInfo,
                      nodes[j],
                      [
                        tenantName +
                          ':' +
                          appGroupName +
                          ':' +
                          appName +
                          ':' +
                          'UF' +
                          ':' +
                          screenName +
                          ':' +
                          version,
                        pfKey,
                        eventDetailsArray,
                        eventDetailsObj,
                        sfKey,
                      ],
                      parentNodes,
                      app_name +
                        '/app' +
                        '/' +
                        screenName +
                        '/' +
                        'Group' +
                        nodeProperties[compDetails[i].componentsId].nodeName +
                        '/Button' +
                        nodeProperties[componentsId[j]].elementInfo.label +
                        '.tsx',
                    );
                  }
                }
              }
              if (
                nodeProperties[nodes[j].id].elementInfo.component === 'Input'
              ) {
                for (let k = 0; k < nodes.length; k++) {
                  if (nodes[j].T_parentId === nodes[k].id) {
                    await this.TGCommonService.CreateFileWithThreeParam(
                      sessionInfo,
                      './src/TG/tg-AppTemplate/tg-uf/dynamic/input.ejs',
                      nodeProperties[componentsId[j]].elementInfo,
                      nodes[j],
                      '',
                      nodes[k],
                      app_name +
                        '/app' +
                        '/' +
                        screenName +
                        '/' +
                        'Group' +
                        nodeProperties[compDetails[i].componentsId].nodeName +
                        '/Input' +
                        nodeProperties[componentsId[j]].elementInfo.label +
                        '.tsx',
                    );
                  }
                }
              }
              if (
                nodeProperties[nodes[j].id].elementInfo.component === 'NavBar'
              ) {
                for (let k = 0; k < nodes.length; k++) {
                  if (nodes[j].T_parentId === nodes[k].id) {
                    await this.TGCommonService.CreateFileWithThreeParam(
                      sessionInfo,
                      './src/TG/tg-AppTemplate/tg-uf/dynamic/navBar.ejs',
                      nodeProperties[componentsId[j]].elementInfo,
                      nodes[j],
                      navbarData,
                      nodes[k],
                      app_name +
                        '/app' +
                        '/' +
                        screenName +
                        '/' +
                        'Group' +
                        nodeProperties[compDetails[i].componentsId].nodeName +
                        '/NavBar' +
                        nodeProperties[componentsId[j]].elementInfo.label +
                        '.tsx',
                    );
                  }
                }
              }
              if (
                nodeProperties[nodes[j].id].elementInfo.component ===
                'RadioGroup'
              ) {
                for (let k = 0; k < nodes.length; k++) {
                  if (nodes[j].T_parentId === nodes[k].id) {
                    await this.TGCommonService.CreateFileWithThreeParam(
                      sessionInfo,
                      './src/TG/tg-AppTemplate/tg-uf/dynamic/radioGroup.ejs',
                      nodeProperties[componentsId[j]].elementInfo,
                      nodes[j],
                      '',
                      nodes[k],
                      app_name +
                        '/app' +
                        '/' +
                        screenName +
                        '/' +
                        'Group' +
                        nodeProperties[compDetails[i].componentsId].nodeName +
                        '/RadioGroup' +
                        nodeProperties[componentsId[j]].elementInfo.label +
                        '.tsx',
                    );
                  }
                }
              }
              if (
                nodeProperties[nodes[j].id].elementInfo.component === 'Textarea'
              ) {
                for (let k = 0; k < nodes.length; k++) {
                  if (nodes[j].T_parentId === nodes[k].id) {
                    await this.TGCommonService.CreateFileWithThreeParam(
                      sessionInfo,
                      './src/TG/tg-AppTemplate/tg-uf/dynamic/textarea.ejs',
                      nodeProperties[componentsId[j]].elementInfo,
                      nodes[j],
                      '',
                      nodes[k],
                      app_name +
                        '/app' +
                        '/' +
                        screenName +
                        '/' +
                        'Group' +
                        nodeProperties[compDetails[i].componentsId].nodeName +
                        '/Textarea' +
                        nodeProperties[componentsId[j]].elementInfo.label +
                        '.tsx',
                    );
                  }
                }
              }
              if (
                nodeProperties[nodes[j].id].elementInfo.component ===
                'TimeInput'
              ) {
                for (let k = 0; k < nodes.length; k++) {
                  if (nodes[j].T_parentId === nodes[k].id) {
                    await this.TGCommonService.CreateFileWithThreeParam(
                      sessionInfo,
                      './src/TG/tg-AppTemplate/tg-uf/dynamic/timeInput.ejs',
                      nodeProperties[componentsId[j]].elementInfo,
                      nodes[j],
                      '',
                      nodes[k],
                      app_name +
                        '/app' +
                        '/' +
                        screenName +
                        '/' +
                        'Group' +
                        nodeProperties[compDetails[i].componentsId].nodeName +
                        '/TimeInput' +
                        nodeProperties[componentsId[j]].elementInfo.label +
                        '.tsx',
                    );
                  }
                }
              }
              if (
                nodeProperties[nodes[j].id].elementInfo.component ===
                'DateInput'
              ) {
                for (let k = 0; k < nodes.length; k++) {
                  if (nodes[j].T_parentId === nodes[k].id) {
                    await this.TGCommonService.CreateFileWithThreeParam(
                      sessionInfo,
                      './src/TG/tg-AppTemplate/tg-uf/dynamic/dateInput.ejs',
                      nodeProperties[componentsId[j]].elementInfo,
                      nodes[j],
                      '',
                      nodes[k],
                      app_name +
                        '/app' +
                        '/' +
                        screenName +
                        '/' +
                        'Group' +
                        nodeProperties[compDetails[i].componentsId].nodeName +
                        '/DateInput' +
                        nodeProperties[componentsId[j]].elementInfo.label +
                        '.tsx',
                    );
                  }
                }
              }
              if (
                nodeProperties[nodes[j].id].elementInfo.component ===
                'Dropdown'
              ) {
                for (let k = 0; k < nodes.length; k++) {
                  if (nodes[j].T_parentId === nodes[k].id) {
                    await this.TGCommonService.CreateFileWithThreeParam(
                      sessionInfo,
                      './src/TG/tg-AppTemplate/tg-uf/dynamic/dropdown.ejs',
                      nodeProperties[componentsId[j]].elementInfo,
                      nodes[j],
                      '',
                      nodes[k],
                      app_name +
                        '/app' +
                        '/' +
                        screenName +
                        '/' +
                        'Group' +
                        nodeProperties[compDetails[i].componentsId].nodeName +
                        '/Dropdown' +
                        nodeProperties[componentsId[j]].elementInfo.label +
                        '.tsx',
                    );
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
