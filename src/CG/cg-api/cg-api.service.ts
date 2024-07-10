import { Injectable } from "@nestjs/common";
import * as path from "path";
import "dotenv/config";
import { CG_CommonService } from "src/CG/cg-common/cg-common.service";
import { RedisService } from "src/redisService";

@Injectable()
export class CG_APIService {
  /**
   * The CG_APIService class is used to generate a Nest application for DF
   * with the ER API JSON.
   * Constructor for CG_APIService class.
   *
   * @param {CG_CommonService} CommonService - The CommonService instance.
   * @param {RedisService} redisService - The RedisService instance.
   */
  constructor(private readonly CommonService: CG_CommonService,
    private readonly redisService: RedisService
    ) {}

  /**
   * Generates the API for the given key.
   *
   * @param {string} key - The key used to retrieve the data.
   * @return {Promise<any>} A promise that resolves to the generated API.
   */
  async generateApi(key: string): Promise<any> {
    let input: string = await this.redisService.getJsonData(key);
    let relarr: any = [];
    let jdata: any = JSON.parse(input);
    let table = jdata.Entities;
    for (let i = 0; i < table.length; i++) {
      for (let j = 0; j < table[i].columns.length; j++) {
        if (table[i].columns[j].relationship) {
          let obj = {};
          obj["parent"] = table[i].columns[j].relationship[0].parent;
          obj["table"] = table[i].tname;
          obj["option"] =
            table[i].columns[j].relationship[0].isOptional[0].flag;
          relarr.push(obj);
        }
      }
    }

    /*--------------------- Create Torus_App and Base files   ----------------------------------*/
    //created path for which place will created apicreation tables
    let app_name: any = path.join(__dirname, "..", "Torus_App");
    // app_name = path.resolve(app_name, '..', 'Torus_App');    //"../" + app_name;
    // This function for create folder
    await this.CommonService.createFolder(app_name);
    // This function for create files inside the torus app
    //first parameter is template path for ejs file
    //second parameter is data for ejs file
    //third parameter is path for created file
    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/env.ejs",
      "",
      app_name + "/.env"
    );
    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/.eslintrc.ejs",
      "",
      app_name + "/.eslintrc.js"
    );
    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/gitignore.ejs",
      "",
      app_name + "/.gitignore"
    );
    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/prettierrc.ejs",
      "",
      app_name + "/.prettierrc"
    );
    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/nest-cli.ejs",
      "",
      app_name + "/nest-cli.json"
    );
    await this.CommonService.CreateSchemaFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/package-lock.ejs",
      "Torus_App",
      "",
      app_name + "/package-lock.json"
    );
    await this.CommonService.CreateSchemaFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/package.ejs",
      "Torus_App",
      "",
      app_name + "/package.json"
    );
    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/README.ejs",
      "",
      app_name + "/README.md"
    );
    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/tsconfig.build.ejs",
      "",
      app_name + "/tsconfig.build.json"
    );
    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/tsconfig.ejs",
      "",
      app_name + "/tsconfig.json"
    );

    /*--------------------- Create Prisma related files   ----------------------------------*/
    //created path for prisma folder inside the torus app
    let app_template_prisma_path: any = path.join(app_name, "prisma");
    // created folder for prisma in torus app
    await this.CommonService.createFolder(app_template_prisma_path);
    // created files for prisma in torus app
    let app_template_prismaSchema_path: any = path.join(
      app_template_prisma_path,
      "schema.prisma"
    );
    // created files for prisma in torus app using prisma.ejs file
    await this.CommonService.CreateSchemaFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/prisma.ejs",
      jdata,
      relarr,
      app_template_prismaSchema_path
    );

    /*--------------------- Create Casl related files   ----------------------------------*/
    //created path for casl folder inside the torus app
    let AppTemplateCaslPath: any = path.join(app_name, "src/ability");
    // created folder for casl in torus app
    await this.CommonService.createFolder(AppTemplateCaslPath);
    //This function used for getting json from redis 
    let userMatrixJson = await this.redisService.getJsonData(
      "GSS:ADF:TorusPOC:userMatrix"
    );
    userMatrixJson = JSON.parse(userMatrixJson);

    let userMatrixJdata = {
      jdata: [...jdata.Entities],
      users: [...userMatrixJson.users],
    };

    let userMatrix = [];
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
                  userName: "string",
                  tenantName: "string",
                  appGroupName: "string",
                  appName: "string",
                  roleName: "string",
                  resource: "string",
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
                  ].resource.startsWith("DF")
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
                    const [Fabric, type, tablename] = parts.split(":");
                    obj.resource = tablename;
                    obj.can.push(
                      userMatrixJson.users[i].tenantDetails[j].appGroupDetails[
                        k
                      ].appDetails[l].rolePolicyDetails[m].policy.Statement[n]
                        .actionAllowed[o].action
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
                        .actionDenied[p].action
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
/*---------------------- creating the casl files inside the casl folder-----------*/
    //first parameter is template path for ejs file
    //second parameter is data for ejs file
    //third parameter is also any given data for ejs file
    //forth parameter is path for created file 
    await this.CommonService.CreateSchemaFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/ability.factory.ejs",
      userMatrixJdata,
      userMatrix,
      AppTemplateCaslPath + "/ability.factory.ts"
    );

    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/ability.module.ejs",
      "",
      AppTemplateCaslPath + "/ability.module.ts"
    );

    await this.CommonService.CreateSchemaFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/ability.decorator.ejs",
      table,
      "",
      AppTemplateCaslPath + "/ability.decorator.ts"
    );

    await this.CommonService.CreateSchemaFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/ability.guard.ejs",
      "",
      "",
      AppTemplateCaslPath + "/ability.guard.ts"
    );

    /*--------------------- Create Main file   ----------------------------------*/
    //create a path for src folder 
    let app_template_src_path: any = path.join(app_name, "src");
    //this function used for create the src folder
    await this.CommonService.createFolder(app_template_src_path);
    //create the files inside the src folder
    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/main.ejs",
      "",
      app_template_src_path + "/main.ts"
    );

    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/prisma.service.ejs",
      "",
      app_template_src_path + "/prisma.service.ts"
    );

    let app_template_test_path: any = path.join(app_name, "test");
    await this.CommonService.createFolder(app_template_test_path);
    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/app.e2e-spec.ejs",
      "",
      app_template_test_path + "/app.e2e-spec.ts"
    );
    await this.CommonService.createFile(
      "./src/cg-AppTemplate/ApiCodeGenerationEjs/jest-e2e.ejs",
      "",
      app_template_test_path + "/jest-e2e.json"
    );
    await this.CreateDir(jdata, app_template_src_path);

    return "Completed";
  }

  // async CreateSchemaFile(template, data, relation, path) {
  //   try {
  //     let objtemplate: any = await this.ReadFile(template);
  //     let fn = ejs.compile(objtemplate);
  //     let str = fn({
  //       data: data,
  //       relation: relation,
  //     });
  //     if (str != '') {
  //       fs.writeFileSync(path, str);
  //     }
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // async ReadFile(strReadPath: any) {
  //   try {
  //     return await fs.readFileSync(strReadPath, 'utf8');
  //   } catch (error) {
  //     throw error;
  //   }
  // }
 /**
   * Creates a directory based on the provided JSON data and path.
   *
   * @param {JSON} strReadPath - The JSON data containing the directory information.
   * @param {String} path - The path where the directory will be created.
   * @return {Promise<JSON>} - The updated JSON data.
   */
  async CreateDir(strReadPath: JSON, path: String) {
    try {
      let jsondata: any = strReadPath;
      let tables: any = jsondata.Entities;
      let tablecount: any = tables.length;

      /*--------------------- Create Entity files   ----------------------------------*/
      for (let i = 0; i < tablecount; i++) {
        let tabName: any = tables[i].tname;
        await this.CommonService.createFolder(path + "/" + tabName);
        await this.CommonService.createFolder(
          path + "/" + tabName + "/" + "entity"
        );
        let column: any = tables[i].methods;
        let columnForEntity: any = tables[i].columns;
        //first parameter is template path for ejs file
        //second parameter is data for ejs file
        //third parameter is also any given data for ejs file
        //forth parameter is path for created file in the folder
        await this.CommonService.CreateSchemaFile(
          "./src/cg-AppTemplate/ApiCodeGenerationEjs/service.ejs",
          column,
          tabName,
          path + "/" + tabName + "/" + tabName + ".service.ts"
        );
        await this.CommonService.CreateSchemaFile(
          "./src/cg-AppTemplate/ApiCodeGenerationEjs/controller.ejs",
          column,
          tabName,
          path + "/" + tabName + "/" + tabName + ".controller.ts"
        );
        await this.CommonService.CreateSchemaFile(
          "./src/cg-AppTemplate/ApiCodeGenerationEjs/enitity.ejs",
          columnForEntity,
          tabName,
          path + "/" + tabName + "/" + "entity" + "/" + tabName + ".entity.ts"
        );

        await this.CommonService.CreateSchemaFile(
          "./src/cg-AppTemplate/ApiCodeGenerationEjs/module.ejs",
          "",
          tabName,
          path + "/" + tabName + "/" + tabName + ".module.ts"
        );
        await this.CommonService.CreateSchemaFile(
          "./src/cg-AppTemplate/ApiCodeGenerationEjs/app.module.ejs",
          jsondata.Entities,
          "",
          path + "/" + "app.module.ts"
        );
      }
      return await jsondata;
    } catch (error) {
      throw error;
    }
  }
  // async createFolder(foldername: string) {
  //   // let strroot_path: string = path.join('src', foldername)
  //   fs.mkdirSync(foldername, { recursive: true });
  //   return await 'success';
  // }
  // async createFile(template, data, path) {
  //   try {
  //     let objtemplate: any = await this.ReadFile(template);

  //     let fn = ejs.compile(objtemplate);
  //     let str = fn(data);
  //     if (str != '') {
  //       fs.writeFileSync(path, str);
  //     }
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}
