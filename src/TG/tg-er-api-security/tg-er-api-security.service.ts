import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { TG_CommonService } from 'src/TG/tg-common/tg-common.service';
import { RedisService } from 'src/redisService';

@Injectable()
export class TgErApiSecurityService {
  /**
   * The CgErApiSecurityService class is used to generate a Nest application for DF
   *  with the ER API and updated security JSON.
   * Constructor for the CgErApiSecurityService class.
   *
   * @param {RedisService} redisService - The RedisService instance.
   * @param {CG_CommonService} CommonService - The CG_CommonService instance.
   */
  constructor(
    private readonly redisService: RedisService,
    private readonly CommonService: TG_CommonService,
  ) {}

  /**
   * Generates an API based on the given Assembler key. The key is split into different parts
   * and used to construct file paths and names. The function creates necessary folders,
   * retrieves JSON data from Redis, and processes the data to generate various files
   * related to Prisma, Torus_App, Casl, and the main file. The function also creates
   * test files for end-to-end testing. Finally, it returns the success message.
   *
   * @param {string} key - The key used to generate the API.
   * @return {Promise<any>} - A Promise that resolves to an array of user matrix data.
   */

  async generateStaticFiles(aKey: string): Promise<any>{
    // console.log(aKey);
    
    const keyParts: string[] = aKey.split(':');
    const tenantName: string = keyParts[0];
    const appGroupName: string = keyParts[1];
    const appName: string = keyParts[2];
    
    const version: string = keyParts[4];
    //create a app inside the created path given below
    //this path is dynamically created based on the provided key
    const tenantPath: string = path.dirname(
      path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))),
    );
    const tenantPathName: string = path.join(tenantPath, tenantName);
    const appGroupPathName: string = path.join(tenantPathName, appGroupName);
    const appPathName: string = path.join(
      appGroupPathName,
      appName,'DF',
      version,
    );
    // console.log(appPathName);
    const AppTemplateCaslPath: string = path.join(appPathName, 'src/ability');
    const srcPathName: string = path.join(appPathName, 'src');
    const testPathName: string = path.join(appPathName, 'test');
    const prismaPathName: string = path.join(appPathName, 'prisma');


    await this.CommonService.createFolder(tenantPathName);
    await this.CommonService.createFolder(appGroupPathName);
    await this.CommonService.createFolder(appPathName);
    await this.CommonService.createFolder(srcPathName);
    await this.CommonService.createFolder(testPathName);
    await this.CommonService.createFolder(appPathName);
    await this.CommonService.createFolder(AppTemplateCaslPath);
    await this.CommonService.createFolder(prismaPathName);

    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/.eslintrc.ejs',
      '',
      appPathName + '/.eslintrc.js',
    );
    
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/env.ejs',
      '',
      appPathName + '/.env',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/gitignore.ejs',
      '',
      appPathName + '/.gitignore',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/prettierrc.ejs',
      '',
      appPathName + '/.prettierrc',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/nest-cli.ejs',
      '',
      appPathName + '/nest-cli.json',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/package-lock.ejs',
      appName,
      '',
      appPathName + '/package-lock.json',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/package.ejs',
      appName,
      '',
      appPathName + '/package.json',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/README.ejs',
      '',
      appPathName + '/README.md',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/tsconfig.build.ejs',
      '',
      appPathName + '/tsconfig.build.json',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/tsconfig.ejs',
      '',
      appPathName + '/tsconfig.json',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/ability.module.ejs',
      '',
      AppTemplateCaslPath + '/ability.module.ts',
    );
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/ability.decorator.ejs',
      '',
      '',
      AppTemplateCaslPath + '/ability.decorator.ts',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/main.ejs',
      '',
      srcPathName + '/main.ts',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/prisma.service.ejs',
      '',
      srcPathName + '/prisma.service.ts',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/jwt.service.ejs',
      '',
      srcPathName + '/jwt.service.ts',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/app.e2e-spec.ejs',
      '',
      testPathName + '/app.e2e-spec.ts',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/jest-e2e.ejs',
      '',
      testPathName + '/jest-e2e.json',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/commonService.ejs',
      '',
      srcPathName + '/commonService.ts',
    );
    await this.CommonService.createFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/redisService.ejs',
      '',
      srcPathName + '/redisService.ts',
    );
  }

  async prepareDataForDynamicFiles(dfKey:string,sfKey:string): Promise<any> {
    const keyParts: string[] = dfKey.split(':');
    const tenantName: string = keyParts[0];
    const appGroupName: string = keyParts[1];
    const appName: string = keyParts[2];
    const nodes: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(dfKey + ':nodes')),
    );
    const nodeProperties: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(dfKey + ':nodeProperty')),
    );
    const componentsId: string[] = [];
    for (let i = 0; i < nodes.length; i++) {
      componentsId.push(nodes[i].id);
    }
    const uniqueTables: any = [];
    const relData: any = [];
    for (let j = 0; j < componentsId.length; j++) {
      var tables: any = nodeProperties[componentsId[j]];
      uniqueTables.push(tables);
      // console.log(tables);
      if (tables.entities.relationships.length > 0) {
        relData.push(tables.entities.relationships);
      }
      // var relData: any = relation.flatMap((item) => console.log(item));
    }

    let relArray: any[] = [];
    //collecting the tables names , relationships and columns in an array
    for (let i = 0; i < relData.length; i++) {
      for (let j = 0; j < relData[i].length; j++) {
        interface relObj {
          sourceEntity: string;
          targetEntity: string;
          sourceColumn: string;
          targetColumn: string;
          Relationship: string;
        }

        let relObj: relObj = {
          sourceEntity: 'string',
          targetEntity: 'string',
          sourceColumn: 'string',
          targetColumn: 'string',
          Relationship: 'string',
        };
        let Entities = relData[i][j].Entities.split(',');
        relObj.sourceEntity = Entities[0];
        relObj.targetEntity = Entities[1];
        let Column = relData[i][j].Coloumn.split(',');
        relObj.sourceColumn = Column[0];
        relObj.targetColumn = Column[1];
        relObj.Relationship = relData[i][j].Relationship;
        relArray.push(relObj);
      }
    }

    /*--------------------- Create Torus_App and Base files   ----------------------------------*/

    //first parameter is template path for ejs file
    //second parameter is data for ejs file
    //thrd parameter is path for created file
   
  

    /*--------------------- Create Casl related files   ----------------------------------*/

    

    let userMatrixJson: any = JSON.parse(
      await this.redisService.getJsonData(sfKey + ':summary'),
    );

    let userMatrixJdata: any = {
      jdata: [...uniqueTables],
      ...userMatrixJson,
    };

    let userMatrix: any[] = [];
    // arrange the wanted data from casl json in new variable

    if (userMatrixJson) {
      userMatrixJson.orgGrp.forEach((orgGrp) => {
        if (orgGrp.org)
          orgGrp.org.forEach((org) => {
            if (org.roleGrp)
              org.roleGrp.forEach((roleGrp) => {
                if (roleGrp.roles)
                  roleGrp.roles.forEach((roles) => {
                    if (roles.psGrp)
                      roles.psGrp.forEach((psGrp) => {
                        if (psGrp.ps)
                          psGrp.ps.forEach((ps) => {
                            if (ps.df)
                              ps.df.forEach((df) => {
                                if (df.resourceType === 'tables') {
                                  interface obj {
                                    tenantName: string;
                                    appGroupName: string;
                                    appName: string;
                                    orgGrpCode: string;

                                    orgCode: string;

                                    roleGrpCode: string;

                                    roleCode: string;

                                    psGrpCode: string;

                                    psCode: string;

                                    artfactName: string;
                                    key: string;

                                    resource: string;
                                    SIFlag: string;
                                    can: string[];
                                    cannot: string[];
                                  }

                                  let obj: obj = {
                                    tenantName: tenantName,
                                    appGroupName: appGroupName,
                                    appName: appName,

                                    orgGrpCode: orgGrp.orgGrpCode,

                                    orgCode: org.orgCode,

                                    roleGrpCode: roleGrp.roleGrpCode,

                                    roleCode: roles.roleCode,

                                    psGrpCode: psGrp.psGrpCode,

                                    psCode: ps.psCode,

                                    artfactName: df.resource,
                                    key: dfKey,

                                    resource: 'string',
                                    SIFlag: 'string',
                                    can: [],
                                    cannot: [],
                                  };

                                  df.tableDetails.forEach((table) => {
                                    obj.resource = table.resource;
                                    obj.SIFlag = table.SIFlag.selectedValue;
                                    obj.can = table.actionAllowed.selectedValue;
                                    obj.cannot =
                                      table.actionDenied.selectedValue;
                                    var obj2 = structuredClone(obj);
                                    userMatrix.push(obj2);
                                  });
                                }
                              });
                          });
                      });
                  });
              });
          });
      });
    }
    return {
      'key':dfKey,
      'uniqueTables':uniqueTables,
      'relArray':relArray,
      'userMatrix':userMatrix,
      'userMatrixJdata':userMatrixJdata,
      'tables':tables,
    }
  }

  async generateDynamicFiles(aKey: string,data: any,sfKey:string): Promise<any> {
   
    let keyParts = aKey.split(':');
    let tenantName = keyParts[0];
    let appGroupName = keyParts[1];
    let appName = keyParts[2];
    let version = keyParts[4];
    let uniqueTables = data.uniqueTables;
    let relArray = data.relArray;
    let userMatrix = data.userMatrix;
    let userMatrixJdata = data.userMatrixJdata;
    const tenantPath: string = path.dirname(
      path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))),
    );
    const tenantPathName: string = path.join(tenantPath, tenantName);
    const appGroupPathName: string = path.join(tenantPathName, appGroupName);
    const appPathName: string = path.join(
      appGroupPathName,
      appName,'DF',
      version,
    );
    // console.log(appPathName);
    const AppTemplateCaslPath: string = path.join(appPathName, 'src/ability');
    const srcPathName: string = path.join(appPathName, 'src');
    const prismaPathName: string = path.join(appPathName, 'prisma');

    const uniqueDF = new Set();
    uniqueTables.forEach((uniqueTables) => {
      uniqueDF.add(uniqueTables.key);
    })
   
    await this.CommonService.CreateFileWithThreeParam(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/prisma.ejs',
      uniqueTables,
      relArray,
      userMatrix,
      '',
      prismaPathName+'/'+'schema.prisma',
    );
  
    await this.CommonService.CreateSchemaFile(
      './src/TG/tg-AppTemplate/tg-er-api-security-json/ability.guard.ejs',
      aKey,
      sfKey,
      AppTemplateCaslPath + '/ability.guard.ts',
    );

    await this.CreateDir(uniqueTables, srcPathName, userMatrix);
    return data
  }
  async generateApi(key: string, SFKey: string): Promise<any> {
    //seperate the tenentname,appgroupname,appname,version from the provided  Assembler key
    const keyParts: string[] = key.split(':');
    const tenantName: string = keyParts[0];
    const appGroupName: string = keyParts[1];
    const appName: string = keyParts[2];
    const fabric: string = keyParts[3];
    const artifacts: string = keyParts[4];
    const version: string = keyParts[5];
    //create a app inside the created path given below
    //this path is dynamically created based on the provided key
    let tenantPath: string = path.dirname(
      path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))),
    );
    let tenantPathName: string = path.join(tenantPath, tenantName);
    let appGroupPathName: string = path.join(tenantPathName, appGroupName);
    let appPathName: string = path.join(
      appGroupPathName,
      appName,
      fabric,
      artifacts,
      version,
    );
    let AppTemplateCaslPath: string = path.join(appPathName, 'src/ability');
    let srcPathName: string = path.join(appPathName, 'src');
    let testPathName: string = path.join(appPathName, 'test');
    let prismaPathName: string = path.join(appPathName, 'prisma');


    await this.CommonService.createFolder(tenantPathName);
    await this.CommonService.createFolder(appGroupPathName);
    await this.CommonService.createFolder(appPathName);
    await this.CommonService.createFolder(srcPathName);
    await this.CommonService.createFolder(testPathName);
    await this.CommonService.createFolder(appPathName);
    await this.CommonService.createFolder(AppTemplateCaslPath);
    await this.CommonService.createFolder(prismaPathName);

    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/env.ejs',
      '',
      appPathName + '/.env',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/.eslintrc.ejs',
      '',
      appPathName + '/.eslintrc.js',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/gitignore.ejs',
      '',
      appPathName + '/.gitignore',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/prettierrc.ejs',
      '',
      appPathName + '/.prettierrc',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/nest-cli.ejs',
      '',
      appPathName + '/nest-cli.json',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-er-api-security-json/package-lock.ejs',
      appName,
      '',
      appPathName + '/package-lock.json',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-er-api-security-json/package.ejs',
      appName,
      '',
      appPathName + '/package.json',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/README.ejs',
      '',
      appPathName + '/README.md',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/tsconfig.build.ejs',
      '',
      appPathName + '/tsconfig.build.json',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/tsconfig.ejs',
      '',
      appPathName + '/tsconfig.json',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/ability.module.ejs',
      '',
      AppTemplateCaslPath + '/ability.module.ts',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-er-api-security-json/ability.decorator.ejs',
      '',
      '',
      AppTemplateCaslPath + '/ability.decorator.ts',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/main.ejs',
      '',
      srcPathName + '/main.ts',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/prisma.service.ejs',
      '',
      srcPathName + '/prisma.service.ts',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/jwt.service.ejs',
      '',
      srcPathName + '/jwt.service.ts',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/app.e2e-spec.ejs',
      '',
      testPathName + '/app.e2e-spec.ts',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api-security-json/jest-e2e.ejs',
      '',
      testPathName + '/jest-e2e.json',
    );



    const nodes: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(key + ':nodes')),
    );
    const nodeProperties: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(key + ':nodeProperty')),
    );
    const componentsId: string[] = [];
    for (let i = 0; i < nodes.length; i++) {
      componentsId.push(nodes[i].id);
    }
    const uniqueTables: any = [];
    const relData: any = [];
    for (let j = 0; j < componentsId.length; j++) {
      var tables: any = nodeProperties[componentsId[j]];
      uniqueTables.push(tables);
      // console.log(tables);
      if (tables.entities.relationships.length > 0) {
        relData.push(tables.entities.relationships);
      }
      // var relData: any = relation.flatMap((item) => console.log(item));
    }

    let relArray: any[] = [];
    //collecting the tables names , relationships and columns in an array
    for (let i = 0; i < relData.length; i++) {
      for (let j = 0; j < relData[i].length; j++) {
        interface relObj {
          sourceEntity: string;
          targetEntity: string;
          sourceColumn: string;
          targetColumn: string;
          Relationship: string;
        }

        let relObj: relObj = {
          sourceEntity: 'string',
          targetEntity: 'string',
          sourceColumn: 'string',
          targetColumn: 'string',
          Relationship: 'string',
        };
        let Entities = relData[i][j].Entities.split(',');
        relObj.sourceEntity = Entities[0];
        relObj.targetEntity = Entities[1];
        let Column = relData[i][j].Coloumn.split(',');
        relObj.sourceColumn = Column[0];
        relObj.targetColumn = Column[1];
        relObj.Relationship = relData[i][j].Relationship;
        relArray.push(relObj);
      }
    }

    /*--------------------- Create Torus_App and Base files   ----------------------------------*/

    //first parameter is template path for ejs file
    //second parameter is data for ejs file
    //thrd parameter is path for created file
   
  

    /*--------------------- Create Casl related files   ----------------------------------*/

    

    let userMatrixJson: any = JSON.parse(
      await this.redisService.getJsonData(SFKey + ':summary'),
    );

    let userMatrixJdata: any = {
      jdata: [...uniqueTables],
      ...userMatrixJson,
    };

    let userMatrix: any[] = [];
    // arrange the wanted data from casl json in new variable

    if (userMatrixJson) {
      userMatrixJson.orgGrp.forEach((orgGrp) => {
        if (orgGrp.org)
          orgGrp.org.forEach((org) => {
            if (org.roleGrp)
              org.roleGrp.forEach((roleGrp) => {
                if (roleGrp.roles)
                  roleGrp.roles.forEach((roles) => {
                    if (roles.psGrp)
                      roles.psGrp.forEach((psGrp) => {
                        if (psGrp.ps)
                          psGrp.ps.forEach((ps) => {
                            if (ps.df)
                              ps.df.forEach((df) => {
                                if (df.resourceType === 'tables') {
                                  interface obj {
                                    tenantName: string;
                                    appGroupName: string;
                                    appName: string;
                                    orgGrpCode: string;
                                    orgCode: string;
                                    roleGrpCode: string;
                                    roleCode: string;
                                    psGrpCode: string;
                                    psCode: string;
                                    artfactName: string;
                                    key: string;
                                    resource: string;
                                    SIFlag: string;
                                    can: string[];
                                    cannot: string[];
                                  }

                                  let obj: obj = {
                                    tenantName: tenantName,
                                    appGroupName: appGroupName,
                                    appName: appName,
                                    orgGrpCode: orgGrp.orgGrpCode,
                                    orgCode: org.orgCode,
                                    roleGrpCode: roleGrp.roleGrpCode,
                                    roleCode: roles.roleCode,
                                    psGrpCode: psGrp.psGrpCode,
                                    psCode: ps.psCode,
                                    artfactName: df.resource,
                                    key: key,
                                    resource: 'string',
                                    SIFlag: 'string',
                                    can: [],
                                    cannot: [],
                                  };

                                  df.tableDetails.forEach((table) => {
                                    obj.resource = table.resource;
                                    obj.SIFlag = table.SIFlag.selectedValue;
                                    obj.can = table.actionAllowed.selectedValue;
                                    obj.cannot =
                                      table.actionDenied.selectedValue;
                                    var obj2 = structuredClone(obj);
                                    userMatrix.push(obj2);
                                  });
                                }
                              });
                          });
                      });
                  });
              });
          });
      });
    }
    //first parameter is template path for ejs file
    //second parameter is data for ejs file
    //third parameter is also any given data for ejs file
    //forth parameter is path for created file
    
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-er-api-security-json/ability.factory.ejs',
      userMatrixJdata,
      userMatrix,
      AppTemplateCaslPath + '/ability.factory.ts',
    );



 

    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-er-api-security-json/ability.guard.ejs',
      key,
      '',
      AppTemplateCaslPath + '/ability.guard.ts',
    );

    /*--------------------- Create Prisma related files   ----------------------------------*/



    let prismaSchemaPathName: string = path.join(
      prismaPathName,
      'schema.prisma',
    );

    await this.CommonService.CreateFileWithThreeParam(
      './src/cg-AppTemplate/cg-er-api-security-json/prisma.ejs',
      uniqueTables,
      relArray,
      userMatrix,
      '',
      prismaSchemaPathName,
    );

    /*--------------------- Create Main file   ----------------------------------*/

    



   


    

 
    
    await this.CreateDir(uniqueTables, srcPathName, userMatrix);
    
    
    return userMatrix
    return 'Code has been generated successfully';
  }
  /**
   * Asynchronously creates entity files based on the provided JSON data.
   *
   * @param {JSON} strReadPath - JSON data containing information about tables
   * @param {String} path - Path where the entity files will be created
   * @param {any} userMatrix - User matrix data
   * @return {Promise<any>} The tables data after the entity files are created
   */
  async CreateDir(strReadPath: any, tabPath: any, userMatrix: any) {
    try {
      let tables: any = strReadPath;
      
      /*--------------------- Create Entity files   ----------------------------------*/

      for (let i = 0; i < tables.length; i++) {
        let tabName: any = tables[i].entities.Entity;
        let column: any = tables[i];
        let columnForEntity: any = tables[i].entities.attributes;

        await this.CommonService.createFolder(tabPath + '/' + tabName);
        await this.CommonService.createFolder(
          tabPath + '/' + tabName + '/' + 'entity',
        );

        await this.CommonService.CreateSchemaFile(
          './src/TG/tg-AppTemplate/tg-er-api-security-json/service.ejs',
          column,
          tabName,
          tabPath + '/' + tabName + '/' + tabName + '.service.ts',
        );

        await this.CommonService.CreateFileWithThreeParam(
          './src/TG/tg-AppTemplate/tg-er-api-security-json/controller.ejs',
          column,
          tabName,
          userMatrix,
          '',
          tabPath + '/' + tabName + '/' + tabName + '.controller.ts',
        );
        await this.CommonService.CreateSchemaFile(
          './src/TG/tg-AppTemplate/tg-er-api-security-json/enitity.ejs',
          columnForEntity,
          tabName,
          tabPath +
            '/' +
            tabName +
            '/' +
            'entity' +
            '/' +
            tabName +
            '.entity.ts',
        );

        await this.CommonService.CreateSchemaFile(
          './src/TG/tg-AppTemplate/tg-er-api-security-json/module.ejs',
          '',
          tabName,
          tabPath + '/' + tabName + '/' + tabName + '.module.ts',
        );
        await this.CommonService.CreateSchemaFile(
          './src/TG/tg-AppTemplate/tg-er-api-security-json/app.module.ejs',
          tables,
          '',
          tabPath + '/' + 'app.module.ts',
        );
      }

      await this.CommonService.createFolder(tabPath + '/' + 'default');
      await this.CommonService.createFolder(
        tabPath + '/' + 'default' + '/' + 'entity',
      );
      await this.CommonService.CreateSchemaFile(
        './src/TG/tg-AppTemplate/tg-er-api-security-json/defaultEntity.ejs',
        '',
        '',
        tabPath + '/' + 'default' + '/' + 'entity' + '/' + 'default.entity.ts',
      );
     
      return await tables;
    } catch (error) {
      throw error;
    }
  }

  async mergeData(data){
    var key = [];
  var all = {};
  var uniqueTables = [];
  var relArray = [];
  var userMatrix = [];
  var userMatrixJdata = { jdata: [], orgGrp: [] };
  var tables = [];
  for (let i = 0; i < data.length; i++) {
    uniqueTables.push(...data[i].uniqueTables);
    relArray.push(...data[i].relArray);
    userMatrix.push(...data[i].userMatrix);
    userMatrixJdata.jdata.push(...data[i].userMatrixJdata.jdata);
    userMatrixJdata.orgGrp.push(...data[i].userMatrixJdata.orgGrp);
    tables.push({ ...data[i].tables });

    key.push(data[i].key);
  }

  all = { key, uniqueTables, relArray, userMatrix, userMatrixJdata, tables };

  return all;

  }
}
