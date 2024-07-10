import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { CG_CommonService } from '../cg-common/cg-common.service';
import { RedisService } from 'src/redisService';

@Injectable()
export class CgTorusComponentsService {
  /**
   * The CgTorusComponentsService class is used to generate a Next application for UF components
   * with the updated security JSON.
   * Initializes a new instance of the class.
   *
   * @param {CG_CommonService} CommonService - The common service.
   * @param {RedisService} redisService - The Redis service.
   */
  constructor(
    private readonly CommonService: CG_CommonService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Generates API files and folders based on the provided key.
   *
   * @param {string} key - The key used for API generation
   * @return {Promise<any>} A promise that resolves to 'OK' when API generation is complete
   */
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
    
    // console.log("🚀 ~ CgTorusComponentsService ~ generateApi ~ eventDetailsArray:", eventDetailsArray)
    // console.log("🚀 ~ CgTorusComponentsService ~ generateApi ~ eventDetailsObj:", eventDetailsObj)

    
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
      './src/cg-AppTemplate/cg-torus-components/tsconfig.ejs',
      '',
      app_name + '/tsconfig.json',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-torus-components/tailwind.config.ejs',
      '',
      app_name + '/tailwind.config.ts',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-torus-components/README.ejs',
      '',
      app_name + '/README.md',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-torus-components/postcss.config.ejs',
      '',
      app_name + '/postcss.config.js',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/package.ejs',
      '',
      '',
      app_name + '/package.json',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/package-lock.ejs',
      'Flowbite',
      '',
      app_name + '/package-lock.json',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-torus-components/next.config.ejs',
      '',
      app_name + '/next.config.js',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-torus-components/next-env.d.ejs',
      '',
      app_name + '/next-env.d.ts',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-torus-components/.prettierrc.ejs',
      '',
      app_name + '/.prettierrc',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-torus-components/.npmrc.ejs',
      '',
      app_name + '/.npmrc',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-torus-components/gitignore.ejs',
      '',
      app_name + '/.gitignore',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-torus-components/.eslintrc.json.ejs',
      '',
      app_name + '/.eslintrc.json',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-torus-components/.env.local.ejs',
      '',
      app_name + '/.env.local',
    );

    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-torus-components/global.css.ejs',
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

    await this.CommonService.copyFile('./src/cg-AppTemplate/cg-torus-components/infoMsg.ejs',app_name + '/app' + '/torusStaticHandlers'+ '/infoMsgHandler.tsx');

    await this.CommonService.copyFile('./src/cg-AppTemplate/cg-torus-components/assets/favicon.ico',app_name + '/app' + '/assets' + '/favicon.ico');
    await this.CommonService.copyFile('./src/cg-AppTemplate/cg-torus-components/assets/github.png',app_name + '/app' + '/assets' + '/github.png');
    await this.CommonService.copyFile('./src/cg-AppTemplate/cg-torus-components/assets/google.png',app_name + '/app' + '/assets' + '/google.png');
    
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/registerPage.ejs',
      '',
      '',
      app_name + '/app' + '/register' + '/page.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/forgotPasswordPage.ejs',
      '',
      '',
      app_name + '/app' + '/resetPassword' + '/page.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/tenantProfile.ejs',
      '',
      '',
      app_name + '/app' + '/tenantProfile' + '/page.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/tenantProfileLayout.ejs',
      '',
      '',
      app_name + '/app' + '/tenantProfile' + '/layout.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/forgotPassword.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/forgotPassword.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/register.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/register.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/providers.ejs',
      '',
      '',
      app_name + '/app' + '/components' +  '/providers.tsx',
    );
   
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/login.ejs',
      envDetails,
      '',
      app_name + '/app' + '/components' + '/login.tsx',
    );
// console.log('envDetails',envDetails);

    await this.CommonService.CreateFileWithThreeParam(
      './src/cg-AppTemplate/cg-torus-components/appList.ejs',
      envDetails,
      screenNames,
      sfkey+'-'+ufkey,
      '',
      app_name + '/app' + '/components' + '/appList.tsx',
    );

    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/appSelector.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/appSelector.tsx',
    );

    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/logout.ejs',
      envDetails,
      '',
      app_name + '/app' + '/components' + '/logout.tsx',
    );

    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/mainPage.ejs',
      screenName,
      '',
      app_name + '/app' + '/page.tsx',
    );

    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/apiCall.ejs',
      screenName,
      '',
      app_name + '/app' +'/torusComponents'+ '/apiCall.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/serverFunctions.ejs',
      '',
      '',
      app_name + '/app' + '/torusComponents' +  '/serverFunctions.tsx',
    );

    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/IconsHead.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/IconsHead.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/logo.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/Logo.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/themeSwitcher.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/ThemeSwitcher.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/sideNav.ejs',
      '',
      '',
      app_name + '/app' + '/components' + '/sideNav.tsx',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-torus-components/buttonComponent.ejs',
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
      './src/cg-AppTemplate/cg-torus-components/layout.ejs',
      layoutGroupId,
      nodeProperties,
      envDetails,
      '',
      app_name + '/app' + '/layout.tsx',
    );
    /*--------------------- Create files for Page  --------------------------------------------------*/
   

    await this.CommonService.createFolder(app_name + '/app' + '/' + screenName);
    // console.log(screenName);
    
    await this.CommonService.CreateFileWithThreeParam(
      './src/cg-AppTemplate/cg-torus-components/compPage.ejs',
      pageGroupId,
      nodeProperties,
      screenName,
      [pfkey,sfkey],
      app_name + '/app' + '/' + screenName + '/page.tsx',
    );
    await this.CommonService.CreateFileWithThreeParam(
      './src/cg-AppTemplate/cg-torus-components/compLayout.ejs',
      layoutGroupId,
      nodeProperties,
      envDetails,
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
        './src/cg-AppTemplate/cg-torus-components/groupComponent.ejs',
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
          './src/cg-AppTemplate/cg-torus-components/buttonComponent.ejs',
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
              './src/cg-AppTemplate/cg-torus-components/button.ejs',
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
          './src/cg-AppTemplate/cg-torus-components/inputComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/input.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/cg-AppTemplate/cg-torus-components/input.ejs',
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
          './src/cg-AppTemplate/cg-torus-components/navBarComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/navBar.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/cg-AppTemplate/cg-torus-components/navBar.ejs',
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
          './src/cg-AppTemplate/cg-torus-components/radioGroupComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/radioGroup.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/cg-AppTemplate/cg-torus-components/radioGroup.ejs',
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
          './src/cg-AppTemplate/cg-torus-components/textareaComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/textarea.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/cg-AppTemplate/cg-torus-components/textarea.ejs',
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
          './src/cg-AppTemplate/cg-torus-components/timeInputComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/timeInput.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/cg-AppTemplate/cg-torus-components/timeInput.ejs',
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
          './src/cg-AppTemplate/cg-torus-components/dateInputComponent.ejs',
          '',
          '',
          app_name + '/app' + '/components' + '/dateInput.tsx',
        );
        for(let k=0;k<nodes.length;k++){
          if(nodes[j].T_parentId === nodes[k].id){
        await this.CommonService.CreateFileWithThreeParam(
          './src/cg-AppTemplate/cg-torus-components/dateInput.ejs',
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