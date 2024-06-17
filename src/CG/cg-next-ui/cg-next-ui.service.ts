import { Injectable } from '@nestjs/common';
import * as path from 'path';

import 'dotenv/config';
import { CG_CommonService } from 'src/CG/cg-common/cg-common.service';
import { RedisService } from 'src/redisService';


@Injectable()
export class CG_NextUiService {
  /**
   * The CG_NextUiService class is used to generate a Next application for UF table component
   * with the ER API and basic security JSON.
   * Constructor for the CG_NextUiService class.
   *
   * @param {CG_CommonService} CommonService - The CommonService instance.
   * @param {RedisService} redisService - The RedisService instance.
   */
  constructor(private readonly CommonService: CG_CommonService,
    private readonly redisService: RedisService
    ) {}

    /**
     * Generate API function to dynamically create NextUI and Base files
     *
     * @param {string} key - the key used for API generation
     * @return {Promise<any>} a Promise that resolves when code generation is successful
     */
    async generateApi(key: string): Promise<any> {
      //create a path for TorusAppUF app outside the dist folder
      let app_name: any = path.join(__dirname,'..','TorusAppUF');
      let compInput: string = await this.redisService.getJsonData(key);
      let tabInput: string = await this.redisService.getJsonData('TEST:UF');
  
      let compData: any = structuredClone(JSON.parse(compInput));
      let tabData: any = structuredClone(JSON.parse(tabInput));
  
      /*--------------------- Create NextUI and Base files   ----------------------------------*/
  
      await this.CommonService.createFolder(app_name);
      await this.CommonService.createFolder(app_name + '/app');
      //first parameter is template path for ejs file
      //second parameter is data for ejs file
      //third parameter is path for created file 
      await this.CommonService.createFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/tsconfig.ejs',
        '',
        app_name + '/tsconfig.json',
      );
      await this.CommonService.createFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/tailwind.config.ejs',
        '',
        app_name + '/tailwind.config.ts',
      );
      await this.CommonService.createFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/README.ejs',
        '',
        app_name + '/README.md',
      );
      await this.CommonService.createFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/postcss.config.ejs',
        '',
        app_name + '/postcss.config.js',
      );
      await this.CommonService.CreateSchemaFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/package.ejs',
        '',
        '',
        app_name + '/package.json',
      );
      await this.CommonService.CreateSchemaFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/package-lock.ejs',
        'Flowbite',
        '',
        app_name + '/package-lock.json',
      );
      await this.CommonService.createFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/next.config.ejs',
        '',
        app_name + '/next.config.js',
      );
      await this.CommonService.createFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/next-env.d.ejs',
        '',
        app_name + '/next-env.d.ts',
      );
      await this.CommonService.createFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/.prettierrc.ejs',
        '',
        app_name + '/.prettierrc',
      );
      await this.CommonService.createFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/.npmrc.ejs',
        '',
        app_name + '/.npmrc',
      );
      await this.CommonService.createFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/gitignore.ejs',
        '',
        app_name + '/.gitignore',
      );
      await this.CommonService.createFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/.eslintrc.json.ejs',
        '',
        app_name + '/.eslintrc.json',
      );
      await this.CommonService.createFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/.env.local.ejs',
        '',
        app_name + '/.env.local',
      );
  
      await this.CommonService.CreateSchemaFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/layout.ejs',
        compData,
        '',
        app_name + '/app' + '/layout.tsx',
      );
      await this.CommonService.CreateSchemaFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/page.ejs',
        compData,
        '',
        app_name + '/app' + '/page.tsx',
      );
      await this.CommonService.createFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/global.css.ejs',
        '',
        app_name + '/app' + '/globals.css',
      );
      await this.CommonService.CreateSchemaFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/providers.ejs',
        '',
        '',
        app_name + '/app' + '/providers.tsx',
      );
  
      /*--------------------- Create files for Components   ----------------------------------*/
  
      await this.CommonService.createFolder(app_name + '/app' + '/components');
  
      await this.CommonService.CreateSchemaFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/AppHeader.ejs',
        '',
        '',
        app_name + '/app' + '/components' + '/AppHeader.tsx',
      );
  
      await this.CommonService.CreateSchemaFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/IconsHead.ejs',
        '',
        '',
        app_name + '/app' + '/components' + '/IconsHead.tsx',
      );
      await this.CommonService.CreateSchemaFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/logo.ejs',
        '',
        '',
        app_name + '/app' + '/components' + '/Logo.tsx',
      );
      await this.CommonService.CreateSchemaFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/themeSwitcher.ejs',
        '',
        '',
        app_name + '/app' + '/components' + '/ThemeSwitcher.tsx',
      );
      await this.CommonService.CreateSchemaFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/sideNav.ejs',
        compData,
        '',
        app_name + '/app' + '/components' + '/sideNav.tsx',
      );
      await this.CommonService.CreateSchemaFile(
        './src/cg-AppTemplate/NextuiCodeGenerationEjs/icons.ejs',
        '',
        '',
        app_name + '/app' + '/components' + '/icons.tsx',
      );
  
      /*--------------------- Create files for Table Component   ----------------------------------*/
      for (let i = 0; i < compData.pageGroupDetails.length; i++) {
        for (
          let j = 0;
          j < compData.pageGroupDetails[i].pageDetails.length;
          j++
        ) {
          for (
            let k = 0;
            k < compData.pageGroupDetails[i].pageDetails[j].components.length;
            k++
          ) {
            if (
              compData.pageGroupDetails[i].pageDetails[j].components[k].type ===
              'Table With CRUD'
            ) {
              await this.CommonService.createFolder(
                app_name +
                  '/app/' +
                  compData.pageGroupDetails[i].pageDetails[j].pageName,
              );
              await this.CommonService.CreateSchemaFile(
                './src/cg-AppTemplate/NextuiCodeGenerationEjs/tablePage.ejs',
                compData.pageGroupDetails[i].pageDetails[j].components[k]
                  .TableName,
                compData.pageGroupDetails[i].pageDetails[j].pageName,
                app_name +
                  '/app/' +
                  compData.pageGroupDetails[i].pageDetails[j].pageName +
                  '/page.tsx',
              );
  
              let tableInput: string = await this.redisService.getJsonData(
                compData.pageGroupDetails[i].pageDetails[j].components[k].key,
              );
              let tableData: any = structuredClone(JSON.parse(tableInput));
  
              await this.CommonService.CreateSchemaFile(
                './src/cg-AppTemplate/NextuiCodeGenerationEjs/tableEditModal.ejs',
                tableData,
                compData.pageGroupDetails[i].pageDetails[j].pageName,
                app_name +
                  '/app/' +
                  compData.pageGroupDetails[i].pageDetails[j].pageName +
                  '/' +
                  compData.pageGroupDetails[i].pageDetails[j].components[k]
                    .TableName +
                  'EditModal.tsx',
              );
  
              await this.CommonService.CreateSchemaFile(
                './src/cg-AppTemplate/NextuiCodeGenerationEjs/tableColumn.ejs',
                tableData,
                compData.pageGroupDetails[i].pageDetails[j].pageName,
                app_name +
                  '/app/' +
                  compData.pageGroupDetails[i].pageDetails[j].pageName +
                  '/columns.tsx',
              );
              await this.CommonService.CreateSchemaFile(
                './src/cg-AppTemplate/NextuiCodeGenerationEjs/table.ejs',
                tableData,
                compData.pageGroupDetails[i].pageDetails[j].components[k]
                  .searchFilterColumn,
                app_name +
                  '/app/' +
                  compData.pageGroupDetails[i].pageDetails[j].pageName +
                  '/' +
                  compData.pageGroupDetails[i].pageDetails[j].components[k]
                    .TableName +
                  'Table.tsx',
              );
              await this.CommonService.CreateSchemaFile(
                './src/cg-AppTemplate/NextuiCodeGenerationEjs/tableDeleteModal.ejs',
                compData.pageGroupDetails[i].pageDetails[j].components[k]
                  .TableName,
                compData.pageGroupDetails[i].pageDetails[j].pageName,
                app_name +
                  '/app/' +
                  compData.pageGroupDetails[i].pageDetails[j].pageName +
                  '/' +
                  compData.pageGroupDetails[i].pageDetails[j].components[k]
                    .TableName +
                  'DeleteModal.tsx',
              );
              await this.CommonService.CreateSchemaFile(
                './src/cg-AppTemplate/NextuiCodeGenerationEjs/tableCreateModal.ejs',
                tableData,
                compData.pageGroupDetails[i].pageDetails[j].pageName,
                app_name +
                  '/app/' +
                  compData.pageGroupDetails[i].pageDetails[j].pageName +
                  '/' +
                  compData.pageGroupDetails[i].pageDetails[j].components[k]
                    .TableName +
                  'CreateModal.tsx',
              );
            } else {
            }
          }
        }
      }
  
      return 'Dynamically generated code successfully';
    }
  
    /**
     * Creates a directory structure and generates entity files based on the provided JSON data.
     *
     * @param {JSON} strReadPath - The JSON data used to create the directory structure and entity files.
     * @param {String} path - The path where the directory structure and entity files will be created.
     * @return {Promise<JSON>} - A promise that resolves with the JSON data after the directory structure and entity files have been created.
     */
    async CreateDir(strReadPath: JSON, path: String) {
      try {
        let jsondata: any = strReadPath;
        let tables: any = jsondata.Entities;
        let tablecount: any = tables.length;
  
        /*--------------------- Create Entity files   ----------------------------------*/
        for (let i = 0; i < tablecount; i++) {
          let tabName: any = tables[i].tname;
          await this.CommonService.createFolder(path + '/' + tabName);
          await this.CommonService.createFolder(
            path + '/' + tabName + '/' + 'entity',
          );
          let column: any = tables[i].methods;
          let columnForEntity: any = tables[i].columns;
          await this.CommonService.CreateSchemaFile(
            './src/cg-AppTemplate/NextuiCodeGenerationEjs/service.ejs',
            column,
            tabName,
            path + '/' + tabName + '/' + tabName + '.service.ts',
          );
          await this.CommonService.CreateSchemaFile(
            './src/cg-AppTemplate/NextuiCodeGenerationEjs/controller.ejs',
            column,
            tabName,
            path + '/' + tabName + '/' + tabName + '.controller.ts',
          );
          await this.CommonService.CreateSchemaFile(
            './src/cg-AppTemplate/NextuiCodeGenerationEjs/enitity.ejs',
            columnForEntity,
            tabName,
            path + '/' + tabName + '/' + 'entity' + '/' + tabName + '.entity.ts',
          );
  
          await this.CommonService.CreateSchemaFile(
            './src/cg-AppTemplate/NextuiCodeGenerationEjs/module.ejs',
            '',
            tabName,
            path + '/' + tabName + '/' + tabName + '.module.ts',
          );
          await this.CommonService.CreateSchemaFile(
            './src/cg-AppTemplate/NextuiCodeGenerationEjs/app.module.ejs',
            jsondata.Entities,
            '',
            path + '/' + 'app.module.ts',
          );
        }
        return await jsondata;
      } catch (error) {
        throw error;
      }
    }
}
