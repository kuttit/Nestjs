import { Injectable } from '@nestjs/common';
import * as path from 'path';
import 'dotenv/config';
import { CG_CommonService } from 'src/CG/cg-common/cg-common.service';
import { RedisService } from 'src/redisService';

@Injectable()
export class CG_APIService {
  /**
   * The CG_APIService class is used to generate a Nest application for DF
   * with the ER API and Basic security JSON.
   * Constructor for the class.
   *
   * @param {CG_CommonService} CommonService - The CommonService instance.
   * @param {RedisService} redisService - The RedisService instance.
   */
  constructor(
    private readonly CommonService: CG_CommonService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Generates API files based on the provided key.
   *
   * @param {string} key - The key used to generate the API. It should be in the format:
   *                       tenantName:appGroupName:appName:version.
   * @return {Promise<string>} - A promise that resolves to a string indicating the success
   *                             of the API generation.
   */
  async generateApi(key: string): Promise<any> {
    //seperate the tenentname,appgroupname,appname,version from the provided key
    const keyParts: string[] = key.split(':');
    const tenantName: string = keyParts[0];
    const appGroupName: string = keyParts[1];
    const appName: string = keyParts[3];
    const version: string = keyParts[5];
    //create a app inside the created path given below
    //this path is dynamically created based on the provided key
    let tenantPath:string = path.dirname(
      path.dirname(path.dirname(path.dirname(__dirname))),
    );
    let tenantPathName:string = path.join(tenantPath, tenantName);
    let appGroupPathName:string = path.join(tenantPathName, appGroupName);
    let appPathName:string = path.join(appGroupPathName, appName, version);

    await this.CommonService.createFolder(tenantPathName);
    await this.CommonService.createFolder(appGroupPathName);
    await this.CommonService.createFolder(appPathName);

    let input: string = await this.redisService.getJsonData(key);
    let table: any = structuredClone(JSON.parse(input));
    let relData: any = table.flatMap((item) => item.relationships);
    
    let relArray : any[] = [];
    //collecting the tables names , relationships and columns in an array
    for (let i = 0; i < relData.length; i++) {
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
      let Entities = relData[i].Entities.split(',');
      relObj.sourceEntity = Entities[0];
      relObj.targetEntity = Entities[1];
      let Column = relData[i].Coloumn.split(',');
      relObj.sourceColumn = Column[0];
      relObj.targetColumn = Column[1];
      relObj.Relationship = relData[i].Relationship;
      relArray.push(relObj);
    }

    /*--------------------- Create Prisma related files   ----------------------------------*/

    let prismaPathName: string = path.join(appPathName, 'prisma');
    await this.CommonService.createFolder(prismaPathName);

    let prismaSchemaPathName: string = path.join(
      prismaPathName,
      'schema.prisma',
    );

    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-er-api/prisma.ejs',
      table,
      relArray,
      prismaSchemaPathName,
    );

    /*--------------------- Create Torus_App and Base files   ----------------------------------*/

    await this.CommonService.createFolder(appPathName);
    //first parameter is template path for ejs file
    //second parameter is data for ejs file
    //thrd parameter is path for created file
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/env.ejs',
      '',
      appPathName + '/.env',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/.eslintrc.ejs',
      '',
      appPathName + '/.eslintrc.js',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/gitignore.ejs',
      '',
      appPathName + '/.gitignore',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/prettierrc.ejs',
      '',
      appPathName + '/.prettierrc',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/nest-cli.ejs',
      '',
      appPathName + '/nest-cli.json',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-er-api/package-lock.ejs',
      appName,
      '',
      appPathName + '/package-lock.json',
    );
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-er-api/package.ejs',
      appName,
      '',
      appPathName + '/package.json',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/README.ejs',
      '',
      appPathName + '/README.md',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/tsconfig.build.ejs',
      '',
      appPathName + '/tsconfig.build.json',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/tsconfig.ejs',
      '',
      appPathName + '/tsconfig.json',
    );

    /*--------------------- Create Casl related files   ----------------------------------*/

    let AppTemplateCaslPath: string = path.join(appPathName, 'src/ability');
    await this.CommonService.createFolder(AppTemplateCaslPath);

    let userMatrixJson: any = JSON.parse(await this.redisService.getJsonData(
      'GSS:ADF:TorusPOC:userMatrix',
    ));
    
    let userMatrixJdata: any = {
      jdata: [...table],
      users: [...userMatrixJson.users],
    };

    let userMatrix: any[] = [];
    // arrange the wanted data from casl json in new variable
    for (let i = 0; i < userMatrixJson.users.length; i++) {
      for (let j = 0; j < userMatrixJson.users[i].tenantDetails.length; j++) {
        for (
          let k = 0;
          k < userMatrixJson.users[i].tenantDetails[j].appGroupDetails.length;
          k++
        ) {
          for (
            let l = 0;
            l <
            userMatrixJson.users[i].tenantDetails[j].appGroupDetails[k]
              .appDetails.length;
            l++
          ) {
            for (
              let m = 0;
              m <
              userMatrixJson.users[i].tenantDetails[j].appGroupDetails[k]
                .appDetails[l].rolePolicyDetails.length;
              m++
            ) {
              for (
                let n = 0;
                n <
                userMatrixJson.users[i].tenantDetails[j].appGroupDetails[k]
                  .appDetails[l].rolePolicyDetails[m].policy.Statement.length;
                n++
              ) {
                interface obj {
                  userName: string;
                  tenantName: string;
                  appGroupName: string;
                  appName: string;
                  roleName: string;
                  resource: string;
                  can: Array<string>;
                  cannot: Array<string>;
                }

                let obj: obj = {
                  userName: 'string',
                  tenantName: 'string',
                  appGroupName: 'string',
                  appName: 'string',
                  roleName: 'string',
                  resource: 'string',
                  can: [],
                  cannot: [],
                };

                obj.userName = userMatrixJson.users[i].loginName;
                obj.tenantName =
                  userMatrixJson.users[i].tenantDetails[j].tenatName;
                obj.appGroupName =
                  userMatrixJson.users[i].tenantDetails[j].appGroupDetails[
                    k
                  ].appGroupName;
                obj.appName =
                  userMatrixJson.users[i].tenantDetails[j].appGroupDetails[
                    k
                  ].appDetails[l].appName;
                obj.roleName =
                  userMatrixJson.users[i].tenantDetails[j].appGroupDetails[
                    k
                  ].appDetails[l].rolePolicyDetails[m].roleName;
                if (
                  userMatrixJson.users[i].tenantDetails[j].appGroupDetails[
                    k
                  ].appDetails[l].rolePolicyDetails[m].policy.Statement[
                    n
                  ].resource.startsWith('DF')
                ) {
                  for (
                    let o = 0;
                    o <
                    userMatrixJson.users[i].tenantDetails[j].appGroupDetails[k]
                      .appDetails[l].rolePolicyDetails[m].policy.Statement[n]
                      .actionAllowed.length;
                    o++
                  ) {
                    const parts =
                      userMatrixJson.users[i].tenantDetails[j].appGroupDetails[
                        k
                      ].appDetails[l].rolePolicyDetails[m].policy.Statement[n]
                        .resource;
                    const [Fabric, type, tablename] = parts.split(':');
                    obj.resource = tablename;
                    obj.can.push(
                      userMatrixJson.users[i].tenantDetails[j].appGroupDetails[
                        k
                      ].appDetails[l].rolePolicyDetails[m].policy.Statement[n]
                        .actionAllowed[o].action,
                    );
                  }
                  for (
                    let p = 0;
                    p <
                    userMatrixJson.users[i].tenantDetails[j].appGroupDetails[k]
                      .appDetails[l].rolePolicyDetails[m].policy.Statement[n]
                      .actionDenied.length;
                    p++
                  ) {
                    obj.cannot.push(
                      userMatrixJson.users[i].tenantDetails[j].appGroupDetails[
                        k
                      ].appDetails[l].rolePolicyDetails[m].policy.Statement[n]
                        .actionDenied[p].action,
                    );
                  }
                  userMatrix.push(obj);
                }
              }
            }
          }
        }
      }
    }
    //first parameter is template path for ejs file
    //second parameter is data for ejs file
    //third parameter is also any given data for ejs file
    //forth parameter is path for created file 
    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-er-api/ability.factory.ejs',
      userMatrixJdata,
      userMatrix,
      AppTemplateCaslPath + '/ability.factory.ts',
    );
    
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/ability.module.ejs',
      '',
      AppTemplateCaslPath + '/ability.module.ts',
    );

    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-er-api/ability.decorator.ejs',
      table,
      '',
      AppTemplateCaslPath + '/ability.decorator.ts',
    );

    await this.CommonService.CreateSchemaFile(
      './src/cg-AppTemplate/cg-er-api/ability.guard.ejs',
      '',
      '',
      AppTemplateCaslPath + '/ability.guard.ts',
    );

    /*--------------------- Create Main file   ----------------------------------*/

    let srcPathName: string = path.join(appPathName, 'src');

    await this.CommonService.createFolder(srcPathName);
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/main.ejs',
      '',
      srcPathName + '/main.ts',
    );

    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/prisma.service.ejs',
      '',
      srcPathName + '/prisma.service.ts',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/jwt.service.ejs',
      '',
      srcPathName + '/jwt.service.ts',
    );

    let testPathName: string = path.join(appPathName, 'test');
    await this.CommonService.createFolder(testPathName);
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/app.e2e-spec.ejs',
      '',
      testPathName + '/app.e2e-spec.ts',
    );
    await this.CommonService.createFile(
      './src/cg-AppTemplate/cg-er-api/jest-e2e.ejs',
      '',
      testPathName + '/jest-e2e.json',
    );
    await this.CreateDir(table, srcPathName);

    return 'Code has been generated successfully';
  }

  /**
   * Create Entity files based on the provided JSON data.
   *
   * @param {JSON} strReadPath - JSON data containing information about tables
   * @param {String} path - Path where the entity files will be created
   * @return {Promise<any>} The tables data after the entity files are created
   */
  async CreateDir(strReadPath: JSON, path: String) {
    try {
      let tables: any = strReadPath;
      /*--------------------- Create Entity files   ----------------------------------*/
      for (let i = 0; i < tables.length; i++) {
        let tabName: any = tables[i].Entity;
        await this.CommonService.createFolder(path + '/' + tabName);
        await this.CommonService.createFolder(
          path + '/' + tabName + '/' + 'entity',
        );
        let column: any = tables[i];
        let columnForEntity: any = tables[i].attributes;
        await this.CommonService.CreateSchemaFile(
          './src/cg-AppTemplate/cg-er-api/service.ejs',
          column,
          tabName,
          path + '/' + tabName + '/' + tabName + '.service.ts',
        );
        await this.CommonService.CreateSchemaFile(
          './src/cg-AppTemplate/cg-er-api/controller.ejs',
          column,
          tabName,
          path + '/' + tabName + '/' + tabName + '.controller.ts',
        );
        await this.CommonService.CreateSchemaFile(
          './src/cg-AppTemplate/cg-er-api/enitity.ejs',
          columnForEntity,
          tabName,
          path + '/' + tabName + '/' + 'entity' + '/' + tabName + '.entity.ts',
        );

        await this.CommonService.CreateSchemaFile(
          './src/cg-AppTemplate/cg-er-api/module.ejs',
          '',
          tabName,
          path + '/' + tabName + '/' + tabName + '.module.ts',
        );
        await this.CommonService.CreateSchemaFile(
          './src/cg-AppTemplate/cg-er-api/app.module.ejs',
          tables,
          '',
          path + '/' + 'app.module.ts',
        );
      }
      return await tables;
    } catch (error) {
      throw error;
    }
  }
}
