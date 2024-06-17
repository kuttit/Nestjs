import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtServices } from 'src/jwt.services';
import { RedisService } from 'src/redisService';

@Injectable()
export class securityGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtServices,
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

    const uniqueRoleName = new Set();
    const key = request.body.key;
    const keyParts: string[] = key.split(':');
    const tenantName: string = keyParts[0];
    const appGroupName: string = keyParts[1];
    const appName: string = keyParts[2];
    const fabricType: string = keyParts[3];
    let userMatrixJson: any = structuredClone(
      JSON.parse(
        await this.redisService.getJsonData('SecurityJSON:' + tenantName),
      ),
    );

    for (let i = 0; i < userMatrixJson.appGroupDetails.length; i++) {
      if (userMatrixJson.appGroupDetails[i].appGroupName === appGroupName) {
        for (
          let j = 0;
          j < userMatrixJson.appGroupDetails[i].appDetails.length;
          j++
        ) {
          if (
            userMatrixJson.appGroupDetails[i].appDetails[j].appName === appName
          ) {
            for (
              let k = 0;
              k <
              userMatrixJson.appGroupDetails[i].appDetails[j].rolePolicyDetails
                .length;
              k++
            ) {
              for (
                let l = 0;
                l <
                userMatrixJson.appGroupDetails[i].appDetails[j]
                  .rolePolicyDetails[k].DFpolicy.length;
                l++
              ) {
                if (
                  userMatrixJson.appGroupDetails[i].appDetails[j]
                    .rolePolicyDetails[k].DFpolicy[l].resourceType === 'CG'
                ) {
                  uniqueRoleName.add(
                    userMatrixJson.appGroupDetails[i].appDetails[j]
                      .rolePolicyDetails[k].roleName,
                  );
                }
              }
            }
          }
        }
      }
    }

    for (let i = 0; i < userRoles.length; i++) {
      if (uniqueRoleName.has(userRoles[i])) {
        for (let i = 0; i < userMatrixJson.appGroupDetails.length; i++) {
          if (userMatrixJson.appGroupDetails[i].appGroupName === appGroupName) {
            for (
              let j = 0;
              j < userMatrixJson.appGroupDetails[i].appDetails.length;
              j++
            ) {
              if (
                userMatrixJson.appGroupDetails[i].appDetails[j].appName ===
                appName
              ) {
                for (
                  let k = 0;
                  k <
                  userMatrixJson.appGroupDetails[i].appDetails[j]
                    .rolePolicyDetails.length;
                  k++
                ) {
                  if (
                    userMatrixJson.appGroupDetails[i].appDetails[j]
                      .rolePolicyDetails[k].DFpolicy.length !== 0 &&
                    fabricType === 'DF'
                  ) {
                    for (
                      let l = 0;
                      l <
                      userMatrixJson.appGroupDetails[i].appDetails[j]
                        .rolePolicyDetails[k].DFpolicy.length;
                      l++
                    ) {
                      if (
                        userMatrixJson.appGroupDetails[i].appDetails[j]
                          .rolePolicyDetails[k].DFpolicy[l].resourceType ===
                        'CG'
                      ) {
                        if (
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].DFpolicy[l].SIFlag === 'A' &&
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].DFpolicy[l]
                            .actionAllowed[0] === 'Y'
                        ) {
                          return true;
                        }

                        if (
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].DFpolicy[l].SIFlag === 'A' &&
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].DFpolicy[l]
                            .actionAllowed[0] === 'N'
                        ) {
                          return false;
                        }

                        if (
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].DFpolicy[l].SIFlag === 'E' &&
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].DFpolicy[l]
                            .actionDenied[0] === 'Y'
                        ) {
                          return false;
                        }

                        if (
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].DFpolicy[l].SIFlag === 'E' &&
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].DFpolicy[l]
                            .actionDenied[0] === 'N'
                        ) {
                          return true;
                        }
                      }
                    }
                  }
                  if (
                    userMatrixJson.appGroupDetails[i].appDetails[j]
                      .rolePolicyDetails[k].UFpolicy.length !== 0 &&
                    fabricType === 'UF'
                  ) {
                    for (
                      let l = 0;
                      l <
                      userMatrixJson.appGroupDetails[i].appDetails[j]
                        .rolePolicyDetails[k].UFpolicy.length;
                      l++
                    ) {
                      if (
                        userMatrixJson.appGroupDetails[i].appDetails[j]
                          .rolePolicyDetails[k].UFpolicy[l].resourceType ===
                        'CG'
                      ) {
                        if (
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].UFpolicy[l].SIFlag === 'A' &&
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].UFpolicy[l]
                            .actionAllowed[0] === 'Y'
                        ) {
                          return true;
                        }

                        if (
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].UFpolicy[l].SIFlag === 'A' &&
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].UFpolicy[l]
                            .actionAllowed[0] === 'N'
                        ) {
                          return false;
                        }

                        if (
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].UFpolicy[l].SIFlag === 'E' &&
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].UFpolicy[l]
                            .actionDenied[0] === 'Y'
                        ) {
                          return false;
                        }

                        if (
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].UFpolicy[l].SIFlag === 'E' &&
                          userMatrixJson.appGroupDetails[i].appDetails[j]
                            .rolePolicyDetails[k].UFpolicy[l]
                            .actionDenied[0] === 'N'
                        ) {
                          return true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
