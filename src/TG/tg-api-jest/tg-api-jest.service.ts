import { Injectable } from '@nestjs/common';
import * as path from 'path';
import 'dotenv/config';
import { TG_CommonService } from 'src/TG/tg-common/tg-common.service';
import { RedisService } from 'src/redisService';


@Injectable()
export class TG_API_JestService {
    /**
     * The CG_API_JestService class is used to generate a Nest application for DF
     * with the ER API JSON and generated test files for end-to-end testing.
     *
     * Constructor for CG_API_JestService class.
     * @param {TG_CommonService} CommonService - The CommonService instance.
     * @param {RedisService} redisService - The RedisService instance.
     */
    constructor(private readonly CommonService: TG_CommonService,
    private readonly redisService: RedisService
    ) {}
    /**
     * Generate code for testing based on the provided key.
     *
     * @param {string} key - the key used to fetch data for code generation
     * @return {Promise<any>} a Promise that resolves once the code is successfully generated
     */
    async generatecodefortesting(key: string): Promise<any> {
        let sessionInfo = {
            key:'',
            token:''
        }

    let input: string = await this.redisService.getJsonData(key);
    let relarr: any = [];
    let jdata: any = JSON.parse(input);
    let table = jdata.Entities;
    //create a path for Torus_App_Jest app outside the src folder
    let app_name: any = path.join(__dirname,'..', "Torus_App_Jest");
    //create a path for test folder inside Torus_App_Jest app
    let app_template_test_path: any = path.join(app_name, "test");
    //collect the tables relationship in an obj(object)
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
    //create folder for Torus_App_Jest app
    await this.CommonService.createFolder(app_name);
    //first parameter is template path for ejs file
    //second parameter is data for ejs file
    //thrd parameter is path for created file 
    await this.CommonService.createFile(
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/env.ejs", 
        "",
        app_name + "/.env");
    await this.CommonService.createFile(
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/.eslintrc.ejs",
        "",
        app_name + "/.eslintrc.js"
    );
    await this.CommonService.createFile(
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/gitignore.ejs",
        "",
        app_name + "/.gitignore"
    );
    await this.CommonService.createFile(
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/prettierrc.ejs",
        "",
        app_name + "/.prettierrc"
    );
    await this.CommonService.createFile(
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/nest-cli.ejs",
        "",
        app_name + "/nest-cli.json"
    );
    await this.CommonService.CreateSchemaFile(
        sessionInfo,
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/package-lock.ejs",
        "Torus_App",
        "",
        app_name + "/package-lock.json"
    );
    await this.CommonService.CreateSchemaFile(
        sessionInfo,
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/package.ejs",
        "Torus_App",
        "",
        app_name + "/package.json"
    );
    await this.CommonService.createFile(
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/README.ejs",
        "",
        app_name + "/README.md"
    );
    await this.CommonService.createFile(
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/tsconfig.build.ejs",
        "",
        app_name + "/tsconfig.build.json"
    );
    await this.CommonService.createFile(
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/tsconfig.ejs",
        "",
        app_name + "/tsconfig.json"
    );

    /*--------------------- Create Prisma related files   ----------------------------------*/
    //created path for prisma folder inside the Torus_App_Jest app
    let app_template_prisma_path: any = path.join(app_name, "prisma");
    await this.CommonService.createFolder(app_template_prisma_path);

    let app_template_prismaSchema_path: any = path.join(
        app_template_prisma_path,
        "schema.prisma"
    );

    await this.CommonService.CreateSchemaFile(
        sessionInfo,
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/prisma.ejs",
        jdata,
        relarr,
        app_template_prismaSchema_path
    );

    /*--------------------- Create Casl related files   ----------------------------------*/
    //created path for casl folder inside the Torus_App_Jest app
    let AppTemplateCaslPath: any = path.join(app_name, "src/ability");
    // created folder for casl in Torus_App_Jest app
    await this.CommonService.createFolder(AppTemplateCaslPath);

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
    //first parameter is template path for ejs file
    //second parameter is data for ejs file
    //third parameter is also any given data for ejs file
    //forth parameter is path for created file 
    await this.CommonService.CreateSchemaFile(
        sessionInfo,
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/ability.factory.ejs",
        userMatrixJdata,
        userMatrix,
        AppTemplateCaslPath + "/ability.factory.ts"
    );
    //first parameter is template path for ejs file
    //second parameter is data for ejs file
    //third parameter is path for created file 
    await this.CommonService.createFile(
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/ability.module.ejs",
        "",
        AppTemplateCaslPath + "/ability.module.ts"
    );

    await this.CommonService.CreateSchemaFile(
        sessionInfo,
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/ability.decorator.ejs",
        table,
        "",
        AppTemplateCaslPath + "/ability.decorator.ts"
    );

    await this.CommonService.CreateSchemaFile(
        sessionInfo,
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/ability.guard.ejs",
        "",
        "",
        AppTemplateCaslPath + "/ability.guard.ts"
    );

    /*--------------------- Create Main file   ----------------------------------*/

    let app_template_src_path: any = path.join(app_name, "src");

    await this.CommonService.createFolder(app_template_src_path);
    await this.CommonService.createFile(
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/main.ejs",
        "",
        app_template_src_path + "/main.ts"
    );
    /*--------------------- Create Prisma service   ----------------------------------*/
    let tableArray: string[] = [];
    for (let i = 0; i < jdata.Entities.length; i++) {
        let tableName: string = jdata.Entities[i].tname;
        tableArray.push(tableName);
    }

    await this.CommonService.CreateSchemaFile(
        sessionInfo,
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/prisma.service.ejs",
        tableArray,
        "",
        app_template_src_path + "/prisma.service.ts"
    );

    
    await this.CommonService.createFolder(app_template_test_path);
    await this.CommonService.createFile(
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/app.e2e-spec.ejs",
        "",
        app_template_test_path + "/app.e2e-spec.ts"
    );
    await this.CommonService.createFile(
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/jest-e2e.ejs",
        "",
        app_template_test_path + "/jest-e2e.json"
    );
    await this.CreateDir1(jdata, app_template_src_path);

    return 'Dynamically generated code successfully';
    }

    /**
     * Asynchronously creates a directory structure based on the provided JSON data.
     *
     * @param {JSON} strReadPath - The JSON data containing the entities to create.
     * @param {any} paths - The path to the directory where the entities will be created.
     * @return {Promise<JSON>} A promise that resolves to the provided JSON data.
     * @throws {Error} If an error occurs during the directory creation process.
     */
    async CreateDir1(strReadPath: JSON, paths: any) {
        let sessionInfo = {
            key:'',
            token:''
        }
    try {
        let jsondata: any = strReadPath;
        let tables: any = jsondata.Entities;
        let tablecount: any = tables.length;
        let app_name: any = path.join(__dirname,'..', "Torus_App_Jest");
        let app_template_test_path: any = path.join(app_name, "test");
        
        
    /*--------------------- Create Entity files   ----------------------------------*/
    //created path for test folder inside Torus_App
    let testPath: any = __dirname + "Torus_App" + "/" + "test";
    //created table folder inside the test folder
    for (let i = 0; i < tablecount; i++) {
        let tabName: any = tables[i].tname;
        await this.CommonService.createFolder(paths + "/" + tabName);
        await this.CommonService.createFolder(paths + "/" + tabName + "/" + "entity");
        let column: any = tables[i].methods;

        let columnForEntity: any = tables[i].columns;
        await this.CommonService.CreateSchemaFile(
        sessionInfo,
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/service.ejs",
        column,
        tabName,
        paths + "/" + tabName + "/" + tabName + ".service.ts"
        );

        await this.CommonService.CreateSchemaFile(
        sessionInfo,
        "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/controller.ejs",
        column,
        tabName,
        paths + "/" + tabName + "/" + tabName + ".controller.ts"
        );
    /*--------------------- Preapare E2E   ----------------------------------*/
    let data = jsondata.Entities;
    /**
 * Deletes the order of the given data by performing a depth-first search.
 *
 * @param {Array} data - The data to delete the order from.
 * @return {Array} The reversed stack of nodes after deleting the order.
 */
    function deleteOrder(data) {
    const visited = new Set();
    const stack = [];
    /**
     * A depth-first search function that visits nodes and pushes them onto a stack.
     *
     * @param {type} node - description of parameter
     * @return {type} description of return value
     */
    function dfs(node) {
        visited.add(node);

        for (const relationship of node.columns) {
        const childTable = data.find(
            (table) => table.tname === relationship.parent
        );
        if (childTable && !visited.has(childTable)) {
            dfs(childTable);
        }
        }

        stack.push(node);
    }

    for (const table of data) {
        if (!visited.has(table)) {
        dfs(table);
        }
    }

    return stack.reverse();
    }

    const deletionOrder = deleteOrder(data);
    let entityDeleteOrder = deletionOrder.map((table) => table.tname);
    
    //This functions used to created test files
    await this.CommonService.CreateFileWithThreeParam(
    sessionInfo,
    "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/e2e.spec.ejs",
    tables[i],
    tabName,
    jsondata,
    entityDeleteOrder,
    app_template_test_path +
        "/" +
        tabName +
        ".e2e-spec.ts"
    );
    await this.CommonService.CreateSchemaFile(
    sessionInfo,
    "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/enitity.ejs",
    columnForEntity,
    tabName,
    paths + "/" + tabName + "/" + "entity" + "/" + tabName + ".entity.ts"
    );

    await this.CommonService.CreateSchemaFile(
    sessionInfo,
    "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/module.ejs",
    "",
    tabName,
    paths + "/" + tabName + "/" + tabName + ".module.ts"
    );
    await this.CommonService.CreateSchemaFile(
    sessionInfo,
    "./src/TG/tg-AppTemplate/APIGenerationWithIAMJestEJS/app.module.ejs",
    jsondata.Entities,
    "",
    paths + "/" + "app.module.ts"
    );
}
return await jsondata;
} catch (error) {
throw error;
}
}

}
