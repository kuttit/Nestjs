import { Injectable } from '@nestjs/common';
import { CgErApiSecurityService } from './cg-er-api-security/cg-er-api-security.service';
import { CgTorusComponentsService } from './cg-torus-components/cg-torus-components.service';
import { RedisService } from 'src/redisService';

@Injectable()
export class CgService {
  constructor(
    private readonly DFSevice: CgErApiSecurityService,
    private readonly UFService: CgTorusComponentsService,
    private readonly redisService: RedisService,
  ) {}
  async codeGeneration(key): Promise<any> {
    const assemblerKey: any = key;
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
            const event = value['uf'] ? value['uf']['events'] : ''
            screenDetails.push({
              menuGroup: menuGroup,
              screenName: key,
              DF: df,
              UF: uf,
              PF: pf,
              SF: sf,
              event: event[0]
            });
          });
        });
      });
    });

    
   let screensNames: string[] = [];
   for (let i = 0; i < screenDetails.length; i++) {
    screensNames.push(screenDetails[i].screenName);
    }
  // return screensName;
    for (let i = 0; i < screenDetails.length; i++) {

        if (screenDetails[i].DF !=='') {
            await this.DFSevice.generateApi(screenDetails[i].DF,screenDetails[i].SF);
        }
        if (screenDetails[i].UF !=='' && screenDetails[i].PF !=='') {
          await this.UFService.generateApi(screenDetails[i].UF,screenDetails,{pfkey:screenDetails[i].PF,eventKey:screenDetails[i].event,sfkey:screenDetails[i].SF},screensNames);
      }
        else if (screenDetails[i].UF !=='') {
            await this.UFService.generateApi(screenDetails[i].UF,screenDetails,'',screensNames);
        }
        
    }
    return 'Code Generation Completed';
  }
}
