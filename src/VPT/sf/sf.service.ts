import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '../../redisService';

import { error } from 'console';

@Injectable()
export class SFService {
  constructor(private readonly redisService: RedisService) {}
  async getJson(
    applicationName,
    version,
    artifact,
    tenant,
    appGroup,
    fabrics,
  ): Promise<any> {
    try {
      let res = {};
      const nodes: Promise<any> = new Promise((resolve, reject) => {
        try {
          const node = this.readReddis(
            [tenant] +
              ':' +
              [appGroup] +
              ':' +
              [applicationName] +
              ':' +
              [fabrics] +
              ':' +
              [artifact] +
              ':' +
              [version] +
              ':' +
              'nodes',
          );
          resolve(node);
        } catch (error) {
          reject(error);
        }
      });

      const nodeEdges: Promise<any> = new Promise((resolve, reject) => {
        try {
          const nodeEdge = this.readReddis(
            [tenant] +
              ':' +
              [appGroup] +
              ':' +
              [applicationName] +
              ':' +
              [fabrics] +
              ':' +
              [artifact] +
              ':' +
              [version] +
              ':' +
              'nodeEdges',
          );
          resolve(nodeEdge);
        } catch (error) {
          reject(error);
        }
      });

      const nodeProperty: Promise<any> = new Promise((resolve, reject) => {
        try {
          const property = this.readReddis(
            [tenant] +
              ':' +
              [appGroup] +
              ':' +
              [applicationName] +
              ':' +
              [fabrics] +
              ':' +
              [artifact] +
              ':' +
              [version] +
              ':' +
              'nodeProperty',
          );
          resolve(property);
        } catch (error) {
          reject(error);
        }
      });

      const result = await Promise.all([nodes, nodeEdges, nodeProperty])
        .then((values) => {
          console.log('🚀 ~ AppService ~ values:', values);
          return values;
        })
        .catch((error) => {
          throw new BadRequestException(error);
        });

      console.log('🚀 ~ AppService ~ res:', result);
      res = {
        nodes: JSON.parse(result[0]),
        nodeEdges: JSON.parse(result[1]),
        nodeProperty: JSON.parse(result[2]),
      };
      console.log('🚀 ~ AppService ~ res:', res);
      return {
        status: 200,
        data: res,
      };
    } catch (error) {
      throw error;
    }

    // try {
    //   const res = await this.readReddis(tenant);
    //   const application = await JSON.parse(res);
    //   console.log('🚀 ~ AppService ~ application:', application);
    //   let applicationDetails = {};

    //   applicationDetails =
    //     application[tenant][appGroup][fabrics][applicationName][processFlow][
    //       version
    //     ];

    //   return { workflow: { ...applicationDetails } };
    // } catch (error) {
    //   throw error;
    // }
  }

  async deleteApplication(
    applicationName: any,
    tenant: any,
    appGroup,
    fabrics,
  ): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const application = await JSON.parse(res);
      console.log('application --->', application);
      if (application[tenant][appGroup][fabrics][applicationName]) {
        delete application[tenant][appGroup][fabrics][applicationName];
        await this.writeReddis(tenant, application);

        return { msg: 'Successfully Deleted', status: 200 };
      }
      return { msg: 'Application Not Found', status: 400 };
    } catch (error) {
      throw error;
    }
  }

  // async getApplicationList(tenant, appGroup, fabrics): Promise<any> {
  //   try {
  //     const res = await this.readReddis(tenant);
  //     const applications = await JSON.parse(res);
  //     console.log(applications, 'appllllll');
  //     const response = [];
  //     if (
  //       applications &&
  //       applications.hasOwnProperty(tenant) &&
  //       applications[tenant].hasOwnProperty(appGroup) &&
  //       applications[tenant][appGroup].hasOwnProperty(fabrics) &&
  //       applications[tenant][appGroup][fabrics] &&
  //       typeof applications === 'object' &&
  //       Object.keys(applications[tenant]?.[appGroup]?.[fabrics]).length
  //     ) {
  //       const applicationName = Object.keys(
  //         applications[tenant][appGroup][fabrics],
  //       );

  //       if (applicationName) {
  //         for (let application of applicationName) {
  //           const artifactName = Object.keys(
  //             applications[tenant][appGroup][fabrics][application],
  //           );
  //           const artifactsDetails = [];
  //           for (const artifact of artifactName) {
  //             const version = Object.keys(
  //               applications[tenant][appGroup][fabrics][application][artifact],
  //             );

  //             artifactsDetails.push({
  //               artifact: artifact,
  //               version: version,
  //             });
  //           }
  //           response.push({
  //             application: application,
  //             artifact: artifactsDetails,
  //           });
  //         }
  //       }
  //     }
  //     console.table(response);
  //     return response;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // async getFabrics(tenant, appGroup): Promise<any> {
  //   try {
  //     const res = await this.readReddis(tenant);
  //     const applications = await JSON.parse(res);
  //     console.log(applications, 'appllllll');
  //     const response = [];
  //     if (
  //       applications &&
  //       applications.hasOwnProperty(tenant) &&
  //       applications[tenant].hasOwnProperty(appGroup) &&
  //       typeof applications === 'object'
  //     ) {
  //       const fabricsList = Object.keys(applications[tenant][appGroup]);

  //       if (fabricsList) {
  //         for (let fabrics of fabricsList) {
  //           const applicationName = Object.keys(
  //             applications[tenant][appGroup][fabrics],
  //           );
  //           const applicationDetails = [];
  //           for (const application of applicationName) {
  //             applicationDetails.push(application);
  //           }
  //           response.push({
  //             fabrics: fabrics,
  //             applications: applicationDetails,
  //           });
  //         }
  //       }
  //     }

  //     return response;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // async getFlowList(tenant, appGroup, fabrics, applicationName): Promise<any> {
  //   try {
  //     const res = await this.readReddis(tenant);
  //     const applications = await JSON.parse(res);
  //     if (
  //       applications &&
  //       applications.hasOwnProperty(tenant) &&
  //       applications[tenant].hasOwnProperty(appGroup) &&
  //       applications[tenant][appGroup].hasOwnProperty(fabrics) &&
  //       applications[tenant][appGroup][fabrics] &&
  //       applications[tenant][appGroup][fabrics].hasOwnProperty(
  //         applicationName,
  //       ) &&
  //       typeof applications === 'object' &&
  //       Object.keys(applications[tenant]?.[appGroup]?.[fabrics]).length
  //     ) {
  //       const artifactName = Object.keys(
  //         applications[tenant][appGroup][fabrics][applicationName],
  //       );

  //       const artifactsDetails = [];
  //       for (const artifact of artifactName) {
  //         const version =
  //           applications[tenant][appGroup][fabrics][applicationName][artifact];

  //         artifactsDetails.push({
  //           artiFactsList: artifact,
  //           version: version,
  //         });
  //       }

  //       return artifactsDetails;
  //     }
  //     throw new BadRequestException('Application Not Found');
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async getAppGroup(tenant): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const application = await JSON.parse(res);
      const response = [];
      if (
        application &&
        application.hasOwnProperty(tenant) &&
        Object.keys(application[tenant]).length &&
        typeof application === 'object'
      ) {
        const appGroupList = Object.keys(application[tenant]);
        if (appGroupList) {
          for (let appGroup of appGroupList) {
            response.push(appGroup);
          }
        }
      }

      return {
        data: response,
        status: 200,
      };
    } catch (error) {
      throw error;
    }
  }

  async getApplication(tenant, appGroup): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      console.log(applications, 'appllllll');
      const response = [];
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        typeof applications === 'object'
      ) {
        const applicationList = Object.keys(applications[tenant][appGroup]);

        if (applicationList) {
          for (let application of applicationList) {
            response.push(application);
          }
        }
      }

      return {
        data: response,
        status: 200,
      };
    } catch (error) {
      throw error;
    }
  }

  async getFabrics(tenant, appGroup, applicationName): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      console.log(applications, 'appllllll');
      const response = [];
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        applications[tenant][appGroup].hasOwnProperty(applicationName) &&
        applications[tenant][appGroup][applicationName] &&
        typeof applications === 'object'
      ) {
        const fabricsList = Object.keys(
          applications[tenant][appGroup][applicationName],
        );

        if (fabricsList) {
          for (let fabrics of fabricsList) {
            response.push(fabrics);
          }
        }

        return {
          data: response,
          status: 200,
        };
      } else {
        return {
          data: [],
          status: 200,
        };
      }
    } catch (error) {
      throw error;
    }
  }
  async getArtifact(tenant, appGroup, fabrics, applicationName): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        applications[tenant][appGroup].hasOwnProperty(applicationName) &&
        applications[tenant][appGroup][applicationName] &&
        applications[tenant][appGroup][applicationName].hasOwnProperty(
          fabrics,
        ) &&
        typeof applications === 'object' &&
        Object.keys(applications[tenant]?.[appGroup]?.[applicationName]).length
      ) {
        const artifactName = Object.keys(
          applications[tenant][appGroup][applicationName][fabrics],
        );

        // const artifactsDetails = [];
        // for (const artifact of artifactName) {
        //   const version =
        //     applications[tenant][appGroup][applicationName][fabrics][artifact];

        //   artifactsDetails.push({
        //     artiFactsList: artifact,
        //     version: version,
        //   });
        // }

        return {
          status: 200,
          data: artifactName,
        };
      }
      throw new BadRequestException('Application Not Found');
    } catch (error) {
      throw error;
    }
  }

  async getVersion(
    tenant,
    appGroup,
    fabrics,
    applicationName,
    artifact,
  ): Promise<any> {
    try {
      const res = await this.readReddis(tenant);
      const applications = await JSON.parse(res);
      if (
        applications &&
        applications.hasOwnProperty(tenant) &&
        applications[tenant].hasOwnProperty(appGroup) &&
        applications[tenant][appGroup].hasOwnProperty(applicationName) &&
        applications[tenant][appGroup][applicationName] &&
        applications[tenant][appGroup][applicationName].hasOwnProperty(
          fabrics,
        ) &&
        applications[tenant][appGroup][applicationName][fabrics].hasOwnProperty(
          artifact,
        ) &&
        typeof applications === 'object' &&
        Object.keys(applications[tenant]?.[appGroup]?.[applicationName]).length
      ) {
        let version = [];

        if (
          Array.isArray(
            applications[tenant][appGroup][applicationName][fabrics][artifact],
          )
        ) {
          version =
            applications[tenant][appGroup][applicationName][fabrics][artifact];
        } else {
          version = Object.keys(
            applications[tenant][appGroup][applicationName][fabrics][artifact],
          );
        }
        return {
          status: 200,
          data: version,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getRedisAll(tenants) {
    let newObj = {};
    for (let index = 0; index < tenants.length; index++) {
      const element = tenants[index];
      const res = await this.readReddis(element);
      console.log('🚀 ~ AppService ~ getRedisAll ~ res:', res);
      let tenantJson: any = await JSON.parse(res);
      console.log(tenantJson, 'tenantJsontenantJsontenantJson');
      if (tenantJson && Object.keys(tenantJson).length > 0) {
        newObj = { ...newObj, ...tenantJson };
        console.log(tenantJson, 'hjhjhjhgh');
      }
    }

    return newObj;
  }

  // async getPathsAndCreateFolders(obj, currentPath = '', interator) {
  //   let paths = [];

  //   for (const key in obj) {
  //     if (obj.hasOwnProperty(key)) {
  //       const newPath = `${currentPath}/${key}`;
  //       paths.push(newPath);

  //       if (typeof obj[key] === 'object' && obj[key] !== null) {
  //         if (interator <= 6) {
  //           if (interator === 1 && fs.existsSync(`./${newPath}`)) {
  //             await fs.rmSync(`./${newPath}`, {
  //               recursive: true,
  //               force: true,
  //             });
  //           }
  //           fs.mkdirSync(`./${newPath}`);
  //           paths = paths.concat(
  //             await this.getPathsAndCreateFolders(
  //               obj[key],
  //               newPath,
  //               interator + 1,
  //             ),
  //           );
  //         } else {
  //           fs.writeFileSync(`./${newPath}.json`, JSON.stringify(obj[key]));
  //         }
  //       } else if (typeof obj[key] === 'string' && obj[key] !== null) {
  //         fs.writeFileSync(`./${newPath}.txt`, obj[key]);
  //       }
  //     }
  //   }
  //   return paths;
  // }

  async createRedisFiles(obj, currentPath = '', interator) {
    let path = [];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newPath = `${currentPath}:${key}`;
        path.push(newPath);

        if (typeof obj[key] == 'object' && obj[key] !== null) {
          if (interator <= 6) {
            path = path.concat(
              await this.createRedisFiles(obj[key], newPath, interator + 1),
            );
          } else {
            let arr = newPath.split(':');
            arr.shift();
            const kes = arr.join(':');
            console.log(kes, 'key');
            // await redis.call('JSON.SET', kes, '$', JSON.stringify(obj[key]));
          }
        }
      }
    }
  }

  // async syncToFolder(tenant: any): Promise<any> {
  //   let ten = save_options;

  //   let arr = [];
  //   ten.map((t) => {
  //     arr.push(t.tenant);
  //   });

  //   const tenants = [...arr];
  //   console.log(tenants, 'tenants');
  //   let tenantObjects = await this.getRedisAll(tenants);
  //   console.log('tenantObjects-->', tenantObjects);
  //   if (tenantObjects && Object.keys(tenantObjects).length) {
  //     let keys: any = await this.getPathsAndCreateFolders(tenantObjects, '', 1);
  //     console.log(keys, 'klklklkl');
  //     return tenantObjects;
  //   }
  // }

  async saveaWorkFlow(
    req: any,
    type: string,
    version: any,
    tenant: string,
    appGroup: string,
    fabrics: string,
  ): Promise<any> {
    try {
      console.log(req.flow, 'req.flow');

      let updateResult = {};
      let result = {};
      let nodeSPLid = [];
      let nodeProSPLid = [];

      let flowNodes = structuredClone(req.flow.nodes);
      let flowNodesProperty = structuredClone(req.flow.nodeProperty);
      let flowNodeEdges = req.flow.nodeEdges;
      if (Object.keys(flowNodes).length > 0) {
        flowNodes.forEach((element) => {
          nodeSPLid.push(element.id);
        });

        if (typeof flowNodesProperty === 'object') {
          Object.keys(flowNodesProperty).forEach((element) => {
            nodeProSPLid.push(element);
          });
        }

        nodeProSPLid.forEach((element) => {
          if (!nodeSPLid.includes(element)) {
            delete flowNodesProperty[element];
          }
        });
      }

      const summary = this.transformJSON(flowNodes);

      result = {
        nodes: flowNodes,
        nodeProperty: flowNodesProperty,
        nodeEdges: flowNodeEdges,
        summary: summary,
      };

      updateResult = {
        nodes: flowNodes,
        nodeProperty: flowNodesProperty,
        nodeEdges: flowNodeEdges,
        summary: summary,
      };

      console.log(updateResult, 'updateResult');
      console.log(result, 'result');

      if (type == 'create') {
        const res = await this.readReddis(tenant);
        let mainJson: object = await JSON.parse(res);
        let version = 'v1';
        if (mainJson) {
          if (!mainJson.hasOwnProperty(tenant)) {
            mainJson = { ...mainJson, [tenant]: {} };
          }
          if (!mainJson[tenant].hasOwnProperty(appGroup)) {
            mainJson[tenant] = { ...mainJson[tenant], [appGroup]: {} };
          }
          if (!mainJson[tenant][appGroup].hasOwnProperty(req.applicationName)) {
            mainJson[tenant][appGroup] = {
              ...mainJson[tenant][appGroup],
              [req.applicationName]: {},
            };
          }

          if (
            !mainJson[tenant][appGroup][req.applicationName].hasOwnProperty(
              fabrics,
            )
          ) {
            mainJson[tenant][appGroup][req.applicationName] = {
              ...mainJson[tenant][appGroup][req.applicationName],
              [fabrics]: {},
            };
          }
          if (
            !mainJson[tenant][appGroup][req.applicationName][
              fabrics
            ].hasOwnProperty(req.artifact)
          ) {
            mainJson[tenant][appGroup][req.applicationName][fabrics] = {
              ...mainJson[tenant][appGroup][req.applicationName][fabrics],
              [req.artifact]: {},
            };
          }

          if (
            mainJson[tenant][appGroup][req.applicationName][fabrics][
              req.artifact
            ].hasOwnProperty(version)
          ) {
            version = `v${
              Object.keys(
                mainJson[tenant][appGroup][req.applicationName][fabrics][
                  req.artifact
                ],
              ).length + 1
            }`;

            mainJson[tenant][appGroup][req.applicationName][fabrics][
              req.artifact
            ] = {
              ...mainJson[tenant][appGroup][req.applicationName][fabrics][
                req.artifact
              ],
              [version]: {},
            };
          } else {
            version = 'v1';
            mainJson[tenant][appGroup][req.applicationName][fabrics][
              req.artifact
            ] = {
              [version]: {},
            };
          }
        } else {
          mainJson = {
            [tenant]: {
              [appGroup]: {
                [req.applicationName]: {
                  [fabrics]: {
                    [req.artifact]: {
                      [version]: {},
                    },
                  },
                },
              },
            },
          };
        }
        await this.writeReddis(tenant, mainJson);

        Object.keys(result).map(async (key) => {
          await this.writeReddis(
            tenant +
              ':' +
              appGroup +
              ':' +
              req.applicationName +
              ':' +
              fabrics +
              ':' +
              req.artifact +
              ':' +
              version +
              ':' +
              key,
            result[key],
          );
        });
        const versions = Object.keys(
          mainJson[tenant][appGroup][req.applicationName][fabrics][
            req.artifact
          ],
        );

        return {
          msg: 'New Application Created',
          data: versions,
          status: 200,
        };
      }

      // if (type === 'create') {
      //   const res = await this.readReddis(tenant);
      //   const applications: object = await JSON.parse(res);
      //   if (
      //     applications &&
      //     applications.hasOwnProperty(tenant) &&
      //     applications[tenant].hasOwnProperty(appGroup) &&
      //     applications[tenant][appGroup].hasOwnProperty(req.applicationName) &&
      //     typeof applications === 'object' &&
      //     Object.keys(applications[tenant][appGroup][req.applicationName])
      //       .length
      //   ) {
      //     const application = { ...applications };

      //     if (
      //       application[tenant][appGroup][req.applicationName].hasOwnProperty(
      //         fabrics,
      //       )
      //     ) {
      //       let version: string;
      //       if (
      //         application[tenant][appGroup][req.applicationName][
      //           fabrics
      //         ].hasOwnProperty(req.artifact)
      //       ) {
      //         version = `v${
      //           Object.keys(
      //             applications[tenant][appGroup][req.applicationName][fabrics][
      //               req.artifact
      //             ],
      //           ).length + 1
      //         }`;
      //         applications[tenant][appGroup][req.applicationName][fabrics][
      //           req.artifact
      //         ] = [
      //           ...applications[tenant][appGroup][req.applicationName][fabrics][
      //             req.artifact
      //           ],
      //           version,
      //         ];

      //       } else {
      //         version = `v1`;
      //         applications[tenant][appGroup][req.applicationName][fabrics] = {
      //           ...applications[tenant][appGroup][req.applicationName][fabrics],
      //           [req.artifact]: {version},
      //         };

      //       }

      //       await this.writeReddis(tenant, application);

      //       Object.keys(result).map(async (key) => {
      //         await this.writeReddis(
      //           tenant +
      //             ':' +
      //             appGroup +
      //             ':' +
      //             req.applicationName +
      //             ':' +
      //             fabrics +
      //             ':' +
      //             req.artifact +
      //             ':' +
      //             version +
      //             ':' +
      //             key,
      //           result[key],
      //         );
      //       });

      //       const versions =
      //         application[tenant][appGroup][req.applicationName][fabrics][
      //           req.artifact
      //         ];

      //       const appw = structuredClone(application);

      //       // await this.createRedisFiles(appw, '', 1);
      //       return {
      //         msg: 'New Application Created',
      //         data: versions,
      //         status: 200,
      //       };
      //     }

      //     else {
      //       const version = `v1`;
      //       applications[tenant][appGroup][req.applicationName][fabrics] = {
      //         ...applications[tenant][appGroup][req.applicationName][fabrics],
      //         [req.artifact]: [version],
      //       };
      //       console.log(
      //         'application exists-->',
      //         JSON.stringify(application),
      //         tenant,
      //       );
      //       await this.writeReddis(tenant, application);
      //       Object.keys(result).map(async (key) => {
      //         await this.writeReddis(
      //           tenant +
      //             ':' +
      //             appGroup +
      //             ':' +
      //             req.applicationName +
      //             ':' +
      //             fabrics +
      //             ':' +
      //             req.artifact +
      //             ':' +
      //             version +
      //             ':' +
      //             key,
      //           result[key],
      //         );
      //       });

      //       const versions =
      //         application[tenant][appGroup][req.applicationName][fabrics][
      //           req.artifact
      //         ];

      //       // const appw = structuredClone(application);

      //       // await this.createRedisFiles(appw, '', 1);

      //       return {
      //         msg: 'New Version Created',
      //         data: versions,
      //         status: 200,
      //       };
      //     }
      //   }

      //   else {
      //     const res = await this.readReddis(tenant);
      //     let application = { ...(await JSON.parse(res)) };

      //     console.log(
      //       application,
      //       'outside',
      //       tenant,
      //       appGroup,
      //       fabrics,
      //       req.applicationName,
      //       req.artifact,
      //     );
      //     let appl = structuredClone(application);
      //     const version = `v1`;
      //     if (!appl.hasOwnProperty(tenant)) {
      //       appl = {
      //         ...appl,
      //         [tenant]: {},
      //       };
      //     }
      //     if (!appl[tenant].hasOwnProperty(appGroup)) {
      //       appl[tenant] = { ...appl[tenant], [appGroup]: {} };
      //     }
      //     if (!appl[tenant][appGroup].hasOwnProperty(req.applicationName)) {
      //       appl[tenant][appGroup] = {
      //         ...appl[tenant][appGroup],
      //         [req.applicationName]: {},
      //       };
      //     }

      //     if (
      //       !appl[tenant][appGroup][req.applicationName].hasOwnProperty(fabrics)
      //     ) {
      //       appl[tenant][appGroup][req.applicationName] = {
      //         ...appl[tenant][appGroup][req.applicationName],
      //         [fabrics]: {},
      //       };
      //     }

      //     appl[tenant][appGroup][req.applicationName][fabrics] = {
      //       ...appl[tenant][appGroup][req.applicationName][fabrics],
      //       [req.artifact]: [version],
      //     };
      //     Object.keys(result).map(async (key) => {
      //       await this.writeReddis(
      //         tenant +
      //           ':' +
      //           appGroup +
      //           ':' +
      //           req.applicationName +
      //           ':' +
      //           fabrics +
      //           ':' +
      //           req.artifact +
      //           ':' +
      //           version +
      //           ':' +
      //           key,
      //         result[key],
      //       );
      //     });
      //     console.log('application created-->', appl, tenant);
      //     await this.writeReddis(tenant, appl);
      //     // const appw = structuredClone(appl);

      //     // await this.createRedisFiles(appw, '', 1);
      //     const versions =
      //       appl[tenant][appGroup][req.applicationName][fabrics][req.artifact];

      //     return {
      //       msg: 'New Application Created',
      //       data: versions,
      //       status: 200,
      //     };
      //   }
      // }

      if (type === 'update') {
        const res = await this.readReddis(tenant);
        const applications: any = await JSON.parse(res);
        // console.log('redis-->', JSON.stringify(applications), tenant);
        const application = { ...applications };

        // applications[tenant][appGroup][fabrics][req.applicationName][
        //   req.artifact
        // ] = {
        //   ...applications[tenant][appGroup][fabrics][req.applicationName][
        //     req.artifact
        //   ],
        //   [version]: {
        //     ...applications[tenant][appGroup][fabrics][req.applicationName][
        //       req.artifact
        //     ][version],
        //     ...updateResult,
        //   },
        // };
        Object.keys(updateResult).map(async (key) => {
          await this.writeReddis(
            tenant +
              ':' +
              appGroup +
              ':' +
              req.applicationName +
              ':' +
              fabrics +
              ':' +
              req.artifact +
              ':' +
              version +
              ':' +
              key,
            updateResult[key],
          );
        });
        console.log(
          'application exists-->',
          JSON.stringify(application),
          tenant,
        );
        await this.writeReddis(tenant, application);
        // const appw = structuredClone(application);

        // await this.createRedisFiles(appw, '', 1);

        return { msg: `${version} Updated`, status: 201 };
      }
    } catch (error) {
      return error;
    }
  }

  async getDefaultVersion() {
    const res = await this.redisService.getJsonData('UF:defaultJson');
    if (res) {
      const parsedData = JSON.parse(res);
      const keys = Object.keys(parsedData);
      const lastKey = keys[keys.length - 1];
      return parsedData[lastKey];
    } else {
      return null;
    }
  }

  async tenantDetails() {
    try {
      // const saveOptions = save_options;
      return {};
    } catch (error) {
      throw error;
    }
  }

  async controlpolicy(nodeType: any) {
    try {
      // const configControlpolicy = config_controlpolicy;
      // const workflowControlpolicy = workflow_controlpolicy;
      // const configColorpolicy = config_colorpolicy;
      // const workflowColorpolicy = workflow_colorpolicy;

      return {};
    } catch (error) {
      throw error;
    }
  }

  async getpropertywindow(node) {
    try {
      // const property = propertyWindow.find((item) => item.node === node);
      // if (property) {
      //   return {
      //     propertyType: property.PropertyType,
      //     status: 200,
      //   };
      // } else {
      //   return {
      //     message: 'Node not found',
      //     status: 404,
      //   };
      // }
      return {};
    } catch (err) {
      throw err;
    }
  }

  async getUserRoleDetails(roleId) {
    try {
      // const READ_ONLY = read_only;
      // const ADMIN = admin;
      // const DEVELOPER = developer;
      // let response = null;
      // switch (roleId) {
      //   case READ_ONLY:
      //     response = { statusCode: 200, roleType: 'READ_ONLY' };
      //     break;
      //   case ADMIN:
      //     response = { statusCode: 200, roleType: 'ADMIN' };
      //     break;
      //   case DEVELOPER:
      //     response = { statusCode: 200, roleType: 'DEVELOPER' };
      //     break;
      //   default:
      //     response = { statusCode: 400, roleType: null };
      //     break;
      // }
      return {};
    } catch (error) {
      throw error;
    }
  }

  // createVersionFolder(req, version) {
  //   console.log('createVersionFolder');
  //   fs.mkdirSync(
  //     `${app_pfd_path}/${req.applicationName}/${req.artifact}/v${version}`,
  //     (err) => {
  //       // console.log(err);
  //     },
  //   );
  //   console.log('createVersionFolder-END');
  // }
  // createWorkFlow(req, folderVersion) {
  //   console.log('createWorkFlow');
  //   try {
  //     fs.writeFileSync(
  //       `${app_pfd_path}/${req.applicationName}/${req.artifact}/v${folderVersion}/artifact.json`,
  //       JSON.stringify(req.workFlow),
  //     );
  //   } catch (error) {
  //     return error;
  //   }
  //   console.log('createWorkFlow-END');
  // }
  // createConfiqureFile(req, folderVersion) {
  //   try {
  //     const keys = Object.keys(req.configuration);
  //     for (let configure of keys) {
  //       fs.writeFileSync(
  //         `${app_pfd_path}/${req.applicationName}/${req.artifact}/v${folderVersion}/${configure}.json`,
  //         JSON.stringify(req.configuration[configure]),
  //       );
  //     }
  //   } catch (error) {
  //     return error;
  //   }
  // }

  applicationDetails() {
    try {
      return {};
    } catch (error) {
      throw error;
    }
  }

  async readReddis(tenant): Promise<any> {
    return await this.redisService.getJsonData(tenant);
  }

  async writeReddis(key, json): Promise<any> {
    await this.redisService.setJsonData(key, JSON.stringify(json));
  }

  transformJSON(values) {
    const outputJSON = {
      orgGrp: [],
    };

    values
      .filter((node) => node.type === 'orgGrp')
      .map((orgGrp) => {
        outputJSON.orgGrp.push(createOrgGrp(orgGrp));
      });

    function createOrgGrp(orgGrp) {
      return {
        id: orgGrp.data?.id,
        orgGrpName: orgGrp.data?.label,
        orgGrpCode: orgGrp.data?.code,
        SIFlag: orgGrp.data.SIFlag,
        actionAllowed: orgGrp.data.actionAllowed,
        actionDenied: orgGrp.data.actionDenied,
        org: orgGrp.data?.children
          ? orgGrp.data.children.map((childId) => {
              const child = values.find((node) => node.id === childId);
              return createOrg(child);
            })
          : [],
      };
    }

    function createOrg(org) {
      return {
        id: org.data?.id,
        orgCode: org.data?.code,
        orgName: org.data?.label,
        roleGrp: org.data?.children
          ? org.data.children.map((childId) => {
              const child = values.find((node) => node.id === childId);
              return createRoleGrp(child);
            })
          : [],
      };
    }

    function createRoleGrp(roleGrp) {
      return {
        id: roleGrp.data?.id,
        roleGrpCode: roleGrp.data?.code,
        roleGrpName: roleGrp.data?.label,
        SIFlag: roleGrp.data.SIFlag,
        actionAllowed: roleGrp.data.actionAllowed,
        actionDenied: roleGrp.data.actionDenied,
        nodeType: 'roleGrp',
        roles: roleGrp.data?.children
          ? roleGrp.data.children.map((childId) => {
              const child = values.find((node) => node.id === childId);
              return createRole(child);
            })
          : [],
      };
    }

    function createRole(role) {
      return {
        id: role.data?.id,
        roleCode: role.data?.code,
        roleName: role.data?.label,
        psGrp: role.data?.children
          ? role.data.children.map((childId) => {
              const child = values.find((node) => node.id === childId);
              return createPsGrp(child);
            })
          : [],
      };
    }

    function createPsGrp(psGrp) {
      return {
        id: psGrp.data?.id,
        psGrpCode: psGrp.data?.code,
        psGrpName: psGrp.data?.label,
        SIFlag: psGrp.data?.SIFlag,
        actionAllowed: psGrp.data?.actionAllowed,
        actionDenied: psGrp.data?.actionDenied,
        ps: psGrp.data?.children
          ? psGrp.data.children.map((childId) => {
              const child = values.find((node) => node.id === childId);
              return createPs(child);
            })
          : [],
      };
    }

    function createPs(ps) {
      return {
        id: ps.data?.id,
        psCode: ps.data?.code,
        psName: ps.data?.label,
        pf: ps.data?.nodeProperty?.pf || [],
        df: ps.data?.nodeProperty?.df || [],
        uf: ps.data?.nodeProperty?.uf || [],
      };
    }

    return outputJSON;
  }

  // async getRedis(tenant) {
  //   const js = await redis.call('JSON.GET', tenant);

  //   return js;
  // }
}
