import { Injectable } from '@nestjs/common';
import { TgErApiSecurityService } from './tg-er-api-security/tg-er-api-security.service';
import { TgTorusComponentsService } from './tg-torus-components/tg-torus-components.service';
import { RedisService } from 'src/redisService';

@Injectable()
export class TgService {
  constructor(
    private readonly DFSevice: TgErApiSecurityService,
    private readonly UFService: TgTorusComponentsService,
    private readonly redisService: RedisService,
  ) {}
  async codeGeneration(key): Promise<any> {
    const assemblerKey: any = key;
    const keyParts:any = assemblerKey.split(':');
    const tenentName = keyParts[0];
    const appGroupName = keyParts[1];
    const appName = keyParts[2];
    const assemblerData: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(assemblerKey)),
    );
    const screenDetails = [];

    // Iterate through each object in assemblerData
    assemblerData.menuGroup.forEach((dataObj) => {
      // Iterate through each menu group in the current object
      Object.keys(dataObj).forEach((menuGroup) => {
        const items = dataObj[menuGroup];
        // Iterate through each item in the menu group
        items.forEach((item) => {
          Object.entries(item).forEach(([key, value]) => {
            const df = value['df'] ? value['df']['modelkey'] : '';
            const uf = value['uf'] ? value['uf']['modelkey'] : '';
            const pf = value['pf'] ? value['pf']['modelkey'] : '';
            const sf = value['sf'] ? value['sf']['modelkey'] : '';
            const event = value['uf'] ? value['uf']['events'] : '';
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
      });
    });
    
    // return screenDetails
    
    const navbarData = screenDetails.reduce((acc, { menuGroup, screenName, SF, UF }) => {
      const formattedScreenName = `${screenName}-${SF}-${UF}`;
      
      const menuGroupObj = acc.find(item => item.menuGroup === menuGroup);
      if (menuGroupObj) {
          menuGroupObj.screenName.push(formattedScreenName);
      } else {
          acc.push({ menuGroup, screenName: [formattedScreenName] });
      }
      
      return acc;
  }, []);

    // return navbarData

    let screensNames: string[] = [];
    for (let i = 0; i < screenDetails.length; i++) {
      screensNames.push(screenDetails[i].screenName);
    }
    //  return screenDetails;
    let dfCgDataArray: any = [];
    for (let i = 0; i < screenDetails.length; i++) {
      let defKeys : any = {
        aKey: assemblerKey,
        ufKey: screenDetails[i].UF,
        pfKey: tenentName+':'+appGroupName+':'+appName+':'+'PF:SSH:v1',
        eventKey: screenDetails[i].event,
        sfKey: screenDetails[i].SF,
        navbarData: navbarData,
      }
      let keys: any = {
        aKey: assemblerKey,
        ufKey: screenDetails[i].UF,
        pfKey: screenDetails[i].PF,
        eventKey: screenDetails[i].event,
        sfKey: screenDetails[i].SF,
        navbarData: navbarData,
      }
      // console.log(screenDetails[i].DF);
      if (screenDetails[i].DF !== '') {
      let dfCgData:any = await this.DFSevice.prepareDataForDynamicFiles(screenDetails[i].DF,screenDetails[i].SF) 
      // console.log(cgData);
      dfCgDataArray.push(dfCgData)
      if (i === screenDetails.length - 1) {
        await this.DFSevice.generateStaticFiles(assemblerKey);
        let dfData: any = await this.DFSevice.mergeData(dfCgDataArray)
        let res = await this.DFSevice.generateDynamicFiles(assemblerKey,dfData,screenDetails[i].SF)
        
        }
      }
      
      if (screenDetails[i].UF !== '' && screenDetails[i].PF !== '') {
        if(i === 0){
          await this.UFService.generateStaticFiles(keys,screensNames)
        }        
        await this.UFService.generateScreenSpecificFiles(keys)
          
          

        } else if (screenDetails[i].UF !== '') {
          if(i === 0){
            await this.UFService.generateStaticFiles(defKeys,screensNames)
          }        
          await this.UFService.generateScreenSpecificFiles(defKeys)
        }
      
    }
    // return cgDataArray
    return 'Code Generation Completed';
  }
}
