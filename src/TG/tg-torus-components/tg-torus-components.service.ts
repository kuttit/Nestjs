import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { TG_CommonService } from '../tg-common/tg-common.service';
import { RedisService } from 'src/redisService';

@Injectable()
export class TgTorusComponentsService {
  /**
   * The CgTorusComponentsService class is used to generate a Next application for UF components
   * with the updated security JSON.
   * Initializes a new instance of the class.
   *
   * @param {TG_CommonService} CommonService - The common service.
   * @param {RedisService} redisService - The Redis service.
   */
  constructor(
    private readonly CommonService: TG_CommonService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Generates API files and folders based on the provided key.
   *
   * @param {string} key - The key used for API generation
   * @return {Promise<any>} A promise that resolves to 'OK' when API generation is complete
   */

  async generateStaticFiles(keys:any,screenNames:string[]): Promise<any> {
    const aKey: string = keys.aKey;
    const sfKey: string = keys.sfKey;
    const ufKey: string = keys.ufKey;
    const keyParts: string[] = aKey.split(':');
    const tenantName: string = keyParts[0];
    const appGroupName: string = keyParts[1];
    const appName: string = keyParts[2];
    const version: string = keyParts[4];
    //create a app inside the created path given below
    //this path is dynamically created based on the provided key

    let tenantPath: string = path.dirname(
      path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))),
    );

    let tenantPathName: string = path.join(tenantPath, tenantName);
    let appGroupPathName: string = path.join(tenantPathName, appGroupName);
    let app_name: string = path.join(appGroupPathName, appName,'UF',version);
    console.log(app_name);
    

    await this.CommonService.createFolder(tenantPathName);
    await this.CommonService.createFolder(appGroupPathName);
    await this.CommonService.createFolder(app_name);
    await this.CommonService.createFolder(app_name + '/app');
    await this.CommonService.createFolder(app_name + '/app' + '/components');
    await this.CommonService.createFolder(app_name + '/app' + '/torusComponents');
    await this.CommonService.createFolder(app_name + '/app' + '/assets');
    await this.CommonService.createFolder(app_name + '/app' + '/register');
    await this.CommonService.createFolder(app_name + '/app' + '/resetPassword');
    await this.CommonService.createFolder(app_name + '/app' + '/torusStaticHandlers');
    await this.CommonService.createFolder(app_name + '/app' + '/tenantProfile');
    await this.CommonService.copyFile('./src/TG/tg-AppTemplate/tg-torus-components/infoMsg.ejs',app_name + '/app' + '/torusStaticHandlers'+ '/infoMsgHandler.tsx');

    await this.CommonService.copyFile('./src/TG/tg-AppTemplate/tg-torus-components/assets/favicon.ico',app_name + '/app' + '/assets' + '/favicon.ico');
    await this.CommonService.copyFile('./src/TG/tg-AppTemplate/tg-torus-components/assets/github.png',app_name + '/app' + '/assets' + '/github.png');
    await this.CommonService.copyFile('./src/TG/tg-AppTemplate/tg-torus-components/assets/google.png',app_name + '/app' + '/assets' + '/google.png');


    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/tsconfig.ejs',
      '',
      app_name + '/tsconfig.json',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/tailwind.config.ejs',
      '',
      app_name + '/tailwind.config.ts',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/README.ejs',
      '',
      app_name + '/README.md',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/postcss.config.ejs',
      '',
      app_name + '/postcss.config.js',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/package.ejs',
      '',
      '',
      app_name + '/package.json',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/package-lock.ejs',
      '',
      '',
      app_name + '/package-lock.json',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/next.config.ejs',
      '',
      app_name + '/next.config.js',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/next-env.d.ejs',
      '',
      app_name + '/next-env.d.ts',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/.prettierrc.ejs',
      '',
      app_name + '/.prettierrc',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/.npmrc.ejs',
      '',
      app_name + '/.npmrc',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/gitignore.ejs',
      '',
      app_name + '/.gitignore',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/.eslintrc.json.ejs',
      '',
      app_name + '/.eslintrc.json',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/.env.local.ejs',
      '',
      app_name + '/.env.local',
    );

    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/global.css.ejs',
      '',
      app_name + '/app' + '/globals.css',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/registerPage.ejs',
      '',
      '',
      app_name + '/app' + '/register' + '/page.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/forgotPasswordPage.ejs',
      '',
      '',
      app_name + '/app' + '/resetPassword' + '/page.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/tenantProfile.ejs',
      '',
      '',
      app_name + '/app' + '/tenantProfile' + '/page.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/tenantProfileLayout.ejs',
      '',
      '',
      app_name + '/app' + '/tenantProfile' + '/layout.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/forgotPassword.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/forgotPassword.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/register.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/register.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/providers.ejs',
      '',
      '',
      app_name + '/app' + '/components' +  '/providers.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/appSelector.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/appSelector.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/serverFunctions.ejs',
      '',
      '',
      app_name + '/app' + '/torusComponents' +  '/serverFunctions.tsx',
    );

    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/IconsHead.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/IconsHead.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/logo.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/Logo.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/themeSwitcher.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/ThemeSwitcher.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/sideNav.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/sideNav.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/buttonComponent.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/button.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/inputComponent.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/input.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/navBarComponent.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/navBar.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/radioGroupComponent.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/radioGroup.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/textareaComponent.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/textarea.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/timeInputComponent.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/timeInput.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/dateInputComponent.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/dateInput.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/layout.ejs',
      '',
      '',
      app_name + '/app' + '/layout.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/mainPage.ejs',
      '',
      '',
      app_name + '/app' + '/page.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/logout.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/logout.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/login.ejs',
      screenNames,
      '',
      app_name + '/app' + '/components' + '/login.tsx',
    );
    await this.CommonService.CreateFileWithThreeParam(
      './src/TG/tg-AppTemplate/tg-torus-components/appList.ejs',
      '',
      screenNames,
      sfKey+'-'+ufKey,
      '',
      app_name + '/app' + '/components' + '/appList.tsx',
    );
    
  }

  async prepareDataForDynamicFiles(keys:any ) {

    console.log(keys);
    const ufkey:string = keys.ufkey;
    const eventKey:string = keys.eventKey;
    const ufKeyParts: string[] = ufkey.split(':');
    const screenName:string = ufKeyParts[4];
    
    const nodes: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(ufkey + ':nodes')),
    );
    const nodeProperties: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(ufkey + ':nodeProperty')),
    );
    const eventProperties: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(eventKey)),
    );
  }

  async generateScreenSpecificFiles(keys){
    const aKey:string = keys.aKey;
    const ufKey:string = keys.ufKey;
    const pfKey:string = keys.pfKey;
    const eventKey:string = keys.eventKey;
    const sfKey:string = keys.sfKey;
    const ufKeyParts: string[] = ufKey.split(':');
    const screenName:string = ufKeyParts[4];
    const keyParts: string[] = aKey.split(':');
    const tenantName: string = keyParts[0];
    const appGroupName: string = keyParts[1];
    const appName: string = keyParts[2];
    const version: string = keyParts[4];
    const nodeProperties: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(ufKey + ':nodeProperty')),
    );
    const nodes: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(ufKey + ':nodes')),
    );
    const eventProperties: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(eventKey)),
    );
    const tenantPath: string = path.dirname(
      path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))),
    );
    const tenantPathName: string = path.join(tenantPath, tenantName);
    const appGroupPathName: string = path.join(tenantPathName, appGroupName);
    const app_name: string = path.join(appGroupPathName, appName,'UF',version);
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
    function addeventDetailsObj(data) {
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
    if(eventProperties!==null){
      addEventDetailsArray([{ ...eventProperties }]);
    addeventDetailsObj([{ ...eventProperties }]);
    }

    for (let i = 0; i < nodes.length; i++) {
      componentsId.push(nodes[i].id);
      if (nodes[i].id === nodes[i].T_parentId && nodes[i].type === 'group') {
        groupComponentsId.push(nodes[i].id);
      }
    }

    for (let i = 0; i < groupComponentsId.length; i++) {
      const compDetail: compObj = {
        componentsId: '',
        controls: [],
        layoutFlag: '',
        position:{
          x: 0,
          y: 0  
        },
        position1: {
          x: 0,
          y: 0
        },
        height: 0,
        width: 0,
      };
      for (let j = 0; j < nodes.length; j++) {
        if (nodes[j].T_parentId.includes(groupComponentsId[i])) {
          compDetail.componentsId = nodes[j].T_parentId;
          for (let k = 0; k < nodes.length; k++) {
            if (nodes[j].T_parentId === nodes[k].id) {
              compDetail.layoutFlag = nodes[k].layoutFlag;
              compDetail.position.x = nodes[k].position.x;
              compDetail.position.y = nodes[k].position.y;
              compDetail.position1.x = Math.round((nodes[k].positionAbsolute.x/screenWidth)*100);
              compDetail.position1.y = Math.round((nodes[k].positionAbsolute.y/screenHeight)*100);
              compDetail.height = nodes[k].height/screenHeight*100;
              compDetail.width = nodes[k].width/screenWidth*100;
              
            }
          }
          if (nodes[j].T_parentId !== nodes[j].id) {
            compDetail.controls.push(nodes[j].id);
          }
        }
      }
      compDetails.push(compDetail);
    }

    for (let i = 0; i < compDetails.length; i++) {
      if (compDetails[i].layoutFlag === 'no') {
        pageGroupId.push(compDetails[i].componentsId);
      }else  {
      layoutGroupId.push(compDetails[i].componentsId);
      }
    }

/*--------------------- Create files for specific screen   ----------------------------------*/

    await this.CommonService.createFolder(app_name + '/app' + '/' + screenName);

    await this.CommonService.CreateFileWithThreeParam(
      './src/TG/tg-AppTemplate/tg-torus-components/compPage.ejs',
      pageGroupId,
      nodeProperties,
      screenName,
      [pfKey,sfKey],
      app_name + '/app' + '/' + screenName + '/page.tsx',
    );
    await this.CommonService.CreateFileWithThreeParam(
      './src/TG/tg-AppTemplate/tg-torus-components/compLayout.ejs',
      layoutGroupId,
      nodeProperties,
      '',
      '',
      app_name + '/app' + '/' + screenName + '/layout.tsx',
    );
    console.log('compDetails', compDetails);
    

    /*--------------------- Create files for Torus Components   ----------------------------------*/
    for (let i = 0; i < compDetails.length; i++) {
      // console.log(nodeProperties[compDetails[i].componentsId].nodeName);
      
      // return compDetails[i]
      await this.CommonService.createFolder(app_name + '/app' + '/'+ screenName+ '/' + 'Group' +nodeProperties[compDetails[i].componentsId].nodeName);     
      await this.CommonService.CreateFileWithThreeParam(
        './src/TG/tg-AppTemplate/tg-torus-components/groupComponent.ejs',
        compDetails[i],
        nodeProperties,
        nodeProperties[compDetails[i].componentsId].nodeName,
        pfKey,
        app_name + '/app' + '/' + screenName+ '/' + 'Group'+nodeProperties[compDetails[i].componentsId].nodeName+'/'+'Group'+nodeProperties[compDetails[i].componentsId].nodeName+'.tsx',
      ); 
    

    for (let j = 0; j < nodes.length; j++) {
      if (nodes[j].T_parentId === compDetails[i].componentsId) {
        
      
      if (nodeProperties[nodes[j].id].elementInfo.component === 'TButton') {
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
            let parentNodes:any = {
              nodes: nodes[k],
              nodeProperties: nodeProperties[nodes[k].id]
            }
            
            await this.CommonService.CreateFileWithThreeParam(
              './src/TG/tg-AppTemplate/tg-torus-components/button.ejs',
              nodeProperties[componentsId[j]].elementInfo,
              nodes[j],
              [tenantName+':'+appGroupName+':'+appName+':'+'UF'+':'+screenName+':'+version,pfKey,eventDetailsArray,eventDetailsObj,sfKey],
              parentNodes,
              app_name +
                '/app' +
                '/'+ screenName+ '/' + 'Group'+nodeProperties[compDetails[i].componentsId].nodeName +
                '/Button' +
                nodeProperties[componentsId[j]].elementInfo.label +
                '.tsx',
            );
          }
        }
      
      }
      if (nodeProperties[nodes[j].id].elementInfo.component === 'Input') {
        
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-torus-components/input.ejs',
          nodeProperties[componentsId[j]].elementInfo,
          nodes[j],
          '',
          nodes[k],
          app_name +
            '/app' +
            '/'+ screenName+ '/' + 'Group'+nodeProperties[compDetails[i].componentsId].nodeName +
            '/Input' +
            nodeProperties[componentsId[j]].elementInfo.label +
            '.tsx',
        );
      }}
      }
      if (nodeProperties[nodes[j].id].elementInfo.component === 'NavBar') {
       
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-torus-components/navBar.ejs',
          nodeProperties[componentsId[j]].elementInfo,
          nodes[j],
          navbarData,
          nodes[k],
          app_name +
            '/app' +
            '/'+ screenName+ '/' + 'Group'+nodeProperties[compDetails[i].componentsId].nodeName +
            '/NavBar' +
            nodeProperties[componentsId[j]].elementInfo.label +
            '.tsx',
        );
      }}
      }
      if (nodeProperties[nodes[j].id].elementInfo.component === 'RadioGroup') {
        
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-torus-components/radioGroup.ejs',
          nodeProperties[componentsId[j]].elementInfo,
          nodes[j],
          '',
          nodes[k],
          app_name +
            '/app' +
            '/'+ screenName+ '/' + 'Group'+nodeProperties[compDetails[i].componentsId].nodeName +
            '/RadioGroup' +
            nodeProperties[componentsId[j]].elementInfo.label +
            '.tsx',
        );
      }}
      }
      if (nodeProperties[nodes[j].id].elementInfo.component === 'Textarea') {
       
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-torus-components/textarea.ejs',
          nodeProperties[componentsId[j]].elementInfo,
          nodes[j],
          '',
          nodes[k],
          app_name +
            '/app' +
            '/'+ screenName+ '/' + 'Group'+nodeProperties[compDetails[i].componentsId].nodeName +
            '/Textarea' +
            nodeProperties[componentsId[j]].elementInfo.label +
            '.tsx',
        );
      }}
      }
      if (nodeProperties[nodes[j].id].elementInfo.component === 'TimeInput') {
        
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-torus-components/timeInput.ejs',
          nodeProperties[componentsId[j]].elementInfo,
          nodes[j],
          '',
          nodes[k],
          app_name +
            '/app' +
            '/'+ screenName+ '/' + 'Group'+nodeProperties[compDetails[i].componentsId].nodeName +
            '/TimeInput' +
            nodeProperties[componentsId[j]].elementInfo.label +
            '.tsx',
        );
      }}
      }
      if (nodeProperties[nodes[j].id].elementInfo.component === 'DateInput') {        
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-torus-components/dateInput.ejs',
          nodeProperties[componentsId[j]].elementInfo,
          nodes[j],
          '',
          nodes[k],
          app_name +
            '/app' +
            '/'+ screenName+ '/' + 'Group'+nodeProperties[compDetails[i].componentsId].nodeName +
            '/DateInput' +
            nodeProperties[componentsId[j]].elementInfo.label +
            '.tsx',
        );
      }}
      }      
      }
    }
  }

  }

  

  async generateDynamicFiles(){
  }
  async generateApi(ufkey: string, screenDetails: any, ProcessKey?: any,screenNames?:any): Promise<any> {
        
    //seperate the tenentname,appgroupname,appname,version from the provided key
    const keyParts: string[] = ufkey.split(':');
    const tenantName: string = keyParts[0];
    const appGroupName: string = keyParts[1];
    const appName: string = keyParts[2];
    const fabric: string = keyParts[3];
    const artifactName: string = keyParts[4];
    const version: string = keyParts[5];
    console.log(screenNames);
    
    const navbarData = screenDetails.reduce((acc, curr) => {
      const group = acc.find(item => item.menuGroup === curr.menuGroup);
      if (group) {
        group.screenName.push(curr.screenName);
      } else {
        acc.push({
          menuGroup: curr.menuGroup,
          screenName: [curr.screenName+'-'+curr.SF+'-'+curr.UF],
        });
      }
      return acc;
    }, []);
    console.log(navbarData);
    // return navbarData;
    //getting the jsons from provided key
    const screenName: string = artifactName;
    let pfkey: string = '';    
    let sfkey: string = '';
    let eventKey: string = '';
    // console.log(ProcessKey);
    

    if (ProcessKey) {
      pfkey = ProcessKey.pfkey;    
      sfkey = ProcessKey.sfkey;    
     eventKey = ProcessKey.eventKey;
    }
    // console.log(sfkey);
    
    // const screenName: string = await this.CommonService.toPascalCase(screenNameParts[0]+screenNameParts[1])

    const envDetails: any = {};
    envDetails['tenantName'] = tenantName;
    envDetails['appGroupName'] = appGroupName;
    envDetails['appName'] = appName;
    envDetails['screenName'] = screenName;
    envDetails['version'] = version;

    // console.log(envDetails);

    const nodes: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(ufkey + ':nodes')),
    );
    const nodeProperties: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(ufkey + ':nodeProperty')),
    );
    const eventProperties: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(eventKey)),
    );
    // console.log(eventProperties);
    
    
    const componentsId: string[] = [];
    const groupComponentsId: string[] = [];

    interface compObj {
      componentsId: string;
      controls: number[];
      layoutFlag: string;
      position: any;
      position1: any;
      height: number;
      width: number;
    }
    const compDetails: any[] = [];

    //create a app inside the created path given below
    //this path is dynamically created based on the provided key
    for (let i = 0; i < nodes.length; i++) {
      componentsId.push(nodes[i].id);
      if (nodes[i].id === nodes[i].T_parentId && nodes[i].type === 'group') {
        groupComponentsId.push(nodes[i].id);
      }
    }
    let screenHeight: number = nodes[0].viewport.screenHeight;
    let screenWidth: number = nodes[0].viewport.screenWidth;

    for (let i = 0; i < groupComponentsId.length; i++) {
      const compDetail: compObj = {
        componentsId: '',
        controls: [],
        layoutFlag: '',
        position:{
          x: 0,
          y: 0  
        },
        position1: {
          x: 0,
          y: 0
        },
        height: 0,
        width: 0,
      };
      for (let j = 0; j < nodes.length; j++) {
        if (nodes[j].T_parentId.includes(groupComponentsId[i])) {
          compDetail.componentsId = nodes[j].T_parentId;
          for (let k = 0; k < nodes.length; k++) {
            if (nodes[j].T_parentId === nodes[k].id) {
              compDetail.layoutFlag = nodes[k].layoutFlag;
              compDetail.position.x = nodes[k].position.x;
              compDetail.position.y = nodes[k].position.y;
              compDetail.position1.x = Math.round((nodes[k].positionAbsolute.x/screenWidth)*100);
              compDetail.position1.y = Math.round((nodes[k].positionAbsolute.y/screenHeight)*100);
              compDetail.height = nodes[k].height/screenHeight*100;
              compDetail.width = nodes[k].width/screenWidth*100;
            }
          }
          if (nodes[j].T_parentId !== nodes[j].id) {
            compDetail.controls.push(nodes[j].id);
          }
        }
      }
      compDetails.push(compDetail);
    }
    
    /*-------------------------------Prepare event related Datas ------------------------------*/

    const eventDetailsArray: any[] = [];    
    let eventDetailsObj: any = {};
    if(eventProperties!==null){
    function addEventDetailsArray(data) {
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
    function addeventDetailsObj(data) {
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
    addEventDetailsArray([{ ...eventProperties }]);
    addeventDetailsObj([{ ...eventProperties }]);
  }
    
    // console.log("?? ~ CgTorusComponentsService ~ generateApi ~ eventDetailsArray:", eventDetailsArray)
    // console.log("?? ~ CgTorusComponentsService ~ generateApi ~ eventDetailsObj:", eventDetailsObj)

    
    let tenantPath: string = path.dirname(
      path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))),
    );

    let tenantPathName: string = path.join(tenantPath, tenantName);
    let appGroupPathName: string = path.join(tenantPathName, appGroupName);

    let app_name: string = path.join(appGroupPathName, appName, fabric,artifactName,version);

    await this.CommonService.createFolder(tenantPathName);
    await this.CommonService.createFolder(appGroupPathName);
    await this.CommonService.createFolder(app_name);
    await this.CommonService.createFolder(app_name + '/app');
    //first parameter is template path for ejs file
    //second parameter is data for ejs file
    //thrd parameter is path for created file
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/tsconfig.ejs',
      '',
      app_name + '/tsconfig.json',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/tailwind.config.ejs',
      '',
      app_name + '/tailwind.config.ts',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/README.ejs',
      '',
      app_name + '/README.md',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/postcss.config.ejs',
      '',
      app_name + '/postcss.config.js',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/package.ejs',
      '',
      '',
      app_name + '/package.json',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/package-lock.ejs',
      'Flowbite',
      '',
      app_name + '/package-lock.json',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/next.config.ejs',
      '',
      app_name + '/next.config.js',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/next-env.d.ejs',
      '',
      app_name + '/next-env.d.ts',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/.prettierrc.ejs',
      '',
      app_name + '/.prettierrc',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/.npmrc.ejs',
      '',
      app_name + '/.npmrc',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/gitignore.ejs',
      '',
      app_name + '/.gitignore',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/.eslintrc.json.ejs',
      '',
      app_name + '/.eslintrc.json',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/.env.local.ejs',
      '',
      app_name + '/.env.local',
    );

    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-torus-components/global.css.ejs',
      '',
      app_name + '/app' + '/globals.css',
    );


    

    
    /*--------------------- Create files for Components   ----------------------------------*/

    await this.CommonService.createFolder(app_name + '/app' + '/components');
    await this.CommonService.createFolder(app_name + '/app' + '/torusComponents');
    await this.CommonService.createFolder(app_name + '/app' + '/assets');
    await this.CommonService.createFolder(app_name + '/app' + '/register');
    await this.CommonService.createFolder(app_name + '/app' + '/resetPassword');
    await this.CommonService.createFolder(app_name + '/app' + '/torusStaticHandlers');
    await this.CommonService.createFolder(app_name + '/app' + '/tenantProfile');

    await this.CommonService.copyFile('./src/TG/tg-AppTemplate/tg-torus-components/infoMsg.ejs',app_name + '/app' + '/torusStaticHandlers'+ '/infoMsgHandler.tsx');

    await this.CommonService.copyFile('./src/TG/tg-AppTemplate/tg-torus-components/assets/favicon.ico',app_name + '/app' + '/assets' + '/favicon.ico');
    await this.CommonService.copyFile('./src/TG/tg-AppTemplate/tg-torus-components/assets/github.png',app_name + '/app' + '/assets' + '/github.png');
    await this.CommonService.copyFile('./src/TG/tg-AppTemplate/tg-torus-components/assets/google.png',app_name + '/app' + '/assets' + '/google.png');
    
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/registerPage.ejs',
      '',
      '',
      app_name + '/app' + '/register' + '/page.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/forgotPasswordPage.ejs',
      '',
      '',
      app_name + '/app' + '/resetPassword' + '/page.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/tenantProfile.ejs',
      '',
      '',
      app_name + '/app' + '/tenantProfile' + '/page.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/tenantProfileLayout.ejs',
      '',
      '',
      app_name + '/app' + '/tenantProfile' + '/layout.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/forgotPassword.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/forgotPassword.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/register.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/register.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/providers.ejs',
      '',
      '',
      app_name + '/app' + '/components' +  '/providers.tsx',
    );
   
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/login.ejs',
      envDetails,
      '',
      app_name + '/app' + '/components' + '/login.tsx',
    );
// console.log('envDetails',envDetails);

    await this.CommonService.CreateFileWithThreeParam(
      './src/TG/tg-AppTemplate/tg-torus-components/appList.ejs',
      '',
      screenNames,
      sfkey+'-'+ufkey,
      '',
      app_name + '/app' + '/components' + '/appList.tsx',
    );

    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/appSelector.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/appSelector.tsx',
    );

    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/logout.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/logout.tsx',
    );

    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/mainPage.ejs',
      '',
      '',
      app_name + '/app' + '/page.tsx',
    );

    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/serverFunctions.ejs',
      '',
      '',
      app_name + '/app' + '/torusComponents' +  '/serverFunctions.tsx',
    );

    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/IconsHead.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/IconsHead.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/logo.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/Logo.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/themeSwitcher.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/ThemeSwitcher.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/sideNav.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/sideNav.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-torus-components/buttonComponent.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/button.tsx',
    );
    /*--------------------- Create files for layout  --------------------------------------------------*/
    let layoutGroupId: string[] = [];
    let pageGroupId: string[] = [];
    for (let i = 0; i < compDetails.length; i++) {
      if (compDetails[i].layoutFlag === 'no') {
        pageGroupId.push(compDetails[i].componentsId);
      }else  {
      layoutGroupId.push(compDetails[i].componentsId);
      }
    }
    await this.CommonService.CreateFileWithThreeParam(
      './src/TG/tg-AppTemplate/tg-torus-components/layout.ejs',
      '',
      '',
      '',
      '',
      app_name + '/app' + '/layout.tsx',
    );
    /*--------------------- Create files for Page  --------------------------------------------------*/
   

    await this.CommonService.createFolder(app_name + '/app' + '/' + screenName);
    // console.log(screenName);
    
    await this.CommonService.CreateFileWithThreeParam(
      './src/TG/tg-AppTemplate/tg-torus-components/compPage.ejs',
      pageGroupId,
      nodeProperties,
      screenName,
      [pfkey,sfkey],
      app_name + '/app' + '/' + screenName + '/page.tsx',
    );
    await this.CommonService.CreateFileWithThreeParam(
      './src/TG/tg-AppTemplate/tg-torus-components/compLayout.ejs',
      layoutGroupId,
      nodeProperties,
      '',
      '',
      app_name + '/app' + '/' + screenName + '/layout.tsx',
    );
    // return compDetails
    // console.log(compDetails);
    
    /*--------------------- Create files for Torus Components   ----------------------------------*/
    for (let i = 0; i < compDetails.length; i++) {
      // return compDetails[i]
      await this.CommonService.createFolder(app_name + '/app' + '/'+ 'Group' +nodeProperties[compDetails[i].componentsId].nodeName);     
      await this.CommonService.CreateFileWithThreeParam(
        './src/TG/tg-AppTemplate/tg-torus-components/groupComponent.ejs',
        compDetails[i],
        nodeProperties,
        nodeProperties[compDetails[i].componentsId].nodeName,
        pfkey,
        app_name + '/app' + '/' + 'Group'+nodeProperties[compDetails[i].componentsId].nodeName+'/'+'Group'+nodeProperties[compDetails[i].componentsId].nodeName+'.tsx',
      ); 
    }

    /*--------------------- Create files for Torus Controls   ----------------------------------*/
    

    for (let j = 0; j < nodes.length; j++) {
      if (nodeProperties[nodes[j].id].elementInfo.component === 'TButton') {
        await this.CommonService.CreateSchemaFile(
          './src/TG/tg-AppTemplate/tg-torus-components/buttonComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/button.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
            let parentNodes:any = {
              nodes: nodes[k],
              nodeProperties: nodeProperties[nodes[k].id]
            }
            await this.CommonService.CreateFileWithThreeParam(
              './src/TG/tg-AppTemplate/tg-torus-components/button.ejs',
              nodeProperties[componentsId[j]].elementInfo,
              nodes[j],
              [tenantName+':'+appGroupName+':'+appName+':'+fabric+':'+artifactName+':'+version,pfkey,eventDetailsArray,eventDetailsObj,sfkey],
              parentNodes,
              app_name +
                '/app' +
                '/torusComponents' +
                '/Button' +
                nodeProperties[componentsId[j]].elementInfo.label +
                '.tsx',
            );
          }
        }
      
      }
      if (nodeProperties[nodes[j].id].elementInfo.component === 'Input') {
        await this.CommonService.CreateSchemaFile(
          './src/TG/tg-AppTemplate/tg-torus-components/inputComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/input.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-torus-components/input.ejs',
          nodeProperties[componentsId[j]].elementInfo,
          nodes[j],
          '',
          nodes[k],
          app_name +
            '/app' +
            '/torusComponents' +
            '/Input' +
            nodeProperties[componentsId[j]].elementInfo.label +
            '.tsx',
        );
      }}
      }
      if (nodeProperties[nodes[j].id].elementInfo.component === 'NavBar') {
        await this.CommonService.CreateSchemaFile(
          './src/TG/tg-AppTemplate/tg-torus-components/navBarComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/navBar.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-torus-components/navBar.ejs',
          nodeProperties[componentsId[j]].elementInfo,
          nodes[j],
          navbarData,
          nodes[k],
          app_name +
            '/app' +
            '/torusComponents' +
            '/NavBar' +
            nodeProperties[componentsId[j]].elementInfo.label +
            '.tsx',
        );
      }}
      }
      if (nodeProperties[nodes[j].id].elementInfo.component === 'RadioGroup') {
        await this.CommonService.CreateSchemaFile(
          './src/TG/tg-AppTemplate/tg-torus-components/radioGroupComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/radioGroup.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-torus-components/radioGroup.ejs',
          nodeProperties[componentsId[j]].elementInfo,
          nodes[j],
          '',
          nodes[k],
          app_name +
            '/app' +
            '/torusComponents' +
            '/RadioGroup' +
            nodeProperties[componentsId[j]].elementInfo.label +
            '.tsx',
        );
      }}
      }
      if (nodeProperties[nodes[j].id].elementInfo.component === 'Textarea') {
        await this.CommonService.CreateSchemaFile(
          './src/TG/tg-AppTemplate/tg-torus-components/textareaComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/textarea.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-torus-components/textarea.ejs',
          nodeProperties[componentsId[j]].elementInfo,
          nodes[j],
          '',
          nodes[k],
          app_name +
            '/app' +
            '/torusComponents' +
            '/Textarea' +
            nodeProperties[componentsId[j]].elementInfo.label +
            '.tsx',
        );
      }}
      }
      if (nodeProperties[nodes[j].id].elementInfo.component === 'TimeInput') {
        await this.CommonService.CreateSchemaFile(
          './src/TG/tg-AppTemplate/tg-torus-components/timeInputComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/timeInput.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-torus-components/timeInput.ejs',
          nodeProperties[componentsId[j]].elementInfo,
          nodes[j],
          '',
          nodes[k],
          app_name +
            '/app' +
            '/torusComponents' +
            '/TimeInput' +
            nodeProperties[componentsId[j]].elementInfo.label +
            '.tsx',
        );
      }}
      }
      if (nodeProperties[nodes[j].id].elementInfo.component === 'DateInput') {
        await this.CommonService.CreateSchemaFile(
          './src/TG/tg-AppTemplate/tg-torus-components/dateInputComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/dateInput.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-torus-components/dateInput.ejs',
          nodeProperties[componentsId[j]].elementInfo,
          nodes[j],
          '',
          nodes[k],
          app_name +
            '/app' +
            '/torusComponents' +
            '/DateInput' +
            nodeProperties[componentsId[j]].elementInfo.label +
            '.tsx',
        );
      }}
      }      
    }
    return compDetails
    return 'Code has been generated successfully';
  }
}