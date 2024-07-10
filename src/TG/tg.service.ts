import { HttpStatus, Injectable } from '@nestjs/common';
import { TgDfService } from './tg-df/tg-df.service';
import { TgUfService } from './tg-uf/tg-uf.service';
import { RedisService } from 'src/redisService';
import { CommonService } from 'src/commonService';
import { errorObj } from './Interfaces/errorObj.interface';
import { Keys } from './Interfaces/keys.tg.interface';

@Injectable()
export class TgService {
  constructor(
    private readonly DFSevice: TgDfService,
    private readonly UFService: TgUfService,
    private readonly redisService: RedisService,
    private readonly commonService: CommonService,
  ) {}
  async codeGeneration(key, token): Promise<any> {
    let assemblerKey: string;
    let keyParts: string[];
    let tenentName: string;
    let appGroupName: string;
    let appName: string;
    let assemblerData: any;
    const screenDetails: any = [];
    let navbarData: any;
    assemblerKey = key;
    keyParts = assemblerKey.split(':');
    tenentName = keyParts[0];
    appGroupName = keyParts[1];
    appName = keyParts[2];
    if(!assemblerKey || assemblerKey === ''){
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'AK',
        errType: 'Fatal',
        errCode: 'TG001',
      };
      const errorMessage: string = 'Assembler Key not found';
      const statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj: any = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        assemblerKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }
    assemblerData = structuredClone(JSON.parse(await this.redisService.getJsonData(assemblerKey)),);
    if(!assemblerData || assemblerData === ''){
      let errorObj: errorObj = {
        tname: 'TG',
        errGrp: 'Technical',
        fabric: 'AK',
        errType: 'Fatal',
        errCode: 'TG002',
      };
      const errorMessage: string = 'Invalid Assembler Key';
      const statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
      let errObj: any = await this.commonService.commonErrorLogs(
        errorObj,
        token,
        assemblerKey,
        errorMessage,
        statusCode,
      );
      throw errObj;
    }
      // Iterate through each object in assemblerData
      if (assemblerData.menuGroup.length > 0) {
        assemblerData.menuGroup.forEach((dataObj) => {
          // Iterate through each menu group in the current object
          if (Object.keys(dataObj).length > 0) {
            Object.keys(dataObj).forEach((menuGroup) => {
              const items: any = dataObj[menuGroup];
              // Iterate through each item in the menu group
              if (items.length > 0) {
                items.forEach((item) => {
                  Object.entries(item).forEach(([key, value]) => {
                    const df: string = value['df']
                      ? value['df']['modelkey']
                      : '';
                    const uf: string = value['uf']
                      ? value['uf']['modelkey']
                      : '';
                    const pf: string = value['pf']
                      ? value['pf']['modelkey']
                      : '';
                    const sf: string = value['sf']
                      ? value['sf']['modelkey']
                      : '';
                    const event: string = value['uf']
                      ? value['uf']['events']
                      : '';
                    screenDetails.push({
                      menuGroup: menuGroup,
                      screenName: key,
                      DF: df,
                      UF: uf,
                      PF: pf,
                      SF: sf,
                      event: event[0],
                    });
                  });
                });
              }
            });
          }
        });
      }

      // return screenDetails

      navbarData = screenDetails.reduce(
        (acc, { menuGroup, screenName, SF, UF }) => {
          const formattedScreenName = `${screenName}-${SF}-${UF}`;

          const menuGroupObj: any = acc.find(
            (item) => item.menuGroup === menuGroup,
          );
          if (menuGroupObj) {
            menuGroupObj.screenName.push(formattedScreenName);
          } else {
            acc.push({ menuGroup, screenName: [formattedScreenName] });
          }

          return acc;
        },
        [],
      );

      // return navbarData
    

      let screensNames: string[] = [];
      if (screenDetails.length > 0) {
        for (let i = 0; i < screenDetails.length; i++) {
          screensNames.push(screenDetails[i].screenName);
        }
      }
      //  return screenDetails;
      let dfCgDataArray: any = [];
      if (screenDetails.length > 0) {
        for (let i = 0; i < screenDetails.length; i++) {
          let defKeys: Keys = {
            aKey: assemblerKey,
            ufKey: screenDetails[i].UF,
            pfKey:
              tenentName +
              ':' +
              appGroupName +
              ':' +
              appName +
              ':' +
              'PF:SSH:v1',
            eventKey: screenDetails[i].event,
            sfKey: screenDetails[i].SF,
            navbarData: navbarData,
          };
          let keys: Keys = {
            aKey: assemblerKey,
            dfKey: screenDetails[i].DF,
            ufKey: screenDetails[i].UF,
            pfKey: screenDetails[i].PF,
            eventKey: screenDetails[i].event,
            sfKey: screenDetails[i].SF,
            navbarData: navbarData,
          };
          // return keys
          // console.log(screenDetails[i].DF);
     
            let dfCgData: any = await this.DFSevice.prepareDataForDynamicFiles(
              keys,
              token,
            );
            console.log(dfCgData);
            dfCgDataArray.push(dfCgData);

            if (i === screenDetails.length - 1) {
              await this.DFSevice.generateStaticFiles(assemblerKey, token);
              let dfData: any = await this.DFSevice.mergeData(dfCgDataArray);
              await this.DFSevice.generateDynamicFiles(keys, dfData, token);
            }

          if (screenDetails[i].PF !== '') {
            if (i === 0) {
              await this.UFService.generateStaticFiles(
                keys,
                screensNames,
                token,
              );
            }
            await this.UFService.generateScreenSpecificFiles(keys, token);
          } else {
            if (i === 0) {
              await this.UFService.generateStaticFiles(
                defKeys,
                screensNames,
                token,
              );
            }
            await this.UFService.generateScreenSpecificFiles(defKeys, token);
          }
        }
      }
      // return cgDataArray
      return 'Code Generation Completed';
   
  }
}
