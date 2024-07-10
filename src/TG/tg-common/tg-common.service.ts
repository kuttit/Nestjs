import { HttpStatus, Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import * as fs from 'fs';
import { CommonService } from 'src/commonService';
import { errorObj } from '../Interfaces/errorObj.interface';
import { sessionInfo } from '../Interfaces/sessionInfo.tgCommon.interface';

@Injectable()
export class TG_CommonService {
  constructor(private readonly commonService: CommonService  ) {}

  /**
   * Asynchronously creates a schema file based on the provided template, data, relation, and path.
   *
   * @param {any} template - The template used for schema creation.
   * @param {any} data - The data to be used in the schema.
   * @param {any} relation - The relation of the schema.
   * @param {string} path - The path where the schema file will be written.
   * @return {void} This function does not return a value.
   */
  async CreateSchemaFile(sessionInfo:sessionInfo,sourcePath:string, data:any, relation:any, targetPath:string) {
    const token = sessionInfo.token;
    const keys = sessionInfo.key;
    try {
      let objtemplate: any = await this.ReadFile(sourcePath,sessionInfo);
      let fn : any= ejs.compile(objtemplate);
      let str: any = fn({
        data: data,
        relation: relation,
      });
      if (str != '') {
        fs.writeFileSync(targetPath, str);
      }
    } catch (error) {
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp:'Technical',
        fabric:'ALL',
        errType:'Fatal',
        errCode:'TG013',
      }
      const errorMessage = 'Invalid ejs file';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        keys,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }
  }

  /**
   * Asynchronously reads the contents of a file at the specified path and returns it as a string.
   *
   * @param {any} strReadPath - The path of the file to be read.
   * @return {Promise<string>} A promise that resolves to the contents of the file as a string.
   * @throws {Error} If there is an error reading the file.
   */
  async ReadFile(filePath: string,sessionInfo:sessionInfo) {
    const token:string = sessionInfo.token;
    const keys:string = sessionInfo.key;
    try {
      return await fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp:'Technical',
        fabric:'ALL',
        errType:'Fatal',
        errCode:'TG012',
      }
      const errorMessage:string = 'File not found';
      const statusCode:number = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj:any = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        keys,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }
  }

  /**
   * Asynchronously creates a folder with the given name.
   *
   * @param {string} foldername - The name of the folder to create.
   * @return {Promise<string>} A promise that resolves to 'success' when the folder is created.
   */
  async createFolder(folderName: string) {
    // let strroot_path: string = path.join('src', foldername)
    fs.mkdirSync(folderName, { recursive: true });
    return await 'success';
  }
  /**
   * Asynchronously creates a file based on the provided template, data, and path.
   *
   * @param {any} template - The template used for file creation.
   * @param {any} data - The data to be used in the file.
   * @param {string} path - The path where the file will be written.
   * @return {Promise<void>} A promise that resolves when the file is created.
   * @throws {Error} If there is an error reading the template or writing the file.
   */
  async createFile(template, data, path) {
    try {
      let objtemplate: any //= await this.ReadFile(template,'');

      let fn = ejs.compile(objtemplate);
      let str = fn(data);
      if (str != '') {
        fs.writeFileSync(path, str);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Asynchronously creates a file based on the provided template, data, relation, data1, and data2, and writes it to the specified path.
   *
   * @param {any} template - The path of the template file.
   * @param {any} data - The data to be used in the file.
   * @param {any} relation - The relation of the data.
   * @param {any} data1 - Additional data.
   * @param {any} data2 - Additional data.
   * @param {string} path - The path where the file will be written.
   * @return {Promise<void>} A promise that resolves when the file is created.
   * @throws {Error} If there is an error reading the template or writing the file.
   */
  async CreateFileWithThreeParam(sessionInfo:sessionInfo,sourcePath:string, data:any, relation:any, data1:any, data2:any, targetPath:string) {
    const token:string = sessionInfo.token;
    const keys:string = sessionInfo.key;
    
      let objtemplate: any = await this.ReadFile(sourcePath,sessionInfo);
      try {
      let fn: any = ejs.compile(objtemplate);
      let str :any= fn({
        data: data,
        relation: relation,
        data1: data1,
        data2: data2,
      });
      if (str != '') {
        fs.writeFileSync(targetPath, str);
      }
    } catch (error) {
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp:'Technical',
        fabric:'ALL',
        errType:'Fatal',
        errCode:'TG013',
      }
      const errorMessage = 'Invalid ejs file';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        keys,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }
  }

  async copyFile(sessionInfo:sessionInfo,sourcePath:string, targetPath:string) {
    const token = sessionInfo.token;
    const keys = sessionInfo.key;
    try {
      fs.copyFileSync(sourcePath, targetPath);
      
    } catch (error) {
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp:'Technical',
        fabric:'ALL',
        errType:'Fatal',
        errCode:'TG012',
      }
      const errorMessage = 'File not found';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        keys,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }
  }


}
