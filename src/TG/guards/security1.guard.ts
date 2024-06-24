
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtServices } from 'src/jwt.services';
import { RedisService } from 'src/redisService';
import { TG_CommonService } from '../tg-common/tg-common.service';
import { CommonService } from 'src/commonService';

@Injectable()
export class securityGuard1 implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtServices,
    private readonly cgCommonSevice: TG_CommonService,

  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization.split(' ')[1];
    const decodedToken = this.jwtService.decodeToken(token);
    const roles = decodedToken.realm_access.roles;
    const userRoles: string[] = [];
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const userRole = role.split('-');
      if (userRole[1]) userRoles.push(userRole[1]);
    }

  
    const key = request.body.key;
    const keyParts: string[] = key.split(':');
    const tenantName: string = keyParts[0];
    const appGroupName: string = keyParts[1];
    const appName: string = keyParts[2];
    const fabricType: string = keyParts[3];

    

    let orpSecurity: any 

    /*---------------------- New Logic -----------------------------------------------------------*/
    const assemblerData: any = structuredClone(
      JSON.parse(await this.redisService.getJsonData(key)),
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
    // console.log(screenDetails, 'screenDetails');
    for (let i = 0; i < screenDetails.length; i++) {
      if (screenDetails[i].DF !=='' && screenDetails[i].UF !=='' && screenDetails[i].PF !=='' && screenDetails[i].SF !=='') {
        orpSecurity = await this.cgCommonSevice.getSecurityJson(screenDetails[i].SF,decodedToken);
        console.log(orpSecurity[0]);
        
        if (orpSecurity[0].portal) {
          for (let i = 0; i < orpSecurity[0].portal.length; i++) {
            
            if (orpSecurity[0].portal[i].resourceType === 'CG' && orpSecurity[0].portal[i].resource === key) {
              if (orpSecurity[0].portal[i].SIFlag === 'A' && orpSecurity[0].portal[i].actionAllowed.includes('Y')) {
                return true
              }
              else if(orpSecurity[0].portal[i].SIFlag === 'A' && orpSecurity[0].portal[i].actionAllowed.includes('N')){
                return false
              }else if(orpSecurity[0].portal[i].SIFlag === 'E' && orpSecurity[0].portal[i].actionDenied.includes('N')){
                return true
              }else if(orpSecurity[0].portal[i].SIFlag === 'E' && orpSecurity[0].portal[i].actionDenied.includes('Y')){
                return false
              }
            }
          }
        }
        return false
      }
    }
   
   
    
  }
}
